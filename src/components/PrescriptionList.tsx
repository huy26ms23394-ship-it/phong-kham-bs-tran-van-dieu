import React, { useState } from 'react';
import { Prescription, ClinicSettings } from '../types/medical';
import { formatDosageSummary } from '../utils/medicationSchedule';
import {
  FileText,
  Printer,
  Trash2,
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
  Plus,
  Eye,
  RotateCcw,
  FlaskConical,
} from 'lucide-react';
import { PrescriptionReviewModal } from './PrescriptionReviewModal';

interface PrescriptionListProps {
  prescriptions: Prescription[];
  clinicInfo: ClinicSettings;
  onPrintPrescription: (rx: Prescription) => void;
  onRepeatPrescription?: (rx: Prescription) => void;
  onDeletePrescription: (rxId: string) => void;
  onGoToConsultation: () => void;
}

// Sổ lưu đơn thuốc phòng khám
// Quản lý và tra cứu đơn thuốc điện tử
// Phiên bản chuẩn cho bác sĩ phòng khám
export const PrescriptionList: React.FC<PrescriptionListProps> = ({
  prescriptions,
  clinicInfo,
  onPrintPrescription,
  onRepeatPrescription,
  onDeletePrescription,
  onGoToConsultation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(
    prescriptions[0]?.id || null
  );
  const [reviewRx, setReviewRx] = useState<Prescription | null>(null);

  const filtered = prescriptions.filter(
    (rx) =>
      rx.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rx.prescriptionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rx.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-md border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-md uppercase font-mono border border-emerald-200 dark:border-emerald-700">
              Kho Lưu Trữ Đơn Thuốc
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              ({prescriptions.length} toa đã kê)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            Hồ Sơ Toa Thuốc Của Bác Sĩ Trần Văn Diệu
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Xem lại lịch sử kê đơn, in lại toa thuốc kèm lịch nhắc uống thuốc cho bệnh nhân.
          </p>
        </div>

        <button
          onClick={onGoToConsultation}
          className="min-h-[44px] px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold rounded-md shadow-xs flex items-center justify-center gap-2 text-xs transition-all border border-emerald-700/60 shrink-0 active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Kê Toa Khám Bệnh Mới</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-md border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3 transition-colors">
        <Search className="w-5 h-5 text-slate-400 ml-2 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm theo tên bệnh nhân, mã toa (TOA-...), hoặc chẩn đoán bệnh..."
          className="w-full px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100 bg-transparent focus:outline-hidden"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shrink-0"
          >
            Xóa
          </button>
        )}
      </div>

      {/* Prescription List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-md border border-dashed border-slate-200 dark:border-slate-800">
          <FileText className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Chưa có toa thuốc nào phù hợp</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-5">
            Bấm nút &quot;Kê Toa Khám Bệnh Mới&quot; để tiến hành khám và in toa cho bệnh nhân.
          </p>
          <button
            onClick={onGoToConsultation}
            className="min-h-[44px] px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold rounded-md text-xs border border-emerald-700/60 shadow-xs active:scale-98"
          >
            Kê Toa Mới
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((rx) => {
            const isExpanded = expandedId === rx.id;
            return (
              <div
                key={rx.id}
                className="bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 shadow-xs hover:shadow-sm transition-all overflow-hidden"
              >
                {/* Collapsed Header */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : rx.id)}
                  className="p-4 sm:p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-emerald-50/40 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="p-2.5 bg-emerald-800 dark:bg-emerald-700 text-white rounded-md shadow-2xs shrink-0 border border-emerald-700/60 dark:border-emerald-600/60">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 rounded-md border border-emerald-200 dark:border-emerald-700">
                          {rx.prescriptionCode}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          Ngày khám: {rx.examinationDate}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700 font-mono">
                          {rx.medications.length} loại thuốc
                        </span>
                        {(rx.labOrder || rx.labResultsSummary) && (
                          <span
                            className="text-xs font-semibold px-2 py-0.5 bg-blue-50 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 rounded-md border border-blue-200 dark:border-blue-800 font-mono flex items-center gap-1"
                            title={rx.labResultsSummary || `Có ghi nhận cận lâm sàng (${rx.labOrder?.selectedTestIds?.length || 0} mục)`}
                          >
                            <FlaskConical className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            <span>Có XN {rx.labOrder?.selectedTestIds?.length ? `(${rx.labOrder.selectedTestIds.length} mục)` : ''}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-black text-slate-900 dark:text-slate-100 text-base">
                          {rx.patientName}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          ({new Date().getFullYear() - Number(rx.patientBirthYear)} tuổi • {rx.patientGender === 'nam' ? 'Nam' : 'Nữ'})
                        </span>
                      </div>

                      <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 mt-0.5">
                        Chẩn đoán: {rx.diagnosis} {rx.icd10Code ? `(${rx.icd10Code})` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                    {onRepeatPrescription && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRepeatPrescription(rx);
                        }}
                        className="min-h-[42px] px-3.5 py-2 bg-white hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-emerald-800 dark:text-emerald-300 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all border border-emerald-300 dark:border-emerald-700 active:scale-98 cursor-pointer"
                        title="Nạp toàn bộ thuốc và chẩn đoán của toa này sang màn hình Khám Bệnh để kê lại hoặc chỉnh sửa"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Kê Lại / Sửa</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPrintPrescription(rx);
                      }}
                      className="min-h-[42px] px-4 py-2 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-md text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all border border-emerald-700/60 active:scale-98 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      In Toa &amp; Lịch Uống
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Xác nhận xóa toa thuốc ${rx.prescriptionCode}?`)) {
                          onDeletePrescription(rx.id);
                        }
                      }}
                      className="p-2 text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors border border-transparent hover:border-emerald-200 dark:hover:border-rose-800"
                      aria-label="Xóa toa thuốc"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="p-1 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-100 dark:border-slate-800 space-y-4 bg-white dark:bg-slate-900 transition-colors">
                    {/* Vitals */}
                    {rx.vitalSigns && (
                      <div className="p-3.5 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-md border border-emerald-100 dark:border-emerald-900/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block">Huyết áp khám:</span>
                          <span className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                            {rx.vitalSigns.bloodPressureSystolic || 120}/{rx.vitalSigns.bloodPressureDiastolic || 80} mmHg
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block">Mạch tim:</span>
                          <span className="text-sm font-bold text-rose-700 dark:text-rose-400">
                            {rx.vitalSigns.heartRate || 75} bpm
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block">Thân nhiệt:</span>
                          <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                            {rx.vitalSigns.temperature || 36.8} °C
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block">Cân nặng:</span>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            {rx.vitalSigns.weightKg || '--'} kg
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Medications Breakdown */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                        Danh Sách Thuốc Đã Kê:
                      </h4>
                      <div className="space-y-2">
                        {rx.medications.map((med, index) => (
                          <div
                            key={med.id}
                            className="p-3.5 rounded-md border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md bg-emerald-800 dark:bg-emerald-700 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                                  {index + 1}
                                </span>
                                <strong className="text-sm text-slate-900 dark:text-slate-100">{med.name}</strong>
                                {med.strength && (
                                  <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-md text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                                    {med.strength}
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-600 dark:text-slate-400 font-medium pl-7 mt-0.5">
                                {formatDosageSummary(med.dosage, med.unit)}
                              </p>
                              {med.warningOrNote && (
                                <p className="text-emerald-800 dark:text-emerald-300 italic pl-7 text-[11px]">
                                  * {med.warningOrNote}
                                </p>
                              )}
                            </div>

                            <div className="pl-7 sm:pl-0 shrink-0">
                              <span className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-bold text-slate-900 dark:text-slate-100">
                                Cấp: {med.totalQuantity} {med.unit} ({med.durationDays} ngày)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Advice & Follow-Up */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <strong className="block text-slate-800 dark:text-slate-200 mb-1">
                          Lời dặn của Bác Sĩ Diệu:
                        </strong>
                        <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line bg-slate-50/60 dark:bg-slate-800/60 p-3 rounded-md border border-slate-200/80 dark:border-slate-800 leading-relaxed">
                          {rx.doctorAdvice}
                        </p>
                      </div>

                      <div className="space-y-2">
                        {rx.followUpDate && (
                          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-md border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                            <strong className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              <span>Hẹn tái khám: {rx.followUpDate}</span>
                            </strong>
                            <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                              Dặn bệnh nhân mang theo toa thuốc này khi đến khám lại.
                            </p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {onRepeatPrescription && (
                            <button
                              type="button"
                              onClick={() => onRepeatPrescription(rx)}
                              className="flex-1 min-h-[42px] py-2 px-3 bg-white hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-emerald-800 dark:text-emerald-300 font-bold rounded-md flex items-center justify-center gap-1.5 shadow-2xs transition-all border border-emerald-300 dark:border-emerald-700 active:scale-98 text-xs cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Kê Lại Toa Này</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setReviewRx(rx)}
                            className="flex-1 min-h-[42px] py-2 px-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 font-bold rounded-md flex items-center justify-center gap-1.5 shadow-2xs transition-all border border-emerald-600/50 dark:border-emerald-500/50 active:scale-98 text-xs cursor-pointer"
                          >
                            <Eye className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                            <span>Xem Trước</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onPrintPrescription(rx)}
                            className="flex-1 min-h-[42px] py-2 px-3 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold rounded-md flex items-center justify-center gap-1.5 shadow-xs transition-all border border-emerald-700/60 active:scale-98 text-xs cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                            <span>In Toa Này</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal for Saved Prescriptions */}
      <PrescriptionReviewModal
        isOpen={Boolean(reviewRx)}
        onClose={() => setReviewRx(null)}
        prescription={reviewRx}
        clinicInfo={clinicInfo}
        onSaveAndPrint={() => {
          if (reviewRx) onPrintPrescription(reviewRx);
        }}
        isDraft={false}
      />
    </div>
  );
};