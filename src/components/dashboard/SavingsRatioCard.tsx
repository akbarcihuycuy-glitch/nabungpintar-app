import React from 'react';

interface SavingsRatioCardProps {
  ratio: number | null;
  status: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Rendah' | 'Kritis' | '-';
}

export const SavingsRatioCard: React.FC<SavingsRatioCardProps> = ({ ratio, status }) => {
  const displayRatio = ratio !== null ? Math.round(ratio * 10) / 10 : null;
  const clampedProgress = ratio !== null ? Math.max(0, Math.min(100, ratio)) : 0;

  // Radius 34 -> Circumference = 2 * PI * 34 ≈ 213.63
  const r = 34;
  const cx = 44;
  const cy = 44;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  // Calculate tip orb position
  const angleDeg = -90 + (clampedProgress / 100) * 360;
  const angleRad = (angleDeg * Math.PI) / 180;
  const orbX = cx + r * Math.cos(angleRad);
  const orbY = cy + r * Math.sin(angleRad);

  const isGood = status === 'Sangat Baik' || status === 'Baik';
  const isWarn = status === 'Cukup';
  const isBad = status === 'Rendah' || status === 'Kritis';

  let badgeBg = 'bg-primary/20 text-primary border-primary/40';
  let gradientStops = ['#2DD4A7', '#38BDF8'];
  let glowColor = 'rgba(45,212,167,0.5)';
  let advice =
    'Alokasi tabunganmu di atas target ideal 20-30%. Pertahankan konsistensi ini untuk mencapai kebebasan finansial.';

  if (status === 'Sangat Baik') {
    badgeBg = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    gradientStops = ['#10B981', '#06B6D4'];
    glowColor = 'rgba(16,185,129,0.55)';
    advice = 'Luar biasa! Rasio menabungmu >30%. Target impianmu akan tercapai jauh lebih cepat.';
  } else if (status === 'Baik') {
    badgeBg = 'bg-teal-500/20 text-teal-300 border-teal-500/40';
    gradientStops = ['#14B8A6', '#38BDF8'];
    glowColor = 'rgba(20,184,166,0.5)';
    advice = 'Bagus! Rasio menabung di atas target minimum 20%. Pertahankan disiplin pengeluaran setiap minggu.';
  } else if (status === 'Cukup') {
    badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    gradientStops = ['#F59E0B', '#FBBF24'];
    glowColor = 'rgba(245,158,11,0.5)';
    advice = 'Rasio menabungmu 10-20%. Kurangi pos belanja sekunder agar dapat dinaikkan ke level sehat ≥20%.';
  } else if (status === 'Rendah' || status === 'Kritis') {
    badgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    gradientStops = ['#F43F5E', '#FB7185'];
    glowColor = 'rgba(244,63,94,0.55)';
    advice = 'Peringatan: Pengeluaran sangat tinggi dibandingkan pemasukan. Prioritaskan kebutuhan pokok dan rem konsumsi.';
  } else {
    advice = 'Catat pemasukan dan pengeluaran secara teratur untuk menghitung rasio menabung secara akurat.';
  }

  return (
    <section className="relative rounded-3xl p-5 overflow-hidden transition-all duration-300 backdrop-blur-2xl border
      /* Bento Glass Dark */
      dark:bg-gradient-to-br dark:from-slate-900/90 dark:via-slate-900/75 dark:to-teal-950/40 dark:border-teal-500/20 dark:shadow-[0_12px_35px_rgba(15,23,42,0.4)]
      /* Bento Glass Light */
      bg-gradient-to-br from-white/90 via-teal-50/50 to-emerald-50/70 border-teal-200/60 shadow-[0_12px_30px_rgba(20,184,166,0.1)]
    ">
      {/* Ambient Glow */}
      <div
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-40"
        style={{ backgroundColor: gradientStops[0] }}
      />

      <div className="relative z-10 flex flex-col space-y-3.5">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <span className="material-symbols-outlined text-[18px]">percent</span>
            </div>
            <div>
              <span className="text-sm font-bold text-on-surface block leading-tight">
                Rasio Menabung
              </span>
              <span className="text-[10px] text-outline">Target Sehat ≥ 20%</span>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-[11px] font-extrabold border shadow-sm ${badgeBg}`}
          >
            {status}
          </span>
        </div>

        {/* Bento Content: Glowing Liquid Ring Gauge + Advice */}
        <div className="flex items-center gap-4 pt-1">
          {/* Glowing Liquid Ring Gauge */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 88 88">
              <defs>
                <linearGradient id="liquidRingGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={gradientStops[0]} />
                  <stop offset="100%" stopColor={gradientStops[1]} />
                </linearGradient>
                <filter id="liquidRingGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Background Track */}
              <circle
                cx={cx}
                cy={cy}
                fill="transparent"
                r={r}
                stroke="currentColor"
                strokeWidth="7"
                className="text-black/15 dark:text-white/10"
              />

              {/* Progress Track */}
              <circle
                cx={cx}
                cy={cy}
                fill="transparent"
                r={r}
                stroke="url(#liquidRingGrad)"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                strokeWidth="7"
                filter="url(#liquidRingGlow)"
                className="transition-all duration-700 ease-out"
              />

              {/* Glowing Orb at Progress Tip */}
              {clampedProgress > 0 && (
                <circle
                  cx={orbX}
                  cy={orbY}
                  r="5"
                  fill="#FFFFFF"
                  stroke={gradientStops[0]}
                  strokeWidth="2"
                  className="animate-pulse"
                  style={{
                    filter: `drop-shadow(0 0 6px ${glowColor})`,
                  }}
                />
              )}
            </svg>

            {/* Inner Percentage */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-extrabold text-on-surface tabular-nums">
                {displayRatio !== null ? `${displayRatio}%` : '-'}
              </span>
              <span className="text-[9px] font-semibold text-outline uppercase tracking-wider">
                Tersimpan
              </span>
            </div>
          </div>

          {/* Right Bento Box: Coaching advice */}
          <div className="flex-1 min-w-0 p-3 rounded-2xl bg-black/10 dark:bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-teal-400 shrink-0 mt-0.5">
                tips_and_updates
              </span>
              <p className="text-[11px] text-on-surface leading-relaxed font-medium">
                {advice}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
