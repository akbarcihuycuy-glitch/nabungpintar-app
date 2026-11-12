import React, { useEffect, useState, useRef } from 'react';
import { User } from '@supabase/supabase-js';

interface OpeningSplashScreenProps {
  user: User | null;
  isSessionChecking?: boolean;
  onFinishOpening: () => void;
}

export const OpeningSplashScreen: React.FC<OpeningSplashScreenProps> = ({
  user,
  onFinishOpening,
}) => {
  const [stage, setStage] = useState<'intro' | 'exit'>('intro');
  const onFinishRef = useRef(onFinishOpening);
  onFinishRef.current = onFinishOpening;

  const handleDismiss = () => {
    setStage('exit');
    onFinishRef.current();
  };

  useEffect(() => {
    // Ultra-snappy splash: brief 350ms brand intro, then smooth exit
    const exitTimer = setTimeout(() => {
      setStage('exit');
      setTimeout(() => {
        onFinishRef.current();
      }, 150); // fast 150ms fade
    }, 350);

    return () => {
      clearTimeout(exitTimer);
    };
  }, []);

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 z-[100] bg-[#0B1120] text-[#E8EEF9] flex flex-col items-center justify-center p-6 selection:bg-primary selection:text-black font-sans transition-opacity duration-200 cursor-pointer ${
        stage === 'exit' ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
      }`}
      title="Ketuk untuk langsung membuka aplikasi"
    >
      {/* Ambient Emerald & Cyan Radial Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/20 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-sky-500/10 blur-2xl pointer-events-none" />

      {/* Main Brand Logo & Glowing Ring */}
      <div className="relative flex flex-col items-center text-center z-10 space-y-4 pointer-events-none select-none">
        <div className="relative flex items-center justify-center">
          {/* Animated Glowing Outer Ring */}
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-primary via-emerald-400 to-sky-400 opacity-70 blur-md animate-pulse" />
          
          {/* Glass Logo Container with Spring Scale */}
          <div className="relative w-20 h-20 rounded-2xl bg-surface-container-high/90 border border-primary/40 flex items-center justify-center shadow-glow transform transition-transform duration-300 scale-100 hover:scale-105">
            <span className="material-symbols-outlined text-primary text-[42px] animate-bounce">
              account_balance_wallet
            </span>
          </div>
        </div>

        {/* App Title */}
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
            <span>NabungPintar</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
              PRO
            </span>
          </h1>
          <p className="text-xs text-outline font-medium">
            Smart Financial Flow & Celengan Target
          </p>
        </div>

        {/* Shimmer Progress Line */}
        <div className="w-48 h-1 rounded-full bg-surface-container-highest overflow-hidden relative mt-2">
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-sky-400 to-emerald-400 rounded-full animate-shimmer" />
        </div>

        <p className="text-[10px] text-outline/60 pt-1">
          Memuat aplikasi... (Ketuk untuk lewati)
        </p>
      </div>
    </div>
  );
};

