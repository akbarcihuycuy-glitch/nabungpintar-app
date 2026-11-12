import React, { useState } from 'react';
import {
  parseFileToRawRows,
  processImportRows,
  ColumnMapping,
  RawRowData,
  ParsedImportRow,
} from '../../services/import';
import { ImportStepUpload } from './ImportStepUpload';
import { ImportStepMap } from './ImportStepMap';
import { ImportStepReview } from './ImportStepReview';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { storageService } from '../../services/storage';
import { useQueryClient } from '@tanstack/react-query';

interface ImportWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (count: number) => void;
}

export const ImportWizardModal: React.FC<ImportWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const { transactions } = useTransactions();
  const { categories } = useCategories();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<RawRowData[]>([]);
  const [parsedRows, setParsedRows] = useState<ParsedImportRow[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleFileSelected = async (file: File) => {
    setIsProcessing(true);
    try {
      const parsed = await parseFileToRawRows(file);
      setFileName(parsed.fileName);
      setHeaders(parsed.headers);
      setRawRows(parsed.rows);
      setStep(2);
    } catch (err: any) {
      alert(`Gagal membaca file: ${err.message || 'Format tidak valid'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmMapping = async (mapping: ColumnMapping) => {
    setIsProcessing(true);
    try {
      const result = await processImportRows(rawRows, mapping, transactions, categories);
      setParsedRows(result);
      setStep(3);
    } catch (err: any) {
      alert(`Gagal memetakan kolom: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveBatch = async (rowsToSave: ParsedImportRow[]) => {
    const formatted = rowsToSave.map((r) => ({
      kind: r.kind,
      amount_original: r.amount_original,
      currency: 'IDR' as const,
      fx_rate_to_idr: 1,
      amount_base: r.amount_original,
      category_id: r.category_id,
      note: r.note,
      occurred_on: r.occurred_on,
      import_hash: r.import_hash,
    }));

    await storageService.batchAddTransactions(formatted);
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['summary'] });

    if (onSuccess) onSuccess(formatted.length);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setStep(1);
    setFileName('');
    setHeaders([]);
    setRawRows([]);
    setParsedRows([]);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Sheet Container */}
      <div className="relative w-full max-w-lg mx-auto bg-surface-container rounded-t-3xl shadow-2xl p-5 pb-safe z-10 border-t border-border/60 max-h-[92vh] overflow-y-auto no-scrollbar animate-slide-up">
        {/* Drag Handle */}
        <div className="w-10 h-1 rounded-full bg-surface-container-highest mx-auto mb-3" />

        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-3 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">file_upload</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">Impor Mutasi Transaksi</h2>
              <p className="text-xs text-outline">Unggah CSV / Excel perbankan Anda</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            type="button"
            className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-outline hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* 3-Step Progress Stepper matching Google Stitch */}
        <div className="bg-surface-container-low rounded-2xl p-3.5 mb-4 shadow-sm border border-border/30">
          <div className="relative flex items-center justify-between px-2">
            {/* Connecting lines */}
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-surface-variant z-0" />
            <div
              className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-primary transition-all duration-500 z-0"
              style={{
                width: step === 1 ? '0%' : step === 2 ? '50%' : '100%',
              }}
            />

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > 1
                    ? 'bg-primary text-black'
                    : step === 1
                    ? 'bg-primary text-black shadow-glow ring-2 ring-primary/30'
                    : 'bg-surface-variant text-outline'
                }`}
              >
                {step > 1 ? (
                  <span className="material-symbols-outlined text-[16px]">check</span>
                ) : (
                  '1'
                )}
              </div>
              <span
                className={`text-[11px] mt-1 font-semibold ${
                  step === 1 ? 'text-primary' : 'text-outline'
                }`}
              >
                Unggah
              </span>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > 2
                    ? 'bg-primary text-black'
                    : step === 2
                    ? 'bg-primary text-black shadow-glow ring-2 ring-primary/30'
                    : 'bg-surface-variant text-outline'
                }`}
              >
                {step > 2 ? (
                  <span className="material-symbols-outlined text-[16px]">check</span>
                ) : (
                  '2'
                )}
              </div>
              <span
                className={`text-[11px] mt-1 font-semibold ${
                  step === 2 ? 'text-primary' : 'text-outline'
                }`}
              >
                Petakan
              </span>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === 3
                    ? 'bg-primary text-black shadow-glow ring-2 ring-primary/30'
                    : 'bg-surface-variant text-outline'
                }`}
              >
                3
              </div>
              <span
                className={`text-[11px] mt-1 font-semibold ${
                  step === 3 ? 'text-primary' : 'text-outline'
                }`}
              >
                Simpan
              </span>
            </div>
          </div>
        </div>

        {/* Step Views */}
        {step === 1 && <ImportStepUpload onFileSelected={handleFileSelected} />}

        {step === 2 && (
          <ImportStepMap
            fileName={fileName}
            rowCount={rawRows.length}
            headers={headers}
            previewRows={rawRows}
            onConfirmMapping={handleConfirmMapping}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <ImportStepReview
            rows={parsedRows}
            onSaveBatch={handleSaveBatch}
            onCancel={handleClose}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </div>
  );
};

