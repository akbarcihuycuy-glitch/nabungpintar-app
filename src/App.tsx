import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell, TabKey } from './components/layout/AppShell';
import { DashboardScreen } from './components/dashboard/DashboardScreen';
import { HistoryScreen } from './components/history/HistoryScreen';
import { CategoryManagerScreen } from './components/category/CategoryManagerScreen';
import { RecordTransactionSheet } from './components/transaction/RecordTransactionSheet';
import { TargetListScreen } from './components/target/TargetListScreen';
import { TargetDetailScreen } from './components/target/TargetDetailScreen';
import { CreateEditGoalSheet } from './components/target/CreateEditGoalSheet';
import { TopUpWithdrawSheet } from './components/target/TopUpWithdrawSheet';
import { AlarmReminderModal } from './components/target/AlarmReminderModal';
import { ImportWizardModal } from './components/import/ImportWizardModal';
import { CurrencySettingsScreen } from './components/settings/CurrencySettingsScreen';
import { MonthlyReportScreen } from './components/report/MonthlyReportScreen';
import { SettingsHubScreen, SettingsSubScreen } from './components/settings/SettingsHubScreen';
import { ThemeSettingsScreen } from './components/theme/ThemeSettingsScreen';
import { AuthScreen } from './components/auth/AuthScreen';
import { ProfileHubModal } from './components/auth/ProfileHubModal';
import { SyncStatusSheet } from './components/sync/SyncStatusSheet';
import { OpeningSplashScreen } from './components/common/OpeningSplashScreen';
import { PinLockScreen } from './components/auth/PinLockScreen';
import { ResetPasswordModal } from './components/auth/ResetPasswordModal';
import { NotificationCenterSheet } from './components/notification/NotificationCenterSheet';
import { isPinConfigured, isSessionUnlocked } from './services/security';
import { getAllGoalAlarms } from './services/alarm';
import { supabase } from './lib/supabase';
import { useTransactions } from './hooks/useTransactions';
import { useCategories } from './hooks/useCategories';
import { useGoals } from './hooks/useGoals';
import { useSavingsAlarm } from './hooks/useSavingsAlarm';
import { useSummary } from './hooks/useSummary';
import { useFx } from './hooks/useFx';
import { useAuth } from './hooks/useAuth';
import { useSyncStatus } from './hooks/useSyncStatus';
import { SavingsGoal } from './types/database';
import { Toast, ToastMessage } from './components/common/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: true,
    },
  },
});

