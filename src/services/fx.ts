import { CurrencyCode } from '../types/database';
import { SUPPORTED_CURRENCIES } from '../types/currency';

const FX_CACHE_KEY = 'np_fx_v3_usd_base';
const CACHE_TTL_MS = 60 * 1000; // 60 seconds auto-refresh interval

export interface FxRateResult {
  rates: Record<CurrencyCode, number>; // Value of 1 foreign unit in IDR (e.g. 1 USD = 18167 IDR)
  fetchedAt: number;
  source: 'live' | 'cache' | 'fallback';
}

export const FALLBACK_RATES: Record<CurrencyCode, number> = {
  IDR: 1,
  USD: 16250,
  SGD: 12100,
  MYR: 3650,
  EUR: 17500,
  JPY: 105,
};

export async function getFxRates(force: boolean = false): Promise<FxRateResult> {
  const cachedRaw = localStorage.getItem(FX_CACHE_KEY);
  let cached: { rates: Record<CurrencyCode, number>; fetchedAt: number } | null = null;
  if (cachedRaw) {
    try {
      cached = JSON.parse(cachedRaw);
    } catch {
      cached = null;
    }
  }

  // Return fresh cache if within 60s and not forced
  if (!force && cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { ...cached, source: 'cache' };
  }

  // 1. Try Primary: open.er-api.com with USD base
  // Formula per PRD & User instructions: kurs_X_ke_IDR = rates.IDR / rates[X]
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Primary FX API returned HTTP ${res.status}`);
    const data = await res.json();
    if (data && data.result === 'success' && data.rates && data.rates.IDR) {
      const r = data.rates;
      const idrRate = Number(r.IDR);

      const freshRates: Record<CurrencyCode, number> = {
        IDR: 1,
        USD: Math.round(idrRate * 100) / 100,
        SGD: r.SGD ? Math.round((idrRate / Number(r.SGD)) * 100) / 100 : FALLBACK_RATES.SGD,
        MYR: r.MYR ? Math.round((idrRate / Number(r.MYR)) * 100) / 100 : FALLBACK_RATES.MYR,
        EUR: r.EUR ? Math.round((idrRate / Number(r.EUR)) * 100) / 100 : FALLBACK_RATES.EUR,
        JPY: r.JPY ? Math.round((idrRate / Number(r.JPY)) * 100) / 100 : FALLBACK_RATES.JPY,
      };

      const fetchedAt = Date.now();
      const fresh = { rates: freshRates, fetchedAt };
      try {
        localStorage.setItem(FX_CACHE_KEY, JSON.stringify(fresh));
      } catch {}
      return { ...fresh, source: 'live' };
    }
  } catch (err) {
    console.warn('Primary FX API (open.er-api.com) failed, trying fallback...', err);
  }

  // 2. Try Secondary Fallback: jsdelivr fawazahmed0 currency-api (USD base)
  try {
    const res = await fetch(
      'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) throw new Error(`Secondary FX API returned HTTP ${res.status}`);
    const data = await res.json();
    if (data && data.usd && data.usd.idr) {
      const u = data.usd;
      const idrRate = Number(u.idr);

      const freshRates: Record<CurrencyCode, number> = {
        IDR: 1,
        USD: Math.round(idrRate * 100) / 100,
        SGD: u.sgd ? Math.round((idrRate / Number(u.sgd)) * 100) / 100 : FALLBACK_RATES.SGD,
        MYR: u.myr ? Math.round((idrRate / Number(u.myr)) * 100) / 100 : FALLBACK_RATES.MYR,
        EUR: u.eur ? Math.round((idrRate / Number(u.eur)) * 100) / 100 : FALLBACK_RATES.EUR,
        JPY: u.jpy ? Math.round((idrRate / Number(u.jpy)) * 100) / 100 : FALLBACK_RATES.JPY,
      };

      const fetchedAt = Date.now();
      const fresh = { rates: freshRates, fetchedAt };
      try {
        localStorage.setItem(FX_CACHE_KEY, JSON.stringify(fresh));
      } catch {}
      return { ...fresh, source: 'live' };
    }
  } catch (err) {
    console.warn('Secondary FX API also failed:', err);
  }

  // 3. Fallback to stale cache if available
  if (cached) {
    return { ...cached, source: 'cache' };
  }

  // 4. Fallback to hardcoded offline rates
  return {
    rates: FALLBACK_RATES,
    fetchedAt: Date.now(),
    source: 'fallback',
  };
}

/**
 * Convert original amount in foreign currency to base IDR
 * Section 3.7: amount_base (IDR) = ROUND(amount_original * fx_rate_to_idr)
 */
export function convertToBaseIdr(
  amountOriginal: number,
  currency: CurrencyCode,
  rates: Record<CurrencyCode, number>
): { amountBase: number; rateUsed: number } {
  if (currency === 'IDR') {
    return { amountBase: Math.round(amountOriginal), rateUsed: 1 };
  }
  const rate = rates[currency] || SUPPORTED_CURRENCIES[currency].defaultRateToIdr;
  const amountBase = Math.round(amountOriginal * rate);
  return { amountBase, rateUsed: rate };
}

/**
 * Convert base IDR to target display currency
 * Section 3.7: nilai_tampil = amount_base / kurs_IDR_per_mata_uang_tampil
 */
export function convertFromBaseIdr(
  amountBase: number,
  targetCurrency: CurrencyCode,
  rates: Record<CurrencyCode, number>
): number {
  if (targetCurrency === 'IDR') return amountBase;
  const rate = rates[targetCurrency] || SUPPORTED_CURRENCIES[targetCurrency].defaultRateToIdr;
  return amountBase / rate;
}
