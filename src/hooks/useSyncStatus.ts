import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export type SyncState = 'synced' | 'syncing' | 'offline';

export function useSyncStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [syncState, setSyncState] = useState<SyncState>(() => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return 'offline';
    return 'synced';
  });

  const [lastSyncedTime, setLastSyncedTime] = useState<Date>(() => new Date());
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wifiOnly, setWifiOnly] = useState<boolean>(() => {
    return localStorage.getItem('np_sync_wifi_only') === 'true';
  });

  // Manual Trigger Sync
  const triggerSync = useCallback(async () => {
    setSyncState('syncing');
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['summary'] }),
        queryClient.invalidateQueries({ queryKey: ['goals'] }),
        queryClient.invalidateQueries({ queryKey: ['categories'] }),
      ]);
      setLastSyncedTime(new Date());
      setPendingCount(0);
      setSyncState('synced');
    } catch (err) {
      console.warn('Sync failed:', err);
      setSyncState('offline');
    }
  }, [queryClient]);

  // Online / Offline Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncState('offline');
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isOnline) {
        triggerSync();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [triggerSync, isOnline]);

  // Realtime Subscriptions via Supabase channel (PRD 4.4)
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured || !user) {
      if (!navigator.onLine) setSyncState('offline');
      else setSyncState('synced');
      return;
    }

    const userId = user.id;
    const channelName = `rt-user-${userId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
        () => {
          setSyncState('syncing');
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
          queryClient.invalidateQueries({ queryKey: ['summary'] });
          setTimeout(() => {
            setLastSyncedTime(new Date());
            setSyncState('synced');
          }, 350);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'savings_entries', filter: `user_id=eq.${userId}` },
        () => {
          setSyncState('syncing');
          queryClient.invalidateQueries({ queryKey: ['goals'] });
          queryClient.invalidateQueries({ queryKey: ['summary'] });
          setTimeout(() => {
            setLastSyncedTime(new Date());
            setSyncState('synced');
          }, 350);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'savings_goals', filter: `user_id=eq.${userId}` },
        () => {
          setSyncState('syncing');
          queryClient.invalidateQueries({ queryKey: ['goals'] });
          setTimeout(() => {
            setLastSyncedTime(new Date());
            setSyncState('synced');
          }, 350);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${userId}` },
        () => {
          setSyncState('syncing');
          queryClient.invalidateQueries({ queryKey: ['categories'] });
          setTimeout(() => {
            setLastSyncedTime(new Date());
            setSyncState('synced');
          }, 350);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setSyncState('synced');
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          setSyncState('offline');
        } else {
          setSyncState('syncing');
        }
      });

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [user, queryClient]);

  const toggleWifiOnly = () => {
    setWifiOnly((prev) => {
      const next = !prev;
      localStorage.setItem('np_sync_wifi_only', String(next));
      return next;
    });
  };

  return {
    syncState,
    isOnline,
    lastSyncedTime,
    pendingCount,
    wifiOnly,
    toggleWifiOnly,
    triggerSync,
  };
}
