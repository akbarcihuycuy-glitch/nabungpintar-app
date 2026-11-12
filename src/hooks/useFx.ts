import { useState, useEffect, useCallback, useRef } from 'react';
import { CurrencyCode } from '../types/database';
import { SUPPORTED_CURRENCIES } from '../types/currency';
import { getFxRates, convertFromBaseIdr, convertToBaseIdr, FALLBACK_RATES } from '../services/fx';
import { formatCurrency } from '../utils/formatters';

const STORAGE_KEY_CURRENCY = 'np_display_currency';
const AUTO_REFRESH_INTERVAL_MS = 60 * 1000; // 60 seconds

export function useFx() {
  const [displayCurrency, setDisplayCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENCY);
      if (saved && saved in SUPPORTED_CURRENCIES) {
        return saved as CurrencyCode;
      }
    } catch {}
    return 'IDR';
  });

  const [rates, setRates] = useState<Record<CurrencyCode, number>>(FALLBACK_RATES);
  const [source, setSource] = useState<'live' | 'cache' | 'fallback'>('fallback');
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [secondsAgo, setSecondsAgo] = useState<number>(0);

  const fetchRates = useCallback(async (force: boolean = false) => {
    setIsLoading(true);
    try {
      const res = await getFxRates(force);
      setRates(res.rates);
      setSource(res.source);
      setLastUpdated(res.fetchedAt);
      setSecondsAgo(0);
    } catch {
      setSource('fallback');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchRates(false);
  }, [fetchRates]);

  // Auto-polling every 60 seconds while app is open
  useEffect(() => {
    const pollTimer = setInterval(() => {
      // Only poll if tab is visible to conserve bandwidth
      if (document.visibilityState === 'visible') {
        fetchRates(true);
      }
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => clearInterval(pollTimer);
  }, [fetchRates]);

  // Live seconds ticker updated every second
  useEffect(() => {
    const ticker = setInterval(() => {
      const elapsed = Math.max(0, Math.floor((Date.now() - lastUpdated) / 1000));
      setSecondsAgo(elapsed);
    }, 1000);

    return () => clearInterval(ticker);
  }, [lastUpdated]);

  const setDisplayCurrency = useCallback((currency: CurrencyCode) => {
    setDisplayCurrencyState(currency);
    try {
      localStorage.setItem(STORAGE_KEY_CURRENCY, currency);
    } catch {}
  }, []);

  /**
   * Converts base IDR value to the user's selected display currency and formats it
   */
  const formatMoney = useCallback(
    (
      amountInBaseIdr: number,
      options: { showSymbol?: boolean; absolute?: boolean } = {}
    ): string => {
      const converted = convertFromBaseIdr(amountInBaseIdr, displayCurrency, rates);
      return formatCurrency(converted, displayCurrency, options);
    },
    [displayCurrency, rates]
  );

  /**
   * Returns converted numeric value in display currency
   */
  const convertFromIdr = useCallback(
    (amountInBaseIdr: number): number => {
      return convertFromBaseIdr(amountInBaseIdr, displayCurrency, rates);
    },
    [displayCurrency, rates]
  );

  return {
    displayCurrency,
    setDisplayCurrency,
    rates,
    source,
    lastUpdated,
    secondsAgo,
    isLoading,
    refetch: () => fetchRates(true),
    formatMoney,
    convertFromIdr,
    currencyInfo: SUPPORTED_CURRENCIES[displayCurrency],
  };
}
