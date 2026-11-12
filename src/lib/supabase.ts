import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

// Production Fallbacks so Render Static Site never hangs even if env vars are unset at build time
const DEFAULT_SUPABASE_URL = 'https://iiwgmjndtdvnlnfpetjp.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpd2dtam5kdGR2bmxuZnBldGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQzODg1OTMsImV4cCI6MjEwOTk2NDU5M30.xQo2SUz3M7B2023YEvTsmk6s904cL60XgcgEKoo_siM';
export const DEFAULT_GOOGLE_CLIENT_ID = '1045859094349-ddr6et4oqt30m4iu00bhduesdomamt4b.apps.googleusercontent.com';

// Resolve URL and Anon Key from localStorage override, .env, or production fallback
const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

const customUrl = (typeof window !== 'undefined' ? localStorage.getItem('np_custom_supabase_url') || '' : '').trim();
const customKey = (typeof window !== 'undefined' ? localStorage.getItem('np_custom_supabase_anon_key') || '' : '').trim();

const effectiveUrl = customUrl || envUrl || DEFAULT_SUPABASE_URL;
const effectiveKey = customKey || envKey || DEFAULT_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;
let configured = false;

if (
  effectiveUrl &&
  effectiveKey &&
  effectiveUrl !== 'https://your-project.supabase.co' &&
  effectiveKey !== 'your-anon-key' &&
  (effectiveUrl.startsWith('http://') || effectiveUrl.startsWith('https://'))
) {
  try {
    client = createClient(effectiveUrl, effectiveKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    configured = true;
  } catch (err) {
    console.warn('Supabase initialization failed, falling back to LocalStorage mode:', err);
    client = null;
    configured = false;
  }
}

export const isSupabaseConfigured = configured;
export const supabase = client;

export function getSupabaseCredentials() {
  return {
    url: effectiveUrl,
    hasKey: !!effectiveKey,
    isCustom: !!customUrl,
    isConfigured: configured,
  };
}

export function saveCustomSupabaseConfig(url: string, key: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('np_custom_supabase_url', url.trim());
  localStorage.setItem('np_custom_supabase_anon_key', key.trim());
  window.location.reload();
}

export function clearCustomSupabaseConfig() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('np_custom_supabase_url');
  localStorage.removeItem('np_custom_supabase_anon_key');
  window.location.reload();
}

export function isGuestModeActive(): boolean {
  return false;
}

export function setGuestModeActive(_active: boolean) {
  // Production release mode: guest mode is disabled, login is mandatory
  if (typeof window !== 'undefined') {
    localStorage.removeItem('np_guest_mode');
  }
}

/**
 * Ensures user is authenticated (checks active session)
 * Production mode: no anonymous or demo auto-login.
 */
let authPromise: Promise<string | null> | null = null;
let cachedUserId: string | null = null;

export async function ensureAuth(): Promise<string | null> {
  if (!supabase || !isSupabaseConfigured) return null;

  if (cachedUserId) return cachedUserId;
  if (authPromise) return authPromise;

  authPromise = (async () => {
    try {
      // Maximum 1.2s timeout so ensureAuth never hangs in Render / slow networks
      const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
        setTimeout(() => resolve({ data: { session: null } }), 1200)
      );

      const sessionPromise = supabase.auth.getSession();
      const res = await Promise.race([sessionPromise, timeoutPromise]);

      if (res?.data?.session?.user) {
        cachedUserId = res.data.session.user.id;
        return cachedUserId;
      }
    } catch (err) {
      console.warn('ensureAuth error:', err);
    }
    return null;
  })();

  return authPromise;
}

// Reset auth cache ONLY on explicit signed_out event
if (supabase) {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      authPromise = null;
      cachedUserId = null;
    } else if (session?.user?.id) {
      cachedUserId = session.user.id;
    }
  });
}

// Auth Actions
export async function signInWithEmail(email: string, password: string) {
  if (!supabase) throw new Error('Supabase client belum terkonfigurasi');
  setGuestModeActive(false);
  authPromise = null;
  cachedUserId = null;
  const result = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (result.error) throw result.error;
  if (result.data.user) {
    cachedUserId = result.data.user.id;
  }
  return result.data;
}

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  if (!supabase) throw new Error('Supabase client belum terkonfigurasi');
  setGuestModeActive(false);
  authPromise = null;
  cachedUserId = null;
  const result = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        full_name: fullName.trim(),
      },
    },
  });
  if (result.error) throw result.error;
  if (result.data.user) {
    cachedUserId = result.data.user.id;
  }
  return result.data;
}

export async function signInWithGoogle() {
  if (!supabase) throw new Error('Supabase client belum terkonfigurasi');
  setGuestModeActive(false);
  authPromise = null;
  cachedUserId = null;
  const result = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
  if (result.error) throw result.error;
  return result.data;
}

export const GOOGLE_CLIENT_ID =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID).trim();

/**
 * Sign in using Google Identity Services (GIS) ID Token (JWT).
 * This allows the popup to show "NabungPintar" branding directly from your Google Cloud Client ID.
 */
export async function signInWithGoogleIdToken(idToken: string) {
  if (!supabase) throw new Error('Supabase client belum terkonfigurasi');
  setGuestModeActive(false);
  authPromise = null;
  cachedUserId = null;
  const result = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });
  if (result.error) throw result.error;
  if (result.data.user) {
    cachedUserId = result.data.user.id;
  }
  return result.data;
}

export async function signOutUser() {
  authPromise = null;
  cachedUserId = null;
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out warning:', err);
    }
  }
}
