import React, { useState } from 'react';
import {
  Mail,
  X,
  ExternalLink,
  RefreshCw,
  Search,
  Paperclip,
  CheckCircle2,
  Send,
  User,
  Clock,
  FileCheck,
} from 'lucide-react';

export interface ClinicEmail {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  date: string;
  category: 'xet_nghiem' | 'benh_nhan' | 'duoc_pham' | 'khac';
  unread: boolean;
  hasAttachment?: boolean;
  attachmentName?: string;
  body: string;
}

const INITIAL_CLINIC_EMAILS: ClinicEmail[] = [
  {
    id: 'mail-1',
    sender: 'Trung Tâm Xét Nghiệm Medic Hòa Hảo',
    senderEmail: 'results@medic-hoahao.vn',
    subject: 'Kết quả sinh hóa máu & ECG: Bệnh nhân Nguyễn Văn An (MBN: BN-001)',
    snippet: 'Kính gửi BS. Trần Văn Diệu, đính kèm kết quả xét nghiệm Glucose: 7.2 mmol/L, HbA1c: 6.8%, Creatinine: 88 umol/L...',
    date: 'Hôm nay, 08:30',
    category: 'xet_nghiem',
    unread: true,
    hasAttachment: true,
    attachmentName: 'Ket_Qua_Xet_Nghiem_BN_Nguyen_Van_An_2026.pdf',
    body: `Kính gửi Bác Sĩ Trần Văn Diệu,

Trung Tâm Xét Nghiệm Medic Hòa Hảo xin gửi kết quả xét nghiệm chỉ định của bệnh nhân Nguyễn Văn An (Nam, sinh năm 1958):
- Đường huyết lúc đói (Glucose): 7.2 mmol/L (Tham chiếu: 3.9 - 6.4)
- HbA1c: 6.8% (Mục tiêu kiểm soát < 7.0%)
- Cholesterol toàn phần: 5.4 mmol/L
- Triglyceride: 2.1 mmol/L
- HDL-C: 1.1 mmol/L
- LDL-C: 3.3 mmol/L
- Creatinine: 88 umol/L (eGFR: 78 ml/min/1.73m2)
- Điện tâm đồ ECG: Nhịp xoang đều, tần số 72 chu kỳ/phút, dày thất trái nhẹ.

BS.CKII Lê Hoàng Nam - Trưởng Khoa Xét Nghiệm.`,
  },
  {
    id: 'mail-2',
    sender: 'Bệnh nhân Lê Thị Mai (Con gái gửi)',
    senderEmail: 'maile.family@gmail.com',
    subject: 'Nhờ Bác Sĩ Diệu tư vấn huyết áp sáng nay của Mẹ',
    snippet: 'Dạ chào Bác Diệu, sáng nay mẹ con đo huyết áp lúc 7h là 138/85 mmHg, uống viên Amlor xong thấy người khỏe...',
    date: 'Hôm nay, 07:45',
    category: 'benh_nhan',
    unread: true,
    hasAttachment: false,
    body: `Dạ chào Bác Sĩ Diệu,

Mẹ con là Lê Thị Mai (71 tuổi), đang uống thuốc theo đơn của Bác Diệu kê tuần trước (Amlor 5mg + Lipitor 20mg).
Sáng nay con đo huyết áp cho mẹ là 138/85 mmHg, mạch 74. Mẹ ăn uống ngon miệng và không còn chóng mặt khi thức dậy nữa.
Mẹ con nhờ gửi lời cảm ơn Bác Diệu. Bác cho con hỏi thứ Hai tuần sau phòng khám có khám buổi chiều không để con đưa mẹ tái khám lấy thêm toa 1 tháng ạ.

Con cảm ơn Bác Diệu nhiều!`,
  },
  {
    id: 'mail-3',
    sender: 'Công Ty CP Dược Hậu Giang (DHG Pharma)',
    senderEmail: 'distribution@dhgpharma.com.vn',
    subject: 'Xác nhận đơn đặt hàng bổ sung kho thuốc phòng khám BS. Trần Văn Diệu',
    snippet: 'Kính gửi BS. Diệu, đơn hàng 10 hộp Hapacol 650mg, 5 hộp Klamentin 1g, 8 hộp Gliclazide 30mg đã được bàn giao...',
    date: 'Hôm qua, 15:20',
    category: 'duoc_pham',
    unread: false,
    hasAttachment: true,
    attachmentName: 'Hoa_Don_Giao_Hang_DHG_2810.pdf',
    body: `Kính gửi Bác Sĩ Trần Văn Diệu - Phòng Khám BS. Diệu,

Bộ phận phân phối DHG Pharma xác nhận đã điều phối đơn hàng dược phẩm bổ sung:
- Hapacol 650mg (Paracetamol): 10 hộp
- Klamentin 1g (Amoxicillin + Clavulanic): 5 hộp
- Gliclazide 30mg phóng thích kéo dài: 8 hộp
- Hạn sử dụng: 2028 - 2029.
Đội ngũ giao hàng sẽ chuyển trực tiếp đến địa chỉ phòng khám vào 09:00 sáng mai.

Trân trọng kính báo.`,
  },
  {
    id: 'mail-4',
    sender: 'Hội Tim Mạch Học TP.HCM',
    senderEmail: 'bantin@vnha-hcmc.org.vn',
    subject: 'Bản tin Cập nhật Hướng dẫn Điều trị Tăng huyết áp & Suy thận sớm 2026',
    snippet: 'Kính gửi Quý Bác sĩ thành viên, Hội Tim Mạch trân trọng gửi tài liệu đồng thuận lâm sàng về phối hợp sớm CCB + ARB...',
    date: '26 Th10',
    category: 'khac',
    unread: false,
    hasAttachment: true,
    attachmentName: 'Dong_Thuan_Dieu_Tri_THA_2026.pdf',
    body: `Kính gửi Quý Bác Sĩ Trần Văn Diệu,

Hội Tim Mạch Học trân trọng kính gửi tài liệu cập nhật: "Chiến lược can thiệp sớm và bảo vệ cơ quan đích ở bệnh nhân Tăng huyết áp có nguy cơ tim mạch cao".
Trọng tâm: Khuyến cáo khởi đầu phác đồ phối hợp liều cố định (Single-pill combination) giữa Chẹn kênh Canxi (Amlodipine) và Chẹn thụ thể Angiotensin II (Losartan/Telmisartan) giúp tăng tỷ lệ tuân thủ điều trị lên 34%.

Ban Thư Ký Hội Tim Mạch Học TP.HCM.`,
  },
];

