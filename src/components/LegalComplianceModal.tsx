import React, { useState, useEffect, useMemo } from 'react';
import { ClinicSettings } from '../types/medical';
import {
  ShieldCheck,
  Scale,
  Globe,
  Lock,
  FileCheck2,
  AlertTriangle,
  X,
  CheckCircle2,
  Home,
  Sparkles,
  Database,
  History,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useSmartPagination } from '../hooks/useSmartPagination';
import { ClinicPaginationBar } from './ClinicPaginationBar';
import { matchesVietnameseSearch } from '../utils/vietnameseSearch';

interface LegalComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicInfo: ClinicSettings;
}

interface AuditLogEntry {
  timestamp: string;
  action: string;
  ip: string;
  status: string;
  userAgent?: string;
  details?: Record<string, unknown>;
}

export const LegalComplianceModal: React.FC<LegalComplianceModalProps> = ({
  isOpen,
  onClose,
  clinicInfo,
}) => {
  const [activeTab, setActiveTab] = useState<'vn' | 'ai_transparency' | 'intl' | 'privacy_policy' | 'audit_logs'>('vn');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [auditSearchTerm, setAuditSearchTerm] = useState('');

  // 0ms in-memory search for Audit Logs
  const filteredAuditLogs = useMemo(() => {
    if (!auditSearchTerm.trim()) return auditLogs;
    return auditLogs.filter((log) => {
      const detailsStr = log.details ? JSON.stringify(log.details) : '';
      const text = `${log.action} ${log.ip} ${log.status} ${log.timestamp} ${log.userAgent || ''} ${detailsStr}`;
      return matchesVietnameseSearch(text, auditSearchTerm);
    });
  }, [auditLogs, auditSearchTerm]);

  const auditPagination = useSmartPagination<AuditLogEntry>({
    items: filteredAuditLogs,
    initialPageSize: 20,
    resetDependencies: [auditSearchTerm],
  });

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const fetchAuditLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/security/audit-logs');
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setAuditLogs(data.logs);
      }
    } catch (err) {
      console.error('Không thể tải nhật ký audit logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'audit_logs') {
      fetchAuditLogs();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 dark:bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-4xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 flex flex-col max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-emerald-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20 shrink-0">
              <Scale className="w-5 h-5 text-emerald-300" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="legal-modal-title" className="text-base sm:text-lg font-black tracking-tight text-white">
                  Kiểm Định Pháp Lý Y Tế Việt Nam &amp; An Ninh Mạng
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-emerald-500/20 text-emerald-200 border border-emerald-400/40">
                  Chuẩn Luật 91/2025/QH15 &amp; 116/2025/QH15
                </span>
              </div>
              <p className="text-xs text-emerald-100/90">
                Tuân thủ Luật Khám bệnh, chữa bệnh 15/2023, Luật Bảo vệ Dữ liệu Cá nhân 91/2025, Luật An ninh mạng 116/2025 &amp; Chuẩn Đơn Thuốc Bộ Y Tế
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ pháp lý"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 px-4 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          {[
            { id: 'vn' as const, label: '1. Pháp Luật Y Tế & Dữ Liệu Cá Nhân', icon: FileCheck2 },
            { id: 'ai_transparency' as const, label: '2. Minh Bạch AI Lâm Sàng', icon: Sparkles },
            { id: 'privacy_policy' as const, label: '3. Quyền Bệnh Nhân & Bảo Mật', icon: ShieldCheck },
            { id: 'audit_logs' as const, label: '4. Nhật Ký An Ninh Mạng (Audit)', icon: History },
            { id: 'intl' as const, label: '5. Chuẩn Quốc Tế (WHO/HIPAA)', icon: Globe },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[34px] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-5 text-xs sm:text-sm">
          {/* TAB 1: PHÁP LUẬT VIỆT NAM (BYT & LUẬT BẢO VỆ DỮ LIỆU CÁ NHÂN 2025) */}
          {activeTab === 'vn' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <span>Kê Đơn Thuốc Hợp Chuẩn Theo Thông Tư 52/2017/TT-BYT &amp; 04/2022/TT-BYT</span>
                </div>
                <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                  <li>
                    <strong>Ghi tên biệt dược kèm tên chung quốc tế (Khoản 3 Điều 6 TT 52/2017/TT-BYT):</strong> Mọi thuốc trong đơn in đều ghi rõ tên thương mại, tên hoạt chất quốc tế (INN), hàm lượng, dạng bào chế và đường dùng.
                  </li>
                  <li>
                    <strong>Quy tắc chữ số 0 phía trước số lượng nhỏ hơn 10 (Khoản 4 Điều 6 TT 52/2017/TT-BYT):</strong> Tự động định dạng <code>05 viên</code>, <code>07 gói</code> nhằm chống sửa chữa, gian lận số lượng thuốc sau khi in.
                  </li>
                  <li>
                    <strong>Dòng khóa cuối đơn thuốc (Khoản 6 Điều 6 TT 52/2017/TT-BYT):</strong> Tự động chèn dòng khóa: <em>&quot;--- Cộng khoản: 0X thuốc ---&quot;</em> ngăn chèn thêm thuốc trái phép.
                  </li>
                  <li>
                    <strong>Người bệnh &lt; 72 tháng tuổi:</strong> Bắt buộc có thông tin cân nặng, họ tên người đưa trẻ đi khám và liên hệ giám hộ.
                  </li>
                  <li>
                    <strong>Chứng chỉ hành nghề &amp; Giấy phép hoạt động:</strong> Phân biệt rõ CCHN Bác sĩ ({clinicInfo.doctorTitle} {clinicInfo.doctorName} - {clinicInfo.practicingCertificate || '04512/HCM-CCHN'}) và GPHĐ Phòng khám ({clinicInfo.licenseNumber}).
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-200">
                  <Lock className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                  <span>Bảo Vệ Dữ Liệu Y Tế Nhạy Cảm (Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15 &amp; NĐ 356/2025/NĐ-CP)</span>
                </div>
                <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                  <li>
                    <strong>Phân loại dữ liệu cá nhân nhạy cảm:</strong> Theo Luật số 91/2025/QH15, hồ sơ bệnh án, tiền sử bệnh lý, kết quả khám, chỉ số sinh hiệu và đơn thuốc của bệnh nhân là dữ liệu cá nhân nhạy cảm, áp dụng mức bảo vệ an toàn cao nhất.
                  </li>
                  <li>
                    <strong>Nguyên tắc đồng ý tự nguyện:</strong> Hệ thống yêu cầu ghi nhận sự đồng ý tự nguyện của bệnh nhân hoặc người giám hộ khi tạo mới hồ sơ bệnh án.
                  </li>
                  <li>
                    <strong>Kiến trúc Local-First / On-Premise:</strong> 100% dữ liệu hồ sơ được lưu trữ cục bộ trên ổ cứng máy chủ phòng khám (<code>server_data/clinic_db.json</code>) và mạng LAN nội bộ, không tải lên cloud của bên thứ ba trái phép.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: MINH BẠCH TRÍ TUỆ NHÂN TẠO (AI TRANSPARENCY - vn-law-check 07-ai-transparency.md) */}
          {activeTab === 'ai_transparency' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-3">
                <div className="flex items-center gap-2 font-bold text-purple-950 dark:text-purple-200">
                  <Sparkles className="w-4 h-4 text-purple-700 dark:text-purple-400 shrink-0" />
                  <span>Tuyên Bố Minh Bạch Trí Tuệ Nhân Tạo (Gemini Clinical AI Copilot)</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Hệ thống tích hợp mô hình ngôn ngữ lớn y khoa (Google Gemini AI) để hỗ trợ Bác sĩ tra cứu dược lý, kiểm tra tương tác thuốc và gợi ý phác đồ điều trị. Nhằm tuân thủ nguyên tắc minh bạch công nghệ theo chuẩn <strong>vn-law-check (07-ai-transparency)</strong>:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-purple-100 dark:border-purple-900/50 space-y-1">
                    <div className="font-bold text-xs text-purple-900 dark:text-purple-300">
                      Vai Trò Hỗ Trợ Lâm Sàng (CDS)
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      AI chỉ đóng vai trò tham khảo và hỗ trợ quyết định (Clinical Decision Support). AI <strong>KHÔNG</strong> thay thế chẩn đoán y khoa của Bác sĩ.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-purple-100 dark:border-purple-900/50 space-y-1">
                    <div className="font-bold text-xs text-purple-900 dark:text-purple-300">
                      Trách Nhiệm Pháp Lý Lâm Sàng
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Bác sĩ kê đơn ({clinicInfo.doctorName}) chịu trách nhiệm chuyên môn và pháp lý độc lập cuối cùng đối với mọi chỉ định dùng thuốc cho người bệnh.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-purple-100 dark:border-purple-900/50 space-y-1">
                    <div className="font-bold text-xs text-purple-900 dark:text-purple-300">
                      Khử Định Danh Tự Động (De-identification)
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Khi gửi dữ liệu lên AI, hệ thống tự động loại bỏ Họ tên thật, SĐT, Địa chỉ và Số thẻ BHYT. Chỉ gửi tuổi, giới tính và thông tin lâm sàng mã hóa.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-purple-100 dark:border-purple-900/50 space-y-1">
                    <div className="font-bold text-xs text-purple-900 dark:text-purple-300">
                      Nguồn Dữ Liệu Đối Soát Y Khoa
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Căn cứ trên Dược Thư Quốc Gia Việt Nam, CSDL Cục Quản Lý Dược (DAV), DrugBank VN và Hướng dẫn điều trị chuẩn của Bộ Y Tế.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CHÍNH SÁCH BẢO MẬT & QUYỀN BỆNH NHÂN (vn-law-check 10-generate-policy.md) */}
          {activeTab === 'privacy_policy' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Quyền Của Chủ Thể Dữ Liệu (Bệnh Nhân) Theo Luật 91/2025/QH15</span>
                </div>
                <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <p>
                    Phòng khám cam kết tôn trọng và bảo vệ đầy đủ các quyền hợp pháp của người bệnh đối với dữ liệu cá nhân y tế:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 pl-2">
                    <li><strong>Quyền được biết &amp; đồng ý:</strong> Người bệnh được thông báo rõ về mục đích thu thập và sử dụng dữ liệu y tế.</li>
                    <li><strong>Quyền tra cứu &amp; chỉnh sửa:</strong> Bệnh nhân có quyền yêu cầu Bác sĩ kiểm tra, cập nhật hoặc điều chỉnh tiền sử dị ứng, bệnh mạn tính.</li>
                    <li><strong>Quyền trích xuất hồ sơ (Data Portability):</strong> Bệnh nhân được cung cấp bản in đơn thuốc hoặc trích xuất dữ liệu khám bệnh định dạng chuẩn JSON/PDF.</li>
                    <li><strong>Quyền yêu cầu xóa/hạn chế:</strong> Thực hiện theo quy định về thời hạn bảo quản hồ sơ bệnh án ngoại trú (tối thiểu 10 năm theo Luật Khám bệnh, chữa bệnh).</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-950 dark:text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Bảo Mật Mạng LAN Nội Bộ &amp; Chống Tấn Công Dò Mã PIN</span>
                </div>
                <p className="text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
                  1. Hệ thống chỉ cho phép các thiết bị (iPhone, iPad, máy tính) kết nối chung mạng Wi-Fi gia đình / phòng khám truy cập đồng bộ dữ liệu.
                  <br />
                  2. Cơ chế khóa mã PIN bảo mật tích hợp tính năng chống Brute-force: Nếu nhập sai quá 5 lần liên tiếp, hệ thống tự động tạm khóa 30 giây và ghi nhận vào nhật ký an ninh mạng.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: NHẬT KÝ AN NINH MẠNG (AUDIT LOGS - ĐIỀU 16 NGHỊ ĐỊNH 333/2026/NĐ-CP) */}
          {activeTab === 'audit_logs' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-600" />
                    <span>Nhật Ký Truy Cập &amp; An Ninh Hệ Thống (Audit Logs)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {filteredAuditLogs.length} sự kiện
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Lưu trữ theo Điều 16 Nghị định 333/2026/NĐ-CP (Tối thiểu 12 tháng)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-48 sm:w-60">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm action, IP, trạng thái..."
                      value={auditSearchTerm}
                      onChange={(e) => setAuditSearchTerm(e.target.value)}
                      className="w-full pl-7 pr-3 py-1 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={fetchAuditLogs}
                    disabled={isLoadingLogs}
                    className="px-3 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-800 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                    <span>Làm mới</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xs">
                <div className="max-h-[360px] overflow-y-auto font-mono text-[11px] p-3 space-y-2 text-slate-300">
                  {filteredAuditLogs.length === 0 ? (
                    <div className="text-slate-500 text-center py-6">
                      {auditSearchTerm ? 'Không tìm thấy sự kiện nào khớp với từ khóa tìm kiếm.' : 'Chưa có sự kiện an ninh nào được ghi nhận gần đây.'}
                    </div>
                  ) : (
                    auditPagination.paginatedItems.map((log, idx) => (
                      <div key={idx} className="p-2 rounded bg-slate-950/80 border border-slate-800/80 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">{log.timestamp}</span>
                          <span className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                            log.status === 'SUCCESS'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : log.status === 'BLOCKED'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-bold">{log.action}</span>
                          <span className="text-slate-500">IP: {log.ip}</span>
                        </div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="text-[10px] text-slate-400 truncate">
                            Chi tiết: {JSON.stringify(log.details)}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {filteredAuditLogs.length > 0 && (
                <ClinicPaginationBar
                  pagination={auditPagination}
                  pageSizeOptions={[10, 20, 50]}
                  itemLabel="sự kiện an ninh"
                />
              )}
            </div>
          )}

          {/* TAB 5: CHUẨN QUỐC TẾ */}
          {activeTab === 'intl' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200">
                  <Globe className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <span>Tiêu Chuẩn Y Khoa &amp; An Toàn Quốc Tế (WHO, HIPAA, GDPR, FDA CDS)</span>
                </div>
                <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                  <li>
                    <strong>WHO &amp; JCI IPSG:</strong> Tích hợp kiểm tra dị ứng chéo thời gian thực (Beta-lactam, NSAID, Paracetamol) ngay khi chọn thuốc.
                  </li>
                  <li>
                    <strong>HIPAA Safe Harbor &amp; GDPR:</strong> Quyền sao lưu dữ liệu toàn vẹn (JSON Backup/Export) và xóa hồ sơ theo quy định.
                  </li>
                  <li>
                    <strong>ICD-10 &amp; INN:</strong> Hệ thống mã hóa bệnh tật quốc tế và tên hoạt chất chuẩn của Tổ chức Y tế Thế giới (WHO).
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
            <span>Đã kiểm tra tuân thủ: Pháp luật Việt Nam &amp; An ninh mạng 2026</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
          >
            Đã Hiểu &amp; Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
