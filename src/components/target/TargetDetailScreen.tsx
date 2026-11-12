import React, { useEffect, useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { SavingsGoal, SavingsEntry } from '../../types/database';
import { useFx } from '../../hooks/useFx';
import { calculateGoalProjection, GoalProjectionResult } from '../../utils/projections';
import { useGoalEntries } from '../../hooks/useGoals';
import { formatDateIndo } from '../../utils/formatters';
import { GoalIcon } from '../common/GoalIcon';
import { getAllGoalAlarms } from '../../services/alarm';

interface TargetDetailScreenProps {
  goal: SavingsGoal;
  onBack: () => void;
  onEditGoal: (goal: SavingsGoal) => void;
  onDeleteGoal: (goalId: string) => void;
  onOpenTopUp: (goal: SavingsGoal) => void;
  onOpenWithdraw: (goal: SavingsGoal) => void;
}

export const TargetDetailScreen: React.FC<TargetDetailScreenProps> = ({
  goal,
  onBack,
  onEditGoal,
  onDeleteGoal,
  onOpenTopUp,
  onOpenWithdraw,
}) => {
  const { formatMoney } = useFx();
  const { data: entries = [], isLoading: entriesLoading } = useGoalEntries(goal.id);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hasFiredConfetti, setHasFiredConfetti] = useState(false);

  const currentAmount = goal.current_amount || 0;
  const targetAmount = goal.target_amount;
  const pct = targetAmount > 0 ? Math.min(100, Math.round((currentAmount / targetAmount) * 100)) : 0;
  const isCompleted = pct >= 100;

  // Run calculation projection (Section 3.6)
  const projection: GoalProjectionResult = useMemo(() => {
    return calculateGoalProjection(goal, entries);
  }, [goal, entries]);

  // Fire confetti celebration once if completed
  useEffect(() => {
    if (isCompleted && !hasFiredConfetti) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2DD4A7', '#56f1c2', '#38BDF8', '#F59E0B'],
        });
      } catch {}
      setHasFiredConfetti(true);
    }
  }, [isCompleted, hasFiredConfetti]);

  // SVG Circular progress ring calculations
  // Circumference for r=66 is 2 * PI * 66 = 414.69
  const circumference = 414.69;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col w-full pb-28 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            type="button"
            className="w-10 h-10 -ml-1 rounded-xl bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high active:scale-95 transition-all"
            aria-label="Kembali"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <h1 className="text-lg font-bold text-on-surface truncate">Detail Target</h1>
            <p className="text-[11px] text-outline">Simulasi dan progres pencapaian</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEditGoal(goal)}
            type="button"
            className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface hover:text-primary transition-colors"
            title="Ubah Target"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            type="button"
            className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-error/80 hover:text-error transition-colors"
            title="Hapus Target"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </div>

      {/* Celebratory Banner if 100% achieved */}
      {isCompleted && (
        <section className="relative flex flex-col items-center text-center p-5 rounded-2xl bg-surface-container-low border border-primary/30 shadow-lg overflow-hidden">
          <div className="absolute -top-10 w-64 h-64 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
          <div className="relative mb-3">
            <div className="absolute -inset-2 rounded-full bg-primary/20 blur-md animate-pulse" />
            <div className="relative w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center shadow-xl">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-black font-bold">
                <span className="material-symbols-outlined text-[28px]">military_tech</span>
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold mb-1">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            <span>TARGET TERCAPAI 100%</span>
          </div>
          <h2 className="text-xl font-bold text-on-surface tracking-tight">Selamat! 🎉</h2>
          <p className="text-xs text-on-surface-variant max-w-[280px] mt-1 leading-relaxed">
            Target tabungan impianmu telah terkumpul sepenuhnya. Kerja kerasmu terbayar tuntas!
          </p>
        </section>
      )}

      {/* Target Identity Card */}
      {(() => {
        const customImg = goal.custom_image || (goal.icon?.startsWith('data:image') || goal.icon?.startsWith('http') ? goal.icon : null);
        const showCover = Boolean(customImg && (goal.image_display_mode === 'cover' || goal.image_display_mode === 'both' || !goal.image_display_mode));
        const showIconImg = Boolean(customImg && (goal.image_display_mode === 'icon' || goal.image_display_mode === 'both' || !goal.image_display_mode));

        return (
          <div className="bg-surface-container rounded-3xl p-5 shadow-lg relative overflow-hidden border border-border/40">
            {/* Background Cover */}
            {showCover && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <img
                  src={customImg!}
                  alt=""
                  className="w-full h-full object-cover opacity-25 filter blur-[1px] transform scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/90 to-surface/50" />
              </div>
            )}

            <div className="flex items-start justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden ${
                    showIconImg ? 'ring-2 ring-primary/50 shadow-glow' : ''
                  }`}
                  style={{
                    backgroundColor: `${goal.color || '#2DD4A7'}20`,
                    color: goal.color || '#2DD4A7',
                  }}
                >
                  <GoalIcon
                    icon={showIconImg ? customImg : (goal.image_display_mode === 'cover' ? 'savings' : goal.icon)}
                    size={28}
                  />
                </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{
                    backgroundColor: `${goal.color || '#2DD4A7'}15`,
                    color: goal.color || '#2DD4A7',
                  }}
                >
                  Celengan Impian
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isCompleted
                      ? 'bg-primary/20 text-primary'
                      : projection.status === 'Terlambat'
                      ? 'bg-error/20 text-error'
                      : 'bg-primary/15 text-primary'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                  {projection.status}
                </span>
              </div>
              <h2 className="text-base font-bold text-on-surface truncate mt-1">{goal.name}</h2>
              <p className="text-xs text-on-surface-variant truncate">
                {goal.deadline ? `Tenggat Target: ${formatDateIndo(goal.deadline)}` : 'Target Bebas Tanpa Tenggat'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  })()}

      {/* Alarm Status Banner */}
      {(() => {
        const alarmConfig = getAllGoalAlarms()[goal.id];
        return (
          <div className="bg-surface-container rounded-2xl p-3.5 shadow-sm border border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  alarmConfig?.enabled ? 'bg-primary/20 text-primary' : 'bg-surface-container-high text-outline'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {alarmConfig?.enabled ? 'alarm_on' : 'alarm'}
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-on-surface">Alarm Pengingat Menabung</h4>
                <p className="text-[10px] text-outline">
                  {alarmConfig?.enabled
                    ? `Aktif ${alarmConfig.time} WIB (${
                        alarmConfig.frequency === 'daily'
                          ? 'Setiap Hari'
                          : alarmConfig.frequency === 'weekly'
                          ? 'Mingguan'
                          : 'Bulanan'
                      })`
                    : 'Belum diaktifkan untuk pos ini'}
                </p>
              </div>
            </div>
            <button
              onClick={() => onEditGoal(goal)}
              type="button"
              className="px-2.5 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-xs font-semibold text-primary transition-all active:scale-95"
            >
              {alarmConfig?.enabled ? 'Ubah' : 'Aktifkan'}
            </button>
          </div>
        );
      })()}

      {/* Hero Visual Progress Card */}
      <div className="bg-surface-container rounded-2xl p-5 shadow-sm flex flex-col items-center relative overflow-hidden border border-border/40">
        <div className="w-full flex items-center justify-between mb-2">
          <span className="text-xs text-on-surface-variant font-medium">Progres Capaian</span>
          <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary text-xs font-bold tabular-nums">
            {pct}% Tercapai
          </span>
        </div>

        {/* Circular Progress Graphic */}
        <div className="relative w-44 h-44 flex items-center justify-center my-2">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            <defs>
              <linearGradient id="mintGrad" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#2DD4A7" />
                <stop offset="100%" stopColor="#56f1c2" />
              </linearGradient>
            </defs>
            {/* Background Track */}
            <circle
              cx="80"
              cy="80"
              fill="transparent"
              r="66"
              stroke="#242a3a"
              strokeWidth="12"
            />
            {/* Dynamic Progress Indicator */}
            <circle
              cx="80"
              cy="80"
              fill="transparent"
              r="66"
              stroke="url(#mintGrad)"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              strokeWidth="12"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-on-surface tracking-tight tabular-nums leading-none">
              {pct}%
            </span>
            <span className="text-xs font-semibold text-primary mt-1 flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[14px]">
                {isCompleted ? 'check_circle' : 'hourglass_bottom'}
              </span>{' '}
              {isCompleted ? 'Lunas' : 'Terkumpul'}
            </span>
          </div>
        </div>

        {/* Aggregate Value Display */}
        <div className="flex items-baseline justify-center gap-1.5 mt-1">
          <span className="text-xl font-bold text-primary tabular-nums tracking-tight">
            {formatMoney(currentAmount)}
          </span>
          <span className="text-xs text-on-surface-variant tabular-nums">
            / {formatMoney(targetAmount)}
          </span>
        </div>

        <p className="text-xs text-on-surface-variant mt-1 text-center">
          {projection.isCompleted
            ? 'Target telah selesai tercapai 100%'
            : projection.projectedDateFormatted
            ? `Estimasi selesai: ${projection.projectedDateFormatted}`
            : 'Belum cukup riwayat untuk memproyeksikan'}
        </p>
      </div>

      {/* Key Figures Bento 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-surface-container rounded-xl p-3.5 flex flex-col justify-between shadow-sm border border-border/30">
          <div className="flex items-center justify-between text-outline">
            <span className="text-xs">Terkumpul</span>
            <span className="material-symbols-outlined text-[18px] text-primary">savings</span>
          </div>
          <div className="mt-2">
            <div className="text-sm font-bold text-primary tabular-nums">
              {formatMoney(currentAmount)}
            </div>
            <div className="text-[11px] text-outline mt-0.5">{pct}% dari target</div>
          </div>
        </div>

        <div className="bg-surface-container rounded-xl p-3.5 flex flex-col justify-between shadow-sm border border-border/30">
          <div className="flex items-center justify-between text-outline">
            <span className="text-xs">Sisa Kebutuhan</span>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
              hourglass_top
            </span>
          </div>
          <div className="mt-2">
            <div className="text-sm font-bold text-on-surface tabular-nums">
              {formatMoney(projection.sisa)}
            </div>
            <div className="text-[11px] text-outline mt-0.5">
              {Math.max(0, 100 - pct)}% tersisa
            </div>
          </div>
        </div>

        <div className="bg-surface-container rounded-xl p-3.5 flex flex-col justify-between shadow-sm border border-border/30">
          <div className="flex items-center justify-between text-outline">
            <span className="text-xs">Tenggat Waktu</span>
            <span className="material-symbols-outlined text-[18px] text-secondary">event</span>
          </div>
          <div className="mt-2">
            <div className="text-sm font-bold text-on-surface tabular-nums">
              {goal.deadline ? formatDateIndo(goal.deadline) : 'Fleksibel'}
            </div>
            <div className="text-[11px] text-primary mt-0.5">
              {goal.deadline
                ? `${Math.max(
                    1,
                    Math.round(
                      (new Date(goal.deadline).getTime() - Date.now()) /
                        (1000 * 60 * 60 * 24 * 30)
                    )
                  )} Bulan lagi`
                : 'Sesuai kemampuan'}
            </div>
          </div>
        </div>

        <div className="bg-surface-container rounded-xl p-3.5 flex flex-col justify-between shadow-sm border border-border/30">
          <div className="flex items-center justify-between text-outline">
            <span className="text-xs">Setoran Bulanan</span>
            <span className="material-symbols-outlined text-[18px] text-primary">auto_awesome</span>
          </div>
          <div className="mt-2">
            <div className="text-sm font-bold text-on-surface tabular-nums">
              {projection.monthlyDepositNeeded > 0
                ? formatMoney(projection.monthlyDepositNeeded)
                : '-'}
            </div>
            <div className="text-[11px] text-primary mt-0.5">Rekomendasi Pintar</div>
          </div>
        </div>
      </div>

      {/* Savings Projection Chart Card */}
      <div className="bg-surface-container rounded-2xl p-4 shadow-sm flex flex-col gap-2 border border-border/40">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold text-on-surface">Proyeksi Pertumbuhan</h3>
            <p className="text-xs text-outline">Simulasi saldo hingga target terpenuhi</p>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold tabular-nums">
            {projection.status}
          </span>
        </div>

        {/* Chart Legend */}
        <div className="flex items-center gap-4 text-[11px] text-on-surface-variant pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded-full bg-primary" />
            <span>Aktual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-secondary" />
            <span>Proyeksi Ideal</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>Target Akhir</span>
          </div>
        </div>

        {/* SVG Projection Visualizer matching Google Stitch */}
        <div className="relative w-full h-36 mt-2">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 320 140">
            <defs>
              <linearGradient id="actualAreaGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#2DD4A7" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#2DD4A7" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines */}
            <line stroke="#242a3a" strokeDasharray="2 3" strokeWidth="1" x1="40" x2="310" y1="20" y2="20" />
            <line stroke="#242a3a" strokeDasharray="2 3" strokeWidth="1" x1="40" x2="310" y1="65" y2="65" />
            <line stroke="#242a3a" strokeDasharray="2 3" strokeWidth="1" x1="40" x2="310" y1="110" y2="110" />

            {/* Y Axis Labels */}
            <text fill="#85948d" fontSize="9" textAnchor="end" x="35" y="24">
              100%
            </text>
            <text fill="#85948d" fontSize="9" textAnchor="end" x="35" y="69">
              50%
            </text>
            <text fill="#85948d" fontSize="9" textAnchor="end" x="35" y="114">
              0%
            </text>

            {/* Actual Area and Line */}
            {/* Start (45, 110) -> Current (190, yCurrent) */}
            {(() => {
              const yCurrent = Math.max(20, Math.min(110, 110 - (pct / 100) * 90));
              return (
                <>
                  <polygon
                    fill="url(#actualAreaGrad)"
                    points={`45,110 45,110 115,${(110 + yCurrent) / 2} 190,${yCurrent} 190,110`}
                  />
                  <path
                    d={`M 45 110 Q 115 ${(110 + yCurrent) / 2} 190 ${yCurrent}`}
                    fill="none"
                    stroke="#2DD4A7"
                    strokeLinecap="round"
                    strokeWidth="2.5"
                  />
                  {/* Projected Dashed Line to Target at (295, 20) */}
                  <path
                    d={`M 190 ${yCurrent} Q 240 ${(yCurrent + 20) / 2} 295 20`}
                    fill="none"
                    stroke="#bbc6e8"
                    strokeDasharray="4 4"
                    strokeLinecap="round"
                    strokeWidth="2"
                  />
                  {/* Current point */}
                  <circle cx="190" cy={yCurrent} fill="#2DD4A7" r="5" />
                  <circle cx="190" cy={yCurrent} fill="#2DD4A7" fillOpacity="0.25" r="9" />
                  {/* Target Point */}
                  <circle cx="295" cy="20" fill="#56f1c2" r="5" />
                  <circle cx="295" cy="20" fill="#56f1c2" fillOpacity="0.2" r="10" />
                </>
              );
            })()}

            {/* X Axis Labels */}
            <text fill="#85948d" fontSize="9" textAnchor="middle" x="45" y="128">
              Mulai
            </text>
            <text fill="#2DD4A7" fontSize="9" fontWeight="600" textAnchor="middle" x="190" y="128">
              Saat Ini
            </text>
            <text fill="#85948d" fontSize="9" textAnchor="middle" x="295" y="128">
              Target
            </text>
          </svg>
        </div>
      </div>

      {/* Dual Touch CTAs */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <button
          onClick={() => onOpenTopUp(goal)}
          type="button"
          className="h-12 rounded-xl bg-primary text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-glow active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>Top Up Tabungan</span>
        </button>

        <button
          onClick={() => onOpenWithdraw(goal)}
          type="button"
          disabled={currentAmount <= 0}
          className="h-12 rounded-xl bg-surface-container-high text-on-surface font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[18px] text-outline">north_east</span>
          <span>Tarik Dana</span>
        </button>
      </div>

      {/* Riwayat Setoran */}
      <div className="bg-surface-container rounded-2xl p-4 shadow-sm flex flex-col gap-3 border border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-on-surface">Riwayat Mutasi Celengan</h3>
            <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-outline text-[11px] font-bold">
              {entries.length} Catatan
            </span>
          </div>
        </div>

        {entriesLoading ? (
          <div className="py-6 text-center text-xs text-outline">Memuat riwayat...</div>
        ) : entries.length === 0 ? (
          <div className="py-8 text-center text-xs text-outline flex flex-col items-center">
            <span className="material-symbols-outlined text-outline text-[24px] mb-1">
              receipt_long
            </span>
            <span>Belum ada setoran pada celengan ini.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((entry) => {
              const isTopUp = entry.kind === 'topup';
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-border/20"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isTopUp
                          ? 'bg-primary/20 text-primary'
                          : 'bg-error/20 text-error'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {isTopUp ? 'south_west' : 'north_east'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-on-surface truncate">
                        {entry.note || (isTopUp ? 'Top Up Celengan' : 'Tarik Tabungan')}
                      </p>
                      <p className="text-[10px] text-outline">
                        {formatDateIndo(entry.occurred_on)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-bold tabular-nums ${
                        isTopUp ? 'text-primary' : 'text-error'
                      }`}
                    >
                      {isTopUp ? '+' : '-'}
                      {formatMoney(entry.amount)}
                    </span>
                    <p className="text-[10px] text-outline">Berhasil</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-surface-container-high p-5 shadow-2xl border border-border space-y-4">
            <div className="w-12 h-12 rounded-full bg-error/20 text-error flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[24px]">delete</span>
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-on-surface">Hapus Target Tabungan?</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Seluruh catatan setoran pada target "{goal.name}" akan dihapus. Aksi ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                type="button"
                className="flex-1 py-2.5 rounded-xl bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-bright"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDeleteGoal(goal.id);
                  onBack();
                }}
                type="button"
                className="flex-1 py-2.5 rounded-xl bg-error text-black text-xs font-bold hover:brightness-105"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

