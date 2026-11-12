import React from 'react';

interface IosInstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IosInstallGuideModal: React.FC<IosInstallGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end justify-center animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-surface-container rounded-t-[28px] p-5 pb-8 shadow-2xl border-t border-border/40 flex flex-col max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div
          className="w-12 h-1.5 rounded-full bg-surface-variant mx-auto mb-3 cursor-pointer"
          onClick={onClose}
        />

        {/* Header with Apple Icon & Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary shadow-sm border border-border/30">
              <span className="material-symbols-outlined text-[24px]">phone_iphone</span>
            </div>
            <div className="flex flex-col">
              <h2 className="text-base font-bold text-on-surface tracking-tight">
                Cara Pasang di Safari iOS
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold tracking-wide">
                  Praktis & Ringan (0 MB)
                </span>
                <span className="text-[10px] text-on-surface-variant">iPhone & iPad</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Steps Container */}
        <div className="flex flex-col gap-2.5 mt-4">
          {/* Step 1 */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-high border border-border/30">
            <div className="w-8 h-8 rounded-lg bg-surface-container flex-shrink-0 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">ios_share</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                Langkah 1
              </span>
              <p className="text-xs text-on-surface mt-0.5 leading-relaxed">
                Ketuk tombol <strong>Bagikan (Share)</strong> di bilah bawah browser Safari Anda.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-high border border-border/30">
            <div className="w-8 h-8 rounded-lg bg-surface-container flex-shrink-0 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">add_box</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                Langkah 2
              </span>
              <p className="text-xs text-on-surface mt-0.5 leading-relaxed">
                Gulir ke bawah dan pilih opsi <strong>"Tambah ke Layar Utama"</strong> (Add to Home Screen).
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-high border border-border/30">
            <div className="w-8 h-8 rounded-lg bg-surface-container flex-shrink-0 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                Langkah 3
              </span>
              <p className="text-xs text-on-surface mt-0.5 leading-relaxed">
                Ketuk <strong>"Tambah"</strong> di pojok kanan atas. Ikon NabungPintar akan langsung muncul di layar utama iPhone Anda.
              </p>
            </div>
          </div>
        </div>

        {/* Callout Tip */}
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-high/60 border border-border/20 mt-3.5">
          <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0">
            bolt
          </span>
          <p className="text-[11px] text-on-surface-variant leading-snug">
            Aplikasi bekerja <span className="text-primary font-semibold">100% offline</span> dengan performa super cepat seperti aplikasi native.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          type="button"
          className="w-full mt-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold text-center active:scale-[0.98] transition-all shadow-md hover:brightness-105"
        >
          Saya Mengerti, Tutup Panduan
        </button>
      </div>
    </div>
  );
};
