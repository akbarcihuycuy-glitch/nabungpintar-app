import {
  Transaction,
  SavingsEntry,
  HealthScoreResult,
  DailyCashflowItem,
} from '../types/database';
import { getWIBDate } from './formatters';

/**
 * Filter transactions within a date range [startDate, endDate] inclusive (YYYY-MM-DD)
 */
export function filterTransactionsByDate(
  transactions: Transaction[],
  startDate: string,
  endDate: string
): Transaction[] {
  return transactions.filter(
    (t) => t.occurred_on >= startDate && t.occurred_on <= endDate
  );
}

/**
 * Calculate dates for current and previous periods in WIB
 */
export function getPeriodWindows(days: 7 | 30) {
  const today = new Date();
  const formatOffset = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - offsetDays);
    return getWIBDate(d);
  };

  const currEnd = formatOffset(0);
  const currStart = formatOffset(days - 1);
  const prevEnd = formatOffset(days);
  const prevStart = formatOffset(2 * days - 1);

  return { currStart, currEnd, prevStart, prevEnd };
}

/**
 * Section 3.1 & 3.2: Balance calculations
 */
export function calculateBalances(
  transactions: Transaction[],
  savingsEntries: SavingsEntry[] = []
) {
  let allIncome = 0;
  let allExpense = 0;

  for (const t of transactions) {
    if (t.kind === 'income') allIncome += t.amount_base;
    if (t.kind === 'expense') allExpense += t.amount_base;
  }

  let allTopUp = 0;
  let allWithdraw = 0;

  for (const s of savingsEntries) {
    if (s.kind === 'topup') allTopUp += s.amount;
    if (s.kind === 'withdraw') allWithdraw += s.amount;
  }

  // Total Tabungan = SUM(topup) - SUM(withdraw)
  const totalTabungan = allTopUp - allWithdraw;

  // Saldo Kas = SUM(income) - SUM(expense) - SUM(topup) + SUM(withdraw)
  const saldoKas = allIncome - allExpense - totalTabungan;

  // Total Saldo = Saldo Kas + Total Tabungan = SUM(income) - SUM(expense)
  const totalSaldo = saldoKas + totalTabungan;

  return { saldoKas, totalTabungan, totalSaldo, allIncome, allExpense };
}

/**
 * Section 3.3: Savings ratio (%)
 * Rasio Menabung = (Pemasukan - Pengeluaran) / Pemasukan x 100
 */
export function calculateSavingsRatio(income: number, expense: number): number | null {
  if (income <= 0) return null;
  return ((income - expense) / income) * 100;
}

export function getSavingsRatioStatus(ratio: number | null): 'Sangat Baik' | 'Baik' | 'Cukup' | 'Rendah' | 'Kritis' | '-' {
  if (ratio === null) return '-';
  if (ratio >= 30) return 'Sangat Baik';
  if (ratio >= 20) return 'Baik';
  if (ratio >= 10) return 'Cukup';
  if (ratio >= 0) return 'Rendah';
  return 'Kritis';
}

/**
 * Section 3.4: Percentage change
 * Perubahan % = (Nilai Sekarang - Nilai Sebelumnya) / Nilai Sebelumnya x 100
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): number | null | 'Baru' {
  if (previous === 0 && current > 0) return 'Baru';
  if (previous === 0 && current === 0) return null;
  return ((current - previous) / previous) * 100;
}

/**
 * Generate daily cashflow time series for chart
 */
export function generateDailyCashflowSeries(
  transactions: Transaction[],
  days: 7 | 30
): DailyCashflowItem[] {
  const result: DailyCashflowItem[] = [];
  const today = new Date();

  // Create date map
  const dailyMap: Record<string, { income: number; expense: number }> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = getWIBDate(d);
    dailyMap[dateStr] = { income: 0, expense: 0 };
  }

  for (const t of transactions) {
    if (dailyMap[t.occurred_on]) {
      if (t.kind === 'income') dailyMap[t.occurred_on].income += t.amount_base;
      if (t.kind === 'expense') dailyMap[t.occurred_on].expense += t.amount_base;
    }
  }

  for (const [date, data] of Object.entries(dailyMap)) {
    result.push({
      date,
      income: data.income,
      expense: data.expense,
    });
  }

  return result;
}

/**
 * Section 3.5: Skor Kesehatan Keuangan (0 - 100)
 * Weights: 40 (Rasio) / 30 (Dana Darurat) / 20 (Tren Pengeluaran) / 10 (Konsistensi)
 */
