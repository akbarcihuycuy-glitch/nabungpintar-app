import React, { useState, useMemo } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { useGoals } from '../../hooks/useGoals';
import { useAuth } from '../../hooks/useAuth';
import { useSummary } from '../../hooks/useSummary';
import { useFx } from '../../hooks/useFx';
import { calculateSavingsRatio, calculatePercentageChange } from '../../utils/calculations';
import { generateFinancialReportPdf } from '../../services/pdfReport';

interface MonthlyReportScreenProps {
  onBack?: () => void;
}

export const MonthlyReportScreen: React.FC<MonthlyReportScreenProps> = ({ onBack }) => {
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { goals = [] } = useGoals();
  const { user } = useAuth();
  const { data: summary } = useSummary(30);
  const { formatMoney } = useFx();
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Active month index offset (0 = current month, -1 = last month, etc.)
  const [monthOffset, setMonthOffset] = useState<number>(0);

  // Calculate target month year and dates
  const { targetYear, targetMonth, monthLabel, startIso, endIso, prevStartIso, prevEndIso } =
    useMemo(() => {
      const d = new Date();
      d.setMonth(d.getMonth() + monthOffset);

      const y = d.getFullYear();
      const m = d.getMonth(); // 0-indexed

      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
      ];

      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0);

      const prevStart = new Date(y, m - 1, 1);
      const prevEnd = new Date(y, m, 0);

      const toIso = (dt: Date) => dt.toISOString().split('T')[0];

      return {
        targetYear: y,
        targetMonth: m,
        monthLabel: `${monthNames[m]} ${y}`,
        startIso: toIso(start),
        endIso: toIso(end),
        prevStartIso: toIso(prevStart),
        prevEndIso: toIso(prevEnd),
      };
    }, [monthOffset]);

  // Filter current month transactions
  const monthTransactions = useMemo(() => {
    return transactions.filter(
      (t) => t.occurred_on >= startIso && t.occurred_on <= endIso
    );
  }, [transactions, startIso, endIso]);

  // Filter previous month transactions
  const prevMonthTransactions = useMemo(() => {
    return transactions.filter(
      (t) => t.occurred_on >= prevStartIso && t.occurred_on <= prevEndIso
    );
  }, [transactions, prevStartIso, prevEndIso]);

  // Current month totals
  const totalIncome = useMemo(
    () =>
      monthTransactions.reduce(
        (sum, t) => sum + (t.kind === 'income' ? t.amount_base : 0),
        0
      ),
    [monthTransactions]
  );

  const totalExpense = useMemo(
    () =>
      monthTransactions.reduce(
        (sum, t) => sum + (t.kind === 'expense' ? t.amount_base : 0),
        0
      ),
    [monthTransactions]
  );

  const netSavings = totalIncome - totalExpense;
  const savingsRatio = calculateSavingsRatio(totalIncome, totalExpense);

  // Previous month totals for comparison
  const prevIncome = useMemo(
    () =>
      prevMonthTransactions.reduce(
        (sum, t) => sum + (t.kind === 'income' ? t.amount_base : 0),
        0
      ),
    [prevMonthTransactions]
  );

  const prevExpense = useMemo(
    () =>
      prevMonthTransactions.reduce(
        (sum, t) => sum + (t.kind === 'expense' ? t.amount_base : 0),
        0
      ),
    [prevMonthTransactions]
  );

  const incomeChange = calculatePercentageChange(totalIncome, prevIncome);
  const expenseChange = calculatePercentageChange(totalExpense, prevExpense);

  // Category breakdown for expenses
  const categoryBreakdown = useMemo(() => {
    const catMap: Record<string, { name: string; icon: string; color: string; amount: number }> =
      {};

    for (const t of monthTransactions) {
      if (t.kind === 'expense') {
        const catId = t.category_id || 'uncategorized';
        const catInfo = categories.find((c) => c.id === catId);
        const name = catInfo?.name || 'Lain-lain';
        const icon = catInfo?.icon || 'category';
        const color = catInfo?.color || '#85948D';

        if (!catMap[catId]) {
          catMap[catId] = { name, icon, color, amount: 0 };
        }
        catMap[catId].amount += t.amount_base;
      }
    }

    return Object.values(catMap)
      .sort((a, b) => b.amount - a.amount)
      .map((item) => ({
        ...item,
        percentage:
          totalExpense > 0 ? Math.round((item.amount / totalExpense) * 100) : 0,
      }));
  }, [monthTransactions, categories, totalExpense]);

  // Export summary helper with PDF generation
  const handleExport = async () => {
    try {
      setIsExporting(true);
      const userFullName =
        (user?.user_metadata?.full_name as string) ||
        (user?.user_metadata?.name as string) ||
        user?.email?.split('@')[0] ||
        'Pengguna NabungPintar';

      generateFinancialReportPdf({
        monthLabel,
        userFullName,
        userEmail: user?.email || undefined,
        totalIncome,
        totalExpense,
        netSavings,
        savingsRatio,
        healthScore: summary?.health_score?.score ?? 75,
        categories,
        monthTransactions,
        goals,
      });
    } catch (err) {
      console.error('Gagal membuat laporan PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col w-full pb-28 space-y-4">
      {/* Top Header */}
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
            <h1 className="text-lg font-bold text-on-surface">Laporan Bulanan</h1>
            <p className="text-[11px] text-outline">Analisis arus kas & alokasi belanja</p>
          </div>
        </div>

        <button
          onClick={handleExport}
          type="button"
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-on-primary hover:bg-primary/90 text-xs font-bold transition-all active:scale-95 shadow-md shadow-primary/20 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[16px]">
            {isExporting ? 'hourglass_top' : 'picture_as_pdf'}
          </span>
          <span>{isExporting ? 'Memproses...' : 'Unduh PDF'}</span>
        </button>
      </div>

      {/* Month Switcher */}
      <div className="flex items-center justify-between p-2 rounded-2xl bg-surface-container-low border border-border/30 shadow-sm">
        <button
          onClick={() => setMonthOffset((prev) => prev - 1)}
          type="button"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container hover:bg-surface-bright text-outline hover:text-on-surface transition-colors active:scale-95"
          aria-label="Bulan sebelumnya"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-on-surface tracking-wide">
            {monthLabel}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
            {monthTransactions.length} Transaksi
          </span>
        </div>

        <button
          onClick={() => setMonthOffset((prev) => prev + 1)}
          disabled={monthOffset >= 0}
          type="button"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container hover:bg-surface-bright text-outline hover:text-on-surface transition-colors active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Bulan berikutnya"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
        </button>
      </div>

      {/* Hero Summary: 3-Metric Cashflow Deck */}
      <section className="flex flex-col gap-3 p-4 rounded-2xl bg-surface-container border border-border/40 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[18px]">analytics</span>
            <span className="text-xs font-bold text-on-surface">Arus Kas Bulanan</span>
          </div>
          <span className="text-[11px] text-outline">Vs Bulan Lalu</span>
        </div>

        {/* 3 Metrics Grid */}
        <div className="grid grid-cols-3 gap-2">
          {/* Income */}
          <div className="flex flex-col p-3 rounded-xl bg-surface-container-low">
            <div className="flex items-center gap-1 text-primary">
              <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
              <span className="text-[10px] font-bold uppercase">Masuk</span>
            </div>
            <span className="mt-1 text-xs font-bold text-on-surface tabular-nums truncate">
              {formatMoney(totalIncome)}
            </span>
            <span className="text-[10px] text-primary font-medium mt-0.5">
              {typeof incomeChange === 'number'
                ? `${incomeChange > 0 ? '+' : ''}${incomeChange.toFixed(1)}%`
                : '-'}
            </span>
          </div>

          {/* Expense */}
          <div className="flex flex-col p-3 rounded-xl bg-surface-container-low">
            <div className="flex items-center gap-1 text-error">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
              <span className="text-[10px] font-bold uppercase">Keluar</span>
            </div>
            <span className="mt-1 text-xs font-bold text-on-surface tabular-nums truncate">
              {formatMoney(totalExpense)}
            </span>
            <span className="text-[10px] text-error font-medium mt-0.5">
              {typeof expenseChange === 'number'
                ? `${expenseChange > 0 ? '+' : ''}${expenseChange.toFixed(1)}%`
                : '-'}
            </span>
          </div>

          {/* Net Savings */}
          <div className="flex flex-col p-3 rounded-xl bg-surface-container-low">
            <div className="flex items-center gap-1 text-primary">
              <span className="material-symbols-outlined text-[14px]">savings</span>
              <span className="text-[10px] font-bold uppercase">Bersih</span>
            </div>
            <span
              className={`mt-1 text-xs font-bold tabular-nums truncate ${
                netSavings >= 0 ? 'text-primary' : 'text-error'
              }`}
            >
              {formatMoney(netSavings)}
            </span>
            <span className="text-[10px] text-primary font-medium mt-0.5">
              {savingsRatio !== null ? `${savingsRatio}% rasio` : '0%'}
            </span>
          </div>
        </div>

        {/* Visual Allocation Stack Bar */}
        {totalIncome > 0 && (
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex justify-between items-center text-[11px] text-outline">
              <span>Alokasi Pendapatan</span>
              <span className="text-on-surface-variant font-medium">
                Disimpan {Math.max(0, savingsRatio || 0)}% • Belanja{' '}
                {Math.min(100, Math.round((totalExpense / totalIncome) * 100))}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-surface-container-highest overflow-hidden flex">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${Math.max(0, savingsRatio || 0)}%` }}
              />
              <div
                className="h-full bg-error/70 transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.round((totalExpense / totalIncome) * 100))}%`,
                }}
              />
            </div>
          </div>
        )}
      </section>

      {/* Category Breakdown */}
      <div className="bg-surface-container rounded-2xl p-4 shadow-sm border border-border/40 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-on-surface">Distribusi Pengeluaran</h3>
            <p className="text-xs text-outline">Berdasarkan kategori belanja bulan ini</p>
          </div>
          <span className="text-xs font-bold text-on-surface tabular-nums">
            {formatMoney(totalExpense)}
          </span>
        </div>

        {categoryBreakdown.length === 0 ? (
          <div className="py-6 text-center text-xs text-outline">
            Belum ada pengeluaran pada periode {monthLabel}
          </div>
        ) : (
          <div className="flex flex-col gap-3 pt-1">
            {categoryBreakdown.map((cat, idx) => (
              <div key={idx} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${cat.color}20`,
                        color: cat.color,
                      }}
                    >
                      <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                    </div>
                    <span className="font-semibold text-on-surface">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-on-surface tabular-nums">
                      {formatMoney(cat.amount)}
                    </span>
                    <span className="text-[11px] text-outline font-semibold w-8 text-right">
                      {cat.percentage}%
                    </span>
                  </div>
                </div>

                <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

