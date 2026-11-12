import React from 'react';
import { SavingsGoal } from '../../types/database';
import { useFx } from '../../hooks/useFx';
import { GoalIcon } from '../common/GoalIcon';

interface ActiveGoalsSummaryProps {
  goals: SavingsGoal[];
  onAddGoal?: () => void;
  onGoalClick?: (goal: SavingsGoal) => void;
  onTopUp?: (goal: SavingsGoal) => void;
}

export const ActiveGoalsSummary: React.FC<ActiveGoalsSummaryProps> = ({
  goals,
  onAddGoal,
  onGoalClick,
  onTopUp,
}) => {
  const { formatMoney } = useFx();

  return (
    <section className="flex flex-col space-y-3 pb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[18px]">lock_open</span>
          </div>
          <div>
            <span className="text-sm font-bold text-on-surface block leading-tight">
              Target Celengan Aktif
            </span>
            <span className="text-[10px] text-outline">3D Glass Vault Cards</span>
          </div>
        </div>

        {onAddGoal && (
          <button
            onClick={onAddGoal}
            type="button"
            className="text-xs text-primary font-bold flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[15px]">add</span>
            Buat Target
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3.5">
        {goals.length === 0 ? (
          <div className="rounded-3xl bg-surface-container/60 p-6 text-center border border-dashed border-border/70 text-xs text-outline space-y-1">
            <span className="material-symbols-outlined text-[28px] text-primary/60 block mb-1">
              savings
            </span>
            <span className="font-semibold text-on-surface block">Belum ada celengan aktif</span>
            <span>Mulai pisahkan pos tabunganmu untuk mewujudkan impian finansial.</span>
          </div>
        ) : (
          goals.map((goal) => {
            const current = goal.current_amount || 0;
            const pct = Math.min(100, Math.round((current / goal.target_amount) * 100));
            const customImg =
              goal.custom_image ||
              (goal.icon?.startsWith('data:image') || goal.icon?.startsWith('http')
                ? goal.icon
                : null);
            const showCover = Boolean(
              customImg &&
                (goal.image_display_mode === 'cover' ||
                  goal.image_display_mode === 'both' ||
                  !goal.image_display_mode)
            );
            const showIconImg = Boolean(
              customImg &&
                (goal.image_display_mode === 'icon' ||
                  goal.image_display_mode === 'both' ||
                  !goal.image_display_mode)
            );

            return (
              <div
                key={goal.id}
                onClick={() => onGoalClick?.(goal)}
                className="group relative rounded-3xl overflow-hidden p-4 sm:p-5 transition-all duration-300 cursor-pointer active:scale-[0.99] border backdrop-blur-2xl
                  /* 3D Glass Vault Dark */
                  dark:bg-slate-900/80 dark:border-white/10 dark:hover:border-primary/40 dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)]
                  /* 3D Glass Vault Light */
                  bg-white/85 border-slate-200/80 hover:border-primary/50 shadow-[0_12px_35px_rgba(0,0,0,0.06)]
                "
              >
                {/* 3D Photo Cover Glass Texture */}
                {showCover ? (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <img
                      src={customImg!}
                      alt=""
                      className="w-full h-full object-cover opacity-25 filter blur-[1px] transform scale-105 group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/85 to-surface/50" />
                  </div>
                ) : (
                  /* Obsidian Vault Inner Radial Sheen */
                  <div
                    className="absolute inset-0 opacity-15 pointer-events-none transition-opacity duration-500 group-hover:opacity-25"
                    style={{
                      background: `radial-gradient(circle at 85% 20%, ${goal.color || '#2DD4A7'}, transparent 60%)`,
                    }}
                  />
                )}

                {/* Vault Card Header */}
                <div className="relative z-10 flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    {/* Glowing Squircle Icon Badge with Animated Ring */}
                    <div
                      className={`relative w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden shadow-md transition-transform duration-300 group-hover:scale-105 ${
                        showIconImg ? 'ring-2 ring-primary/50' : ''
                      }`}
                      style={{
                        backgroundColor: `${goal.color || '#2DD4A7'}25`,
                        color: goal.color || '#2DD4A7',
                        boxShadow: `0 0 16px ${goal.color || '#2DD4A7'}35`,
                      }}
                    >
                      <GoalIcon
                        icon={
                          showIconImg
                            ? customImg
                            : goal.image_display_mode === 'cover'
                            ? 'savings'
                            : goal.icon
                        }
                        size={24}
                      />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-on-surface truncate block leading-tight group-hover:text-primary transition-colors">
                        {goal.name}
                      </span>
                      <span className="text-[11px] text-outline truncate mt-0.5">
                        {goal.deadline ? `Tenggat: ${goal.deadline}` : 'Target Fleksibel'}
                      </span>
                    </div>
                  </div>

                  {/* Top-Right: Percent Badge & Spring Bounce Top Up Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-extrabold tabular-nums border shadow-sm"
                      style={{
                        backgroundColor: `${goal.color || '#2DD4A7'}20`,
                        color: goal.color || '#2DD4A7',
                        borderColor: `${goal.color || '#2DD4A7'}40`,
                      }}
                    >
                      {pct}%
                    </span>

                    {onTopUp && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTopUp(goal);
                        }}
                        type="button"
                        className="px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-[0_0_12px_rgba(45,212,167,0.4)] hover:shadow-[0_0_20px_rgba(45,212,167,0.65)] active:scale-90 hover:scale-105 transition-all"
                      >
                        <span className="material-symbols-outlined text-[14px]">add</span>
                        <span>Setor</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Animated Shimmer Liquid Progress Bar */}
                <div className="relative z-10 space-y-1.5 pt-1">
                  <div className="w-full bg-black/20 dark:bg-white/10 h-3 rounded-full overflow-hidden p-0.5 backdrop-blur-sm border border-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-700 animate-liquid-shimmer"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${goal.color || '#2DD4A7'}, #38BDF8, ${goal.color || '#2DD4A7'})`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs font-semibold pt-0.5">
                    <span className="text-on-surface font-extrabold tabular-nums">
                      {formatMoney(current)}
                    </span>
                    <span className="text-outline text-[11px] tabular-nums">
                      dari {formatMoney(goal.target_amount)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
