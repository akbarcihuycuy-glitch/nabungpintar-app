import React, { useState, useEffect, useRef } from 'react';
import { SavingsGoal } from '../../types/database';
import { GoalIcon, isCustomImageIcon } from '../common/GoalIcon';
import {
  getAllGoalAlarms,
  saveGoalAlarm,
  removeGoalAlarm,
  playChimeSound,
  requestNotificationPermission,
} from '../../services/alarm';

interface CreateEditGoalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  goalToEdit?: SavingsGoal | null;
  onSave: (goal: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at' | 'current_amount'>) => Promise<any>;
  onUpdate?: (id: string, updates: Partial<SavingsGoal>) => Promise<any>;
}

const FINTECH_ICONS = [
  'savings',
  'laptop_mac',
  'home',
  'directions_car',
  'flight_takeoff',
  'favorite',
  'medical_services',
  'school',
  'shopping_bag',
  'phone_iphone',
  'diamond',
  'pets',
  'fitness_center',
  'sports_esports',
  'wallet',
  'credit_card',
  'apartment',
  'beach_access',
];

const CURATED_EMOJIS = [
  '🚗', '🏠', '✈️', '💻', '💍', '📱',
  '🎓', '🏥', '👶', '🏖️', '💰', '🛒',
  '🚲', '🛵', '☕', '🎮', '🎁', '🎸',
  '🐶', '🐱', '🏋️', '📚', '🔑', '🚀',
];

const AVAILABLE_COLORS = [
  { hex: '#2DD4A7', name: 'Mint' },
  { hex: '#38BDF8', name: 'Cyan' },
  { hex: '#8B5CF6', name: 'Violet' },
  { hex: '#F59E0B', name: 'Amber' },
  { hex: '#F43F5E', name: 'Rose' },
  { hex: '#10B981', name: 'Emerald' },
];

