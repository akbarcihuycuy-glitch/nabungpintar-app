import React, { useState, useEffect } from 'react';
import { TransactionKind, Category, CurrencyCode, SavingsGoal } from '../../types/database';
import { SUPPORTED_CURRENCIES } from '../../types/currency';
import { getWIBDate, formatCurrency } from '../../utils/formatters';
import { convertToBaseIdr } from '../../services/fx';

interface RecordTransactionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  goals?: SavingsGoal[];
  currentSaldoKas?: number;
  rates?: Record<CurrencyCode, number>;
  onSaveTransaction: (tx: {
    kind: TransactionKind;
    amount_original: number;
    currency: CurrencyCode;
    fx_rate_to_idr: number;
    amount_base: number;
    category_id: string | null;
    note: string | null;
    occurred_on: string;
  }) => Promise<any>;
  onSaveTopUp?: (data: { goalId: string; amount: number; note?: string }) => Promise<any>;
}

type Mode = 'expense' | 'income' | 'topup';

export const RecordTransactionSheet: React.FC<RecordTransactionSheetProps> = ({
  isOpen,
  onClose,
  categories,
  goals = [],
  currentSaldoKas = 0,
  rates = { IDR: 1, USD: 16250, SGD: 12100, MYR: 3650, EUR: 17500, JPY: 105 },
  onSaveTransaction,
  onSaveTopUp,
}) => {
  const [mode, setMode] = useState<Mode>('expense');
  const [rawAmount, setRawAmount] = useState<string>('0');
  const [currency, setCurrency] = useState<CurrencyCode>('IDR');
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getWIBDate());
  const [dateType, setDateType] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [note, setNote] = useState<string>('');
  const [isSavedSuccess, setIsSavedSuccess] = useState<boolean>(false);
  const [showMinusConfirm, setShowMinusConfirm] = useState<boolean>(false);

  // Available categories for selected mode
  const filteredCategories = categories.filter((c) =>
    mode === 'topup' ? c.kind === 'expense' : c.kind === mode
  );

  // Reset or initialize default selection
  useEffect(() => {
    if (isOpen) {
      setRawAmount('0');
      setNote('');
      setIsSavedSuccess(false);
      setShowMinusConfirm(false);
      setDateType('today');
      setSelectedDate(getWIBDate());

      if (filteredCategories.length > 0) {
        setSelectedCatId(filteredCategories[0].id);
      }
      if (goals.length > 0) {
        setSelectedGoalId(goals[0].id);
      }
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  // Keypad actions
  const handleKeyPress = (val: string) => {
    if (rawAmount === '0') {
      setRawAmount(val === '00' ? '0' : val);
    } else if (rawAmount.length < 11) {
      setRawAmount((prev) => prev + val);
    }
  };

  const handleBackspace = () => {
    if (rawAmount.length > 1) {
      setRawAmount((prev) => prev.slice(0, -1));
    } else {
      setRawAmount('0');
    }
  };

  // Date selection
  const handleDateChip = (type: 'today' | 'yesterday') => {
    setDateType(type);
    const d = new Date();
    if (type === 'yesterday') d.setDate(d.getDate() - 1);
    setSelectedDate(getWIBDate(d));
  };

  const numericAmount = parseInt(rawAmount, 10) || 0;

  // Submit action
  const executeSave = async () => {
    if (numericAmount <= 0) return;

    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {}
    }

    const { amountBase, rateUsed } = convertToBaseIdr(numericAmount, currency, rates);

    if (mode === 'topup') {
      if (!selectedGoalId && goals.length > 0) {
        setSelectedGoalId(goals[0].id);
      }
      const targetGoalId = selectedGoalId || goals[0]?.id;
      if (targetGoalId && onSaveTopUp) {
        await onSaveTopUp({
          goalId: targetGoalId,
          amount: amountBase,
          note: note.trim() || 'Top Up Celengan',
        });
      }
    } else {
      await onSaveTransaction({
        kind: mode,
        amount_original: numericAmount,
        currency,
        fx_rate_to_idr: rateUsed,
        amount_base: amountBase,
        category_id: selectedCatId,
        note: note.trim() || null,
        occurred_on: selectedDate,
      });
    }

    setIsSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleSubmit = async () => {
    if (numericAmount <= 0) return;

    // PRD 3.2: Confirm if Top Up causes Saldo Kas to become negative
    if (mode === 'topup') {
      const { amountBase } = convertToBaseIdr(numericAmount, currency, rates);
      if (currentSaldoKas - amountBase < 0) {
        setShowMinusConfirm(true);
        return;
      }
    }

    await executeSave();
  };

  return (
    <>
      {/* Dimmed & Blurred Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Confirmation Dialog for Negative Cash Balance */}
      {showMinusConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-surface-container border border-border p-5 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-warning/20 text-warning flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface">Peringatan Saldo Kas</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Top up ini akan membuat Saldo Kas menjadi minus ({formatCurrency(currentSaldoKas - numericAmount)}).
                </p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Saldo kas akan minus. Lanjutkan top up tabungan?
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowMinusConfirm(false)}
                type="button"
                className="flex-1 py-2.5 rounded-xl bg-surface-container-high text-xs font-semibold text-on-surface"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setShowMinusConfirm(false);
                  executeSave();
                }}
                type="button"
                className="flex-1 py-2.5 rounded-xl bg-warning text-black text-xs font-bold shadow-md"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sheet Container */}
      <div className="fixed inset-x-0 bottom-0 z-50 max-w-lg mx-auto bg-surface-container rounded-t-[28px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border-t border-border/50 animate-in slide-in-from-bottom duration-300">
        {/* Grab handle and Close button */}
        <div className="relative pt-3 pb-1 px-4 flex items-center justify-center shrink-0">
          <div className="w-12 h-1.5 bg-border rounded-full" />
          <button
            onClick={onClose}
            aria-label="Tutup"
            type="button"
            className="absolute right-4 top-3 w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Scrollable sheet body */}
        <div className="flex-1 overflow-y-auto px-4 pt-1 pb-6 space-y-3.5 no-scrollbar">
          {/* Segmented Pill Toggle: Pengeluaran vs Pemasukan vs Top Up */}
          <div className="flex justify-center">
            <div className="bg-surface-container-low p-1 rounded-full flex w-full max-w-sm border border-border/40 shadow-inner">
              <button
                onClick={() => setMode('expense')}
                type="button"
                className={`flex-1 py-2 text-center rounded-full text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  mode === 'expense'
                    ? 'bg-expense text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">arrow_downward</span>
                Pengeluaran
              </button>

              <button
                onClick={() => setMode('income')}
                type="button"
                className={`flex-1 py-2 text-center rounded-full text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  mode === 'income'
                    ? 'bg-income text-black shadow-sm font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">arrow_upward</span>
                Pemasukan
              </button>

              <button
                onClick={() => setMode('topup')}
                type="button"
                className={`flex-1 py-2 text-center rounded-full text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  mode === 'topup'
                    ? 'bg-primary text-black shadow-sm font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">savings</span>
                Top Up
              </button>
            </div>
          </div>

          {/* Amount Display */}
          <div className="flex flex-col items-center justify-center py-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-medium">
                {mode === 'topup' ? 'Nominal Top Up Celengan' : 'Nominal Transaksi'}
              </span>
              {/* Currency Picker dropdown */}
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="bg-surface-container-high text-[11px] font-semibold text-primary px-2 py-0.5 rounded-md border border-border/50 focus:outline-none"
              >
                {Object.keys(SUPPORTED_CURRENCIES).map((cur) => (
                  <option key={cur} value={cur}>
                    {cur} ({SUPPORTED_CURRENCIES[cur as CurrencyCode].symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-baseline justify-center gap-1 text-on-surface">
              <span className="text-lg text-outline font-semibold">
                {SUPPORTED_CURRENCIES[currency].symbol}
              </span>
              <span className="text-3xl font-bold tracking-tight tabular-nums">
                {formatCurrency(numericAmount, currency, { showSymbol: false })}
              </span>
              <span className="w-0.5 h-7 bg-primary animate-pulse ml-0.5 self-center" />
            </div>

            {currency !== 'IDR' && (
              <span className="text-[11px] text-on-surface-variant mt-1">
                ≈ {formatCurrency(convertToBaseIdr(numericAmount, currency, rates).amountBase)}
              </span>
            )}
          </div>

          {/* If Top Up mode: Pick Savings Goal */}
          {mode === 'topup' && (
            <div className="space-y-1.5">
              <span className="text-xs text-on-surface-variant font-medium">Pilih Kantong Celengan</span>
              {goals.length === 0 ? (
                <div className="p-3 rounded-xl bg-surface-container-low text-xs text-on-surface-variant text-center">
                  Belum ada kantong tabungan. Buat kantong di tab Target terlebih dahulu.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {goals.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedGoalId(g.id)}
                      className={`p-2.5 rounded-xl flex items-center gap-2 text-left transition-all ${
                        selectedGoalId === g.id
                          ? 'bg-primary/20 border-2 border-primary'
                          : 'bg-surface-container-high border border-border/30'
                      }`}
                    >
                      <span className="material-symbols-outlined text-primary text-[20px]">
                        {g.icon || 'savings'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-on-surface truncate">{g.name}</div>
                        <div className="text-[10px] text-on-surface-variant tabular-nums">
                          {formatCurrency(g.current_amount || 0)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Date Selection Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => handleDateChip('today')}
              type="button"
              className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 shrink-0 transition-all ${
                dateType === 'today'
                  ? 'bg-primary/20 text-primary font-bold'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {dateType === 'today' && (
                <span className="material-symbols-outlined text-[15px]">check</span>
              )}
              Hari ini
            </button>

            <button
              onClick={() => handleDateChip('yesterday')}
              type="button"
              className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 shrink-0 transition-all ${
                dateType === 'yesterday'
                  ? 'bg-primary/20 text-primary font-bold'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {dateType === 'yesterday' && (
                <span className="material-symbols-outlined text-[15px]">check</span>
              )}
              Kemarin
            </button>

            <div className="relative shrink-0">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setDateType('custom');
                }}
                className={`px-3 py-1 rounded-full text-xs bg-surface-container-high text-on-surface-variant focus:outline-none cursor-pointer border ${
                  dateType === 'custom' ? 'border-primary text-primary font-bold' : 'border-border/40'
                }`}
              />
            </div>
          </div>

          {/* Category Grid (for expense/income) */}
          {mode !== 'topup' && (
            <div>
              <div className="text-xs text-on-surface-variant mb-2 font-medium">Pilih Kategori</div>
              <div className="grid grid-cols-4 gap-2">
                {filteredCategories.slice(0, 8).map((cat) => {
                  const isSelected = selectedCatId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCatId(cat.id)}
                      type="button"
                      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-150 active:scale-95 group ${
                        isSelected
                          ? 'bg-primary/15 text-primary border border-primary shadow-sm'
                          : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-border/30'
                      }`}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center mb-1 group-hover:scale-105 transition-transform"
                        style={{
                          backgroundColor: isSelected ? `${cat.color}30` : 'var(--color-surface-low)',
                          color: cat.color,
                        }}
                      >
                        <span className="material-symbols-outlined text-[19px]">{cat.icon}</span>
                      </div>
                      <span className={`text-[11px] truncate w-full text-center ${isSelected ? 'font-bold' : ''}`}>
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Optional Note Field */}
          <div className="bg-surface-container-low rounded-xl px-3 py-2 flex items-center gap-2 border border-border/40">
            <span className="material-symbols-outlined text-outline text-[18px]">edit_note</span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tambah catatan (opsional)..."
              className="bg-transparent text-xs text-on-surface placeholder:text-outline w-full focus:outline-none"
            />
          </div>

          {/* Custom Numeric Keypad */}
          <div className="bg-surface-container-lowest p-2 rounded-2xl border border-border/30">
            <div className="grid grid-cols-3 gap-1.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleKeyPress(digit)}
                  type="button"
                  className="h-11 rounded-xl bg-surface-container-high text-base font-semibold text-on-surface active:bg-surface-2 flex items-center justify-center transition-all select-none hover:bg-surface-container-high/80"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={handleBackspace}
                type="button"
                className="h-11 rounded-xl bg-surface-container-high text-on-surface-variant active:text-on-surface active:bg-surface-2 flex items-center justify-center transition-all select-none hover:bg-surface-container-high/80"
              >
                <span className="material-symbols-outlined text-[20px]">backspace</span>
              </button>
            </div>
          </div>

          {/* Submit Action Button with 600ms transition */}
          <div className="pt-1">
            <button
              onClick={handleSubmit}
              disabled={numericAmount <= 0}
              type="button"
              className={`w-full h-12 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-glow ${
                isSavedSuccess
                  ? 'bg-income text-black'
                  : numericAmount <= 0
                  ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed opacity-60'
                  : 'bg-primary text-on-primary hover:brightness-105'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {isSavedSuccess ? 'check_circle' : 'check'}
              </span>
              <span>
                {isSavedSuccess
                  ? 'Tersimpan!'
                  : mode === 'expense'
                  ? 'Simpan Pengeluaran'
                  : mode === 'income'
                  ? 'Simpan Pemasukan'
                  : 'Simpan Top Up'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

