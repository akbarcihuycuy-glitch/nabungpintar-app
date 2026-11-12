import React, { useState } from 'react';
import { formatPercentage } from '../../utils/formatters';
import { useFx } from '../../hooks/useFx';
import { useCountUp } from '../../hooks/useCountUp';
import { getHideBalanceSetting, setHideBalanceSetting } from '../../services/security';

interface HeroBalanceCardProps {
  totalSaldo: number;
  saldoKas: number;
  totalTabungan: number;
  income: number;
  expense: number;
  incomeChangePct: number | null | 'Baru';
  expenseChangePct: number | null | 'Baru';
  activeGoalsCount?: number;
  savingsRatio?: number | null;
  cardHolderName?: string;
}

export const HeroBalanceCard: React.FC<HeroBalanceCardProps> = ({
  totalSaldo,
  saldoKas,
  totalTabungan,
  income,
  expense,
  incomeChangePct,
  expenseChangePct,
  activeGoalsCount = 0,
  savingsRatio = null,
  cardHolderName,
}) => {
  const [isHidden, setIsHidden] = useState<boolean>(() => getHideBalanceSetting());
  const { formatMoney } = useFx();

  const handleToggleHide = () => {
    const next = !isHidden;
    setIsHidden(next);
    setHideBalanceSetting(next);
  };

  // Smooth count-up numeric animation
  const animTotalSaldo = useCountUp(totalSaldo, 400);
  const animSaldoKas = useCountUp(saldoKas, 400);
  const animTotalTabungan = useCountUp(totalTabungan, 400);
  const animIncome = useCountUp(income, 400);
  const animExpense = useCountUp(expense, 400);

  // Financial Mood Lamp calculation
  // 1. Deficit: ratio <= 0 or expense > income
  // 2. Warning: ratio 1% - 19.9%
  // 3. Healthy: ratio >= 20%
  const effectiveRatio =
    savingsRatio !== null && savingsRatio !== undefined
      ? savingsRatio
      : income > 0
      ? ((income - expense) / income) * 100
      : 0;

  const isDeficit = effectiveRatio <= 0 || (expense > income && income > 0);
  const isWarning = !isDeficit && effectiveRatio < 20;
  const isHealthy = !isDeficit && !isWarning;

  const moodConfig = isDeficit
    ? {
        label: 'DEFICIT ALERT • ARUS KAS KRITIS 🚨',
        glowDark: 'from-rose-500/40 via-pink-600/25 to-purple-600/35',
        shadowDark: 'shadow-[0_16px_50px_rgba(244,63,94,0.35)]',
        borderDark: 'border-rose-500/40',
        ambientTop: 'bg-rose-500/35',
        ambientBottom: 'bg-purple-600/30',
        glowLight: 'from-rose-100/90 via-pink-50/80 to-purple-100/70',
        borderLight: 'border-rose-300/70',
        shadowLight: 'shadow-[0_15px_35px_rgba(244,63,94,0.2)]',
        chipBorder: 'border-rose-400/60',
        badgePill:
          'bg-rose-500/20 text-rose-300 border-rose-400/40 dark:bg-rose-500/25 dark:text-rose-200',
        badgeLight: 'bg-rose-100 text-rose-800 border-rose-300',
        accentRing: 'ring-rose-500/30',
      }
    : isWarning
    ? {
        label: 'CAUTION • WASPADA PENGELUARAN ⚠️',
        glowDark: 'from-amber-500/35 via-yellow-500/25 to-orange-500/30',
        shadowDark: 'shadow-[0_16px_50px_rgba(245,158,11,0.3)]',
        borderDark: 'border-amber-500/40',
        ambientTop: 'bg-amber-400/35',
        ambientBottom: 'bg-orange-500/25',
        glowLight: 'from-amber-100/90 via-orange-50/80 to-yellow-100/70',
        borderLight: 'border-amber-300/70',
        shadowLight: 'shadow-[0_15px_35px_rgba(245,158,11,0.18)]',
        chipBorder: 'border-amber-400/60',
        badgePill:
          'bg-amber-500/20 text-amber-300 border-amber-400/40 dark:bg-amber-500/25 dark:text-amber-200',
        badgeLight: 'bg-amber-100 text-amber-800 border-amber-300',
        accentRing: 'ring-amber-500/30',
      }
    : {
        label: 'SMART SAVER • KONDISI SEHAT ✨',
        glowDark: 'from-emerald-500/35 via-teal-500/25 to-cyan-500/30',
        shadowDark: 'shadow-[0_16px_50px_rgba(16,185,129,0.32)]',
        borderDark: 'border-emerald-400/40',
        ambientTop: 'bg-emerald-400/35',
        ambientBottom: 'bg-cyan-400/25',
        glowLight: 'from-emerald-100/90 via-teal-50/80 to-cyan-100/70',
        borderLight: 'border-emerald-300/70',
        shadowLight: 'shadow-[0_15px_35px_rgba(16,185,129,0.18)]',
        chipBorder: 'border-emerald-400/60',
        badgePill:
          'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 dark:bg-emerald-500/25 dark:text-emerald-200',
        badgeLight: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        accentRing: 'ring-emerald-500/30',
      };

  const isIncomeUp =
    incomeChangePct === 'Baru' || (typeof incomeChangePct === 'number' && incomeChangePct >= 0);
  const isExpenseFavorable = typeof expenseChangePct === 'number' && expenseChangePct <= 0;

  const holderName = (cardHolderName || 'CUAN MONEY').toUpperCase();

  return (
    <section className="group relative w-full rounded-3xl transition-all duration-500">
      {/* Dynamic Mood Lamp Ambient Radial Glow Layers */}
      <div
        className={`absolute -top-10 -right-10 w-56 h-56 rounded-full ${moodConfig.ambientTop} blur-3xl pointer-events-none transition-all duration-700 animate-pulse`}
      />
      <div
        className={`absolute -bottom-10 -left-10 w-56 h-56 rounded-full ${moodConfig.ambientBottom} blur-3xl pointer-events-none transition-all duration-700`}
      />

      {/* Main Glass Card Shell */}
      <div
        className={`relative z-10 rounded-3xl p-5 overflow-hidden transition-all duration-500 backdrop-blur-2xl border
          /* Dark Mode Mood */
          dark:bg-gradient-to-br ${moodConfig.glowDark} dark:${moodConfig.borderDark} dark:${moodConfig.shadowDark}
          /* Light Mode Mood (Iridescent Pastel Glass) */
          bg-gradient-to-br ${moodConfig.glowLight} ${moodConfig.borderLight} ${moodConfig.shadowLight}
        `}
      >
        {/* Holographic Glass Sheen Diagonal Overlay */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/20 to-transparent rotate-12 transform animate-holo-sheen" />
        </div>

        {/* Inner Card Content */}
        <div className="relative z-10 flex flex-col space-y-4">
          {/* Top Row: Digital EMV Chip, Contactless Wave & Dynamic Status Badge */}
          <div className="flex items-center justify-between">
            {/* Luminous Digital EMV Chip */}
            <div className="flex items-center space-x-2.5">
              <div
                className={`relative w-11 h-8 rounded-lg border ${moodConfig.chipBorder} bg-gradient-to-tr from-amber-300/30 via-yellow-200/40 to-amber-400/30 shadow-inner flex items-center justify-center overflow-hidden`}
              >
                {/* Etched Chip Microprocessor lines */}
                <div className="w-full h-full p-0.5 flex flex-col justify-between opacity-70">
                  <div className="w-full h-px bg-amber-200/60" />
                  <div className="flex items-center justify-between">
                    <div className="w-2.5 h-2.5 rounded-sm border border-amber-300/80" />
                    <div className="w-2.5 h-2.5 rounded-sm border border-amber-300/80" />
                  </div>
                  <div className="w-full h-px bg-amber-200/60" />
                </div>
                {/* Glowing micro-dot */}
                <span className="absolute w-1 h-1 rounded-full bg-white animate-ping" />
              </div>

              {/* Contactless Waves Icon */}
              <div
                className="text-on-surface/70 flex items-center"
                title="Sistem Terenkripsi & Sinkronisasi Live"
              >
                <span className="material-symbols-outlined text-[18px] rotate-90">wifi</span>
              </div>
            </div>

            {/* Dynamic Mood Status Badge */}
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-full border shadow-sm transition-colors duration-500 ${moodConfig.badgePill}`}
              >
                {moodConfig.label}
              </span>
            </div>
          </div>

          {/* Cardholder Name & Active Goals Indicator */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-mono tracking-widest text-on-surface/80 font-bold uppercase drop-shadow-sm">
              {holderName}
            </span>
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md bg-black/15 dark:bg-white/10 text-on-surface/90 border border-white/10">
              {activeGoalsCount > 0 ? `${activeGoalsCount} Celengan Impian` : 'Kas Utama IDR'}
            </span>
          </div>

          {/* Main Balance Display with Privacy Eye */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-wider text-on-surface/70 font-semibold">
                Total Saldo Bersih
              </span>
              <button
                onClick={handleToggleHide}
                aria-label={isHidden ? 'Tampilkan Saldo' : 'Sembunyikan Saldo'}
                className="text-on-surface/70 hover:text-on-surface transition-colors p-0.5 active:scale-90"
                type="button"
              >
                <span className="material-symbols-outlined text-[17px]">
                  {isHidden ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            <div className="flex items-baseline space-x-2">
              {isHidden ? (
                <span className="text-2xl sm:text-3xl tracking-widest text-on-surface font-extrabold font-mono">
                  Rp ••••••••••
                </span>
              ) : (
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface tabular-nums drop-shadow-sm">
                  {formatMoney(animTotalSaldo)}
                </span>
              )}
            </div>
          </div>

          {/* Sub-bar: Kas vs Tabungan with glowing glass capsules */}
          <div className="flex items-center justify-between text-xs py-2 px-3.5 rounded-2xl bg-black/15 dark:bg-white/5 border border-white/15 dark:border-white/10 backdrop-blur-md text-on-surface/90">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-on-surface/70 font-medium">Kas Utama:</span>
              <span className="font-bold tabular-nums">
                {isHidden ? 'Rp •••••••' : formatMoney(animSaldoKas)}
              </span>
            </div>
            <div className="h-3.5 w-px bg-white/20" />
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
              <span className="text-on-surface/70 font-medium">Celengan:</span>
              <span className="font-bold tabular-nums">
                {isHidden ? 'Rp •••••••' : formatMoney(animTotalTabungan)}
              </span>
            </div>
          </div>

          {/* Bottom Split: Pemasukan & Pengeluaran Bento Neon Chips */}
          <div className="grid grid-cols-2 gap-2.5 pt-0.5">
            {/* Pemasukan Chip */}
            <div className="rounded-2xl bg-black/15 dark:bg-white/5 p-3 flex flex-col justify-between border border-white/10 backdrop-blur-md">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-1.5">
                  <div className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[13px]">arrow_downward</span>
                  </div>
                  <span className="text-[11px] text-on-surface/75 font-semibold">Pemasukan</span>
                </div>
              </div>

              <span className="text-sm text-on-surface tabular-nums font-bold">
                {isHidden ? 'Rp •••••••' : formatMoney(animIncome)}
              </span>

              <div
                className={`mt-1.5 inline-flex items-center space-x-1 px-2 py-0.5 rounded-full self-start text-[10px] font-bold ${
                  isIncomeUp
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-400/30'
                    : 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-400/30'
                }`}
              >
                <span className="material-symbols-outlined text-[12px]">
                  {isIncomeUp ? 'trending_up' : 'trending_down'}
                </span>
                <span>{formatPercentage(incomeChangePct)}</span>
              </div>
            </div>

            {/* Pengeluaran Chip */}
            <div className="rounded-2xl bg-black/15 dark:bg-white/5 p-3 flex flex-col justify-between border border-white/10 backdrop-blur-md">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-1.5">
                  <div className="w-5 h-5 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[13px]">arrow_upward</span>
                  </div>
                  <span className="text-[11px] text-on-surface/75 font-semibold">Pengeluaran</span>
                </div>
              </div>

              <span className="text-sm text-on-surface tabular-nums font-bold">
                {isHidden ? 'Rp •••••••' : formatMoney(animExpense)}
              </span>

              <div
                className={`mt-1.5 inline-flex items-center space-x-1 px-2 py-0.5 rounded-full self-start text-[10px] font-bold ${
                  isExpenseFavorable
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-400/30'
                    : 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-400/30'
                }`}
              >
                <span className="material-symbols-outlined text-[12px]">
                  {isExpenseFavorable ? 'trending_down' : 'trending_up'}
                </span>
                <span>{formatPercentage(expenseChangePct)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
