import React, { useState, useMemo } from 'react';
import { SavingsGoal } from '../../types/database';
import { useFx } from '../../hooks/useFx';
import { calculateGoalProjection } from '../../utils/projections';
import { useGoalEntries } from '../../hooks/useGoals';
import { GoalIcon } from '../common/GoalIcon';
import { getAllGoalAlarms } from '../../services/alarm';

interface TargetListScreenProps {
  goals: SavingsGoal[];
  isLoading: boolean;
  onOpenCreateSheet: () => void;
  onOpenTopUpSheet: (goal?: SavingsGoal) => void;
  onSelectGoal: (goal: SavingsGoal) => void;
}

type SortOption = 'priority' | 'deadline' | 'progress';

export const TargetListScreen: React.FC<TargetListScreenProps> = ({
  goals,
  isLoading,
  onOpenCreateSheet,
  onOpenTopUpSheet,
  onSelectGoal,
}) => {
  const { formatMoney } = useFx();
  const [sortBy, setSortBy] = useState<SortOption>('priority');

  // Compute aggregate totals
  const totalTarget = useMemo(
    () => goals.reduce((sum, g) => sum + g.target_amount, 0),
    [goals]
  );
  const totalCollected = useMemo(
    () => goals.reduce((sum, g) => sum + (g.current_amount || 0), 0),
    [goals]
  );
  const overallPct = totalTarget > 0 ? Math.min(100, Math.round((totalCollected / totalTarget) * 100)) : 0;

  const countActive = goals.filter((g) => (g.current_amount || 0) < g.target_amount).length;
  const countCompleted = goals.filter((g) => (g.current_amount || 0) >= g.target_amount).length;
  const countAttention = goals.filter((g) => {
    const pct = g.target_amount > 0 ? ((g.current_amount || 0) / g.target_amount) * 100 : 0;
    return pct < 30 && g.deadline;
  }).length;

  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) => {
      if (sortBy === 'deadline') {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.localeCompare(b.deadline);
      }
      if (sortBy === 'progress') {
        const pctA = (a.current_amount || 0) / a.target_amount;
        const pctB = (b.current_amount || 0) / b.target_amount;
        return pctB - pctA;
      }
      // default: active first, then by created_at
      const aDone = (a.current_amount || 0) >= a.target_amount;
      const bDone = (b.current_amount || 0) >= b.target_amount;
      if (aDone !== bDone) return aDone ? 1 : -1;
      return b.created_at.localeCompare(a.created_at);
    });
  }, [goals, sortBy]);

  return (
    <div className="flex flex-col w-full pb-28 space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-[22px]">savings</span>
          </div>
          <div>
            <h1 className="text-title-lg font-bold text-on-surface">Target Tabungan</h1>
            <p className="text-xs text-outline">Wujudkan Impian Finansialmu</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCreateSheet}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-black text-xs font-bold shadow-glow hover:brightness-105 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Target Baru</span>
          </button>
        </div>
      </div>

      {/* Top Summary Banner / Total Celengan Overview */}
      <section className="w-full">
        <div className="rounded-2xl bg-surface-container-low p-4 shadow-sm relative overflow-hidden border border-border/40">
          {/* Ambient Decorative Mint Aura */}
          <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">account_balance_wallet</span>
                <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                  Total Tabungan Terkumpul
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-bold tabular-nums">
                {overallPct}% Tercapai
              </span>
            </div>

            <div className="flex flex-col">
              <div className="text-2xl font-bold text-on-surface tracking-tight tabular-nums">
                {formatMoney(totalCollected)}
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                dari total akumulasi target{' '}
                <span className="text-on-surface font-semibold tabular-nums">{formatMoney(totalTarget)}</span>
              </p>
            </div>

            {/* Master Overall Progress Track */}
            <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden my-1">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${overallPct}%` }}
              />
            </div>

            {/* Summary Metric Pills */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-container text-center">
                <span className="text-[10px] text-on-surface-variant uppercase font-medium">Aktif</span>
                <span className="text-sm text-primary font-bold">{countActive} Target</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-container text-center">
                <span className="text-[10px] text-on-surface-variant uppercase font-medium">Tercapai</span>
                <span className="text-sm text-tertiary font-bold">{countCompleted} Selesai</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-container text-center">
                <span className="text-[10px] text-on-surface-variant uppercase font-medium">Perhatian</span>
                <span className="text-sm text-error font-bold">{countAttention} Pos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter & Sort Controls */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold text-on-surface">Daftar Celengan ({goals.length})</h2>
        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
          <span>Urutkan:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-surface-container text-on-surface text-xs rounded-lg px-2.5 py-1 border border-border/50 focus:outline-none focus:border-primary"
          >
            <option value="priority">Prioritas</option>
            <option value="deadline">Tenggat Waktu</option>
            <option value="progress">Capaian %</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      {goals.length === 0 ? (
        <div className="p-8 rounded-2xl bg-surface-container-low border border-dashed border-border/60 text-center flex flex-col items-center justify-center my-4">
          <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary mb-3 shadow-inner">
            <span className="material-symbols-outlined text-[28px]">savings</span>
          </div>
          <h3 className="text-base font-bold text-on-surface mb-1">Belum ada target. Buat kantong pertamamu</h3>
          <p className="text-xs text-on-surface-variant max-w-xs mb-5 leading-relaxed">
            Pisahkan dana darurat, liburan impian, gadget, atau modal bisnis agar tabungan tidak terpakai tanpa sengaja.
          </p>
          <button
            onClick={onOpenCreateSheet}
            type="button"
            className="px-5 py-2.5 rounded-xl bg-primary text-black font-bold text-xs shadow-glow hover:brightness-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Buat Target Pertama Sekarang</span>
          </button>
        </div>
      ) : (
        /* Goals List */
        <div className="flex flex-col gap-3">
          {sortedGoals.map((goal) => {
            const current = goal.current_amount || 0;
            const pct = Math.min(100, Math.round((current / goal.target_amount) * 100));
            const isCompleted = pct >= 100;

            // Simple monthly estimate calculation
            let monthlyRec = 0;
            if (goal.deadline) {
              const diffMs = new Date(goal.deadline).getTime() - Date.now();
              const diffMonths = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24 * 30)));
              const remaining = Math.max(0, goal.target_amount - current);
              monthlyRec = Math.round(remaining / diffMonths);
            }

            const allAlarms = getAllGoalAlarms();
            const hasAlarm = allAlarms[goal.id]?.enabled;
            const customImg = goal.custom_image || (goal.icon?.startsWith('data:image') || goal.icon?.startsWith('http') ? goal.icon : null);
            const showCover = Boolean(customImg && (goal.image_display_mode === 'cover' || goal.image_display_mode === 'both' || !goal.image_display_mode));
            const showIconImg = Boolean(customImg && (goal.image_display_mode === 'icon' || goal.image_display_mode === 'both' || !goal.image_display_mode));

            return (
              <div
                key={goal.id}
                onClick={() => onSelectGoal(goal)}
                className="group relative rounded-3xl overflow-hidden p-4 sm:p-5 transition-all duration-300 cursor-pointer active:scale-[0.99] border backdrop-blur-2xl
                  /* 3D Glass Vault Dark */
                  dark:bg-slate-900/80 dark:border-white/10 dark:hover:border-primary/40 dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)]
                  /* 3D Glass Vault Light */
                  bg-white/85 border-slate-200/80 hover:border-primary/50 shadow-[0_12px_35px_rgba(0,0,0,0.06)]
                "
              >
                {/* Background Glass Cover Image (Mode Both / Cover) */}
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
                  <div
                    className="absolute inset-0 opacity-15 pointer-events-none transition-opacity duration-500 group-hover:opacity-25"
                    style={{
                      background: `radial-gradient(circle at 85% 20%, ${goal.color || '#2DD4A7'}, transparent 60%)`,
                    }}
                  />
                )}

                {/* Header */}
                <div className="relative z-10 flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`relative w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-transform duration-300 group-hover:scale-105 ${
                        showIconImg ? 'ring-2 ring-primary/40 shadow-glow' : ''
                      }`}
                      style={{
                        backgroundColor: `${goal.color || '#2DD4A7'}25`,
                        color: goal.color || '#2DD4A7',
                        boxShadow: `0 0 16px ${goal.color || '#2DD4A7'}35`,
                      }}
                    >
                      <GoalIcon
                        icon={showIconImg ? customImg : (goal.image_display_mode === 'cover' ? 'savings' : goal.icon)}
                        size={24}
                      />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                          {goal.name}
                        </h3>
                        {hasAlarm && (
                          <span
                            className="inline-flex items-center text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/20"
                            title={`Alarm aktif: ${allAlarms[goal.id]?.time}`}
                          >
                            <span className="material-symbols-outlined text-[12px] mr-0.5">alarm</span>
                            {allAlarms[goal.id]?.time}
                          </span>
                        )}
                        {isCompleted && (
                          <span className="material-symbols-outlined text-[16px] text-primary">
                            verified
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {isCompleted ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/30">
                            Tercapai 100%
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                            style={{
                              backgroundColor: `${goal.color || '#2DD4A7'}15`,
                              color: goal.color || '#2DD4A7',
                              borderColor: `${goal.color || '#2DD4A7'}30`,
                            }}
                          >
                            {pct < 30 ? 'Perlu Ditingkatkan' : 'Sesuai Jalur'}
                          </span>
                        )}
                        <span className="text-[11px] text-outline">
                          • {goal.deadline ? `Tenggat: ${goal.deadline}` : 'Fleksibel'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Spring Bounce Top Up Neon Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenTopUpSheet(goal);
                    }}
                    type="button"
                    className="px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-extrabold flex items-center gap-1 shadow-[0_0_12px_rgba(45,212,167,0.4)] hover:shadow-[0_0_20px_rgba(45,212,167,0.65)] active:scale-90 hover:scale-105 transition-all"
                  >
                    <span className="material-symbols-outlined text-[15px] font-bold">add</span>
                    <span>Setor</span>
                  </button>
                </div>

                {/* Animated Shimmer Liquid Progress Bar & Figures */}
                <div className="relative z-10 bg-black/15 dark:bg-white/5 rounded-2xl p-3 mb-2 flex flex-col gap-1.5 border border-white/10 backdrop-blur-md">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-outline font-medium">Terkumpul</span>
                    <span
                      className="font-extrabold tabular-nums"
                      style={{ color: goal.color || '#2DD4A7' }}
                    >
                      {pct}%
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-extrabold text-on-surface tabular-nums">
                      {formatMoney(current)}
                    </span>
                    <span className="text-xs text-outline tabular-nums">
                      dari {formatMoney(goal.target_amount)}
                    </span>
                  </div>

                  <div className="w-full h-3 rounded-full bg-black/20 dark:bg-white/10 overflow-hidden p-0.5 mt-1 border border-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-700 animate-liquid-shimmer"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${goal.color || '#2DD4A7'}, #38BDF8, ${goal.color || '#2DD4A7'})`,
                      }}
                    />
                  </div>
                </div>

                {/* Bottom detail pill */}
                <div className="flex items-center justify-between text-[11px] text-on-surface-variant px-0.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full inline-block"
                      style={{ backgroundColor: goal.color || '#2DD4A7' }}
                    />
                    <span>{isCompleted ? 'Target Selesai' : 'Sisa kebutuhan: ' + formatMoney(Math.max(0, goal.target_amount - current))}</span>
                  </div>

                  {!isCompleted && monthlyRec > 0 && (
                    <div className="flex items-center gap-1 text-primary font-medium tabular-nums">
                      <span className="material-symbols-outlined text-[13px]">event_repeat</span>
                      <span>{formatMoney(monthlyRec)}/bln</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

