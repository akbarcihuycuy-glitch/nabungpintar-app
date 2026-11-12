import {
  Category,
  Transaction,
  SavingsGoal,
  SavingsEntry,
  UserSettings,
} from '../types/database';
import { getWIBDate } from '../utils/formatters';

const STORAGE_KEYS = {
  CATEGORIES: 'np_categories_v1',
  TRANSACTIONS: 'np_transactions_v1',
  GOALS: 'np_goals_v1',
  SAVINGS_ENTRIES: 'np_savings_entries_v1',
  SETTINGS: 'np_settings_v1',
};

export const DEFAULT_EXPENSE_CATEGORIES: Omit<Category, 'id' | 'created_at'>[] = [
  { user_id: 'local_user', name: 'Makanan', kind: 'expense', icon: 'restaurant', color: '#2DD4A7', is_default: true },
  { user_id: 'local_user', name: 'Transportasi', kind: 'expense', icon: 'directions_car', color: '#38BDF8', is_default: true },
  { user_id: 'local_user', name: 'Belanja', kind: 'expense', icon: 'shopping_bag', color: '#FBBF24', is_default: true },
  { user_id: 'local_user', name: 'Tagihan', kind: 'expense', icon: 'receipt_long', color: '#F87171', is_default: true },
  { user_id: 'local_user', name: 'Hiburan', kind: 'expense', icon: 'sports_esports', color: '#C084FC', is_default: true },
  { user_id: 'local_user', name: 'Kesehatan', kind: 'expense', icon: 'favorite', color: '#34D399', is_default: true },
  { user_id: 'local_user', name: 'Pendidikan', kind: 'expense', icon: 'school', color: '#60A5FA', is_default: true },
  { user_id: 'local_user', name: 'Lainnya', kind: 'expense', icon: 'more_horiz', color: '#8FA0BF', is_default: true },
];

export const DEFAULT_INCOME_CATEGORIES: Omit<Category, 'id' | 'created_at'>[] = [
  { user_id: 'local_user', name: 'Gaji', kind: 'income', icon: 'payments', color: '#2DD4A7', is_default: true },
  { user_id: 'local_user', name: 'Bonus', kind: 'income', icon: 'savings', color: '#34D399', is_default: true },
  { user_id: 'local_user', name: 'Usaha', kind: 'income', icon: 'storefront', color: '#FBBF24', is_default: true },
  { user_id: 'local_user', name: 'Investasi', kind: 'income', icon: 'trending_up', color: '#60A5FA', is_default: true },
  { user_id: 'local_user', name: 'Lainnya', kind: 'income', icon: 'more_horiz', color: '#8FA0BF', is_default: true },
];

