import React from 'react';
import { Category, Transaction } from '../../types/database';
import { useFx } from '../../hooks/useFx';
import { GoalIcon } from '../common/GoalIcon';

interface BudgetTrackerCardProps {
  categories: Category[];
  transactions: Transaction[];
  onManageCategories?: () => void;
}

export const BudgetTrackerCard: React.FC<BudgetTrackerCardProps> = ({
  categories,
  transactions,
  onManageCategories,
}) => {
  const { formatMoney } = useFx();

  // Current year-month (YYYY-MM) in WIB
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthNameIndo = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  // Sum expenses per category for this month
  const expenseMap: Record<string, number> = {};
  for (const t of transactions) {
    if (t.kind === 'expense' && t.occurred_on.startsWith(currentMonthPrefix) && t.category_id) {
      expenseMap[t.category_id] = (expenseMap[t.category_id] || 0) + (t.amount_base || t.amount_original || 0);
    }
  }

  // Filter categories that have budgets or expenses
  const budgetedCategories = categories
    .filter((c) => c.kind === 'expense' && (c.monthly_budget || 0) > 0)
    .sort((a, b) => {
      const pctA = ((expenseMap[a.id] || 0) / (a.monthly_budget || 1)) * 100;
      const pctB = ((expenseMap[b.id] || 0) / (b.monthly_budget || 1)) * 100;
      return pctB - pctA; // Highest usage first
    });

  // Calculate total budget & total spent
  const totalBudget = budgetedCategories.reduce((sum, c) => sum + (c.monthly_budget || 0), 0);
  const totalSpentInBudgeted = budgetedCategories.reduce((sum, c) => sum + (expenseMap[c.id] || 0), 0);
  const totalOverallPct = totalBudget > 0 ? Math.round((totalSpentInBudgeted / totalBudget) * 100) : 0;

  return (
    <section className="rounded-3xl bg-surface-container p-5 shadow-sm border border-border/40 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">account_balance</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-on-surface">Pantauan Anggaran Bulan Ini</h3>
            <p className="text-[10px] text-outline capitalize">{monthNameIndo}</p>
          </div>
        </div>

        {onManageCategories && (
          <button
            onClick={onManageCategories}
            type="button"
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5"
          >
            <span>Atur Batas</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        )}
      </div>

      {budgetedCategories.length === 0 ? (
        <div className="p-4 rounded-2xl bg-surface-container-high/60 border border-dashed border-border/60 text-center space-y-2">
          <p className="text-xs text-on-surface-variant">
            Belum ada batas anggaran bulanan yang ditentukan.
          </p>
          <p className="text-[10px] text-outline">
            Tentukan batas belanja untuk pos makan, hiburan, dll agar pengeluaran terkendali.
          </p>
          {onManageCategories && (
            <button
              onClick={onManageCategories}
              type="button"
              className="mt-1 px-3.5 py-1.5 rounded-xl bg-primary/20 text-primary text-xs font-bold hover:bg-primary/30 transition-colors"
            >
              + Buat Batas Anggaran
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {/* Overall Budget Progress Pill */}
          <div className="p-3 rounded-2xl bg-surface-container-high/70 border border-border/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-outline uppercase font-semibold block">
                Total Pemakaian Anggaran
              </span>
              <span className="text-xs font-bold text-on-surface tabular-nums">
                {formatMoney(totalSpentInBudgeted)} / {formatMoney(totalBudget)}
              </span>
            </div>
            <div className="text-right">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md tabular-nums ${
                  totalOverallPct >= 100
                    ? 'bg-rose-500/20 text-rose-400'
                    : totalOverallPct >= 75
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {totalOverallPct}% Terpakai
              </span>
            </div>
          </div>

          {/* List of Budgeted Categories */}
          <div className="space-y-3">
            {budgetedCategories.map((cat) => {
              const spent = expenseMap[cat.id] || 0;
              const budget = cat.monthly_budget || 1;
              const pct = Math.round((spent / budget) * 100);
              const remaining = budget - spent;
              const isOver = spent > budget;
              const isWarning = pct >= 75 && pct < 100;

              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
                        style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                      >
                        <GoalIcon icon={cat.icon} size={16} />
                      </div>
                      <span className="font-semibold text-on-surface truncate">{cat.name}</span>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-[11px] font-bold tabular-nums ${
                          isOver
                            ? 'text-rose-400'
                            : isWarning
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {pct}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver
                          ? 'bg-rose-500 animate-pulse'
                          : isWarning
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-outline tabular-nums">
                    <span>Terpakai {formatMoney(spent)}</span>
                    <span>
                      {isOver
                        ? `Lebih ${formatMoney(Math.abs(remaining))}`
                        : `Sisa ${formatMoney(remaining)}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

