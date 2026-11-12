import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    if (window.confirm('Reset seluruh penyimpanan lokal & cache aplikasi?')) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#0B1120] text-[#E8EEF9] flex flex-col items-center justify-center p-4 selection:bg-[#2DD4A7] selection:text-black font-sans">
          <div className="w-full max-w-md bg-[#111A2E] border border-red-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <span className="material-symbols-outlined text-[32px]">error</span>
              <div>
                <h1 className="text-base font-bold text-white">Terjadi Kendala Tampilan</h1>
                <p className="text-xs text-slate-400">Komponen aplikasi menangkap kendala runtime.</p>
              </div>
            </div>

            <div className="p-3 bg-[#080E1D] rounded-xl border border-border/40 font-mono text-[11px] text-red-300 max-h-40 overflow-y-auto break-words">
              {this.state.error?.toString()}
            </div>

            {this.state.errorInfo && (
              <details className="text-[10px] text-slate-400 font-mono">
                <summary className="cursor-pointer hover:text-slate-300 py-1">
                  Lihat Stack Komponen
                </summary>
                <pre className="mt-2 p-2 bg-[#080E1D] rounded-lg overflow-x-auto text-[10px] text-slate-400">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={this.handleResetCache}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Reset Cache & Mulai Ulang
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2 rounded-xl bg-[#2DD4A7] text-black text-xs font-bold hover:brightness-105 active:scale-95 transition-all shadow-md"
              >
                Muat Ulang
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

