import React from 'react';
import { useAuth } from '../../hooks/useAuth';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  onClose,
  onOpenAuth,
}) => {
  const { user, isGuest, logout } = useAuth();

  if (!isOpen) return null;

  const handleLogout = async () => {
    await logout();
    onClose();
    onOpenAuth();
  };

  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Pengguna';
  const email = user?.email || 'Mode Tamu (Offline)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container rounded-2xl p-5 shadow-2xl border border-border/40 max-w-sm w-full space-y-4">
        {/* Profile Card Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-lg">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <h3 className="text-sm font-bold text-on-surface truncate">{fullName}</h3>
            <p className="text-xs text-outline truncate">{email}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${user ? 'bg-primary' : 'bg-income'} animate-pulse`} />
              <span className="text-[10px] text-on-surface-variant font-medium">
                {user ? 'Tersambung ke Supabase Cloud' : 'Mode Tamu (Lokal)'}
              </span>
            </div>
          </div>
        </div>

        {/* Action description */}
        <div className="p-3 rounded-xl bg-surface-container-high/60 border border-border/30 text-xs text-on-surface-variant leading-relaxed">
          {user ? (
            <span>
              Keluar dari akun akan membersihkan cache sesi lokal di perangkat ini. Data Anda tetap tersimpan aman di database Supabase Cloud.
            </span>
          ) : (
            <span>
              Anda saat ini berada dalam Mode Tamu. Masuk atau buat akun baru untuk mencadangkan data ke Supabase Cloud secara otomatis.
            </span>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            Tutup
          </button>

          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-expense/15 hover:bg-expense/25 text-expense border border-expense/30 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span>Keluar Akun</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
              <span>Masuk / Daftar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