export function calculateHealthScore(
  transactions: Transaction[],
  savingsEntries: SavingsEntry[] = []
): HealthScoreResult {
  // Check minimum 7 days data condition
  if (transactions.length === 0) {
    return {
      score: 0,
      label: 'Cukup',
      badgeColor: 'warning',
      eligible: false,
      reason: 'Belum ada transaksi. Catat transaksi untuk melihat skor.',
      subScores: {
        savingsRatio: { score: 0, max: 40, percentage: 0 },
        emergencyFund: { score: 0, max: 30, percentage: 0 },
        expenseTrend: { score: 0, max: 20, percentage: 0 },
        consistency: { score: 0, max: 10, percentage: 0 },
      },
    };
  }

  // Find oldest transaction date
  let oldestDate = getWIBDate();
  for (const t of transactions) {
    if (t.occurred_on < oldestDate) oldestDate = t.occurred_on;
  }

  const todayStr = getWIBDate();
  const diffDays = Math.max(
    1,
    Math.round(
      (new Date(todayStr).getTime() - new Date(oldestDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  if (diffDays < 7) {
    return {
      score: 0,
      label: 'Cukup',
      badgeColor: 'warning',
      eligible: false,
      reason: 'Data belum cukup (butuh minimal 7 hari)',
      subScores: {
        savingsRatio: { score: 0, max: 40, percentage: 0 },
        emergencyFund: { score: 0, max: 30, percentage: 0 },
        expenseTrend: { score: 0, max: 20, percentage: 0 },
        consistency: { score: 0, max: 10, percentage: 0 },
      },
    };
  }

  // Calculate 30-day window
  const { currStart, currEnd, prevStart, prevEnd } = getPeriodWindows(30);
  const curr30Tx = filterTransactionsByDate(transactions, currStart, currEnd);
  const prev30Tx = filterTransactionsByDate(transactions, prevStart, prevEnd);

  const currIncome = curr30Tx.reduce(
    (acc, t) => acc + (t.kind === 'income' ? t.amount_base : 0),
    0
  );
  const currExpense = curr30Tx.reduce(
    (acc, t) => acc + (t.kind === 'expense' ? t.amount_base : 0),
    0
  );
  const prevExpense = prev30Tx.reduce(
    (acc, t) => acc + (t.kind === 'expense' ? t.amount_base : 0),
    0
  );

  // 1. Rasio Menabung (Bobot 40): MIN(MAX(rasio, 0) / 20, 1) x 40
  const ratio = calculateSavingsRatio(currIncome, currExpense);
  const nonNegRatio = ratio ? Math.max(0, ratio) : 0;
  const savingsRatioScore = Math.min(nonNegRatio / 20, 1) * 40;

  // 2. Dana Darurat (Bobot 30): MIN(Total Tabungan / (rata-rata pengeluaran bulanan 3 bulan x 6), 1) x 30
  const { totalTabungan } = calculateBalances(transactions, savingsEntries);
  // Estimate monthly expense from available data
  const monthlyExpense = currExpense > 0 ? currExpense : prevExpense;
  let emergencyScore = 0;
  if (monthlyExpense <= 0) {
    emergencyScore = totalTabungan > 0 ? 30 : 15;
  } else {
    const idealEmergencyFund = monthlyExpense * 6;
    emergencyScore = Math.min(totalTabungan / idealEmergencyFund, 1) * 30;
  }

  // 3. Tren Pengeluaran (Bobot 20): Jika perubahan 30 vs 30 <= 0: 20; jika naik: 20 x MAX(0, 1 - perubahan/50)
  const expenseChange = calculatePercentageChange(currExpense, prevExpense);
  let expenseTrendScore = 20;
  if (expenseChange === 'Baru' || (typeof expenseChange === 'number' && expenseChange > 0)) {
    const changeNum = typeof expenseChange === 'number' ? expenseChange : 15;
    expenseTrendScore = 20 * Math.max(0, 1 - changeNum / 50);
  }

  // 4. Konsistensi Pencatatan (Bobot 10): (jumlah hari berbeda yang punya transaksi dalam 30 hari / 30) x 10, maks 10
  const distinctDays = new Set(curr30Tx.map((t) => t.occurred_on)).size;
  const consistencyScore = Math.min((distinctDays / 30) * 10, 10);

  const rawScore =
    savingsRatioScore + emergencyScore + expenseTrendScore + consistencyScore;
  const score = Math.min(100, Math.max(0, Math.round(rawScore)));

  let label: HealthScoreResult['label'] = 'Cukup';
  let badgeColor: HealthScoreResult['badgeColor'] = 'warning';

  if (score >= 80) {
    label = 'Sangat Sehat';
    badgeColor = 'income';
  } else if (score >= 60) {
    label = 'Baik';
    badgeColor = 'primary';
  } else if (score >= 40) {
    label = 'Cukup';
    badgeColor = 'warning';
  } else if (score >= 20) {
    label = 'Rendah';
    badgeColor = 'expense';
  } else {
    label = 'Kritis';
    badgeColor = 'expense';
  }

  return {
    score,
    label,
    badgeColor,
    eligible: true,
    subScores: {
      savingsRatio: {
        score: Math.round(savingsRatioScore),
        max: 40,
        percentage: Math.round((savingsRatioScore / 40) * 100),
      },
      emergencyFund: {
        score: Math.round(emergencyScore),
        max: 30,
        percentage: Math.round((emergencyScore / 30) * 100),
      },
      expenseTrend: {
        score: Math.round(expenseTrendScore),
        max: 20,
        percentage: Math.round((expenseTrendScore / 20) * 100),
      },
      consistency: {
        score: Math.round(consistencyScore),
        max: 10,
        percentage: Math.round((consistencyScore / 10) * 100),
      },
    },
  };
}
