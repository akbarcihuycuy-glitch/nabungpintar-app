import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SavingsGoal, SavingsEntry } from '../types/database';
import { supabase, isSupabaseConfigured, ensureAuth } from '../lib/supabase';
import { storageService } from '../services/storage';
import { getWIBDate } from '../utils/formatters';

export function useGoals() {
  const queryClient = useQueryClient();

  const query = useQuery<SavingsGoal[]>({
    queryKey: ['goals'],
    queryFn: async () => {
      if (isSupabaseConfigured && supabase) {
        try {
          await ensureAuth();
          const { data: goals, error } = await supabase
            .from('savings_goals')
            .select('*')
            .eq('archived', false)
            .order('created_at', { ascending: false });

          if (!error && goals) {
            // Fetch entries to calculate current amount
            const { data: entries } = await supabase.from('savings_entries').select('goal_id, kind, amount');
            const entryMap: Record<string, number> = {};
            for (const e of entries || []) {
              entryMap[e.goal_id] = (entryMap[e.goal_id] || 0) + (e.kind === 'topup' ? e.amount : -e.amount);
            }

            return goals.map((g) => ({
              ...g,
              current_amount: Math.max(0, entryMap[g.id] || 0),
            }));
          }
        } catch (err) {
          console.warn('Failed to fetch goals from Supabase, falling back to LocalStorage:', err);
        }
      }

      return await storageService.getGoals();
    },
  });

  const addGoalMutation = useMutation({
    mutationFn: async (
      goal: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at' | 'current_amount'>
    ) => {
      if (isSupabaseConfigured && supabase) {
        try {
          const userId = await ensureAuth();
          if (userId) {
            const { data, error } = await supabase
              .from('savings_goals')
              .insert({
                ...goal,
                user_id: userId,
              })
              .select()
              .single();
            if (!error && data) return data;
          }
        } catch (err) {
          console.warn('Failed to add goal to Supabase, saving to LocalStorage:', err);
        }
      }

      return await storageService.addGoal(goal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SavingsGoal> }) => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('savings_goals')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
          if (!error && data) return data;
        } catch (err) {
          console.warn('Failed to update goal in Supabase, using LocalStorage:', err);
        }
      }

      return await storageService.updateGoal(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('savings_goals').delete().eq('id', id);
        } catch (err) {
          console.warn('Failed to delete goal in Supabase, using LocalStorage:', err);
        }
      }

      await storageService.deleteGoal(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
  });

  const addTopUpMutation = useMutation({
    mutationFn: async ({
      goalId,
      amount,
      note,
      occurredOn,
    }: {
      goalId: string;
      amount: number;
      note?: string;
      occurredOn?: string;
    }) => {
      const dateStr = occurredOn || getWIBDate();
      if (isSupabaseConfigured && supabase) {
        try {
          const userId = await ensureAuth();
          if (userId) {
            const { data, error } = await supabase
              .from('savings_entries')
              .insert({
                user_id: userId,
                goal_id: goalId,
                kind: 'topup',
                amount,
                note: note || 'Top Up Celengan',
                occurred_on: dateStr,
              })
              .select()
              .single();
            if (!error && data) return data;
          }
        } catch (err) {
          console.warn('Failed to add top up to Supabase, saving to LocalStorage:', err);
        }
      }

      return await storageService.addSavingsEntry({
        goal_id: goalId,
        kind: 'topup',
        amount,
        note: note || 'Top Up Celengan',
        occurred_on: dateStr,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal_entries'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async ({
      goalId,
      amount,
      note,
      occurredOn,
    }: {
      goalId: string;
      amount: number;
      note?: string;
      occurredOn?: string;
    }) => {
      const dateStr = occurredOn || getWIBDate();
      if (isSupabaseConfigured && supabase) {
        try {
          const userId = await ensureAuth();
          if (userId) {
            const { data, error } = await supabase
              .from('savings_entries')
              .insert({
                user_id: userId,
                goal_id: goalId,
                kind: 'withdraw',
                amount,
                note: note || 'Tarik Tabungan',
                occurred_on: dateStr,
              })
              .select()
              .single();
            if (!error && data) return data;
          }
        } catch (err) {
          console.warn('Failed to withdraw in Supabase, saving to LocalStorage:', err);
        }
      }

      return await storageService.addSavingsEntry({
        goal_id: goalId,
        kind: 'withdraw',
        amount,
        note: note || 'Tarik Tabungan',
        occurred_on: dateStr,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal_entries'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
  });

  return {
    goals: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    addGoal: addGoalMutation.mutateAsync,
    updateGoal: updateGoalMutation.mutateAsync,
    deleteGoal: deleteGoalMutation.mutateAsync,
    addTopUp: addTopUpMutation.mutateAsync,
    withdraw: withdrawMutation.mutateAsync,
  };
}

export function useGoalEntries(goalId?: string) {
  return useQuery<SavingsEntry[]>({
    queryKey: ['goal_entries', goalId],
    queryFn: async () => {
      if (!goalId) return [];

      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('savings_entries')
            .select('*')
            .eq('goal_id', goalId)
            .order('occurred_on', { ascending: false });
          if (!error && data) return data;
        } catch (err) {
          console.warn('Failed to fetch goal entries from Supabase, falling back:', err);
        }
      }

      return await storageService.getSavingsEntriesForGoal(goalId);
    },
    enabled: Boolean(goalId),
  });
}
