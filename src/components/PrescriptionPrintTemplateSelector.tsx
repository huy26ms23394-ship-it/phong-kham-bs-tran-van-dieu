import React, { useState } from 'react';
import {
  PrescriptionTemplateType,
  PrintCalibrationSettings,
  PRINT_TEMPLATE_META,
  DEFAULT_PRINT_CALIBRATION,
} from '../utils/prescriptionTemplateFormats';
import {
  Printer,
  Sliders,
  RotateCcw,
  Sparkles,
  FileText,
  Check,
  ChevronDown,
  ChevronUp,
  Move,
  ZoomIn,
  Layers,
  Calendar,
  Layers3,
} from 'lucide-react';

interface PrescriptionPrintTemplateSelectorProps {
  currentTemplateId: PrescriptionTemplateType;
  onSelectTemplate: (templateId: PrescriptionTemplateType) => void;
  calibration: PrintCalibrationSettings;
  onUpdateCalibration: (newCalibration: PrintCalibrationSettings) => void;
  onPrintNow: () => void;
  onLoadSampleAndPrint: () => void;
  isSampleActive?: boolean;
}

export const PrescriptionPrintTemplateSelector: React.FC<PrescriptionPrintTemplateSelectorProps> = ({
  currentTemplateId,
  onSelectTemplate,
  calibration,
  onUpdateCalibration,
  onPrintNow,
  onLoadSampleAndPrint,
  isSampleActive = false,
}) => {
  const [showCalibrationDrawer, setShowCalibrationDrawer] = useState(false);

  const handleResetCalibration = () => {
    onUpdateCalibration({
      ...DEFAULT_PRINT_CALIBRATION,
      templateId: currentTemplateId,
    });
  };

  const currentMeta = PRINT_TEMPLATE_META.find((m) => m.id === currentTemplateId) || PRINT_TEMPLATE_META[0];

  return (
    <div className="no-print bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs p-4 sm:p-5 space-y-4">
      {/* Top Row: Template Selection Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              ĐA MẪU IN TOA THUỐC (4 TEMPLATES)
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Khổ in: <strong className="text-slate-800 dark:text-slate-200">{calibration.paperSize}</strong>
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <span>{currentMeta.title}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {currentMeta.subtitle}
          </p>
        </div>

        {/* Action Buttons: Test Print & Print Now */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Nút In Thử Mẫu A5 */}
          <button
            type="button"
            onClick={onLoadSampleAndPrint}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border shadow-2xs cursor-pointer ${
              isSampleActive
                ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-700 ring-2 ring-amber-400'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 dark:text-amber-200 dark:border-amber-800'
            }`}
            title="Nạp dữ liệu đơn thuốc mẫu thực tế của BS. Diệu để kiểm thử bố cục in trên máy in A5"
          >
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{isSampleActive ? '✓ Đang Xem Toa Thử' : '🖨️ In Thử Mẫu A5'}</span>
          </button>

          {/* Nút Hiệu Chuẩn Lề/Tọa Độ */}
          <button
            type="button"
            onClick={() => setShowCalibrationDrawer(!showCalibrationDrawer)}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
              showCalibrationDrawer
                ? 'bg-emerald-700 text-white border-emerald-800'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-700'
            }`}
            title="Mở thanh công cụ căn chỉnh lề (Offset mm) và tỷ lệ chữ (Scale %)"
          >
            <Sliders className="w-4 h-4" />
            <span>Căn Chỉnh In</span>
            {showCalibrationDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Nút In Toa Chính */}
          <button
            type="button"
            onClick={onPrintNow}
            className="min-h-[38px] px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            title="Gửi lệnh in ra máy in ngay lập tức (Phím tắt: Ctrl + Enter hoặc F9)"
          >
            <Printer className="w-4 h-4" />
            <span>In Toa Ngay (F9)</span>
          </button>
        </div>
      </div>

      {/* 4 Template Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {PRINT_TEMPLATE_META.map((meta) => {
          const isSelected = currentTemplateId === meta.id;
          return (
            <button
              key={meta.id}
              type="button"
              onClick={() => onSelectTemplate(meta.id)}
              className={`text-left p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-600 dark:border-emerald-500 ring-2 ring-emerald-500/30'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                      isSelected
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {meta.badge}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {meta.shortTitle}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-tight">
                  {meta.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Calibration Drawer (Ẩn/Hiện khi bấm nút Căn Chỉnh In) */}
      {showCalibrationDrawer && (
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-emerald-600" />
              <span>Hiệu Chuẩn Tọa Độ Máy In (Print Calibration)</span>
            </span>
            <button
              type="button"
              onClick={handleResetCalibration}
              className="text-[11px] font-bold text-slate-500 hover:text-rose-600 dark:text-slate-400 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Đặt lại mặc định</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* Tỷ lệ phóng đại (Scale %) */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                Cỡ chữ / Tỷ lệ: {calibration.scalePercent}%
              </label>
              <div className="flex items-center gap-1">
                {[90, 95, 100, 105, 110].map((scale) => (
                  <button
                    key={scale}
                    type="button"
                    onClick={() => onUpdateCalibration({ ...calibration, scalePercent: scale })}
                    className={`flex-1 py-1 text-[11px] font-bold rounded border cursor-pointer ${
                      calibration.scalePercent === scale
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {scale}%
                  </button>
                ))}
              </div>
            </div>

            {/* Lệch dọc (Top Offset mm) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 dark:text-slate-400">
                <span>Dịch dọc (Top):</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400">
                  {calibration.offsetTopMm > 0 ? `+${calibration.offsetTopMm}` : calibration.offsetTopMm} mm
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onUpdateCalibration({ ...calibration, offsetTopMm: Math.max(-15, calibration.offsetTopMm - 1) })}
                  className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-bold cursor-pointer"
                >
                  -
                </button>
                <input
                  type="range"
                  min="-15"
                  max="15"
                  step="1"
                  value={calibration.offsetTopMm}
                  onChange={(e) => onUpdateCalibration({ ...calibration, offsetTopMm: Number(e.target.value) })}
                  className="flex-1 accent-emerald-600"
                />
                <button
                  type="button"
                  onClick={() => onUpdateCalibration({ ...calibration, offsetTopMm: Math.min(15, calibration.offsetTopMm + 1) })}
                  className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Lệch ngang (Left Offset mm) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 dark:text-slate-400">
                <span>Dịch ngang (Left):</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400">
                  {calibration.offsetLeftMm > 0 ? `+${calibration.offsetLeftMm}` : calibration.offsetLeftMm} mm
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onUpdateCalibration({ ...calibration, offsetLeftMm: Math.max(-15, calibration.offsetLeftMm - 1) })}
                  className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-bold cursor-pointer"
                >
                  -
                </button>
                <input
                  type="range"
                  min="-15"
                  max="15"
                  step="1"
                  value={calibration.offsetLeftMm}
                  onChange={(e) => onUpdateCalibration({ ...calibration, offsetLeftMm: Number(e.target.value) })}
                  className="flex-1 accent-emerald-600"
                />
                <button
                  type="button"
                  onClick={() => onUpdateCalibration({ ...calibration, offsetLeftMm: Math.min(15, calibration.offsetLeftMm + 1) })}
                  className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Khổ giấy & Tùy chọn dòng trống */}
            <div className="space-y-1.5 flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={calibration.autoCollapseEmptyLines}
                  onChange={(e) => onUpdateCalibration({ ...calibration, autoCollapseEmptyLines: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                />
                <span className="font-medium">Co gọn dòng trống nếu kê &gt; 6 thuốc</span>
              </label>

              <div className="inline-flex rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => onUpdateCalibration({ ...calibration, paperSize: 'A5' })}
                  className={`flex-1 py-0.5 rounded cursor-pointer ${
                    calibration.paperSize === 'A5' ? 'bg-emerald-700 text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Khổ A5 (Mặc định)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateCalibration({ ...calibration, paperSize: 'A4' })}
                  className={`flex-1 py-0.5 rounded cursor-pointer ${
                    calibration.paperSize === 'A4' ? 'bg-emerald-700 text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Khổ A4
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
