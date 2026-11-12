import { supabase } from '../lib/supabase';

const PIN_STORAGE_KEY = 'np_security_pin';
const BIOMETRIC_STORAGE_KEY = 'np_security_biometric';
const SESSION_UNLOCKED_KEY = 'np_pin_unlocked';
const HIDE_BALANCE_STORAGE_KEY = 'np_hide_balance';

export function isPinConfigured(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem(PIN_STORAGE_KEY));
}

export function verifyPin(enteredPin: string): boolean {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem(PIN_STORAGE_KEY);
  return saved === enteredPin;
}

export function setSecurityPin(pin: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PIN_STORAGE_KEY, pin);
  sessionStorage.setItem(SESSION_UNLOCKED_KEY, 'true');
}

export function removeSecurityPin(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PIN_STORAGE_KEY);
  localStorage.removeItem(BIOMETRIC_STORAGE_KEY);
  sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
}

export function isSessionUnlocked(): boolean {
  if (typeof window === 'undefined') return true;
  // If PIN is not configured, it's considered already unlocked
  if (!isPinConfigured()) return true;
  return sessionStorage.getItem(SESSION_UNLOCKED_KEY) === 'true';
}

export function setSessionUnlocked(unlocked: boolean): void {
  if (typeof window === 'undefined') return;
  if (unlocked) {
    sessionStorage.setItem(SESSION_UNLOCKED_KEY, 'true');
  } else {
    sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
  }
}

export function isBiometricEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(BIOMETRIC_STORAGE_KEY) === 'true';
}

export function setBiometricEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BIOMETRIC_STORAGE_KEY, enabled ? 'true' : 'false');
}

export async function canUseBiometrics(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;
  try {
    if (PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Biometric authentication using WebAuthn Platform Authenticator
 */
export async function authenticateWithBiometrics(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;
  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const credential = await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: 'preferred',
      },
    });

    if (credential) {
      setSessionUnlocked(true);
      return true;
    }
  } catch (err: any) {
    // If WebAuthn fails or canceled by user, return false
    console.warn('Biometric auth info/cancel:', err?.message || err);
  }
  return false;
}

export function getHideBalanceSetting(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(HIDE_BALANCE_STORAGE_KEY) === 'true';
}

export async function setHideBalanceSetting(hide: boolean, userId?: string): Promise<void> {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HIDE_BALANCE_STORAGE_KEY, hide ? 'true' : 'false');

  if (userId && supabase) {
    try {
      await supabase
        .from('user_settings')
        .update({ hide_balance: hide })
        .eq('user_id', userId);
    } catch (err) {
      console.warn('Sync hide_balance to supabase warning:', err);
    }
  }
}
