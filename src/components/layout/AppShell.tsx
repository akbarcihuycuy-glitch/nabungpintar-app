import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { SyncState } from '../../hooks/useSyncStatus';
import { User } from '@supabase/supabase-js';

export type TabKey = 'beranda' | 'riwayat' | 'target' | 'pengaturan';

interface AppShellProps {
  currentTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onOpenRecordSheet: () => void;
  onOpenSyncSheet: () => void;
  onOpenProfile: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationCount?: number;
  syncState?: SyncState;
  pendingCount?: number;
  user?: User | null;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentTab,
  onTabChange,
  onOpenRecordSheet,
  onOpenSyncSheet,
  onOpenProfile,
  onOpenNotifications,
  unreadNotificationCount = 0,
  syncState = 'synced',
  pendingCount = 0,
  user,
  children,
}) => {
  const { isDark, toggleTheme } = useTheme();

  const cachedAvatar = typeof window !== 'undefined' ? localStorage.getItem('np_user_avatar') : null;
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || cachedAvatar;
  const userInitial = (user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'R').toUpperCase();

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-surface antialiased">
      {/* Top Fixed App Bar */}
      <header className="fixed top-0 inset-x-0 z-40 bg-surface/85 backdrop-blur-xl border-b border-border/40 shadow-sm pt-safe">
        <div className="h-16 max-w-md mx-auto px-4 flex items-center justify-between">
          {/* Logo & App Name */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 shadow-sm text-primary">
              <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-on-surface tracking-tight truncate">
                  NabungPintar
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/20 text-primary font-semibold">
                  v1.0
                </span>
              </div>
              <span className="text-[11px] text-on-surface-variant truncate">
                {currentTab === 'beranda'
                  ? 'Beranda'
                  : currentTab === 'riwayat'
                  ? 'Riwayat Transaksi'
                  : currentTab === 'pengaturan'
                  ? 'Pengaturan'
                  : 'Target Celengan'}
              </span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {/* Live Realtime Sync Status Chip */}
            <button
              onClick={onOpenSyncSheet}
              type="button"
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high transition-all active:scale-95 shadow-sm border border-border/30"
              title="Status Sinkronisasi Perangkat"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  syncState === 'synced'
                    ? 'bg-tertiary'
                    : syncState === 'syncing'
                    ? 'bg-primary animate-pulse'
                    : 'bg-amber-400'
                }`}
              />
              <span
                className={`material-symbols-outlined text-[15px] ${
                  syncState === 'synced'
                    ? 'text-tertiary'
                    : syncState === 'syncing'
                    ? 'text-primary animate-spin'
                    : 'text-amber-400'
                }`}
              >
                {syncState === 'synced'
                  ? 'check_circle'
                  : syncState === 'syncing'
                  ? 'autorenew'
                  : 'cloud_off'}
              </span>
              <span
                className={`text-[11px] font-semibold hidden sm:inline ${
                  syncState === 'synced'
                    ? 'text-tertiary'
                    : syncState === 'syncing'
                    ? 'text-primary'
                    : 'text-amber-400'
                }`}
              >
                {syncState === 'synced'
                  ? 'Tersimpan'
                  : syncState === 'syncing'
                  ? 'Menyinkron...'
                  : `Offline${pendingCount > 0 ? ` • ${pendingCount}` : ''}`}
              </span>
            </button>

            {/* Notification Bell Button */}
            {onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                type="button"
                className="relative w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline hover:text-on-surface transition-all active:scale-95 border border-border/30"
                title="Pusat Notifikasi & Pengingat"
              >
                <span className="material-symbols-outlined text-[19px]">notifications</span>
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center shadow-sm animate-pulse leading-none">
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </span>
                )}
              </button>
            )}

            {/* Profile Avatar with status indicator */}
            <button
              onClick={onOpenProfile}
              type="button"
              className="relative flex items-center justify-center p-0.5 active:scale-95 transition-transform"
              title="Profil & Hub Akun"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-xs shadow-sm">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Foto Profil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{userInitial}</span>
                )}
              </div>
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 ${
                  user ? 'bg-primary' : 'bg-outline'
                } rounded-full ring-2 ring-surface`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Scroll Area with extra bottom padding for floating dock */}
      <main className="flex-1 flex flex-col relative w-full max-w-md mx-auto px-4 pt-24 pb-28 min-h-screen">
        {children}
      </main>

      {/* Floating Glass Dock (Melayang manis dengan sudut membulat 3xl) */}
      <nav className="fixed bottom-2.5 sm:bottom-4 inset-x-0 z-40 max-w-md mx-auto px-3 pointer-events-none pb-safe">
        <div className="pointer-events-auto relative flex items-center justify-between h-[66px] px-2 rounded-3xl backdrop-blur-2xl border transition-all duration-300
          /* Dark Glass Dock */
          dark:bg-slate-900/85 dark:border-white/15 dark:shadow-[0_16px_45px_rgba(0,0,0,0.55)]
          /* Light Glass Dock (Iridescent Pastel Glass) */
          bg-white/85 border-slate-200/80 shadow-[0_12px_35px_rgba(15,23,42,0.12)]
        ">
          {/* Tab 1: Beranda */}
          <button
            onClick={() => onTabChange('beranda')}
            type="button"
            className={`relative flex-1 flex flex-col items-center justify-center h-full min-w-0 transition-all active:scale-90 ${
              currentTab === 'beranda'
                ? 'text-primary font-bold'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[23px] transition-transform ${
                currentTab === 'beranda' ? 'scale-110 drop-shadow-[0_0_8px_rgba(45,212,167,0.5)]' : ''
              }`}
            >
              grid_view
            </span>
            <span className="text-[10px] tracking-tight mt-0.5">Beranda</span>
            {currentTab === 'beranda' && (
              <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#2DD4A7] animate-pulse" />
            )}
          </button>

          {/* Tab 2: Riwayat */}
          <button
            onClick={() => onTabChange('riwayat')}
            type="button"
            className={`relative flex-1 flex flex-col items-center justify-center h-full min-w-0 transition-all active:scale-90 ${
              currentTab === 'riwayat'
                ? 'text-primary font-bold'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[23px] transition-transform ${
                currentTab === 'riwayat' ? 'scale-110 drop-shadow-[0_0_8px_rgba(45,212,167,0.5)]' : ''
              }`}
            >
              history
            </span>
            <span className="text-[10px] tracking-tight mt-0.5">Riwayat</span>
            {currentTab === 'riwayat' && (
              <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#2DD4A7] animate-pulse" />
            )}
          </button>

          {/* Centered 3D Raised Neon Button with Pulse Glow Ring */}
          <div className="relative flex items-center justify-center w-14 shrink-0 mx-1">
            <button
              onClick={onOpenRecordSheet}
              aria-label="Catat Transaksi"
              type="button"
              className="relative -top-4 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 text-slate-950 font-extrabold shadow-[0_8px_25px_rgba(45,212,167,0.55)] ring-4 ring-primary/20 dark:ring-primary/25 hover:scale-110 active:scale-90 transition-all group"
              title="Catat Transaksi Baru"
            >
              <span className="material-symbols-outlined text-[26px] font-bold group-hover:rotate-90 transition-transform duration-300">
                add
              </span>
            </button>
          </div>

          {/* Tab 3: Target */}
          <button
            onClick={() => onTabChange('target')}
            type="button"
            className={`relative flex-1 flex flex-col items-center justify-center h-full min-w-0 transition-all active:scale-90 ${
              currentTab === 'target'
                ? 'text-primary font-bold'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[23px] transition-transform ${
                currentTab === 'target' ? 'scale-110 drop-shadow-[0_0_8px_rgba(45,212,167,0.5)]' : ''
              }`}
            >
              track_changes
            </span>
            <span className="text-[10px] tracking-tight mt-0.5">Target</span>
            {currentTab === 'target' && (
              <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#2DD4A7] animate-pulse" />
            )}
          </button>

          {/* Tab 4: Pengaturan */}
          <button
            onClick={() => onTabChange('pengaturan')}
            type="button"
            className={`relative flex-1 flex flex-col items-center justify-center h-full min-w-0 transition-all active:scale-90 ${
              currentTab === 'pengaturan'
                ? 'text-primary font-bold'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[23px] transition-transform ${
                currentTab === 'pengaturan' ? 'scale-110 drop-shadow-[0_0_8px_rgba(45,212,167,0.5)]' : ''
              }`}
            >
              settings
            </span>
            <span className="text-[10px] tracking-tight mt-0.5">Pengaturan</span>
            {currentTab === 'pengaturan' && (
              <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#2DD4A7] animate-pulse" />
            )}
          </button>
        </div>
      </nav>
    </div>
  );
};
