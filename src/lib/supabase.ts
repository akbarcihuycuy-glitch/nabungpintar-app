import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

// Resolve URL and Anon Key from localStorage override or .env
const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

const customUrl = (typeof window !== 'undefined' ? localStorage.getItem('np_custom_supabase_url') || '' : '').trim();
const customKey = (typeof window !== 'undefined' ? localStorage.getItem('np_custom_supabase_anon_key') || '' : '').trim();

const effectiveUrl = customUrl || envUrl;
const effectiveKey = customKey || envKey;

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

export async function ensureAuth(): Promise<string | null> {\n  if (!supabase || !isSupabaseConfigured) return null;\n\n  if (cachedUserId) return cachedUserId;\n  if (authPromise) return authPromise;\n\n  authPromise = (async () => {\n    try {\n      const { data: sessionData } = await supabase.auth.getSession();\n      if (sessionData.session?.user) {\n        cachedUserId = sessionData.session.user.id;\n        return cachedUserId;\n      }\n    } catch (err) {\n      console.warn('ensureAuth error:', err);\n    }\n    return null;\n  })();\n\n  return authPromise;\n}\n\n// Reset auth cache ONLY on explicit signed_out event\nif (supabase) {\n  supabase.auth.onAuthStateChange((event, session) => {\n    if (event === 'SIGNED_OUT') {\n      authPromise = null;\n      cachedUserId = null;\n    } else if (session?.user?.id) {\n      cachedUserId = session.user.id;\n    }\n  });\n}\n\n// Auth Actions\nexport async function signInWithEmail(email: string, password: string) {\n  if (!supabase) throw new Error('Supabase client belum terkonfigurasi');\n  setGuestModeActive(false);\n  authPromise = null;\n  cachedUserId = null;\n  const result = await supabase.auth.signInWithPassword({\n    email: email.trim(),\n    password,\n  });\n  if (result.error) throw result.error;\n  if (result.data.user) {\n    cachedUserId = result.data.user.id;\n  }\n  return result.data;\n}\n\nexport async function signUpWithEmail(email: string, password: string, fullName: string) {\n  if (!supabase) throw new Error('Supabase client belum terkonfigurasi');\n  setGuestModeActive(false);\n  authPromise = null;\n  cachedUserId = null;\n  const result = await supabase.auth.signUp({\n    email: email.trim(),\n    password,\n    options: {\n      data: {\n        full_name: fullName.trim(),\n      },\n    },\n  });\n  if (result.error) throw result.error;\n  if (result.data.user) {\n    cachedUserId = result.data.user.id;\n  }\n  return result.data;\n}\n\nexport async function signInWithGoogle() {\n  if (!supabase) throw new Error('Supabase client belum terkonfigurasi');\n  setGuestModeActive(false);\n  authPromise = null;\n  cachedUserId = null;\n  const result = await supabase.auth.signInWithOAuth({\n    provider: 'google',\n    options: {\n      redirectTo: window.location.origin,\n    },\n  });\n  if (result.error) throw result.error;\n  return result.data;\n}\n\nexport const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';\n\n/**\n * Sign in using Google Identity Services (GIS) ID Token (JWT).\n * This allows the popup to show \"NabungPintar\" branding directly from your Google Cloud Client ID.\n */\nexport async function signInWithGoogleIdToken(idToken: string) {\n  if (!supabase) throw new Error('Supabase client belum terkonfigurasi');\n  setGuestModeActive(false);\n  authPromise = null;\n  cachedUserId = null;\n  const result = await supabase.auth.signInWithIdToken({\n    provider: 'google',\n    token: idToken,\n  });\n  if (result.error) throw result.error;\n  if (result.data.user) {\n    cachedUserId = result.data.user.id;\n  }\n  return result.data;\n}\n\nexport async function signOutUser() {\n  authPromise = null;\n  cachedUserId = null;\n  if (supabase) {\n    try {\n      await supabase.auth.signOut();\n    } catch (err) {\n      console.warn('Sign out warning:', err);\n    }\n  }\n}\n