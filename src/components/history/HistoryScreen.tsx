import React, { useState } from 'react';
import { useTransactions, DailyTransactionGroup } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { Transaction, TransactionKind, Category } from '../../types/database';
import { formatRelativeDate, formatDateIndo, formatCurrency } from '../../utils/formatters';
import { useFx } from '../../hooks/useFx';
import { SkeletonBox } from '../common/Skeleton';
import { Toast, ToastMessage } from '../common/Toast';

interface HistoryScreenProps {
  onBack?: () => void;
  onRecordClick: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onRecordClick }) => {
  const { formatMoney } = useFx();
  const [search, setSearch] = useState<string>('');
  const [kindFilter, setKindFilter] = useState<TransactionKind | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [swipedTxId, setSwipedTxId] = useState<string | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const { categories } = useCategories();
  const {
    groupedTransactions,
    filteredCount,
    totalCount,
    isLoading,
    isError,
    refetch,
    deleteTransaction,
    restoreTransaction,
    updateTransaction,
  } = useTransactions({
    search,
    kind: kindFilter,
    categoryId: categoryFilter,
  });

  const handleClearFilters = () => {
    setSearch('');
    setKindFilter('all');
    setCategoryFilter(null);
  };

  const handleDeleteWithUndo = async (tx: Transaction) => {
    await deleteTransaction(tx.id);
    setSwipedTxId(null);

    // Show 5-second undo toast
    setToast({
      id: `undo-${tx.id}`,
      message: `Transaksi "${tx.note || tx.category?.name || 'Transaksi'}" dihapus`,
      durationMs: 5000,
      onUndo: async () => {
        await restoreTransaction(tx);
      },
    });
  };

  return (
    <div className="flex flex-col w-full gap-y-4 pb-28">
      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Dynamic Month Overview Bar */}
      <div className="flex items-center justify-between bg-surface-container px-4 py-3 rounded-2xl shadow-sm border border-border/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-[20px]">
              calendar_month
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-outline uppercase tracking-wider">
              Daftar Riwayat
            </span>
            <span className="text-sm font-semibold text-on-surface truncate">
              Semua Transaksi
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-surface-container-high px-2.5 py-1 rounded-full shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-primary font-semibold tabular-nums">
            {filteredCount} Transaksi
          </span>
        </div>
      </div>

      {/* Search Input Container */}
      <div className="relative flex items-center w-full">
        <div className="absolute left-3.5 flex items-center pointer-events-none text-outline">
          <span className="material-symbols-outlined text-[20px]">search</span>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari transaksi, catatan, atau nominal..."
          className="w-full h-11 pl-10 pr-10 rounded-xl bg-surface-container text-xs text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-high transition-colors border border-border/40"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            aria-label="Bersihkan pencarian"
            type="button"
            className="absolute right-2.5 w-7 h-7 flex items-center justify-center rounded-full bg-surface-container-high text-outline hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        )}
      </div>

      {/* Filter Chips (Horizontal Scrollable) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar">
        <button
          onClick={() => setKindFilter('all')}
          type="button"
          className={`shrink-0 flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs transition-all ${
            kindFilter === 'all'
              ? 'bg-primary text-black font-bold shadow-sm'
              : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-border/40 font-medium'
          }`}
        >
          <span>Semua</span>
          <span className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center text-[10px]">
            {totalCount}
          </span>
        </button>

        <button
          onClick={() => setKindFilter('income')}
          type="button"
          className={`shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-full text-xs transition-colors ${
            kindFilter === 'income'
              ? 'bg-income text-black font-bold shadow-sm'
              : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-border/40 font-medium'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-income" />
          <span>Pemasukan</span>
        </button>

        <button
          onClick={() => setKindFilter('expense')}
          type="button"
          className={`shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-full text-xs transition-colors ${
            kindFilter === 'expense'
              ? 'bg-expense text-white font-bold shadow-sm'
              : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-border/40 font-medium'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-expense" />
          <span>Pengeluaran</span>
        </button>

        {/* Category Filter Selector */}
        <div className="relative shrink-0">
          <select
            value={categoryFilter || ''}
            onChange={(e) => setCategoryFilter(e.target.value || null)}
            className="h-8 px-3 pr-7 rounded-full bg-surface-container text-xs text-on-surface-variant border border-border/40 focus:outline-none appearance-none cursor-pointer"
          >
            <option value="">Kategori: Semua</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.kind === 'income' ? 'Masuk' : 'Keluar'})
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined text-[16px] text-outline absolute right-2 top-2 pointer-events-none">
            expand_more
          </span>
        </div>
      </div>

      {/* Main Ledger Stream */}
      {isLoading ? (
        <div className="space-y-4 pt-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (\n            <SkeletonBox key={i} className="h-16 w-full rounded-xl" />\n          ))}
        </div>
      ) : isError ? (
        <div className="p-6 rounded-2xl bg-surface-container border border-expense/30 text-center space-y-3">
          <span className="material-symbols-outlined text-expense text-[32px]">error</span>
          <p className="text-sm font-semibold text-on-surface">Gagal memuat riwayat transaksi</p>
          <button
            onClick={() => refetch()}
            type="button"
            className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold"
          >
            Coba Lagi
          </button>
        </div>
      ) : groupedTransactions.length === 0 ? (
        <div className="p-8 rounded-2xl bg-surface-container border border-border/40 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center text-outline mb-3">
            <span className="material-symbols-outlined text-[28px]">search_off</span>
          </div>
          <h3 className="text-sm font-bold text-on-surface mb-1">Tidak ada transaksi cocok</h3>
          <p className="text-xs text-on-surface-variant max-w-xs mb-4">
            Tidak ditemukan catatan transaksi yang sesuai dengan kata kunci atau filter terpilih.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleClearFilters}
              type="button"
              className="px-3.5 py-2 rounded-xl bg-surface-container-high text-xs font-semibold text-on-surface hover:bg-surface-2 transition-colors border border-border/40"
            >
              Hapus Filter
            </button>
            <button
              onClick={onRecordClick}
              type="button"
              className="px-3.5 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:brightness-105"
            >
              + Catat Transaksi
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-y-4">
          {groupedTransactions.map((group) => (
            <section key={group.date} className="relative flex flex-col gap-y-2.5 pl-4 sm:pl-5">
              {/* Vertical Luminous Timeline Line */}
              <div className="absolute left-1.5 sm:left-2 top-4 bottom-1 w-0.5 bg-gradient-to-b from-primary via-cyan-400 to-transparent opacity-35" />

              {/* Date Header with Daily Subtotals */}
              <div className="flex items-center justify-between px-1 py-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(45,212,167,0.8)] -ml-5 sm:-ml-6 mr-1" />
                  <span className="font-extrabold text-primary uppercase tracking-wider">
                    {formatRelativeDate(group.date)}
                  </span>
                  <span className="text-outline text-[11px]">• {formatDateIndo(group.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] tabular-nums font-bold">
                  {group.dailyIncome > 0 && (
                    <span className="text-income">+{formatMoney(group.dailyIncome)}</span>
                  )}
                  {group.dailyIncome > 0 && group.dailyExpense > 0 && (
                    <span className="text-outline">|</span>
                  )}
                  {group.dailyExpense > 0 && (
                    <span className="text-expense">-{formatMoney(group.dailyExpense)}</span>
                  )}
                </div>
              </div>

              {/* Transactions in this date */}
              <div className="flex flex-col gap-y-2">
                {group.transactions.map((tx) => {
                  const isIncome = tx.kind === 'income';
                  const catColor = tx.category?.color || (isIncome ? '#2DD4A7' : '#F87171');
                  const iconName = tx.category?.icon || (isIncome ? 'payments' : 'receipt_long');
                  const isSwiped = swipedTxId === tx.id;

                  return (
                    <div
                      key={tx.id}
                      className="relative overflow-hidden rounded-2xl bg-surface-container border border-border/40 group hover:border-primary/40 transition-all shadow-sm hover:shadow-md"
                    >
                      {/* Swipe Delete Action Reveal */}
                      <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-center bg-expense/20 text-expense pr-1">
                        <button
                          onClick={() => handleDeleteWithUndo(tx)}
                          aria-label="Hapus Transaksi"
                          type="button"
                          className="flex flex-col items-center justify-center gap-1 w-full h-full text-expense active:scale-95 transition-transform"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                          <span className="text-[10px] font-bold">Hapus</span>
                        </button>
                      </div>

                      {/* Foreground Row with Squircle Glass Badge */}
                      <div
                        onClick={() => setSwipedTxId(isSwiped ? null : tx.id)}
                        className={`relative flex items-center justify-between p-3.5 bg-surface-container transition-all duration-200 select-none cursor-pointer hover:bg-surface-container-high/70 hover:-translate-y-0.5 ${
                          isSwiped ? '-translate-x-20' : 'translate-x-0'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-transform duration-300 group-hover:scale-105"
                            style={{
                              backgroundColor: `${catColor}20`,
                              color: catColor,
                              borderColor: `${catColor}35`,
                              boxShadow: `0 0 12px ${catColor}25`,
                            }}
                          >
                            <span className="material-symbols-outlined text-[20px]">{iconName}</span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                              {tx.note || tx.category?.name || (isIncome ? 'Pemasukan' : 'Pengeluaran')}
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] text-outline mt-0.5">
                              <span className="font-semibold text-on-surface/75">{tx.category?.name || (isIncome ? 'Pemasukan' : 'Pengeluaran')}</span>
                              <span>•</span>
                              <span>{tx.currency}</span>
                              {tx.currency !== 'IDR' && (
                                <>
                                  <span>•</span>
                                  <span>
                                    {formatCurrency(tx.amount_original, tx.currency)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 pl-2">
                          <span
                            className={`text-sm font-extrabold tabular-nums ${
                              isIncome ? 'text-income' : 'text-expense'
                            }`}
                          >
                            {isIncome ? '+ ' : '- '}
                            {formatMoney(tx.amount_base)}
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSwipedTxId(isSwiped ? null : tx.id);
                            }}
                            type="button"
                            className="text-outline hover:text-on-surface p-1 rounded-md"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {isSwiped ? 'close' : 'chevron_left'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
