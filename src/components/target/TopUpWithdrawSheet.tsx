import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { SavingsGoal } from '../../types/database';
import { useFx } from '../../hooks/useFx';
import { getWIBDate } from '../../utils/formatters';
import { GoalIcon } from '../common/GoalIcon';

interface TopUpWithdrawSheetProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
  currentSaldoKas: number;
  initialMode?: 'topup' | 'withdraw';
  onSaveTopUp: (data: { goalId: string; amount: number; note?: string; occurredOn?: string }) => Promise<any>;
  onSaveWithdraw: (data: { goalId: string; amount: number; note?: string; occurredOn?: string }) => Promise<any>;
}

export const TopUpWithdrawSheet: React.FC<TopUpWithdrawSheetProps> = ({
  isOpen,
  onClose,
  goal,
  currentSaldoKas,
  initialMode = 'topup',
  onSaveTopUp,
  onSaveWithdraw,
}) => {
  const { formatMoney } = useFx();
  const [mode, setMode] = useState<'topup' | 'withdraw'>(initialMode);
  const [amountStr, setAmountStr] = useState<string>('500000');
  const [note, setNote] = useState<string>('');
  const [occurredOn, setOccurredOn] = useState<string>(getWIBDate());
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Negative balance confirmation dialog state
  const [showNegativeConfirm, setShowNegativeConfirm] = useState<boolean>(false);
  const [pendingAmount, setPendingAmount] = useState<number>(0);

  useEffect(() => {
    setMode(initialMode);
    setAmountStr('500000');
    setNote('');
    setOccurredOn(getWIBDate());
    setErrorMsg(null);
    setShowNegativeConfirm(false);
  }, [isOpen, initialMode]);

  if (!isOpen || !goal) return null;

  const currentAmount = goal.current_amount || 0;
  const targetAmount = goal.target_amount;
  const currentPct = targetAmount > 0 ? Math.min(100, Math.round((currentAmount / targetAmount) * 100)) : 0;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setAmountStr(raw);
  };

  const setNominal = (val: number) => {
    setAmountStr(val.toString());
  };

  const formattedAmountDisplay = amountStr ? Number(amountStr).toLocaleString('id-ID') : '';
  const parsedAmount = Number(amountStr) || 0;

  const willBeNegative = mode === 'topup' && currentSaldoKas - parsedAmount < 0;
  const projectedSaldoKas = currentSaldoKas - parsedAmount;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (parsedAmount <= 0) {
      setErrorMsg('Nominal harus lebih dari 0');
      return;
    }

    if (mode === 'withdraw' && parsedAmount > currentAmount) {
      setErrorMsg(
        `Maksimal penarikan adalah saldo celengan saat ini (${formatMoney(currentAmount)})`
      );
      return;
    }

    // Check PRD 3.2: Confirm if Saldo Kas becomes negative on Top Up
    if (mode === 'topup' && willBeNegative && !showNegativeConfirm) {
      setPendingAmount(parsedAmount);
      setShowNegativeConfirm(true);
      return;
    }

    await executeSave(parsedAmount);
  };

  const executeSave = async (amount: number) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      if (mode === 'topup') {
        await onSaveTopUp({
          goalId: goal.id,
          amount,
          note: note.trim() || `Top Up ${goal.name}`,
          occurredOn,
        });

        // Trigger confetti if this brings the goal to 100%
        if (currentAmount + amount >= targetAmount) {
          try {
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#2DD4A7', '#56f1c2', '#38BDF8', '#F59E0B'],
            });
          } catch {}
        }
      } else {
        await onSaveWithdraw({
          goalId: goal.id,
          amount,
          note: note.trim() || `Tarik Tabungan ${goal.name}`,
          occurredOn,
        });
      }
      setShowNegativeConfirm(false);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menyimpan transaksi celengan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Container */}
      <div className="relative w-full max-w-lg mx-auto bg-surface-container rounded-t-3xl shadow-2xl p-5 pb-safe z-10 border-t border-border/60 max-h-[90vh] overflow-y-auto no-scrollbar animate-slide-up">
        {/* Drag Handle */}
        <div className="w-10 h-1 rounded-full bg-surface-container-highest mx-auto mb-3" />

        {/* View Switcher Pill */}
        <div className="flex items-center justify-between pb-3 mb-2">
          <div className="flex p-1 bg-surface-container-lowest rounded-xl shadow-inner">
            <button
              type="button"
              onClick={() => {
                setMode('topup');
                setErrorMsg(null);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'topup'
                  ? 'bg-primary text-black shadow-glow'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              + Top Up Tabungan
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('withdraw');
                setErrorMsg(null);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'withdraw'
                  ? 'bg-surface-container-high text-on-surface shadow-sm'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              Tarik Saldo
            </button>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-outline hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-error/15 border border-error/30 text-error text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Target Mini Preview Card */}
        <div className="p-3.5 rounded-2xl bg-surface-container-low mb-4 border border-border/30 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <GoalIcon icon={goal.icon} size={18} />
              </div>
              <span className="text-xs font-bold text-on-surface">{goal.name}</span>
            </div>
            <span
              className="text-xs font-bold tabular-nums"
              style={{ color: goal.color || '#2DD4A7' }}
            >
              {currentPct}% Terkumpul
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${currentPct}%`,
                backgroundColor: goal.color || '#2DD4A7',
              }}
            />
          </div>

          <div className="flex justify-between items-baseline text-xs pt-0.5">
            <span className="text-outline">
              Terkumpul: <strong className="text-on-surface font-semibold">{formatMoney(currentAmount)}</strong>
            </span>
            <span className="text-outline">
              Target: <strong className="text-on-surface font-semibold">{formatMoney(targetAmount)}</strong>
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Input Nominal Besar */}
          <div className="flex flex-col items-center justify-center py-4 bg-surface-container-high rounded-2xl px-4 shadow-inner border border-border/40">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-outline mb-1">
              Nominal {mode === 'topup' ? 'Setoran' : 'Penarikan'}
            </span>
            <div className="flex items-center justify-center gap-1.5 w-full">
              <span className="text-xl font-bold text-outline">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={formattedAmountDisplay}
                onChange={handleAmountChange}
                placeholder="0"
                className="bg-transparent text-2xl font-bold text-primary text-center focus:outline-none w-56 tabular-nums"
                required
                autoFocus
              />
            </div>
            <span className="text-xs text-outline mt-1 tabular-nums">
              {mode === 'topup'
                ? `Sisa kekurangan: ${formatMoney(Math.max(0, targetAmount - currentAmount))}`
                : `Maksimal penarikan: ${formatMoney(currentAmount)}`}
            </span>
          </div>

          {/* Quick Chips Row */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-outline">
              Pilihan Cepat
            </span>
            <div className="grid grid-cols-4 gap-2">
              {[50000, 100000, 500000, 1000000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setNominal(val)}
                  className={`h-9 rounded-xl text-xs font-semibold active:scale-95 transition-all shadow-sm ${
                    parsedAmount === val
                      ? 'bg-primary text-black font-bold'
                      : 'bg-surface-container-high text-on-surface hover:bg-surface-bright'
                  }`}
                >
                  +{val >= 1000000 ? `${val / 1000000} Jt` : `${val / 1000}rb`}
                </button>
              ))}
            </div>
          </div>

          {/* Saldo Kas Source Indicator */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-border/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-on-surface">
                  {mode === 'topup' ? 'Sumber: Saldo Kas' : 'Tujuan: Saldo Kas'}
                </span>
                <span className="text-[11px] text-outline tabular-nums">
                  Saldo Kas saat ini: {formatMoney(currentSaldoKas)}
                </span>
              </div>
            </div>

            {mode === 'topup' && willBeNegative && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-error/20 text-error">
                Defisit Kas
              </span>
            )}
          </div>

          {/* Tanggal & Catatan */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-outline">Tanggal</label>
              <input
                type="date"
                value={occurredOn}
                onChange={(e) => setOccurredOn(e.target.value)}
                className="h-10 px-3 rounded-xl bg-surface-container-high border border-border/40 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-outline">Catatan (Opsional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Bonus, THR, dll"
                className="h-10 px-3 rounded-xl bg-surface-container-high border border-border/40 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || parsedAmount <= 0}
            className={`w-full h-12 mt-1 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-glow active:scale-95 transition-all disabled:opacity-50 ${
              mode === 'topup'
                ? 'bg-primary text-black'
                : 'bg-surface-container-highest text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {mode === 'topup' ? 'check_circle' : 'north_east'}
            </span>
            <span>
              {isSubmitting
                ? 'Memproses...'
                : mode === 'topup'
                ? 'Simpan Top Up Tabungan'
                : 'Tarik Saldo ke Kas'}
            </span>
          </button>
        </form>
      </div>

      {/* Confirmation Dialog for Negative Saldo Kas (PRD Section 3.2) */}
      {showNegativeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl bg-surface-container-high p-5 shadow-2xl border border-warning/40 space-y-4">
            <div className="w-12 h-12 rounded-full bg-warning/20 text-warning flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[26px]">warning</span>
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-on-surface">Peringatan Saldo Kas Negatif</h3>
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                Saldo Kas Anda saat ini adalah{' '}
                <strong className="text-on-surface">{formatMoney(currentSaldoKas)}</strong>.
                Menyetor{' '}
                <strong className="text-primary">{formatMoney(pendingAmount)}</strong> akan membuat
                Saldo Kas menjadi defisit (
                <strong className="text-error">{formatMoney(projectedSaldoKas)}</strong>).
              </p>
              <p className="text-[11px] text-outline mt-2">
                Apakah Anda yakin ingin tetap melanjutkan setoran ini?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setShowNegativeConfirm(false)}
                type="button"
                className="flex-1 py-2.5 rounded-xl bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-bright"
              >
                Batal
              </button>
              <button
                onClick={() => executeSave(pendingAmount)}
                type="button"
                className="flex-1 py-2.5 rounded-xl bg-warning text-black text-xs font-bold hover:brightness-105"
              >
                Tetap Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

