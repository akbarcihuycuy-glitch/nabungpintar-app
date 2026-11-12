import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose?: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onSuccess,
  onClose,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrorMsg('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (!supabase) {
      setErrorMsg('Koneksi Supabase belum terhubung.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      onSuccess();
    } catch (err: any) {
      console.error('Update password error:', err);
      setErrorMsg(err?.message || 'Gagal memperbarui kata sandi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-surface/95 backdrop-blur-2xl rounded-3xl p-5 shadow-2xl border border-white/10 text-on-surface overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-14 -right-14 w-36 h-36 rounded-full bg-primary/20 blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/30">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">vpn_key</span>
            <h3 className="text-sm font-bold text-on-surface">Buat Kata Sandi Baru</h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              type="button"
              className="w-7 h-7 rounded-full bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-outline hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 pt-3">
          <p className="text-xs text-outline leading-relaxed">
            Akun Anda terverifikasi. Masukkan kata sandi baru untuk mengamankan akun NabungPintar Anda.
          </p>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-error/15 border border-error/30 text-error text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-outline block">Kata Sandi Baru</label>
            <div className="relative flex items-center px-3 h-11 rounded-xl bg-surface-container border border-border/40 focus-within:border-primary transition-colors">
              <span className="material-symbols-outlined text-outline text-[18px] mr-2">lock</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
                className="w-full bg-transparent text-xs text-on-surface placeholder:text-outline focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-outline hover:text-on-surface p-1"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-outline block">Konfirmasi Kata Sandi</label>
            <div className="flex items-center px-3 h-11 rounded-xl bg-surface-container border border-border/40 focus-within:border-primary transition-colors">
              <span className="material-symbols-outlined text-outline text-[18px] mr-2">lock_clock</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi baru"
                required
                className="w-full bg-transparent text-xs text-on-surface placeholder:text-outline focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-primary text-black font-bold text-xs shadow-glow hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>{isSubmitting ? 'Memperbarui...' : 'Simpan Kata Sandi Baru'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

