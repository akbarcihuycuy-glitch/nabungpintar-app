import React from 'react';

interface PeriodSelectorProps {
  value: 7 | 30;
  onChange: (val: 7 | 30) => void;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({ value, onChange }) => {
  return (
    <section className="flex items-center justify-between">
      <div className="relative flex items-center p-1 rounded-2xl w-full bg-surface-container-low/80 dark:bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-inner">
        <button
          onClick={() => onChange(7)}
          className={`flex-1 py-2 rounded-xl text-center text-xs font-bold transition-all duration-300 ${
            value === 7
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-[0_0_15px_rgba(45,212,167,0.45)]'
              : 'text-on-surface-variant hover:text-on-surface font-semibold'
          }`}
          type="button"
        >
          7 Hari Terakhir
        </button>
        <button
          onClick={() => onChange(30)}
          className={`flex-1 py-2 rounded-xl text-center text-xs font-bold transition-all duration-300 ${
            value === 30
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-[0_0_15px_rgba(45,212,167,0.45)]'
              : 'text-on-surface-variant hover:text-on-surface font-semibold'
          }`}
          type="button"
        >
          30 Hari Terakhir
        </button>
      </div>
    </section>
  );
};
