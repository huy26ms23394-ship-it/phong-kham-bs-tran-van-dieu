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
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, patient, medications, vitals, diagnosis, symptoms, onClose]);

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

  // Khử lặp từ "Dị ứng: Dị ứng ..." nếu dữ liệu đã chứa chữ dị ứng
  const cleanAllergyText = patient?.allergies
    ? patient.allergies
        .filter((a) => !a.toLowerCase().includes('không có'))
        .map((a) => a.replace(/^(dị ứng|tiền sử dị ứng)\s*:?\s*/i, ''))
        .join(', ')
    : '';

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clinical-copilot-title"
    >
      <div className="relative max-w-5xl w-[95vw] h-[85vh] flex flex-col bg-[#0b111a] border border-white/10 rounded-xl shadow-2xl overflow-hidden text-slate-200">
        
        {/* TẦNG 1: TOP FIXED HEADER (h-14, không bao giờ vỡ dòng) */}
        <header className="h-14 px-4 sm:px-5 border-b border-white/[0.08] flex items-center justify-between gap-3 shrink-0 bg-[#0b111a]">
          {/* Cụm Bên Trái (min-w-0, co giãn tự nhiên không đè sang bên phải) */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <h2 id="clinical-copilot-title" className="text-sm font-semibold text-white truncate">
                  Trợ Lý Lâm Sàng Gemini AI
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true"></span>
                  CSDL: Đã kết nối
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                BS. Trần Văn Diệu • {allPatients.length} hồ sơ BN • {catalog.length} biệt dược • {allPrescriptions.length} đơn thuốc
              </p>
            </div>
          </div>

          {/* Cụm Bên Phải (shrink-0, các nút được giữ khoảng cách chuẩn) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Dropdown chọn Model */}
            <div className="flex items-center h-8 px-2 text-xs bg-slate-900 border border-white/10 rounded-md">
              <span className="text-slate-400 mr-1 text-[11px] hidden md:inline">Model:</span>
              <select
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                className="bg-transparent text-emerald-400 font-medium text-xs focus:outline-none cursor-pointer border-none py-0"
                title="Chuỗi tự động chuyển đổi: gemini-3.5-flash -> gemini-3.8-flash -> gemini-3.5-flash-lite -> gemini-2.5-flash -> Offline Rules Engine"
              >
                <option value="gemini-3.5-flash" className="bg-slate-900 text-white">Gemini 3.5 Flash</option>
                <option value="gemini-3.8-flash" className="bg-slate-900 text-white">Gemini 3.8 Flash</option>
                <option value="gemini-3.5-flash-lite" className="bg-slate-900 text-white">Gemini 3.5 Flash-Lite</option>
                <option value="gemini-2.5-flash" className="bg-slate-900 text-white">Gemini 2.5 Flash</option>
                <option value="offline-engine" className="bg-slate-900 text-white">Offline Rules 0ms</option>
              </select>
            </div>

            {/* Nút Kho Nguyên Tắc (1 icon) */}
            <button
              type="button"
              onClick={() => setIsKnowledgeOpen(true)}
              className="h-8 px-2.5 text-xs bg-slate-800/80 hover:bg-slate-800 text-slate-200 rounded-md border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Kho nguyên tắc 5 tầng CDS (0ms)"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-300" aria-hidden="true" />
              <span className="hidden md:inline">Kho Nguyên Tắc</span>
            </button>

            {/* Nút Mở Gemini Cá Nhân (1 icon) */}
            <button
              type="button"
              onClick={handleCopyCaseAndOpenGemini}
              className="h-8 px-2.5 text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Sao chép toàn bộ bệnh án và mở Gemini Cá Nhân (Alt + G)"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-300" aria-hidden="true" />
              <span className="hidden md:inline">Mở Gemini</span>
              <kbd className="hidden sm:inline px-1 py-0.2 text-[9px] font-mono bg-emerald-950/80 text-emerald-300 rounded border border-emerald-500/30 font-bold">
                Alt+G
              </kbd>
            </button>

            {/* Vạch ngăn cách dọc */}
            <div className="h-5 w-px bg-white/10 mx-0.5 sm:mx-1" aria-hidden="true" />

            {/* Nút Đóng Modal (nằm ngoài cùng bên phải) */}
            <button
              onClick={onClose}
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Đóng Trợ lý Gemini AI"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* TẦNG 2: THANH THÔNG TIN BỆNH NHÂN (Patient Context Bar - Xuống Hàng Cảnh Báo Dị Ứng) */}
        <div className="px-4 sm:px-5 py-2.5 bg-slate-900/80 border-b border-white/[0.06] shrink-0 space-y-1.5">
          {/* Hàng 1: Sinh hiệu & Chẩn đoán lâm sàng */}
          <div className="flex items-center gap-2.5 text-xs text-slate-300 flex-wrap">
            <span className="text-slate-400">Đang khám:</span>
            <strong className="text-white font-semibold">
              {patient?.fullName || 'Chưa chọn BN'}
            </strong>
            {patient?.birthYear && (
              <span className="text-slate-400 font-mono">
                ({new Date().getFullYear() - Number(patient.birthYear)} tuổi, {patient.gender === 'nam' ? 'Nam' : 'Nữ'})
              </span>
            )}

            <span className="text-slate-600" aria-hidden="true">•</span>

            <span className="text-slate-400">HA:</span>
            <strong className="font-mono tabular-nums text-white font-semibold">
              {vitals?.bloodPressure || '130/80'} mmHg
            </strong>

            <span className="text-slate-600" aria-hidden="true">•</span>

            <span className="text-slate-400">Chẩn đoán:</span>
            <span className="text-emerald-400 font-medium">
              {diagnosis || 'Chưa nhập'}
            </span>

            <span className="text-slate-600" aria-hidden="true">•</span>

            <span className="font-mono tabular-nums text-slate-300">
              Kho thuốc: {catalog.length} thuốc
            </span>
          </div>

          {/* Hàng 2: Xuống hàng dành riêng cho Dị ứng (đảm bảo hiển thị đầy đủ 100%, không bị đè che chữ) */}
          {cleanAllergyText ? (
            <div className="flex items-center">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/15 border border-rose-500/40 text-rose-300 font-medium text-xs">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" aria-hidden="true" />
                <span>⚠️ <strong>Cảnh Báo Dị Ứng:</strong> {cleanAllergyText}</span>
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-500/70" aria-hidden="true" />
              <span>Chưa ghi nhận tiền sử dị ứng thuốc</span>
            </div>
          )}
        </div>

        {/* TẦNG 3: THANH 5 TAB CHỨC NĂNG (Compact Segmented Navigation) */}
        <nav
          className="px-4 sm:px-5 bg-[#0b111a] border-b border-white/[0.08] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0"
          aria-label="Các chế độ phân tích lâm sàng"
        >
          {/* Tab 1 */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('full_review');
              handleRunAi('full_review');
            }}
            className={`whitespace-nowrap px-3.5 py-2.5 text-xs font-medium border-b-2 -mb-px transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'full_review'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/[0.07] font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Đánh Giá &amp; Tương Tác ({medications.length} thuốc)</span>
          </button>

          {/* Tab 2 */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('suggest_rx');
              handleRunAi('suggest_rx');
            }}
            className={`whitespace-nowrap px-3.5 py-2.5 text-xs font-medium border-b-2 -mb-px transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'suggest_rx'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/[0.07] font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Gợi Ý Thuốc Trong Kho</span>
          </button>

          {/* Tab 3 */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('diet');
              handleRunAi('diet');
            }}
            className={`whitespace-nowrap px-3.5 py-2.5 text-xs font-medium border-b-2 -mb-px transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'diet'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/[0.07] font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
            }`}
          >
            <Apple className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Soạn Lời Dặn Dinh Dưỡng</span>
          </button>

          {/* Tab 4 */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('clinic_audit');
              handleRunAi('clinic_audit');
            }}
            className={`whitespace-nowrap px-3.5 py-2.5 text-xs font-medium border-b-2 -mb-px transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'clinic_audit'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/[0.07] font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Phân Tích Phòng Khám</span>
          </button>

          {/* Tab 5 */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('chat');
              setResult(null);
            }}
            className={`whitespace-nowrap px-3.5 py-2.5 text-xs font-medium border-b-2 -mb-px transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'chat'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/[0.07] font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Hỏi Đáp Y Khoa Chuyên Sâu</span>
          </button>
        </nav>

        {/* TẦNG 4: KHU VỰC NỘI DUNG CHÍNH (Scrollable Content Area) */}
        <main className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[#0b111a]/50">
          
          {/* Quick Chat Input nếu chọn tab 'chat' */}
          {activeTab === 'chat' && (
            <div className="bg-slate-900/80 p-4 rounded-xl border border-white/10 shadow-sm space-y-2.5">
              <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
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
                  placeholder="VD: Bệnh nhân tăng huyết áp kèm suy thận nhẹ, có dùng được Amlor và Losartan cùng lúc không?..."
                  className="flex-1 h-10 px-3.5 text-xs rounded-lg border border-white/15 bg-slate-950 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  disabled={loading || !chatQuestion.trim()}
                  onClick={() => handleRunAi('chat', chatQuestion)}
                  className="h-10 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Hỏi AI</span>
                </button>
              </div>
            </div>
          )}

          {/* Trạng thái đang tải (Loading) */}
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" aria-hidden="true" />
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-white">
                  Gemini AI đang phân tích dữ liệu lâm sàng...
                </p>
                <p className="text-xs text-slate-400">
                  Đối chiếu dược thư, tiền sử dị ứng, tương tác thuốc và danh mục kho thuốc
                </p>
              </div>
            </div>
          )}

          {/* Trạng thái hiển thị kết quả phân tích */}
          {!loading && result && (
            <div className="space-y-4">
              <div className="bg-slate-900/90 p-5 rounded-xl border border-white/10 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <span className="text-xs font-semibold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                    <span>Kết Quả Phân Tích Chuyên Môn Y Khoa</span>
                  </span>

                  <button
                    onClick={handleCopyResult}
                    type="button"
                    className="h-7 px-2.5 text-xs text-slate-300 hover:text-white rounded-md border border-white/15 hover:bg-white/[0.08] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                        <span className="text-emerald-400 font-medium">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-normal">
                  {result.text}
                </div>
              </div>

              {/* Action Toolbar to apply advice or refresh */}
              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-400">Nguồn phản hồi:</span>
                  <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                    {result.model || selectedModel}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-white/10">
                    ⏱️ {result.latencyMs !== undefined ? `${result.latencyMs}ms` : '0ms'}
                  </span>
                  {result.fallbackUsed && (
                    <span className="font-medium text-[11px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" aria-hidden="true" />
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
                      className="h-8 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Áp Dụng Lời Dặn Vào Đơn</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRunAi(activeTab)}
                    className="h-8 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors border border-white/10 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" aria-hidden="true" />
                    <span>Phân tích lại</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Trạng thái chờ khởi chạy (Empty State) */}
          {!loading && !result && activeTab !== 'chat' && (
            <div className="py-16 text-center text-slate-400 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                <Sparkles className="w-6 h-6 text-emerald-400" aria-hidden="true" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h4 className="text-sm font-semibold text-white">
                  Sẵn Sàng Hỗ Trợ BS. Trần Văn Diệu
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Bấm nút bên dưới để Trợ lý Gemini AI đọc toàn bộ bệnh sử của{' '}
                  <strong className="text-slate-200">{patient?.fullName || 'bệnh nhân'}</strong>,
                  đối chiếu các thuốc trong đơn và kho dược {catalog.length}+ thuốc phòng khám.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleRunAi(activeTab)}
                className="h-9 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg shadow-lg shadow-emerald-950/50 inline-flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <span>⚡ Bắt Đầu Phân Tích Ngay</span>
              </button>
            </div>
          )}
        </main>

        {/* TẦNG 5: KHUYẾN CÁO PHÁP LÝ (CDS Safe Harbor Footer cố định ở đáy) */}
        <footer className="px-5 py-2 bg-amber-950/20 border-t border-amber-500/20 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-amber-200/80 flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
            <span>
              <strong>Khuyến cáo pháp lý lâm sàng:</strong> Gemini AI đóng vai trò hỗ trợ tham khảo. Bác sĩ kê đơn chịu trách nhiệm chuyên môn cuối cùng. Dữ liệu BN đã được khử định danh.
            </span>
          </div>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold whitespace-nowrap hidden sm:inline">
            CDS Safe Harbor
          </span>
        </footer>

      </div>

      {/* Modal Kho Tài Liệu Nguyên Tắc 5 Tầng CDS */}
      <ClinicalKnowledgeModal
        isOpen={isKnowledgeOpen}
        onClose={() => setIsKnowledgeOpen(false)}
      />
    </div>
  );
};
