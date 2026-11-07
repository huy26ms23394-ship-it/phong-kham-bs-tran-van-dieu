import React, { useState, useEffect } from 'react';
import { Prescription, ClinicSettings, PrescriptionTemplateSettings } from '../types/medical';
import { DEFAULT_PRESCRIPTION_TEMPLATE } from '../data/initialData';
import { PrescriptionTemplateModal } from './PrescriptionTemplateModal';
import {
  PrescriptionTemplateType,
  PrintCalibrationSettings,
  loadSavedTemplateId,
  saveTemplateId,
  loadSavedCalibration,
  saveCalibration,
  SAMPLE_TEST_PRESCRIPTION,
} from '../utils/prescriptionTemplateFormats';
import { PrescriptionPrintTemplateSelector } from './PrescriptionPrintTemplateSelector';
import { TraditionalA5Template } from './templates/TraditionalA5Template';
import { ModernBytTemplate } from './templates/ModernBytTemplate';
import { ReminderIconsTemplate } from './templates/ReminderIconsTemplate';
import { Sliders, CheckCircle } from 'lucide-react';

interface PrintableClinicPrescriptionProps {
  prescription: Prescription;
  allPrescriptions?: Prescription[];
  onSelectPrescription?: (rx: Prescription) => void;
  clinicInfo: ClinicSettings;
  template?: PrescriptionTemplateSettings;
  onUpdateTemplate?: (newTemplate: PrescriptionTemplateSettings) => void;
  onClose?: () => void;
}

