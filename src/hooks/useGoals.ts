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
          console.warn('Failed to add goal to Supabase, saving to LocalStorage:', err);\n        }\n      }\n\n      return await storageService.addGoal(goal);\n    },\n    onSuccess: () => {\n      queryClient.invalidateQueries({ queryKey: ['goals'] });\n      queryClient.invalidateQueries({ queryKey: ['summary'] });\n    },\n  });\n\n  const updateGoalMutation = useMutation({\n    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SavingsGoal> }) => {\n      if (isSupabaseConfigured && supabase) {\n        try {\n          const { data, error } = await supabase\n            .from('savings_goals')\n            .update(updates)\n            .eq('id', id)\n            .select()\n            .single();\n          if (!error && data) return data;\n        } catch (err) {\n          console.warn('Failed to update goal in Supabase, using LocalStorage:', err);\n        }\n      }\n\n      return await storageService.updateGoal(id, updates);\n    },\n    onSuccess: () => {\n      queryClient.invalidateQueries({ queryKey: ['goals'] });\n      queryClient.invalidateQueries({ queryKey: ['summary'] });\n    },\n  });\n\n  const deleteGoalMutation = useMutation({\n    mutationFn: async (id: string) => {\n      if (isSupabaseConfigured && supabase) {\n        try {\n          await supabase.from('savings_goals').delete().eq('id', id);\n        } catch (err) {\n          console.warn('Failed to delete goal in Supabase, using LocalStorage:', err);\n        }\n      }\n\n      await storageService.deleteGoal(id);\n    },\n    onSuccess: () => {\n      queryClient.invalidateQueries({ queryKey: ['goals'] });\n      queryClient.invalidateQueries({ queryKey: ['summary'] });\n    },\n  });\n\n  const addTopUpMutation = useMutation({\n    mutationFn: async ({\n      goalId,\n      amount,\n      note,\n      occurredOn,\n    }: {\n      goalId: string;\n      amount: number;\n      note?: string;\n      occurredOn?: string;\n    }) => {\n      const dateStr = occurredOn || getWIBDate();\n      if (isSupabaseConfigured && supabase) {\n        try {\n          const userId = await ensureAuth();\n          if (userId) {\n            const { data, error } = await supabase\n              .from('savings_entries')\n              .insert({\n                user_id: userId,\n                goal_id: goalId,\n                kind: 'topup',\n                amount,\n                note: note || 'Top Up Celengan',\n                occurred_on: dateStr,\n              })\n              .select()\n              .single();\n            if (!error && data) return data;\n          }\n        } catch (err) {\n          console.warn('Failed to add top up to Supabase, saving to LocalStorage:', err);\n        }\n      }\n\n      return await storageService.addSavingsEntry({\n        goal_id: goalId,\n        kind: 'topup',\n        amount,\n        note: note || 'Top Up Celengan',\n        occurred_on: dateStr,\n      });\n    },\n    onSuccess: () => {\n      queryClient.invalidateQueries({ queryKey: ['goals'] });\n      queryClient.invalidateQueries({ queryKey: ['goal_entries'] });\n      queryClient.invalidateQueries({ queryKey: ['summary'] });\n    },\n  });\n\n  const withdrawMutation = useMutation({\n    mutationFn: async ({\n      goalId,\n      amount,\n      note,\n      occurredOn,\n    }: {\n      goalId: string;\n      amount: number;\n      note?: string;\n      occurredOn?: string;\n    }) => {\n      const dateStr = occurredOn || getWIBDate();\n      if (isSupabaseConfigured && supabase) {\n        try {\n          const userId = await ensureAuth();\n          if (userId) {\n            const { data, error } = await supabase\n              .from('savings_entries')\n              .insert({\n                user_id: userId,\n                goal_id: goalId,\n                kind: 'withdraw',\n                amount,\n                note: note || 'Tarik Tabungan',\n                occurred_on: dateStr,\n              })\n              .select()\n              .single();\n            if (!error && data) return data;\n          }\n        } catch (err) {\n          console.warn('Failed to withdraw in Supabase, saving to LocalStorage:', err);\n        }\n      }\n\n      return await storageService.addSavingsEntry({\n        goal_id: goalId,\n        kind: 'withdraw',\n        amount,\n        note: note || 'Tarik Tabungan',\n        occurred_on: dateStr,\n      });\n    },\n    onSuccess: () => {\n      queryClient.invalidateQueries({ queryKey: ['goals'] });\n      queryClient.invalidateQueries({ queryKey: ['goal_entries'] });\n      queryClient.invalidateQueries({ queryKey: ['summary'] });\n    },\n  });\n\n  return {\n    goals: query.data || [],\n    isLoading: query.isLoading,\n    isError: query.isError,\n    error: query.error,\n    refetch: query.refetch,\n    addGoal: addGoalMutation.mutateAsync,\n    updateGoal: updateGoalMutation.mutateAsync,\n    deleteGoal: deleteGoalMutation.mutateAsync,\n    addTopUp: addTopUpMutation.mutateAsync,\n    withdraw: withdrawMutation.mutateAsync,\n  };\n}\n\nexport function useGoalEntries(goalId?: string) {\n  return useQuery<SavingsEntry[]>({\n    queryKey: ['goal_entries', goalId],\n    queryFn: async () => {\n      if (!goalId) return [];\n\n      if (isSupabaseConfigured && supabase) {\n        try {\n          const { data, error } = await supabase\n            .from('savings_entries')\n            .select('*')\n            .eq('goal_id', goalId)\n            .order('occurred_on', { ascending: false });\n          if (!error && data) return data;\n        } catch (err) {\n          console.warn('Failed to fetch goal entries from Supabase, falling back:', err);\n        }\n      }\n\n      return await storageService.getSavingsEntriesForGoal(goalId);\n    },\n    enabled: Boolean(goalId),\n  });\n}\n