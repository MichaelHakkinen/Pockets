# 👛 Pockets — Architectural & Technical Context (`context.md`)

This document provides a comprehensive technical overview and contextual reference for the **Pockets** project. It details the architecture, design principles, data structures, component systems, interaction models, and development workflows.

---

## 1. Project Overview & Mission

**Pockets** is a modern, offline-first Progressive Web App (PWA) built with **React 19** and **Vite 8**. It implements an intuitive **envelope budgeting system** ("tiny wallets") combined with an automated **100% percentage-split allocation engine**. 

### Core Goals:
- **Zero-Based Budgeting Clarity**: Every dollar (or local currency unit) is assigned a purpose—either into a specific pocket or parked in the "Ready-to-Assign" buffer pool.
- **Automated Paycheck Split**: When incoming money arrives, users distribute it across their tiny envelopes in one tap according to customizable percentage allocation rules.
- **Frictionless Deductions**: Logging expenses takes seconds with quick-spend chips, custom merchant notes, and visual remaining balance previews.
- **Reversible Transactions**: All spending and deposits are logged into an audit trail with one-tap undo capability that automatically restores pocket balances.
- **Privacy & Offline Independence**: 100% client-side data persistence in browser `localStorage`. No external servers, logins, or tracking required.

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | React 19 (`react`, `react-dom`) | Modern component architecture, functional hooks, declarative UI |
| **Build Tool** | Vite 8 (`vite`, `@vitejs/plugin-react`) | Rapid HMR dev server and optimized production bundler |
| **Styling** | Pure Vanilla CSS (`App.css`, `index.css`) | Custom design system, CSS variables, glassmorphism, responsive shell |
| **Icons** | Lucide React (`lucide-react`) | Clean, consistent vector iconography |
| **Visual Effects** | Canvas Confetti (`canvas-confetti`) | Celebration animations on 100% budget balance and goal completions |
| **Audio Synthesizer**| Web Audio API (`src/utils/audio.js`) | Zero-asset synthetic procedural sound effects (taps, deposits, warnings) |
| **Haptics** | Web Vibration API (`src/utils/audio.js`) | Tactile micro-vibrations for mobile interactions |
| **PWA** | Service Worker (`public/sw.js`) + Web App Manifest | Full offline caching and native app installation on iOS & Android |
| **Linter** | Oxlint (`oxlint`) | Ultra-fast Rust-based JavaScript/JSX static analysis |

---

## 3. Directory & File Architecture

```
Pockets/
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions automated deployment to GitHub Pages
├── public/
│   ├── favicon.svg                 # App vector favicon
│   ├── icon-192.svg / icon-512.svg # PWA app icons for homescreen
│   ├── manifest.json               # Web App Manifest (standalone display, theme colors)
│   └── sw.js                       # Service Worker for offline asset caching
├── src/
│   ├── assets/
│   │   └── logo.svg                # Vector brand logo
│   ├── components/
│   │   ├── AnalyticsView.jsx       # Health metrics, category breakdown & spending charts
│   │   ├── CurrencyModal.jsx       # Dedicated multi-currency switcher & custom symbol picker
│   │   ├── IncomeModal.jsx         # Paycheck deposit modal into Ready-to-Assign funds
│   │   ├── PercentageRulesManager.jsx # Visual 100% split blueprint rule configuration
│   │   ├── PocketCard.jsx          # Individual tiny-wallet envelope card with progress bar
│   │   ├── PocketModal.jsx         # Create & edit pocket form (emoji, goal, category, color)
│   │   ├── PWAInstallBanner.jsx    # Floating install guide & prompt banner for mobile devices
│   │   ├── SettingsView.jsx        # Preferences (currency, sound, haptics, cycle, data reset)
│   │   ├── SpendModal.jsx          # Log spending deduction from selected pocket
│   │   ├── SplitMoneyModal.jsx     # Multi-slider money distribution wizard (auto-balance to 100%)
│   │   ├── TransactionsView.jsx    # Audit log of expenses/deposits with one-tap Undo
│   │   └── TransferModal.jsx       # Inter-pocket and pool-to-pocket fund reallocation
│   ├── hooks/
│   │   └── useModalFocus.js        # Focus trap, backdrop protection, scroll lock & nudge hook
│   ├── utils/
│   │   ├── audio.js                # Web Audio synthesizer & mobile haptic vibration triggers
│   │   ├── currencies.js           # Currency registry, formatting rules, space & symbol configs
│   │   └── storage.js              # LocalStorage persistence, default schemas & math helpers
│   ├── App.css                     # Primary stylesheet, theme variables, layout & animations
│   ├── App.jsx                     # Root application state orchestrator & view router
│   ├── index.css                   # Global base reset, typography & animation keyframes
│   └── main.jsx                    # Application bootstrapping entrypoint
├── index.html                      # HTML5 shell with PWA meta tags & apple-touch-icon
├── package.json                    # Dependencies, metadata & build scripts
├── README.md                       # Project user documentation
└── vite.config.js                  # Vite configuration with React plugin
```

