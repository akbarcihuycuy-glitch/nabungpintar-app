import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { ThemeMode } from '../../types/database';

interface ThemeSettingsScreenProps {
  onBack: () => void;
}

export const ThemeSettingsScreen: React.FC<ThemeSettingsScreenProps> = ({ onBack }) => {
  const { theme, setTheme } = useTheme();

  const handleSelect = (mode: ThemeMode) => {
    setTheme(mode);
  };

  return (
    <div className="flex flex-col w-full pb-28 space-y-5 animate-fade-in">
      {/* Top Navigation & Header Context */}
      <div className="flex flex-col space-y-1.5 pt-1">
        <button
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors py-1 w-fit group"
        >
          <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">
            arrow_back
          </span>
          <span className="text-xs font-semibold">Pengaturan</span>
        </button>
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-on-surface tracking-tight">Pengaturan Tema</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Pilih tampilan antarmuka yang nyaman di mata untuk pencatatan keuangan Anda.
          </p>
        </div>
      </div>

      {/* Interactive Theme Preview Cards Grid */}
      <div className="flex flex-col space-y-3.5">
        {/* Option 1: Terang (Light Mode) */}
        <div
          onClick={() => handleSelect('light')}
          className={`relative rounded-2xl p-4 cursor-pointer transition-all duration-200 active:scale-[0.99] border ${
            theme === 'light'
              ? 'bg-surface-container-high ring-2 ring-primary border-primary/50 shadow-md'
              : 'bg-surface-container-low border-border/30 hover:border-border/60 shadow-sm'
          }`}
        >
          {theme === 'light' && (
            <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px] font-bold">check</span>
              Aktif
            </div>
          )}

          <div className="flex items-start gap-3.5">
            {/* Realistic Mini UI Preview */}
            <div className="w-20 h-24 rounded-xl overflow-hidden shrink-0 bg-[#f8fafc] p-1.5 flex flex-col justify-between shadow-inner select-none pointer-events-none border border-slate-200">
              <div className="flex items-center justify-between px-1 pt-0.5">
                <div className="w-4 h-1.5 bg-[#0f172a] rounded-full" />
                <div className="w-2 h-2 rounded-full bg-[#10b981]" />
              </div>
              <div className="bg-[#ffffff] rounded-md p-1.5 space-y-1 shadow-sm">
                <div className="w-6 h-1 bg-[#64748b] rounded-full" />
                <div className="w-10 h-1.5 bg-[#0f172a] rounded-sm font-bold" />
                <div className="w-full bg-[#e2e8f0] h-1 rounded-full overflow-hidden">
                  <div className="bg-[#10b981] h-full w-2/3" />
                </div>
              </div>
              <div className="flex items-center justify-between gap-1 px-0.5">
                <div className="flex-1 bg-[#10b981] h-2.5 rounded flex items-center justify-center">
                  <div className="w-4 h-0.5 bg-[#ffffff] rounded-full" />
                </div>
                <div className="w-3 h-2.5 bg-[#e2e8f0] rounded flex items-center justify-center">
                  <div className="w-1 h-1 bg-[#64748b] rounded-full" />
                </div>
              </div>
            </div>

            {/* Description & Controls */}
            <div className="flex-1 flex flex-col justify-between self-stretch min-w-0">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-sm font-bold truncate ${
                      theme === 'light' ? 'text-primary' : 'text-on-surface'
                    }`}
                  >
                    Mode Terang
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      theme === 'light' ? 'bg-primary' : 'bg-surface-container-highest'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        theme === 'light' ? 'bg-on-primary' : 'bg-transparent'
                      }`}
                    />
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant line-clamp-2 mt-1">
                  Tampilan bersih dan kontras tinggi untuk kenyamanan membaca di bawah sinar matahari.
                </p>
              </div>

              <div className="flex items-center gap-1.5 pt-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[15px]">light_mode</span>
                <span className="text-[11px]">Optimal di siang hari</span>
              </div>
            </div>
          </div>
        </div>

        {/* Option 2: Gelap (Dark Mode) */}
        <div
          onClick={() => handleSelect('dark')}
          className={`relative rounded-2xl p-4 cursor-pointer transition-all duration-200 active:scale-[0.99] border ${
            theme === 'dark'
              ? 'bg-surface-container-high ring-2 ring-primary border-primary/50 shadow-md'
              : 'bg-surface-container-low border-border/30 hover:border-border/60 shadow-sm'
          }`}
        >
          {theme === 'dark' && (
            <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px] font-bold">check</span>
              Aktif
            </div>
          )}

          <div className="flex items-start gap-3.5">
            {/* Realistic Mini UI Preview */}
            <div className="w-20 h-24 rounded-xl overflow-hidden shrink-0 bg-[#0b1120] p-1.5 flex flex-col justify-between shadow-inner select-none pointer-events-none ring-1 ring-primary/20 border border-[#1e293b]">
              <div className="flex items-center justify-between px-1 pt-0.5">
                <div className="w-4 h-1.5 bg-[#e8eef9] rounded-full" />
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div className="bg-[#111a2e] rounded-md p-1.5 space-y-1 shadow-sm">
                <div className="w-6 h-1 bg-[#8fa0bf] rounded-full" />
                <div className="w-10 h-1.5 bg-[#e8eef9] rounded-sm font-bold" />
                <div className="w-full bg-[#18233d] h-1 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-4/5" />
                </div>
              </div>
              <div className="flex items-center justify-between gap-1 px-0.5">
                <div className="flex-1 bg-primary h-2.5 rounded flex items-center justify-center">
                  <div className="w-4 h-0.5 bg-on-primary rounded-full" />
                </div>
                <div className="w-3 h-2.5 bg-[#18233d] rounded flex items-center justify-center">
                  <div className="w-1 h-1 bg-primary rounded-full" />
                </div>
              </div>
            </div>

            {/* Description & Controls */}
            <div className="flex-1 flex flex-col justify-between self-stretch min-w-0">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-sm font-bold truncate ${
                      theme === 'dark' ? 'text-primary' : 'text-on-surface'
                    }`}
                  >
                    Mode Gelap
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      theme === 'dark' ? 'bg-primary' : 'bg-surface-container-highest'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        theme === 'dark' ? 'bg-on-primary' : 'bg-transparent'
                      }`}
                    />
                  </div>
                </div>
                <p className="text-xs text-on-surface line-clamp-2 mt-1">
                  Hemat daya baterai OLED dan nyaman di mata untuk penggunaan malam hari.
                </p>
              </div>

              <div className="flex items-center gap-1.5 pt-2 text-primary font-medium">
                <span className="material-symbols-outlined text-[15px]">bedtime</span>
                <span className="text-[11px]">Hemat baterai & ramah mata</span>
              </div>
            </div>
          </div>
        </div>

        {/* Option 3: Ikuti Sistem (System Default) */}
        <div
          onClick={() => handleSelect('system')}
          className={`relative rounded-2xl p-4 cursor-pointer transition-all duration-200 active:scale-[0.99] border ${
            theme === 'system'
              ? 'bg-surface-container-high ring-2 ring-primary border-primary/50 shadow-md'
              : 'bg-surface-container-low border-border/30 hover:border-border/60 shadow-sm'
          }`}
        >
          {theme === 'system' && (
            <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px] font-bold">check</span>
              Aktif
            </div>
          )}

          <div className="flex items-start gap-3.5">
            {/* Realistic Mini UI Preview (Split Half-Half) */}
            <div className="w-20 h-24 rounded-xl overflow-hidden shrink-0 flex flex-row shadow-inner select-none pointer-events-none border border-border/40">
              {/* Light Half */}
              <div className="w-1/2 h-full bg-[#f8fafc] p-1 flex flex-col justify-between">
                <div className="w-3 h-1 bg-[#0f172a] rounded-full" />
                <div className="bg-[#ffffff] rounded p-1 space-y-0.5 shadow-sm">
                  <div className="w-3 h-0.5 bg-[#64748b] rounded-full" />
                  <div className="w-full bg-[#e2e8f0] h-0.5 rounded-full overflow-hidden">
                    <div className="bg-[#10b981] h-full w-3/4" />
                  </div>
                </div>
                <div className="w-full bg-[#10b981] h-2 rounded flex items-center justify-center">
                  <div className="w-2 h-0.5 bg-[#ffffff] rounded-full" />
                </div>
              </div>

              {/* Dark Half */}
              <div className="w-1/2 h-full bg-[#0b1120] p-1 flex flex-col justify-between">
                <div className="w-1.5 h-1.5 rounded-full bg-primary self-end" />
                <div className="bg-[#111a2e] rounded-l p-1 space-y-0.5">
                  <div className="w-4 h-1 bg-[#e8eef9] rounded-sm" />
                  <div className="w-full bg-[#18233d] h-0.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full w-1/2" />
                  </div>
                </div>
                <div className="w-full bg-[#18233d] h-2 rounded flex items-center justify-center">
                  <div className="w-2 h-0.5 bg-primary rounded-full" />
                </div>
              </div>
            </div>

            {/* Description & Controls */}
            <div className="flex-1 flex flex-col justify-between self-stretch min-w-0">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-sm font-bold truncate ${
                      theme === 'system' ? 'text-primary' : 'text-on-surface'
                    }`}
                  >
                    Ikuti Pengaturan Sistem
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      theme === 'system' ? 'bg-primary' : 'bg-surface-container-highest'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        theme === 'system' ? 'bg-on-primary' : 'bg-transparent'
                      }`}
                    />
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant line-clamp-2 mt-1">
                  Otomatis berganti terang dan gelap sesuai preferensi sistem operasi perangkat Anda.
                </p>
              </div>

              <div className="flex items-center gap-1.5 pt-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[15px]">brightness_auto</span>
                <span className="text-[11px]">Sinkron otomatis dengan OS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

