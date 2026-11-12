import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
} from 'recharts';
import { DailyCashflowItem } from '../../types/database';
import { formatCurrency, formatDateIndo } from '../../utils/formatters';

interface TrendCashflowChartProps {
  data: DailyCashflowItem[];
  period?: 7 | 30;
  onPeriodChange?: (period: 7 | 30) => void;
}

const CustomFloatingTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const income = payload.find((p: any) => p.dataKey === 'income')?.value || 0;
    const expense = payload.find((p: any) => p.dataKey === 'expense')?.value || 0;
    const net = income - expense;

    return (
      <div className="bg-slate-950/90 dark:bg-slate-950/95 backdrop-blur-2xl border border-white/20 p-3 rounded-2xl shadow-2xl flex flex-col space-y-2 text-xs min-w-[170px] animate-fade-in text-white">
        <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
          <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-cyan-400">calendar_today</span>
            {formatDateIndo(label)}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-emerald-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
              Masuk
            </span>
            <span className="text-emerald-400 font-bold tabular-nums">
              +{formatCurrency(income)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-rose-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_6px_#f87171]" />
              Keluar
            </span>
            <span className="text-rose-400 font-bold tabular-nums">
              -{formatCurrency(expense)}
            </span>
          </div>
        </div>

        <div className="pt-1.5 border-t border-white/10 flex items-center justify-between font-bold text-[11px]">
          <span className="text-slate-400">Arus Bersih:</span>
          <span className={`tabular-nums ${net >= 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
            {net >= 0 ? '+' : ''}{formatCurrency(net)}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export const TrendCashflowChart: React.FC<TrendCashflowChartProps> = ({
  data,
  period,
  onPeriodChange,
}) => {
  const chartData = data.map((d) => ({
    ...d,
    shortDate: d.date.split('-').slice(1).join('/'),
  }));

  const totalIn = data.reduce((sum, d) => sum + d.income, 0);
  const totalOut = data.reduce((sum, d) => sum + d.expense, 0);

  return (
    <section className="relative group rounded-3xl p-5 overflow-hidden transition-all duration-500 backdrop-blur-2xl border
      /* Sapphire-Indigo Glass Dark */
      dark:bg-gradient-to-br dark:from-indigo-950/70 dark:via-slate-900/85 dark:to-blue-950/70 dark:border-indigo-500/30 dark:shadow-[0_16px_50px_rgba(30,27,75,0.45)]
      /* Sapphire-Indigo Glass Light */
      bg-gradient-to-br from-indigo-50/90 via-white/80 to-blue-50/80 border-indigo-200/70 shadow-[0_12px_35px_rgba(99,102,241,0.12)]
    ">
      {/* Ambient Neon Wave Glow Behind Canvas */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />

      {/* Header with Title and Segmented Sliding Capsule */}
      <div className="relative z-10 flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-inner">
            <span className="material-symbols-outlined text-[18px]">show_chart</span>
          </div>
          <div>
            <span className="text-sm font-bold text-on-surface block leading-tight">
              Tren Arus Kas
            </span>
            <span className="text-[10px] text-outline">Neon Wave Canvas</span>
          </div>
        </div>

        {/* Sliding Glowing Pill Segmented Toggle */}
        {period && onPeriodChange ? (
          <div className="relative flex items-center p-1 rounded-full bg-black/20 dark:bg-black/30 border border-white/10 backdrop-blur-md">
            <button
              onClick={() => onPeriodChange(7)}
              type="button"
              className={`relative z-10 px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-300 ${
                period === 7
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-[0_0_12px_rgba(45,212,167,0.5)]'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => onPeriodChange(30)}
              type="button"
              className={`relative z-10 px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-300 ${
                period === 30
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-[0_0_12px_rgba(45,212,167,0.5)]'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              30 Hari
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
              <span className="text-[11px] text-on-surface-variant font-medium">Masuk</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_6px_#f87171]" />
              <span className="text-[11px] text-on-surface-variant font-medium">Keluar</span>
            </div>
          </div>
        )}
      </div>

      {/* Legend under header if toggle was shown */}
      {period && (
        <div className="relative z-10 flex items-center space-x-4 text-xs pb-1">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            <span className="text-[11px] text-on-surface-variant font-medium">Pemasukan</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_6px_#f87171]" />
            <span className="text-[11px] text-on-surface-variant font-medium">Pengeluaran</span>
          </div>
        </div>
      )}

      {/* Neon Wave Canvas Area */}
      <div className="relative z-10 w-full h-48 pt-2 -ml-2">
        {totalIn === 0 && totalOut === 0 ? (
          <div className="h-full w-full flex flex-col items-center justify-center text-center p-4">
            <span className="material-symbols-outlined text-outline text-[32px] mb-1 opacity-60">
              ssid_chart
            </span>
            <span className="text-xs text-on-surface-variant font-medium">
              Belum ada transaksi di rentang waktu ini
            </span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 12, right: 12, left: -4, bottom: 0 }}>
              <defs>
                {/* Glowing Emerald Gradient Fill */}
                <linearGradient id="neonIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2DD4A7" stopOpacity={0.45} />
                  <stop offset="60%" stopColor="#2DD4A7" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#2DD4A7" stopOpacity={0.0} />
                </linearGradient>

                {/* Glowing Rose Gradient Fill */}
                <linearGradient id="neonExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.4} />
                  <stop offset="60%" stopColor="#F43F5E" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#F43F5E" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="date"
                tickFormatter={(val) => {
                  const parts = val.split('-');
                  return `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}`;
                }}
                stroke="#64748B"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />

              <Tooltip content={<CustomFloatingTooltip />} />

              {/* Monotone Spline with SVG neon styling */}
              <Area
                type="monotone"
                dataKey="income"
                stroke="#2DD4A7"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#neonIncomeGrad)"
                activeDot={{
                  r: 6,
                  fill: '#2DD4A7',
                  stroke: '#FFFFFF',
                  strokeWidth: 2,
                  className: 'drop-shadow-[0_0_8px_#2DD4A7]',
                }}
              />

              <Area
                type="monotone"
                dataKey="expense"
                stroke="#FB7185"
                strokeWidth={2.5}
                strokeDasharray="4 3"
                fillOpacity={1}
                fill="url(#neonExpenseGrad)"
                activeDot={{
                  r: 5,
                  fill: '#FB7185',
                  stroke: '#FFFFFF',
                  strokeWidth: 2,
                  className: 'drop-shadow-[0_0_8px_#FB7185]',
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
};