function MainApp() {
  const [currentTab, setCurrentTab] = useState<TabKey>('beranda');
  const [isRecordSheetOpen, setIsRecordSheetOpen] = useState<boolean>(false);

  // Opening Splash & Route Morph Transition (Pilar 1)
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('np_splash_shown')) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    if (!showSplash) return;
    try {
      sessionStorage.setItem('np_splash_shown', '1');
    } catch {}

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 450); // Snappy 450ms intro

    return () => clearTimeout(timer);
  }, [showSplash]);

  const handleFinishOpening = useCallback(() => {
    setShowSplash(false);
  }, []);

  // Auth & Sync States (S13, S14)
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState<boolean>(false);
  const [isSyncSheetOpen, setIsSyncSheetOpen] = useState<boolean>(false);

  // Security & PIN Lock State (Pilar 7)
  const [isPinUnlocked, setIsPinUnlocked] = useState<boolean>(() => isSessionUnlocked());

  // Password Recovery Modal State (Pilar 2)
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        window.location.hash.includes('type=recovery') ||
        window.location.hash.includes('reset-password')
      );
    }
    return false;
  });

  // Notification Center Drawer State (Pilar 4)
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);

  // Listen to Supabase password recovery events
  useEffect(() => {
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResetPasswordOpen(true);
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const {
    syncState,
    lastSyncedTime,
    pendingCount,
    isOnline,
    wifiOnly,
    toggleWifiOnly,
    triggerSync,
  } = useSyncStatus();

  // Target Module States (S05, S06, S07, S08)
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [isCreateGoalOpen, setIsCreateGoalOpen] = useState<boolean>(false);
  const [goalToEdit, setGoalToEdit] = useState<SavingsGoal | null>(null);
  const [isTopUpWithdrawOpen, setIsTopUpWithdrawOpen] = useState<boolean>(false);
  const [targetForTopUp, setTargetForTopUp] = useState<SavingsGoal | null>(null);
  const [topUpWithdrawMode, setTopUpWithdrawMode] = useState<'topup' | 'withdraw'>('topup');

  // Import Mutasi Modal State (S09 - S11)
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  // Settings Sub-Screen State (Hub / Currency S12 / Categories S04 / Report / Theme S15)
  const [settingsSubScreen, setSettingsSubScreen] = useState<SettingsSubScreen>('hub');

  // Toast notification
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const { categories } = useCategories();
  const {
    goals,
    isLoading: isGoalsLoading,
    addGoal,
    updateGoal,
    deleteGoal,
    addTopUp,
    withdraw,
  } = useGoals();
  const { transactions = [], addTransaction } = useTransactions();
  const { data: summary } = useSummary(30);
  const { rates } = useFx();
  const { activeReminder, dismissReminder, handleSnooze } = useSavingsAlarm(goals);

  // Calculate unread notifications (Pilar 4)
  const unreadNotificationCount = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthExp = transactions.filter(
      (t) => t.occurred_on.startsWith(currentMonth) && t.kind === 'expense'
    );
    const spentMap: Record<string, number> = {};
    for (const t of monthExp) {
      const cid = t.category_id || 'uncategorized';
      spentMap[cid] = (spentMap[cid] || 0) + t.amount_base;
    }
    const budgetAlerts = categories.filter(
      (c) =>
        (c.monthly_budget || 0) > 0 &&
        (spentMap[c.id] || 0) / (c.monthly_budget || 1) >= 0.75
    ).length;

    const alarms = getAllGoalAlarms();
    const goalAlerts = goals.filter((g) => {
      const alarm = alarms[g.id];
      const hasAlarm = (alarm && alarm.enabled) || g.reminder_enabled;
      const isComplete = (g.current_amount || 0) >= g.target_amount;
      return hasAlarm && !isComplete;
    }).length;

    return budgetAlerts + goalAlerts;
  }, [categories, transactions, goals]);

  // Reset sub-screen navigation when switching main tabs
  const handleTabChange = (tab: TabKey) => {
    setCurrentTab(tab);
    if (tab === 'target') {
      setSelectedGoal(null);
    }
    if (tab === 'pengaturan') {
      setSettingsSubScreen('hub');
    }
  };

  const handleOpenTopUp = (goal?: SavingsGoal) => {
    const target = goal || (goals.length > 0 ? goals[0] : null);
    if (!target) {
      setIsCreateGoalOpen(true);
      return;
    }
    setTargetForTopUp(target);
    setTopUpWithdrawMode('topup');
    setIsTopUpWithdrawOpen(true);
  };

  const handleOpenWithdraw = (goal: SavingsGoal) => {
    setTargetForTopUp(goal);
    setTopUpWithdrawMode('withdraw');
    setIsTopUpWithdrawOpen(true);
  };

  const handleEditGoal = (goal: SavingsGoal) => {
    setGoalToEdit(goal);
    setIsCreateGoalOpen(true);
  };

  // 1. Mandatory Login Route Protection (PRD Section 4.8):
  // Any user without an active Supabase session is directed to AuthScreen immediately.
  // Splash screen is rendered as a non-blocking overlay on top that fades out in 450ms.
  if (!user) {
    return (
      <>
        <AuthScreen onSuccess={() => setIsAuthOpen(false)} />
        {showSplash && (
          <OpeningSplashScreen
            user={null}
            onFinishOpening={handleFinishOpening}
          />
        )}
        {isResetPasswordOpen && (
          <ResetPasswordModal
            isOpen={isResetPasswordOpen}
            onSuccess={() => {
              setIsResetPasswordOpen(false);
              setToast({
                id: `pwd-${Date.now()}`,
                message: 'Kata sandi berhasil diperbarui! Silakan masuk dengan kata sandi baru.',
                durationMs: 4500,
              });
            }}
            onClose={() => setIsResetPasswordOpen(false)}
          />
        )}
      </>
    );
  }

  // 2. Security PIN Lock Screen Protection (Pilar 7)
  if (isPinConfigured() && !isPinUnlocked) {
    return (
      <>
        <PinLockScreen
          onUnlocked={() => setIsPinUnlocked(true)}
          onForgotPin={() => setIsLogoutOpen(true)}
        />
        {showSplash && (
          <OpeningSplashScreen
            user={user}
            onFinishOpening={handleFinishOpening}
          />
        )}
      </>
    );
  }

  return (
    <>
      <AppShell
        currentTab={currentTab}
        onTabChange={handleTabChange}
        onOpenRecordSheet={() => setIsRecordSheetOpen(true)}
        onOpenSyncSheet={() => setIsSyncSheetOpen(true)}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        unreadNotificationCount={unreadNotificationCount}
        onOpenProfile={() => {
          if (user) {
            setIsLogoutOpen(true);
          } else {
            setIsAuthOpen(true);
          }
        }}
        syncState={syncState}
        pendingCount={pendingCount}
        user={user}
      >
        <div key={currentTab + (selectedGoal ? '-detail' : '') + settingsSubScreen} className="animate-tab w-full">
          {/* Tab: Beranda (S01) */}
          {currentTab === 'beranda' && (
            <DashboardScreen
              onRecordClick={() => setIsRecordSheetOpen(true)}
              onViewAllTransactions={() => setCurrentTab('riwayat')}
              onGoalClick={() => {
                setCurrentTab('target');
                setSelectedGoal(null);
              }}
              onNavigateToCategories={() => {
                setCurrentTab('pengaturan');
                setSettingsSubScreen('categories');
              }}
            />
          )}

          {/* Tab: Riwayat (S03) */}
          {currentTab === 'riwayat' && (
            <HistoryScreen onRecordClick={() => setIsRecordSheetOpen(true)} />
          )}

          {/* Tab: Target Celengan (S05 & S06) */}
          {currentTab === 'target' &&
            (selectedGoal ? (
              <TargetDetailScreen
                goal={selectedGoal}
                onBack={() => setSelectedGoal(null)}
                onEditGoal={handleEditGoal}
                onDeleteGoal={async (id) => {
                  await deleteGoal(id);
                  setSelectedGoal(null);
                }}
                onOpenTopUp={handleOpenTopUp}
                onOpenWithdraw={handleOpenWithdraw}
              />
            ) : (
              <TargetListScreen
                goals={goals}
                isLoading={isGoalsLoading}
                onOpenCreateSheet={() => {
                  setGoalToEdit(null);
                  setIsCreateGoalOpen(true);
                }}
                onOpenTopUpSheet={handleOpenTopUp}
                onSelectGoal={(goal) => setSelectedGoal(goal)}
              />
            ))}

          {/* Tab: Pengaturan & Fitur (Hub, S12, S04, S15, Laporan) */}
          {currentTab === 'pengaturan' && (
            <>
              {settingsSubScreen === 'hub' && (
                <SettingsHubScreen
                  onNavigateSubScreen={setSettingsSubScreen}
                  onOpenImportModal={() => setIsImportModalOpen(true)}
                  onOpenSyncSheet={() => setIsSyncSheetOpen(true)}
                  onOpenAuth={() => setIsAuthOpen(true)}
                  onOpenLogoutConfirm={() => setIsLogoutOpen(true)}
                />
              )}

              {settingsSubScreen === 'theme' && (
                <ThemeSettingsScreen onBack={() => setSettingsSubScreen('hub')} />
              )}

              {settingsSubScreen === 'currency' && (
                <CurrencySettingsScreen onBack={() => setSettingsSubScreen('hub')} />
              )}

              {settingsSubScreen === 'categories' && (
                <CategoryManagerScreen onBack={() => setSettingsSubScreen('hub')} />
              )}

              {settingsSubScreen === 'report' && (
                <MonthlyReportScreen onBack={() => setSettingsSubScreen('hub')} />
              )}
            </>
          )}
        </div>

        {/* S02: Catat Transaksi Quick Bottom Sheet */}
        <RecordTransactionSheet
          isOpen={isRecordSheetOpen}
          onClose={() => setIsRecordSheetOpen(false)}
          categories={categories}
          goals={goals}
          currentSaldoKas={summary?.saldo_kas || 0}
          rates={rates}
          onSaveTransaction={addTransaction}
          onSaveTopUp={async (entry) => {
            await addTopUp(entry);
          }}
        />

        {/* S07: Buat / Ubah Target Bottom Sheet */}
        <CreateEditGoalSheet
          isOpen={isCreateGoalOpen}
          onClose={() => {
            setIsCreateGoalOpen(false);
            setGoalToEdit(null);
          }}
          goalToEdit={goalToEdit}
          onSave={async (goal) => {
            return await addGoal(goal);
          }}
          onUpdate={async (id, updates) => {
            const updated = await updateGoal({ id, updates });
            if (selectedGoal && selectedGoal.id === id) {
              setSelectedGoal(updated);
            }
          }}
        />

        {/* S08: Top Up / Tarik Tabungan Bottom Sheet */}
        <TopUpWithdrawSheet
          isOpen={isTopUpWithdrawOpen}
          onClose={() => {
            setIsTopUpWithdrawOpen(false);
            setTargetForTopUp(null);
          }}
          goal={targetForTopUp}
          currentSaldoKas={summary?.saldo_kas || 0}
          initialMode={topUpWithdrawMode}
          onSaveTopUp={async (data) => {
            await addTopUp(data);
            if (selectedGoal && selectedGoal.id === data.goalId) {
              setSelectedGoal((prev) =>
                prev ? { ...prev, current_amount: (prev.current_amount || 0) + data.amount } : null
              );
            }
          }}
          onSaveWithdraw={async (data) => {
            await withdraw(data);
            if (selectedGoal && selectedGoal.id === data.goalId) {
              setSelectedGoal((prev) =>
                prev
                  ? {
                      ...prev,
                      current_amount: Math.max(0, (prev.current_amount || 0) - data.amount),
                    }
                  : null
              );
            }
          }}
        />

        {/* S09 - S11: Impor Mutasi CSV/Excel Wizard Modal */}
        <ImportWizardModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={(count) => {
            setToast({
              id: `import-${Date.now()}`,
              message: `Berhasil mengimpor ${count} transaksi!`,
              durationMs: 4000,
            });
          }}
        />

        {/* S14: Status Sinkronisasi Perangkat Bottom Sheet */}
        <SyncStatusSheet
          isOpen={isSyncSheetOpen}
          onClose={() => setIsSyncSheetOpen(false)}
          syncState={syncState}
          lastSyncedTime={lastSyncedTime}
          pendingCount={pendingCount}
          isOnline={isOnline}
          wifiOnly={wifiOnly}
          onToggleWifiOnly={toggleWifiOnly}
          onTriggerSync={triggerSync}
        />

        {/* Modal Profil & Hub Akun */}
        <ProfileHubModal
          isOpen={isLogoutOpen}
          onClose={() => setIsLogoutOpen(false)}
          totalTransactions={transactions?.length || 0}
          activeGoalsCount={goals?.filter((g) => (g.current_amount || 0) < g.target_amount).length || 0}
          healthScore={summary?.health_score?.score ?? 75}
          savingsRatio={typeof summary?.savings_ratio === 'number' ? summary.savings_ratio : 20}
        />

        {/* Modal Alarm Pengingat Menabung */}
        <AlarmReminderModal
          alarm={activeReminder?.alarm || null}
          goal={activeReminder?.goal || null}
          onClose={dismissReminder}
          onTopUp={handleOpenTopUp}
          onSnooze={handleSnooze}
        />

        {/* Pusat Notifikasi Drawer (Pilar 4) */}
        <NotificationCenterSheet
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
          goals={goals}
          categories={categories}
          transactions={transactions}
          onTopUp={handleOpenTopUp}
          onNavigateToCategories={() => {
            setCurrentTab('pengaturan');
            setSettingsSubScreen('categories');
          }}
        />

        {/* Modal Pemulihan Kata Sandi (Pilar 2) */}
        {isResetPasswordOpen && (
          <ResetPasswordModal
            isOpen={isResetPasswordOpen}
            onSuccess={() => {
              setIsResetPasswordOpen(false);
              setToast({
                id: `pwd-${Date.now()}`,
                message: 'Kata sandi berhasil diperbarui!',
                durationMs: 4000,
              });
            }}
            onClose={() => setIsResetPasswordOpen(false)}
          />
        )}

        {/* Global Toast */}
        {toast && (
          <Toast
            toast={toast}
            onClose={() => setToast(null)}
          />
        )}
      </AppShell>

      {/* S13: Fullscreen Modal Masuk / Daftar saat dibuka manual dari menu */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
          <AuthScreen
            canDismiss={true}
            onDismiss={() => setIsAuthOpen(false)}
            onSuccess={() => setIsAuthOpen(false)}
          />
        </div>
      )}
      {/* Opening Splash Screen Overlay */}
      {showSplash && (
        <OpeningSplashScreen
          user={user}
          onFinishOpening={handleFinishOpening}
        />
      )}
    </>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainApp />
    </QueryClientProvider>
  );
}

export default App;
