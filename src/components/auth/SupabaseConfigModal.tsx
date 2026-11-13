import React, { useState } from 'react';
import { getSupabaseCredentials, saveCustomSupabaseConfig, clearCustomSupabaseConfig } from '../../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const currentCreds = getSupabaseCredentials();
  const [url, setUrl] = useState<string>(currentCreds.url || '');
  const [anonKey, setAnonKey] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim().startsWith('http://') && !url.trim().startsWith('https://')) {
      setError('URL Supabase harus diawali dengan https://');
      return;
    }
    if (!anonKey.trim()) {
      setError('Anon Key Supabase tidak boleh kosong');
      return;
    }
    saveCustomSupabaseConfig(url, anonKey);
    onClose();
  };

  const handleReset = () => {
    if (window.confirm('Reset konfigurasi Supabase ke bawaan .env?')) {
      clearCustomSupabaseConfig();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container rounded-2xl p-5 shadow-2xl border border-border/40 max-w-md w-full space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">cloud</span>
            <h2 className="text-base font-bold text-on-surface">Hubungkan Supabase Cloud</h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <p className="text-xs text-on-surface-variant leading-relaxed">
          Hubungkan aplikasi langsung ke backend Supabase Anda tanpa perlu mengedit kode atau berkas <code className="bg-surface-container-highest px-1 py-0.5 rounded text-[11px]">.env</code>.
        </p>

        {error && (
          <div className="p-2.5 rounded-xl bg-error/15 border border-error/30 text-error text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-on-surface-variant block">
              Project URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyz.supabase.co"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-border/40 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-on-surface-variant block">
              Anon / Public API Key
            </label>
            <textarea
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOi..."
              rows={3}
              required
              className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-border/40 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary font-mono text-[10px]"
            />
          </div>

          <div className="pt-2 flex items-center justify-between gap-2">
            {currentCreds.isCustom && (
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-expense hover:bg-expense/10 transition-colors"
              >
                Reset Bawaan
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-md hover:brightness-105 active:scale-95 transition-all"
              >
                Simpan & Muat Ulang
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

