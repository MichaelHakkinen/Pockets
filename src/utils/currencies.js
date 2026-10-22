/**
 * Currency configuration & formatting helpers for Pockets PWA
 */

export const POPULAR_CURRENCIES = [
  { 
    code: 'Rp', 
    iso: 'IDR',
    symbol: 'Rp', 
    name: 'Indonesian Rupiah', 
    label: 'IDR - Indonesian Rupiah (Rp)',
    flag: '🇮🇩',
    isZeroDecimal: true, 
    hasSpace: true,
    quickSpend: [10000, 25000, 50000, 100000],
    quickDeposit: [100000, 250000, 500000, 1000000]
  },
  { 
    code: '$', 
    iso: 'USD',
    symbol: '$', 
    name: 'US Dollar', 
    label: 'USD - US Dollar ($)',
    flag: '🇺🇸',
    isZeroDecimal: false, 
    hasSpace: false,
    quickSpend: [5, 10, 20, 50],
    quickDeposit: [50, 100, 250, 500]
  },
  { 
    code: '€', 
    iso: 'EUR',
    symbol: '€', 
    name: 'Euro', 
    label: 'EUR - Euro (€)',
    flag: '🇪🇺',
    isZeroDecimal: false, 
    hasSpace: false,
    quickSpend: [5, 10, 20, 50],
    quickDeposit: [50, 100, 250, 500]
  },
  { 
    code: '£', 
    iso: 'GBP',
    symbol: '£', 
    name: 'British Pound', 
    label: 'GBP - British Pound (£)',
    flag: '🇬🇧',
    isZeroDecimal: false, 
    hasSpace: false,
    quickSpend: [5, 10, 20, 50],
    quickDeposit: [50, 100, 250, 500]
  },
  { 
    code: '¥', 
    iso: 'JPY',
    symbol: '¥', 
    name: 'Japanese Yen', 
    label: 'JPY - Japanese Yen (¥)',
    flag: '🇯🇵',
    isZeroDecimal: true, 
    hasSpace: false,
    quickSpend: [500, 1000, 2000, 5000],
    quickDeposit: [5000, 10000, 25000, 50000]
  },
  { 
    code: 'S$', 
    iso: 'SGD',
    symbol: 'S$', 
    name: 'Singapore Dollar', 
    label: 'SGD - Singapore Dollar (S$)',
    flag: '🇸🇬',
    isZeroDecimal: false, 
    hasSpace: false,
    quickSpend: [5, 10, 20, 50],
    quickDeposit: [50, 100, 250, 500]
  },
  { 
    code: 'RM', 
    iso: 'MYR',
    symbol: 'RM', 
    name: 'Malaysian Ringgit', 
    label: 'MYR - Malaysian Ringgit (RM)',
    flag: '🇲🇾',
    isZeroDecimal: false, 
    hasSpace: true,
    quickSpend: [10, 20, 50, 100],
    quickDeposit: [50, 100, 250, 500]
  },
  { 
    code: 'A$', 
    iso: 'AUD',
    symbol: 'A$', 
    name: 'Australian Dollar', 
    label: 'AUD - Australian Dollar (A$)',
    flag: '🇦🇺',
    isZeroDecimal: false, 
    hasSpace: false,
    quickSpend: [5, 10, 20, 50],
    quickDeposit: [50, 100, 250, 500]
  },
  { 
    code: 'C$', 
    iso: 'CAD',
    symbol: 'C$', 
    name: 'Canadian Dollar', 
    label: 'CAD - Canadian Dollar (C$)',
    flag: '🇨🇦',
    isZeroDecimal: false, 
    hasSpace: false,
    quickSpend: [5, 10, 20, 50],
    quickDeposit: [50, 100, 250, 500]
  },
  { 
    code: '₹', 
    iso: 'INR',
    symbol: '₹', 
    name: 'Indian Rupee', 
    label: 'INR - Indian Rupee (₹)',
    flag: '🇮🇳',
    isZeroDecimal: false, 
    hasSpace: false,
    quickSpend: [50, 100, 200, 500],
    quickDeposit: [500, 1000, 2500, 5000]
  },
  { 
    code: '₱', 
    iso: 'PHP',
    symbol: '₱', 
    name: 'Philippine Peso', 
    label: 'PHP - Philippine Peso (₱)',
    flag: '🇵🇭',
    isZeroDecimal: false, 
    hasSpace: false,
    quickSpend: [50, 100, 200, 500],
    quickDeposit: [500, 1000, 2500, 5000]
  },
  { 
    code: '₩', 
    iso: 'KRW',
    symbol: '₩', 
    name: 'South Korean Won', 
    label: 'KRW - South Korean Won (₩)',
    flag: '🇰🇷',
    isZeroDecimal: true, 
    hasSpace: false,
    quickSpend: [5000, 10000, 20000, 50000],
    quickDeposit: [50000, 100000, 250000, 500000]
  },
  { 
    code: '฿', 
    iso: 'THB',
    symbol: '฿', 
    name: 'Thai Baht', 
    label: 'THB - Thai Baht (฿)',
    flag: '🇹🇭',
    isZeroDecimal: false, 
    hasSpace: false,
    quickSpend: [50, 100, 200, 500],
    quickDeposit: [500, 1000, 2500, 5000]
  },
  { 
    code: '₫', 
    iso: 'VND',
    symbol: '₫', 
    name: 'Vietnamese Dong', 
    label: 'VND - Vietnamese Dong (₫)',
    flag: '🇻🇳',
    isZeroDecimal: true, 
    hasSpace: true,
    quickSpend: [20000, 50000, 100000, 200000],
    quickDeposit: [200000, 500000, 1000000, 2000000]
  },
  { 
    code: 'R$', 
    iso: 'BRL',
    symbol: 'R$', 
    name: 'Brazilian Real', 
    label: 'BRL - Brazilian Real (R$)',
    flag: '🇧🇷',
    isZeroDecimal: false, 
    hasSpace: true,
    quickSpend: [10, 20, 50, 100],
    quickDeposit: [50, 100, 250, 500]
  },
  { 
    code: 'CHF', 
    iso: 'CHF',
    symbol: 'CHF', 
    name: 'Swiss Franc', 
    label: 'CHF - Swiss Franc (CHF)',
    flag: '🇨🇭',
    isZeroDecimal: false, 
    hasSpace: true,
    quickSpend: [5, 10, 20, 50],
    quickDeposit: [50, 100, 250, 500]
  },
  { 
    code: 'NZ$', 
    iso: 'NZD',
    symbol: 'NZ$', 
    name: 'New Zealand Dollar', 
    label: 'NZD - New Zealand Dollar (NZ$)',
    flag: '🇳🇿',
    isZeroDecimal: false, 
    hasSpace: false,
    quickSpend: [5, 10, 20, 50],
    quickDeposit: [50, 100, 250, 500]
  },
  { 
    code: 'HK$', 
    iso: 'HKD',
    symbol: 'HK$', 
    name: 'Hong Kong Dollar', 
    label: 'HKD - Hong Kong Dollar (HK$)',
    flag: '🇭🇰',
    isZeroDecimal: false, 
    hasSpace: false,
    quickSpend: [20, 50, 100, 200],
    quickDeposit: [100, 250, 500, 1000]
  },
  { 
    code: 'AED', 
    iso: 'AED',
    symbol: 'AED', 
    name: 'UAE Dirham', 
    label: 'AED - UAE Dirham (AED)',
    flag: '🇦🇪',
    isZeroDecimal: false, 
    hasSpace: true,
    quickSpend: [20, 50, 100, 200],
    quickDeposit: [100, 250, 500, 1000]
  },
  { 
    code: 'kr', 
    iso: 'SEK',
    symbol: 'kr', 
    name: 'Nordic Krone', 
    label: 'SEK/NOK/DKK - Krone (kr)',
    flag: '🇸🇪',
    isZeroDecimal: false, 
    hasSpace: true,
    quickSpend: [50, 100, 200, 500],
    quickDeposit: [200, 500, 1000, 2000]
  },
  { 
    code: 'zł', 
    iso: 'PLN',
    symbol: 'zł', 
    name: 'Polish Złoty', 
    label: 'PLN - Polish Złoty (zł)',
    flag: '🇵🇱',
    isZeroDecimal: false, 
    hasSpace: true,
    quickSpend: [10, 20, 50, 100],
    quickDeposit: [50, 100, 250, 500]
  },
  { 
    code: '₺', 
    iso: 'TRY',
    symbol: '₺', 
    name: 'Turkish Lira', 
    label: 'TRY - Turkish Lira (₺)',
    flag: '🇹🇷',
    isZeroDecimal: false, 
    hasSpace: false,
    quickSpend: [50, 100, 200, 500],
    quickDeposit: [200, 500, 1000, 2000]
  }
];