---

## 4. Modal Pop-Up & Focus System (`useModalFocus`)

All modal dialogs (`PocketModal`, `SpendModal`, `SplitMoneyModal`, `TransferModal`, `CurrencyModal`, `IncomeModal`) adhere to a unified, accessible modal interaction standard managed by `useModalFocus.js`:

### 1. Frosted Background Blur & Dimming
- When any modal opens, the backdrop applies `backdrop-filter: blur(8px)` and `-webkit-backdrop-filter: blur(8px)`.
- Background tint uses a deep translucent navy/slate overlay (`rgba(7, 10, 19, 0.75)`).
- `body.modal-open` is automatically added to `document.body`, setting `overflow: hidden !important; touch-action: none;` to lock background scrolling on desktop and mobile touch devices.
- All background elements outside `.modal-backdrop` have `pointer-events: none` and `user-select: none` to prevent any accidental background hover, focus, or click interactions.

### 2. Accidental Dismissal Protection
- Clicks outside the pop-up on the blurred backdrop **do not** close the modal.
- Clicking the backdrop triggers an **Attention Nudge** animation (`.attention-nudge` / `@keyframes modalAttentionNudge`) with a subtle scale pulse (`scale(1.018)`), glowing border ring (`rgba(99, 102, 241, 0.5)`), and a light haptic vibration.
- This immediately communicates to the user that their active focus is on the pop-up, preventing loss of partially entered form inputs.
- Modals can be deliberately closed via their dedicated **'✕' close button**, **Cancel** button, or by pressing the **Escape** key.

### 3. Keyboard Accessibility & Focus Trapping
- Keyboard `Tab` and `Shift + Tab` navigation is constrained within the active modal's focusable controls, preventing focus from escaping into hidden background elements.
- The `Escape` key automatically invokes `onClose()`.

---

## 5. State Management & Data Schema

State is maintained in root `App.jsx` and continuously synchronized to `localStorage` under the key `pockets_app_state_v1`.

