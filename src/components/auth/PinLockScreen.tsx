import React, { useState, useEffect } from 'react';
import {
  verifyPin,
  setSessionUnlocked,
  isBiometricEnabled,
  canUseBiometrics,
  authenticateWithBiometrics,
} from '../../services/security';

interface PinLockScreenProps {
  onUnlocked: () => void;
  onForgotPin?: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  onUnlocked,
  onForgotPin,
}) => {
  const [pin, setPin] = useState<string>('');
  const [errorShake, setErrorShake] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [supportBiometric, setSupportBiometric] = useState<boolean>(false);

  useEffect(() => {
    // Check biometrics
    canUseBiometrics().then((supported) => {
      setSupportBiometric(supported && isBiometricEnabled());
      if (supported && isBiometricEnabled()) {
        authenticateWithBiometrics().then((success) => {
          if (success) onUnlocked();
        });
      }
    });
  }, [onUnlocked]);

  const handleDigit = (digit: string) => {
    if (pin.length >= 6) return;
    const next = pin + digit;
    setPin(next);
    setErrorMsg(null);

    if (next.length === 6) {
      // Validate
      if (verifyPin(next)) {
        setSessionUnlocked(true);
        onUnlocked();
      } else {
        setErrorShake(true);
        setErrorMsg('PIN salah. Silakan coba lagi.');
        setTimeout(() => {
          setPin('');
          setErrorShake(false);
        }, 500);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleBiometricClick = async () => {
    const ok = await authenticateWithBiometrics();
    if (ok) onUnlocked();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1120] text-[#E8EEF9] flex flex-col justify-between items-center p-6 selection:bg-primary selection:text-black font-sans overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

      {/* Top Header & Lock Icon */}
      <div className="flex flex-col items-center text-center pt-8 space-y-3 relative z-10">
        <div className="relative flex items-center justify-center w-16 h-16">
          <div className="absolute inset-0 bg-primary/25 rounded-2xl blur-lg animate-pulse" />
          <div className="relative w-14 h-14 rounded-2xl bg-surface-container-high/90 border border-primary/40 flex items-center justify-center text-primary shadow-glow">
            <span className="material-symbols-outlined text-[28px]">lock</span>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold tracking-tight text-on-surface">
            Kunci Keamanan NabungPintar
          </h2>
          <p className="text-xs text-outline mt-1">
            Masukkan 6 digit PIN untuk membuka aplikasi
          </p>
        </div>

        {/* 6 Dots Indicator */}
        <div className={`flex items-center gap-3.5 pt-4 ${errorShake ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const isFilled = idx < pin.length;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  errorShake
                    ? 'bg-rose-500 scale-110 shadow-sm'
                    : isFilled
                    ? 'bg-primary scale-125 shadow-glow ring-2 ring-primary/40'
                    : 'bg-surface-container-highest border border-border/60'
                }`}
              />
            );
          })}
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-400 font-medium animate-fade-in pt-1">{errorMsg}</p>
        )}
      </div>

      {/* Keypad */}
      <div className="w-full max-w-xs space-y-3.5 pb-6 relative z-10">
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-16 rounded-2xl bg-surface-container/70 hover:bg-surface-container-high border border-white/5 active:scale-95 transition-all flex items-center justify-center text-xl font-bold text-on-surface shadow-sm backdrop-blur-md"
            >
              {digit}
            </button>
          ))}

          {/* Biometric or Empty */}
          {supportBiometric ? (
            <button
              type="button"
              onClick={handleBiometricClick}
              className="h-16 rounded-2xl bg-surface-container/50 hover:bg-surface-container-high border border-white/5 active:scale-95 transition-all flex flex-col items-center justify-center text-primary shadow-sm backdrop-blur-md"
              title="Gunakan Sidik Jari / Biometrik"
            >
              <span className="material-symbols-outlined text-[24px]">fingerprint</span>
              <span className="text-[9px] font-semibold">Biometrik</span>
            </button>
          ) : (
            <div className="h-16" />
          )}

          {/* Digit 0 */}
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-16 rounded-2xl bg-surface-container/70 hover:bg-surface-container-high border border-white/5 active:scale-95 transition-all flex items-center justify-center text-xl font-bold text-on-surface shadow-sm backdrop-blur-md"
          >
            0
          </button>

          {/* Backspace */}
          <button
            type="button"
            onClick={handleDelete}
            disabled={pin.length === 0}
            className="h-16 rounded-2xl bg-surface-container/50 hover:bg-surface-container-high border border-white/5 active:scale-95 transition-all flex items-center justify-center text-outline hover:text-on-surface disabled:opacity-30 shadow-sm backdrop-blur-md"
            title="Hapus"
          >
            <span className="material-symbols-outlined text-[22px]">backspace</span>
          </button>
        </div>

        {/* Forgot PIN action */}
        {onForgotPin && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onForgotPin}
              className="text-xs text-primary/80 hover:text-primary transition-colors font-medium"
            >
              Lupa PIN?
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
