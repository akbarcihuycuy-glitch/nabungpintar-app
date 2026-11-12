import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Category, TransactionKind } from '../types/database';
import { supabase, isSupabaseConfigured, ensureAuth } from '../lib/supabase';
import { storageService } from '../services/storage';

export function useCategories(kind?: TransactionKind) {
  const queryClient = useQueryClient();

  const query = useQuery<Category[]>({
    queryKey: ['categories', kind || 'all'],
    queryFn: async () => {
      let categories: Category[] = [];

      if (isSupabaseConfigured && supabase) {
        try {
          await ensureAuth();
          let q = supabase.from('categories').select('*').order('created_at', { ascending: true });
          if (kind) q = q.eq('kind', kind);
          const { data, error } = await q;
          if (!error && data && data.length > 0) {
            return data;
          }
        } catch (err) {
          console.warn('Failed to fetch categories from Supabase, falling back to LocalStorage:', err);
        }
      }

      const all = await storageService.getCategories();
      categories = kind ? all.filter((c) => c.kind === kind) : all;
      return categories;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (
      newCat: Omit<Category, 'id' | 'user_id' | 'created_at' | 'is_default' | 'tx_count'>
    ) => {
      if (isSupabaseConfigured && supabase) {
        try {
          const userId = await ensureAuth();
          if (userId) {
            const { data, error } = await supabase
              .from('categories')
              .insert({
                user_id: userId,
                name: newCat.name,
                kind: newCat.kind,
                icon: newCat.icon,
                color: newCat.color,
                monthly_budget: newCat.monthly_budget || 0,
                is_default: false,
              })
              .select()
              .single();
            if (!error && data) return data;
          }
        } catch (err) {
          console.warn('Failed to add category to Supabase, saving to LocalStorage:', err);
        }
      }
      return await storageService.addCategory(newCat);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Category> }) => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('categories')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
          if (!error && data) return data;
        } catch (err) {
          console.warn('Failed to update category on Supabase, falling back to LocalStorage:', err);
        }
      }
      return await storageService.updateCategory(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { error } = await supabase.from('categories').delete().eq('id', id);
          if (!error) return;
        } catch (err) {
          console.warn('Failed to delete category on Supabase, falling back to LocalStorage:', err);
        }
      }
      await storageService.deleteCategory(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  return {
    categories: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    addCategory: addMutation.mutateAsync,
    updateCategory: updateMutation.mutateAsync,
    deleteCategory: deleteMutation.mutateAsync,
    isAdding: addMutation.isPending,
  };
}