/**
 * Returns configuration for a currency code/symbol
 */
export function getCurrencyConfig(currencyCode = '$') {
  if (!currencyCode) currencyCode = '$';
  const clean = currencyCode.trim();
  
  const found = POPULAR_CURRENCIES.find(
    c => c.code.toLowerCase() === clean.toLowerCase() || 
         c.symbol.toLowerCase() === clean.toLowerCase() ||
         c.iso.toLowerCase() === clean.toLowerCase()
  );
  
  if (found) return found;

  // Custom fallback
  const isMultiChar = clean.length > 1;
  return {
    code: clean,
    iso: clean.toUpperCase(),
    symbol: clean,
    name: clean,
    label: `${clean} Currency`,
    flag: '🌐',
    isZeroDecimal: false,
    hasSpace: isMultiChar,
    quickSpend: [5, 10, 20, 50],
    quickDeposit: [50, 100, 250, 500]
  };
}

/**
 * Format compact chip label (e.g., 50000 -> "50k", 1000000 -> "1M")
 */
export function formatCompactNumber(num) {
  if (num >= 1000000) {
    const val = num / 1000000;
    return `${val % 1 === 0 ? val : val.toFixed(1)}M`;
  }
  if (num >= 1000) {
    const val = num / 1000;
    return `${val % 1 === 0 ? val : val.toFixed(0)}k`;
  }
  return num.toString();
}
