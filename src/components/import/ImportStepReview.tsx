import React, { useState } from 'react';
import { ParsedImportRow } from '../../services/import';
import { useFx } from '../../hooks/useFx';
import { formatDateIndo } from '../../utils/formatters';

interface ImportStepReviewProps {
  rows: ParsedImportRow[];
  onSaveBatch: (validRows: ParsedImportRow[]) => Promise<void>;
  onCancel: () => void;
  onBack: () => void;
}

export const ImportStepReview: React.FC<ImportStepReviewProps> = ({
  rows,
  onSaveBatch,
  onCancel,
  onBack,
}) => {
  const { formatMoney } = useFx();
  const [skipDuplicates, setSkipDuplicates] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [filterTab, setFilterTab] = useState<'all' | 'valid' | 'duplicate' | 'error'>('all');

  const validRows = rows.filter((r) => r.status === 'valid');
  const duplicateRows = rows.filter((r) => r.status === 'duplicate');
  const errorRows = rows.filter((r) => r.status === 'error');

  // Rows that will actually be imported
  const rowsToImport = rows.filter((r) => {
    if (r.status === 'error') return false;
    if (r.status === 'duplicate' && skipDuplicates) return false;
    return true;
  });

  const displayedRows = rows.filter((r) => {
    if (filterTab === 'all') return true;
    return r.status === filterTab;
  });

  const handleSave = async () => {
    if (rowsToImport.length === 0) return;
    setIsSaving(true);
    try {
      await onSaveBatch(rowsToImport);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Summary Chips Horizontal Feed */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          type="button"
          onClick={() => setFilterTab('valid')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
            filterTab === 'valid'
              ? 'bg-primary text-black'
              : 'bg-primary/15 text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          <span>{validRows.length} Valid</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('duplicate')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
            filterTab === 'duplicate'
              ? 'bg-amber-400 text-black'
              : 'bg-amber-400/15 text-amber-300'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">content_copy</span>
          <span>{duplicateRows.length} Duplikat</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('error')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
            filterTab === 'error'
              ? 'bg-error text-black'
              : 'bg-error/20 text-error'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">error</span>
          <span>{errorRows.length} Error</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
            filterTab === 'all'
              ? 'bg-surface-container-high text-on-surface'
              : 'bg-surface-container text-outline'
          }`}
        >
          Semua ({rows.length})
        </button>
      </div>

      {/* Smart Duplicate Handling Card */}
      <div className="bg-surface-container rounded-2xl p-4 shadow-sm flex flex-col gap-2 border border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <span className="material-symbols-outlined text-primary text-[20px] shrink-0">
              auto_fix_high
            </span>
            <span className="text-xs font-bold text-on-surface truncate">
              Lewati transaksi duplikat otomatis
            </span>
          </div>

          {/* Toggle */}
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={skipDuplicates}
              onChange={(e) => setSkipDuplicates(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:bg-primary transition-colors" />
            <div className="absolute left-1 top-1 bg-white peer-checked:bg-black w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5" />
          </label>
        </div>
        <p className="text-[11px] text-on-surface-variant leading-relaxed">
          {duplicateRows.length > 0
            ? `${duplicateRows.length} transaksi yang terdeteksi mirip dengan riwayat Anda akan diabaikan agar data keuangan tetap akurat.`
            : 'Tidak ada duplikat terdeteksi pada batch transaksi ini.'}
        </p>
      </div>

      {/* Preview Transaction List */}
      <div className="bg-surface-container rounded-2xl p-4 shadow-sm border border-border/40 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-on-surface">Pratinjau Data Impor</span>
          <span className="text-[11px] text-outline">
            Menampilkan {displayedRows.length} dari {rows.length}
          </span>
        </div>

        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto no-scrollbar">
          {displayedRows.map((item) => {
            const isIncome = item.kind === 'income';
            return (
              <div
                key={item.index}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  item.status === 'error'
                    ? 'bg-error/10 border-error/30'
                    : item.status === 'duplicate'
                    ? 'bg-amber-400/10 border-amber-400/30'
                    : 'bg-surface-container-low border-border/30'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      item.status === 'error'
                        ? 'bg-error/20 text-error'
                        : item.status === 'duplicate'
                        ? 'bg-amber-400/20 text-amber-300'
                        : isIncome
                        ? 'bg-primary/20 text-primary'
                        : 'bg-surface-container-high text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {item.status === 'error'
                        ? 'error'
                        : item.status === 'duplicate'
                        ? 'content_copy'
                        : isIncome
                        ? 'arrow_downward'
                        : 'arrow_upward'}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-on-surface truncate">{item.note}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-outline mt-0.5">
                      <span>{formatDateIndo(item.occurred_on)}</span>
                      {item.category_name && <span>• {item.category_name}</span>}
                      {item.status === 'duplicate' && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold">
                          Duplikat
                        </span>
                      )}
                      {item.status === 'error' && (
                        <span className="text-error font-medium">• {item.errorMessage}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {item.amount_original > 0 ? (
                    <span
                      className={`text-xs font-bold tabular-nums ${
                        isIncome ? 'text-primary' : 'text-on-surface'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatMoney(item.amount_original)}
                    </span>
                  ) : (
                    <span className="text-xs text-error font-semibold">-</span>
                  )}
                  <p className="text-[10px] text-outline uppercase">{item.kind}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || rowsToImport.length === 0}
          className="w-full h-12 rounded-xl bg-primary text-black font-bold text-xs flex items-center justify-center gap-2 shadow-glow hover:brightness-105 active:scale-95 transition-all disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
          <span>
            {isSaving
              ? 'Menyimpan Mutasi...'
              : `Simpan Sekaligus (${rowsToImport.length} Transaksi)`}
          </span>
        </button>

        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-outline hover:text-on-surface transition-colors py-1 font-medium"
          >
            ← Kembali ke Pemetaan
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-error hover:underline transition-colors py-1 font-medium"
          >
            Batalkan Impor
          </button>
        </div>
      </div>
    </div>
  );
};

