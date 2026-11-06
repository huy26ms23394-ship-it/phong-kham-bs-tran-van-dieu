import React, { useState, useEffect } from 'react';
import { Prescription, ClinicSettings } from '../types/medical';
import {
  formatMealTiming,
  formatDosageSummary,
  formatPrescriptionQuantity,
} from '../utils/medicationSchedule';
import {
  Printer,
  X,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Save,
  Eye,
  ShieldCheck,
  Stethoscope,
  Sparkles,
} from 'lucide-react';

interface PrescriptionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: Prescription | null;
  clinicInfo: ClinicSettings;
  onSaveOnly?: () => void;
  onSaveAndPrint?: () => void;
  isDraft?: boolean;
}

export const PrescriptionReviewModal: React.FC<PrescriptionReviewModalProps> = ({
  isOpen,
  onClose,
  prescription,
  clinicInfo,
  onSaveOnly,
  onSaveAndPrint,
  isDraft = true,
}) => {
  const [activeTab, setActiveTab] = useState<'rx' | 'reminder' | 'both'>('rx');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (onSaveAndPrint) {
          onSaveAndPrint();
          onClose();
        }
      } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (onSaveOnly) {
          onSaveOnly();
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onSaveOnly, onSaveAndPrint, onClose]);

  if (!isOpen || !prescription) return null;

  const patientAge =
    new Date().getFullYear() - (Number(prescription.patientBirthYear) || 1970);

  // Calculate total daily pills per slot
  const morningCount = prescription.medications.reduce((sum, m) => sum + (m.dosage.morning || 0), 0);
  const noonCount = prescription.medications.reduce((sum, m) => sum + (m.dosage.noon || 0), 0);
  const afternoonCount = prescription.medications.reduce((sum, m) => sum + (m.dosage.afternoon || 0), 0);
  const eveningCount = prescription.medications.reduce((sum, m) => sum + (m.dosage.evening || 0), 0);

  const handleDirectPrint = () => {
    if (onSaveAndPrint) {
      onSaveAndPrint();
      onClose();
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 dark:bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-md max-w-5xl w-full shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden my-4 flex flex-col max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white px-5 py-3.5 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-emerald-800 dark:bg-emerald-700 flex items-center justify-center text-emerald-200 border border-emerald-600 shadow-xs">
              <Eye className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Xem Trước &amp; Review Toa Thuốc
                </h2>
                {isDraft && (
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/30 text-amber-300 border border-amber-400/40">
                    Bản Xem Trước (Chưa Lưu)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                BS. {clinicInfo.doctorName} • Bệnh nhân: <strong className="text-emerald-300">{prescription.patientName}</strong> • {prescription.medications.length} loại thuốc
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              type="button"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Đóng review"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Mode Tabs & Quick Stats */}
        <div className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('rx')}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-md text-xs font-bold transition-all border ${
                activeTab === 'rx'
                  ? 'bg-emerald-800 dark:bg-emerald-700 text-white border-emerald-900 dark:border-emerald-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200/80 dark:border-slate-700'
              }`}
            >
              Toa Thuốc Ngoại Trú (A4/A5)
            </button>
            <button
              onClick={() => setActiveTab('reminder')}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-md text-xs font-bold transition-all border ${
                activeTab === 'reminder'
                  ? 'bg-emerald-800 dark:bg-emerald-700 text-white border-emerald-900 dark:border-emerald-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200/80 dark:border-slate-700'
              }`}
            >
              Bảng Lịch Uống Dán Tủ Lạnh
            </button>
            <button
              onClick={() => setActiveTab('both')}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-md text-xs font-bold transition-all border ${
                activeTab === 'both'
                  ? 'bg-emerald-800 dark:bg-emerald-700 text-white border-emerald-900 dark:border-emerald-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200/80 dark:border-slate-700'
              }`}
            >
              Xem Cả Hai Bản In
            </button>
          </div>

          {/* Quick Dose Slots Indicator */}
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="text-slate-500 dark:text-slate-400">Tổng liều/ngày:</span>
            <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-mono">
              Sáng: {morningCount}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800 font-mono">
              Trưa: {noonCount}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-mono">
              Chiều: {afternoonCount}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono">
              Tối: {eveningCount}
            </span>
          </div>
        </div>

        {/* Scrollable Document Canvas */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 bg-slate-100/70 dark:bg-slate-950/80 space-y-6">
          {/* SHEET 1: ĐƠN THUỐC NGOẠI TRÚ */}
          {(activeTab === 'rx' || activeTab === 'both') && (
            <div
              className="bg-white p-6 sm:p-10 rounded-md shadow-md border border-slate-300 text-black max-w-4xl mx-auto space-y-6 font-times"
              style={{ fontFamily: '"Times New Roman", Times, "Liberation Serif", serif' }}
            >
              {/* Header phòng khám */}
              <div className="flex justify-between items-start border-b-2 border-black pb-4">
                <div>
                  <h3 className="font-black text-base sm:text-lg uppercase tracking-wide text-black">
                    {clinicInfo.clinicName}
                  </h3>
                  <p className="text-xs font-semibold text-slate-800">
                    {clinicInfo.doctorTitle} • {clinicInfo.doctorName}
                  </p>
                  <p className="text-xs text-slate-600">{clinicInfo.specialty}</p>
                  <p className="text-xs text-slate-600">Địa chỉ: {clinicInfo.address}</p>
                  <p className="text-xs text-slate-600">
                    Hotline: <strong>{clinicInfo.phone}</strong> | Giờ khám: {clinicInfo.consultingHours}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-block px-3 py-1 border border-black font-mono font-bold text-xs uppercase bg-slate-50">
                    Mã: {prescription.prescriptionCode}
                  </span>
                  <p className="text-xs text-slate-600 mt-1">GPHĐ: {clinicInfo.licenseNumber}</p>
                  <p className="text-xs text-slate-600">Ngày khám: {prescription.examinationDate}</p>
                </div>
              </div>

              {/* Title */}
              <div className="text-center py-1">
                <h1 className="text-2xl font-black uppercase tracking-wider text-black">
                  ĐƠN THUỐC NGOẠI TRÚ
                </h1>
                <p className="text-xs italic text-slate-600">
                  (Khám bệnh và kê đơn điều trị theo quy chế phòng khám)
                </p>
              </div>

              {/* Patient details */}
              <div className="bg-slate-50 p-4 rounded-md border border-slate-300 text-xs sm:text-sm grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4">
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-slate-600">Bệnh nhân: </span>
                  <strong className="text-black uppercase text-base block sm:inline">
                    {prescription.patientName}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-600">Năm sinh: </span>
                  <strong>{prescription.patientBirthYear}</strong> ({patientAge} tuổi)
                </div>
                <div>
                  <span className="text-slate-600">Giới tính: </span>
                  <strong>{prescription.patientGender === 'nam' ? 'Nam' : 'Nữ'}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-600">Địa chỉ: </span>
                  <span>{prescription.patientAddress || 'Theo hồ sơ phòng khám'}</span>
                </div>
                <div>
                  <span className="text-slate-600">Điện thoại: </span>
                  <strong>{prescription.patientPhone || 'Chưa cung cấp'}</strong>
                </div>

                {prescription.vitalSigns && (
                  <div className="col-span-2 sm:col-span-3 text-xs bg-white p-2 rounded-md border border-slate-200">
                    <span className="text-slate-600 font-semibold">Chỉ số sinh hiệu: </span>
                    {prescription.vitalSigns.bloodPressureSystolic && (
                      <span>
                        Huyết áp: <strong>{prescription.vitalSigns.bloodPressureSystolic}/{prescription.vitalSigns.bloodPressureDiastolic || 80} mmHg</strong>,{' '}
                      </span>
                    )}
                    {prescription.vitalSigns.heartRate && (
                      <span>Mạch: <strong>{prescription.vitalSigns.heartRate} bpm</strong>, </span>
                    )}
                    {prescription.vitalSigns.weightKg && (
                      <span>Cân nặng: <strong>{prescription.vitalSigns.weightKg} kg</strong></span>
                    )}
                  </div>
                )}

                <div className="col-span-2 sm:col-span-3">
                  <span className="text-slate-600">Chẩn đoán: </span>
                  <strong className="text-black font-bold">
                    {prescription.diagnosis} {prescription.icd10Code ? `(Mã ICD: ${prescription.icd10Code})` : ''}
                  </strong>
                </div>
              </div>

              {/* Medications Table */}
              <div>
                <table className="w-full text-left border-collapse border border-black text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-100 border-b border-black text-black">
                      <th className="p-2.5 border-r border-black w-10 text-center">STT</th>
                      <th className="p-2.5 border-r border-black">Tên biệt dược &amp; Hàm lượng</th>
                      <th className="p-2.5 border-r border-black w-24 text-center">Số lượng</th>
                      <th className="p-2.5">Cách dùng &amp; Liều lượng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescription.medications.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-500 italic bg-slate-50/60">
                          (Đơn thuốc đang soạn thảo - Chưa có thuốc nào được chọn vào toa)
                        </td>
                      </tr>
                    ) : (
                      prescription.medications.map((med, index) => (
                        <tr key={med.id} className="border-b border-black/80">
                          <td className="p-2.5 border-r border-black text-center font-bold">
                            {index + 1}
                          </td>
                          <td className="p-2.5 border-r border-black">
                            <div className="font-bold text-black">
                              {med.name}
                              {med.activeIngredient && !med.name.toLowerCase().includes(med.activeIngredient.toLowerCase())
                                ? ` (${med.activeIngredient})`
                                : ''}
                            </div>
                            {med.strength && (
                              <div className="text-xs text-slate-700">
                                Hàm lượng: {med.strength} • Dạng: {med.form || 'Viên'}
                              </div>
                            )}
                            {med.warningOrNote && (
                              <div className="text-[11px] text-emerald-800 italic mt-0.5">
                                * {med.warningOrNote}
                              </div>
                            )}
                          </td>
                          <td className="p-2.5 border-r border-black text-center font-bold font-mono">
                            {formatPrescriptionQuantity(med.totalQuantity)} {med.unit}
                          </td>
                          <td className="p-2.5">
                            <div className="font-semibold text-black">
                              {formatDosageSummary(med.dosage, med.unit)}
                            </div>
                            <div className="text-xs text-slate-700 mt-0.5">
                              Uống trong {med.durationDays} ngày. {med.instructions}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                    <tr className="bg-slate-50 border-t border-black">
                      <td colSpan={4} className="p-1.5 text-center font-bold text-xs italic text-slate-800">
                        --- Cộng khoản: {formatPrescriptionQuantity(prescription.medications.length)} thuốc ---
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Lời dặn & Tái khám & Chữ ký */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-300 text-xs sm:text-sm">
                <div className="space-y-3">
                  <div>
                    <strong className="block text-black mb-1">Lời dặn dò của Bác sĩ:</strong>
                    <p className="text-slate-800 whitespace-pre-line bg-slate-50 p-3 rounded-md border border-slate-200 leading-relaxed">
                      {prescription.doctorAdvice || 'Uống thuốc đúng giờ theo chỉ dẫn, ăn uống nghỉ ngơi điều độ.'}
                    </p>
                  </div>

                  {prescription.followUpDate && (
                    <div className="p-3 bg-amber-50 rounded-md border border-amber-300 text-amber-950 font-medium">
                      <strong>Hẹn tái khám: {prescription.followUpDate}</strong>
                      <p className="text-xs text-amber-900 mt-0.5">
                        Xin vui lòng mang theo đơn thuốc này khi đến khám lại.
                      </p>
                    </div>
                  )}
                </div>

                <div className="text-center flex flex-col justify-between items-center sm:items-end">
                  <div className="text-right">
                    <p className="italic text-xs text-slate-600">
                      TP. Hồ Chí Minh, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                    </p>
                    <p className="font-bold text-black uppercase mt-1">BÁC SĨ ĐIỀU TRỊ</p>
                  </div>

                  <div className="my-8 text-center sm:text-right pr-4">
                    <div className="inline-block px-4 py-2 border border-dashed border-emerald-700 text-emerald-800 rounded font-serif italic text-sm">
                      (Đã ký điện tử xác thực)
                    </div>
                  </div>

                  <div className="text-center sm:text-right">
                    <strong className="text-base text-black block">{clinicInfo.doctorName}</strong>
                    <p className="text-xs text-slate-600 font-mono">CCHN: {clinicInfo.licenseNumber}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SHEET 2: BẢNG NHẮC LỊCH UỐNG THUỐC DÁN TỦ LẠNH */}
          {(activeTab === 'reminder' || activeTab === 'both') && (
            <div
              className="bg-white p-6 sm:p-10 rounded-md shadow-md border-2 border-emerald-800 text-black max-w-4xl mx-auto space-y-6 font-times"
              style={{ fontFamily: '"Times New Roman", Times, "Liberation Serif", serif' }}
            >
              <div className="flex justify-between items-start border-b-2 border-emerald-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-emerald-800 text-white flex items-center justify-center font-bold">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg uppercase text-emerald-950">
                      BẢNG NHẮC LỊCH UỐNG THUỐC HÀNG NGÀY
                    </h3>
                    <p className="text-xs text-slate-600">
                      Dành cho bệnh nhân: <strong className="text-black uppercase">{prescription.patientName}</strong> • {clinicInfo.clinicName}
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded text-xs">
                  BẢN IN DÁN TỦ LẠNH
                </span>
              </div>

              {/* 4 Slots Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Morning */}
                <div className="p-4 rounded-md border-2 border-amber-400 bg-amber-50/50 space-y-2">
                  <div className="font-black text-sm text-amber-900 border-b border-amber-300 pb-1 flex items-center justify-between">
                    <span>SÁNG (07:00)</span>
                    <span className="text-xs font-mono bg-amber-200 px-1.5 py-0.5 rounded">
                      {morningCount} viên
                    </span>
                  </div>
                  <div className="space-y-2 pt-1">
                    {prescription.medications.filter((m) => m.dosage.morning > 0).length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Không có thuốc cữ sáng</p>
                    ) : (
                      prescription.medications
                        .filter((m) => m.dosage.morning > 0)
                        .map((m) => (
                          <div key={m.id} className="text-xs bg-white p-2 rounded-md border border-amber-200 shadow-2xs">
                            <div className="font-bold text-slate-900">{m.name}</div>
                            <div className="font-extrabold text-amber-800">
                              Uống: {m.dosage.morning} {m.unit}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              ({formatMealTiming(m.dosage.timing)})
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Noon */}
                <div className="p-4 rounded-md border-2 border-orange-400 bg-orange-50/50 space-y-2">
                  <div className="font-black text-sm text-orange-900 border-b border-orange-300 pb-1 flex items-center justify-between">
                    <span>TRƯA (11:30)</span>
                    <span className="text-xs font-mono bg-orange-200 px-1.5 py-0.5 rounded">
                      {noonCount} viên
                    </span>
                  </div>
                  <div className="space-y-2 pt-1">
                    {prescription.medications.filter((m) => m.dosage.noon > 0).length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Không có thuốc cữ trưa</p>
                    ) : (
                      prescription.medications
                        .filter((m) => m.dosage.noon > 0)
                        .map((m) => (
                          <div key={m.id} className="text-xs bg-white p-2 rounded-md border border-orange-200 shadow-2xs">
                            <div className="font-bold text-slate-900">{m.name}</div>
                            <div className="font-extrabold text-orange-800">
                              Uống: {m.dosage.noon} {m.unit}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              ({formatMealTiming(m.dosage.timing)})
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Afternoon */}
                <div className="p-4 rounded-md border-2 border-indigo-400 bg-indigo-50/50 space-y-2">
                  <div className="font-black text-sm text-indigo-900 border-b border-indigo-300 pb-1 flex items-center justify-between">
                    <span>CHIỀU (17:00)</span>
                    <span className="text-xs font-mono bg-indigo-200 px-1.5 py-0.5 rounded">
                      {afternoonCount} viên
                    </span>
                  </div>
                  <div className="space-y-2 pt-1">
                    {prescription.medications.filter((m) => m.dosage.afternoon > 0).length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Không có thuốc cữ chiều</p>
                    ) : (
                      prescription.medications
                        .filter((m) => m.dosage.afternoon > 0)
                        .map((m) => (
                          <div key={m.id} className="text-xs bg-white p-2 rounded-md border border-indigo-200 shadow-2xs">
                            <div className="font-bold text-slate-900">{m.name}</div>
                            <div className="font-extrabold text-indigo-800">
                              Uống: {m.dosage.afternoon} {m.unit}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              ({formatMealTiming(m.dosage.timing)})
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Evening */}
                <div className="p-4 rounded-md border-2 border-blue-400 bg-blue-50/50 space-y-2">
                  <div className="font-black text-sm text-blue-900 border-b border-blue-300 pb-1 flex items-center justify-between">
                    <span>TỐI (20:30)</span>
                    <span className="text-xs font-mono bg-blue-200 px-1.5 py-0.5 rounded">
                      {eveningCount} viên
                    </span>
                  </div>
                  <div className="space-y-2 pt-1">
                    {prescription.medications.filter((m) => m.dosage.evening > 0).length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Không có thuốc cữ tối</p>
                    ) : (
                      prescription.medications
                        .filter((m) => m.dosage.evening > 0)
                        .map((m) => (
                          <div key={m.id} className="text-xs bg-white p-2 rounded-md border border-blue-200 shadow-2xs">
                            <div className="font-bold text-slate-900">{m.name}</div>
                            <div className="font-extrabold text-blue-800">
                              Uống: {m.dosage.evening} {m.unit}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              ({formatMealTiming(m.dosage.timing)})
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>

              {/* Lời khuyên an toàn */}
              <div className="p-3 bg-emerald-50 rounded-md border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
                <span>
                  <strong>Lưu ý:</strong> Uống thuốc cùng nước lọc ấm, không tự ý ngưng hoặc đổi liều khi chưa có ý kiến của Bác Sĩ Trần Văn Diệu.
                </span>
                <span className="font-bold font-mono">Hotline: {clinicInfo.phone}</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 p-4 px-5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-xs font-bold flex items-center gap-2 transition-all border border-slate-200/80 dark:border-slate-700 active:scale-98 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Đóng &amp; Sửa Thêm</span>
            <kbd className="hidden sm:inline px-1.5 py-0.2 text-[9px] font-mono bg-slate-200 dark:bg-slate-700 rounded font-bold">Esc</kbd>
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleDirectPrint}
              className="min-h-[44px] px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 font-bold rounded-md text-xs flex items-center gap-1.5 transition-all active:scale-98 cursor-pointer"
              title="Mở hộp thoại in trình duyệt ngay"
            >
              <Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span>In Bản Này</span>
            </button>

            {onSaveOnly && (
              <button
                type="button"
                onClick={() => {
                  onSaveOnly();
                  onClose();
                }}
                className="min-h-[44px] px-5 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-md text-xs flex items-center gap-2 shadow-xs transition-all border border-slate-700 active:scale-98 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Đơn Thuốc</span>
                <kbd className="hidden sm:inline px-1.5 py-0.2 text-[9px] font-mono bg-slate-700 text-slate-200 rounded font-bold">Ctrl+S</kbd>
              </button>
            )}

            {onSaveAndPrint && (
              <button
                type="button"
                onClick={() => {
                  onSaveAndPrint();
                  onClose();
                }}
                className="min-h-[44px] px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold rounded-md text-xs flex items-center gap-2 shadow-xs transition-all border border-emerald-700/60 active:scale-98 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Lưu &amp; In Toa Ngay Cho Bệnh Nhân</span>
                <kbd className="hidden sm:inline px-1.5 py-0.2 text-[9px] font-mono bg-emerald-950/60 text-emerald-200 rounded font-bold border border-emerald-600/50">Ctrl+↵</kbd>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
