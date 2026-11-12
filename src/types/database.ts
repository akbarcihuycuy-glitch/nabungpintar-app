export type TransactionKind = 'income' | 'expense';
export type SavingsEntryKind = 'topup' | 'withdraw';
export type CurrencyCode = 'IDR' | 'USD' | 'SGD' | 'MYR' | 'EUR' | 'JPY';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  kind: TransactionKind;
  icon: string;
  color: string;
  is_default: boolean;
  monthly_budget?: number; // Batas anggaran bulanan (Rp)
  created_at: string;
  tx_count?: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  kind: TransactionKind;
  amount_original: number;
  currency: CurrencyCode;
  fx_rate_to_idr: number;
  amount_base: number; // Stored in IDR as integer
  category_id: string | null;
  note: string | null;
  occurred_on: string; // YYYY-MM-DD
  import_batch_id?: string | null;
  import_hash?: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  deadline: string | null;
  icon: string;
  color: string;
  custom_image?: string | null;
  image_display_mode?: 'icon' | 'cover' | 'both';
  reminder_enabled?: boolean;
  reminder_time?: string;
  reminder_frequency?: 'daily' | 'weekly' | 'monthly';
  archived: boolean;
  created_at: string;
  current_amount?: number;
}

export interface SavingsEntry {
  id: string;
  user_id: string;
  goal_id: string;
  kind: SavingsEntryKind;
  amount: number;
  note: string | null;
  occurred_on: string;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  display_currency: CurrencyCode;
  theme: ThemeMode;
  hide_balance?: boolean;
  updated_at: string;
}

export interface DailyCashflowItem {
  date: string;
  income: number;
  expense: number;
}

export interface HealthScoreResult {
  score: number; // 0-100
  label: 'Sangat Sehat' | 'Baik' | 'Cukup' | 'Rendah' | 'Kritis';
  badgeColor: 'income' | 'primary' | 'warning' | 'expense';
  eligible: boolean; // false if data < 7 days
  reason?: string;
  subScores: {
    savingsRatio: { score: number; max: 40; percentage: number };
    emergencyFund: { score: number; max: 30; percentage: number };
    expenseTrend: { score: number; max: 20; percentage: number };
    consistency: { score: number; max: 10; percentage: number };
  };
}

export interface DashboardSummaryData {
  period_days: 7 | 30;
  current_income: number;
  current_expense: number;
  prev_income: number;
  prev_expense: number;
  saldo_kas: number;
  total_tabungan: number;
  total_saldo: number;
  income_change_pct: number | null | 'Baru';
  expense_change_pct: number | null | 'Baru';
  savings_ratio: number | null;
  savings_ratio_status: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Rendah' | 'Kritis' | '-';
  health_score: HealthScoreResult;
  daily_cashflow: DailyCashflowItem[];
  recent_transactions: Transaction[];
  active_goals: SavingsGoal[];
}

