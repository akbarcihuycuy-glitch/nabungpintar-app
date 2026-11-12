import React from 'react';
import { SavingsGoal } from '../../types/database';
import { GoalAlarmConfig } from '../../services/alarm';
import { GoalIcon } from '../common/GoalIcon';
import { useFx } from '../../hooks/useFx';

interface AlarmReminderModalProps {
  alarm: GoalAlarmConfig | null;
  goal: SavingsGoal | null;
  onClose: () => void;
  onTopUp: (goal: SavingsGoal) => void;
  onSnooze: (goalId: string) => void;
}

export const AlarmReminderModal: React.FC<AlarmReminderModalProps> = ({
  alarm,
  goal,
  onClose,
  onTopUp,
  onSnooze,
}) => {
  const { formatMoney } = useFx();

  if (!alarm || !goal) return null;

  const current = goal.current_amount || 0;
  const target = goal.target_amount;
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  const handleTopUpClick = () => {
    onClose();
    onTopUp(goal);
  };

  const handleSnoozeClick = () => {
    onSnooze(goal.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-surface/90 backdrop-blur-2xl rounded-3xl p-5 shadow-2xl border border-white/10 text-on-surface overflow-hidden text-center">
        {/* Ambient Top Radial Glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-primary/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 rounded-full bg-amber-400/15 blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-outline hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>

        {/* Animated Bell Icon with Ping Effect */}
        <div className="relative mx-auto w-14 h-14 mt-1 mb-3 flex items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-2xl bg-primary/30 opacity-75" />
          <div className="relative w-14 h-14 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center shadow-glow text-primary">
            <span className="material-symbols-outlined text-[30px] animate-bounce">
              alarm_on
            </span>
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1">
          <span className="inline-block text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
            Pengingat Menabung
          </span>
          <h3 className="text-lg font-bold text-on-surface pt-1">
            Waktunya Sisihkan Uang!
          </h3>
          <p className="text-xs text-outline px-2">
            Konsistensi kecil hari ini adalah kunci sukses impian besarmu besok.
          </p>
        </div>

        {/* Target Card Highlight */}
        <div className="my-4 p-3.5 rounded-2xl bg-surface-container-high/60 border border-border/40 text-left space-y-2.5">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden"
              style={{
                backgroundColor: `${goal.color || '#2DD4A7'}20`,
                color: goal.color || '#2DD4A7',
              }}
            >
              <GoalIcon icon={goal.icon} size={24} />
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-on-surface truncate">
                {goal.name}
              </span>
              <span className="text-xs text-outline tabular-nums">
                Terkumpul {formatMoney(current)} / {formatMoney(target)}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 shadow-sm"
                style={{
                  width: `${pct}%`,
                  backgroundColor: goal.color || '#2DD4A7',
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-outline">
              <span>Progres Pencapaian</span>
              <span className="font-bold text-primary">{pct}%</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleTopUpClick}
            type="button"
            className="w-full py-3 rounded-xl bg-primary text-black font-bold text-xs shadow-glow hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Top Up Celengan Sekarang</span>
          </button>

          <button
            onClick={handleSnoozeClick}
            type="button"
            className="w-full py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px] text-outline">snooze</span>
            <span>Tunda 10 Menit</span>
          </button>
        </div>
      </div>
    </div>
  );
};

