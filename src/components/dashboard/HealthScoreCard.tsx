import React, { useState } from 'react';
import { HealthScoreResult } from '../../types/database';

interface HealthScoreCardProps {
  healthScore: HealthScoreResult;
}

export const HealthScoreCard: React.FC<HealthScoreCardProps> = ({ healthScore }) => {
  const { eligible, score, label, reason, subScores } = healthScore;
  const [activeSubMetric, setActiveSubMetric] = useState<string | null>(null);

  // Speedometer Arc calculation (Semi-circle 180 degrees)
  // Radius = 60, circumference for full circle = 2 * PI * 60 = 376.99
  // For semi-circle (180 deg), arc length = 188.5
  const arcLength = 188.5;
  const scorePct = Math.max(0, Math.min(100, score || 0));
  const arcOffset = arcLength - (scorePct / 100) * arcLength;

  // Arc needle angle: -180 deg (score 0) to 0 deg (score 100)
  const needleAngle = -180 + (scorePct / 100) * 180;

  const scoreBadgeTheme =
    score >= 80
      ? {
          bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
          color: '#10B981',
          shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]',
        }
      : score >= 60
      ? {
          bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
          color: '#06B6D4',
          shadow: 'shadow-[0_0_15px_rgba(6,182,212,0.4)]',
        }
      : score >= 40
      ? {
          bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
          color: '#F59E0B',
          shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.4)]',
        }
      : {
          bg: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
          color: '#F43F5E',
          shadow: 'shadow-[0_0_15px_rgba(244,63,94,0.4)]',
        };

  return (
    <section className="relative rounded-3xl p-5 overflow-hidden transition-all duration-300 backdrop-blur-2xl border
      /* Bento Glass Dark */
      dark:bg-gradient-to-br dark:from-slate-900/90 dark:via-indigo-950/40 dark:to-slate-900/80 dark:border-indigo-500/25 dark:shadow-[0_12px_40px_rgba(15,23,42,0.45)]
      /* Bento Glass Light */
      bg-gradient-to-br from-white/90 via-indigo-50/50 to-slate-50/80 border-indigo-200/60 shadow-[0_12px_30px_rgba(99,102,241,0.1)]
    ">
      {/* Ambient Top Glow */}
      <div
        className="absolute -top-12 -right-12 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-30"
        style={{ backgroundColor: scoreBadgeTheme.color }}
      />

      <div className="relative z-10 flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <span className="material-symbols-outlined text-[18px]">speed</span>
            </div>
            <div>
              <span className="text-sm font-bold text-on-surface block leading-tight">
                Kesehatan Finansial
              </span>
              <span className="text-[10px] text-outline">Formula FinTech 40/30/20/10</span>
            </div>
          </div>

          {eligible ? (
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-extrabold border shadow-sm flex items-center gap-1 ${scoreBadgeTheme.bg}`}
            >
              <span className="material-symbols-outlined text-[14px]">verified</span>
              {label}
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-container-high text-outline">
              Menghimpun Data
            </span>
          )}
        </div>

        {!eligible ? (
          <div className="p-4 rounded-2xl bg-black/10 dark:bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">hourglass_top</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-on-surface">Data Belum Cukup</span>
              <span className="text-[11px] text-outline mt-0.5 leading-relaxed">
                {reason || 'Dibutuhkan minimal 7 hari riwayat transaksi untuk menghitung skor secara akurat.'}
              </span>
            </div>
          </div>
        ) : (
          <>
            {/* Speedometer Arc Gauge + Center Score */}
            <div className="relative flex flex-col items-center justify-center pt-1 pb-2">
              <div className="relative w-44 h-24 overflow-hidden flex items-end justify-center">
                <svg className="w-44 h-44 -rotate-180 transform" viewBox="0 0 140 140">
                  <defs>
                    <linearGradient id="speedoGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#F43F5E" />
                      <stop offset="35%" stopColor="#F59E0B" />
                      <stop offset="65%" stopColor="#06B6D4" />
                      <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                    <filter id="speedoGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Background Track (180 deg) */}
                  <circle
                    cx="70"
                    cy="70"
                    r="55"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeDasharray="172.78 172.78"
                    strokeLinecap="round"
                    className="text-black/15 dark:text-white/10"
                  />

                  {/* Active Neon Score Arc */}
                  <circle
                    cx="70"
                    cy="70"
                    r="55"
                    fill="transparent"
                    stroke="url(#speedoGrad)"
                    strokeWidth="10"
                    strokeDasharray="172.78 172.78"
                    strokeDashoffset={172.78 - (scorePct / 100) * 172.78}
                    strokeLinecap="round"
                    filter="url(#speedoGlow)"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>

                {/* Score Number in Center of Arc */}
                <div className="absolute bottom-0 inset-x-0 flex flex-col items-center justify-center text-center">
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-3xl font-extrabold tracking-tight text-on-surface tabular-nums">
                      {score}
                    </span>
                    <span className="text-xs font-semibold text-outline">/100</span>
                  </div>
                  <span className="text-[10px] font-bold text-outline uppercase tracking-wider -mt-1">
                    Skor Finansial
                  </span>
                </div>
              </div>

              {/* 4 Arc Range Labels */}
              <div className="w-48 flex justify-between text-[10px] text-outline font-semibold px-2 pt-1">
                <span className="text-rose-400">0</span>
                <span className="text-amber-400">40</span>
                <span className="text-cyan-400">70</span>
                <span className="text-emerald-400">100</span>
              </div>
            </div>

            {/* 4 Interactive Glass Capsules (Emerald, Cyan, Violet, Amber) */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* Capsule 1: Rasio Menabung (Bobot 40) - Emerald */}
              <div
                onClick={() =>
                  setActiveSubMetric(activeSubMetric === 'savings' ? null : 'savings')
                }
                className="p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-300">
                      Rasio Tabungan
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-on-surface tabular-nums">
                    {subScores.savingsRatio.score}/40
                  </span>
                </div>

                <div className="mt-2 w-full bg-black/15 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${subScores.savingsRatio.percentage}%` }}
                  />
                </div>
                {activeSubMetric === 'savings' && (
                  <p className="text-[10px] text-on-surface-variant pt-2 leading-snug animate-fade-in">
                    Bobot 40 poin. Diukur dari persentase uang yang berhasil disisihkan dari total pemasukan.
                  </p>
                )}
              </div>

              {/* Capsule 2: Dana Darurat (Bobot 30) - Cyan */}
              <div
                onClick={() =>
                  setActiveSubMetric(activeSubMetric === 'emergency' ? null : 'emergency')
                }
                className="p-3 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/30 transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8]" />
                    <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-300">
                      Dana Darurat
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-on-surface tabular-nums">
                    {subScores.emergencyFund.score}/30
                  </span>
                </div>

                <div className="mt-2 w-full bg-black/15 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full transition-all duration-500"
                    style={{ width: `${subScores.emergencyFund.percentage}%` }}
                  />
                </div>
                {activeSubMetric === 'emergency' && (
                  <p className="text-[10px] text-on-surface-variant pt-2 leading-snug animate-fade-in">
                    Bobot 30 poin. Ketahanan saldo kas terhadap rata-rata pengeluaran bulanan (ideal 3-6 bulan).
                  </p>
                )}
              </div>

              {/* Capsule 3: Tren Pengeluaran (Bobot 20) - Violet */}
              <div
                onClick={() =>
                  setActiveSubMetric(activeSubMetric === 'expense' ? null : 'expense')
                }
                className="p-3 rounded-2xl bg-violet-500/10 hover:bg-violet-500/15 border border-violet-500/30 transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_6px_#a78bfa]" />
                    <span className="text-[11px] font-bold text-violet-600 dark:text-violet-300">
                      Tren Belanja
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-on-surface tabular-nums">
                    {subScores.expenseTrend.score}/20
                  </span>
                </div>

                <div className="mt-2 w-full bg-black/15 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-all duration-500"
                    style={{ width: `${subScores.expenseTrend.percentage}%` }}
                  />
                </div>
                {activeSubMetric === 'expense' && (
                  <p className="text-[10px] text-on-surface-variant pt-2 leading-snug animate-fade-in">
                    Bobot 20 poin. Evaluasi lonjakan belanja tidak wajar dibandingkan periode sebelumnya.
                  </p>
                )}
              </div>

              {/* Capsule 4: Konsistensi Catat (Bobot 10) - Amber */}
              <div
                onClick={() =>
                  setActiveSubMetric(activeSubMetric === 'consistency' ? null : 'consistency')
                }
                className="p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]" />
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-300">
                      Disiplin Catat
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-on-surface tabular-nums">
                    {subScores.consistency.score}/10
                  </span>
                </div>

                <div className="mt-2 w-full bg-black/15 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                    style={{ width: `${subScores.consistency.percentage}%` }}
                  />
                </div>
                {activeSubMetric === 'consistency' && (
                  <p className="text-[10px] text-on-surface-variant pt-2 leading-snug animate-fade-in">
                    Bobot 10 poin. Frekuensi pencatatan transaksi minimal setiap beberapa hari.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
