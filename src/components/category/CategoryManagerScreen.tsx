import React, { useState, useRef } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { TransactionKind, Category } from '../../types/database';
import { SkeletonBox } from '../common/Skeleton';
import { GoalIcon, isCustomImageIcon } from '../common/GoalIcon';

interface CategoryManagerScreenProps {
  onBack?: () => void;
}

const AVAILABLE_ICONS = [
  'restaurant',
  'directions_car',
  'shopping_bag',
  'receipt_long',
  'sports_esports',
  'favorite',
  'school',
  'savings',
  'payments',
  'storefront',
  'flight_takeoff',
  'pets',
  'local_gas_station',
  'fitness_center',
  'coffee',
  'home',
  'build',
  'more_horiz',
];

const AVAILABLE_COLORS = [
  '#2DD4A7', // Mint primary
  '#38BDF8', // Sky blue
  '#FBBF24', // Amber
  '#F87171', // Red
  '#C084FC', // Purple
  '#34D399', // Emerald
  '#60A5FA', // Blue
  '#EC4899', // Pink
  '#F97316', // Orange
];

export const CategoryManagerScreen: React.FC<CategoryManagerScreenProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<TransactionKind>('expense');
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form states for Add / Edit
  const [formName, setFormName] = useState<string>('');
  const [formIcon, setFormIcon] = useState<string>('restaurant');
  const [formColor, setFormColor] = useState<string>('#2DD4A7');
  const [formBudget, setFormBudget] = useState<string>('');
  const [iconTab, setIconTab] = useState<'fintech' | 'emoji' | 'upload'>('fintech');
  const [customEmoji, setCustomEmoji] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setFormIcon(compressed);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const {
    categories,
    isLoading,
    isError,
    addCategory,
    updateCategory,
    deleteCategory,
    isAdding,
  } = useCategories();

  const expenseCategories = categories.filter((c) => c.kind === 'expense');
  const incomeCategories = categories.filter((c) => c.kind === 'income');
  const displayedCategories = activeTab === 'expense' ? expenseCategories : incomeCategories;

  const openAddSheet = () => {
    setEditingCategory(null);
    setFormName('');
    setFormIcon(activeTab === 'expense' ? 'restaurant' : 'payments');
    setFormColor(AVAILABLE_COLORS[0]);
    setFormBudget('');
    setIconTab('fintech');
    setIsSheetOpen(true);
  };

  const openEditSheet = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormIcon(cat.icon);
    setFormColor(cat.color);
    setFormBudget(cat.monthly_budget ? cat.monthly_budget.toString() : '');
    setIconTab(isCustomImageIcon(cat.icon) ? 'upload' : 'fintech');
    setIsSheetOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const budgetNum = activeTab === 'expense' ? Number(formBudget.replace(/\D/g, '')) || 0 : 0;

    if (editingCategory) {
      await updateCategory({
        id: editingCategory.id,
        updates: {
          name: formName.trim(),
          icon: formIcon,
          color: formColor,
          monthly_budget: budgetNum,
        },
      });
    } else {
      await addCategory({
        name: formName.trim(),
        kind: activeTab,
        icon: formIcon,
        color: formColor,
        monthly_budget: budgetNum,
      });
    }

    setIsSheetOpen(false);
  };

  const handleDelete = async (cat: Category) => {
    if (window.confirm(`Hapus kategori "${cat.name}"?`)) {
      await deleteCategory(cat.id);
    }
  };

  return (
    <div className="flex flex-col w-full relative pb-28">
      {/* Top Navigation & Action */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Kembali"
              type="button"
              className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
          )}
          <div>
            <h2 className="text-base font-bold text-on-surface leading-tight">
              Kategori Saya
            </h2>
            <p className="text-xs text-outline">Kelola pos anggaran finansial</p>
          </div>
        </div>

        <button
          onClick={openAddSheet}
          type="button"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-glow hover:brightness-105 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[17px]">add</span>
          <span>Kategori</span>
        </button>
      </div>

      {/* Segmented Type Tabs */}
      <div className="grid grid-cols-2 p-1 bg-surface-container rounded-xl mb-4 border border-border/40 shadow-inner">
        <button
          onClick={() => setActiveTab('expense')}
          type="button"
          className={`py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'expense'
              ? 'bg-surface-container-high text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-expense inline-block" />
          <span>Pengeluaran ({expenseCategories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('income')}
          type="button"
          className={`py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'income'
              ? 'bg-surface-container-high text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-income inline-block" />
          <span>Pemasukan ({incomeCategories.length})</span>
        </button>
      </div>

      {/* Category List */}
      {isLoading ? (
        <div className="space-y-2.5 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonBox key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-6 rounded-2xl bg-surface-container border border-expense/30 text-center">
          <p className="text-xs text-on-surface">Gagal memuat kategori</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 mb-6">
          {displayedCategories.map((cat) => (
            <div
              key={cat.id}
              className="group flex items-center justify-between p-3.5 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors shadow-sm border border-border/30"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden"
                  style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                >
                  <GoalIcon icon={cat.icon} size={22} />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-on-surface truncate">
                      {cat.name}
                    </span>
                    {cat.is_default && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-surface-container-high text-outline">
                        Bawaan
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-outline">
                      {cat.tx_count || 0} transaksi
                    </span>
                    {cat.kind === 'expense' && cat.monthly_budget && cat.monthly_budget > 0 ? (
                      <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        Batas: Rp {cat.monthly_budget.toLocaleString('id-ID')}/bln
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 text-outline">
                <button
                  onClick={() => openEditSheet(cat)}
                  type="button"
                  title="Ubah"
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
                {!cat.is_default && (
                  <button
                    onClick={() => handleDelete(cat)}
                    type="button"
                    title="Hapus"
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:text-expense hover:bg-expense/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Smart Suggestion Card */}
      <div className="p-4 rounded-xl bg-surface-container flex items-center gap-3.5 shadow-sm border border-border/40">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <span className="material-symbols-outlined text-[22px]">lightbulb</span>
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-semibold text-on-surface">Tips NabungPintar</h4>
          <p className="text-xs text-outline mt-0.5 leading-snug">
            Kelompokkan kategori agar evaluasi bulanan lebih terarah dan mudah dibaca.
          </p>
        </div>
      </div>

      {/* Bottom Sheet for Tambah / Ubah Kategori */}
      {isSheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setIsSheetOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          {/* Sheet Container */}
          <div className="relative w-full max-w-lg mx-auto bg-surface-container rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border-t border-border/50 animate-in slide-in-from-bottom duration-300">
            {/* Grab Handle & Header */}
            <div className="pt-3 pb-2 px-4 flex flex-col items-center shrink-0">
              <div className="w-12 h-1.5 rounded-full bg-border mb-3" />
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                  <h3 className="text-base font-bold text-on-surface">
                    {editingCategory ? 'Ubah Kategori' : 'Tambah Kategori Baru'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsSheetOpen(false)}
                  type="button"
                  className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSave} className="px-4 py-2 overflow-y-auto space-y-4 no-scrollbar">
              {/* Live Preview Card */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low flex items-center justify-between border border-border/30">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden"
                    style={{ backgroundColor: `${formColor}25`, color: formColor }}
                  >
                    <GoalIcon icon={formIcon} size={24} />
                  </div>
                  <div>
                    <span className="text-xs text-outline block">Pratinjau Kategori</span>
                    <span className="text-sm font-bold text-on-surface truncate block">
                      {formName.trim() || 'Nama Kategori'}
                    </span>
                  </div>
                </div>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: `${formColor}20`, color: formColor }}
                >
                  {activeTab === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
                </span>
              </div>

              {/* Name Input */}
              <div className="space-y-1">
                <label className="text-xs text-on-surface-variant font-medium">Nama Kategori</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Belanja Online, Kopi, dsb"
                  className="w-full h-11 px-3 rounded-xl bg-surface-container-high border border-border/40 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
                />
              </div>

              {/* Monthly Budget Input (Only for Expense) */}
              {activeTab === 'expense' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-on-surface-variant font-medium">
                      Batas Anggaran Bulanan (Opsional)
                    </label>
                    <span className="text-[10px] text-outline">Batas belanja per bulan</span>
                  </div>
                  <div className="flex items-center px-3 h-11 rounded-xl bg-surface-container-high border border-border/40 focus-within:border-primary">
                    <span className="text-xs font-bold text-outline mr-2">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formBudget ? Number(formBudget.replace(/\D/g, '')).toLocaleString('id-ID') : ''}
                      onChange={(e) => setFormBudget(e.target.value.replace(/\D/g, ''))}
                      placeholder="0 (Tidak terbatas)"
                      className="w-full bg-transparent text-xs text-on-surface placeholder:text-outline focus:outline-none tabular-nums font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* Multi-Tab Icon Picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-on-surface-variant font-medium">Pilih Ikon atau Gambar</label>
                  <div className="flex items-center p-0.5 rounded-lg bg-surface-container-high border border-border/40">
                    <button
                      type="button"
                      onClick={() => setIconTab('fintech')}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                        iconTab === 'fintech'
                          ? 'bg-primary text-black shadow-sm'
                          : 'text-outline hover:text-on-surface'
                      }`}
                    >
                      Ikon
                    </button>
                    <button
                      type="button"
                      onClick={() => setIconTab('emoji')}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                        iconTab === 'emoji'
                          ? 'bg-primary text-black shadow-sm'
                          : 'text-outline hover:text-on-surface'
                      }`}
                    >
                      Emoji
                    </button>
                    <button
                      type="button"
                      onClick={() => setIconTab('upload')}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                        iconTab === 'upload'
                          ? 'bg-primary text-black shadow-sm'
                          : 'text-outline hover:text-on-surface'
                      }`}
                    >
                      + Unggah
                    </button>
                  </div>
                </div>

                {iconTab === 'fintech' && (
                  <div className="grid grid-cols-6 gap-2 p-2 bg-surface-container-low rounded-xl border border-border/30">
                    {AVAILABLE_ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormIcon(icon)}
                        className={`h-10 rounded-lg flex items-center justify-center transition-all ${
                          formIcon === icon
                            ? 'bg-primary text-black font-bold shadow-sm scale-105'
                            : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">{icon}</span>
                      </button>
                    ))}
                  </div>
                )}

                {iconTab === 'emoji' && (
                  <div className="space-y-2 p-2 bg-surface-container-low rounded-xl border border-border/30">
                    <div className="grid grid-cols-6 gap-2">
                      {['🍕', '☕', '🍔', '🛒', '🚗', '🛵', '🎬', '🎮', '💡', '💊', '📚', '👕', '💰', '💼', '🎁', '🏖️', '✈️', '🐶'].map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setFormIcon(em)}
                          className={`h-10 rounded-lg flex items-center justify-center text-lg transition-all ${
                            formIcon === em ? 'bg-primary/30 border border-primary scale-105' : 'hover:bg-surface-container-high'
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={customEmoji}
                        onChange={(e) => setCustomEmoji(e.target.value)}
                        placeholder="Ketik emoji sendiri..."
                        className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-surface-container-high border border-border/40 text-on-surface focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customEmoji.trim()) setFormIcon(customEmoji.trim());
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-bold"
                      >
                        Pakai
                      </button>
                    </div>
                  </div>
                )}

                {iconTab === 'upload' && (
                  <div className="p-3 bg-surface-container-low rounded-xl border border-dashed border-primary/40 text-center space-y-2">
                    {isCustomImageIcon(formIcon) ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-primary">
                          <img src={formIcon} alt="" className="w-full h-full object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-surface-container-high text-xs font-semibold text-primary"
                        >
                          Ganti Gambar
                        </button>
                      </div>
                    ) : (
                      <div className="py-2">
                        <p className="text-xs text-outline mb-1.5">Pilih icon/logo dari galeri perangkat</p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-1.5 rounded-xl bg-primary text-black text-xs font-bold shadow-sm"
                        >
                          Pilih File
                        </button>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>
                )}
              </div>

              {/* Color Swatch Picker */}
              <div className="space-y-1.5">
                <label className="text-xs text-on-surface-variant font-medium">Pilih Warna</label>
                <div className="flex items-center gap-2 overflow-x-auto p-2 bg-surface-container-low rounded-xl border border-border/30 no-scrollbar">
                  {AVAILABLE_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormColor(color)}
                      className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center transition-transform ${
                        formColor === color ? 'scale-110 ring-2 ring-primary ring-offset-2 ring-offset-surface' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {formColor === color && (
                        <span className="material-symbols-outlined text-white text-[16px] drop-shadow">
                          check
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 pb-4">
                <button
                  type="submit"
                  disabled={!formName.trim() || isAdding}
                  className="w-full h-12 rounded-xl bg-primary text-on-primary text-xs font-semibold flex items-center justify-center gap-2 shadow-glow hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  <span>{editingCategory ? 'Simpan Perubahan' : 'Simpan Kategori'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

