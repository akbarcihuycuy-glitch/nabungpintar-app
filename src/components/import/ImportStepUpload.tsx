import React, { useRef, useState } from 'react';
import { downloadSampleCsv } from '../../services/import';

interface ImportStepUploadProps {
  onFileSelected: (file: File) => void;
}

export const ImportStepUpload: React.FC<ImportStepUploadProps> = ({ onFileSelected }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const validateAndSelect = (file: File) => {
    setErrorMsg(null);
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setErrorMsg('Format file tidak didukung. Harap unggah file .csv, .xlsx, atau .xls');
      return;
    }

    // 5 MB limit (5 * 1024 * 1024 bytes)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran file melebihi batas maksimal 5 MB.');
      return;
    }

    onFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Guidance Banner */}
      <div className="bg-surface-container p-4 rounded-2xl shadow-sm flex items-start gap-3 relative overflow-hidden border border-border/30">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary/5 rounded-full pointer-events-none blur-xl" />
        <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0 text-primary">
          <span className="material-symbols-outlined text-[24px]">receipt_long</span>
        </div>
        <div className="flex flex-col min-w-0">
          <h2 className="text-sm font-bold text-on-surface mb-0.5">
            Impor Mutasi Rekening & e-Wallet
          </h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Unggah rekening koran bank atau mutasi dompet digital Anda. Sistem cerdas NabungPintar akan
            mendeteksi nominal, tanggal, dan mendeteksi transaksi duplikat otomatis.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-error/15 border border-error/30 text-error text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Dropzone Box */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative bg-surface-container-low rounded-2xl p-7 flex flex-col items-center text-center shadow-md border-2 border-dashed transition-all duration-200 cursor-pointer ${
          isDragging
            ? 'border-primary bg-primary/10'
            : 'border-border/50 hover:border-primary/60 hover:bg-surface-container'
        }`}
      >
        <div className="relative w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-3 text-primary shadow-inner">
          <span className="material-symbols-outlined text-[32px] transition-transform duration-300">
            upload_file
          </span>
          <span className="material-symbols-outlined absolute -bottom-1 -right-1 text-[18px] text-primary bg-surface-container-highest p-0.5 rounded-full">
            add_circle
          </span>
        </div>

        <h3 className="text-base font-bold text-on-surface mb-1">
          Tarik file ke sini atau sentuh
        </h3>
        <p className="text-xs text-on-surface-variant max-w-[270px] mb-3">
          Mendukung ekspor CSV / Excel dari BCA, Mandiri, BRI, BNI, GoPay, OVO, atau ShopeePay.
        </p>

        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center mb-4">
          <span className="bg-surface-container-highest text-primary font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
            .CSV
          </span>
          <span className="bg-surface-container-highest text-primary font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
            .XLSX
          </span>
          <span className="bg-surface-container-highest text-primary font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
            .XLS
          </span>
          <span className="text-[11px] text-outline ml-1">• Maks 5 MB</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              validateAndSelect(e.target.files[0]);
            }
          }}
        />

        <button
          type="button"
          className="h-10 px-4 rounded-xl bg-primary text-black font-bold text-xs flex items-center gap-2 shadow-glow hover:brightness-105 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">folder_open</span>
          <span>Pilih Berkas dari HP / Komputer</span>
        </button>
      </div>

      {/* Download Template CSV Helper Link */}
      <div className="flex items-center justify-center pt-1">
        <button
          type="button"
          onClick={downloadSampleCsv}
          className="flex items-center gap-1.5 text-xs text-outline hover:text-primary transition-colors py-1 font-medium"
        >
          <span className="material-symbols-outlined text-[16px]">download</span>
          <span>Unduh contoh format template CSV standar</span>
        </button>
      </div>
    </div>
  );
};
