import React, { useEffect, useState } from 'react';

export interface ToastMessage {
  id: string;
  message: string;
  onUndo?: () => void;
  durationMs?: number;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(5);

  useEffect(() => {
    if (!toast) return;

    const duration = toast.durationMs || 5000;
    const initialSecs = Math.ceil(duration / 1000);
    setSecondsRemaining(initialSecs);

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-24 inset-x-4 max-w-sm mx-auto z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center justify-between gap-3 bg-surface-2 border border-border px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-warning text-[20px] shrink-0">
            info
          </span>
          <span className="text-xs font-medium text-on-surface truncate">
            {toast.message}
          </span>
        </div>

        {toast.onUndo && (
          <button
            onClick={() => {
              toast.onUndo?.();
              onClose();
            }}
            type="button"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 text-xs font-semibold shrink-0 transition-colors"
          >
            <span>Batalkan</span>
            <span className="text-[10px] opacity-75">({secondsRemaining}s)</span>
          </button>
        )}
      </div>
    </div>
  );
};
