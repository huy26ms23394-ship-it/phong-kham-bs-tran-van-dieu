import React, { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { MedicationCatalogItem } from '../types/medical';
import { getGoogleSearchUrl } from './PharmacyCatalogModal';
import { formatMealTiming } from '../utils/medicationSchedule';
import {
  Globe,
  Plus,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  Pill,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface DrugDetailPopoverProps {
  item: MedicationCatalogItem | null;
  anchorRect: DOMRect | null;
  isOpen: boolean;
  onClose: () => void;
  onMouseEnterPopover: () => void;
  onMouseLeavePopover: () => void;
  onAddMedication?: (item: MedicationCatalogItem) => void;
}

export const DrugDetailPopover: React.FC<DrugDetailPopoverProps> = ({
  item,
  anchorRect,
  isOpen,
  onClose,
  onMouseEnterPopover,
  onMouseLeavePopover,
  onAddMedication,
}) => {
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 100, left: 100 });

  useLayoutEffect(() => {
    if (!anchorRect) return;

    const popoverWidth = 350;
    const padding = 12;
    const bottomSafeArea = 28; // Khoảng cách an toàn phía trên thanh Taskbar Windows
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 1. Tính toán toạ độ ngang (Left)
    // Mặc định hiện sang bên trái thẻ thuốc
    let left = anchorRect.left - popoverWidth - padding;
    if (left < padding) {
      // Nếu bên trái không đủ chỗ, hiện sang bên phải thẻ thuốc
      left = anchorRect.right + padding;
      if (left + popoverWidth > viewportWidth - padding) {
        // Nếu màn hình hẹp, ép vào mép an toàn
        left = Math.max(padding, viewportWidth - popoverWidth - padding);
      }
    }

    // 2. Tính toán toạ độ dọc (Top) thông minh theo chiều cao thực tế
    const popoverHeight = popoverRef.current ? popoverRef.current.offsetHeight : 440;

    let top = anchorRect.top;

    // Nếu canh đỉnh mà mép dưới của popover chạm hoặc tràn xuống Taskbar:
    if (top + popoverHeight > viewportHeight - bottomSafeArea) {
      // Đẩy ngược popover lên trên sao cho mép dưới luôn cách đáy màn hình tối thiểu 28px
      top = viewportHeight - popoverHeight - bottomSafeArea;
    }

    // Đảm bảo không bị tràn mép trên
    if (top < padding) {
      top = padding;
    }

    setCoords({ top, left });
  }, [anchorRect, item]);

  if (!isOpen || !item || !anchorRect) return null;

  const popoverWidth = 350;
  const padding = 12;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const copyText = `${item.name} (${item.activeIngredient || 'Chưa rõ hoạt chất'}) - Hàm lượng: ${item.strength} - Dạng: ${item.form}`;
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddMedication) {
      onAddMedication(item);
      onClose();
    }
  };

  const morning = item.defaultDosage?.morning ?? 0;
  const noon = item.defaultDosage?.noon ?? 0;
  const afternoon = item.defaultDosage?.afternoon ?? 0;
  const evening = item.defaultDosage?.evening ?? 0;

  return createPortal(
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        width: `${popoverWidth}px`,
        maxHeight: 'calc(100vh - 36px)',
        zIndex: 99999,
      }}
      onMouseEnter={onMouseEnterPopover}
      onMouseLeave={onMouseLeavePopover}
      className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700/80 p-3.5 text-slate-800 dark:text-slate-100 transition-all duration-150 animate-in fade-in zoom-in-95 backdrop-blur-md select-text flex flex-col"
    >
      {/* Safe hover connector buffer: Vùng đệm vô hình nối liền thẻ thuốc và popover */}
      <div
        className="absolute top-0 bottom-0 pointer-events-auto"
        style={{
          width: `${padding + 12}px`,
          right: coords.left < anchorRect.left ? `-${padding + 12}px` : 'auto',
          left: coords.left > anchorRect.left ? `-${padding + 12}px` : 'auto',
        }}
      />

      {/* Header thuốc (Cố định đỉnh) */}
      <div className="shrink-0 flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {item.category || 'Thuốc kê đơn'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Đơn vị: {item.unit || 'viên'}
            </span>
          </div>
          <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1 leading-snug">
            {item.name}
          </h4>
          {item.activeIngredient && (
            <p className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 mt-0.5 flex items-center gap-1 truncate">
              <Pill className="w-3 h-3 shrink-0" />
              <span>Hoạt chất: {item.activeIngredient}</span>
            </p>
          )}
        </div>

        <div className="w-7 h-7 rounded-md bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center shrink-0 text-emerald-700 dark:text-emerald-400">
          <BookOpen className="w-4 h-4" />
        </div>
      </div>

      {/* Phần nội dung có thể cuộn nếu màn hình máy tính nhỏ (tránh tràn mép) */}
      <div className="overflow-y-auto custom-scrollbar flex-1 pr-1 -mr-1 space-y-2.5">
        {/* Quy cách & Dạng bào chế */}
        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-2 rounded-md border border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-slate-500 dark:text-slate-400 text-[10.5px]">Hàm lượng:</span>
            <p className="font-bold text-slate-800 dark:text-slate-200">{item.strength || 'Theo nhãn'}</p>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 text-[10.5px]">Dạng bào chế:</span>
            <p className="font-bold text-slate-800 dark:text-slate-200">{item.form || 'Viên'}</p>
          </div>
        </div>

        {/* Liều dùng gợi ý 4 cữ trong ngày */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Liều dùng khuyến nghị ({item.defaultDurationDays || 7} ngày):</span>
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-[10.5px]">
              {formatMealTiming(item.defaultDosage?.timing, item.defaultDosage?.customTimingNote)}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
            <div className="p-1 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
              <span className="text-[10px] block font-bold text-amber-900 dark:text-amber-300">Sáng</span>
              <strong className="text-xs font-black text-amber-950 dark:text-amber-200 font-mono">
                {morning} {item.unit}
              </strong>
            </div>
            <div className="p-1 rounded bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60">
              <span className="text-[10px] block font-bold text-orange-900 dark:text-orange-300">Trưa</span>
              <strong className="text-xs font-black text-orange-950 dark:text-orange-200 font-mono">
                {noon} {item.unit}
              </strong>
            </div>
            <div className="p-1 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60">
              <span className="text-[10px] block font-bold text-indigo-900 dark:text-indigo-300">Chiều</span>
              <strong className="text-xs font-black text-indigo-950 dark:text-indigo-200 font-mono">
                {afternoon} {item.unit}
              </strong>
            </div>
            <div className="p-1 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60">
              <span className="text-[10px] block font-bold text-blue-900 dark:text-blue-300">Tối</span>
              <strong className="text-xs font-black text-blue-950 dark:text-blue-200 font-mono">
                {evening} {item.unit}
              </strong>
            </div>
          </div>
        </div>

        {/* Hướng dẫn sử dụng chi tiết (không bị truncate) */}
        {item.defaultInstructions && (
          <div className="text-[11px] bg-emerald-50/60 dark:bg-emerald-950/30 p-2 rounded-md border border-emerald-200/70 dark:border-emerald-800/60">
            <span className="font-bold text-emerald-900 dark:text-emerald-300 block mb-0.5">
              Chỉ định &amp; Cách dùng:
            </span>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {item.defaultInstructions}
            </p>
          </div>
        )}

        {/* Cảnh báo & Lưu ý an toàn */}
        {item.warningNote && (
          <div className="text-[11px] bg-amber-50/70 dark:bg-amber-950/30 p-2 rounded-md border border-amber-200/80 dark:border-amber-800/60">
            <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1 mb-0.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Lưu ý &amp; Chống chỉ định:</span>
            </span>
            <p className="text-amber-950 dark:text-amber-200 leading-relaxed whitespace-pre-line">
              {item.warningNote}
            </p>
          </div>
        )}
      </div>

      {/* Thanh chức năng nhanh: Cố định ở đáy, không bao giờ bị che khuất */}
      <div className="shrink-0 pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Tác vụ nhanh:</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Nút 1: Tìm kiếm trên Google */}
          <div className="relative group/btn flex items-center">
            <a
              href={getGoogleSearchUrl(item.name, item.activeIngredient)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-8.5 h-8.5 rounded-md bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center transition-all border border-indigo-200/80 dark:border-indigo-800/80 hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
              aria-label="Tra cứu dược thư trên Google"
            >
              <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </a>
            {/* Draw HTML Tooltip nhỏ */}
            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900/95 dark:bg-slate-950 text-white text-[10px] font-medium rounded-md shadow-xl whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-all duration-150 z-50 border border-slate-700">
              Tra cứu Google
              <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95 dark:border-t-slate-950" />
            </span>
          </div>

          {/* Nút 2: Sao chép thông tin */}
          <div className="relative group/btn flex items-center">
            <button
              type="button"
              onClick={handleCopy}
              className="w-8.5 h-8.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all border border-slate-200 dark:border-slate-700 hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
              aria-label="Sao chép tên và hoạt chất"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              )}
            </button>
            {/* Draw HTML Tooltip nhỏ */}
            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900/95 dark:bg-slate-950 text-white text-[10px] font-medium rounded-md shadow-xl whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-all duration-150 z-50 border border-slate-700">
              {copied ? 'Đã chép thông tin!' : 'Sao chép tên & hoạt chất'}
              <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95 dark:border-t-slate-950" />
            </span>
          </div>

          {/* Nút 3: Thêm vào đơn thuốc */}
          {onAddMedication && (
            <div className="relative group/btn flex items-center">
              <button
                type="button"
                onClick={handleAdd}
                className="w-8.5 h-8.5 rounded-md bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white flex items-center justify-center shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                aria-label="Thêm vào đơn thuốc ngay"
              >
                <Plus className="w-4.5 h-4.5" />
              </button>
              {/* Draw HTML Tooltip nhỏ */}
              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-emerald-950 text-emerald-100 text-[10px] font-bold rounded-md shadow-xl whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-all duration-150 z-50 border border-emerald-700/80">
                Thêm vào toa khám
                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-emerald-950" />
              </span>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
