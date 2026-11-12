import React, { useState, useEffect } from 'react';
import {
  isPinConfigured,
  verifyPin,
  setSecurityPin,
  removeSecurityPin,
  isBiometricEnabled,
  setBiometricEnabled,
  canUseBiometrics,
} from '../../services/security';

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({
  isOpen,
  onClose,
  onSuccessToast,
}) => {
  const [hasPin, setHasPin] = useState<boolean>(false);
  const [biometricActive, setBiometricActive] = useState<boolean>(false);
  const [canBiometric, setCanBiometric] = useState<boolean>(false);

  // Setup / Change form
  const [mode, setMode] = useState<'view' | 'set' | 'change' | 'remove'>('view');
  const [oldPin, setOldPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setHasPin(isPinConfigured());
      setBiometricActive(isBiometricEnabled());
      canUseBiometrics().then(setCanBiometric);
      setMode('view');
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      setErrorMsg('PIN harus terdiri dari 6 angka.');
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMsg('Konfirmasi PIN tidak cocok.');
      return;
    }

    setSecurityPin(newPin);
    setHasPin(true);
    setMode('view');
    onSuccessToast?.('Kunci PIN 6 angka berhasil diaktifkan!');
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPin(oldPin)) {
      setErrorMsg('PIN lama salah.');
      return;
    }
    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      setErrorMsg('PIN baru harus terdiri dari 6 angka.');
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMsg('Konfirmasi PIN tidak cocok.');
      return;
    }

    setSecurityPin(newPin);
    setMode('view');
    onSuccessToast?.('PIN keamanan berhasil diperbarui!');
  };

  const handleRemovePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPin(oldPin)) {
      setErrorMsg('PIN lama salah.');
      return;
    }

    removeSecurityPin();
    setHasPin(false);
    setBiometricActive(false);
    setMode('view');
    onSuccessToast?.('Kunci PIN dinonaktifkan.');
  };

  const handleToggleBiometric = () => {
    const next = !biometricActive;
    setBiometricActive(next);
    setBiometricEnabled(next);
    onSuccessToast?.(
      next ? 'Autentikasi Biometrik diaktifkan!' : 'Autentikasi Biometrik dimatikan.'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-surface/95 backdrop-blur-2xl rounded-3xl p-5 shadow-2xl border border-white/10 text-on-surface overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/30">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">security</span>
            <h3 className="text-sm font-bold text-on-surface">Keamanan & Kunci Aplikasi</h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-7 h-7 rounded-full bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-outline hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-error/15 border border-error/30 text-error text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* View Mode */}
        {mode === 'view' && (
          <div className="space-y-4 pt-3">
            {/* PIN Card */}
            <div className="p-3.5 rounded-2xl bg-surface-container-high/60 border border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    hasPin ? 'bg-primary/20 text-primary' : 'bg-surface-container-highest text-outline'
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {hasPin ? 'lock' : 'lock_open'}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-on-surface">Kunci PIN 6 Angka</h4>
                  <p className="text-[10px] text-outline">
                    {hasPin ? 'Aktif saat membuka aplikasi' : 'Belum diatur'}
                  </p>
                </div>
              </div>

              {hasPin ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setMode('change');
                      setErrorMsg(null);
                    }}
                    type="button"
                    className="px-2.5 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-xs font-semibold text-primary transition-colors"
                  >
                    Ubah
                  </button>
                  <button
                    onClick={() => {
                      setMode('remove');
                      setErrorMsg(null);
                    }}
                    type="button"
                    className="px-2 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    Hapus
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMode('set');
                    setErrorMsg(null);
                  }}
                  type="button"
                  className="px-3 py-1.5 rounded-xl bg-primary text-black font-bold text-xs shadow-glow hover:brightness-105 active:scale-95 transition-all"
                >
                  Aktifkan
                </button>
              )}
            </div>

            {/* Biometric Card (Only available if PIN is active) */}
            {hasPin && (
              <div className="p-3.5 rounded-2xl bg-surface-container-high/60 border border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      biometricActive
                        ? 'bg-primary/20 text-primary'
                        : 'bg-surface-container-highest text-outline'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[22px]">fingerprint</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-on-surface">Sidik Jari / Biometrik</h4>
                    <p className="text-[10px] text-outline">
                      {canBiometric
                        ? 'Buka aplikasi dengan sensor biometrik'
                        : 'Sensor biometrik tidak terdeteksi'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleBiometric}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                    biometricActive ? 'bg-primary' : 'bg-surface-container-highest'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      biometricActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Set New PIN Mode */}
        {mode === 'set' && (
          <form onSubmit={handleSaveNewPin} className="space-y-3 pt-3">
            <p className="text-xs text-outline">
              Buat 6 digit PIN numerik yang mudah Anda ingat untuk mengunci aplikasi.
            </p>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-outline block">PIN Baru (6 Angka)</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                required
                className="w-full h-11 px-3 text-center text-lg tracking-widest font-bold rounded-xl bg-surface-container border border-border/40 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-outline block">Konfirmasi PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                required
                className="w-full h-11 px-3 text-center text-lg tracking-widest font-bold rounded-xl bg-surface-container border border-border/40 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode('view')}
                className="flex-1 py-2.5 rounded-xl bg-surface-container-high text-xs font-semibold text-on-surface hover:bg-surface-container-highest"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-primary text-black font-bold text-xs shadow-glow hover:brightness-105 active:scale-95"
              >
                Simpan PIN
              </button>
            </div>
          </form>
        )}

        {/* Change PIN Mode */}
        {mode === 'change' && (
          <form onSubmit={handleChangePin} className="space-y-3 pt-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-outline block">PIN Lama</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={oldPin}
                onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                required
                className="w-full h-11 px-3 text-center text-lg tracking-widest font-bold rounded-xl bg-surface-container border border-border/40 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-outline block">PIN Baru</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                required
                className="w-full h-11 px-3 text-center text-lg tracking-widest font-bold rounded-xl bg-surface-container border border-border/40 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-outline block">Konfirmasi PIN Baru</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                required
                className="w-full h-11 px-3 text-center text-lg tracking-widest font-bold rounded-xl bg-surface-container border border-border/40 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode('view')}
                className="flex-1 py-2.5 rounded-xl bg-surface-container-high text-xs font-semibold text-on-surface hover:bg-surface-container-highest"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-primary text-black font-bold text-xs shadow-glow hover:brightness-105 active:scale-95"
              >
                Ubah PIN
              </button>
            </div>
          </form>
        )}

        {/* Remove PIN Mode */}
        {mode === 'remove' && (
          <form onSubmit={handleRemovePin} className="space-y-3 pt-3">
            <p className="text-xs text-rose-400">
              Masukkan PIN Anda saat ini untuk menonaktifkan fitur kunci keamanan.
            </p>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-outline block">PIN Saat Ini</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={oldPin}
                onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                required
                className="w-full h-11 px-3 text-center text-lg tracking-widest font-bold rounded-xl bg-surface-container border border-border/40 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode('view')}
                className="flex-1 py-2.5 rounded-xl bg-surface-container-high text-xs font-semibold text-on-surface hover:bg-surface-container-highest"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-xs shadow-sm hover:brightness-105 active:scale-95"
              >
                Hapus Kunci
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

