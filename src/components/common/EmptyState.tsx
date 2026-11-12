import React from 'react';

interface DashboardEmptyStateProps {
  onRecordClick: () => void;
  onGoalClick?: () => void;
}

export const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({
  onRecordClick,
  onGoalClick,
}) => {
  return (\n    <div className="flex flex-col space-y-4">
      {/* Dedicated Empty State Feature Card */}
      <div className="relative overflow-hidden rounded-2xl bg-surface-container p-6 text-center shadow-lg border border-border/40">
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent pointer-events-none" />

        <div className="relative flex flex-col items-center">
          {/* Minimalist Vector Illustration of Empty Piggy/Wallet with Mint Sparkles */}
          <div className="relative w-24 h-24 flex items-center justify-center mb-4">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-75 animate-pulse" />
            <div className="relative w-20 h-20 rounded-2xl bg-surface-container-high flex items-center justify-center shadow-inner border border-border/40">
              <svg
                className="w-10 h-10 text-primary"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.75"
                viewBox="0 0 24 24"
              >
                <path d="M19 7V4a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v3" />
                <rect height="14" rx="3" width="16" x="4" y="7" />
                <circle cx="12" cy="14" r="2.5" />
                <path d="M12 11.5v-1" />
              </svg>

              {/* Sparkling Accents */}
              <div className="absolute -top-1.5 -right-1 text-primary animate-bounce">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0L14.3 8.7L23 11L14.3 13.3L12 22L9.7 13.3L1 11L9.7 8.7L12 0Z" />
                </svg>
              </div>
              <div className="absolute -bottom-1 -left-1.5 text-income opacity-80">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0L14.3 8.7L23 11L14.3 13.3L12 22L9.7 13.3L1 11L9.7 8.7L12 0Z" />
                </svg>
              </div>
            </div>
          </div>

          <h2 className="text-lg font-bold text-on-surface tracking-tight mb-2">
            Belum ada transaksi. Catat yang pertama
          </h2>
          <p className="text-sm text-on-surface-variant max-w-xs mx-auto mb-6 leading-relaxed">
            Belum ada transaksi yang tercatat untuk periode ini. Catat pemasukan atau pengeluaran pertamamu untuk mulai memantau arus kas &amp; kesehatan finansial.
          </p>

          <button
            onClick={onRecordClick}
            type="button"
            className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-primary text-on-primary font-semibold tracking-tight shadow-glow hover:brightness-105 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[20px] font-bold">add</span>
            Catat Transaksi Pertama
          </button>
        </div>
      </div>

      {/* Helpful Quick Start Tips Card */}
      <div className="rounded-2xl bg-surface-container p-5 shadow-sm space-y-4 border border-border/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-surface-container-high text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">lightbulb</span>
          </div>
          <h3 className="text-sm font-semibold text-on-surface tracking-tight">
            Langkah Awal Menabung Cerdas
          </h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-high/60">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-on-surface">Catat Pemasukan Bulanan</span>
              <span className="text-xs text-on-surface-variant mt-0.5">Gaji pokok, bonus, atau pendapatan rutin lainnya</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-high/60">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-on-surface">Atur Target Celengan</span>
              <span className="text-xs text-on-surface-variant mt-0.5">Siapkan pos dana darurat, liburan, atau barang impian</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-high/60">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-on-surface">Pantau Rasio &amp; Arus Kas</span>
              <span className="text-xs text-on-surface-variant mt-0.5">Evaluasi pengeluaran agar selalu berada di bawah anggaran</span>
            </div>
          </div>
        </div>
      </div>

      {/* Empty Target Celengan Card */}
      <div className="rounded-2xl bg-surface-container p-5 shadow-sm space-y-3 border border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">savings</span>
            <h3 className="text-sm font-semibold text-on-surface tracking-tight">
              Target Celengan
            </h3>
          </div>
          <span className="text-xs text-on-surface-variant">0 Aktif</span>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-5 flex flex-col items-center text-center border border-dashed border-border">
          <div className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mb-2.5">
            <span className="material-symbols-outlined text-[24px]">flag</span>
          </div>
          <p className="text-sm font-semibold text-on-surface mb-1">
            Belum ada target tabungan
          </p>
          <p className="text-xs text-on-surface-variant max-w-xs mb-4">
            Pisahkan uang belanja dengan tabungan impian agar tidak terpakai tanpa sengaja.
          </p>
          {onGoalClick && (
            <button
              onClick={onGoalClick}
              type="button"
              className="inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-lg bg-surface-container-high text-primary hover:bg-surface-2 active:scale-[0.98] text-xs font-semibold transition-all border border-border/50"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              Buat Target Pertama
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
