import React, { useState, useEffect } from 'react';
import {
  Patient,
  PrescribedMedication,
  MedicationCatalogItem,
  Prescription,
} from '../types/medical';
import {
  queryClinicCopilotWithFullContext,
  ClinicalAiResponse,
  formatCaseForPersonalGemini,
  copyAndOpenPersonalGemini,
} from '../utils/clinicalAi';
import { ClinicalKnowledgeModal } from './ClinicalKnowledgeModal';
import {
  Sparkles,
  X,
  ShieldAlert,
  BookOpen,
  Apple,
  Send,
  Loader2,
  CheckCircle2,
  Stethoscope,
  BarChart3,
  Database,
  Plus,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

interface ClinicalAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient | null;
  allPatients?: Patient[];
  allPrescriptions?: Prescription[];
  catalog?: MedicationCatalogItem[];
  diagnosis: string;
  symptoms: string;
  medications: PrescribedMedication[];
  vitals?: {
    bloodPressure?: string;
    pulse?: number;
    weight?: number;
    height?: number;
  };
  onApplyDietAdvice?: (advice: string) => void;
  onApplyDiagnosis?: (diagnosis: string) => void;
  onAddSuggestedMedication?: (med: Partial<PrescribedMedication>) => void;
}

export const ClinicalAiModal: React.FC<ClinicalAiModalProps> = ({
  isOpen,
  onClose,
  patient,
  allPatients = [],
  allPrescriptions = [],
  catalog = [],
  diagnosis,
  symptoms,
  medications,
  vitals,
  onApplyDietAdvice,
  onApplyDiagnosis,
  onAddSuggestedMedication,
}) => {
  const [activeTab, setActiveTab] = useState<
    'full_review' | 'suggest_rx' | 'clinic_audit' | 'diet' | 'chat'
  >('full_review');
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    try {
      return localStorage.getItem('mediba_preferred_ai_model') || 'gemini-3.5-flash';
    } catch {
      return 'gemini-3.5-flash';
    }
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClinicalAiResponse | null>(null);
  const [chatQuestion, setChatQuestion] = useState('');
  const [copied, setCopied] = useState(false);
  const [isKnowledgeOpen, setIsKnowledgeOpen] = useState(false);

  const handleCopyCaseAndOpenGemini = () => {
    const formattedCase = formatCaseForPersonalGemini({
      patientName: patient?.fullName,
      birthYear: patient?.birthYear,
      gender: patient?.gender,
      allergies: patient?.allergies,
      chronicConditions: patient?.chronicConditions,
      vitals,
      symptoms,
      diagnosis,
      medications,
    });
    copyAndOpenPersonalGemini(formattedCase);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'g' || e.key === 'G') && (e.altKey || e.metaKey)) {
        e.preventDefault();
        handleCopyCaseAndOpenGemini();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, patient, medications, vitals, diagnosis, symptoms]);

  const handleModelChange = (newModel: string) => {
    setSelectedModel(newModel);
    try {
      localStorage.setItem('mediba_preferred_ai_model', newModel);
    } catch {}
  };

  if (!isOpen) return null;

  const handleRunAi = async (
    mode: 'full_review' | 'suggest_rx' | 'clinic_audit' | 'diet' | 'chat',
    customQuery?: string
  ) => {
    setLoading(true);
    setResult(null);

    let action: any = 'analyze_patient_and_prescription';
    if (mode === 'suggest_rx') action = 'suggest_rx_from_catalog';
    if (mode === 'clinic_audit') action = 'audit_clinic_patients';
    if (mode === 'diet') action = 'diet_and_counseling';
    if (mode === 'chat') action = 'free_clinical_query';

    const res = await queryClinicCopilotWithFullContext({
      action,
      query: customQuery || chatQuestion,
      currentPatient: patient,
      allPatients,
      currentPrescription: medications,
      allPrescriptionsCount: allPrescriptions.length,
      pharmacyCatalog: catalog,
      vitals,
      diagnosis,
      symptoms,
      model: selectedModel,
    });

    setResult(res);
    setLoading(false);
  };

  const handleCopyResult = () => {
    if (!result?.text) return;
    navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-md max-w-4xl w-full shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden my-4 flex flex-col h-[90vh] transition-colors">
        {/* Header: professional medical dark slate/emerald palette */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-emerald-800 dark:bg-emerald-700 flex items-center justify-center text-emerald-200 border border-emerald-600 shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Trợ Lý Lâm Sàng Gemini AI
                </h2>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-red-600/30 text-emerald-200 border border-emerald-500/40">
                  Toàn Quyền Đọc CSDL Phòng Khám
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>BS. Trần Văn Diệu</span>
                <span>·</span>
                <span>
                  Đã kết nối {allPatients.length} hồ sơ BN · {catalog.length} biệt dược · {allPrescriptions.length} đơn thuốc
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            {/* Dropdown chọn Model AI Thế Hệ 3.5+ & Auto-Fallback */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 dark:bg-slate-900 border border-slate-700/80 rounded-md px-2.5 py-1 text-xs shadow-inner">
              <span className="text-amber-300 font-bold hidden sm:inline text-[11px]">Model:</span>
              <select
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                className="bg-transparent text-emerald-300 font-semibold text-xs focus:outline-hidden cursor-pointer border-none"
                title="Chuỗi tự động chuyển đổi: gemini-3.5-flash -> gemini-3.8-flash -> gemini-3.5-flash-lite -> gemini-2.5-flash -> Offline Rules Engine"
              >
                <option value="gemini-3.5-flash" className="bg-slate-900 text-white">Gemini 3.5 Flash</option>
                <option value="gemini-3.8-flash" className="bg-slate-900 text-white">Gemini 3.8 Flash</option>
                <option value="gemini-3.5-flash-lite" className="bg-slate-900 text-white">Gemini 3.5 Flash-Lite</option>
                <option value="gemini-2.5-flash" className="bg-slate-900 text-white">Gemini 2.5 Flash</option>
                <option value="offline-engine" className="bg-slate-900 text-white">Offline Rules 0ms</option>
              </select>
            </div>

            {/* Nút 🚀 Mở Gemini Cá Nhân (Alt + G) */}
            <button
              type="button"
              onClick={handleCopyCaseAndOpenGemini}
              className="px-2.5 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded text-xs font-bold flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer border border-indigo-400/40"
              title="Sao chép toàn bộ bệnh án và mở Gemini Cá Nhân (Alt + G)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">🚀 Mở Gemini Cá Nhân</span>
              <span className="sm:hidden">Gemini</span>
              <kbd className="hidden md:inline px-1 py-0.2 text-[9px] font-mono bg-indigo-950/80 text-indigo-200 rounded">
                Alt+G
              </kbd>
            </button>

            {/* Nút 📚 Kho Nguyên Tắc (0ms) */}
            <button
              type="button"
              onClick={() => setIsKnowledgeOpen(true)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold flex items-center gap-1 transition-all border border-slate-700 cursor-pointer"
              title="Mở kho tài liệu nguyên tắc lâm sàng 5 tầng"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-300" />
              <span className="hidden sm:inline">📚 Kho Nguyên Tắc</span>
            </button>

            <button
              onClick={onClose}
              type="button"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-rose-400"
              aria-label="Đóng Trợ lý Gemini AI"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Context Strip: Active patient details */}
        <div className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400">Đang khám:</span>
              <strong className="text-slate-900 dark:text-slate-100 font-bold">
                {patient?.fullName || 'Chưa chọn BN'}
              </strong>
              {patient?.birthYear && (
                <span className="text-slate-500 dark:text-slate-400 font-mono">
                  ({new Date().getFullYear() - Number(patient.birthYear)} tuổi, {patient.gender === 'nam' ? 'Nam' : 'Nữ'})
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400">Huyết áp:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                {vitals?.bloodPressure || '130/80'} mmHg
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400">Chẩn đoán:</span>
              <span className="font-semibold text-emerald-900 dark:text-emerald-300">
                {diagnosis || 'Chưa nhập'}
              </span>
            </div>

            {patient?.allergies && patient.allergies.length > 0 && !patient.allergies[0].includes('Không có') && (
              <span className="font-bold text-rose-700 dark:text-emerald-300 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                Dị ứng: {patient.allergies.join(', ')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
            <Database className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>Kho thuốc: {catalog.length} thuốc</span>
          </div>
        </div>

        {/* Minh Bạch Trí Tuệ Nhân Tạo (vn-law-check 07-ai-transparency) */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 px-5 py-2 flex items-center justify-between gap-3 text-[11px] text-amber-900 dark:text-amber-200 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Khuyến cáo pháp lý lâm sàng:</strong> Trí tuệ nhân tạo (Gemini AI) đóng vai trò hỗ trợ tham khảo. Bác sĩ kê đơn chịu trách nhiệm chuyên môn và pháp lý độc lập cuối cùng. Dữ liệu bệnh nhân đã được khử định danh tự động.
            </span>
          </div>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700 whitespace-nowrap hidden sm:inline">
            CDS Safe Harbor
          </span>
        </div>

        {/* Sub-nav Tabs: Pure Lucide SVG icons, min 44px hit targets */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 py-2 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0 custom-scrollbar">
          <button
            onClick={() => {
              setActiveTab('full_review');
              handleRunAi('full_review');
            }}
            className={`min-h-[44px] px-3.5 py-2 rounded-md font-bold flex items-center gap-2 transition-colors border ${
              activeTab === 'full_review'
                ? 'bg-emerald-800 dark:bg-emerald-700 text-white border-emerald-900 dark:border-emerald-600 shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-300" />
            <span>Đánh Giá Toàn Diện &amp; Tương Tác ({medications.length} thuốc)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('suggest_rx');
              handleRunAi('suggest_rx');
            }}
            className={`min-h-[44px] px-3.5 py-2 rounded-md font-bold flex items-center gap-2 transition-colors border ${
              activeTab === 'suggest_rx'
                ? 'bg-emerald-800 dark:bg-emerald-700 text-white border-emerald-900 dark:border-emerald-600 shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-300" />
            <span>Gợi Ý Thuốc Có Sẵn Trong Kho</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('diet');
              handleRunAi('diet');
            }}
            className={`min-h-[44px] px-3.5 py-2 rounded-md font-bold flex items-center gap-2 transition-colors border ${
              activeTab === 'diet'
                ? 'bg-emerald-800 dark:bg-emerald-700 text-white border-emerald-900 dark:border-emerald-600 shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700'
            }`}
          >
            <Apple className="w-4 h-4 text-emerald-300" />
            <span>Soạn Lời Dặn Dinh Dưỡng</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('clinic_audit');
              handleRunAi('clinic_audit');
            }}
            className={`min-h-[44px] px-3.5 py-2 rounded-md font-bold flex items-center gap-2 transition-colors border ${
              activeTab === 'clinic_audit'
                ? 'bg-emerald-800 dark:bg-emerald-700 text-white border-emerald-900 dark:border-emerald-600 shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-300" />
            <span>Phân Tích Toàn Bộ Phòng Khám</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('chat');
              setResult(null);
            }}
            className={`min-h-[44px] px-3.5 py-2 rounded-md font-bold flex items-center gap-2 transition-colors border ${
              activeTab === 'chat'
                ? 'bg-emerald-800 dark:bg-emerald-700 text-white border-emerald-900 dark:border-emerald-600 shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-emerald-300" />
            <span>Hỏi Đáp Y Khoa Chuyên Sâu</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4 bg-slate-50/50 dark:bg-slate-950/60">
          {/* Quick Chat Input if on chat tab */}
          {activeTab === 'chat' && (
            <div className="bg-white dark:bg-slate-900 p-4 rounded-md border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <span>Đặt câu hỏi lâm sàng dựa trên toàn bộ dữ liệu bệnh nhân và kho thuốc:</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatQuestion}
                  onChange={(e) => setChatQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && chatQuestion.trim()) {
                      handleRunAi('chat', chatQuestion);
                    }
                  }}
                  placeholder="VD: Kiểm tra xem bệnh nhân này có dùng được Amlor và Losartan cùng lúc không? Hoặc đề xuất phác đồ cho bệnh nhân đái tháo đường kèm suy thận..."
                  className="flex-1 min-h-[44px] px-4 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                />
                <button
                  type="button"
                  disabled={loading || !chatQuestion.trim()}
                  onClick={() => handleRunAi('chat', chatQuestion)}
                  className="min-h-[44px] px-5 py-2 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-md text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors border border-emerald-700 dark:border-emerald-500"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Hỏi AI</span>
                </button>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="py-16 flex flex-col items-center justify-center text-slate-600 dark:text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 text-emerald-800 dark:text-emerald-400 animate-spin" />
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Gemini AI đang xử lý toàn bộ hồ sơ phòng khám...
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Đối chiếu dược thư, tiền sử dị ứng, tương tác thuốc và danh mục kho thuốc
                </p>
              </div>
            </div>
          )}

          {/* Result View */}
          {!loading && result && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-md border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <span>Kết Quả Phân Tích Chuyên Môn Y Khoa</span>
                  </span>

                  <button
                    onClick={handleCopyResult}
                    type="button"
                    className="min-h-[36px] px-3 py-1 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-md border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Đã sao chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép kết quả</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-normal">
                  {result.text}
                </div>
              </div>

              {/* Action Toolbar to apply advice or medications */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-md border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Phản hồi từ:</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                    {result.model || selectedModel}
                  </span>
                  <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    ⏱️ {result.latencyMs !== undefined ? `${result.latencyMs}ms` : '0ms'}
                  </span>
                  {result.fallbackUsed && (
                    <span className="font-semibold text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />
                      <span>Auto-Fallback Chain kích hoạt</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {activeTab === 'diet' && onApplyDietAdvice && (
                    <button
                      type="button"
                      onClick={() => {
                        onApplyDietAdvice(String(result?.text || '').replace(/###/g, '').trim());
                        onClose();
                      }}
                      className="min-h-[44px] px-4 py-2 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-md font-bold flex items-center gap-2 transition-colors border border-emerald-700 dark:border-emerald-500 shadow-2xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Áp Dụng Lời Dặn Này Vào Đơn Thuốc</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRunAi(activeTab)}
                    className="min-h-[44px] px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md font-semibold flex items-center gap-1.5 transition-colors border border-slate-200/80 dark:border-slate-700"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Phân tích lại</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Initial State Helper */}
          {!loading && !result && activeTab !== 'chat' && (
            <div className="py-16 text-center text-slate-500 dark:text-slate-400 space-y-3">
              <Sparkles className="w-10 h-10 text-emerald-800 dark:text-emerald-400 mx-auto" />
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Sẵn Sàng Hỗ Trợ Bác Sĩ Trần Văn Diệu
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Bấm nút bên dưới để Trợ lý Gemini AI đọc toàn bộ bệnh sử của{' '}
                  <strong className="text-slate-800 dark:text-slate-200">{patient?.fullName || 'bệnh nhân'}</strong>,
                  đối chiếu các thuốc trong đơn và kho dược 44+ thuốc phòng khám.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleRunAi(activeTab)}
                className="min-h-[44px] px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-bold rounded-md shadow-xs transition-colors border border-emerald-700 dark:border-emerald-500"
              >
                Bắt Đầu Phân Tích Ngay
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Clinical Knowledge & 5-Tier CDS Modal */}
      <ClinicalKnowledgeModal
        isOpen={isKnowledgeOpen}
        onClose={() => setIsKnowledgeOpen(false)}
      />
    </div>
  );
};
