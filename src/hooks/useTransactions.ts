import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Transaction, TransactionKind } from '../types/database';
import { supabase, isSupabaseConfigured, ensureAuth } from '../lib/supabase';
import { storageService } from '../services/storage';

export interface TransactionFilter {
  search?: string;
  kind?: TransactionKind | 'all';
  categoryId?: string | null;
  startDate?: string;
  endDate?: string;
}

export interface DailyTransactionGroup {
  date: string;
  transactions: Transaction[];
  dailyIncome: number;
  dailyExpense: number;
}

export function useTransactions(filter?: TransactionFilter) {
  const queryClient = useQueryClient();

  const query = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      if (isSupabaseConfigured && supabase) {
        try {
          await ensureAuth();
          const { data, error } = await supabase
            .from('transactions')
            .select('*, category:categories(*)')
            .order('occurred_on', { ascending: false })
            .order('created_at', { ascending: false });
          if (!error && data) {
            return data;
          }
        } catch (err) {
          console.warn('Failed to fetch transactions from Supabase, falling back to LocalStorage:', err);
        }
      }
      return await storageService.getTransactions();
    },
  });

  // Client-side filtering for fast interactive searching
  const rawTransactions = query.data || [];
  const filteredTransactions = rawTransactions.filter((tx) => {
    if (filter?.kind && filter.kind !== 'all' && tx.kind !== filter.kind) {
      return false;
    }
    if (filter?.categoryId && tx.category_id !== filter.categoryId) {
      return false;
    }
    if (filter?.startDate && tx.occurred_on < filter.startDate) {
      return false;
    }
    if (filter?.endDate && tx.occurred_on > filter.endDate) {
      return false;
    }
    if (filter?.search && filter.search.trim() !== '') {
      const q = filter.search.toLowerCase().trim();
      const matchNote = tx.note?.toLowerCase().includes(q);
      const matchCat = tx.category?.name?.toLowerCase().includes(q);
      const matchAmount = tx.amount_base.toString().includes(q);
      return Boolean(matchNote || matchCat || matchAmount);
    }
    return true;
  });

  // Group transactions by date
  const groupedTransactions: DailyTransactionGroup[] = [];
  const groupMap = new Map<string, Transaction[]>();

  for (const tx of filteredTransactions) {
    if (!groupMap.has(tx.occurred_on)) {
      groupMap.set(tx.occurred_on, []);
    }
    groupMap.get(tx.occurred_on)!.push(tx);
  }

  // Preserve descending date order
  const sortedDates = Array.from(groupMap.keys()).sort((a, b) => b.localeCompare(a));
  for (const date of sortedDates) {
    const list = groupMap.get(date) || [];
    const dailyIncome = list
      .filter((t) => t.kind === 'income')
      .reduce((sum, t) => sum + t.amount_base, 0);
    const dailyExpense = list
      .filter((t) => t.kind === 'expense')
      .reduce((sum, t) => sum + t.amount_base, 0);

    groupedTransactions.push({
      date,
      transactions: list,
      dailyIncome,
      dailyExpense,
    });
  }

  // Mutations
  const addMutation = useMutation({
    mutationFn: async (
      newTx: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'category'>
    ) => {
      if (isSupabaseConfigured && supabase) {
        try {
          const userId = await ensureAuth();
          if (userId) {
            const { data, error } = await supabase
              .from('transactions')
              .insert({
                user_id: userId,
                ...newTx,
              })
              .select('*, category:categories(*)')
              .single();
            if (!error && data) return data;
          }
        } catch (err) {
          console.warn('Failed to add transaction to Supabase, falling back to LocalStorage:', err);
        }
      }
      return await storageService.addTransaction(newTx);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Transaction> }) => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('transactions')
            .update(updates)
            .eq('id', id)
            .select('*, category:categories(*)')
            .single();
          if (!error && data) return data;
        } catch (err) {
          console.warn('Failed to update transaction on Supabase, falling back to LocalStorage:', err);
        }
      }
      return await storageService.updateTransaction(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { error } = await supabase.from('transactions').delete().eq('id', id);
          if (!error) return null;
        } catch (err) {
          console.warn('Failed to delete transaction on Supabase, falling back to LocalStorage:', err);
        }
      }
      return await storageService.deleteTransaction(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (tx: Transaction) => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { error } = await supabase.from('transactions').insert(tx);
          if (!error) return;
        } catch (err) {
          console.warn('Failed to restore transaction on Supabase, falling back to LocalStorage:', err);
        }
      }
      await storageService.restoreTransaction(tx);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  return {
    transactions: filteredTransactions,
    allTransactions: rawTransactions,
    groupedTransactions,
    totalCount: rawTransactions.length,
    filteredCount: filteredTransactions.length,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    addTransaction: addMutation.mutateAsync,
    updateTransaction: updateMutation.mutateAsync,
    deleteTransaction: deleteMutation.mutateAsync,
    restoreTransaction: restoreMutation.mutateAsync,
    isAdding: addMutation.isPending,
  };
}
