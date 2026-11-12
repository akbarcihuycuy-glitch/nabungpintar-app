import { useState, useEffect } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import {
  supabase,
  isSupabaseConfigured,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signInWithGoogleIdToken,
  signOutUser,
  isGuestModeActive,
  setGuestModeActive,
  saveCustomSupabaseConfig,
  clearCustomSupabaseConfig,
  getSupabaseCredentials,
} from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

// Singleton shared auth state to prevent duplicate listeners and render loops
let sharedUser: User | null = null;
let sharedSession: Session | null = null;
let isInitialized = false;
let isInitializing = false;
const subscribers = new Set<(state: { user: User | null; session: Session | null; isGuest: boolean }) => void>();

function notifySubscribers() {
  const isGuest = isGuestModeActive() && !sharedUser;
  for (const sub of subscribers) {
    sub({ user: sharedUser, session: sharedSession, isGuest });
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(sharedUser);
  const [session, setSession] = useState<Session | null>(sharedSession);
  const [isLoading, setIsLoading] = useState<boolean>(!isInitialized);
  const [isGuest, setIsGuest] = useState<boolean>(isGuestModeActive() && !sharedUser);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleUpdate = (state: { user: User | null; session: Session | null; isGuest: boolean }) => {
      setUser(state.user);
      setSession(state.session);
      setIsGuest(state.isGuest);
      setIsLoading(false);
    };

    subscribers.add(handleUpdate);

    // Initial check (once globally)
    if (!isInitialized && !isInitializing) {
      isInitializing = true;
      if (!supabase || !isSupabaseConfigured) {
        isInitialized = true;
        isInitializing = false;
        notifySubscribers();
      } else {
        const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null } }), 1200)
        );
        Promise.race([supabase.auth.getSession(), timeoutPromise]).then((res) => {
          const session = res?.data?.session || null;
          sharedSession = session;
          sharedUser = session?.user || null;
          isInitialized = true;
          isInitializing = false;
          notifySubscribers();
        }).catch((err) => {
          console.warn('Session check warning:', err);
          isInitialized = true;
          isInitializing = false;
          notifySubscribers();
        });
      }
    } else if (isInitialized) {
      setIsLoading(false);
    }

    return () => {
      subscribers.delete(handleUpdate);
    };
  }, []);

  // Listen to Supabase auth events ONCE at the module level
  useEffect(() => {
    if (!supabase) return;

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, newSession) => {
        const prevUserId = sharedUser?.id;
        const nextUserId = newSession?.user?.id;

        sharedSession = newSession;
        sharedUser = newSession?.user || null;

        if (sharedUser) {
          setGuestModeActive(false);
        }

        notifySubscribers();

        // Invalidate queries ONLY when user actually changes (log in / log out), NOT on initial load or token refresh
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          if (prevUserId !== nextUserId) {
            queryClient.invalidateQueries();
          }
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [queryClient]);

  const loginEmail = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await signInWithEmail(email, pass);
      sharedUser = res.user;
      sharedSession = res.session;
      setGuestModeActive(false);
      notifySubscribers();
      queryClient.invalidateQueries();
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const registerEmail = async (email: string, pass: string, fullName: string) => {
    setIsLoading(true);
    try {
      const res = await signUpWithEmail(email, pass, fullName);
      if (res.user && res.session) {
        sharedUser = res.user;
        sharedSession = res.session;
        setGuestModeActive(false);
        notifySubscribers();
        queryClient.invalidateQueries();
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const loginGoogle = async () => {
    return await signInWithGoogle();
  };

  const loginGoogleIdToken = async (idToken: string) => {
    setIsLoading(true);
    try {
      const res = await signInWithGoogleIdToken(idToken);
      if (res.user && res.session) {
        sharedUser = res.user;
        sharedSession = res.session;
        setGuestModeActive(false);
        notifySubscribers();
        queryClient.invalidateQueries();
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const continueGuest = () => {
    setGuestModeActive(true);
    sharedUser = null;
    sharedSession = null;
    notifySubscribers();
    queryClient.invalidateQueries();
  };

  const updateUserProfile = async (updates: { full_name?: string; avatar_url?: string }) => {
    if (updates.avatar_url) {
      try {
        localStorage.setItem('np_user_avatar', updates.avatar_url);
      } catch {}
    }
    if (updates.full_name) {
      try {
        localStorage.setItem('np_user_name', updates.full_name);
      } catch {}
    }

    if (supabase && sharedUser) {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          ...(sharedUser.user_metadata || {}),
          ...updates,
        },
      });
      if (error) throw error;
      if (data?.user) {
        sharedUser = data.user;
        notifySubscribers();
      }
      return data.user;
    } else {
      notifySubscribers();
      return sharedUser;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOutUser();
      sharedUser = null;
      sharedSession = null;
      setGuestModeActive(true);
      notifySubscribers();
      queryClient.clear();
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    session,
    isLoading,
    isGuest,
    isConfigured: isSupabaseConfigured,
    credentials: getSupabaseCredentials(),
    loginEmail,
    registerEmail,
    loginGoogle,
    loginGoogleIdToken,
    continueGuest,
    updateUserProfile,
    logout,
    saveCustomSupabaseConfig,
    clearCustomSupabaseConfig,
  };
}
