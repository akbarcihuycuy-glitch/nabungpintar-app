import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  defaultEmail = '',
}) => {
  const [email, setEmail] = useState(defaultEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Masukkan alamat email terdaftar Anda.');
      return;
    }

    if (!supabase) {
      setErrorMsg('Koneksi Supabase belum terkonfigurasi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const redirectUrl = `${window.location.origin}/#reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) throw error;
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setErrorMsg(
        err?.message?.includes('rate limit')
          ? 'Terlalu banyak permintaan reset. Silakan coba lagi dalam beberapa menit.'
          : err?.message || 'Gagal mengirim email reset kata sandi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-surface/95 backdrop-blur-2xl rounded-3xl p-5 shadow-2xl border border-white/10 text-on-surface overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-14 -right-14 w-36 h-36 rounded-full bg-primary/20 blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/30">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">lock_reset</span>
            <h3 className="text-sm font-bold text-on-surface">Atur Ulang Kata Sandi</h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-7 h-7 rounded-full bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-outline hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        {isSuccess ? (
          <div className="py-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-glow">
              <span className="material-symbols-outlined text-[26px]">mark_email_read</span>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-on-surface">Tautan Terkirim!</h4>
              <p className="text-xs text-outline leading-relaxed px-2">
                Kami telah mengirimkan tautan pengaturan ulang kata sandi ke{' '}
                <span className="font-semibold text-primary">{email}</span>. Silakan periksa kotak
                masuk atau folder spam Anda.
              </p>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="w-full py-2.5 rounded-xl bg-primary text-black font-bold text-xs shadow-glow hover:brightness-105 active:scale-95 transition-all mt-2"
            >
              Kembali ke Halaman Masuk
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 pt-3">
            <p className="text-xs text-outline leading-relaxed">
              Masukkan email yang terdaftar pada akun NabungPintar Anda. Kami akan mengirimkan tautan
              aman untuk membuat kata sandi baru.
            </p>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-error/15 border border-error/30 text-error text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-outline block">Alamat Email</label>
              <div className="flex items-center px-3 h-11 rounded-xl bg-surface-container border border-border/40 focus-within:border-primary transition-colors">
                <span className="material-symbols-outlined text-outline text-[18px] mr-2">mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  className="w-full bg-transparent text-xs text-on-surface placeholder:text-outline focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-surface-container-high text-xs font-semibold text-on-surface hover:bg-surface-container-highest transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-primary text-black font-bold text-xs shadow-glow hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                <span>{isSubmitting ? 'Mengirim...' : 'Kirim Tautan'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