### Data Shape:
```typescript
interface AppState {
  pockets: Pocket[];
  unallocatedFunds: number;       // Ready-to-assign pool balance
  transactions: Transaction[];   // Audit history log
  currency: string;              // Current currency symbol, e.g. "$", "€", "IDR", "Rp"
  soundEnabled: boolean;         // Audio feedback toggle
  hapticsEnabled: boolean;       // Mobile vibration toggle
  cycleType: 'Monthly' | 'Bi-Weekly' | 'Weekly'; // Budget cycle timeframe
}

interface Pocket {
  id: string;                    // Unique identifier (e.g. "pkt-1", "pkt-1718290192")
  name: string;                  // Envelope name (e.g. "Groceries & Supplies")
  emoji: string;                 // Icon representation
  target: number;                // Target budget amount
  balance: number;               // Current remaining funds
  spent: number;                 // Accumulated expenditure during this cycle
  percentage: number;            // Percentage share of the 100% split blueprint
  category: string;              // Category tag (Needs, Wants, Savings, Bills, Investments)
  color: string;                 // Color swatch theme token (emerald, violet, cyan, amber, etc.)
  note?: string;                 // Optional description or merchant note
}

interface Transaction {
  id: string;                    // e.g. "tx-17182902910"
  pocketId: string;              // Associated pocket id or "unallocated"
  pocketName: string;            // Human-readable snapshot of pocket name
  amount: number;                // Transaction amount
  note: string;                  // Merchant or purpose description
  date: string;                  // ISO 8601 timestamp
  type: 'spend' | 'deposit' | 'transfer';
  category: string;
}
```

---

## 6. Multi-Currency Engine (`src/utils/currencies.js`)

Pockets features an extensive global currency configuration supporting both standard western currencies and high-denomination global currencies:

- **Supported Currencies**: `$` (USD), `€` (EUR), `£` (GBP), `¥` (JPY), `Rp` (IDR), `C$` (CAD), `A$` (AUD), `CHF` (CHF), `S$` (SGD), `₹` (INR), `RM` (MYR), `₱` (PHP), `฿` (THB), `₫` (VND), `R$` (BRL), `R` (ZAR), plus custom user symbols.
- **Formatting Logic**:
  - `hasSpace`: Automatically inserts a non-breaking space between the symbol and amount when appropriate (e.g. `Rp 500,000` or `1,500 CHF`).
  - `decimals`: Configures decimal precision (`0` for IDR, JPY, VND; `2` for USD, EUR, GBP).
  - `quickSpend` & `quickDeposit`: Localized preset chip amounts tailored to the selected currency's real-world purchasing power.
  - `formatCompactNumber`: Human-readable abbreviations (e.g. `1.5M`, `500k`, `2.5k`).

---

## 7. Audio & Haptic Synthesizer (`src/utils/audio.js`)

To keep bundle size minimal and avoid loading external audio files:
- **Zero Assets**: Employs the browser's native `AudioContext` and `OscillatorNode`.
- **Sound Presets**:
  - `playTap()`: 800Hz micro-chirp (30ms) for buttons and tabs.
  - `playSuccess()`: Ascending two-tone triad (523Hz ➔ 659Hz ➔ 784Hz) for completions and confetti triggers.
  - `playDeposit()`: Cash register bell imitation (880Hz ringing decay).
  - `playWarning()`: Low square-wave thud (220Hz ➔ 160Hz) for delete confirmations and invalid balances.
- **Haptic Feedback**: Safely invokes `navigator.vibrate([10])` (light), `[25]` (medium), and `[40, 30, 40]` (warning).

---

## 8. Development & Build Scripts

In PowerShell on Windows, invoke scripts using `npm.cmd`:

```bash
# Start local development server (default port: 5173)
npm.cmd run dev

# Compile production bundle to /dist
npm.cmd run build

# Preview production build locally
npm.cmd run preview

# Run Oxlint static code analysis
npm.cmd run lint
```

---

## 9. Recent Updates & Changelog

- **Modal Backdrop Blur**: Implemented `backdrop-filter: blur(8px)` with dark slate tint across all pop-ups.
- **Background Interaction Lock**: Added `body.modal-open` scroll-locking and disabled pointer events on background content when a pop-up is active.
- **Backdrop Protection & Attention Nudge**: Disabled accidental backdrop dismissal; clicking the background now triggers a subtle attention pulse and haptic cue while keeping the pop-up open.
- **Component Modularization**: Extracted `IncomeModal.jsx` and created `useModalFocus.js` hook for clean, standardized modal behavior.
- **Currency Expansion**: Added high-denomination currencies with custom denomination chip arrays.
