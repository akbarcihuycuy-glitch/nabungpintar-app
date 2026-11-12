import React, { useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { ChangePasswordModal } from './ChangePasswordModal';
import { SecuritySettingsModal } from '../security/SecuritySettingsModal';

interface ProfileHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalTransactions?: number;
  activeGoalsCount?: number;
  healthScore?: number;
  savingsRatio?: number;
}

const AVATAR_COLORS = [
  '#2DD4A7', // Mint
  '#38BDF8', // Cyan
  '#A78BFA', // Purple
  '#F472B6', // Rose
  '#FBBF24', // Amber
  '#34D399', // Emerald
];

export const ProfileHubModal: React.FC<ProfileHubModalProps> = ({
  isOpen,
  onClose,
  totalTransactions = 0,
  activeGoalsCount = 0,
  healthScore = 75,
  savingsRatio = 20,
}) => {
  const { user, isGuest, updateUserProfile, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local state
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>(() => {
    return localStorage.getItem('np_user_avatar_color') || '#2DD4A7';
  });

  if (!isOpen) return null;

  // Retrieve current profile attributes
  const cachedAvatar = typeof window !== 'undefined' ? localStorage.getItem('np_user_avatar') : null;
  const currentAvatarUrl =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    cachedAvatar ||
    null;

  const currentFullName =
    user?.user_metadata?.full_name ||
    (typeof window !== 'undefined' ? localStorage.getItem('np_user_name') : null) ||
    user?.email?.split('@')[0] ||
    'Pengguna';

  const email = user?.email || (isGuest ? 'Mode Tamu (Offline)' : 'Tamu');
  const userInitial = currentFullName.charAt(0).toUpperCase();

  // Financial Level Calculation
  const isMasterSaver = healthScore >= 80 || savingsRatio >= 30;
  const isDisciplined = !isMasterSaver && (healthScore >= 60 || savingsRatio >= 20);

  const levelInfo = isMasterSaver
    ? {
        title: 'Master Saver',
        badge: '🏆 Master Saver',
        desc: 'Skor kesehatan finansial Anda sangat prima & disiplin!',
        accent: 'text-primary border-primary/40 bg-primary/10 shadow-glow',
        pillBg: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30',
      }
    : isDisciplined
    ? {
        title: 'Penabung Disiplin',
        badge: '✨ Penabung Disiplin',
        desc: 'Arus kas sehat dan konsisten menyisihkan tabungan.',
        accent: 'text-sky-400 border-sky-500/40 bg-sky-500/10',
        pillBg: 'from-sky-500/20 to-blue-500/10 text-sky-400 border-sky-500/30',
      }
    : {
        title: 'Pemula Finansial',
        badge: '🌱 Pemula Finansial',
        desc: 'Ayo tingkatkan pos tabungan dan pantau pengeluaran harian.',
        accent: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
        pillBg: 'from-amber-500/20 to-yellow-500/10 text-amber-400 border-amber-500/30',
      };

  // Image compressor & handler
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        // Compress using Canvas max 256x256
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
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);

          try {
            await updateUserProfile({ avatar_url: compressedDataUrl });
          } catch (err) {
            console.warn('Update avatar error:', err);
          } finally {
            setIsUploadingPhoto(false);
          }
        } else {
          setIsUploadingPhoto(false);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleStartEditName = () => {
    setNameInput(currentFullName);
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setIsSavingName(true);
    try {
      await updateUserProfile({ full_name: trimmed });
      setIsEditingName(false);
    } catch (err) {
      console.warn('Save name error:', err);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleColorSelect = (colorHex: string) => {
    setSelectedColor(colorHex);
    try {
      localStorage.setItem('np_user_avatar_color', colorHex);
    } catch {}
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-surface/90 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border border-white/10 text-on-surface overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 relative z-10 border-b border-border/40">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">manage_accounts</span>
            <h2 className="text-base font-bold text-on-surface">Profil & Hub Akun</h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-surface-container-high/80 hover:bg-surface-container-highest flex items-center justify-center text-outline hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Profile Details Area */}
        <div className="mt-4 flex flex-col items-center text-center relative z-10">
          {/* Avatar with Camera Overlay */}
          <div className="relative group">
            <div
              className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center shadow-lg border-2 transition-transform duration-200 group-hover:scale-105"
              style={{
                borderColor: selectedColor,
                backgroundColor: `${selectedColor}25`,
              }}
            >
              {currentAvatarUrl ? (
                <img
                  src={currentAvatarUrl}
                  alt={currentFullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span
                  className="text-2xl font-black select-none"
                  style={{ color: selectedColor }}
                >
                  {userInitial}
                </span>
              )}
            </div>

            {/* Camera Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              type="button"
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-black flex items-center justify-center shadow-md hover:brightness-110 active:scale-95 transition-all"
              title="Unggah Foto Profil"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isUploadingPhoto ? 'sync' : 'photo_camera'}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>

          {/* Color Palettes for Avatar */}
          <div className="flex items-center gap-1.5 mt-2.5">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handleColorSelect(c)}
                className={`w-4 h-4 rounded-full transition-transform ${
                  selectedColor === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* Display Name + Edit Toggle */}
          <div className="mt-3 w-full">
            {isEditingName ? (
              <div className="flex items-center gap-2 max-w-xs mx-auto">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Nama Lengkap"
                  className="flex-1 px-3 py-1.5 text-sm rounded-xl bg-surface-container-high border border-primary text-on-surface focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  disabled={isSavingName}
                  type="button"
                  className="px-3 py-1.5 rounded-xl bg-primary text-black font-bold text-xs hover:brightness-105 active:scale-95 transition-all"
                >
                  {isSavingName ? '...' : 'Simpan'}
                </button>
                <button
                  onClick={() => setIsEditingName(false)}
                  type="button"
                  className="w-7 h-7 rounded-xl bg-surface-container-high text-outline hover:text-on-surface flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5">
                <h3 className="text-base font-bold text-on-surface">{currentFullName}</h3>
                <button
                  onClick={handleStartEditName}
                  type="button"
                  className="text-outline hover:text-primary transition-colors p-0.5"
                  title="Ubah Nama"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
              </div>
            )}
            <p className="text-xs text-outline mt-0.5">{email}</p>
          </div>

          {/* Financial Level Badge */}
          <div className={`mt-3 px-3.5 py-1.5 rounded-full border bg-gradient-to-r ${levelInfo.pillBg} flex items-center gap-2 shadow-sm`}>
            <span className="text-xs font-bold tracking-wide">{levelInfo.badge}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
            <span className="text-[10px] font-medium opacity-90">Skor {healthScore}/100</span>
          </div>
          <p className="text-[11px] text-outline mt-1 max-w-xs">{levelInfo.desc}</p>
        </div>

        {/* 3 Mini Stats Cards */}
        <div className="grid grid-cols-3 gap-2 mt-4 relative z-10">
          <div className="p-2.5 rounded-2xl bg-surface-container/60 border border-border/40 text-center">
            <span className="text-[10px] uppercase tracking-wider text-outline block font-medium">
              Transaksi
            </span>
            <span className="text-base font-bold text-on-surface tabular-nums mt-0.5 block">
              {totalTransactions}
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-surface-container/60 border border-border/40 text-center">
            <span className="text-[10px] uppercase tracking-wider text-outline block font-medium">
              Target Aktif
            </span>
            <span className="text-base font-bold text-primary tabular-nums mt-0.5 block">
              {activeGoalsCount}
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-surface-container/60 border border-border/40 text-center">
            <span className="text-[10px] uppercase tracking-wider text-outline block font-medium">
              Rasio Tabung
            </span>
            <span className="text-base font-bold text-emerald-400 tabular-nums mt-0.5 block">
              {savingsRatio}%
            </span>
          </div>
        </div>

        {/* Quick Preferences & Cloud Status */}
        <div className="mt-4 space-y-2 relative z-10">
          {/* Theme Quick Switcher */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container/60 border border-border/40">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px] text-primary">
                {isDark ? 'dark_mode' : 'light_mode'}
              </span>
              <div className="text-left">
                <span className="text-xs font-semibold text-on-surface block">
                  Tema Tampilan
                </span>
                <span className="text-[10px] text-outline">
                  {isDark ? 'Mode Gelap (OLED Friendly)' : 'Mode Terang (Bersih & Kontras)'}
                </span>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              type="button"
              className="px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-xs font-bold text-on-surface transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">sync_alt</span>
              <span>{isDark ? 'Ganti Terang' : 'Ganti Gelap'}</span>
            </button>
          </div>

          {/* Cloud Sync Status */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container/60 border border-border/40">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px] text-tertiary">cloud_done</span>
              <div className="text-left">
                <span className="text-xs font-semibold text-on-surface block">
                  Sinkronisasi Cloud
                </span>
                <span className="text-[10px] text-outline">
                  {user ? 'Tersambung ke Supabase Cloud' : 'Mode Tamu Offline'}
                </span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
              Live
            </span>
          </div>

          {/* Security & PIN Lock */}
          <button
            type="button"
            onClick={() => setIsSecurityOpen(true)}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-surface-container/60 hover:bg-surface-container-high border border-border/40 transition-all active:scale-[0.99] text-left"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px] text-primary">security</span>
              <div>
                <span className="text-xs font-semibold text-on-surface block">
                  Kunci PIN & Biometrik
                </span>
                <span className="text-[10px] text-outline">
                  Amankan akses aplikasi di perangkat ini
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline text-[18px]">chevron_right</span>
          </button>

          {/* Change Password */}
          {user && (
            <button
              type="button"
              onClick={() => setIsChangePasswordOpen(true)}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-surface-container/60 hover:bg-surface-container-high border border-border/40 transition-all active:scale-[0.99] text-left"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-outline">password</span>
                <div>
                  <span className="text-xs font-semibold text-on-surface block">
                    Ubah Kata Sandi
                  </span>
                  <span className="text-[10px] text-outline">
                    Perbarui kata sandi akun login Anda
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline text-[18px]">chevron_right</span>
            </button>
          )}
        </div>

        {/* Logout Section with Step-2 Confirmation */}
        <div className="mt-4 pt-3 border-t border-border/40 relative z-10">
          {showLogoutConfirm ? (
            <div className="p-3 rounded-2xl bg-expense/10 border border-expense/30 space-y-2 animate-fade-in">
              <p className="text-xs font-bold text-expense">Yakin ingin keluar akun?</p>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Cache sesi lokal akan dibersihkan. Data Anda tetap tersimpan aman di database Supabase Cloud.
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-3 py-1.5 rounded-xl bg-surface-container-high text-xs font-semibold text-on-surface hover:bg-surface-container-highest transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3.5 py-1.5 rounded-xl bg-expense text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm"
                >
                  Ya, Keluar Akun
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full py-2.5 rounded-xl bg-expense/15 hover:bg-expense/25 text-expense border border-expense/30 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Keluar dari Akun</span>
            </button>
          )}
        </div>
      </div>

      {/* Security & PIN Lock Modal */}
      <SecuritySettingsModal
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
};

