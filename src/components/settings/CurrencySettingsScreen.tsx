import React, { useState, useEffect, useMemo } from 'react';
import { CurrencyCode } from '../../types/database';
import { SUPPORTED_CURRENCIES } from '../../types/currency';
import { useFx } from '../../hooks/useFx';
import { formatCurrency } from '../../utils/formatters';

interface CurrencySettingsScreenProps {
  onBack?: () => void;
}

export const CurrencySettingsScreen: React.FC<CurrencySettingsScreenProps> = ({ onBack }) => {
  const {
    displayCurrency,
    setDisplayCurrency,
    rates,
    source,
    lastUpdated,
    secondsAgo,
    isLoading,
    refetch,
  } = useFx();

  const [searchQuery, setSearchQuery] = useState('');
  const [calcAmount, setCalcAmount] = useState('100');
  const [calcCurrency, setCalcCurrency] = useState<CurrencyCode>('USD');
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // Live WIB clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString('id-ID', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const currenciesList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return Object.values(SUPPORTED_CURRENCIES).filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Converter calculation
  const convertedToIdr = useMemo(() => {
    const amt = parseFloat(calcAmount) || 0;
    const rate = rates[calcCurrency] || SUPPORTED_CURRENCIES[calcCurrency].defaultRateToIdr;
    return amt * rate;
  }, [calcAmount, calcCurrency, rates]);

  return (
    <div className="flex flex-col w-full pb-28 space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              type="button"
              className="w-10 h-10 -ml-1 rounded-xl bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
          )}
          <div>
            <h1 className="text-lg font-bold text-on-surface">Mata Uang & Kurs Live</h1>
            <p className="text-[11px] text-outline">Konversi otomatis transaksi & saldo</p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isLoading}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-bright text-xs font-semibold text-primary transition-all active:scale-95 disabled:opacity-50"
          title="Segarkan Kurs"
        >
          <span className={`material-symbols-outlined text-[16px] ${isLoading ? 'animate-spin' : ''}`}>
            sync
          </span>
          <span className="hidden xs:inline">Segarkan</span>
        </button>
      </div>

      {/* Global Market Live Status Ticker Banner */}
      <div className="w-full bg-surface-container rounded-2xl p-3.5 flex items-center justify-between shadow-sm border border-primary/20">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                source === 'fallback' ? 'bg-amber-400' : 'bg-primary'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                source === 'fallback' ? 'bg-amber-400' : 'bg-primary'
              }`}
            />
          </span>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-on-surface truncate">
                {source === 'fallback' ? 'Mode Offline' : 'Pasar Global Live'}
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wide uppercase ${
                  source === 'fallback'
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                    : 'bg-primary/20 text-primary border border-primary/30'
                }`}
              >
                {source === 'fallback' ? 'KURS CADANGAN' : 'LIVE'}
              </span>
            </div>
            <span className="text-[10px] text-outline truncate">
              {source === 'fallback'
                ? 'Menggunakan kurs cadangan offline stabil'
                : 'Pasar Valas Dunia (Open Exchange Rates USD Base)'}
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="flex items-center gap-1 text-primary text-[11px] font-semibold justify-end">
            <span className="text-[10px] text-outline font-mono">
              {secondsAgo < 5
                ? 'Baru saja'
                : `Diperbarui ${secondsAgo} dtk lalu`}
            </span>
          </div>
          <span className="text-[9px] text-primary/70 block">
            Auto-refresh 60 dtk
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative w-full">
        <div className="relative flex items-center bg-surface-container rounded-xl px-3.5 h-11 shadow-sm border border-border/40 focus-within:border-primary">
          <span className="material-symbols-outlined text-outline text-[18px] mr-2">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari mata uang, negara, atau simbol..."
            className="w-full bg-transparent border-0 text-xs text-on-surface placeholder:text-outline focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              type="button"
              className="w-6 h-6 rounded-full bg-surface-variant flex items-center justify-center text-outline hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Valas Acuan Card (1 USD / IDR) */}
      <div className="w-full bg-surface-container rounded-2xl p-4 relative overflow-hidden shadow-sm border border-border/40">
        <div className="absolute -right-12 -top-12 w-36 h-36 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[18px]">currency_exchange</span>
            <span className="text-xs font-bold text-on-surface">Indikator Valas Acuan</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] text-primary uppercase tracking-wider font-bold">
              1 USD / IDR
            </span>
          </div>
        </div>

        <div className="mt-1 relative z-10 flex items-end justify-between flex-wrap gap-2">
          <div>
            <div className="text-outline text-[11px]">Kurs Tengah Pasar (Mid-Market)</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold text-primary tracking-tight tabular-nums">
                {formatCurrency(rates.USD, 'IDR')}
              </span>
              <span className="inline-flex items-center text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                ▲ Stabil
              </span>
            </div>
          </div>
          <div className="text-right text-[11px] text-outline">
            <span>Basis Utama: <strong className="text-on-surface font-normal">IDR (Rupiah)</strong></span>
          </div>
        </div>

        {/* 24h Trend Sparkline Visualization (SVG) */}
        <div className="mt-3 pt-2 border-t border-border/30 relative z-10">
          <div className="flex items-center justify-between text-[10px] text-outline mb-1">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px] text-primary">show_chart</span>
              Tren Fluktuasi Pasar
            </span>
            <span className="text-primary font-medium">Volatilitas Terkendali</span>
          </div>
          <div className="w-full h-9 relative">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 320 36">
              <defs>
                <linearGradient id="usdSparkGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#2DD4A7" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#2DD4A7" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M0,28 Q35,26 70,22 T140,24 T210,14 T280,10 L320,6 L320,36 L0,36 Z"
                fill="url(#usdSparkGrad)"
              />
              <path
                d="M0,28 Q35,26 70,22 T140,24 T210,14 T280,10 L320,6"
                fill="none"
                stroke="#2DD4A7"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
              <circle cx="320" cy="6" fill="#2DD4A7" r="3" />
            </svg>
          </div>
        </div>

        {/* Quick Glance Rates Grid */}
        <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2 border-t border-border/30">
          {(['SGD', 'MYR', 'EUR', 'JPY'] as CurrencyCode[]).map((code) => {
            const r = rates[code];
            return (
              <div key={code} className="bg-surface-container-low rounded-xl p-2 flex flex-col text-center">
                <span className="text-[10px] text-outline font-semibold">{code}/IDR</span>
                <span className="text-xs font-bold text-on-surface tabular-nums mt-0.5">
                  {code === 'JPY' ? r.toFixed(1) : Math.round(r).toLocaleString('id-ID')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Currency Selector List */}
      <div className="bg-surface-container rounded-2xl p-4 shadow-sm border border-border/40 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-on-surface">Pilih Mata Uang Tampilan</h3>
            <p className="text-xs text-outline">
              Semua nilai di Dashboard, Riwayat, dan Target akan dikonversi ke mata uang ini
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {currenciesList.map((cur) => {
            const isSelected = displayCurrency === cur.code;
            const rateVal = rates[cur.code];
            return (
              <div
                key={cur.code}
                onClick={() => setDisplayCurrency(cur.code)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] ${
                  isSelected
                    ? 'bg-primary/10 border-primary shadow-sm'
                    : 'bg-surface-container-low border-border/30 hover:border-border'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">{cur.flag}</span>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-on-surface">{cur.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-container-high text-outline font-bold">
                        {cur.code}
                      </span>
                    </div>
                    <span className="text-[11px] text-outline tabular-nums mt-0.5">
                      {cur.code === 'IDR'
                        ? 'Mata uang dasar (1x)'
                        : `1 ${cur.code} ≈ ${formatCurrency(rateVal, 'IDR')}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-on-surface tabular-nums">
                    {cur.symbol}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      isSelected ? 'bg-primary text-black' : 'border border-outline'
                    }`}
                  >
                    {isSelected && (
                      <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Currency Converter Calculator */}
      <div className="bg-surface-container rounded-2xl p-4 shadow-sm border border-border/40 space-y-3">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-[18px]">calculate</span>
          <h3 className="text-sm font-bold text-on-surface">Kalkulator Konversi Cepat</h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 bg-surface-container-high rounded-xl p-2.5 border border-border/40 flex items-center justify-between">
            <input
              type="number"
              value={calcAmount}
              onChange={(e) => setCalcAmount(e.target.value)}
              placeholder="100"
              className="bg-transparent text-sm font-bold text-on-surface focus:outline-none w-full tabular-nums"
            />
            <select
              value={calcCurrency}
              onChange={(e) => setCalcCurrency(e.target.value as CurrencyCode)}
              className="bg-surface-container text-xs font-bold text-primary rounded-lg px-2 py-1 border border-border/40 focus:outline-none"
            >
              {(['USD', 'SGD', 'MYR', 'EUR', 'JPY'] as CurrencyCode[]).map((c) => (\n                <option key={c} value={c}>\n                  {c}\n                </option>\n              ))}\n            </select>\n          </div>\n\n          <span className=\"material-symbols-outlined text-outline text-[20px]\">sync_alt</span>\n\n          <div className=\"flex-1 bg-surface-container-high rounded-xl p-2.5 border border-border/40 flex flex-col justify-center\">\n            <span className=\"text-[10px] text-outline\">Setara IDR:</span>\n            <span className=\"text-xs font-bold text-primary tabular-nums truncate\">\n              {formatCurrency(convertedToIdr, 'IDR')}\n            </span>\n          </div>\n        </div>\n      </div>\n    </div>\n  );\n};\n