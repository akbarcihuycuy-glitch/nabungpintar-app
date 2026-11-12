import React, { useState, useEffect } from 'react';
import { ColumnMapping, RawRowData, IMPORT_MAPPING_STORAGE_KEY } from '../../services/import';

interface ImportStepMapProps {
  fileName: string;
  rowCount: number;
  headers: string[];
  previewRows: RawRowData[];
  onConfirmMapping: (mapping: ColumnMapping) => void;
  onBack: () => void;
}

export const ImportStepMap: React.FC<ImportStepMapProps> = ({
  fileName,
  rowCount,
  headers,
  previewRows,
  onConfirmMapping,
  onBack,
}) => {
  // Try loading saved mapping
  const [dateFormat, setDateFormat] = useState<'DD/MM/YYYY' | 'YYYY-MM-DD'>('DD/MM/YYYY');
  const [amountMode, setAmountMode] = useState<'split' | 'single'>('split');
  const [dateCol, setDateCol] = useState<string>('');
  const [descriptionCol, setDescriptionCol] = useState<string>('');
  const [debitCol, setDebitCol] = useState<string>('');
  const [creditCol, setCreditCol] = useState<string>('');
  const [amountCol, setAmountCol] = useState<string>('');
  const [categoryCol, setCategoryCol] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Auto-detect columns based on common names
  useEffect(() => {
    // 1. Try saved mapping
    let saved: Partial<ColumnMapping> | null = null;
    try {
      const raw = localStorage.getItem(IMPORT_MAPPING_STORAGE_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch {}

    const findMatch = (candidates: string[]) => {
      return headers.find((h) =>
        candidates.some((c) => h.toLowerCase().trim() === c.toLowerCase() || h.toLowerCase().includes(c.toLowerCase()))
      ) || '';
    };

    if (saved && saved.dateCol && headers.includes(saved.dateCol)) {
      setDateCol(saved.dateCol);
      setDescriptionCol(saved.descriptionCol && headers.includes(saved.descriptionCol) ? saved.descriptionCol : '');
      setAmountMode(saved.amountMode || 'split');
      setDebitCol(saved.debitCol && headers.includes(saved.debitCol) ? saved.debitCol : '');
      setCreditCol(saved.creditCol && headers.includes(saved.creditCol) ? saved.creditCol : '');
      setAmountCol(saved.amountCol && headers.includes(saved.amountCol) ? saved.amountCol : '');
      setCategoryCol(saved.categoryCol && headers.includes(saved.categoryCol) ? saved.categoryCol : '');
      setDateFormat(saved.dateFormat || 'DD/MM/YYYY');
    } else {
      // Auto heuristic detection
      setDateCol(findMatch(['tanggal', 'date', 'tgl', 'txn date']));
      setDescriptionCol(findMatch(['keterangan', 'description', 'uraian', 'narration', 'memo', 'catatan']));
      
      const foundDebit = findMatch(['debit', 'keluar', 'pengeluaran', 'dr']);
      const foundCredit = findMatch(['kredit', 'masuk', 'pemasukan', 'cr']);

      if (foundDebit || foundCredit) {
        setAmountMode('split');
        setDebitCol(foundDebit);
        setCreditCol(foundCredit);
      } else {
        const foundAmt = findMatch(['nominal', 'amount', 'jumlah', 'saldo']);
        if (foundAmt) {
          setAmountMode('single');
          setAmountCol(foundAmt);
        }
      }

      setCategoryCol(findMatch(['kategori', 'category']));
    }
  }, [headers]);

  const handleProceed = () => {
    if (!dateCol) {
      setValidationError('Pilih kolom yang berisi tanggal transaksi');
      return;
    }

    if (amountMode === 'split' && !debitCol && !creditCol) {
      setValidationError('Pilih minimal satu kolom untuk Debit atau Kredit');
      return;
    }

    if (amountMode === 'single' && !amountCol) {
      setValidationError('Pilih kolom yang berisi nominal transaksi');
      return;
    }

    const mapping: ColumnMapping = {
      dateCol,
      descriptionCol: descriptionCol || undefined,
      amountMode,
      debitCol: debitCol || undefined,
      creditCol: creditCol || undefined,
      amountCol: amountCol || undefined,
      categoryCol: categoryCol || undefined,
      dateFormat,
    };

    // Save to LocalStorage for future imports
    try {
      localStorage.setItem(IMPORT_MAPPING_STORAGE_KEY, JSON.stringify(mapping));
    } catch {}

    setValidationError(null);
    onConfirmMapping(mapping);
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* File Info Badge Card */}
      <div className="bg-surface-container rounded-2xl p-4 flex items-center justify-between shadow-sm border border-border/40">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0 text-primary">
            <span className="material-symbols-outlined text-[22px]">description</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-on-surface truncate">{fileName}</span>
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
            </div>
            <span className="text-xs text-outline">{rowCount} baris data terdeteksi</span>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
          Siap Dipetakan
        </span>
      </div>

      {/* Date Format Selector Card */}
      <div className="bg-surface-container rounded-2xl p-4 shadow-sm border border-border/40">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="material-symbols-outlined text-[18px] text-primary">calendar_today</span>
          <h3 className="text-sm font-bold text-on-surface">Format Tanggal dalam Berkas</h3>
        </div>
        <p className="text-xs text-on-surface-variant mb-3">
          Pilih urutan penulisan tanggal pada file Anda agar tanggal tercatat akurat.
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDateFormat('DD/MM/YYYY')}
            className={`p-3 rounded-xl border flex flex-col items-start transition-all text-left ${
              dateFormat === 'DD/MM/YYYY'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border/40 bg-surface-container-high text-on-surface hover:border-border'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold">DD/MM/YYYY</span>
              {dateFormat === 'DD/MM/YYYY' && (
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
              )}
            </div>
            <span className="text-[10px] text-outline mt-0.5">Contoh: 28/10/2024</span>
          </button>

          <button
            type="button"
            onClick={() => setDateFormat('YYYY-MM-DD')}
            className={`p-3 rounded-xl border flex flex-col items-start transition-all text-left ${
              dateFormat === 'YYYY-MM-DD'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border/40 bg-surface-container-high text-on-surface hover:border-border'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold">YYYY-MM-DD (ISO)</span>
              {dateFormat === 'YYYY-MM-DD' && (
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
              )}
            </div>
            <span className="text-[10px] text-outline mt-0.5">Contoh: 2024-10-28</span>
          </button>
        </div>
      </div>

      {/* 5-Row Preview Table */}
      <div className="bg-surface-container rounded-2xl p-4 shadow-sm border border-border/40">
        <h3 className="text-sm font-bold text-on-surface mb-1">Pratinjau Data Asli (5 Baris Pertama)</h3>
        <p className="text-xs text-outline mb-3">Lihat isi kolom untuk memastikan pemetaan yang cocok</p>

        <div className="overflow-x-auto rounded-xl border border-border/40 max-h-40 no-scrollbar">
          <table className="w-full text-[11px] text-left">
            <thead className="bg-surface-container-high text-on-surface-variant uppercase font-semibold">
              <tr>
                <th className="p-2 border-b border-border/40">#</th>
                {headers.map((h) => (
                  <th key={h} className="p-2 border-b border-border/40 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20 text-on-surface">
              {previewRows.slice(0, 5).map((row, idx) => (
                <tr key={idx} className="hover:bg-surface-container-high/40">
                  <td className="p-2 text-outline">{idx + 1}</td>
                  {headers.map((h) => (
                    <td key={h} className="p-2 whitespace-nowrap tabular-nums">
                      {String(row[h] || '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Column Mapping Selectors */}
      <div className="bg-surface-container rounded-2xl p-4 shadow-sm border border-border/40 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-on-surface">Petakan Kolom NabungPintar</h3>
            <p className="text-xs text-outline">Cocokkan atribut transaksi dengan nama header di berkas</p>
          </div>

          <div className="flex p-0.5 bg-surface-container-high rounded-lg text-[10px]">
            <button
              type="button"
              onClick={() => setAmountMode('split')}
              className={`px-2 py-1 rounded-md font-semibold transition-all ${
                amountMode === 'split' ? 'bg-primary text-black' : 'text-outline'
              }`}
            >
              Debit/Kredit
            </button>
            <button
              type="button"
              onClick={() => setAmountMode('single')}
              className={`px-2 py-1 rounded-md font-semibold transition-all ${
                amountMode === 'single' ? 'bg-primary text-black' : 'text-outline'
              }`}
            >
              1 Kolom
            </button>
          </div>
        </div>

        {validationError && (
          <div className="p-2.5 rounded-xl bg-error/15 text-error text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{validationError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Tanggal */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-outline">
              Kolom Tanggal <span className="text-error">*</span>
            </label>
            <select
              value={dateCol}
              onChange={(e) => setDateCol(e.target.value)}
              className="h-10 px-3 rounded-xl bg-surface-container-high border border-border/40 text-xs text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="">-- Pilih Kolom Tanggal --</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          {/* Keterangan */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-outline">Kolom Keterangan / Uraian</label>
            <select
              value={descriptionCol}
              onChange={(e) => setDescriptionCol(e.target.value)}
              className="h-10 px-3 rounded-xl bg-surface-container-high border border-border/40 text-xs text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="">-- (Opsional) Pilih Kolom Keterangan --</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          {amountMode === 'split' ? (
            <>
              {/* Kolom Debit */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-error">Kolom Debit (Pengeluaran)</label>
                <select
                  value={debitCol}
                  onChange={(e) => setDebitCol(e.target.value)}
                  className="h-10 px-3 rounded-xl bg-surface-container-high border border-border/40 text-xs text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="">-- Pilih Kolom Debit --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kolom Kredit */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-primary">Kolom Kredit (Pemasukan)</label>
                <select
                  value={creditCol}
                  onChange={(e) => setCreditCol(e.target.value)}
                  className="h-10 px-3 rounded-xl bg-surface-container-high border border-border/40 text-xs text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="">-- Pilih Kolom Kredit --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              {/* Single Nominal */}
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-xs font-semibold text-outline">
                  Kolom Nominal Transaksi <span className="text-error">*</span>
                </label>
                <select
                  value={amountCol}
                  onChange={(e) => setAmountCol(e.target.value)}
                  className="h-10 px-3 rounded-xl bg-surface-container-high border border-border/40 text-xs text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="">-- Pilih Kolom Nominal --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Kategori */}
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-xs font-semibold text-outline">Kolom Kategori (Opsional)</label>
            <select
              value={categoryCol}
              onChange={(e) => setCategoryCol(e.target.value)}
              className="h-10 px-3 rounded-xl bg-surface-container-high border border-border/40 text-xs text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="">-- (Opsional) Cocokkan Nama Kategori --</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="py-3 px-4 rounded-xl bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-bright active:scale-95 transition-all"
        >
          Kembali
        </button>

        <button
          type="button"
          onClick={handleProceed}
          className="flex-1 py-3 rounded-xl bg-primary text-black font-bold text-xs shadow-glow hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <span>Lanjut ke Pratinjau (Langkah 3)</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

