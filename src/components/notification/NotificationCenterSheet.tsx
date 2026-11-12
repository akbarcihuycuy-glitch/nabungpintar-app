import React, { useState } from 'react';
import { SavingsGoal, Category, Transaction } from '../../types/database';
import { GoalIcon } from '../common/GoalIcon';
import { useFx } from '../../hooks/useFx';
import { getAllGoalAlarms, removeGoalAlarm, playChimeSound, GoalAlarmConfig } from '../../services/alarm';

interface NotificationCenterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  goals: SavingsGoal[];
  categories: Category[];
  transactions: Transaction[];
  onTopUp: (goal: SavingsGoal) => void;
  onNavigateToCategories?: () => void;
}

export const NotificationCenterSheet: React.FC<NotificationCenterSheetProps> = ({
  isOpen,
  onClose,
  goals,
  categories,
  transactions,
  onTopUp,
  onNavigateToCategories,
}) => {
  const { formatMoney } = useFx();
  const [activeTab, setActiveTab] = useState<'all' | 'goals' | 'budget'>('all');
  const [alarms, setAlarms] = useState<Record<string, GoalAlarmConfig>>(() => getAllGoalAlarms());

  if (!isOpen) return null;

  // 1. Calculate Monthly Expense per Category
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7); // "YYYY-MM"
  const currentMonthTransactions = transactions.filter(
    (t) => t.occurred_on.startsWith(currentMonth) && t.kind === 'expense'
  );

  const categorySpentMap: Record<string, number> = {};
  for (const t of currentMonthTransactions) {
    const cid = t.category_id || 'uncategorized';
    categorySpentMap[cid] = (categorySpentMap[cid] || 0) + t.amount_base;
  }

  // Categories with monthly budget set
  const budgetAlerts = categories
    .filter((cat) => (cat.monthly_budget || 0) > 0)
    .map((cat) => {
      const budget = cat.monthly_budget || 0;
      const spent = categorySpentMap[cat.id] || 0;
      const pct = Math.round((spent / budget) * 100);
      return {
        category: cat,
        budget,
        spent,
        pct,
        isOver: spent >= budget,
        isWarning: spent >= budget * 0.75 && spent < budget,
      };
    })
    .filter((item) => item.pct >= 75)
    .sort((a, b) => b.pct - a.pct);

  // 2. Goal reminders / alarms
  const goalReminders = goals
    .filter((g) => {
      const alarm = alarms[g.id];
      const hasAlarm = (alarm && alarm.enabled) || g.reminder_enabled;
      const isComplete = (g.current_amount || 0) >= g.target_amount;
      return hasAlarm && !isComplete;
    })
    .map((g) => {
      const alarm = alarms[g.id];
      const time = alarm?.time || g.reminder_time || '20:00';
      const freq = alarm?.frequency || g.reminder_frequency || 'daily';
      return { goal: g, time, freq };
    });

  // Also include goals with deadline past due or due within 7 days
  const todayStr = now.toISOString().split('T')[0];
  const dueGoals = goals.filter((g) => {
    if (!g.deadline || (g.current_amount || 0) >= g.target_amount) return false;
    const diffDays = Math.ceil(
      (new Date(g.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays <= 7;
  });

  const totalNotifs = budgetAlerts.length + goalReminders.length + dueGoals.length;

  const handleRemoveAlarm = (goalId: string) => {
    removeGoalAlarm(goalId);
    setAlarms(getAllGoalAlarms());
  };

  const handleTestSound = () => {
    playChimeSound();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md max-h-[85vh] bg-surface/95 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-white/10 flex flex-col text-on-surface overflow-hidden">
        {/* Glow Accents */}
        <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-primary/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />

        {/* Top Handle for mobile */}
        <div className="w-12 h-1.5 bg-border/60 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-sm">
              <span className="material-symbols-outlined text-[20px]">notifications_active</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-on-surface">Pusat Notifikasi</h2>
                {totalNotifs > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 font-bold border border-rose-500/30">
                    {totalNotifs} Perlu Perhatian
                  </span>
                )}
              </div>
              <p className="text-[11px] text-outline">Pengingat target & peringatan batas budget</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleTestSound}
              type="button"
              className="p-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-outline hover:text-primary transition-all active:scale-95"
              title="Uji Suara Chime"
            >
              <span className="material-symbols-outlined text-[18px]">volume_up</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Tabs Filter */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-border/20 bg-surface-container-low/50">
          <button
            onClick={() => setActiveTab('all')}
            type="button"
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-primary text-on-primary shadow-sm shadow-primary/20'
                : 'text-outline hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            Semua ({totalNotifs})
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            type="button"
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'goals'
                ? 'bg-primary text-on-primary shadow-sm shadow-primary/20'
                : 'text-outline hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            Target ({goalReminders.length + dueGoals.length})
          </button>
          <button
            onClick={() => setActiveTab('budget')}
            type="button"
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'budget'
                ? 'bg-primary text-on-primary shadow-sm shadow-primary/20'
                : 'text-outline hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            Anggaran ({budgetAlerts.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {totalNotifs === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                <span className="material-symbols-outlined text-[32px]">task_alt</span>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-on-surface">Semua Terkendali!</h4>
                <p className="text-xs text-outline max-w-[240px]">
                  Tidak ada target menabung yang tertinggal dan seluruh anggaran bulanan dalam kondisi aman.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Section: Budget Alerts */}
              {(activeTab === 'all' || activeTab === 'budget') && budgetAlerts.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-outline tracking-wider uppercase">
                      Peringatan Batas Anggaran ({budgetAlerts.length})
                    </span>
                    {onNavigateToCategories && (
                      <button
                        onClick={() => {
                          onClose();
                          onNavigateToCategories();
                        }}
                        type="button"
                        className="text-[11px] font-semibold text-primary hover:underline"
                      >
                        Kelola Budget
                      </button>
                    )}
                  </div>

                  {budgetAlerts.map(({ category, budget, spent, pct, isOver }) => (
                    <div
                      key={category.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isOver
                          ? 'bg-rose-500/10 border-rose-500/30'
                          : 'bg-amber-500/10 border-amber-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: `${category.color || '#2DD4A7'}25`,
                              color: category.color || '#2DD4A7',
                            }}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {category.icon || 'category'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-on-surface truncate block">
                              {category.name}
                            </span>
                            <span className="text-[11px] text-outline tabular-nums">
                              Terpakai {formatMoney(spent)} / {formatMoney(budget)}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-xs font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                            isOver
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {pct}% {isOver ? 'Lewat Batas!' : 'Waspada'}
                        </span>
                      </div>

                      <div className="mt-2.5 w-full bg-surface-container-highest/60 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOver ? 'bg-rose-500' : 'bg-amber-400'
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Section: Due or Approaching Goals */}
              {(activeTab === 'all' || activeTab === 'goals') && dueGoals.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold text-outline tracking-wider uppercase">
                    Tenggat Waktu Menabung ({dueGoals.length})
                  </span>

                  {dueGoals.map((g) => {
                    const current = g.current_amount || 0;
                    const diffDays = Math.ceil(
                      (new Date(g.deadline!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const isOverdue = diffDays < 0;

                    return (
                      <div
                        key={g.id}
                        className="p-3.5 rounded-2xl bg-surface-container-high/60 border border-border/40 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                              style={{
                                backgroundColor: `${g.color || '#2DD4A7'}20`,
                                color: g.color || '#2DD4A7',
                              }}
                            >
                              <GoalIcon icon={g.icon} size={20} />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-on-surface truncate block">
                                {g.name}
                              </span>
                              <span
                                className={`text-[10px] font-bold ${
                                  isOverdue ? 'text-rose-400' : 'text-amber-400'
                                }`}
                              >
                                {isOverdue
                                  ? `Lewat tenggat ${Math.abs(diffDays)} hari lalu`
                                  : diffDays === 0
                                  ? 'Jatuh tempo hari ini!'
                                  : `Sisa ${diffDays} hari lagi`}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              onClose();
                              onTopUp(g);
                            }}
                            type="button"
                            className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold transition-all active:scale-95 shrink-0 shadow-sm"
                          >
                            Setor Sekarang
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-outline pt-0.5">
                          <span>Progress: {Math.round((current / g.target_amount) * 100)}%</span>
                          <span className="tabular-nums font-semibold text-on-surface">
                            {formatMoney(current)} / {formatMoney(g.target_amount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Section: Goal Alarms & Daily Reminders */}
              {(activeTab === 'all' || activeTab === 'goals') && goalReminders.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold text-outline tracking-wider uppercase">
                    Alarm Pengingat Aktif ({goalReminders.length})
                  </span>

                  {goalReminders.map(({ goal, time, freq }) => (
                    <div
                      key={goal.id}
                      className="p-3.5 rounded-2xl bg-surface-container-high/60 border border-border/40 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                          style={{
                            backgroundColor: `${goal.color || '#2DD4A7'}20`,
                            color: goal.color || '#2DD4A7',
                          }}
                        >
                          <GoalIcon icon={goal.icon} size={20} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-on-surface truncate block">
                            {goal.name}
                          </span>
                          <div className="flex items-center gap-1.5 text-[11px] text-outline">
                            <span className="material-symbols-outlined text-[13px] text-primary">
                              alarm
                            </span>
                            <span>
                              {time} WIB • {freq === 'daily' ? 'Harian' : freq === 'weekly' ? 'Mingguan' : 'Bulanan'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            onClose();
                            onTopUp(goal);
                          }}
                          type="button"
                          className="px-2.5 py-1.5 rounded-xl bg-primary/15 text-primary hover:bg-primary hover:text-on-primary text-xs font-bold transition-all active:scale-95"
                        >
                          Setor
                        </button>
                        <button
                          onClick={() => handleRemoveAlarm(goal.id)}
                          type="button"
                          className="w-7 h-7 rounded-lg bg-surface-container hover:bg-surface-container-highest flex items-center justify-center text-outline hover:text-rose-400 transition-colors"
                          title="Hapus Alarm"
                        >
                          <span className="material-symbols-outlined text-[15px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-surface-container-low/70 border-t border-border/20 text-center">
          <p className="text-[10px] text-outline">
            Alarm Web Audio API berbunyi otomatis dan disinkronkan ke seluruh perangkat Anda.
          </p>
        </div>
      </div>
    </div>
  );
};
