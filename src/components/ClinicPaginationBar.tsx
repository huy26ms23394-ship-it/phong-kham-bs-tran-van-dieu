import React, { useState, useEffect } from 'react';
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from 'lucide-react';
import { UseSmartPaginationResult } from '../hooks/useSmartPagination';

interface ClinicPaginationBarProps {
  pagination: UseSmartPaginationResult<any>;
  pageSizeOptions?: number[];
  itemLabel?: string; // Ví dụ: 'thuốc', 'bệnh nhân', 'đơn thuốc', 'dòng'
  isCompact?: boolean; // Tối ưu cho không gian hẹp (khung kho thuốc kê đơn)
  className?: string;
}

export const ClinicPaginationBar: React.FC<ClinicPaginationBarProps> = ({
  pagination,
  pageSizeOptions = [15, 30, 50, 100],
  itemLabel = 'mục',
  isCompact = false,
  className = '',
}) => {
  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    setPageSize,
    canPrev,
    canNext,
    pageNumbers,
  } = pagination;

  const [jumpPageInput, setJumpPageInput] = useState<string>(String(currentPage));

  useEffect(() => {
    setJumpPageInput(String(currentPage));
  }, [currentPage]);

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(jumpPageInput, 10);
    if (!isNaN(parsed)) {
      goToPage(parsed);
    } else {
      setJumpPageInput(String(currentPage));
    }
  };

  if (totalItems === 0) {
    return (
      <div className={`py-2 px-3 text-xs text-slate-500 dark:text-slate-400 text-center ${className}`}>
        Không có dữ liệu phù hợp
      </div>
    );
  }

  // Chế độ thu gọn (Compact - dành cho cột Kho Thuốc bên phải)
  if (isCompact) {
    return (
      <div
        className={`flex items-center justify-between gap-1.5 py-1.5 px-2 bg-slate-100/90 dark:bg-slate-900/90 border-t border-slate-200 dark:border-white/10 text-[11px] select-none ${className}`}
        aria-label="Thanh phân trang thu gọn"
      >
        <span className="text-slate-600 dark:text-slate-400 font-mono text-[10.5px] tabular-nums truncate">
          <strong>{startIndex}–{endIndex}</strong>/{totalItems}
        </span>

        {/* Nút lùi/tiến trang nhanh */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={firstPage}
            disabled={!canPrev}
            title="Trang đầu"
            className="w-6 h-6 flex items-center justify-center rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={prevPage}
            disabled={!canPrev}
            title="Trang trước"
            className="w-6 h-6 flex items-center justify-center rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="px-1.5 py-0.5 font-bold font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 rounded border border-emerald-300/60 dark:border-emerald-600/40 text-[11px]">
            {currentPage}/{totalPages}
          </span>

          <button
            type="button"
            onClick={nextPage}
            disabled={!canNext}
            title="Trang sau"
            className="w-6 h-6 flex items-center justify-center rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={lastPage}
            disabled={!canNext}
            title="Trang cuối"
            className="w-6 h-6 flex items-center justify-center rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>

          {/* Chọn số dòng/trang thu gọn */}
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="h-6 px-1 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-white/10 text-[10px] font-mono focus:outline-none focus:border-emerald-500 cursor-pointer ml-1"
            title="Số thuốc mỗi trang"
          >
            {pageSizeOptions.map((sz) => (
              <option key={sz} value={sz}>
                {sz}/trang
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  // Chế độ đầy đủ (Full Medical Standard)
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 py-2.5 px-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-white/10 text-xs transition-colors ${className}`}
      aria-label="Thanh phân trang chuẩn y tế"
    >
      {/* Vế trái: Đếm số lượng kết quả */}
      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
        <span>
          Hiển thị{' '}
          <strong className="text-slate-900 dark:text-white font-mono tabular-nums">
            {startIndex}–{endIndex}
          </strong>{' '}
          trên tổng số{' '}
          <strong className="text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
            {totalItems.toLocaleString('vi-VN')}
          </strong>{' '}
          {itemLabel}
        </span>

        {/* Bộ chọn số dòng / trang */}
        <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-300 dark:border-white/10">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Số dòng:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="h-7 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/15 text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
          >
            {pageSizeOptions.map((sz) => (
              <option key={sz} value={sz}>
                {sz} / trang
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vế phải: Nút phân trang & Ô nhảy trang nhanh */}
      <div className="flex items-center gap-1.5 ml-auto">
        {/* Nút Đầu « */}
        <button
          type="button"
          onClick={firstPage}
          disabled={!canPrev}
          title="Về trang đầu tiên (1)"
          className="h-7 px-2 flex items-center justify-center rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/10 disabled:opacity-35 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
          <span className="sr-only sm:not-sr-only sm:ml-1 text-[11px] hidden md:inline">Đầu</span>
        </button>

        {/* Nút Trước ‹ */}
        <button
          type="button"
          onClick={prevPage}
          disabled={!canPrev}
          title="Trang trước"
          className="h-7 px-2 flex items-center justify-center rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/10 disabled:opacity-35 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="sr-only sm:not-sr-only sm:ml-1 text-[11px] hidden md:inline">Trước</span>
        </button>

        {/* Danh sách các số trang */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((p, idx) => {
            if (p === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1.5 text-slate-400 dark:text-slate-600 font-bold select-none"
                >
                  …
                </span>
              );
            }

            const isActive = p === currentPage;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => goToPage(p)}
                className={`h-7 min-w-[28px] px-1.5 flex items-center justify-center rounded-md text-xs font-mono font-bold transition-all shadow-2xs ${
                  isActive
                    ? 'bg-emerald-600 dark:bg-emerald-500 text-white border border-emerald-700 dark:border-emerald-400 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Nút Sau › */}
        <button
          type="button"
          onClick={nextPage}
          disabled={!canNext}
          title="Trang tiếp theo"
          className="h-7 px-2 flex items-center justify-center rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/10 disabled:opacity-35 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
        >
          <span className="sr-only sm:not-sr-only sm:mr-1 text-[11px] hidden md:inline">Sau</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Nút Cuối » */}
        <button
          type="button"
          onClick={lastPage}
          disabled={!canNext}
          title={`Đến trang cuối (${totalPages})`}
          className="h-7 px-2 flex items-center justify-center rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/10 disabled:opacity-35 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
        >
          <span className="sr-only sm:not-sr-only sm:mr-1 text-[11px] hidden md:inline">Cuối</span>
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>

        {/* Ô Nhảy Nhanh Tới Trang */}
        <form onSubmit={handleJumpSubmit} className="flex items-center gap-1 ml-1.5 pl-1.5 border-l border-slate-300 dark:border-white/10">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden lg:inline">Trang:</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={jumpPageInput}
            onChange={(e) => setJumpPageInput(e.target.value)}
            onBlur={handleJumpSubmit}
            aria-label="Nhập số trang cần đến"
            className="w-12 h-7 px-1.5 text-center rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 text-xs font-mono focus:outline-none focus:border-emerald-500"
          />
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            /{totalPages}
          </span>
        </form>
      </div>
    </div>
  );
};
