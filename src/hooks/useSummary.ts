import { useQuery } from '@tanstack/react-query';
import { DashboardSummaryData, SavingsGoal, Transaction, SavingsEntry } from '../types/database';
import { supabase, isSupabaseConfigured, ensureAuth } from '../lib/supabase';
import { storageService } from '../services/storage';
import {
  calculateBalances,
  calculateSavingsRatio,
  getSavingsRatioStatus,
  calculatePercentageChange,
  calculateHealthScore,
  generateDailyCashflowSeries,
  getPeriodWindows,
  filterTransactionsByDate,
} from '../utils/calculations';

export function useSummary(periodDays: 7 | 30 = 30) {
  return useQuery<DashboardSummaryData>({
    queryKey: ['summary', periodDays],
    queryFn: async () => {
      let transactions: Transaction[] = [];
      let goals: SavingsGoal[] = [];
      let savingsEntries: SavingsEntry[] = [];

      let fetchedFromSupabase = false;

      if (isSupabaseConfigured && supabase) {
        try {
          await ensureAuth();
          // Fetch transactions with joined categories
          const { data: txData, error: txError } = await supabase
            .from('transactions')
            .select('*, category:categories(*)')
            .order('occurred_on', { ascending: false })
            .order('created_at', { ascending: false });

          if (!txError && txData) {
            transactions = txData;

            // Fetch savings goals
            const { data: goalData } = await supabase
              .from('savings_goals')
              .select('*')
              .eq('archived', false)
              .order('created_at', { ascending: false });

            const { data: entriesData } = await supabase.from('savings_entries').select('*');
            savingsEntries = entriesData || [];

            const entryMap: Record<string, number> = {};
            for (const e of savingsEntries) {
              entryMap[e.goal_id] = (entryMap[e.goal_id] || 0) + (e.kind === 'topup' ? e.amount : -e.amount);
            }

            goals = (goalData || []).map((g) => ({
              ...g,
              current_amount: Math.max(0, entryMap[g.id] || 0),
            }));

            fetchedFromSupabase = true;
          }
        } catch (err) {
          console.warn('Supabase fetch failed in useSummary, falling back to LocalStorage:', err);
        }
      }

      // Fallback to LocalStorage
      if (!fetchedFromSupabase) {
        transactions = await storageService.getTransactions();
        goals = await storageService.getGoals();
        savingsEntries = await storageService.getSavingsEntries();
      }

      // Timeframe calculations
      const { currStart, currEnd, prevStart, prevEnd } = getPeriodWindows(periodDays);
      const currPeriodTx = filterTransactionsByDate(transactions, currStart, currEnd);
      const prevPeriodTx = filterTransactionsByDate(transactions, prevStart, prevEnd);

      const current_income = currPeriodTx
        .filter((t) => t.kind === 'income')
        .reduce((sum, t) => sum + (t.amount_base || 0), 0);
      const current_expense = currPeriodTx
        .filter((t) => t.kind === 'expense')
        .reduce((sum, t) => sum + (t.amount_base || 0), 0);

      const prev_income = prevPeriodTx
        .filter((t) => t.kind === 'income')
        .reduce((sum, t) => sum + (t.amount_base || 0), 0);
      const prev_expense = prevPeriodTx
        .filter((t) => t.kind === 'expense')
        .reduce((sum, t) => sum + (t.amount_base || 0), 0);

      // Section 3.2: Balances
      const { saldoKas, totalTabungan, totalSaldo } = calculateBalances(
        transactions,
        savingsEntries
      );

      // Section 3.3: Savings Ratio
      const savings_ratio = calculateSavingsRatio(current_income, current_expense);
      const savings_ratio_status = getSavingsRatioStatus(savings_ratio);

      // Section 3.4: Percentage changes
      const income_change_pct = calculatePercentageChange(current_income, prev_income);
      const expense_change_pct = calculatePercentageChange(current_expense, prev_expense);

      // Section 3.5: Health Score (0 - 100)
      const health_score = calculateHealthScore(transactions, savingsEntries);

      // Daily cashflow for area chart
      const daily_cashflow = generateDailyCashflowSeries(currPeriodTx, periodDays);

      // Top 5 recent transactions
      const recent_transactions = transactions.slice(0, 5);

      // Top 2 active goals
      const active_goals = goals.slice(0, 2);

      return {
        period_days: periodDays,
        current_income,
        current_expense,
        prev_income,
        prev_expense,
        saldo_kas: saldoKas,
        total_tabungan: totalTabungan,
        total_saldo: totalSaldo,
        income_change_pct,
        expense_change_pct,
        savings_ratio,
        savings_ratio_status,
        health_score,
        daily_cashflow,
        recent_transactions,
        active_goals,
      };
    },
  });
}
