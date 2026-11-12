import React, { useState } from 'react';
import { SyncState } from '../../hooks/useSyncStatus';

interface SyncStatusSheetProps {
  isOpen: boolean;
  onClose: () => void;
  syncState: SyncState;
  lastSyncedTime: Date;
  pendingCount: number;
  isOnline: boolean;
  wifiOnly: boolean;
  onToggleWifiOnly: () => void;
  onTriggerSync: () => Promise<void>;
}

export const SyncStatusSheet: React.FC<SyncStatusSheetProps> = ({
  isOpen,
  onClose,
  syncState,
  lastSyncedTime,
  pendingCount,
  isOnline,
  wifiOnly,
  onToggleWifiOnly,
  onTriggerSync,
}) => {
  const [isSyncingAction, setIsSyncingAction] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    setIsSyncingAction(true);
    await onTriggerSync();
    setTimeout(() => {
      setIsSyncingAction(false);
    }, 600);
  };

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-surface-container rounded-t-[28px] p-5 pb-8 shadow-2xl border-t border-border/40 space-y-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="w-12 h-1.5 rounded-full bg-surface-variant mx-auto -mt-1 cursor-pointer" onClick={onClose} />

        {/* Header Section */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col pr-2">
            <div className="flex items-center space-x-2">
              <span className="material-symbols-outlined text-primary text-[22px]">cloud_sync</span>
              <h2 className="text-base font-bold text-on-surface">Status Sinkronisasi Cloud & Lokal</h2>
            </div>
            <p className="text-xs text-on-surface-variant mt-1 leading-snug">
              Sinkronisasi instan multi-perangkat terenkripsi end-to-end tanpa jeda.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Sync Timestamp Badge */}
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-surface-container-high border border-border/30">
          <div className="flex items-center space-x-2">
            <span
              className={`w-2 h-2 rounded-full ${
                syncState === 'synced'
                  ? 'bg-primary'
                  : syncState === 'syncing'
                  ? 'bg-primary animate-ping'
                  : 'bg-amber-400'
              }`}
            />
            <span className="text-xs text-on-surface font-medium">
              Terakhir disinkronkan: {formatTime(lastSyncedTime)}
            </span>
          </div>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              syncState === 'synced'
                ? 'bg-primary/15 text-primary'
                : syncState === 'syncing'
                ? 'bg-primary-container/20 text-primary'
                : 'bg-amber-400/15 text-amber-400'
            }`}
          >
            {syncState === 'synced' ? 'Optimal' : syncState === 'syncing' ? 'Menyinkronkan' : 'Offline'}
          </span>
        </div>

        {/* 3 Metrics Bento Grid */}
        <div className="grid grid-cols-3 gap-2">
          {/* Metric 1 */}
          <div className="bg-surface-container-high p-3 rounded-xl border border-border/30 flex flex-col justify-between">
            <span className="text-[11px] text-on-surface-variant">Perubahan Menunggu</span>
            <div className="mt-2">
              <span className="text-sm font-bold text-on-surface block tabular-nums">
                {pendingCount} Data
              </span>
              <span className="text-[10px] text-primary">
                {pendingCount > 0 ? 'Siap diunggah' : 'Tersimpan'}
              </span>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="bg-surface-container-high p-3 rounded-xl border border-border/30 flex flex-col justify-between">
            <span className="text-[11px] text-on-surface-variant">Status Jaringan</span>
            <div className="mt-2">
              <span
                className={`text-sm font-bold block truncate ${
                  isOnline ? 'text-primary' : 'text-amber-400'
                }`}
              >
                {isOnline ? 'Online' : 'Offline'}
              </span>
              <span className="text-[10px] text-on-surface-variant truncate">
                {isOnline ? 'Wi-Fi / Seluler Aktif' : 'Mode Terputus'}
              </span>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="bg-surface-container-high p-3 rounded-xl border border-border/30 flex flex-col justify-between">
            <span className="text-[11px] text-on-surface-variant">Kapasitas Cloud</span>
            <div className="mt-2">
              <span className="text-sm font-bold text-on-surface block tabular-nums">1.2 MB</span>
              <span className="text-[10px] text-on-surface-variant">dari 100 MB</span>
            </div>
          </div>
        </div>

        {/* Storage Progress Visual Bar */}
        <div className="bg-surface-container-high p-3 rounded-xl border border-border/30 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-on-surface-variant">Penggunaan Ruang Ledger</span>
            <span className="text-primary font-semibold tabular-nums">1.2% Terpakai</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
            <div className="w-[1.2%] h-full bg-primary rounded-full" />
          </div>
        </div>

        {/* Connected Devices Section */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface">Perangkat Terhubung</span>
            <span className="text-[10px] text-on-surface-variant">3 Aktif</span>
          </div>

          <div className="space-y-2">
            {/* Device 1: Current */}
            <div className="bg-surface-container-high p-3 rounded-xl border border-border/30 flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    phone_iphone
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-on-surface truncate">
                      Perangkat Ini (PWA Standalone)
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-primary text-on-primary text-[9px] font-bold">
                      Utama
                    </span>
                  </div>
                  <span className="text-[10px] text-primary flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Aktif sekarang • Enkripsi AES-256
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
            </div>

            {/* Device 2: Laptop */}
            <div className="bg-surface-container-high p-3 rounded-xl border border-border/30 flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                    laptop_mac
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-on-surface truncate">
                    MacBook Air (Chrome Browser)
                  </span>
                  <span className="text-[10px] text-on-surface-variant">
                    Terakhir aktif 1 jam lalu
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-[16px] text-outline">sync</span>
            </div>
          </div>
        </div>

        {/* Preferences Toggle: Wi-Fi Only */}
        <div className="bg-surface-container-high p-3 rounded-xl border border-border/30 flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0 pr-2">
            <span className="material-symbols-outlined text-primary text-[20px]">wifi</span>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-on-surface">Sinkronisasi Otomatis Wi-Fi</span>
              <span className="text-[10px] text-on-surface-variant">
                Hemat kuota seluler & daya baterai
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleWifiOnly}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              wifiOnly ? 'bg-primary' : 'bg-surface-container-highest'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${
                wifiOnly ? 'bg-black right-1' : 'bg-white left-1'
              }`}
            />
          </button>
        </div>

        {/* Main Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncingAction}
            className="w-full h-11 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center justify-center space-x-2 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 hover:brightness-105 disabled:opacity-60"
          >
            <span
              className={`material-symbols-outlined text-[18px] ${
                isSyncingAction ? 'animate-spin' : ''
              }`}
            >
              sync
            </span>
            <span>{isSyncingAction ? 'Menyinkronkan Data...' : 'Sinkronkan Sekarang'}</span>
          </button>
          <p className="text-[10px] text-center text-on-surface-variant mt-2">
            Data keuangan Anda dienkripsi otomatis sebelum dikirimkan ke cloud NabungPintar.
          </p>
        </div>
      </div>
    </div>
  );
};
