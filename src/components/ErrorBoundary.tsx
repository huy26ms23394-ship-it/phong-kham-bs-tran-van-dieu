import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
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
    console.error('[ErrorBoundary Caught]', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.hash = '#/consultation';
      window.location.reload();
    }
  };

  private handleClearCache = () => {
    try {
      localStorage.removeItem('mediba_pharmacy_catalog_v2');
      localStorage.removeItem('mediba_consultation_draft_v2');
    } catch {}
    window.location.hash = '#/consultation';
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.hash = '#/consultation';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[280px] p-6 m-4 rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center text-center shadow-lg">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-rose-900 dark:text-rose-300">
            {this.props.fallbackTitle || 'Đã xảy ra sự cố hiển thị giao diện'}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mt-1 mb-4">
            Dữ liệu phòng khám của Bác sĩ vẫn an toàn trên hệ thống. Bạn có thể nhấn thử lại hoặc quay về màn hình Khám bệnh.
          </p>

          {this.state.error && (
            <div className="w-full max-w-md bg-black/5 dark:bg-black/40 rounded p-2 text-left text-[11px] font-mono text-rose-700 dark:text-rose-300 mb-4 overflow-x-auto max-h-24">
              {this.state.error.message || String(this.state.error)}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi Phục &amp; Thử Lại</span>
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Về Trang Khám Bệnh</span>
            </button>
            <button
              type="button"
              onClick={this.handleClearCache}
              className="px-3 py-2 bg-rose-100 dark:bg-rose-900/40 hover:bg-rose-200 dark:hover:bg-rose-800/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Xóa cache thuốc và bản nháp để làm mới sạch sẽ"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Xóa Cache &amp; Làm Mới</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
