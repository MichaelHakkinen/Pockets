# 👛 Pockets - Money Management PWA

A Progressive Web App (PWA) for iOS and Android built with React and Vite. Pockets uses an intuitive **envelope budgeting & percentage split system** to divide incoming money into tiny wallets, track reductions/expenses from each budget, and maintain financial clarity.

![Pockets Preview](public/favicon.svg)

---

## ✨ Key Features

1. **100% Percentage Split Blueprint**:
   - Create a list of budget items/pockets (Groceries, Rent, Dining, Emergency, etc.).
   - Assign each item a percentage share (e.g. 25%, 20%, 15% = 100%).
   - Visual 100% multi-segment distribution bar with one-tap "Auto-Balance to 100%".
   - **Insert Money**: Enter any amount (e.g. $1,000 paycheck) and watch it automatically split across your tiny wallets based on their exact percentages!

2. **Tiny Wallet Budgeting**:
   - Each pocket has its own target budget, allocated balance, and spent tracker.
   - Dynamic health badges (`Healthy`, `Low < 20%`, and `Overspent`).
   - One-tap quick deductions (`-$5`, `-$10`, `-$25`, `-$50`, or custom amount) with merchant notes.
   - Live balance preview showing remaining allowance before confirming deductions.

3. **Inter-Pocket Transfers & Unallocated Pool**:
   - Move funds between pockets with zero friction.
   - Keep a buffer pool ("Ready to Assign") for extra cash.

4. **Insights & Transactions Audit Log**:
   - Envelope Budget Health Score (0–100%) and category breakdown (Needs vs. Wants vs. Savings).
   - Searchable, filterable transaction history with one-tap **Undo/Delete** that automatically restores deducted money to its pocket.

5. **Progressive Web App (iOS & Android)**:
   - Installable to home screen on iOS (Safari: Share ➔ Add to Home Screen) and Android (Chrome: Install App).
   - Works 100% offline via Service Worker caching.
   - Data persists privately in local storage.
   - Tactile audio clicks and mobile haptic vibrations.

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Open in your browser
http://localhost:5173
```

---

## 🌐 GitHub Pages Deployment

This repository includes a pre-configured GitHub Actions workflow in `.github/workflows/deploy.yml`.

### Setting up GitHub Pages:

1. Push your code to your repository:
   ```bash
   git add .
   git commit -m "Initial commit for Pockets PWA"
   git branch -M main
   git remote add origin https://github.com/MichaelHakkinen/Pockets.git
   git push -u origin main
   ```

2. In your GitHub repository:
   - Go to **Settings** ➔ **Pages** (under "Code and automation").
   - Under **Build and deployment** ➔ **Source**, select **GitHub Actions**.

3. That's it! GitHub will automatically build and deploy your PWA to:
   👉 `https://MichaelHakkinen.github.io/Pockets/`
