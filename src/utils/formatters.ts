import { CurrencyCode } from '../types/database';
import { SUPPORTED_CURRENCIES } from '../types/currency';

/**
 * Format currency amount based on base IDR value or foreign currency
 * Example IDR: "Rp 1.250.000"
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'IDR',
  options: { showSymbol?: boolean; absolute?: boolean } = {}
): string {
  const { showSymbol = true, absolute = false } = options;
  const num = absolute ? Math.abs(amount) : amount;

  if (currency === 'IDR') {
    const formatted = Math.round(num)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return showSymbol ? `Rp ${formatted}` : formatted;
  }

  const currencyInfo = SUPPORTED_CURRENCIES[currency];
  const symbol = currencyInfo ? currencyInfo.symbol : currency;

  try {
    const formatted = new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: currency === 'JPY' ? 0 : 2,
      maximumFractionDigits: currency === 'JPY' ? 0 : 2,
    }).format(num);

    return showSymbol ? `${symbol} ${formatted}` : formatted;
  } catch {
    return `${symbol} ${num.toFixed(2)}`;
  }
}

/**
 * Get current date string (YYYY-MM-DD) in Asia/Jakarta (WIB) timezone
 */
export function getWIBDate(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date); // outputs YYYY-MM-DD
}

/**
 * Format ISO date string into Indonesian short date: "28 Okt 2024"
 */
export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  const monthIdx = parseInt(month, 10) - 1;
  return `${parseInt(day, 10)} ${months[monthIdx] || month} ${year}`;
}

/**
 * Format date with human friendly relative label: "Hari ini", "Kemarin", or "28 Okt 2024"
 */
export function formatRelativeDate(dateStr: string): string {
  const todayWIB = getWIBDate();
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterdayWIB = getWIBDate(d);

  if (dateStr === todayWIB) return 'Hari ini';
  if (dateStr === yesterdayWIB) return 'Kemarin';
  return formatDateIndo(dateStr);
}

/**
 * Format percentage change with +/- prefix
 */
export function formatPercentage(val: number | null | 'Baru'): string {
  if (val === 'Baru') return 'Baru';
  if (val === null || val === undefined || isNaN(val)) return '-';
  const rounded = (Math.round(val * 10) / 10).toFixed(1);
  if (val > 0) return `+${rounded}%`;
  return `${rounded}%`;
}

