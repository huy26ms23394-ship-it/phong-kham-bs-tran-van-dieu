import React, { useState, useEffect, useRef } from 'react';
import {
  CrawledDrugItem,
  CrawlerSettings,
  CrawlerStatusResponse,
} from '../types/crawler';
import { MedicationCatalogItem } from '../types/medical';
import {
  getCrawlerStatus,
  getPendingCrawledDrugs,
  saveCrawlerSettings,
  triggerCrawlerRun,
  approveCrawledDrug,
  approveAllCrawledDrugs,
  rejectCrawledDrug,
  rejectAllCrawledDrugs,
  updatePendingDrug,
} from '../utils/crawlerClient';
import {
  Bot,
  X,
  Play,
  Check,
  CheckCheck,
  Trash2,
  Clock,
  Sliders,
  FileText,
  AlertCircle,
  CheckCircle2,
  Search,
  RefreshCw,
  Building2,
  ShieldCheck,
  Edit3,
  Calendar,
  Save,
  Filter,
  Loader2,
  Globe,
  Database,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { getGoogleSearchUrl } from './PharmacyCatalogModal';

interface CrawlerBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicCatalog: MedicationCatalogItem[];
  onAddApprovedDrugs: (newDrugs: MedicationCatalogItem[]) => void;
}

const AVAILABLE_CATEGORIES = [
  'Tim mạch - Huyết áp',
  'Mỡ máu - Tim mạch',
  'Đái tháo đường',
  'Kháng sinh',
  'Dạ dày - Tiêu hóa',
  'Hô hấp - Tai mũi họng',
  'Kháng viêm - Phù nề',
  'Giảm đau - Hạ sốt',
  'Cơ xương khớp',
  'Tuần hoàn não',
  'Vitamin & Bổ dưỡng',
];

const CRAWL_STEPS = [
  'Kết nối cổng dữ liệu y tế công khai (Cục Quản Lý Dược DAV, Dược Thư Quốc Gia, OpenFDA)',
  'Truy xuất thông tin biệt dược, hoạt chất INN & số đăng ký lưu hành công khai',
  'Đối chiếu lọc trùng với danh mục kho thuốc hiện tại của phòng khám',
  'Chuẩn hóa liều dùng tham khảo & đưa vào hàng chờ Bác sĩ phê duyệt',
];

interface CrawlSummaryReport {
  finishedAt: string;
  addedCount: number;
  skippedCount: number;
  totalPending: number;
  newlyCrawledItems: CrawledDrugItem[];
}

