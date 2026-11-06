import React, { useState, useEffect } from 'react';
import { PrescriptionTemplateSettings } from '../types/medical';
import { DEFAULT_PRESCRIPTION_TEMPLATE } from '../data/initialData';
import {
  FileText,
  X,
  Save,
  RotateCcw,
  Check,
  Type,
  Sliders,
  CheckSquare,
  Square,
  Calendar,
  Clock,
  Printer,
  Sparkles,
  Info,
} from 'lucide-react';

interface PrescriptionTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: PrescriptionTemplateSettings;
  onSaveTemplate: (newTemplate: PrescriptionTemplateSettings) => void;
  doctorDefaultName?: string;
}

export const PrescriptionTemplateModal: React.FC<PrescriptionTemplateModalProps> = ({
  isOpen,
  onClose,
  template,
  onSaveTemplate,
  doctorDefaultName = 'BS. Trần Văn Diệu',
}) => {
  const [formData, setFormData] = useState<PrescriptionTemplateSettings>({
    ...template,
    doctorSignatureName: template.doctorSignatureName || doctorDefaultName,
  });

  const [activeTab, setActiveTab] = useState<'header' | 'fields' | 'advice_signature' | 'font' | 'fridge'>('header');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      ...template,
      doctorSignatureName: template.doctorSignatureName || doctorDefaultName,
    });
  }, [isOpen, template, doctorDefaultName]);

  if (!isOpen) return null;

  const handleChange = <K extends keyof PrescriptionTemplateSettings>(
    field: K,
    value: PrescriptionTemplateSettings[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggle = (field: keyof PrescriptionTemplateSettings) => {
    setFormData((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveTemplate(formData);
    setSaveSuccessMessage(true);
    setTimeout(() => {
      setSaveSuccessMessage(false);
      onClose();
    }, 500);
  };

  const handleReset = () => {
    if (confirm('Khôi phục mẫu toa thuốc về chuẩn mặc định của Bộ Y Tế?')) {
      setFormData({
        ...DEFAULT_PRESCRIPTION_TEMPLATE,
        doctorSignatureName: doctorDefaultName,
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 rounded-md max-w-4xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="bg-emerald-800 dark:bg-emerald-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center text-white border border-white/20">
              <FileText className="w-4.5 h-4.5 text-emerald-200" aria-hidden="true" />
            </div>
            <div>
              <h2 id="template-modal-title" className="text-sm sm:text-base font-bold tracking-tight text-white uppercase">
                Chỉnh Sửa Mẫu Toa Thuốc &amp; Bảng In Khám Bệnh
              </h2>
              <p className="text-[11px] text-emerald-200 font-medium">
                Tùy chỉnh tiêu đề, thông tin hành chính, trường hiển thị &amp; kiểu chữ Times New Roman
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ chỉnh sửa mẫu"
            className="w-8 h-8 rounded-md text-white/80 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" aria-hidden="true" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 px-4 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('header')}
            className={`h-8 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'header'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Tiêu Đề &amp; Tiêu Ngữ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fields')}
            className={`h-8 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'fields'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Trường Dữ Liệu Trên Toa</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('advice_signature')}
            className={`h-8 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'advice_signature'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Lời Dặn, Chân Trang &amp; Chữ Ký</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('font')}
            className={`h-8 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'font'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700'
            }`}
          >
            <Type className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Font Times New Roman &amp; Cỡ Chữ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fridge')}
            className={`h-8 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'fridge'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Mẫu Lịch Dán Tủ Lạnh</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
          {/* TAB 1: TIÊU ĐỀ & TIÊU NGỮ */}
          {activeTab === 'header' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-md border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
                <Info className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Phần tiêu đề xuất hiện ở đầu trang in đơn thuốc theo đúng chuẩn mẫu văn bản y tế hành chính của Bộ Y Tế.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Cơ quan quản lý cấp trên (Dòng tiêu ngữ góc trái):
                </label>
                <input
                  type="text"
                  value={formData.departmentName}
                  onChange={(e) => handleChange('departmentName', e.target.value)}
                  placeholder="VD: SỞ Y TẾ TP. HỒ CHÍ MINH"
                  className="w-full h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Tiêu đề chính của đơn thuốc:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.prescriptionTitle}
                    onChange={(e) => handleChange('prescriptionTitle', e.target.value)}
                    placeholder="VD: ĐƠN THUỐC NGOẠI TRÚ"
                    className="w-full h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Phụ đề dưới tiêu đề chính:
                  </label>
                  <input
                    type="text"
                    value={formData.prescriptionSubtitle}
                    onChange={(e) => handleChange('prescriptionSubtitle', e.target.value)}
                    placeholder="VD: (Kê đơn điều trị theo quy định của Bộ Y Tế)"
                    className="w-full h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.showClinicHeader}
                    onChange={() => handleToggle('showClinicHeader')}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Hiển thị thông tin phòng khám (Tên cơ sở, Bác sĩ, Chuyên khoa, Địa chỉ, Hotline, CCHN) ở góc trên bên trái
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: TRƯỜNG DỮ LIỆU TRÊN TOA */}
          {activeTab === 'fields' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                Bác sĩ có thể bật/tắt các trường dữ liệu tùy theo nhu cầu khám chữa bệnh ngoại trú hoặc mẫu phòng khám riêng:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => handleToggle('showPatientAge')}
                  className="p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 flex items-center justify-between cursor-pointer hover:border-emerald-500 transition-colors"
                >
                  <div>
                    <strong className="block text-slate-900 dark:text-slate-100">Năm sinh &amp; Tuổi bệnh nhân</strong>
                    <span className="text-[11px] text-slate-500">Hiển thị năm sinh kèm số tuổi</span>
                  </div>
                  {formData.showPatientAge ? (
                    <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />
                  )}
                </div>

                <div
                  onClick={() => handleToggle('showPatientAddress')}
                  className="p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 flex items-center justify-between cursor-pointer hover:border-emerald-500 transition-colors"
                >
                  <div>
                    <strong className="block text-slate-900 dark:text-slate-100">Địa chỉ bệnh nhân</strong>
                    <span className="text-[11px] text-slate-500">In địa chỉ cư trú của bệnh nhân</span>
                  </div>
                  {formData.showPatientAddress ? (
                    <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />
                  )}
                </div>

                <div
                  onClick={() => handleToggle('showPatientPhone')}
                  className="p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 flex items-center justify-between cursor-pointer hover:border-emerald-500 transition-colors"
                >
                  <div>
                    <strong className="block text-slate-900 dark:text-slate-100">Số điện thoại liên hệ</strong>
                    <span className="text-[11px] text-slate-500">In SĐT bệnh nhân hoặc người nhà</span>
                  </div>
                  {formData.showPatientPhone ? (
                    <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />
                  )}
                </div>

                <div
                  onClick={() => handleToggle('showVitalSigns')}
                  className="p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 flex items-center justify-between cursor-pointer hover:border-emerald-500 transition-colors"
                >
                  <div>
                    <strong className="block text-slate-900 dark:text-slate-100">Chỉ số sinh hiệu</strong>
                    <span className="text-[11px] text-slate-500">Huyết áp, Nhịp tim, Cân nặng, Nhiệt độ</span>
                  </div>
                  {formData.showVitalSigns ? (
                    <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />
                  )}
                </div>

                <div
                  onClick={() => handleToggle('showDiagnosisIcd10')}
                  className="p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 flex items-center justify-between cursor-pointer hover:border-emerald-500 transition-colors"
                >
                  <div>
                    <strong className="block text-slate-900 dark:text-slate-100">Mã bệnh ICD-10</strong>
                    <span className="text-[11px] text-slate-500">In mã ICD-10 cạnh chẩn đoán bệnh</span>
                  </div>
                  {formData.showDiagnosisIcd10 ? (
                    <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />
                  )}
                </div>

                <div
                  onClick={() => handleToggle('showMedicationNotes')}
                  className="p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 flex items-center justify-between cursor-pointer hover:border-emerald-500 transition-colors"
                >
                  <div>
                    <strong className="block text-slate-900 dark:text-slate-100">Lưu ý chuyên môn từng thuốc</strong>
                    <span className="text-[11px] text-slate-500">In cảnh báo/lưu ý đặc biệt dưới tên thuốc</span>
                  </div>
                  {formData.showMedicationNotes ? (
                    <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />
                  )}
                </div>

                <div
                  onClick={() => handleToggle('showIntegratedSchedule')}
                  className="p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 flex items-center justify-between cursor-pointer hover:border-emerald-500 transition-colors sm:col-span-2"
                >
                  <div>
                    <strong className="block text-slate-900 dark:text-slate-100">
                      Bảng lịch nhắc uống thuốc tích hợp (Sáng - Trưa - Chiều - Tối)
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      In khung phân chia giờ uống thuốc định kỳ ngay phía dưới danh sách thuốc
                    </span>
                  </div>
                  {formData.showIntegratedSchedule ? (
                    <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LỜI DẶN, CHÂN TRANG & CHỮ KÝ */}
          {activeTab === 'advice_signature' && (
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Tiêu đề mục lời dặn bác sĩ:
                </label>
                <input
                  type="text"
                  value={formData.doctorAdviceTitle}
                  onChange={(e) => handleChange('doctorAdviceTitle', e.target.value)}
                  placeholder="VD: Lời dặn dò của Bác sĩ điều trị:"
                  className="w-full h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Lời dặn mẫu mặc định khi tạo toa mới:
                </label>
                <textarea
                  rows={3}
                  value={formData.defaultDoctorAdvice}
                  onChange={(e) => handleChange('defaultDoctorAdvice', e.target.value)}
                  className="w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Ghi chú pháp lý / Dặn dò chân trang:
                </label>
                <textarea
                  rows={2}
                  value={formData.footerNote}
                  onChange={(e) => handleChange('footerNote', e.target.value)}
                  placeholder="Khám lại xin mang theo đơn này. Đơn thuốc có giá trị mua trong vòng 05 ngày..."
                  className="w-full p-2.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Chức danh ký tên bác sĩ:
                  </label>
                  <input
                    type="text"
                    value={formData.doctorSignatureTitle}
                    onChange={(e) => handleChange('doctorSignatureTitle', e.target.value)}
                    placeholder="VD: BÁC SĨ KHÁM BỆNH"
                    className="w-full h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 uppercase font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Họ và tên bác sĩ ký đơn:
                  </label>
                  <input
                    type="text"
                    value={formData.doctorSignatureName}
                    onChange={(e) => handleChange('doctorSignatureName', e.target.value)}
                    placeholder="VD: BS. Trần Văn Diệu"
                    className="w-full h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.showPatientSignature}
                    onChange={() => handleToggle('showPatientSignature')}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    In ô ký tên của Bệnh nhân / Người nhà
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.showDigitalSignatureStamp}
                    onChange={() => handleToggle('showDigitalSignatureStamp')}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    In chữ ký nháy điện tử của Bác Sĩ
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: FONT CHỮ TIMES NEW ROMAN & CỠ CHỮ */}
          {activeTab === 'font' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-md border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200">
                <div className="font-bold flex items-center gap-2 mb-1">
                  <Type className="w-4 h-4 text-amber-700" aria-hidden="true" />
                  <span>Quy định chuẩn văn bản y tế Việt Nam:</span>
                </div>
                <p className="leading-relaxed">
                  Theo Nghị định 30/2020/NĐ-CP và Thông tư Bộ Y Tế, các đơn thuốc và hồ sơ bệnh án in ấn bắt buộc sử dụng font chữ <strong>Times New Roman</strong>, cỡ chữ 11pt hoặc 12pt để đảm bảo tính pháp lý và độ sắc nét khi lưu trữ lâu năm.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => handleChange('fontFamily', 'times')}
                  className={`p-3.5 rounded-md border-2 cursor-pointer transition-all ${
                    formData.fontFamily === 'times'
                      ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs uppercase text-slate-900 dark:text-slate-100">
                      Times New Roman
                    </span>
                    {formData.fontFamily === 'times' && (
                      <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                    )}
                  </div>
                  <p className="font-serif text-sm text-slate-800 dark:text-slate-200">
                    Đơn thuốc mẫu chuẩn y khoa Bộ Y Tế (Khuyên dùng)
                  </p>
                </div>

                <div
                  onClick={() => handleChange('fontFamily', 'arial')}
                  className={`p-3.5 rounded-md border-2 cursor-pointer transition-all ${
                    formData.fontFamily === 'arial'
                      ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs uppercase text-slate-900 dark:text-slate-100">
                      Arial
                    </span>
                    {formData.fontFamily === 'arial' && (
                      <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                    )}
                  </div>
                  <p className="font-sans text-sm text-slate-800 dark:text-slate-200">
                    Nét thẳng, hiện đại, rõ ràng
                  </p>
                </div>

                <div
                  onClick={() => handleChange('fontFamily', 'roboto')}
                  className={`p-3.5 rounded-md border-2 cursor-pointer transition-all ${
                    formData.fontFamily === 'roboto'
                      ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs uppercase text-slate-900 dark:text-slate-100">
                      Roboto / Noto Sans
                    </span>
                    {formData.fontFamily === 'roboto' && (
                      <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                    )}
                  </div>
                  <p className="text-sm text-slate-800 dark:text-slate-200">
                    Giao diện điện tử đa nền tảng
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Cỡ chữ in chuẩn:
                  </label>
                  <select
                    value={formData.fontSize}
                    onChange={(e) => handleChange('fontSize', e.target.value as any)}
                    className="w-full h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="11pt">11pt (Chuẩn Bộ Y Tế &amp; Nghị định 30 - Vừa vặn 1 trang A4/A5)</option>
                    <option value="12pt">12pt (Chữ to hơn, dễ đọc cho bệnh nhân cao tuổi)</option>
                    <option value="10pt">10pt (Cỡ chữ tinh gọn cho toa kê nhiều hơn 7 loại thuốc)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Khoảng cách dòng (Line spacing):
                  </label>
                  <select
                    value={formData.lineSpacing}
                    onChange={(e) => handleChange('lineSpacing', e.target.value as any)}
                    className="w-full h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="normal">Tiêu chuẩn (1.35x - Đẹp mắt, thoáng)</option>
                    <option value="compact">Gọn gàng (1.2x - Tiết kiệm chiều dọc)</option>
                    <option value="relaxed">Thoáng đãng (1.5x)</option>
                  </select>
                </div>
              </div>

              {/* Sample preview box */}
              <div className="mt-4 p-4 rounded-md border border-slate-300 bg-white text-black font-times">
                <span className="text-[10px] text-slate-400 block mb-1">BẢN XEM TRƯỚC VĂN BẢN (FONT TIMES NEW ROMAN):</span>
                <p className="text-base font-bold uppercase tracking-wide">
                  {formData.prescriptionTitle}
                </p>
                <p className="text-xs italic text-slate-600">
                  {formData.prescriptionSubtitle}
                </p>
                <p className="text-sm mt-2">
                  1. Amlor 5mg: Uống 1 viên vào lúc 07:00 sáng sau ăn. (Hàm lượng: 5mg • Số lượng: 30 viên)
                </p>
                <p className="text-xs text-slate-600 mt-2 italic">
                  {formData.footerNote}
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: MẪU LỊCH DÁN TỦ LẠNH */}
          {activeTab === 'fridge' && (
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Tiêu đề bảng dán tủ lạnh (Trang 2):
                </label>
                <input
                  type="text"
                  value={formData.fridgeChartTitle}
                  onChange={(e) => handleChange('fridgeChartTitle', e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Phụ đề bảng dán tủ lạnh:
                </label>
                <input
                  type="text"
                  value={formData.fridgeChartSubtitle}
                  onChange={(e) => handleChange('fridgeChartSubtitle', e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.showFridgeSafetyRules}
                    onChange={() => handleToggle('showFridgeSafetyRules')}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Hiển thị 3 quy tắc uống thuốc an toàn (Đúng giờ, Đúng liều, Đủ nước)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.showFridgeEmergencyContact}
                    onChange={() => handleToggle('showFridgeEmergencyContact')}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Hiển thị thông tin Hotline liên hệ khẩn cấp khi có phản ứng bất thường
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Action Bar Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="h-9 px-3.5 rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              <span>Khôi Phục Mẫu Mặc Định</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="h-9 px-5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" aria-hidden="true" />
                <span>{saveSuccessMessage ? 'Đã Lưu Thành Công!' : 'Lưu Mẫu Toa Thuốc'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
