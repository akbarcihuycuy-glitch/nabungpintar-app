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
    } catch (err: any) {\n      alert(`Gagal membaca file: ${err.message || 'Format tidak valid'}`);\n    } finally {\n      setIsProcessing(false);\n    }\n  };\n\n  const handleConfirmMapping = async (mapping: ColumnMapping) => {\n    setIsProcessing(true);\n    try {\n      const result = await processImportRows(rawRows, mapping, transactions, categories);\n      setParsedRows(result);\n      setStep(3);\n    } catch (err: any) {\n      alert(`Gagal memetakan kolom: ${err.message}`);\n    } finally {\n      setIsProcessing(false);\n    }\n  };\n\n  const handleSaveBatch = async (rowsToSave: ParsedImportRow[]) => {\n    const formatted = rowsToSave.map((r) => ({\n      kind: r.kind,\n      amount_original: r.amount_original,\n      currency: 'IDR' as const,\n      fx_rate_to_idr: 1,\n      amount_base: r.amount_original,\n      category_id: r.category_id,\n      note: r.note,\n      occurred_on: r.occurred_on,\n      import_hash: r.import_hash,\n    }));\n\n    await storageService.batchAddTransactions(formatted);\n    queryClient.invalidateQueries({ queryKey: ['transactions'] });\n    queryClient.invalidateQueries({ queryKey: ['summary'] });\n\n    if (onSuccess) onSuccess(formatted.length);\n    handleReset();\n    onClose();\n  };\n\n  const handleReset = () => {\n    setStep(1);\n    setFileName('');\n    setHeaders([]);\n    setRawRows([]);\n    setParsedRows([]);\n  };\n\n  const handleClose = () => {\n    handleReset();\n    onClose();\n  };\n\n  return (\n    <div className=\"fixed inset-0 z-50 flex flex-col justify-end\">\n      {/* Backdrop */}\n      <div\n        className=\"fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity\"\n        onClick={handleClose}\n      />\n\n      {/* Sheet Container */}\n      <div className=\"relative w-full max-w-lg mx-auto bg-surface-container rounded-t-3xl shadow-2xl p-5 pb-safe z-10 border-t border-border/60 max-h-[92vh] overflow-y-auto no-scrollbar animate-slide-up\">\n        {/* Drag Handle */}\n        <div className=\"w-10 h-1 rounded-full bg-surface-container-highest mx-auto mb-3\" />\n\n        {/* Modal Top Header */}\n        <div className=\"flex items-center justify-between pb-3 mb-2\">\n          <div className=\"flex items-center gap-2\">\n            <div className=\"w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary\">\n              <span className=\"material-symbols-outlined text-[20px]\">file_upload</span>\n            </div>\n            <div>\n              <h2 className=\"text-base font-bold text-on-surface\">Impor Mutasi Transaksi</h2>\n              <p className=\"text-xs text-outline\">Unggah CSV / Excel perbankan Anda</p>\n            </div>\n          </div>\n\n          <button\n            onClick={handleClose}\n            type=\"button\"\n            className=\"w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-outline hover:text-on-surface transition-colors\"\n          >\n            <span className=\"material-symbols-outlined text-[18px]\">close</span>\n          </button>\n        </div>\n\n        {/* 3-Step Progress Stepper matching Google Stitch */}\n        <div className=\"bg-surface-container-low rounded-2xl p-3.5 mb-4 shadow-sm border border-border/30\">\n          <div className=\"relative flex items-center justify-between px-2\">\n            {/* Connecting lines */}\n            <div className=\"absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-surface-variant z-0\" />\n            <div\n              className=\"absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-primary transition-all duration-500 z-0\"\n              style={{\n                width: step === 1 ? '0%' : step === 2 ? '50%' : '100%',\n              }}\n            />\n\n            {/* Step 1 */}\n            <div className=\"relative z-10 flex flex-col items-center\">\n              <div\n                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${\n                  step > 1\n                    ? 'bg-primary text-black'\n                    : step === 1\n                    ? 'bg-primary text-black shadow-glow ring-2 ring-primary/30'\n                    : 'bg-surface-variant text-outline'\n                }`}\n              >\n                {step > 1 ? (\n                  <span className=\"material-symbols-outlined text-[16px]\">check</span>\n                ) : (\n                  '1'\n                )}\n              </div>\n              <span\n                className={`text-[11px] mt-1 font-semibold ${\n                  step === 1 ? 'text-primary' : 'text-outline'\n                }`}\n              >\n                Unggah\n              </span>\n            </div>\n\n            {/* Step 2 */}\n            <div className=\"relative z-10 flex flex-col items-center\">\n              <div\n                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${\n                  step > 2\n                    ? 'bg-primary text-black'\n                    : step === 2\n                    ? 'bg-primary text-black shadow-glow ring-2 ring-primary/30'\n                    : 'bg-surface-variant text-outline'\n                }`}\n              >\n                {step > 2 ? (\n                  <span className=\"material-symbols-outlined text-[16px]\">check</span>\n                ) : (\n                  '2'\n                )}\n              </div>\n              <span\n                className={`text-[11px] mt-1 font-semibold ${\n                  step === 2 ? 'text-primary' : 'text-outline'\n                }`}\n              >\n                Petakan\n              </span>\n            </div>\n\n            {/* Step 3 */}\n            <div className=\"relative z-10 flex flex-col items-center\">\n              <div\n                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${\n                  step === 3\n                    ? 'bg-primary text-black shadow-glow ring-2 ring-primary/30'\n                    : 'bg-surface-variant text-outline'\n                }`}\n              >\n                3\n              </div>\n              <span\n                className={`text-[11px] mt-1 font-semibold ${\n                  step === 3 ? 'text-primary' : 'text-outline'\n                }`}\n              >\n                Simpan\n              </span>\n            </div>\n          </div>\n        </div>\n\n        {/* Step Views */}\n        {step === 1 && <ImportStepUpload onFileSelected={handleFileSelected} />}\n\n        {step === 2 && (\n          <ImportStepMap\n            fileName={fileName}\n            rowCount={rawRows.length}\n            headers={headers}\n            previewRows={rawRows}\n            onConfirmMapping={handleConfirmMapping}\n            onBack={() => setStep(1)}\n          />\n        )}\n\n        {step === 3 && (\n          <ImportStepReview\n            rows={parsedRows}\n            onSaveBatch={handleSaveBatch}\n            onCancel={handleClose}\n            onBack={() => setStep(2)}\n          />\n        )}\n      </div>\n    </div>\n  );\n};\n