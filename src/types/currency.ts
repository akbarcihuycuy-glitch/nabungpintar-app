import { CurrencyCode } from './database';

export interface CurrencyInfo {
  code: CurrencyCode;
  name: string;
  symbol: string;
  flag: string;
  defaultRateToIdr: number;
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  IDR: {
    code: 'IDR',
    name: 'Rupiah Indonesia',
    symbol: 'Rp',
    flag: '🇮🇩',
    defaultRateToIdr: 1,
  },
  USD: {
    code: 'USD',
    name: 'Dolar Amerika Serikat',
    symbol: '$',
    flag: '🇺🇸',
    defaultRateToIdr: 16250,
  },
  SGD: {
    code: 'SGD',
    name: 'Dolar Singapura',
    symbol: 'S$',
    flag: '🇸🇬',
    defaultRateToIdr: 12100,
  },
  MYR: {
    code: 'MYR',
    name: 'Ringgit Malaysia',
    symbol: 'RM',
    flag: '🇲🇾',
    defaultRateToIdr: 3650,
  },
  EUR: {
    code: 'EUR',
    name: 'Euro Uni Eropa',
    symbol: '€',
    flag: '🇪🇺',
    defaultRateToIdr: 17500,
  },
  JPY: {
    code: 'JPY',
    name: 'Yen Jepang',
    symbol: '¥',
    flag: '🇯🇵',
    defaultRateToIdr: 105,
  },
};

