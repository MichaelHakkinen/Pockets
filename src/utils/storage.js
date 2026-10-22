import { getCurrencyConfig } from './currencies';

export const POCKET_COLORS = [
  { id: 'emerald', name: 'Sage Green', bg: '#10b981', text: '#34d399', glow: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)' },
  { id: 'cyan', name: 'Ice Teal', bg: '#06b6d4', text: '#22d3ee', glow: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.25)' },
  { id: 'blue', name: 'Nordic Slate', bg: '#3b82f6', text: '#60a5fa', glow: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.25)' },
  { id: 'indigo', name: 'Dusk Indigo', bg: '#6366f1', text: '#818cf8', glow: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.25)' },
  { id: 'amber', name: 'Warm Ochre', bg: '#f59e0b', text: '#fbbf24', glow: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)' },
  { id: 'rose', name: 'Muted Rose', bg: '#f43f5e', text: '#fb7185', glow: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.25)' },
  { id: 'purple', name: 'Muted Iris', bg: '#a855f7', text: '#c084fc', glow: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.25)' },
  { id: 'slate', name: 'Titanium', bg: '#64748b', text: '#94a3b8', glow: 'rgba(100, 116, 139, 0.12)', border: 'rgba(100, 116, 139, 0.25)' },
];

export const INITIAL_POCKETS = [
  {
    id: 'pkt-1',
    name: 'Groceries & Food',
    emoji: '🛒',
    color: 'emerald',
    target: 450,
    balance: 285.50,
    spent: 164.50,
    percentage: 25,
    category: 'Needs',
    note: 'Supermarket and weekly supplies'
  },
  {
    id: 'pkt-2',
    name: 'Dining & Coffee',
    emoji: '☕',
    color: 'amber',
    target: 200,
    balance: 62.00,
    spent: 138.00,
    percentage: 10,
    category: 'Wants',
    note: 'Cafes, takeout, dining with friends'
  },
  {
    id: 'pkt-3',
    name: 'Utilities & Bills',
    emoji: '⚡',
    color: 'cyan',
    target: 320,
    balance: 320.00,
    spent: 0.00,
    percentage: 20,
    category: 'Needs',
    note: 'Electric, internet, mobile plan'
  },
  {
    id: 'pkt-4',
    name: 'Fun & Entertainment',
    emoji: '🎬',
    color: 'purple',
    target: 150,
    balance: 35.00,
    spent: 115.00,
    percentage: 10,
    category: 'Wants',
    note: 'Cinema, gaming, subscriptions'
  },
  {
    id: 'pkt-5',
    name: 'Transit & Fuel',
    emoji: '🚗',
    color: 'blue',
    target: 180,
    balance: 110.00,
    spent: 70.00,
    percentage: 15,
    category: 'Needs',
    note: 'Metro card & petrol'
  },
  {
    id: 'pkt-6',
    name: 'Emergency Savings',
    emoji: '🛡️',
    color: 'indigo',
    target: 800,
    balance: 650.00,
    spent: 0.00,
    percentage: 20,
    category: 'Savings',
    note: 'Rainy day buffer fund'
  }
];

export const INITIAL_TRANSACTIONS = [
  {
    id: 'tx-1',
    pocketId: 'pkt-2',
    pocketName: 'Dining & Coffee',
    amount: 14.50,
    type: 'spend',
    note: 'Blue Bottle Espresso & Pastry',
    date: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    category: 'Wants'
  },
  {
    id: 'tx-2',
    pocketId: 'pkt-1',
    pocketName: 'Groceries & Food',
    amount: 68.20,
    type: 'spend',
    note: 'Trader Joe\'s Weekly Basket',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    category: 'Needs'
  },
  {
    id: 'tx-3',
    pocketId: 'pkt-4',
    pocketName: 'Fun & Entertainment',
    amount: 24.00,
    type: 'spend',
    note: 'Movie tickets IMAX',
    date: new Date(Date.now() - 1000 * 60 * 60 * 38).toISOString(),
    category: 'Wants'
  },
  {
    id: 'tx-4',
    pocketId: 'pkt-5',
    pocketName: 'Transit & Fuel',
    amount: 35.00,
    type: 'spend',
    note: 'Chevron Gas Station',
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    category: 'Needs'
  },
  {
    id: 'tx-5',
    pocketId: 'pkt-1',
    pocketName: 'Groceries & Food',
    amount: 96.30,
    type: 'spend',
    note: 'Organic Market & Meat',
    date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    category: 'Needs'
  }
];

export const STORAGE_KEY = 'pockets_budget_app_v2';

export function loadSavedState() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse saved state:', e);
    return null;
  }
}

export function saveState(state) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

export function formatMoney(amount, currency = '$') {
  const val = Number(amount) || 0;
  const cfg = getCurrencyConfig(currency);
  const space = cfg.hasSpace ? ' ' : '';
  const hasCents = Math.abs(val % 1) > 0.001;
  const digits = cfg.isZeroDecimal ? (hasCents ? 2 : 0) : 2;

  return `${currency}${space}${val.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })}`;
}

export function getTotalPercentage(pockets) {
  return pockets.reduce((sum, p) => sum + (Number(p.percentage) || 0), 0);
}

export function normalizePercentages(pockets) {
  const total = getTotalPercentage(pockets);
  if (total <= 0) {
    const even = Math.floor(100 / (pockets.length || 1));
    return pockets.map((p, idx) => ({
      ...p,
      percentage: idx === pockets.length - 1 ? 100 - (even * (pockets.length - 1)) : even
    }));
  }
  let running = 0;
  return pockets.map((p, idx) => {
    if (idx === pockets.length - 1) {
      return { ...p, percentage: Math.max(0, 100 - running) };
    }
    const scaled = Math.round(((Number(p.percentage) || 0) / total) * 100);
    running += scaled;
    return { ...p, percentage: scaled };
  });
}