class LocalStorageService {
  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (!raw) {
        const now = new Date().toISOString();
        const initial: Category[] = [
          ...DEFAULT_EXPENSE_CATEGORIES.map((c, i) => ({
            ...c,
            id: `cat-exp-${i + 1}`,
            created_at: now,
          })),
          ...DEFAULT_INCOME_CATEGORIES.map((c, i) => ({
            ...c,
            id: `cat-inc-${i + 1}`,
            created_at: now,
          })),
        ];
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(initial));
      }
    } catch (e) {
      console.warn('LocalStorage initialization warning:', e);
    }
  }

  // --- Low-level raw getters without circular dependency ---
  private getRawCategories(): Category[] {
    try {
      this.ensureInitialized();
      const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private getRawTransactions(): Transaction[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // --- Public Categories API ---
  async getCategories(): Promise<Category[]> {
    const categories = this.getRawCategories();
    const rawTx = this.getRawTransactions();

    const countMap: Record<string, number> = {};
    for (const tx of rawTx) {
      if (tx.category_id) {
        countMap[tx.category_id] = (countMap[tx.category_id] || 0) + 1;
      }
    }

    return categories.map((c) => ({
      ...c,
      tx_count: countMap[c.id] || 0,
    }));
  }

  async addCategory(
    category: Omit<Category, 'id' | 'user_id' | 'created_at' | 'is_default' | 'tx_count'>
  ): Promise<Category> {
    const categories = this.getRawCategories();
    const newCat: Category = {
      ...category,
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: 'local_user',
      is_default: false,
      created_at: new Date().toISOString(),
      tx_count: 0,
    };
    categories.push(newCat);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    return newCat;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const categories = this.getRawCategories();
    const index = categories.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Kategori tidak ditemukan');

    const updated = { ...categories[index], ...updates };
    categories[index] = updated;
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    const categories = this.getRawCategories();
    const filtered = categories.filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(filtered));
  }

  // --- Public Transactions API ---
  async getTransactions(): Promise<Transaction[]> {
    const transactions = this.getRawTransactions();
    const categories = this.getRawCategories();
    const catMap = new Map(categories.map((c) => [c.id, c]));

    // Join category and sort by occurred_on desc, created_at desc
    return transactions
      .map((t) => ({
        ...t,
        category: t.category_id ? catMap.get(t.category_id) : undefined,
      }))
      .sort((a, b) => {
        if (b.occurred_on !== a.occurred_on) {
          return b.occurred_on.localeCompare(a.occurred_on);
        }
        return b.created_at.localeCompare(a.created_at);
      });
  }

  async addTransaction(
    tx: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'category'>
  ): Promise<Transaction> {
    const list = this.getRawTransactions();
    const now = new Date().toISOString();
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: 'local_user',
      created_at: now,
      updated_at: now,
    };
    list.unshift(newTx);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(list));

    const categories = this.getRawCategories();
    const cat = newTx.category_id ? categories.find((c) => c.id === newTx.category_id) : undefined;
    return { ...newTx, category: cat };
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const list = this.getRawTransactions();
    const index = list.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Transaksi tidak ditemukan');

    const updated: Transaction = {
      ...list[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    list[index] = updated;
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(list));

    const categories = this.getRawCategories();
    const cat = updated.category_id ? categories.find((c) => c.id === updated.category_id) : undefined;
    return { ...updated, category: cat };
  }

  async deleteTransaction(id: string): Promise<Transaction | null> {
    const list = this.getRawTransactions();
    const tx = list.find((t) => t.id === id) || null;
    const filtered = list.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filtered));
    return tx;
  }

  async restoreTransaction(tx: Transaction): Promise<void> {
    const list = this.getRawTransactions();
    list.push(tx);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(list));
  }

  // --- Public Savings Goals & Entries API ---
  async getGoals(): Promise<SavingsGoal[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.GOALS);
      const goals: SavingsGoal[] = raw ? JSON.parse(raw) : [];
      const entries = await this.getSavingsEntries();

      return goals.map((g) => {
        const current = entries
          .filter((e) => e.goal_id === g.id)
          .reduce((sum, e) => sum + (e.kind === 'topup' ? e.amount : -e.amount), 0);
        return {
          ...g,
          current_amount: Math.max(0, current),
        };
      });
    } catch {
      return [];
    }
  }

  async addGoal(goal: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at' | 'current_amount'>): Promise<SavingsGoal> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.GOALS);
      const goals: SavingsGoal[] = raw ? JSON.parse(raw) : [];
      const newGoal: SavingsGoal = {
        ...goal,
        id: `goal-${Date.now()}`,
        user_id: 'local_user',
        created_at: new Date().toISOString(),
        current_amount: 0,
      };
      goals.push(newGoal);
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
      return newGoal;
    } catch (e) {
      throw e;
    }
  }

  async updateGoal(id: string, updates: Partial<SavingsGoal>): Promise<SavingsGoal> {
    const raw = localStorage.getItem(STORAGE_KEYS.GOALS);
    const goals: SavingsGoal[] = raw ? JSON.parse(raw) : [];
    const idx = goals.findIndex((g) => g.id === id);
    if (idx === -1) throw new Error('Target tidak ditemukan');

    const updated = { ...goals[idx], ...updates };
    goals[idx] = updated;
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    return updated;
  }

  async deleteGoal(id: string): Promise<void> {
    const raw = localStorage.getItem(STORAGE_KEYS.GOALS);
    const goals: SavingsGoal[] = raw ? JSON.parse(raw) : [];
    const filtered = goals.filter((g) => g.id !== id);
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(filtered));

    // Also remove associated savings entries
    const entries = await this.getSavingsEntries();
    const filteredEntries = entries.filter((e) => e.goal_id !== id);
    localStorage.setItem(STORAGE_KEYS.SAVINGS_ENTRIES, JSON.stringify(filteredEntries));
  }

  async getSavingsEntries(): Promise<SavingsEntry[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SAVINGS_ENTRIES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  async getSavingsEntriesForGoal(goalId: string): Promise<SavingsEntry[]> {
    const entries = await this.getSavingsEntries();
    return entries
      .filter((e) => e.goal_id === goalId)
      .sort((a, b) => b.occurred_on.localeCompare(a.occurred_on) || b.created_at.localeCompare(a.created_at));
  }

  async addSavingsEntry(
    entry: Omit<SavingsEntry, 'id' | 'user_id' | 'created_at'>
  ): Promise<SavingsEntry> {
    const entries = await this.getSavingsEntries();
    const newEntry: SavingsEntry = {
      ...entry,
      id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: 'local_user',
      created_at: new Date().toISOString(),
    };
    entries.push(newEntry);
    localStorage.setItem(STORAGE_KEYS.SAVINGS_ENTRIES, JSON.stringify(entries));
    return newEntry;
  }

  async deleteSavingsEntry(id: string): Promise<void> {
    const entries = await this.getSavingsEntries();
    const filtered = entries.filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.SAVINGS_ENTRIES, JSON.stringify(filtered));
  }

  async batchAddTransactions(
    items: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]
  ): Promise<Transaction[]> {
    const transactions = this.getRawTransactions();
    const categories = this.getRawCategories();
    const catMap = new Map(categories.map((c) => [c.id, c]));

    const newItems: Transaction[] = items.map((item, idx) => ({
      ...item,
      id: `tx-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: 'local_user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      category: item.category_id ? catMap.get(item.category_id) : undefined,
    }));

    transactions.push(...newItems);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    return newItems;
  }

  // --- Public User Settings API ---
  async getSettings(): Promise<UserSettings> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (raw) return JSON.parse(raw);
    } catch {}
    const defaultSettings: UserSettings = {
      user_id: 'local_user',
      display_currency: 'IDR',
      theme: 'dark',
      updated_at: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
    } catch {}
    return defaultSettings;
  }

  async updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...updates, updated_at: new Date().toISOString() };
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    } catch {}
    return updated;
  }

  // --- Demo Seeder Helper (For instant testing) ---
  async seedDemoData(): Promise<void> {
    const now = new Date();
    const dateOffset = (d: number) => {
      const dt = new Date(now);
      dt.setDate(dt.getDate() - d);
      return getWIBDate(dt);
    };

    const categories = this.getRawCategories();
    const findCat = (name: string, kind: 'income' | 'expense') =>
      categories.find((c) => c.name.toLowerCase() === name.toLowerCase() && c.kind === kind)?.id || null;

    const demoTx: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'category'>[] = [
      {
        kind: 'income',
        amount_original: 15000000,
        currency: 'IDR',
        fx_rate_to_idr: 1,
        amount_base: 15000000,
        category_id: findCat('Gaji', 'income'),
        note: 'Gaji Bulanan PT Teknologi',
        occurred_on: dateOffset(1),
      },
      {
        kind: 'expense',
        amount_original: 1450000,
        currency: 'IDR',
        fx_rate_to_idr: 1,
        amount_base: 1450000,
        category_id: findCat('Belanja', 'expense'),
        note: 'Belanja Bulanan Supermarket',
        occurred_on: dateOffset(2),
      },
      {
        kind: 'expense',
        amount_original: 185000,
        currency: 'IDR',
        fx_rate_to_idr: 1,
        amount_base: 185000,
        category_id: findCat('Makanan', 'expense'),
        note: 'Kopi & Restoran Senopati',
        occurred_on: dateOffset(3),
      },
      {
        kind: 'income',
        amount_original: 350000,
        currency: 'IDR',
        fx_rate_to_idr: 1,
        amount_base: 350000,
        category_id: findCat('Investasi', 'income'),
        note: 'Dividen Reksadana Pasar Uang',
        occurred_on: dateOffset(4),
      },
      {
        kind: 'expense',
        amount_original: 620000,
        currency: 'IDR',
        fx_rate_to_idr: 1,
        amount_base: 620000,
        category_id: findCat('Tagihan', 'expense'),
        note: 'Tagihan Listrik & Internet PLN',
        occurred_on: dateOffset(5),
      },
      {
        kind: 'expense',
        amount_original: 45000,
        currency: 'IDR',
        fx_rate_to_idr: 1,
        amount_base: 45000,
        category_id: findCat('Makanan', 'expense'),
        note: 'Makan Siang Padang Murah',
        occurred_on: dateOffset(0),
      },
      {
        kind: 'expense',
        amount_original: 285000,
        currency: 'IDR',
        fx_rate_to_idr: 1,
        amount_base: 285000,
        category_id: findCat('Belanja', 'expense'),
        note: 'Belanja Supermarket',
        occurred_on: dateOffset(0),
      },
    ];

    const seededTx: Transaction[] = demoTx.map((t, idx) => ({
      ...t,
      id: `demo-tx-${idx + 1}`,
      user_id: 'local_user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(seededTx));

    // Seed 2 demo savings goals
    const demoGoals: SavingsGoal[] = [
      {\n        id: 'goal-1',
        user_id: 'local_user',
        name: 'Dana Darurat 6 Bulan',
        target_amount: 50000000,
        deadline: '2027-08-14',
        icon: 'savings',
        color: '#2DD4A7',
        archived: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 'goal-2',
        user_id: 'local_user',
        name: 'Liburan ke Jepang',
        target_amount: 25000000,
        deadline: '2027-11-20',
        icon: 'flight_takeoff',
        color: '#38BDF8',
        archived: false,
        created_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(demoGoals));

    const demoEntries: SavingsEntry[] = [
      {
        id: 'entry-1',
        user_id: 'local_user',
        goal_id: 'goal-1',
        kind: 'topup',
        amount: 30000000,
        note: 'Setoran rutin awal',
        occurred_on: dateOffset(10),
        created_at: new Date().toISOString(),
      },
      {
        id: 'entry-2',
        user_id: 'local_user',
        goal_id: 'goal-2',
        kind: 'topup',
        amount: 14500000,
        note: 'Tabungan bulanan',
        occurred_on: dateOffset(8),
        created_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.SAVINGS_ENTRIES, JSON.stringify(demoEntries));
  }

  async clearAllData(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEYS.GOALS);
      localStorage.removeItem(STORAGE_KEYS.SAVINGS_ENTRIES);
    } catch {}
  }
}

export const storageService = new LocalStorageService();
