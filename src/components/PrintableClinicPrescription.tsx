import React, { useState, useEffect } from 'react';
import { Prescription, ClinicSettings, PrescriptionTemplateSettings } from '../types/medical';
import {
  formatMealTiming,
  formatDosageSummary,
  formatPrescriptionQuantity,
} from '../utils/medicationSchedule';
import { DEFAULT_PRESCRIPTION_TEMPLATE } from '../data/initialData';
import { PrescriptionTemplateModal } from './PrescriptionTemplateModal';
import { generateVietQrUrl } from '../utils/vietQr';
import {
  Printer,
  Calendar,
  Phone,
  User,
  Heart,
  CheckCircle,
  Clock,
  Sparkles,
  Award,
  ShieldAlert,
  Sliders,
  Type,
  FileText,
  FlaskConical,
} from 'lucide-react';

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
  // Mặc định in Đơn thuốc A5 (1 trang duy nhất, loại bỏ background)
  const [printOption, setPrintOption] = useState<'both' | 'rx_only' | 'reminder_sheet'>('rx_only');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Template state with localStorage persistence - mặc định chuẩn A5
  const [template, setTemplate] = useState<PrescriptionTemplateSettings>(() => {
    if (initialTemplate) return initialTemplate;
    try {
      const saved = localStorage.getItem('mediba_prescription_template');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_PRESCRIPTION_TEMPLATE, ...parsed };
      }
    } catch {}
    return DEFAULT_PRESCRIPTION_TEMPLATE;
  });

  useEffect(() => {
    if (initialTemplate) {
      setTemplate(initialTemplate);
    }
  }, [initialTemplate]);

  const handleSaveTemplate = (newTemplate: PrescriptionTemplateSettings) => {
    setTemplate(newTemplate);
    try {
      localStorage.setItem('mediba_prescription_template', JSON.stringify(newTemplate));
    } catch {}
    if (onUpdateTemplate) {
      onUpdateTemplate(newTemplate);
    }
  };

  const handleTogglePaperSize = (size: 'A4' | 'A5') => {
    handleSaveTemplate({ ...template, paperSize: size });
  };

  const handlePrint = (option: 'both' | 'rx_only' | 'reminder_sheet') => {
    setPrintOption(option);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const patientAge =
    new Date().getFullYear() - (Number(prescription.patientBirthYear) || 1970);

  const paperSize = template.paperSize || 'A5';
  const isA5 = paperSize === 'A5';

  // Determine font family styling
  const fontStyle =
    template.fontFamily === 'times'
      ? { fontFamily: '"Times New Roman", Times, "Liberation Serif", serif' }
      : template.fontFamily === 'arial'
      ? { fontFamily: 'Arial, Helvetica, sans-serif' }
      : { fontFamily: 'inherit' };

  const lineSpacingClass = isA5
    ? 'leading-tight'
    : template.lineSpacing === 'compact'
    ? 'leading-tight'
    : template.lineSpacing === 'relaxed'
    ? 'leading-relaxed'
    : 'leading-normal';

  // Determine font size
  const fontSizeClass = isA5
    ? `text-[8pt] ${lineSpacingClass}`
    : template.fontSize === '12pt'
    ? `text-[12pt] ${lineSpacingClass}`
    : template.fontSize === '10pt'
    ? `text-[10pt] ${lineSpacingClass}`
    : `text-[11pt] ${lineSpacingClass}`;

  const sheetWidthClass = isA5
    ? 'prescription-a5-sheet max-w-[150mm] p-3 sm:p-4.5'
    : 'max-w-4xl p-8 sm:p-12';

  const hasAllergy =
    prescription.patientAllergies &&
    prescription.patientAllergies.length > 0 &&
    !prescription.patientAllergies[0]?.toLowerCase().includes('không có');

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          @page {
            size: ${paperSize} portrait;
            margin: 0mm;
          }
          body {
            margin: 0 !important;
            padding: ${isA5 ? '4mm 5mm' : '8mm 10mm'} !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      {/* Control Bar (Hidden when printing) */}
      <div className="no-print bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-md shadow-2xs border border-slate-200/80 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-bold uppercase font-mono border border-emerald-200 dark:border-emerald-800">
              {clinicInfo.clinicName}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-bold">
              Mã: {prescription.prescriptionCode}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-serif font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Type className="w-3 h-3 text-emerald-600" aria-hidden="true" />
              <span>Font: {template.fontFamily === 'times' ? 'Times New Roman (Chuẩn BYT)' : template.fontFamily.toUpperCase()}</span>
            </span>

            {/* Paper Size A4 / A5 Toggle */}
            <div className="inline-flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => handleTogglePaperSize('A5')}
                className={`px-2.5 py-0.5 rounded transition-colors cursor-pointer ${
                  paperSize === 'A5'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
                title="Khổ A5 nhỏ gọn chuẩn thông tư Bộ Y Tế, in trọn 1 trang duy nhất"
              >
                Khổ A5 (Khuyên Dùng)
              </button>
              <button
                type="button"
                onClick={() => handleTogglePaperSize('A4')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  paperSize === 'A4'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Khổ A4
              </button>
            </div>

            {/* Toggle Payment QR on Prescription */}
            <button
              type="button"
              onClick={() => handleSaveTemplate({ ...template, showPaymentQr: !template.showPaymentQr })}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border transition-colors cursor-pointer ${
                template.showPaymentQr
                  ? 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-200'
              }`}
              title="Bật/Tắt in kèm mã VietQR chuyển khoản ngân hàng trên đơn thuốc"
            >
              {template.showPaymentQr ? '✓ Có Mã VietQR' : '+ In VietQR'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Printer className="w-4.5 h-4.5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
              <span>{template.prescriptionTitle} (Khổ {paperSize})</span>
            </h2>

            {allPrescriptions.length > 1 && onSelectPrescription && (
              <select
                value={prescription.id}
                onChange={(e) => {
                  const found = allPrescriptions.find((r) => r.id === e.target.value);
                  if (found) onSelectPrescription(found);
                }}
                aria-label="Chọn đơn thuốc cần in"
                className="h-8 px-2.5 rounded-md border border-emerald-300 dark:border-emerald-700 bg-emerald-50/60 dark:bg-slate-800 text-xs font-bold text-emerald-950 dark:text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {allPrescriptions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.prescriptionCode} • {r.patientName} ({r.examinationDate})
                  </option>
                ))}
              </select>
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kê đơn bởi: <strong>{clinicInfo.doctorName}</strong> • Bệnh nhân: <strong>{prescription.patientName}</strong> ({prescription.medications.length} khoản thuốc)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Edit Template Button */}
          <button
            type="button"
            onClick={() => setIsTemplateModalOpen(true)}
            className="h-9 px-3 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-emerald-800 dark:text-emerald-300 font-bold rounded-md text-xs flex items-center gap-1.5 transition-colors border border-emerald-300 dark:border-emerald-700 shadow-2xs cursor-pointer"
            title="Tùy chỉnh tiêu đề, thông tin hành chính, font chữ Times New Roman và các trường trên mẫu toa"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>Mẫu Toa</span>
          </button>

          {/* Nút in chính: 1 trang duy nhất A5 */}
          <button
            type="button"
            onClick={() => handlePrint('rx_only')}
            className="h-9 px-4 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold rounded-md text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="In đơn thuốc A5 vừa khít 1 tờ giấy duy nhất, không dính nền website"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            <span>In Đơn Thuốc A5 (1 Trang)</span>
          </button>

          <button
            type="button"
            onClick={() => handlePrint('both')}
            className="h-9 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-md text-xs transition-colors border border-slate-200/80 dark:border-slate-700 cursor-pointer"
            title="In gồm 2 trang A5 riêng biệt: Trang 1 là Đơn thuốc, Trang 2 là Bảng nhắc lịch uống dán tủ lạnh"
          >
            In Kèm Bảng Lịch (2 Trang)
          </button>

          <button
            type="button"
            onClick={() => handlePrint('reminder_sheet')}
            className="h-9 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-md text-xs transition-colors shadow-2xs cursor-pointer"
            title="Chỉ in bảng phân liều to rõ dán tủ lạnh cho người cao tuổi"
          >
            Chỉ In Bảng Dán Tủ Lạnh
          </button>
        </div>
      </div>

      {/* Printable Pages Canvas (Times New Roman by default) */}
      <div className="space-y-8">
        {/* PAGE 1: MEDICAL PRESCRIPTION (ĐƠN THUỐC NGOẠI TRÚ) */}
        {(printOption === 'both' || printOption === 'rx_only') && (
          <div
            className={`print-sheet font-times bg-white rounded-md shadow-sm border border-slate-300 text-black mx-auto ${sheetWidthClass} ${fontSizeClass}`}
            style={fontStyle}
          >
            {/* Top Department & Clinic Header */}
            {template.showClinicHeader && (
              <div className={`flex justify-between items-start border-b-2 border-black ${isA5 ? 'pb-1.5 mb-1.5' : 'pb-4 mb-4'}`}>
                <div className="max-w-[65%]">
                  {template.departmentName && (
                    <div className={`${isA5 ? 'text-[7pt]' : 'text-[10pt]'} uppercase font-bold text-slate-700 mb-0.5`}>
                      {template.departmentName}
                    </div>
                  )}
                  <h3 className={`font-bold uppercase tracking-wide text-black ${isA5 ? 'text-[9.5pt]' : 'text-sm sm:text-base'}`}>
                    {clinicInfo.clinicName}
                  </h3>
                  <p className={`${isA5 ? 'text-[7.5pt]' : 'text-[10pt]'} font-semibold text-slate-900`}>
                    {clinicInfo.doctorTitle} • {clinicInfo.doctorName}
                  </p>
                  <p className={`${isA5 ? 'text-[7.5pt]' : 'text-[10pt]'} text-slate-700`}>{clinicInfo.specialty}</p>
                  <p className={`${isA5 ? 'text-[7pt]' : 'text-[9.5pt]'} text-slate-700`}>
                    Địa chỉ: {clinicInfo.address}
                  </p>
                  <p className={`${isA5 ? 'text-[7pt]' : 'text-[9.5pt]'} text-slate-700`}>
                    Hotline: <strong>{clinicInfo.phone}</strong> | Giờ khám: {clinicInfo.consultingHours}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className={`inline-block border border-black font-mono font-bold uppercase ${isA5 ? 'px-1.5 py-0.5 text-[7.5pt]' : 'px-2.5 py-0.5 text-[10pt]'}`}>
                    Mã đơn: {prescription.prescriptionCode}
                  </span>
                  <p className={`${isA5 ? 'text-[7pt] mt-0.5' : 'text-[9.5pt] mt-1'} text-slate-700 font-mono`}>
                    GPHĐ: {clinicInfo.licenseNumber}
                  </p>
                  <p className={`${isA5 ? 'text-[7pt]' : 'text-[9.5pt]'} text-slate-700 font-mono`}>
                    CCHN: {clinicInfo.practicingCertificate || '04512/HCM-CCHN'}
                  </p>
                  <p className={`${isA5 ? 'text-[7pt]' : 'text-[9.5pt]'} text-slate-700`}>
                    Ngày khám: {prescription.examinationDate}
                  </p>
                </div>
              </div>
            )}

            {/* Title */}
            <div className={`text-center ${isA5 ? 'my-1' : 'my-4'}`}>
              <h1 className={`font-bold uppercase tracking-wider text-black ${isA5 ? 'text-[12pt]' : 'text-xl sm:text-2xl'}`}>
                {template.prescriptionTitle}
              </h1>
              {template.prescriptionSubtitle && (
                <p className={`italic text-slate-700 ${isA5 ? 'text-[7pt] mt-0' : 'text-[10pt] mt-0.5'}`}>
                  {template.prescriptionSubtitle}
                </p>
              )}
            </div>

            {/* Patient Info Box */}
            <div className={`bg-slate-50/80 rounded border border-slate-400 grid grid-cols-2 sm:grid-cols-3 gap-x-3 ${isA5 ? 'p-1.5 mb-1.5 text-[7.5pt] gap-y-0.5' : 'p-3.5 mb-4 text-[10.5pt] gap-y-1.5'}`}>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-slate-700">Họ và tên bệnh nhân: </span>
                <strong className={`text-black uppercase ${isA5 ? 'text-[8.5pt]' : 'text-[11.5pt]'} block sm:inline`}>
                  {prescription.patientName}
                </strong>
              </div>

              {template.showPatientAge && (
                <div>
                  <span className="text-slate-700">Năm sinh: </span>
                  <strong>{prescription.patientBirthYear}</strong> ({patientAge} tuổi)
                </div>
              )}

              <div>
                <span className="text-slate-700">Giới tính: </span>
                <strong>{prescription.patientGender === 'nam' ? 'Nam' : prescription.patientGender === 'nu' ? 'Nữ' : 'Khác'}</strong>
              </div>

              {template.showPatientAddress && (
                <div className="col-span-2">
                  <span className="text-slate-700">Địa chỉ: </span>
                  <span>{prescription.patientAddress || 'Theo hồ sơ bệnh nhân'}</span>
                </div>
              )}

              {template.showPatientPhone && (
                <div>
                  <span className="text-slate-700">Điện thoại: </span>
                  <strong>{prescription.patientPhone || 'Chưa cung cấp'}</strong>
                </div>
              )}

              {prescription.patientHealthInsuranceNumber && (
                <div>
                  <span className="text-slate-700">Số thẻ BHYT: </span>
                  <strong className="font-mono">{prescription.patientHealthInsuranceNumber}</strong>
                </div>
              )}

              {prescription.guardianName && (
                <div className="col-span-2">
                  <span className="text-slate-700">Người nhà / Giám hộ: </span>
                  <strong>{prescription.guardianName}</strong>
                </div>
              )}

              {/* Allergy Box on Prescription */}
              <div className="col-span-2 sm:col-span-3">
                <span className="text-slate-700">Tiền sử dị ứng thuốc: </span>
                <strong className={hasAllergy ? 'text-rose-800 underline' : 'text-slate-800'}>
                  {hasAllergy && prescription.patientAllergies
                    ? prescription.patientAllergies.join(', ')
                    : 'Không ghi nhận tiền sử dị ứng thuốc'}
                </strong>
              </div>

              {/* Vitals if recorded and enabled */}
              {template.showVitalSigns && prescription.vitalSigns && (
                <div className={`col-span-2 sm:col-span-3 bg-white rounded border border-slate-300 ${isA5 ? 'p-1 text-[7pt]' : 'p-2 text-[10pt]'}`}>
                  <span className="text-slate-700 font-semibold">Chỉ số sinh hiệu: </span>
                  {prescription.vitalSigns.bloodPressureSystolic && (
                    <span>
                      Huyết áp: <strong>{prescription.vitalSigns.bloodPressureSystolic}/{prescription.vitalSigns.bloodPressureDiastolic || 80} mmHg</strong>,{' '}
                    </span>
                  )}
                  {prescription.vitalSigns.heartRate && (
                    <span>Mạch: <strong>{prescription.vitalSigns.heartRate} lần/phút</strong>, </span>
                  )}
                  {prescription.vitalSigns.temperature && (
                    <span>Nhiệt độ: <strong>{prescription.vitalSigns.temperature} °C</strong>, </span>
                  )}
                  {prescription.vitalSigns.weightKg && (
                    <span>Cân nặng: <strong>{prescription.vitalSigns.weightKg} kg</strong></span>
                  )}
                </div>
              )}

              <div className="col-span-2 sm:col-span-3 pt-0.5">
                <span className="text-slate-700">Chẩn đoán: </span>
                <strong className={`text-black font-bold ${isA5 ? 'text-[8pt]' : 'text-[11pt]'}`}>
                  {prescription.diagnosis}{' '}
                  {template.showDiagnosisIcd10 && prescription.icd10Code ? `(Mã ICD-10: ${prescription.icd10Code})` : ''}
                </strong>
              </div>
            </div>

            {/* Prescribed Medications Table */}
            <div className={isA5 ? 'mb-1.5' : 'mb-4'}>
              <table className={`w-full text-left border-collapse border border-black ${isA5 ? 'text-[7.5pt]' : 'text-[10.5pt]'}`}>
                <thead>
                  <tr className="bg-slate-100 border-b border-black text-black">
                    <th className={`border-r border-black text-center ${isA5 ? 'p-1 w-7' : 'p-2 w-10'}`}>STT</th>
                    <th className={`border-r border-black ${isA5 ? 'p-1' : 'p-2'}`}>Tên thuốc (Hoạt chất) &amp; Hàm lượng</th>
                    <th className={`border-r border-black text-center ${isA5 ? 'p-1 w-16' : 'p-2 w-24'}`}>Số lượng</th>
                    <th className={`p-1 ${isA5 ? 'p-1' : 'p-2'}`}>Cách dùng &amp; Liều lượng</th>
                  </tr>
                </thead>
                <tbody>
                  {prescription.medications.map((med, index) => (
                    <tr key={med.id} className="border-b border-black/80">
                      <td className={`border-r border-black text-center font-bold ${isA5 ? 'p-1' : 'p-2'}`}>
                        {index + 1}
                      </td>
                      <td className={`border-r border-black ${isA5 ? 'p-1' : 'p-2'}`}>
                        <div className="font-bold text-black leading-tight">
                          {med.name}
                          {med.activeIngredient &&
                          !med.name.toLowerCase().includes(med.activeIngredient.toLowerCase())
                            ? ` (${med.activeIngredient})`
                            : ''}
                        </div>
                        {(med.strength || med.form) && (
                          <div className={`${isA5 ? 'text-[7pt]' : 'text-[10pt]'} text-slate-700`}>
                            {med.strength ? `Hàm lượng: ${med.strength}` : ''}
                            {med.strength && med.form ? ' • ' : ''}
                            {med.form ? `Dạng: ${med.form}` : ''}
                          </div>
                        )}
                        {template.showMedicationNotes && med.warningOrNote && (
                          <div className={`${isA5 ? 'text-[7pt]' : 'text-[9.5pt]'} text-emerald-900 italic mt-0.5`}>
                            * {med.warningOrNote}
                          </div>
                        )}
                      </td>
                      <td className={`border-r border-black text-center font-bold font-mono ${isA5 ? 'p-1' : 'p-2'}`}>
                        {formatPrescriptionQuantity(med.totalQuantity)} {med.unit}
                      </td>
                      <td className={isA5 ? 'p-1' : 'p-2'}>
                        <div className="font-semibold text-black leading-tight">
                          {formatDosageSummary(med.dosage, med.unit)}
                        </div>
                        <div className={`${isA5 ? 'text-[7pt]' : 'text-[10pt]'} text-slate-700 mt-0.5 leading-tight`}>
                          Uống trong {med.durationDays} ngày. {med.instructions}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {/* Mandatory closing row per Thông tư 52/2017/TT-BYT to prevent adding extra drugs */}
                  <tr className="bg-slate-50 border-t border-black">
                    <td colSpan={4} className={`text-center font-bold italic text-slate-900 ${isA5 ? 'p-0.5 text-[7pt]' : 'p-1.5 text-[10pt]'}`}>
                      --- Cộng khoản: {formatPrescriptionQuantity(prescription.medications.length)} thuốc ---
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* INTEGRATED DAILY MEDICATION SCHEDULE REMINDER ON PRESCRIPTION (Chỉ hiển thị trên khổ A4, ẩn trên A5 để vừa 1 trang) */}
            {template.showIntegratedSchedule && !isA5 && (
              <div className="border border-emerald-800 p-3 rounded mb-4 bg-emerald-50/30">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-900" aria-hidden="true" />
                  <h4 className="font-bold text-[10pt] uppercase tracking-wide text-emerald-950">
                    BẢNG PHÂN LIỀU UỐNG THUỐC TRONG NGÀY:
                  </h4>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10pt]">
                  {/* Morning */}
                  <div className="bg-white p-2 rounded border border-emerald-200">
                    <div className="font-bold text-amber-900 border-b pb-0.5 mb-1 flex items-center justify-between text-[9.5pt]">
                      <span>SÁNG (07:00)</span>
                    </div>
                    <div className="space-y-0.5">
                      {prescription.medications.filter((m) => m.dosage.morning > 0).length === 0 ? (
                        <span className="text-slate-400 italic text-[9pt]">Không có thuốc</span>
                      ) : (
                        prescription.medications
                          .filter((m) => m.dosage.morning > 0)
                          .map((m) => (
                            <div key={m.id} className="text-slate-900 text-[9.5pt]">
                              • {m.name}: <strong className="text-amber-950">{m.dosage.morning} {m.unit}</strong>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                  {/* Noon */}
                  <div className="bg-white p-2 rounded border border-emerald-200">
                    <div className="font-bold text-orange-900 border-b pb-0.5 mb-1 flex items-center justify-between text-[9.5pt]">
                      <span>TRƯA (11:30)</span>
                    </div>
                    <div className="space-y-0.5">
                      {prescription.medications.filter((m) => m.dosage.noon > 0).length === 0 ? (
                        <span className="text-slate-400 italic text-[9pt]">Không có thuốc</span>
                      ) : (
                        prescription.medications
                          .filter((m) => m.dosage.noon > 0)
                          .map((m) => (
                            <div key={m.id} className="text-slate-900 text-[9.5pt]">
                              • {m.name}: <strong className="text-orange-950">{m.dosage.noon} {m.unit}</strong>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                  {/* Afternoon */}
                  <div className="bg-white p-2 rounded border border-emerald-200">
                    <div className="font-bold text-indigo-900 border-b pb-0.5 mb-1 flex items-center justify-between text-[9.5pt]">
                      <span>CHIỀU (17:30)</span>
                    </div>
                    <div className="space-y-0.5">
                      {prescription.medications.filter((m) => m.dosage.afternoon > 0).length === 0 ? (
                        <span className="text-slate-400 italic text-[9pt]">Không có thuốc</span>
                      ) : (
                        prescription.medications
                          .filter((m) => m.dosage.afternoon > 0)
                          .map((m) => (
                            <div key={m.id} className="text-slate-900 text-[9.5pt]">
                              • {m.name}: <strong className="text-indigo-950">{m.dosage.afternoon} {m.unit}</strong>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                  {/* Evening */}
                  <div className="bg-white p-2 rounded border border-emerald-200">
                    <div className="font-bold text-blue-950 border-b pb-0.5 mb-1 flex items-center justify-between text-[9.5pt]">
                      <span>TỐI (20:30)</span>
                    </div>
                    <div className="space-y-0.5">
                      {prescription.medications.filter((m) => m.dosage.evening > 0).length === 0 ? (
                        <span className="text-slate-400 italic text-[9pt]">Không có thuốc</span>
                      ) : (
                        prescription.medications
                          .filter((m) => m.dosage.evening > 0)
                          .map((m) => (
                            <div key={m.id} className="text-slate-900 text-[9.5pt]">
                              • {m.name}: <strong className="text-blue-950">{m.dosage.evening} {m.unit}</strong>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Ghi chú Cận lâm sàng & Xét nghiệm */}
            {(prescription.labOrder || prescription.labResultsSummary) && (
              <div className={`border border-slate-300 rounded bg-slate-50/50 ${isA5 ? 'p-1.5 mb-1.5 text-[7pt]' : 'p-2 mb-2 text-[9.5pt]'}`}>
                {prescription.labOrder && (
                  <div className="font-semibold text-slate-800">
                    * Chỉ định Cận lâm sàng: {prescription.labOrder.referralCenter?.name || 'Xét nghiệm'} ({prescription.labOrder.selectedTestIds?.length || 0} mục{prescription.labOrder.doctorNotes ? ` - Lưu ý: ${prescription.labOrder.doctorNotes}` : ''})
                  </div>
                )}
                {prescription.labResultsSummary && (
                  <div className="text-slate-800 mt-0.5">
                    <strong>* Kết quả CLS / Xét nghiệm ghi nhận:</strong> {prescription.labResultsSummary}
                  </div>
                )}
              </div>
            )}

            {/* Doctor Advice & Follow-up */}
            <div className={`border border-slate-400 rounded bg-slate-50/50 ${isA5 ? 'p-1.5 mb-1.5 text-[7.5pt]' : 'p-3 mb-4 text-[10.5pt]'}`}>
              <h4 className={`font-bold uppercase text-slate-900 mb-0.5 ${isA5 ? 'text-[7.5pt]' : 'text-[10pt]'}`}>
                {template.doctorAdviceTitle || 'Lời dặn dò của Bác Sĩ:'}
              </h4>
              <p className={`whitespace-pre-line text-slate-900 ${isA5 ? 'leading-snug' : 'leading-relaxed'}`}>
                {prescription.doctorAdvice || template.defaultDoctorAdvice}
              </p>
              {template.showFollowUpDate && prescription.followUpDate && (
                <p className={`font-bold text-emerald-950 ${isA5 ? 'mt-0.5 text-[7.5pt]' : 'mt-1.5 text-[10.5pt]'}`}>
                  Ngày hẹn tái khám: {prescription.followUpDate} (Khám lại xin mang theo đơn này)
                </p>
              )}
              {template.footerNote && (
                <p className={`italic text-slate-700 border-t border-slate-300 ${isA5 ? 'text-[7pt] mt-0.5 pt-0.5' : 'text-[9.5pt] mt-1 pt-1'}`}>
                  * {template.footerNote}
                </p>
              )}
            </div>

            {/* Signatures */}
            <div className={`flex justify-between items-start border-t border-slate-300 ${isA5 ? 'pt-1 text-[7.5pt]' : 'pt-4 text-[10.5pt]'}`}>
              {template.showPatientSignature ? (
                <div className={`text-center ${isA5 ? 'w-36' : 'w-52'}`}>
                  <p className="font-medium text-slate-800">Bệnh nhân / Người nhà</p>
                  <p className={`${isA5 ? 'text-[6.5pt]' : 'text-[9.5pt]'} text-slate-600 italic`}>(Ký và ghi rõ họ tên)</p>
                  <div className={isA5 ? 'h-7' : 'h-16'} />
                  <p className="font-semibold text-slate-900">{prescription.patientName}</p>
                </div>
              ) : (
                <div />
              )}

              {/* Optional Bank QR Code on Prescription */}
              {template.showPaymentQr && (clinicInfo.bankQrImage || clinicInfo.bankAccountNo) && (
                <div className={`text-center flex flex-col items-center justify-center ${isA5 ? 'w-28' : 'w-36'}`}>
                  <img
                    src={clinicInfo.bankQrImage || generateVietQrUrl({
                      bankId: clinicInfo.bankId || 'VCB',
                      accountNo: clinicInfo.bankAccountNo || '',
                      accountName: clinicInfo.bankAccountName || clinicInfo.doctorName,
                      amount: 0,
                      content: prescription.prescriptionCode,
                      template: 'qr_only',
                    })}
                    alt="Mã QR Chuyển khoản"
                    className={`${isA5 ? 'max-h-16 w-auto' : 'max-h-24 w-auto'} object-contain`}
                  />
                  <span className={`font-mono text-slate-800 font-bold ${isA5 ? 'text-[5.5pt] leading-none mt-0.5' : 'text-[7.5pt]'}`}>
                    Quét QR chuyển khoản
                  </span>
                  {clinicInfo.bankAccountNo && (
                    <span className={`font-mono text-slate-600 ${isA5 ? 'text-[5pt] leading-none' : 'text-[7pt]'}`}>
                      {clinicInfo.bankId || 'VCB'}: {clinicInfo.bankAccountNo}
                    </span>
                  )}
                </div>
              )}

              <div className={`text-center ${isA5 ? 'w-44' : 'w-64'}`}>
                <p className={`text-slate-700 ${isA5 ? 'text-[7pt]' : 'text-[10pt]'}`}>
                  Ngày {prescription.examinationDate.split('-')[2]} tháng {prescription.examinationDate.split('-')[1]} năm {prescription.examinationDate.split('-')[0]}
                </p>
                <p className={`font-bold text-slate-900 uppercase mt-0.5 ${isA5 ? 'text-[8pt]' : ''}`}>
                  {template.doctorSignatureTitle || 'BÁC SĨ KHÁM BỆNH'}
                </p>
                <p className={`${isA5 ? 'text-[7pt]' : 'text-[9.5pt]'} text-slate-600 italic`}>(Ký và ghi rõ họ tên)</p>
                <div className={`${isA5 ? 'h-8' : 'h-16'} flex items-center justify-center`}>
                  {template.showDigitalSignatureStamp && (
                    <span className={`font-serif italic text-emerald-900 font-bold opacity-80 ${isA5 ? 'text-base' : 'text-xl'}`}>
                      {template.doctorSignatureName || clinicInfo.doctorName}
                    </span>
                  )}
                </div>
                <p className={`font-bold text-slate-900 ${isA5 ? 'text-[8.5pt]' : 'text-[11pt]'}`}>
                  {template.doctorSignatureName || clinicInfo.doctorName}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 2: SEPARATE FRIDGE PILL CHART (BẢNG DÁN TỦ LẠNH / TREO TƯỜNG DÀNH CHO BỆNH NHÂN) */}
        {(printOption === 'both' || printOption === 'reminder_sheet') && (
          <div
            className={`print-sheet page-break font-times bg-white rounded-md shadow-sm border-2 border-emerald-800 text-black mx-auto ${
              isA5
                ? 'prescription-a5-sheet max-w-[150mm] p-3 sm:p-4 text-[7.5pt]'
                : 'max-w-4xl p-8 sm:p-12 text-[10.5pt]'
            }`}
            style={fontStyle}
          >
            <div className={`bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 text-white rounded border border-emerald-700 flex items-center justify-between ${isA5 ? 'p-2.5 mb-2' : 'p-5 mb-5'}`}>
              <div>
                <span className={`font-bold uppercase tracking-wider text-emerald-200 ${isA5 ? 'text-[7pt]' : 'text-xs'}`}>
                  {clinicInfo.clinicName} • BS. TRẦN VĂN DIỆU
                </span>
                <h2 className={`font-bold font-times ${isA5 ? 'text-xs sm:text-sm mt-0' : 'text-xl sm:text-2xl mt-0.5'}`}>
                  {template.fridgeChartTitle || 'BẢNG LỊCH UỐNG THUỐC HÀNG NGÀY CHO BỆNH NHÂN'}
                </h2>
                <p className={`text-emerald-100 ${isA5 ? 'text-[7pt]' : 'text-xs'}`}>
                  Bệnh nhân: <strong>{prescription.patientName.toUpperCase()}</strong> ({patientAge} tuổi) - Chẩn đoán: {prescription.diagnosis}
                </p>
              </div>
              <div className={`text-right bg-emerald-950/60 rounded border border-emerald-500 shrink-0 ${isA5 ? 'p-1.5 text-[6.5pt]' : 'p-2.5 text-xs'}`}>
                <p className="font-mono font-bold">Mã toa: {prescription.prescriptionCode}</p>
                <p className="text-emerald-200">Ngày kê: {prescription.examinationDate}</p>
              </div>
            </div>

            <div className={`overflow-x-auto ${isA5 ? 'mb-2' : 'mb-5'}`}>
              <table className={`w-full text-center border-collapse border-2 border-slate-800 ${isA5 ? 'text-[7.5pt]' : 'text-[10.5pt]'}`}>
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    <th className={`border border-slate-700 text-left ${isA5 ? 'p-1 w-36' : 'p-2.5 w-56'}`}>Tên Thuốc &amp; Hàm lượng</th>
                    <th className={`border border-slate-700 bg-amber-700 text-white ${isA5 ? 'p-1 w-16' : 'p-2.5 w-24'}`}>SÁNG<br />(07:00)</th>
                    <th className={`border border-slate-700 bg-orange-700 text-white ${isA5 ? 'p-1 w-16' : 'p-2.5 w-24'}`}>TRƯA<br />(11:30)</th>
                    <th className={`border border-slate-700 bg-indigo-700 text-white ${isA5 ? 'p-1 w-16' : 'p-2.5 w-24'}`}>CHIỀU<br />(17:30)</th>
                    <th className={`border border-slate-700 bg-blue-900 text-white ${isA5 ? 'p-1 w-16' : 'p-2.5 w-24'}`}>TỐI<br />(20:30)</th>
                    <th className={`border border-slate-700 text-left ${isA5 ? 'p-1' : 'p-2.5'}`}>Thời Điểm &amp; Lưu Ý</th>
                  </tr>
                </thead>
                <tbody>
                  {prescription.medications.map((med, idx) => (
                    <tr key={med.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className={`border border-slate-400 text-left font-bold text-slate-900 ${isA5 ? 'p-1' : 'p-2.5'}`}>
                        <div>{med.name}</div>
                        {med.strength && (
                          <span className={`${isA5 ? 'text-[6.5pt]' : 'text-[10pt]'} font-normal text-slate-700`}>{med.strength}</span>
                        )}
                      </td>
                      <td className={`border border-slate-400 font-bold bg-amber-50/50 ${isA5 ? 'p-1 text-[7.5pt]' : 'p-2.5 text-base'}`}>
                        {med.dosage.morning > 0 ? (
                          <span className={`inline-block bg-amber-200 text-amber-950 rounded border border-amber-300 font-bold ${isA5 ? 'px-1 py-0.2' : 'px-2.5 py-0.5'}`}>
                            {med.dosage.morning} {med.unit}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className={`border border-slate-400 font-bold bg-orange-50/50 ${isA5 ? 'p-1 text-[7.5pt]' : 'p-2.5 text-base'}`}>
                        {med.dosage.noon > 0 ? (
                          <span className={`inline-block bg-orange-200 text-orange-950 rounded border border-orange-300 font-bold ${isA5 ? 'px-1 py-0.2' : 'px-2.5 py-0.5'}`}>
                            {med.dosage.noon} {med.unit}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className={`border border-slate-400 font-bold bg-indigo-50/50 ${isA5 ? 'p-1 text-[7.5pt]' : 'p-2.5 text-base'}`}>
                        {med.dosage.afternoon > 0 ? (
                          <span className={`inline-block bg-indigo-200 text-indigo-950 rounded border border-indigo-300 font-bold ${isA5 ? 'px-1 py-0.2' : 'px-2.5 py-0.5'}`}>
                            {med.dosage.afternoon} {med.unit}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className={`border border-slate-400 font-bold bg-blue-50/50 ${isA5 ? 'p-1 text-[7.5pt]' : 'p-2.5 text-base'}`}>
                        {med.dosage.evening > 0 ? (
                          <span className={`inline-block bg-blue-200 text-blue-950 rounded border border-blue-300 font-bold ${isA5 ? 'px-1 py-0.2' : 'px-2.5 py-0.5'}`}>
                            {med.dosage.evening} {med.unit}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className={`border border-slate-400 text-left font-medium text-slate-800 ${isA5 ? 'p-1 text-[7pt]' : 'p-2.5 text-[10pt]'}`}>
                        <div className="text-emerald-950 font-bold">
                          {formatMealTiming(med.dosage.timing, med.dosage.customTimingNote)}
                        </div>
                        {med.warningOrNote && (
                          <div className={`${isA5 ? 'text-[6.5pt]' : 'text-[9.5pt]'} text-slate-700 mt-0.5`}>
                            Lưu ý: {med.warningOrNote}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Instruction box */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 rounded border border-slate-300 bg-slate-50 ${isA5 ? 'p-2 gap-2 text-[7pt]' : 'p-4 gap-4 text-[10.5pt]'}`}>
              {template.showFridgeSafetyRules && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-0.5 flex items-center gap-1">
                    <CheckCircle className={`text-emerald-600 ${isA5 ? 'w-3 h-3' : 'w-4 h-4'}`} aria-hidden="true" />
                    <span>Quy tắc uống thuốc an toàn:</span>
                  </h4>
                  <ul className={`list-disc list-inside space-y-0.5 text-slate-800 ${isA5 ? 'text-[6.5pt]' : 'text-[10pt]'}`}>
                    <li><strong>ĐÚNG GIỜ:</strong> Uống cố định theo khung giờ mỗi ngày.</li>
                    <li><strong>ĐÚNG LIỀU:</strong> Không tự ý bớt liều hoặc uống bù gấp đôi khi quên.</li>
                    <li><strong>ĐỦ NƯỚC:</strong> Uống với 1 cốc nước ấm đầy (khoảng 200ml).</li>
                  </ul>
                </div>
              )}

              {template.showFridgeEmergencyContact && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-0.5 flex items-center gap-1">
                    <Phone className={`text-rose-600 ${isA5 ? 'w-3 h-3' : 'w-4 h-4'}`} aria-hidden="true" />
                    <span>Liên hệ khi cần tư vấn y tế:</span>
                  </h4>
                  <div className={`space-y-0.5 text-slate-800 ${isA5 ? 'text-[6.5pt]' : 'text-[10pt]'}`}>
                    <p>
                      Bác sĩ điều trị: <strong>{clinicInfo.doctorName}</strong>
                    </p>
                    <p>
                      Hotline phòng khám: <strong>{clinicInfo.phone}</strong>
                    </p>
                    <p className={`text-rose-700 font-semibold mt-0.5 ${isA5 ? 'text-[6.5pt]' : 'text-[9.5pt]'}`}>
                      Nếu có phản ứng bất thường, hãy liên hệ phòng khám ngay lập tức!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Prescription Template Modal */}
      <PrescriptionTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        template={template}
        onSaveTemplate={handleSaveTemplate}
        doctorDefaultName={clinicInfo.doctorName}
      />
    </div>
  );
};
