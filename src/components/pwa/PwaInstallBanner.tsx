import React, { useState, useEffect } from 'react';
import { IosInstallGuideModal } from './IosInstallGuideModal';

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isIosModalOpen, setIsIosModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsVisible(false);
      return;
    }

    // Check dismissal TTL (e.g. 7 days)
    const dismissedTime = localStorage.getItem('np_pwa_dismissed');
    if (dismissedTime) {
      const diff = Date.now() - parseInt(dismissedTime, 10);
      if (diff < 7 * 24 * 60 * 60 * 1000) {
        setIsVisible(false);
        return;
      }
    }

    // Listen to native beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // On iOS Safari, beforeinstallprompt never fires; show banner after short delay
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
      setIsVisible(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('np_pwa_dismissed', String(Date.now()));
  };

  const handleInstallClick = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
      setIsIosModalOpen(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          handleDismiss();
        }
        setDeferredPrompt(null);
      });
    } else {
      setIsIosModalOpen(true);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl bg-surface-container-low p-4 shadow-xl border border-border/40 transition-all duration-300">
        <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-start gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center shadow-inner border border-border/30">
                <span className="material-symbols-outlined text-primary text-[22px]">savings</span>
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
              </span>
            </div>

            <div className="flex flex-col min-w-0 pr-4">
              <h2 className="text-xs font-bold text-on-surface tracking-tight">
                Pasang NabungPintar di Layar Utama
              </h2>
              <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                Akses instan tanpa unduh Play Store, bisa digunakan secara offline.
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            aria-label="Tutup Banner"
            className="text-on-surface-variant hover:text-on-surface p-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-0.5 relative z-10">
          <button
            onClick={handleInstallClick}
            type="button"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-md hover:brightness-105 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">download_for_offline</span>
            <span>Pasang Sekarang</span>
          </button>

          <button
            onClick={() => setIsIosModalOpen(true)}
            type="button"
            className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-surface-container text-on-surface-variant text-xs hover:text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">help_outline</span>
            <span>Panduan iOS</span>
          </button>

          <button
            onClick={handleDismiss}
            type="button"
            className="px-2.5 py-1.5 rounded-xl text-on-surface-variant text-xs hover:text-on-surface transition-colors"
          >
            Nanti
          </button>
        </div>
      </div>

      <IosInstallGuideModal
        isOpen={isIosModalOpen}
        onClose={() => setIsIosModalOpen(false)}
      />
    </>
  );
};