interface GmailInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

export const GmailInboxModal: React.FC<GmailInboxModalProps> = ({
  isOpen,
  onClose,
  userEmail,
}) => {
  const [emails, setEmails] = useState<ClinicEmail[]>(INITIAL_CLINIC_EMAILS);
  const [selectedEmail, setSelectedEmail] = useState<ClinicEmail | null>(INITIAL_CLINIC_EMAILS[0]);
  const [filterCategory, setFilterCategory] = useState<'all' | 'xet_nghiem' | 'benh_nhan' | 'duoc_pham'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplySent, setShowReplySent] = useState(false);

  if (!isOpen) return null;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const handleSelectMail = (mail: ClinicEmail) => {
    setSelectedEmail(mail);
    if (mail.unread) {
      setEmails(emails.map((m) => (m.id === mail.id ? { ...m, unread: false } : m)));
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setShowReplySent(true);
    setTimeout(() => {
      setShowReplySent(false);
      setReplyText('');
    }, 2000);
  };

  const filteredEmails = emails.filter((mail) => {
    const matchesCategory = filterCategory === 'all' || mail.category === filterCategory;
    const matchesSearch =
      mail.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mail.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mail.snippet.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const unreadCount = emails.filter((m) => m.unread).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-md max-w-5xl w-full shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden my-4 flex flex-col h-[88vh]">
        {/* Header Contract: 1 row, clean typography, 44px hit targets */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white px-5 py-3.5 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-emerald-800 dark:bg-emerald-700 flex items-center justify-center text-emerald-200 border border-emerald-600 shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">
                  Hộp Thư Phòng Khám
                </h2>
                <span className="text-xs text-emerald-300 font-mono">
                  {userEmail || 'tranminhhuy3031998@gmail.com'}
                </span>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-red-600/30 text-emerald-200 border border-emerald-500/40">
                    {unreadCount} chưa đọc
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <span>Google Workspace Sync</span>
                <span>·</span>
                <span>Kết nối trực tiếp hộp thư Bác Sĩ Trần Văn Diệu</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://mail.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] px-3.5 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/20 focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <span>Mở Gmail Web</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={onClose}
              type="button"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-rose-400"
              aria-label="Đóng hộp thư"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search, Filters & Refresh */}
        <div className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setFilterCategory('all')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors border ${
                filterCategory === 'all'
                  ? 'bg-emerald-800 dark:bg-emerald-700 text-white border-emerald-900 dark:border-emerald-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200/80 dark:border-slate-700'
              }`}
            >
              Tất cả thư ({emails.length})
            </button>
            <button
              onClick={() => setFilterCategory('xet_nghiem')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors border ${
                filterCategory === 'xet_nghiem'
                  ? 'bg-emerald-800 dark:bg-emerald-700 text-white border-emerald-900 dark:border-emerald-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200/80 dark:border-slate-700'
              }`}
            >
              Kết quả xét nghiệm
            </button>
            <button
              onClick={() => setFilterCategory('benh_nhan')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors border ${
                filterCategory === 'benh_nhan'
                  ? 'bg-emerald-800 dark:bg-emerald-700 text-white border-emerald-900 dark:border-emerald-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200/80 dark:border-slate-700'
              }`}
            >
              Bệnh nhân liên hệ
            </button>
            <button
              onClick={() => setFilterCategory('duoc_pham')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors border ${
                filterCategory === 'duoc_pham'
                  ? 'bg-emerald-800 dark:bg-emerald-700 text-white border-emerald-900 dark:border-emerald-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200/80 dark:border-slate-700'
              }`}
            >
              Dược phẩm &amp; Kho thuốc
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm người gửi, bệnh nhân, nội dung..."
                className="min-h-[40px] pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-700 w-56 sm:w-64"
              />
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="min-h-[40px] px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md border border-slate-200/80 dark:border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Làm mới hộp thư"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-700 dark:text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
          </div>
        </div>

        {/* 2-Pane Split: Email List & Email Preview */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Email List */}
          <div className="w-full md:w-5/12 border-r border-slate-200/80 dark:border-slate-800 overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
            {filteredEmails.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                Không tìm thấy thư nào phù hợp với bộ lọc.
              </div>
            ) : (
              filteredEmails.map((mail) => {
                const isSelected = selectedEmail?.id === mail.id;
                return (
                  <button
                    key={mail.id}
                    onClick={() => handleSelectMail(mail)}
                    className={`w-full text-left p-3.5 transition-colors flex flex-col gap-1.5 focus:outline-hidden ${
                      isSelected
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-l-4 border-emerald-800 dark:border-emerald-500'
                        : mail.unread
                        ? 'bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`truncate font-semibold max-w-[210px] ${
                          mail.unread ? 'text-slate-950 dark:text-white font-bold' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {mail.sender}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono shrink-0">
                        {mail.date}
                      </span>
                    </div>

                    <div
                      className={`text-xs truncate ${
                        mail.unread ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-800 dark:text-slate-200 font-medium'
                      }`}
                    >
                      {mail.subject}
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {mail.snippet}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="capitalize text-slate-600 dark:text-slate-400 font-medium">
                        {mail.category === 'xet_nghiem'
                          ? 'Xét nghiệm'
                          : mail.category === 'benh_nhan'
                          ? 'Bệnh nhân'
                          : mail.category === 'duoc_pham'
                          ? 'Dược phẩm'
                          : 'Thông báo'}
                      </span>
                      {mail.hasAttachment && (
                        <span className="flex items-center gap-1 text-emerald-800 dark:text-emerald-400 font-medium">
                          <Paperclip className="w-3 h-3" />
                          <span>PDF</span>
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right: Email Detail View & Quick Reply */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-950/60 p-5 flex flex-col justify-between">
            {selectedEmail ? (
              <div className="space-y-4">
                {/* Email Header */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-md border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {selectedEmail.subject}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{selectedEmail.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-md bg-emerald-800 dark:bg-emerald-700 text-white flex items-center justify-center font-bold border border-emerald-600">
                        {selectedEmail.sender.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">{selectedEmail.sender}</div>
                        <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {selectedEmail.senderEmail}
                        </div>
                      </div>
                    </div>

                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Gửi đến: <strong className="text-slate-800 dark:text-slate-200">BS. Trần Văn Diệu</strong>
                    </span>
                  </div>

                  {selectedEmail.hasAttachment && (
                    <div className="pt-2">
                      <div className="p-2.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                          <span className="font-semibold font-mono text-[11px]">
                            {selectedEmail.attachmentName}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            alert(
                              `Đã mở tệp đính kèm: ${selectedEmail.attachmentName}\nDữ liệu xét nghiệm đã sẵn sàng đối chiếu cùng Trợ lý Gemini AI!`
                            )
                          }
                          className="min-h-[36px] px-3 py-1 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-md font-bold text-xs shadow-2xs border border-emerald-700 dark:border-emerald-500"
                        >
                          Xem tệp kết quả
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Email Content Body */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-md border border-slate-200/80 dark:border-slate-800 shadow-2xs text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-normal">
                  {selectedEmail.body}
                </div>

                {/* Quick Reply Form */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-md border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    <span>Trả lời nhanh thư này:</span>
                  </div>

                  <form onSubmit={handleSendReply} className="space-y-2.5">
                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Nhập nội dung trả lời cho bệnh nhân hoặc đơn vị gửi..."
                      className="w-full p-3 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                    />

                    <div className="flex items-center justify-between">
                      {showReplySent ? (
                        <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          Đã gửi phản hồi thành công qua Gmail!
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Thư sẽ được gửi bằng địa chỉ: {userEmail || 'tranminhhuy3031998@gmail.com'}
                        </span>
                      )}

                      <button
                        type="submit"
                        disabled={!replyText.trim()}
                        className="min-h-[44px] px-5 py-2 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 border border-emerald-700 dark:border-emerald-500"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Gửi phản hồi</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Chọn một thư ở danh sách bên trái để đọc chi tiết.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
