import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ForgotPasswordModal } from './ForgotPasswordModal';

interface AuthScreenProps {
  onSuccess?: () => void;
  canDismiss?: boolean;
  onDismiss?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSuccess,
  canDismiss = false,
  onDismiss,
}) => {
  const { loginEmail, registerEmail, loginGoogle, loginGoogleIdToken } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginEmailVal, setLoginEmailVal] = useState<string>('');
  const [loginPasswordVal, setLoginPasswordVal] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Register form state
  const [regFullName, setRegFullName] = useState<string>('');
  const [regEmailVal, setRegEmailVal] = useState<string>('');
  const [regPasswordVal, setRegPasswordVal] = useState<string>('');
  const [regConfirmPasswordVal, setRegConfirmPasswordVal] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState<boolean>(false);
  const [agreeTerms, setAgreeTerms] = useState<boolean>(true);

  // Status & error states
  const [loading, setLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState<boolean>(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await loginEmail(loginEmailVal, loginPasswordVal);
      setSuccessMsg('Berhasil masuk! Menyiapkan data keuangan Anda...');
      setTimeout(() => {
        onSuccess?.();
      }, 500);
    } catch (err: any) {
      console.error('Login error:', err);
      const msg = err?.message?.toLowerCase() || '';
      if (msg.includes('invalid login credentials') || msg.includes('invalid grant')) {
        setErrorMsg('Email atau kata sandi salah. Silakan periksa kembali.');
      } else if (msg.includes('email not confirmed')) {
        setErrorMsg('Email belum dikonfirmasi. Silakan periksa kotak masuk email Anda.');
      } else {
        setErrorMsg(err.message || 'Gagal masuk. Periksa koneksi internet Anda.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (regPasswordVal.length < 8) {
      setErrorMsg('Kata sandi harus minimal 8 karakter.');
      return;
    }

    if (regPasswordVal !== regConfirmPasswordVal) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('Anda harus menyetujui Syarat & Ketentuan.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerEmail(regEmailVal, regPasswordVal, regFullName);
      if (res.user && !res.session) {
        setSuccessMsg('Pendaftaran berhasil! Silakan periksa email untuk konfirmasi.');
      } else {
        setSuccessMsg('Akun berhasil dibuat! Mengalihkan ke dashboard...');
        setTimeout(() => {
          onSuccess?.();
        }, 500);
      }
    } catch (err: any) {
      console.error('Register error:', err);
      const msg = err?.message?.toLowerCase() || '';
      if (msg.includes('already registered') || msg.includes('user already exists')) {
        setErrorMsg('Alamat email ini sudah terdaftar. Silakan masuk.');
      } else {
        setErrorMsg(err.message || 'Gagal membuat akun baru. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Google Identity Services (GIS) integration
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const gisButtonRef = useRef<HTMLDivElement | null>(null);
  const [isGisReady, setIsGisReady] = useState<boolean>(false);

  // Fallback to standard Supabase OAuth redirect
  const handleGoogleOAuthFallback = async () => {
    try {
      console.log('Menggunakan fallback Supabase Google OAuth...');
      await loginGoogle();
    } catch (err: any) {
      console.error('Google OAuth error:', err);
      setErrorMsg(err.message || 'Gagal memulai autentikasi Google.');
      setGoogleLoading(false);
    }
  };

  // Callback when Google GIS returns an ID Token credential
  const handleCredentialResponse = async (response: GoogleIdCredentialResponse) => {
    if (!response?.credential) {
      console.warn('GIS tidak mengembalikan credential, beralih ke OAuth fallback...');
      await handleGoogleOAuthFallback();
      return;
    }

    setGoogleLoading(true);
    setErrorMsg(null);
    try {
      console.log('ID Token Google diterima, autentikasi via Supabase signInWithIdToken...');
      await loginGoogleIdToken(response.credential);
      setSuccessMsg('Berhasil masuk dengan Google!');
      setTimeout(() => {
        onSuccess?.();
      }, 400);
    } catch (idTokenErr: any) {\n      console.warn('signInWithIdToken gagal, beralih otomatis ke Google OAuth redirect:', idTokenErr);
      await handleGoogleOAuthFallback();
    }
  };

  // Ref to always keep the freshest handler reference for GIS
  const handleCredentialResponseRef = useRef(handleCredentialResponse);
  handleCredentialResponseRef.current = handleCredentialResponse;

  // Initialize Google Identity Services SDK
  useEffect(() => {
    if (!googleClientId) {
      console.info('VITE_GOOGLE_CLIENT_ID belum diatur, login Google akan menggunakan OAuth redirect.');
      return;
    }

    let isMounted = true;

    const setupGIS = () => {
      if (!window.google?.accounts?.id || !isMounted || !gisButtonRef.current) return false;

      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (res) => handleCredentialResponseRef.current(res),
          auto_select: false,
          cancel_on_tap_outside: true,
          context: tab === 'login' ? 'signin' : 'signup',
        });

        gisButtonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(gisButtonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: tab === 'login' ? 'signin_with' : 'signup_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 380,
          locale: 'id',
        });

        // Check if iframe was actually injected and rendered by Google
        setTimeout(() => {
          if (isMounted && gisButtonRef.current?.querySelector('iframe')) {
            setIsGisReady(true);
          }
        }, 150);

        return true;
      } catch (err) {
        console.warn('Error saat menginisialisasi GIS renderButton:', err);
        return false;
      }
    };

    if (setupGIS()) return;

    // Polling if GIS script is still loading asynchronously
    const pollInterval = setInterval(() => {
      if (setupGIS()) {
        clearInterval(pollInterval);
      }
    }, 200);

    const timeoutId = setTimeout(() => {
      clearInterval(pollInterval);
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      clearTimeout(timeoutId);
    };
  }, [googleClientId, tab]);

  // Click handler on custom button (guaranteed 100% reliable login via Supabase Google OAuth)
  const handleGoogleClick = async () => {
    setErrorMsg(null);
    setGoogleLoading(true);
    await handleGoogleOAuthFallback();
  };

  return (
    <div className="min-h-screen w-full bg-background font-sans text-on-surface flex flex-col justify-between p-4 selection:bg-primary selection:text-on-primary">
      <div className="w-full max-w-md mx-auto space-y-5 pt-2 pb-8">
        {/* Top Dismiss Button if accessible as subscreen */}
        {canDismiss && (
          <div className="flex justify-start">
            <button
              onClick={onDismiss}
              type="button"
              className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors py-1 group"
            >
              <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">
                arrow_back
              </span>
              <span>Kembali ke Aplikasi</span>
            </button>
          </div>
        )}

        {/* Glowing Visual Brand Hero */}
        <div className="flex flex-col items-center justify-center pt-2 text-center">
          <div className="relative flex items-center justify-center w-20 h-20 mb-3">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center shadow-lg shadow-primary/10 border border-primary/20">
              <svg
                className="w-9 h-9 text-primary"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.75"
                viewBox="0 0 24 24"
              >
                <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2 .5-1.5.5-3.5-.5-5-.5-.8-1-1.3-1-1.3l.5-1.7c.1-.4 0-.8-.3-1-.4-.3-.9-.3-1.2 0L17 5.5" />
                <circle cx="9" cy="10" fill="currentColor" r="1" />
                <path d="M14 7h-2" />
              </svg>
            </div>
            <div className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-primary text-[9px] font-bold text-on-primary items-center justify-center">
                ✨
              </span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">
            NabungPintar <span className="font-normal text-secondary text-sm">by Rozan</span>
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Nabung jadi lebih pintar, terukur, dan tenang
          </p>
        </div>

        {/* Interactive Segmented Control Tabs */}
        <div className="w-full bg-surface-container p-1 rounded-2xl flex items-center shadow-inner border border-border/40">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 ${
              tab === 'login'
                ? 'bg-primary text-on-primary shadow-md shadow-primary/20'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">login</span>
            <span>Masuk</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 ${
              tab === 'register'
                ? 'bg-primary text-on-primary shadow-md shadow-primary/20'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>Daftar</span>
          </button>
        </div>

        {/* FORM CONTAINER */}
        <div className="w-full bg-surface-container-low rounded-2xl p-5 shadow-xl border border-border/40 space-y-4">
          {/* Google Identity Sign-In */}
          <div className="w-full flex items-center justify-center min-h-[46px] my-1">
            {/* 1. Official Google Identity Services Button (Visible when rendered by Google) */}
            <div
              ref={gisButtonRef}
              className="google-gis-container w-full flex items-center justify-center"
              style={
                isGisReady && !googleLoading
                  ? { minHeight: '44px' }
                  : { position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -10 }
              }
            />

            {/* 2. Custom Button (Visible when GIS is loading/unavailable, or during login loading) */}
            {(!isGisReady || googleLoading) && (
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={googleLoading || loading}
                className="w-full bg-white text-[#1F2937] active:scale-[0.98] transition-transform duration-150 py-3 px-4 rounded-xl flex items-center justify-center gap-3 shadow hover:bg-slate-50 disabled:opacity-70 cursor-pointer"
              >
                {googleLoading ? (
                  <span className="w-5 h-5 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
                ) : (\n                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.26 21.36 7.33 24 12 24z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.57H1.25C.45 8.16 0 9.98 0 12s.45 3.84 1.25 5.43l4.03-3.14z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.57l4.03 3.14c.95-2.83 3.6-4.96 6.72-4.96z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                <span className="text-xs font-semibold">
                  {tab === 'login' ? 'Masuk dengan Google' : 'Daftar dengan Google'}
                </span>
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-1">
            <div className="w-full h-px bg-surface-variant/70" />
            <span className="absolute px-3 bg-surface-container-low text-[10px] uppercase font-semibold text-on-surface-variant tracking-wider">
              atau
            </span>
          </div>

          {/* Alert Messages */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-error/15 border border-error/30 text-error text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-primary/15 border border-primary/30 text-primary text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB: MASUK */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              {/* Email Field */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-on-surface-variant">
                  Alamat Email
                </label>
                <div className="relative flex items-center bg-surface-container rounded-xl px-3 border border-border/30 focus-within:border-primary transition-all">
                  <span className="material-symbols-outlined text-secondary text-[18px] mr-2">
                    mail
                  </span>
                  <input
                    type="email"
                    value={loginEmailVal}
                    onChange={(e) => setLoginEmailVal(e.target.value)}
                    placeholder="nama@email.com"
                    required
                    className="w-full py-2.5 bg-transparent text-xs text-on-surface placeholder:text-outline focus:outline-none"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-on-surface-variant">
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-[11px] text-primary hover:underline"
                  >
                    Lupa Kata Sandi?
                  </button>
                </div>
                <div className="relative flex items-center bg-surface-container rounded-xl px-3 border border-border/30 focus-within:border-primary transition-all">
                  <span className="material-symbols-outlined text-secondary text-[18px] mr-2">
                    lock
                  </span>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPasswordVal}
                    onChange={(e) => setLoginPasswordVal(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full py-2.5 bg-transparent text-xs text-on-surface placeholder:text-outline focus:outline-none tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="text-secondary hover:text-on-surface p-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showLoginPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-surface-container accent-primary"
                  />
                  <span className="text-[11px] text-on-surface-variant">
                    Ingat saya di perangkat ini
                  </span>
                </label>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-on-primary text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Masuk ke NabungPintar</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>

              {/* Bottom Switch Link */}
              <p className="text-center text-[11px] text-on-surface-variant pt-1">
                Belum punya akun?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    setErrorMsg(null);
                  }}
                  className="text-primary font-semibold hover:underline"
                >
                  Daftar sekarang
                </button>
              </p>
            </form>
          )}

          {/* TAB: DAFTAR */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-on-surface-variant">
                  Nama Lengkap
                </label>
                <div className="relative flex items-center bg-surface-container rounded-xl px-3 border border-border/30 focus-within:border-primary transition-all">
                  <span className="material-symbols-outlined text-secondary text-[18px] mr-2">
                    person
                  </span>
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Rozan Fathurrahman"
                    required
                    className="w-full py-2.5 bg-transparent text-xs text-on-surface placeholder:text-outline focus:outline-none"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-on-surface-variant">
                  Alamat Email
                </label>
                <div className="relative flex items-center bg-surface-container rounded-xl px-3 border border-border/30 focus-within:border-primary transition-all">
                  <span className="material-symbols-outlined text-secondary text-[18px] mr-2">
                    mail
                  </span>
                  <input
                    type="email"
                    value={regEmailVal}
                    onChange={(e) => setRegEmailVal(e.target.value)}
                    placeholder="nama@email.com"
                    required
                    className="w-full py-2.5 bg-transparent text-xs text-on-surface placeholder:text-outline focus:outline-none"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-on-surface-variant">
                  Kata Sandi Baru (Min. 8 Karakter)
                </label>
                <div className="relative flex items-center bg-surface-container rounded-xl px-3 border border-border/30 focus-within:border-primary transition-all">
                  <span className="material-symbols-outlined text-secondary text-[18px] mr-2">
                    lock
                  </span>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPasswordVal}
                    onChange={(e) => setRegPasswordVal(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    required
                    minLength={8}
                    className="w-full py-2.5 bg-transparent text-xs text-on-surface placeholder:text-outline focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="text-secondary hover:text-on-surface p-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showRegPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-on-surface-variant">
                  Konfirmasi Kata Sandi
                </label>
                <div className="relative flex items-center bg-surface-container rounded-xl px-3 border border-border/30 focus-within:border-primary transition-all">
                  <span className="material-symbols-outlined text-secondary text-[18px] mr-2">
                    lock_reset
                  </span>
                  <input
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    value={regConfirmPasswordVal}
                    onChange={(e) => setRegConfirmPasswordVal(e.target.value)}
                    placeholder="Ulangi kata sandi"
                    required
                    className="w-full py-2.5 bg-transparent text-xs text-on-surface placeholder:text-outline focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="text-secondary hover:text-on-surface p-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showRegConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Terms & Conditions Checkbox */}
              <div className="flex items-start gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="agree-terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 rounded bg-surface-container accent-primary"
                />
                <label
                  htmlFor="agree-terms"
                  className="text-[11px] text-on-surface-variant cursor-pointer leading-tight"
                >
                  Saya menyetujui Syarat & Ketentuan serta Kebijakan Privasi NabungPintar.
                </label>
              </div>

              {/* Register CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-on-primary text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Daftar Akun Baru</span>
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                  </>
                )}
              </button>

              {/* Bottom Switch Link */}
              <p className="text-center text-[11px] text-on-surface-variant pt-1">
                Sudah memiliki akun?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setErrorMsg(null);
                  }}
                  className="text-primary font-semibold hover:underline"
                >
                  Masuk di sini
                </button>
              </p>
            </form>
          )}
        </div>

        {/* Feature Highlights Miniature */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-container-low p-3 rounded-xl border border-border/30 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[18px]">savings</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-on-surface">Celengan Target</p>
              <p className="text-[10px] text-on-surface-variant">Impian terwujud</p>
            </div>
          </div>

          <div className="bg-surface-container-low p-3 rounded-xl border border-border/30 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[18px]">query_stats</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-on-surface">Arus Kas Cerdas</p>
              <p className="text-[10px] text-on-surface-variant">Lacak harian</p>
            </div>
          </div>
        </div>

        {/* Trust & Bank-Grade Security Badge */}
        <div className="flex items-center justify-center gap-2 px-3 py-2 bg-surface-container-lowest/70 rounded-xl border border-border/20 text-center">
          <span className="material-symbols-outlined text-primary text-[16px] shrink-0">
            verified_user
          </span>
          <span className="text-[10px] text-on-surface-variant">
            Data finansial terenkripsi 256-bit & tersimpan aman di cloud pribadi Anda
          </span>
        </div>
      </div>

      {/* Modal Lupa Kata Sandi */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        defaultEmail={loginEmailVal}
      />
    </div>
  );
};
