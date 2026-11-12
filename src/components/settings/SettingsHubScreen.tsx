import React, { useState } from 'react';
import { useFx } from '../../hooks/useFx';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { SecuritySettingsModal } from '../security/SecuritySettingsModal';

export type SettingsSubScreen = 'hub' | 'currency' | 'categories' | 'report' | 'theme';

interface SettingsHubScreenProps {
  onNavigateSubScreen: (sub: SettingsSubScreen) => void;
  onOpenImportModal: () => void;
  onOpenSyncSheet: () => void;
  onOpenAuth: () => void;
  onOpenLogoutConfirm: () => void;
}

export const SettingsHubScreen: React.FC<SettingsHubScreenProps> = ({
  onNavigateSubScreen,
  onOpenImportModal,
  onOpenSyncSheet,
  onOpenAuth,
  onOpenLogoutConfirm,
}) => {
  const { displayCurrency, currencyInfo, source } = useFx();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Pengguna';
  const email = user?.email || 'Akun NabungPintar';
  const initial = fullName.charAt(0).toUpperCase();
  const cachedAvatar = typeof window !== 'undefined' ? localStorage.getItem('np_user_avatar') : null;
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || cachedAvatar;

  return (
    <div className="flex flex-col w-full pb-28 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-lg font-bold text-on-surface">Pengaturan & Fitur</h1>
          <p className="text-[11px] text-outline">Kelola preferensi dan alat keuangan</p>
        </div>
      </div>

      {/* Profile / Account Card */}
      <div className="bg-surface-container rounded-2xl p-4 shadow-sm border border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-base shrink-0 shadow-sm">
            {avatarUrl ? (
              <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              <span>{initial}</span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="text-sm font-bold text-on-surface truncate">{fullName}</h2>
            <span className="text-xs text-outline truncate">{email}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${user ? 'bg-primary' : 'bg-income'} animate-pulse`} />
              <span className="text-[10px] text-primary font-semibold truncate">
                {user ? 'Tersambung ke Supabase Cloud (Live)' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={user ? onOpenLogoutConfirm : onOpenAuth}
          type="button"
          className="ml-2 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 transition-all active:scale-95"
        >
          {user ? 'Profil & Hub' : 'Masuk'}
        </button>
      </div>

      {/* Main Settings Navigation Items */}
      <div className="bg-surface-container rounded-2xl p-2 shadow-sm border border-border/40 divide-y divide-border/20">
        {/* Item 1: Pengaturan Tema */}
        <button
          onClick={() => onNavigateSubScreen('theme')}
          type="button"
          className="w-full p-3.5 flex items-center justify-between rounded-xl hover:bg-surface-container-high transition-colors text-left group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">palette</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                Pengaturan Tema
              </span>
              <span className="text-[11px] text-outline truncate">
                Aktif: {theme === 'dark' ? 'Mode Gelap' : theme === 'light' ? 'Mode Terang' : 'Ikuti Sistem'}
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[18px] text-outline">chevron_right</span>
        </button>

        {/* Item 2: Status Sinkronisasi Perangkat */}
        <button
          onClick={onOpenSyncSheet}
          type="button"
          className="w-full p-3.5 flex items-center justify-between rounded-xl hover:bg-surface-container-high transition-colors text-left group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-tertiary-container/30 text-tertiary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">cloud_sync</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                Status Sinkronisasi Perangkat
              </span>
              <span className="text-[11px] text-outline truncate">
                Real-time WebSocket &bull; Riwayat sinkronisasi multi-device
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[18px] text-outline">chevron_right</span>
        </button>

        {/* Item 3: Mata Uang & Kurs Live */}
        <button
          onClick={() => onNavigateSubScreen('currency')}
          type="button"
          className="w-full p-3.5 flex items-center justify-between rounded-xl hover:bg-surface-container-high transition-colors text-left group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-secondary-container/40 text-secondary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">currency_exchange</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                Mata Uang & Kurs Live
              </span>
              <span className="text-[11px] text-outline truncate">
                Aktif: {currencyInfo.name} ({displayCurrency}) • {source === 'fallback' ? 'Kurs Cadangan' : 'Live'}
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[18px] text-outline">chevron_right</span>
        </button>

        {/* Item 4: Impor Mutasi Rekening */}
        <button
          onClick={onOpenImportModal}
          type="button"
          className="w-full p-3.5 flex items-center justify-between rounded-xl hover:bg-surface-container-high transition-colors text-left group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">upload_file</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                Impor Mutasi Rekening
              </span>
              <span className="text-[11px] text-outline truncate">
                Unggah .CSV/.XLSX, petakan kolom & deteksi duplikat
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[18px] text-outline">chevron_right</span>
        </button>

        {/* Item 5: Laporan Finansial Bulanan */}
        <button
          onClick={() => onNavigateSubScreen('report')}
          type="button"
          className="w-full p-3.5 flex items-center justify-between rounded-xl hover:bg-surface-container-high transition-colors text-left group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-tertiary-container/20 text-tertiary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">bar_chart</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                Laporan Finansial Bulanan
              </span>
              <span className="text-[11px] text-outline truncate">
                Analisis arus kas masuk/keluar & ekspor laporan
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[18px] text-outline">chevron_right</span>
        </button>

        {/* Item 6: Kelola Kategori */}
        <button
          onClick={() => onNavigateSubScreen('categories')}
          type="button"
          className="w-full p-3.5 flex items-center justify-between rounded-xl hover:bg-surface-container-high transition-colors text-left group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">category</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                Kelola Kategori
              </span>
              <span className="text-[11px] text-outline truncate">
                Sesuaikan kategori pemasukan, pengeluaran & ikon
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[18px] text-outline">chevron_right</span>
        </button>

        {/* Item 7: Keamanan & Kunci PIN / Biometrik */}
        <button
          onClick={() => setIsSecurityModalOpen(true)}
          type="button"
          className="w-full p-3.5 flex items-center justify-between rounded-xl hover:bg-surface-container-high transition-colors text-left group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">security</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                Keamanan & Kunci Aplikasi
              </span>
              <span className="text-[11px] text-outline truncate">
                Kunci PIN 6 angka dan autentikasi sidik jari (biometrik)
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[18px] text-outline">chevron_right</span>
        </button>
      </div>

      {/* Security Modal */}
      <SecuritySettingsModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />
    </div>
  );
};