export const CreateEditGoalSheet: React.FC<CreateEditGoalSheetProps> = ({
  isOpen,
  onClose,
  goalToEdit,
  onSave,
  onUpdate,
}) => {
  const [name, setName] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('savings');
  const [selectedColor, setSelectedColor] = useState('#2DD4A7');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Icon Selector Tab: 'fintech' | 'emoji' | 'upload'
  const [iconTab, setIconTab] = useState<'fintech' | 'emoji' | 'upload'>('fintech');
  const [imageDisplayMode, setImageDisplayMode] = useState<'both' | 'cover' | 'icon'>('both');
  const [customEmoji, setCustomEmoji] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Alarm settings
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [alarmTime, setAlarmTime] = useState('09:00');
  const [alarmFreq, setAlarmFreq] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    if (goalToEdit) {
      setName(goalToEdit.name);
      setTargetAmountStr(goalToEdit.target_amount.toString());
      setDeadline(goalToEdit.deadline || '');
      setSelectedIcon(goalToEdit.icon || 'savings');
      setSelectedColor(goalToEdit.color || '#2DD4A7');
      setImageDisplayMode(goalToEdit.image_display_mode || 'both');

      // Check existing alarm
      const allAlarms = getAllGoalAlarms();
      const existing = allAlarms[goalToEdit.id];
      if (existing) {
        setAlarmEnabled(existing.enabled);
        setAlarmTime(existing.time || '09:00');
        setAlarmFreq(existing.frequency || 'daily');
      } else {
        setAlarmEnabled(false);
        setAlarmTime('09:00');
        setAlarmFreq('daily');
      }
    } else {
      setName('');
      setTargetAmountStr('');
      setDeadline('');
      setSelectedIcon('savings');
      setSelectedColor('#2DD4A7');
      setImageDisplayMode('both');
      setAlarmEnabled(false);
      setAlarmTime('09:00');
      setAlarmFreq('daily');
    }

    setIconTab('fintech');
    setCustomEmoji('');
    setErrorMsg(null);
  }, [goalToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setTargetAmountStr(raw);
  };

  const formattedAmountDisplay = targetAmountStr
    ? Number(targetAmountStr).toLocaleString('id-ID')
    : '';

  // Custom Image Upload handler with Canvas Compression
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setSelectedIcon(compressed);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleToggleAlarm = async () => {
    const next = !alarmEnabled;
    setAlarmEnabled(next);
    if (next) {
      await requestNotificationPermission();
    }
  };

  const handleTestChime = () => {
    playChimeSound();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama target tidak boleh kosong');
      return;
    }
    const amt = Number(targetAmountStr);
    if (!amt || amt <= 0) {
      setErrorMsg('Target nominal harus lebih dari 0');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      let savedGoalId = goalToEdit?.id;

      if (goalToEdit && onUpdate) {
        await onUpdate(goalToEdit.id, {
          name: name.trim(),
          target_amount: amt,
          deadline: deadline || null,
          icon: selectedIcon,
          color: selectedColor,
          custom_image: isCustomImageIcon(selectedIcon) ? selectedIcon : null,
          image_display_mode: imageDisplayMode,
        });
      } else {
        const res = await onSave({
          name: name.trim(),
          target_amount: amt,
          deadline: deadline || null,
          icon: selectedIcon,
          color: selectedColor,
          custom_image: isCustomImageIcon(selectedIcon) ? selectedIcon : null,
          image_display_mode: imageDisplayMode,
          archived: false,
        });
        if (res && res.id) {
          savedGoalId = res.id;
        }
      }

      // Handle Alarm save / remove
      if (savedGoalId) {
        if (alarmEnabled) {
          saveGoalAlarm({
            goalId: savedGoalId,
            goalName: name.trim(),
            enabled: true,
            time: alarmTime,
            frequency: alarmFreq,
          });
        } else {
          removeGoalAlarm(savedGoalId);
        }
      }

      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menyimpan target');
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

        {/* Sheet Header */}
        <div className="flex items-center justify-between pb-3 mb-2">
          <div className="flex items-center gap-2.5">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden"
              style={{ backgroundColor: `${selectedColor}20`, color: selectedColor }}
            >
              <GoalIcon icon={selectedIcon} size={24} />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">
                {goalToEdit ? 'Ubah Target Tabungan' : 'Buat Target Baru'}
              </h2>
              <p className="text-xs text-outline">Rencanakan pos simpanan impianmu</p>
            </div>
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Field: Nama Target */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-outline">
              Nama Target Impian
            </label>
            <div className="flex items-center px-3.5 h-12 rounded-xl bg-surface-container-high border border-border/40 focus-within:border-primary">
              <div className="w-6 h-6 mr-2.5 flex items-center justify-center shrink-0">
                <GoalIcon icon={selectedIcon} size={20} />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Dana Darurat, Liburan Jepang, Mobil Baru"
                className="bg-transparent text-sm text-on-surface focus:outline-none w-full"
                required
              />
            </div>
          </div>

          {/* Field: Target Nominal */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-outline">
              Target Nominal (Rp)
            </label>
            <div className="flex items-center justify-between px-3.5 h-12 rounded-xl bg-surface-container-high border border-border/40 focus-within:border-primary">
              <span className="text-sm font-bold text-outline">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={formattedAmountDisplay}
                onChange={handleAmountChange}
                placeholder="0"
                className="bg-transparent text-right text-lg font-bold text-primary focus:outline-none w-full tabular-nums"
                required
              />
            </div>
          </div>

          {/* Field: Tenggat Waktu (Opsional) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-outline">
              Tenggat Waktu (Opsional)
            </label>
            <div className="flex items-center px-3.5 h-12 rounded-xl bg-surface-container-high border border-border/40 focus-within:border-primary">
              <span className="material-symbols-outlined text-outline text-[20px] mr-2.5">
                calendar_month
              </span>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="bg-transparent text-sm text-on-surface focus:outline-none w-full"
              />
            </div>
          </div>

          {/* Field: Multi-Tab Ikon Celengan */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-outline">
                Pilih Ikon atau Gambar
              </label>

              {/* Tabs */}
              <div className="flex items-center p-0.5 rounded-lg bg-surface-container-high border border-border/40">
                <button
                  type="button"
                  onClick={() => setIconTab('fintech')}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                    iconTab === 'fintech'
                      ? 'bg-primary text-black shadow-sm'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  Ikon FinTech
                </button>
                <button
                  type="button"
                  onClick={() => setIconTab('emoji')}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                    iconTab === 'emoji'
                      ? 'bg-primary text-black shadow-sm'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  Emoji
                </button>
                <button
                  type="button"
                  onClick={() => setIconTab('upload')}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                    iconTab === 'upload'
                      ? 'bg-primary text-black shadow-sm'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  + Unggah Foto
                </button>
              </div>
            </div>

            {/* Tab 1: FinTech Material Symbols */}
            {iconTab === 'fintech' && (
              <div className="grid grid-cols-6 gap-2">
                {FINTECH_ICONS.map((icon) => {
                  const isSelected = selectedIcon === icon;
                  return (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setSelectedIcon(icon)}
                      className={`h-11 rounded-xl flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-primary/20 text-primary border border-primary/50 shadow-sm scale-105'
                          : 'bg-surface-container-high text-outline hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{icon}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Tab 2: Curated Emoji + Custom Input */}
            {iconTab === 'emoji' && (
              <div className="space-y-2">
                <div className="grid grid-cols-6 gap-2">
                  {CURATED_EMOJIS.map((emoji) => {
                    const isSelected = selectedIcon === emoji;
                    return (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setSelectedIcon(emoji)}
                        className={`h-11 rounded-xl flex items-center justify-center text-xl transition-all ${
                          isSelected
                            ? 'bg-primary/25 border border-primary/50 shadow-sm scale-105'
                            : 'bg-surface-container-high hover:bg-surface-container-highest'
                        }`}
                      >
                        {emoji}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={customEmoji}
                    onChange={(e) => setCustomEmoji(e.target.value)}
                    placeholder="Atau ketik emoji sendiri (misal: 💎, 🛵)"
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-surface-container-high border border-border/40 text-on-surface focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customEmoji.trim()) {
                        setSelectedIcon(customEmoji.trim());
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary text-xs font-bold border border-primary/30"
                  >
                    Gunakan
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: Upload Custom Image / Photo */}
            {iconTab === 'upload' && (
              <div className="p-4 rounded-2xl bg-surface-container-high border border-dashed border-primary/40 text-center space-y-3">
                {isCustomImageIcon(selectedIcon) ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-primary shadow-glow">
                      <img
                        src={selectedIcon}
                        alt="Foto Pilihan"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs font-semibold text-primary">
                      Foto Impian Terpasang!
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1 rounded-lg bg-surface-container-highest text-[11px] text-on-surface hover:text-primary transition-colors"
                    >
                      Ganti Foto Lain
                    </button>
                    {/* Mode Tampilan Gambar */}
                    <div className="w-full pt-2 border-t border-border/30 text-left">
                      <label className="text-[10px] font-bold text-outline uppercase block mb-1.5">
                        Gaya Tampilan Gambar Kartu
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: 'both', label: 'Cover & Ikon', desc: 'Gabungan' },
                          { id: 'cover', label: 'Cover Kaca', desc: 'Banner Penuh' },
                          { id: 'icon', label: 'Ikon Pojok', desc: 'Ikon Saja' },
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setImageDisplayMode(m.id as any)}
                            className={`p-2 rounded-xl text-center border transition-all ${
                              imageDisplayMode === m.id
                                ? 'bg-primary/20 text-primary border-primary shadow-sm'
                                : 'bg-surface-container hover:bg-surface-container-highest border-border/40 text-outline'
                            }`}
                          >
                            <span className="text-[11px] font-bold block">{m.label}</span>
                            <span className="text-[9px] opacity-75 block">{m.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 py-2">
                    <span className="material-symbols-outlined text-[32px] text-primary">
                      add_photo_alternate
                    </span>
                    <p className="text-xs font-semibold text-on-surface">
                      Unggah foto impianmu dari galeri perangkat
                    </p>
                    <p className="text-[10px] text-outline">
                      Format PNG, JPG, WebP otomatis dioptimalkan
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-1 px-4 py-2 rounded-xl bg-primary text-black font-bold text-xs shadow-sm hover:brightness-105 active:scale-95 transition-all"
                    >
                      Pilih dari Perangkat
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            )}
          </div>

          {/* Field: Warna Aksen */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-outline">
              Warna Aksen Kartu
            </label>
            <div className="flex items-center justify-between px-2 py-1">
              {AVAILABLE_COLORS.map((col) => {
                const isSelected = selectedColor === col.hex;
                return (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => setSelectedColor(col.hex)}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-sm"
                    style={{
                      backgroundColor: col.hex,
                      outline: isSelected ? '2px solid white' : 'none',
                      outlineOffset: '2px',
                    }}
                    title={col.name}
                  >
                    {isSelected && (
                      <span className="material-symbols-outlined text-black text-[18px] font-bold">
                        check
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Alarm & Notifikasi Pengingat Menabung */}
          <div className="p-3.5 rounded-2xl bg-surface-container-high/80 border border-primary/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">alarm</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-on-surface">
                    Alarm Pengingat Menabung
                  </h4>
                  <p className="text-[10px] text-outline">
                    Notifikasi & alunan nada otomatis untuk pos ini
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={handleToggleAlarm}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                  alarmEnabled ? 'bg-primary' : 'bg-surface-container-highest'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    alarmEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {alarmEnabled && (
              <div className="space-y-2.5 pt-2 border-t border-border/30 animate-fade-in">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-outline block mb-1">
                      Waktu Pengingat (WIB)
                    </label>
                    <input
                      type="time"
                      value={alarmTime}
                      onChange={(e) => setAlarmTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface-container text-xs text-on-surface border border-border/40 focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-outline block mb-1">
                      Frekuensi
                    </label>
                    <select
                      value={alarmFreq}
                      onChange={(e) => setAlarmFreq(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-surface-container text-xs text-on-surface border border-border/40 focus:outline-none focus:border-primary"
                    >
                      <option value="daily">Setiap Hari</option>
                      <option value="weekly">Mingguan</option>
                      <option value="monthly">Bulanan (Gajian)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-outline">
                    Bunyi melodi arpeggio Web Audio
                  </span>
                  <button
                    type="button"
                    onClick={handleTestChime}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/15 text-primary text-[10px] font-bold hover:bg-primary/25 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">volume_up</span>
                    <span>Uji Suara</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 mt-1 rounded-xl bg-primary text-black font-bold text-xs flex items-center justify-center gap-2 shadow-glow hover:brightness-105 active:scale-95 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">
              {goalToEdit ? 'save' : 'add_circle'}
            </span>
            <span>
              {isSubmitting
                ? 'Menyimpan...'
                : goalToEdit
                ? 'Simpan Perubahan'
                : 'Buat Target Tabungan'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