export const PrintableClinicPrescription: React.FC<PrintableClinicPrescriptionProps> = ({
  prescription,
  allPrescriptions = [],
  onSelectPrescription,
  clinicInfo,
  template: initialTemplate,
  onUpdateTemplate,
}) => {
  // 1. Quản lý Đa Mẫu Toa Thuốc (4 Templates) - Mặc định Mẫu 1 (BS. Diệu A5)
  const [templateId, setTemplateId] = useState<PrescriptionTemplateType>(() => loadSavedTemplateId());

  // 2. Quản lý Hiệu chuẩn Tọa độ & Cỡ chữ (Print Calibration)
  const [calibration, setCalibration] = useState<PrintCalibrationSettings>(() => loadSavedCalibration());

  // 3. Chế độ In Thử (Sample Test Data)
  const [isSampleActive, setIsSampleActive] = useState<boolean>(false);

  // 4. Modal cài đặt mẫu BYT nâng cao
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Cấu hình mẫu BYT truyền thống
  const [template, setTemplate] = useState<PrescriptionTemplateSettings>(() => {
    if (initialTemplate) return initialTemplate;
    try {
      const saved = localStorage.getItem('mediba_prescription_template');
      if (saved) {
        return { ...DEFAULT_PRESCRIPTION_TEMPLATE, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_PRESCRIPTION_TEMPLATE;
  });

  useEffect(() => {
    if (initialTemplate) {
      setTemplate(initialTemplate);
    }
  }, [initialTemplate]);

  // Lưu templateId khi thay đổi
  const handleSelectTemplate = (newId: PrescriptionTemplateType) => {
    setTemplateId(newId);
    saveTemplateId(newId);
    setCalibration((prev) => {
      const updated = { ...prev, templateId: newId };
      saveCalibration(updated);
      return updated;
    });
  };

  // Lưu calibration khi thay đổi
  const handleUpdateCalibration = (newCal: PrintCalibrationSettings) => {
    setCalibration(newCal);
    saveCalibration(newCal);
  };

  // Nạp đơn thuốc thử nghiệm và in ngay
  const handleLoadSampleAndPrint = () => {
    setIsSampleActive((prev) => !prev);
  };

  const handlePrintNow = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const activePrescription = isSampleActive ? SAMPLE_TEST_PRESCRIPTION : prescription;

  // Calibration CSS Transform
  const calibrationStyle: React.CSSProperties = {
    transform: `translate(${calibration.offsetLeftMm}mm, ${calibration.offsetTopMm}mm) scale(${calibration.scalePercent / 100})`,
    transformOrigin: 'top center',
    transition: 'transform 0.15s ease-out',
  };

  return (
    <div className="space-y-6">
      {/* Dynamic @page CSS injection cho máy in Chrome/Edge */}
      <style>{`
        @media print {
          @page {
            size: ${calibration.paperSize} portrait;
            margin: 0mm;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          #printable-prescription-area {
            display: block !important;
            visibility: visible !important;
            margin: 0 auto !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {/* Selector Đa Mẫu Toa Thuốc & Thanh Hiệu Chuẩn */}
      <PrescriptionPrintTemplateSelector
        currentTemplateId={templateId}
        onSelectTemplate={handleSelectTemplate}
        calibration={calibration}
        onUpdateCalibration={handleUpdateCalibration}
        onPrintNow={handlePrintNow}
        onLoadSampleAndPrint={handleLoadSampleAndPrint}
        isSampleActive={isSampleActive}
      />

      {/* Header phụ: Chọn đơn thuốc khác nếu có nhiều đơn trong ngày */}
      {allPrescriptions.length > 1 && onSelectPrescription && !isSampleActive && (
        <div className="no-print bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-600 dark:text-slate-400">
            Đang xem đơn thuốc của: <strong className="text-slate-900 dark:text-slate-100">{prescription.patientName}</strong> (Mã: {prescription.prescriptionCode})
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Đổi đơn thuốc khác:</span>
            <select
              value={prescription.id}
              onChange={(e) => {
                const found = allPrescriptions.find((r) => r.id === e.target.value);
                if (found) onSelectPrescription(found);
              }}
              aria-label="Chọn đơn thuốc cần in"
              className="h-8 px-2.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              {allPrescriptions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.prescriptionCode} • {r.patientName} ({r.examinationDate})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Toast thông báo chế độ xem đơn thuốc mẫu */}
      {isSampleActive && (
        <div className="no-print bg-amber-500/15 border border-amber-500/30 rounded-lg p-3 flex items-center justify-between text-amber-900 dark:text-amber-200 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-bold text-[10px]">
              DỮ LIỆU MẪU A5
            </span>
            <span>
              Đang nạp dữ liệu toa mẫu BS. Diệu: <strong>{SAMPLE_TEST_PRESCRIPTION.patientName}</strong> (4 thuốc mẫu: Amlor, Glucophage, Nexium, Tanakan) để thử nghiệm máy in.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsSampleActive(false)}
            className="font-bold underline hover:text-amber-950 cursor-pointer"
          >
            Quay lại đơn thực tế
          </button>
        </div>
      )}

      {/* =========================================================================
          PRINTABLE PRESCRIPTION AREA
          Vùng in chuẩn xác - Độc lập và không bị ảnh hưởng bởi UI nền
         ========================================================================= */}
      <div
        id="printable-prescription-area"
        className="printable-prescription-area mx-auto"
        style={calibrationStyle}
      >
        {/* MẪU 1: TOA TRUYỀN THỐNG BS. DIỆU (A5 CHUẨN THỰC TẾ) */}
        {templateId === 'template-dieu-a5-traditional' && (
          <TraditionalA5Template
            prescription={activePrescription}
            clinicInfo={clinicInfo}
            isOverlay={false}
            autoCollapseEmptyLines={calibration.autoCollapseEmptyLines}
          />
        )}

        {/* MẪU 4: CHẾ ĐỘ IN ĐÈ LÊN PHÔI GIẤY CÓ SẴN (PRE-PRINTED FORM OVERLAY) */}
        {templateId === 'template-dieu-overlay' && (
          <TraditionalA5Template
            prescription={activePrescription}
            clinicInfo={clinicInfo}
            isOverlay={true}
            autoCollapseEmptyLines={calibration.autoCollapseEmptyLines}
          />
        )}

        {/* MẪU 2: TOA CHUẨN BỘ Y TẾ HIỆN ĐẠI (A5/A4 KÈM VIETQR) */}
        {templateId === 'template-byt-modern' && (
          <ModernBytTemplate
            prescription={activePrescription}
            clinicInfo={clinicInfo}
            template={template}
            paperSize={calibration.paperSize}
          />
        )}

        {/* MẪU 3: TOA KÈM LỊCH NHẮC BIỂU TƯỢNG (SÁNG / TRƯA / CHIỀU / TỐI) */}
        {templateId === 'template-reminder-icons' && (
          <ReminderIconsTemplate
            prescription={activePrescription}
            clinicInfo={clinicInfo}
          />
        )}
      </div>

      {/* Edit Prescription Template Modal (Tùy chọn mở rộng cho BYT) */}
      <PrescriptionTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        template={template}
        onSaveTemplate={(newT) => {
          setTemplate(newT);
          try {
            localStorage.setItem('mediba_prescription_template', JSON.stringify(newT));
          } catch {}
          if (onUpdateTemplate) onUpdateTemplate(newT);
        }}
        doctorDefaultName={clinicInfo.doctorName}
      />
    </div>
  );
};
