import React, { useState } from 'react';
import { useSummary } from '../../hooks/useSummary';
import { HeroBalanceCard } from './HeroBalanceCard';
import { PeriodSelector } from './PeriodSelector';
import { TrendCashflowChart } from './TrendCashflowChart';
import { SavingsRatioCard } from './SavingsRatioCard';
import { HealthScoreCard } from './HealthScoreCard';
import { RecentTransactions } from './RecentTransactions';
import { ActiveGoalsSummary } from './ActiveGoalsSummary';
import { BudgetTrackerCard } from '../budget/BudgetTrackerCard';
import { useCategories } from '../../hooks/useCategories';
import { useTransactions } from '../../hooks/useTransactions';
import { DashboardSkeleton } from '../common/Skeleton';
import { DashboardEmptyState } from '../common/EmptyState';
import { Transaction } from '../../types/database';
import { PwaInstallBanner } from '../pwa/PwaInstallBanner';
import { useAuth } from '../../hooks/useAuth';

interface DashboardScreenProps {
  onRecordClick: () => void;
  onViewAllTransactions: () => void;
  onGoalClick?: () => void;
  onTransactionClick?: (tx: Transaction) => void;
  onNavigateToCategories?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onRecordClick,
  onViewAllTransactions,
  onGoalClick,
  onTransactionClick,
  onNavigateToCategories,
}) => {
  const [period, setPeriod] = useState<7 | 30>(30);
  const { data: summary, isLoading, isError, refetch } = useSummary(period);
  const { categories = [] } = useCategories();
  const { transactions = [] } = useTransactions();
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Rozan';

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError || !summary) {
    return (
      <div className="p-6 rounded-2xl bg-surface-container border border-expense/30 text-center space-y-3">
        <span className="material-symbols-outlined text-expense text-[36px]">error</span>
        <h3 className="text-sm font-bold text-on-surface">Gagal memuat data</h3>
        <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
          Terjadi kesalahan saat memproses data finansial. Data terakhir tetap tersimpan di perangkat.
        </p>
        <button
          onClick={() => refetch()}
          type="button"
          className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-glow hover:brightness-105"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const hasTransactions = summary.recent_transactions.length > 0;

  return (
    <div className="flex flex-col w-full space-y-4 pb-28 select-none">
      {/* S16: PWA Install Banner */}
      <PwaInstallBanner />

      {/* 1. Header Greeting Section */}
      <section className="flex flex-col space-y-1 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-xs text-on-surface-variant flex items-center gap-1">
              Tersambung (WIB)
            </span>
          </div>
          <div className="flex items-center space-x-1.5 bg-surface-container-high px-2 py-0.5 rounded-full border border-border/30">
            <span className="material-symbols-outlined text-primary text-[14px]">
              verified_user
            </span>
            <span className="text-[11px] text-primary font-semibold">Terenkripsi</span>
          </div>
        </div>

        <div className="flex flex-col pt-1">
          <h1 className="text-xl text-on-surface font-bold tracking-tight flex items-center gap-1.5">
            Halo, {userName} <span className="text-primary font-normal">👋</span>
          </h1>
          <p className="text-xs text-on-surface-variant font-medium">
            {hasTransactions
              ? 'Keuanganmu dalam kondisi terpantau rapi bulan ini'
              : 'Mulai perjalanan finansial sehatmu bersama NabungPintar'}
          </p>
        </div>
      </section>

      {/* 2. Hero Card: Total Saldo with Dynamic Mood Lamp */}
      <HeroBalanceCard
        totalSaldo={summary.total_saldo}
        saldoKas={summary.saldo_kas}
        totalTabungan={summary.total_tabungan}
        income={summary.current_income}
        expense={summary.current_expense}
        incomeChangePct={summary.income_change_pct}
        expenseChangePct={summary.expense_change_pct}
        activeGoalsCount={summary.active_goals.length}
        savingsRatio={summary.savings_ratio}
        cardHolderName={userName}
      />

      {/* 3. Segmented Period Filter Bar */}
      <PeriodSelector value={period} onChange={setPeriod} />

      {/* If No Transactions: Show Dedicated Empty State Card */}
      {!hasTransactions ? (
        <DashboardEmptyState
          onRecordClick={onRecordClick}
          onGoalClick={onGoalClick}
        />
      ) : (
        <>
          {/* 4. Card 'Tren Arus Kas' with Neon Wave Canvas */}
          <TrendCashflowChart
            data={summary.daily_cashflow}
            period={period}
            onPeriodChange={setPeriod}
          />

          {/* 5. Card 'Rasio Menabung' */}
          <SavingsRatioCard
            ratio={summary.savings_ratio}
            status={summary.savings_ratio_status}
          />

          {/* 6. Card 'Kesehatan Keuangan' (40/30/20/10) */}
          <HealthScoreCard healthScore={summary.health_score} />

          {/* 7. Fitur Analitik 'Batas Anggaran Bulanan per Kategori' */}
          <BudgetTrackerCard
            categories={categories}
            transactions={transactions}
            onManageCategories={onNavigateToCategories}
          />

          {/* 8. 'Transaksi Terbaru' Section */}
          <RecentTransactions
            transactions={summary.recent_transactions}
            onViewAll={onViewAllTransactions}
            onItemClick={onTransactionClick}
          />

          {/* 8. 'Target Celengan Aktif' Section */}
          <ActiveGoalsSummary
            goals={summary.active_goals}
            onAddGoal={onGoalClick}
          />
        </>
      )}
    </div>
  );
};
