import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';

interface OpeningSplashScreenProps {
  user: User | null;
  isSessionChecking: boolean;
  onFinishOpening: () => void;
}

export const OpeningSplashScreen: React.FC<OpeningSplashScreenProps> = ({
  user,
  isSessionChecking,
  onFinishOpening,
}) => {
  const [stage, setStage] = useState<'intro' | 'greeting' | 'exit'>('intro');

  const fullName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    (typeof window !== 'undefined' ? localStorage.getItem('np_user_name') : null) ||
    '';

  useEffect(() => {
    // 1. First stage: spring scale-up & glow (800ms)
    const introTimer = setTimeout(() => {
      setStage('greeting');
    }, 850);

    // 2. Second stage: greeting / ready (1500ms total)
    const completeTimer = setTimeout(() => {
      setStage('exit');
      setTimeout(() => {
        onFinishOpening();
      }, 400); // 400ms zoom/fade exit
    }, 1600);

    return () => {
      clearTimeout(introTimer);
      clearTimeout(completeTimer);
    };
  }, [onFinishOpening]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#0B1120] text-[#E8EEF9] flex flex-col items-center justify-center p-6 selection:bg-primary selection:text-black font-sans transition-all duration-500 ${
        stage === 'exit' ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Ambient Emerald & Cyan Radial Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/20 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-sky-500/10 blur-2xl pointer-events-none" />

      {/* Main Brand Logo & Glowing Ring */}
      <div className="relative flex flex-col items-center text-center z-10 space-y-4">
        <div className="relative flex items-center justify-center">
          {/* Animated Glowing Outer Ring */}
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-primary via-emerald-400 to-sky-400 opacity-70 blur-md animate-pulse" />
          
          {/* Glass Logo Container with Spring Scale */}
          <div className="relative w-20 h-20 rounded-2xl bg-surface-container-high/90 border border-primary/40 flex items-center justify-center shadow-glow transform transition-transform duration-700 ease-out scale-100 hover:scale-105">
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

        {/* Subtitle / Personalized Greeting */}
        <div className="min-h-[28px] pt-1">
          {user && stage === 'greeting' ? (
            <p className="text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1.5 animate-fade-in">
              <span>Selamat datang kembali, {fullName}</span>
              <span className="animate-pulse">✨</span>
            </p>
          ) : (
            <p className="text-[11px] text-outline/80 flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              <span>Memuat sistem keamanan & data cloud...</span>
            </p>
          )}
        </div>

        {/* Shimmer Progress Line */}
        <div className="w-48 h-1 rounded-full bg-surface-container-highest overflow-hidden relative mt-2">
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-sky-400 to-emerald-400 rounded-full animate-shimmer" />
        </div>
      </div>
    </div>
  );
};