export const CrawlerBotModal: React.FC<CrawlerBotModalProps> = ({
  isOpen,
  onClose,
  clinicCatalog,
  onAddApprovedDrugs,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'settings' | 'logs'>('pending');
  const [statusData, setStatusData] = useState<CrawlerStatusResponse | null>(null);
  const [pendingItems, setPendingItems] = useState<CrawledDrugItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlStepIndex, setCrawlStepIndex] = useState(0);
  const [crawlProgress, setCrawlProgress] = useState(0);
  const [processingItemId, setProcessingItemId] = useState<string | null>(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Giữ kết quả phiên cào hiển thị cố định sau khi chạy xong (KHÔNG tự động tắt gây khó hiểu)
  const [crawlReport, setCrawlReport] = useState<CrawlSummaryReport | null>(null);
  const [newlyCrawledIds, setNewlyCrawledIds] = useState<Set<string>>(new Set());

  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Tất cả');

  // Edit item state
  const [editingItem, setEditingItem] = useState<CrawledDrugItem | null>(null);

  // Settings local state
  const [settingsForm, setSettingsForm] = useState<CrawlerSettings>({
    enabled: true,
    dailyRunTime: '06:00',
    batchSize: 5,
    targetSources: ['dav_gov_vn', 'duoc_thu_quoc_gia', 'drugbank_vn'],
    targetCategories: [
      'Tim mạch - Huyết áp',
      'Đái tháo đường',
      'Kháng sinh',
      'Dạ dày - Tiêu hóa',
      'Hô hấp - Tai mũi họng',
    ],
    autoDiscardDuplicates: true,
  });

  const loadAllData = async (showSpinner = true): Promise<CrawledDrugItem[]> => {
    if (showSpinner) setIsLoading(true);
    try {
      const [status, pending] = await Promise.all([
        getCrawlerStatus(),
        getPendingCrawledDrugs(),
      ]);
      if (status) {
        setStatusData(status);
        setSettingsForm(status.settings);
      }
      setPendingItems(pending);
      return pending;
    } catch (err) {
      console.error('Error loading crawler data:', err);
      return [];
    } finally {
      if (showSpinner) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAllData(true);
    }
  }, [isOpen]);

  // Hiệu ứng chạy tiến trình từng bước khi đang cào dữ liệu
  useEffect(() => {
    if (!isCrawling) {
      return;
    }

    setCrawlStepIndex(0);
    setCrawlProgress(15);
    const interval = setInterval(() => {
      setCrawlStepIndex((prev) => (prev < CRAWL_STEPS.length - 1 ? prev + 1 : prev));
      setCrawlProgress((prev) => (prev < 90 ? prev + 22 : prev));
    }, 420);

    return () => clearInterval(interval);
  }, [isCrawling]);

  // Thông báo giữ nguyên cho tới khi người dùng chủ động đóng (không dùng setTimeout tự tắt)
  const showFeedback = (type: 'success' | 'error' | 'info', text: string) => {
    setFeedbackMsg({ type, text });
  };

  const crawlTimeoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Dừng quét khẩn cấp nếu người dùng muốn hủy
  const handleStopCrawl = async () => {
    if (crawlTimeoutTimerRef.current) {
      clearTimeout(crawlTimeoutTimerRef.current);
      crawlTimeoutTimerRef.current = null;
    }
    setIsCrawling(false);
    setIsLoading(false);
    showFeedback('info', 'Đã dừng tiến trình quét dữ liệu.');
    await loadAllData(false);
  };

  // Kích hoạt bot cào thuốc thủ công với cơ chế bảo vệ timeout chống treo vĩnh viễn
  const handleTriggerCrawl = async () => {
    if (isCrawling) return;
    const previousIds = new Set(pendingItems.map((item) => item.id));

    setIsCrawling(true);
    setCrawlReport(null);
    setFeedbackMsg(null);
    setActiveTab('pending');

    // Bộ đếm an toàn: Nếu quá 9.5s chưa xong, tự động mở khóa UI
    if (crawlTimeoutTimerRef.current) clearTimeout(crawlTimeoutTimerRef.current);
    crawlTimeoutTimerRef.current = setTimeout(async () => {
      console.warn('[CrawlerBot] Safety timeout triggered after 9.5s');
      setIsCrawling(false);
      setIsLoading(false);
      showFeedback('error', 'Máy chủ phản hồi chậm. Bot đã tự động làm mới lại danh mục thuốc.');
      await loadAllData(false);
    }, 9500);

    try {
      const clinicNames = clinicCatalog.map((c) => c.name);
      const res = await triggerCrawlerRun(clinicNames);
      setCrawlStepIndex(CRAWL_STEPS.length - 1);
      setCrawlProgress(100);

      const updatedPending = await loadAllData(false);
      const addedItems = updatedPending.filter((item) => !previousIds.has(item.id));
      const newIdSet = new Set(addedItems.map((item) => item.id));
      setNewlyCrawledIds(newIdSet);

      // Tự động chuyển bộ lọc về "Tất cả" và xóa từ khóa tìm kiếm để thuốc mới cào hiển thị ngay lập tức
      setFilterCategory('Tất cả');
      setSearchTerm('');

      // Giữ bảng báo cáo hiển thị cố định cho tới khi Bác sĩ bấm Thu gọn hoặc Đóng
      setCrawlReport({
        finishedAt: new Date().toLocaleTimeString('vi-VN'),
        addedCount: res.added,
        skippedCount: res.skipped,
        totalPending: res.totalPending,
        newlyCrawledItems: addedItems,
      });

      showFeedback('success', `Thu thập thành công +${res.added} thuốc mới vào danh sách chờ duyệt!`);
    } catch (err: unknown) {
      showFeedback('error', `Lỗi cào dữ liệu: ${(err as Error).message}`);
    } finally {
      if (crawlTimeoutTimerRef.current) {
        clearTimeout(crawlTimeoutTimerRef.current);
        crawlTimeoutTimerRef.current = null;
      }
      setIsCrawling(false);
      setIsLoading(false);
    }
  };

  // Duyệt một thuốc
  const handleApproveOne = async (item: CrawledDrugItem) => {
    setProcessingItemId(item.id);
    try {
      const approved = await approveCrawledDrug(item.id);
      setPendingItems((prev) => prev.filter((p) => p.id !== item.id));
      setCrawlReport((prev) =>
        prev
          ? {
              ...prev,
              newlyCrawledItems: prev.newlyCrawledItems.filter((x) => x.id !== item.id),
            }
          : null
      );
      onAddApprovedDrugs([approved]);
      showFeedback('success', `Đã duyệt và nhập thuốc "${approved.name}" vào kho phòng khám!`);
      if (statusData) {
        setStatusData({
          ...statusData,
          pendingCount: Math.max(0, statusData.pendingCount - 1),
          approvedCount: statusData.approvedCount + 1,
        });
      }
    } catch (err: unknown) {
      showFeedback('error', `Không thể duyệt thuốc: ${(err as Error).message}`);
    } finally {
      setProcessingItemId(null);
    }
  };

  // Duyệt tất cả
  const handleApproveAll = async () => {
    if (pendingItems.length === 0 || isBulkProcessing) return;
    setIsBulkProcessing(true);
    try {
      const approvedList = await approveAllCrawledDrugs();
      setPendingItems([]);
      setCrawlReport(null);
      onAddApprovedDrugs(approvedList);
      showFeedback(
        'success',
        `Đã phê duyệt thành công toàn bộ ${approvedList.length} thuốc mới vào danh mục kho phòng khám!`
      );
      await loadAllData(false);
    } catch (err: unknown) {
      showFeedback('error', `Lỗi duyệt tất cả: ${(err as Error).message}`);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Từ chối một thuốc
  const handleRejectOne = async (item: CrawledDrugItem) => {
    setProcessingItemId(item.id);
    try {
      await rejectCrawledDrug(item.id, 'Bác sĩ không duyệt nhập kho');
      setPendingItems((prev) => prev.filter((p) => p.id !== item.id));
      setCrawlReport((prev) =>
        prev
          ? {
              ...prev,
              newlyCrawledItems: prev.newlyCrawledItems.filter((x) => x.id !== item.id),
            }
          : null
      );
      showFeedback('info', `Đã bỏ qua thuốc "${item.name}".`);
      if (statusData) {
        setStatusData({
          ...statusData,
          pendingCount: Math.max(0, statusData.pendingCount - 1),
          rejectedCount: statusData.rejectedCount + 1,
        });
      }
    } catch (err: unknown) {
      showFeedback('error', `Không thể từ chối thuốc: ${(err as Error).message}`);
    } finally {
      setProcessingItemId(null);
    }
  };

  // Từ chối tất cả
  const handleRejectAll = async () => {
    if (pendingItems.length === 0 || isBulkProcessing) return;
    setIsBulkProcessing(true);
    try {
      const count = await rejectAllCrawledDrugs();
      setPendingItems([]);
      setCrawlReport(null);
      showFeedback('info', `Đã làm trống ${count} thuốc khỏi danh sách chờ duyệt.`);
      await loadAllData(false);
    } catch (err: unknown) {
      showFeedback('error', `Lỗi hủy danh sách: ${(err as Error).message}`);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Lưu chỉnh sửa thuốc chờ duyệt
  const handleSaveEditItem = async () => {
    if (!editingItem) return;
    setProcessingItemId(editingItem.id);
    try {
      const updated = await updatePendingDrug(editingItem.id, editingItem);
      setPendingItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
      setEditingItem(null);
      showFeedback('success', `Đã cập nhật thông tin thuốc "${updated.name}".`);
    } catch (err: unknown) {
      showFeedback('error', `Lỗi cập nhật: ${(err as Error).message}`);
    } finally {
      setProcessingItemId(null);
    }
  };

  // Lưu cài đặt bot
  const persistSettings = async (nextSettings: CrawlerSettings, customMsg?: string) => {
    setIsSavingSettings(true);
    try {
      await new Promise((r) => setTimeout(r, 350));
      const saved = await saveCrawlerSettings(nextSettings);
      if (saved) {
        setSettingsForm(saved);
        if (statusData) setStatusData({ ...statusData, settings: saved });
      }
      showFeedback('success', customMsg || 'Đã lưu cấu hình lịch chạy Bot Crawler thành công!');
    } catch (err: unknown) {
      showFeedback('error', `Lỗi lưu cài đặt: ${(err as Error).message}`);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await persistSettings(settingsForm);
  };

  // Filtered pending list
  const filteredItems = pendingItems.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.activeIngredient &&
        item.activeIngredient.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.registrationNumber &&
        item.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCat = filterCategory === 'Tất cả' || item.category === filterCategory;
    return matchSearch && matchCat;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-md shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-emerald-800 text-white flex items-center justify-center shadow-xs relative">
              <Bot className="w-5 h-5 text-emerald-200" />
              {isCrawling && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-white dark:ring-slate-900" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Bot Tra Cứu Thuốc Công Khai &amp; Phê Duyệt Danh Mục
                </h2>
                {statusData?.settings.enabled ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-md bg-emerald-500 animate-pulse" />
                    Tự động chạy {statusData.settings.dailyRunTime} mỗi ngày
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                    Đang tạm dừng lịch tự động
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  100% Dữ liệu Công khai (Public Open Data): Cục Quản Lý Dược (DAV), Dược Thư Quốc Gia &amp; OpenFDA
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isCrawling && (
              <button
                onClick={handleStopCrawl}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-98"
                title="Dừng tiến trình quét dữ liệu này ngay lập tức"
              >
                <X className="w-3.5 h-3.5" />
                <span>Dừng Lại</span>
              </button>
            )}
            <button
              onClick={handleTriggerCrawl}
              disabled={isCrawling}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:bg-emerald-900/60 text-white text-xs font-semibold rounded-md flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:cursor-wait active:scale-98"
              title="Kích hoạt bot quét dữ liệu thuốc công khai ngay bây giờ"
            >
              {isCrawling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Đang quét ({crawlProgress}%)...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Cào Thuốc Ngay</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* KHUNG TIẾN TRÌNH & KẾT QUẢ CÀO DỮ LIỆU (GIỮ NGUYÊN SAU KHI CHẠY XONG, KHÔNG TỰ ĐỘNG TẮT) */}
        {(isCrawling || crawlReport) && (
          <div className="px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white border-b border-emerald-800/80 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs font-semibold">
                {isCrawling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                    <span className="text-emerald-200">{CRAWL_STEPS[crawlStepIndex]}...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                    <span className="text-emerald-300 font-bold text-sm">
                      Hoàn tất quét dữ liệu công khai lúc {crawlReport?.finishedAt}! Đã thu thập{' '}
                      <span className="underline decoration-emerald-400">
                        +{crawlReport?.addedCount} thuốc mới
                      </span>{' '}
                      (bỏ qua {crawlReport?.skippedCount} thuốc trùng)
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-xs font-bold text-amber-300">
                  {isCrawling ? `${crawlProgress}%` : '100% Hoàn tất'}
                </span>
                {!isCrawling && crawlReport && (
                  <button
                    onClick={() => setCrawlReport(null)}
                    className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1 border border-slate-700 cursor-pointer"
                    title="Đóng bảng tóm tắt kết quả này"
                  >
                    <span>Thu gọn</span>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-800 rounded-md overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-md ${
                  isCrawling
                    ? 'bg-gradient-to-r from-rose-400 to-amber-400'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${isCrawling ? crawlProgress : 100}%` }}
              />
            </div>

            {/* 4-Step Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
              {CRAWL_STEPS.map((step, idx) => {
                const isDone = !isCrawling || idx < crawlStepIndex;
                const isCurrent = isCrawling && idx === crawlStepIndex;
                return (
                  <div
                    key={idx}
                    className={`p-2 rounded-md border text-[11px] flex items-start gap-2 transition-all ${
                      isDone
                        ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                        : isCurrent
                        ? 'bg-emerald-900/50 border-amber-400/60 text-white font-semibold'
                        : 'bg-slate-900/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : isCurrent ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-md border border-slate-700 shrink-0 mt-0.5 inline-block" />
                    )}
                    <span className="line-clamp-2">{step}</span>
                  </div>
                );
              })}
            </div>

            {/* Danh sách tóm tắt các thuốc VỪA MỚI CÀO để Bác sĩ thấy ngay */}
            {!isCrawling && crawlReport && crawlReport.newlyCrawledItems.length > 0 && (
              <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-slate-400 font-medium mr-1">
                    Thuốc mới vừa thêm vào đầu danh sách bên dưới:
                  </span>
                  {crawlReport.newlyCrawledItems.map((d) => (
                    <span
                      key={d.id}
                      className="px-2.5 py-1 rounded-md bg-emerald-900/80 border border-emerald-600/60 text-emerald-100 font-semibold text-[11px] inline-flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      {d.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* FEEDBACK BANNER (Cố định cho tới khi bấm X) */}
        {feedbackMsg && (
          <div
            className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between border-b ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
                : feedbackMsg.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-emerald-200 dark:bg-rose-950/40 dark:text-emerald-300 dark:border-rose-900'
                : 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMsg.type === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              {feedbackMsg.type === 'error' && (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              {feedbackMsg.type === 'info' && (
                <Globe className="w-4 h-4 text-blue-600 shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMsg(null)}
              className="opacity-60 hover:opacity-100 cursor-pointer"
              title="Đóng thông báo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* TAB NAVIGATION */}
        <div className="px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'pending'
                  ? 'border-emerald-700 text-emerald-800 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Chờ Phê Duyệt</span>
              <span
                className={`ml-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                  pendingItems.length > 0
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {pendingItems.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'settings'
                  ? 'border-emerald-700 text-emerald-800 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Cài Đặt Bot &amp; Lịch Chạy</span>
              {isSavingSettings && <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />}
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'logs'
                  ? 'border-emerald-700 text-emerald-800 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Nhật Ký Cào ({statusData?.recentLogs.length || 0})</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 dark:text-slate-500 hidden sm:flex items-center gap-2">
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />}
            {statusData?.settings.lastRunTime ? (
              <span>
                Lần cào gần nhất:{' '}
                {new Date(statusData.settings.lastRunTime).toLocaleString('vi-VN')}
              </span>
            ) : (
              <span>Chưa có dữ liệu cào</span>
            )}
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/40">
          
          {/* ================= TAB 1: CHỜ PHÊ DUYỆT ================= */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              {/* Filter and Bulk Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-md border border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="relative min-w-[200px] flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm theo tên thuốc, hoạt chất, số ĐK..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>

                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  >
                    <option value="Tất cả">Tất cả nhóm bệnh</option>
                    {AVAILABLE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {pendingItems.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleApproveAll}
                      disabled={isBulkProcessing || isCrawling}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-98"
                    >
                      {isBulkProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCheck className="w-3.5 h-3.5" />
                      )}
                      <span>Duyệt Tất Cả ({pendingItems.length})</span>
                    </button>
                    <button
                      onClick={handleRejectAll}
                      disabled={isBulkProcessing || isCrawling}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 disabled:opacity-50 text-rose-700 dark:text-emerald-300 text-xs font-semibold rounded-md border border-emerald-200 dark:border-rose-900 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hủy Tất Cả</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Loading Banner when Crawling but items already exist */}
              {isCrawling && pendingItems.length > 0 && (
                <div className="p-3 mb-3 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-800 dark:text-emerald-200">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                      Đang cào thêm thuốc mới từ CSDL Dược Quốc Gia ({crawlProgress}%)... Bác sĩ vẫn có thể xem và duyệt thuốc trong danh sách bên dưới:
                    </span>
                  </div>
                  <button
                    onClick={handleStopCrawl}
                    className="text-rose-600 dark:text-rose-400 font-semibold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Dừng quét</span>
                  </button>
                </div>
              )}

              {/* Loading Skeleton State when Crawling on empty list */}
              {isCrawling && pendingItems.length === 0 && (
                <div className="space-y-3">
                  <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200 mb-2">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                      Đang thu thập biệt dược công khai ({crawlProgress}%)...
                    </span>
                    <button onClick={handleStopCrawl} className="text-rose-600 font-bold hover:underline cursor-pointer">
                      Dừng
                    </button>
                  </div>
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="bg-white dark:bg-slate-900 rounded-md p-4 border border-emerald-500/30 animate-pulse space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                          <div className="h-4 w-24 bg-emerald-100 dark:bg-emerald-950 rounded" />
                          <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded" />
                        </div>
                        <div className="h-7 w-28 bg-emerald-100 dark:bg-emerald-950 rounded-md" />
                      </div>
                      <div className="h-3 w-3/4 bg-slate-100 dark:bg-slate-800 rounded" />
                      <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800 rounded" />
                    </div>
                  ))}
                </div>
              )}

              {/* Initial Loading Spinner on completely empty data */}
              {!isCrawling && isLoading && pendingItems.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-8">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mx-auto mb-3" />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Đang tải danh sách thuốc chờ phê duyệt...
                  </p>
                </div>
              )}

              {/* Empty state */}
              {(!isCrawling || pendingItems.length > 0) && !isLoading && filteredItems.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-md border border-dashed border-slate-300 dark:border-slate-800 p-8">
                  <div className="w-12 h-12 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto mb-3">
                    <Database className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Danh sách chờ duyệt đang trống
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    Bấm nút bên dưới để Bot quét dữ liệu thuốc công khai từ Cục Quản Lý Dược (DAV), Dược Thư Quốc Gia và OpenFDA về cho Bác sĩ kiểm duyệt.
                  </p>
                  <button
                    onClick={handleTriggerCrawl}
                    disabled={isCrawling}
                    className="mt-4 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white text-xs font-semibold rounded-md inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                  >
                    {isCrawling ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang quét dữ liệu công khai ({crawlProgress}%)...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Cào Thuốc Mới Ngay ({settingsForm.batchSize} thuốc)</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                (!isCrawling || pendingItems.length > 0) && (
                  <div className="grid grid-cols-1 gap-3.5">
                    {filteredItems.map((item) => {
                      const isProcessingThis = processingItemId === item.id;
                      const isNewlyCrawled = newlyCrawledIds.has(item.id);
                      return (
                        <div
                          key={item.id}
                          className={`bg-white dark:bg-slate-900 rounded-md p-4 border transition-all shadow-xs ${
                            isNewlyCrawled
                              ? 'border-emerald-500/80 dark:border-emerald-500/70 ring-1 ring-emerald-500/20'
                              : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50'
                          } ${isProcessingThis ? 'opacity-60 pointer-events-none' : ''}`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                  {item.name}
                                </h4>
                                {isNewlyCrawled && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-400/20 text-amber-600 dark:text-amber-300 border border-amber-400/40 inline-flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    MỚI VỪA CÀO
                                  </span>
                                )}
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  {item.category}
                                </span>
                                {item.registrationNumber && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                    SĐK: {item.registrationNumber}
                                  </span>
                                )}
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                                  {item.confidenceScore}% chuẩn Dược thư
                                </span>
                              </div>

                              <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1">
                                <span>
                                  <strong>Hoạt chất:</strong> {item.activeIngredient || '---'}
                                </span>
                                <span>
                                  <strong>Hàm lượng:</strong> {item.strength}
                                </span>
                                <span>
                                  <strong>Dạng bào chế:</strong> {item.form} ({item.unit})
                                </span>
                                {item.manufacturer && (
                                  <span>
                                    <strong>Nhà SX:</strong> {item.manufacturer}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <a
                                href={getGoogleSearchUrl(item.name, item.activeIngredient)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-indigo-600 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-md text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                                title={`Mở tìm kiếm Google về "${item.name}" trong tab mới`}
                              >
                                <Globe className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Google</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                              </a>

                              <button
                                onClick={() => setEditingItem({ ...item })}
                                className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                                title="Chỉnh sửa thông tin trước khi duyệt"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Sửa</span>
                              </button>

                              <button
                                onClick={() => handleRejectOne(item)}
                                disabled={isProcessingThis}
                                className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                                title="Từ chối nhập thuốc này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Từ chối</span>
                              </button>

                              <button
                                onClick={() => handleApproveOne(item)}
                                disabled={isProcessingThis}
                                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-98"
                              >
                                {isProcessingThis ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                <span>Duyệt &amp; Nhập Kho</span>
                              </button>
                            </div>
                          </div>

                          {/* Dosage info box */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            <div className="space-y-1">
                              <div className="text-slate-500 dark:text-slate-400">
                                <strong>Liều dùng chuẩn:</strong> Sáng {item.defaultDosage.morning}, Trưa{' '}
                                {item.defaultDosage.noon}, Chiều {item.defaultDosage.afternoon}, Tối{' '}
                                {item.defaultDosage.evening} ({item.unit}) • Thời điểm:{' '}
                                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                                  {item.defaultDosage.timing === 'sau_an'
                                    ? 'Sau ăn'
                                    : item.defaultDosage.timing === 'truoc_an'
                                    ? 'Trước ăn'
                                    : item.defaultDosage.timing === 'trong_an'
                                    ? 'Trong bữa ăn'
                                    : 'Trước ngủ'}
                                </span>{' '}
                                • {item.defaultDurationDays} ngày
                              </div>
                              <div className="text-slate-700 dark:text-slate-300 italic">
                                &ldquo;{item.defaultInstructions}&rdquo;
                              </div>
                            </div>

                            <div className="space-y-1">
                              {item.warningNote && (
                                <div className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded-md text-[11px]">
                                  <strong>Lưu ý:</strong> {item.warningNote}
                                </div>
                              )}
                              <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-2">
                                <span>Nguồn công khai: {item.source}</span>
                                <span>•</span>
                                <span>
                                  Cào lúc: {new Date(item.crawledAt).toLocaleTimeString('vi-VN')}{' '}
                                  {new Date(item.crawledAt).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          )}

          {/* ================= TAB 2: CÀI ĐẶT BOT CRAWLER ================= */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-5 max-w-3xl mx-auto">
              {/* Legal & Public Data Assurance Box */}
              <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-md p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-200">
                    Cam Kết Tuân Thủ Pháp Luật &amp; Dữ Liệu Mở Công Khai (Public Open Data)
                  </h4>
                  <p>
                    Bot chỉ truy xuất các <strong>thông tin danh mục thuốc được công bố công khai</strong> theo quy định của Luật Dược (tên thuốc, hoạt chất INN, hàm lượng, dạng bào chế, số đăng ký lưu hành) từ cổng công khai Cục Quản Lý Dược, Dược Thư Quốc Gia và OpenFDA API (CC0). Không thu thập dữ liệu cá nhân, không vượt rào bảo mật và bắt buộc qua bước <strong>Bác sĩ kiểm duyệt</strong> trước khi đưa vào danh mục phòng khám.
                  </p>
                </div>
              </div>

              {/* Daily Schedule Card */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-md border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      Lịch Chạy Tự Động Hàng Ngày
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Bot sẽ tự động thức dậy vào khung giờ cố định mỗi ngày để quét dữ liệu thuốc mới
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm.enabled}
                      onChange={(e) => {
                        const next = { ...settingsForm, enabled: e.target.checked };
                        setSettingsForm(next);
                        persistSettings(
                          next,
                          e.target.checked
                            ? `Đã BẬT lịch chạy tự động hàng ngày vào lúc ${next.dailyRunTime}!`
                            : 'Đã TẠM DỪNG lịch chạy tự động hàng ngày.'
                        );
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-md peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-md after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700" />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Giờ chạy định kỳ mỗi ngày (HH:mm)
                    </label>
                    <input
                      type="time"
                      value={settingsForm.dailyRunTime}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, dailyRunTime: e.target.value })
                      }
                      disabled={!settingsForm.enabled}
                      className="w-full px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 disabled:opacity-50"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[11px] text-slate-400 mr-1">Chọn nhanh:</span>
                      {[
                        { time: '06:00', label: '06:00 Sáng' },
                        { time: '12:00', label: '12:00 Trưa' },
                        { time: '18:00', label: '18:00 Chiều' },
                        { time: '22:00', label: '22:00 Tối' },
                      ].map((preset) => {
                        const isSelected = settingsForm.dailyRunTime === preset.time;
                        return (
                          <button
                            type="button"
                            key={preset.time}
                            disabled={isSavingSettings}
                            onClick={() => {
                              const next = { ...settingsForm, dailyRunTime: preset.time, enabled: true };
                              setSettingsForm(next);
                              persistSettings(
                                next,
                                `Đã cập nhật lịch chạy tự động mỗi ngày vào lúc ${preset.label}!`
                              );
                            }}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-800 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Số lượng thuốc thu thập mỗi đợt
                    </label>
                    <select
                      value={settingsForm.batchSize}
                      onChange={(e) => {
                        const next = {
                          ...settingsForm,
                          batchSize: Number(e.target.value),
                        };
                        setSettingsForm(next);
                        persistSettings(
                          next,
                          `Đã cập nhật số lượng thu thập: ${e.target.value} thuốc / đợt!`
                        );
                      }}
                      className="w-full px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      <option value={3}>3 loại thuốc / đợt</option>
                      <option value={5}>5 loại thuốc / đợt (Khuyến nghị)</option>
                      <option value={10}>10 loại thuốc / đợt</option>
                      <option value={20}>20 loại thuốc / đợt</option>
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Giới hạn số lượng vừa phải để tránh quá tải trang đích (Rate Limit) và giúp Bác sĩ duyệt kỹ lưỡng.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm.autoDiscardDuplicates}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          autoDiscardDuplicates: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-700"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      Tự động lọc trùng (Không đưa vào hàng chờ các thuốc đã có sẵn trong kho phòng khám)
                    </span>
                  </label>
                </div>
              </div>

              {/* Data Sources Card */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-md border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  Nguồn Dữ Liệu Công Khai Mục Tiêu
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'dav_gov_vn', label: 'Cục Quản Lý Dược Việt Nam (DAV - CSDL Công Khai)' },
                    { id: 'duoc_thu_quoc_gia', label: 'Dược Thư Quốc Gia Việt Nam (Bộ Y Tế)' },
                    { id: 'drugbank_vn', label: 'DrugBank VN & OpenFDA Public API' },
                    { id: 'ai_crawler', label: 'Trợ lý AI Tổng Hợp Dược Lý (Gemini)' },
                  ].map((src) => {
                    const checked = settingsForm.targetSources.includes(src.id);
                    return (
                      <label
                        key={src.id}
                        className={`p-3 rounded-md border flex items-center gap-2.5 cursor-pointer transition-all ${
                          checked
                            ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 text-slate-900 dark:text-white'
                            : 'border-slate-200 dark:border-slate-800 text-slate-500'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSettingsForm({
                                ...settingsForm,
                                targetSources: [...settingsForm.targetSources, src.id],
                              });
                            } else {
                              setSettingsForm({
                                ...settingsForm,
                                targetSources: settingsForm.targetSources.filter(
                                  (s) => s !== src.id
                                ),
                              });
                            }
                          }}
                          className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-700"
                        />
                        <span className="font-medium">{src.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Priority Categories */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-md border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Filter className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    Nhóm Bệnh Lý Ưu Tiên Cào Dữ Liệu
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSettingsForm({
                          ...settingsForm,
                          targetCategories: [...AVAILABLE_CATEGORIES],
                        })
                      }
                      className="text-[11px] text-emerald-700 hover:underline cursor-pointer"
                    >
                      Chọn tất cả
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSettingsForm({ ...settingsForm, targetCategories: [] })
                      }
                      className="text-[11px] text-slate-400 hover:underline cursor-pointer"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_CATEGORIES.map((cat) => {
                    const selected = settingsForm.targetCategories.includes(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => {
                          if (selected) {
                            setSettingsForm({
                              ...settingsForm,
                              targetCategories: settingsForm.targetCategories.filter(
                                (c) => c !== cat
                              ),
                            });
                          } else {
                            setSettingsForm({
                              ...settingsForm,
                              targetCategories: [...settingsForm.targetCategories, cat],
                            });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                          selected
                            ? 'bg-emerald-800 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {selected && <Check className="w-3 h-3 inline mr-1" />}
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white text-xs font-semibold rounded-md flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98"
                >
                  {isSavingSettings ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu cấu hình...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Lưu Cấu Hình Bot</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ================= TAB 3: NHẬT KÝ HOẠT ĐỘNG ================= */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Lịch Sử Các Lần Thu Thập Dữ Liệu Công Khai
                </h3>
                <button
                  onClick={() => loadAllData(true)}
                  disabled={isLoading}
                  className="text-xs text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  Làm mới
                </button>
              </div>

              {(!statusData?.recentLogs || statusData.recentLogs.length === 0) ? (
                <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                  Chưa có nhật ký hoạt động nào được ghi nhận.
                </div>
              ) : (
                <div className="space-y-2">
                  {statusData.recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-white dark:bg-slate-900 p-3.5 rounded-md border border-slate-200 dark:border-slate-800 flex items-start gap-3 text-xs"
                    >
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                          log.status === 'success'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : log.status === 'warning'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-emerald-300'
                        }`}
                      >
                        {log.status === 'success' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {log.triggerType === 'scheduled'
                              ? '⏰ Chạy Tự Động Định Kỳ Hàng Ngày'
                              : 'Chạy Thủ Công Theo Yêu Cầu'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(log.timestamp).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">{log.message}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span>Tìm thấy: {log.itemsFound}</span>
                          <span>•</span>
                          <span>Đưa vào chờ duyệt: {log.itemsAdded}</span>
                          <span>•</span>
                          <span>Bỏ qua trùng: {log.itemsSkipped}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span>
              Kho phòng khám hiện có: <strong className="text-emerald-700 dark:text-emerald-400">{clinicCatalog.length}</strong> thuốc
            </span>
            <span>•</span>
            <span>
              Chờ duyệt: <strong className="text-amber-600 dark:text-amber-400">{pendingItems.length}</strong>
            </span>
            {statusData && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">
                  Đã duyệt lịch sử: <strong>{statusData.approvedCount}</strong>
                </span>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md font-medium transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* INLINE EDIT MODAL FOR DRUG DETAILS */}
      {editingItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-md shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-700" />
                Chỉnh Sửa Thuốc Chờ Duyệt
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Tên biệt dược</label>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, name: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Hoạt chất</label>
                  <input
                    type="text"
                    value={editingItem.activeIngredient || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, activeIngredient: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Hàm lượng</label>
                  <input
                    type="text"
                    value={editingItem.strength}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, strength: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Dạng bào chế</label>
                  <input
                    type="text"
                    value={editingItem.form}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, form: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Đơn vị</label>
                  <input
                    type="text"
                    value={editingItem.unit}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, unit: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Nhóm điều trị</label>
                <select
                  value={editingItem.category}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, category: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {AVAILABLE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Hướng dẫn uống chuẩn</label>
                <textarea
                  rows={2}
                  value={editingItem.defaultInstructions}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, defaultInstructions: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Lưu ý &amp; Chống chỉ định</label>
                <input
                  type="text"
                  value={editingItem.warningNote || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, warningNote: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setEditingItem(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEditItem}
                className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-md text-xs font-semibold cursor-pointer"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
