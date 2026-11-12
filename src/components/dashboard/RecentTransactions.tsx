import React from 'react';
import { Transaction } from '../../types/database';
import { formatRelativeDate } from '../../utils/formatters';
import { useFx } from '../../hooks/useFx';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onViewAll: () => void;
  onItemClick?: (tx: Transaction) => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  onViewAll,
  onItemClick,
}) => {
  const { formatMoney } = useFx();

  return (
    <section className="flex flex-col space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
          </div>
          <div>
            <span className="text-sm font-bold text-on-surface block leading-tight">
              Transaksi Terbaru
            </span>
            <span className="text-[10px] text-outline">Glowing Timeline Feed</span>
          </div>
        </div>

        <button
          onClick={onViewAll}
          type="button"
          className="text-xs text-primary font-bold hover:underline px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 active:scale-95 transition-all"
        >
          Lihat Semua
        </button>
      </div>

      {/* Timeline Feed Container */}
      <div className="relative rounded-3xl p-4 overflow-hidden backdrop-blur-2xl border
        /* Dark Glass */
        dark:bg-slate-900/80 dark:border-white/10 dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]
        /* Light Glass */
        bg-white/85 border-slate-200/80 shadow-[0_12px_30px_rgba(0,0,0,0.05)]
      ">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-outline space-y-1">
            <span className="material-symbols-outlined text-[28px] text-outline block mb-1">
              history_toggle_drop_down
            </span>
            <span className="font-semibold text-on-surface block">Belum ada transaksi</span>
            <span>Mulai catat pengeluaran atau pemasukan hari ini.</span>
          </div>
        ) : (
          <div className="relative pl-4 space-y-2.5">
            {/* Luminous Vertical Timeline Track */}
            <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary via-cyan-400 to-transparent opacity-40" />

            {transactions.map((tx) => {
              const isIncome = tx.kind === 'income';
              const iconName = tx.category?.icon || (isIncome ? 'payments' : 'receipt_long');
              const catColor = tx.category?.color || (isIncome ? '#2DD4A7' : '#F87171');

              return (
                <div
                  key={tx.id}
                  onClick={() => onItemClick?.(tx)}
                  className="group relative flex items-center justify-between p-3 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-white/10 dark:border-white/5 transition-all duration-200 cursor-pointer active:scale-[0.99] hover:-translate-y-0.5 hover:shadow-lg"
                >
                  {/* Radiant Neon Timeline Node Dot */}
                  <div
                    className="absolute -left-[19px] w-2.5 h-2.5 rounded-full border-2 border-surface transition-transform duration-300 group-hover:scale-125"
                    style={{
                      backgroundColor: isIncome ? '#2DD4A7' : '#F43F5E',
                      boxShadow: isIncome
                        ? '0 0 8px rgba(45,212,167,0.8)'
                        : '0 0 8px rgba(244,63,94,0.8)',
                    }}
                  />

                  {/* Left: Squircle Glass Icon + Description */}
                  <div className="flex items-center space-x-3 min-w-0">
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
                      <span className="text-[11px] text-outline truncate flex items-center gap-1 mt-0.5">
                        {tx.category?.name && (
                          <span className="font-semibold text-on-surface/80">
                            {tx.category.name} •
                          </span>
                        )}
                        <span>{formatRelativeDate(tx.occurred_on)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Right: Amount with Neon Bold Style */}
                  <div className="flex flex-col items-end shrink-0 ml-3">
                    <span
                      className={`text-sm font-extrabold tabular-nums drop-shadow-sm ${
                        isIncome ? 'text-income' : 'text-expense'
                      }`}
                    >
                      {isIncome ? '+ ' : '- '}
                      {formatMoney(tx.amount_base)}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-outline">
                      {tx.currency}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
