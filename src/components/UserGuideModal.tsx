import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Printer,
  Search,
  CheckCircle,
  Zap,
  Stethoscope,
  Pill,
  Users,
  Sparkles,
  ShieldAlert,
  Download,
  Activity,
  Calendar,
  FileText,
} from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenShortcuts?: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenShortcuts,
}) => {
  const [activeSection, setActiveSection] = useState<string>('intro');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const sections = [
    { id: 'intro', title: '1. Giới Thiệu & Triết Lý Zero-Mouse', icon: Zap },
    { id: 'shortcuts', title: '2. Bảng Phím Tắt Thần Tốc', icon: FileText },
    { id: 'prescription_flow', title: '3. Quy Trình Kê Đơn 30 Giây', icon: Stethoscope },
    { id: 'patients', title: '4. Quản Lý Hồ Sơ Bệnh Nhân', icon: Users },
    { id: 'pharmacy', title: '5. Danh Mục Kho Dược & Lịch Uống', icon: Pill },
    { id: 'print_guide', title: '6. In Ấn Toa & Bảng Nhắc Lịch Uống', icon: Printer },
    { id: 'clinical_ai', title: '7. Trợ Lý AI Lâm Sàng Gemini', icon: Sparkles },
    { id: 'backup_faq', title: '8. Sao Lưu Dữ Liệu & Câu Hỏi Thường Gặp', icon: Activity },
  ];

  const handlePrintGuide = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 dark:bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-5xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 flex flex-col max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-emerald-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
              <BookOpen className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>Tài Liệu Hướng Dẫn Sử Dụng Phòng Khám</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-700/80 text-emerald-100 border border-emerald-500/50">
                  BS. Trần Văn Diệu
                </span>
              </h2>
              <p className="text-xs text-emerald-200/90 font-medium">
                Cẩm nang toàn diện: Vận hành phòng khám, kê đơn nhanh bằng bàn phím & in lịch uống thuốc
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintGuide}
              className="h-8 px-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
              title="In tài liệu này"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">In Tài Liệu</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-md flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Đóng hướng dẫn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar inside doc */}
        <div className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 px-5 py-2 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm nội dung hướng dẫn (ví dụ: phím tắt, in toa, huyết áp...)"
              className="w-full pl-8 pr-3 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {onOpenShortcuts && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenShortcuts();
              }}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Xem Bảng Tra Cứu Phím Tắt Nhanh [?]</span>
            </button>
          )}
        </div>

        {/* Content with Sidebar Layout */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Sidebar Menu */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3 overflow-y-auto shrink-0 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-2 py-1">
              Mục lục hướng dẫn
            </div>
            {sections.map((sec) => {
              const IconComp = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-xs font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                  }`}
                >
                  <IconComp className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-200' : 'text-slate-400'}`} />
                  <span className="truncate">{sec.title}</span>
                </button>
              );
            })}
          </div>

          {/* Main Reading Pane */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6 text-slate-800 dark:text-slate-200 text-sm leading-relaxed">
            {/* Section 1: Intro */}
            {activeSection === 'intro' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                    1. Giới Thiệu Hệ Thống &amp; Triết Lý "Zero-Mouse Workflow"
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Phần mềm quản lý kê đơn phòng khám chuyên nghiệp dành cho Bác Sĩ Trần Văn Diệu
                  </p>
                </div>

                <p>
                  Trong môi trường phòng khám bận rộn với hàng chục lượt bệnh nhân mỗi ngày, việc bác sĩ phải liên tục rời tay khỏi bàn phím để cầm chuột bấm qua lại các ô nhập liệu gây mỏi cổ tay và làm chậm tốc độ khám bệnh đáng kể.
                </p>

                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-md border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-2">
                  <strong className="text-sm font-bold block">🎯 Mục tiêu thiết kế "Zero-Mouse":</strong>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Bác sĩ có thể hoàn thành trọn vẹn 1 đơn thuốc từ A đến Z chỉ bằng bàn phím.</li>
                    <li>Phím bấm <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded font-mono font-bold shadow-2xs">F2</kbd> chuyển ngay con trỏ sang ô tìm kiếm thuốc.</li>
                    <li>Phím mũi tên <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded font-mono font-bold shadow-2xs">↓</kbd> / <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded font-mono font-bold shadow-2xs">↑</kbd> và <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded font-mono font-bold shadow-2xs">Enter</kbd> thêm thuốc tức thì.</li>
                    <li>Tổ hợp <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded font-mono font-bold shadow-2xs">Ctrl + Enter</kbd> vừa lưu đơn vào hệ thống vừa mở lệnh in ngay lập tức.</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-white dark:bg-slate-800/60 rounded-md border border-slate-200 dark:border-slate-700 space-y-1">
                    <strong className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-emerald-600" />
                      Tiết kiệm 80% thời gian
                    </strong>
                    <p className="text-slate-600 dark:text-slate-400">Không phải rê chuột dò tìm thuốc, gõ 2-3 ký tự là thuốc đã sẵn sàng trong toa.</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-800/60 rounded-md border border-slate-200 dark:border-slate-700 space-y-1">
                    <strong className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      Cảnh báo an toàn thuốc
                    </strong>
                    <p className="text-slate-600 dark:text-slate-400">Tự động đối chiếu dị ứng bệnh nhân và kiểm tra tương tác thuốc nguy hiểm qua AI.</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-800/60 rounded-md border border-slate-200 dark:border-slate-700 space-y-1">
                    <strong className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Printer className="w-4 h-4 text-blue-600" />
                      In toa & Lịch uống A4/A5
                    </strong>
                    <p className="text-slate-600 dark:text-slate-400">Đầy đủ biểu tượng trực quan Sáng ☀️, Trưa 🌤️, Chiều 🌇, Tối 🌙 cho người cao tuổi dễ hiểu.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Section 2: Shortcuts */}
            {activeSection === 'shortcuts' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                    2. Bảng Tổng Hợp Phím Tắt Thao Tác Nhanh
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Ghi nhớ các phím tắt chính sau đây để thao tác như một chuyên gia
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                      <tr>
                        <th className="p-2.5 border-b border-slate-200 dark:border-slate-700">Phím Tắt</th>
                        <th className="p-2.5 border-b border-slate-200 dark:border-slate-700">Chức Năng</th>
                        <th className="p-2.5 border-b border-slate-200 dark:border-slate-700">Mô Tả &amp; Lưu Ý</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      <tr className="bg-emerald-50/40 dark:bg-emerald-950/20 font-medium">
                        <td className="p-2.5 font-mono font-bold text-emerald-800 dark:text-emerald-300">
                          <kbd className="px-2 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 shadow-2xs">F2</kbd> hoặc <kbd className="px-2 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 shadow-2xs">/</kbd>
                        </td>
                        <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">Tìm kiếm thuốc</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">Nhảy ngay vào ô tìm kiếm thuốc trong kho dược, bôi đen từ khóa cũ.</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold">
                          <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">↓</kbd> / <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">↑</kbd>
                        </td>
                        <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">Chọn thuốc</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">Di chuyển vệt sáng chọn các thuốc hiển thị sau khi gõ tìm kiếm.</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold">
                          <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">Enter</kbd>
                        </td>
                        <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">Thêm thuốc vào toa</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">Đưa thuốc đang chọn vào toa với liều dùng chuẩn mặc định.</td>
                      </tr>
                      <tr className="bg-amber-50/30 dark:bg-amber-950/10">
                        <td className="p-2.5 font-mono font-bold text-amber-800 dark:text-amber-300">
                          <kbd className="px-2 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 shadow-2xs">Alt + T</kbd>
                        </td>
                        <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">Thêm thuốc tự do</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">Tạo một dòng thuốc mới để tự gõ tên và liều lượng tự do.</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold">
                          <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">F1</kbd> / <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">Alt + B</kbd>
                        </td>
                        <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">Tìm bệnh nhân</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">Nhảy vào ô tìm bệnh nhân theo tên, SĐT hoặc mã BN.</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold">
                          <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">F3</kbd> / <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">Alt + N</kbd>
                        </td>
                        <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">Bệnh nhân mới</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">Mở pop-up tiếp nhận hồ sơ bệnh nhân mới.</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold">
                          <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">F4</kbd> / <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">Alt + D</kbd>
                        </td>
                        <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">Chẩn đoán bệnh</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">Nhảy thẳng vào ô nhập chẩn đoán lâm sàng &amp; ICD-10.</td>
                      </tr>
                      <tr className="bg-emerald-50/40 dark:bg-emerald-950/20">
                        <td className="p-2.5 font-mono font-bold text-emerald-800 dark:text-emerald-300">
                          <kbd className="px-2 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 shadow-2xs">Ctrl + S</kbd>
                        </td>
                        <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">Lưu đơn thuốc</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">Lưu đơn thuốc vào hồ sơ phòng khám (không mở máy in).</td>
                      </tr>
                      <tr className="bg-emerald-100/60 dark:bg-emerald-900/40">
                        <td className="p-2.5 font-mono font-bold text-emerald-950 dark:text-emerald-200">
                          <kbd className="px-2 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 shadow-2xs">Ctrl + Enter</kbd>
                        </td>
                        <td className="p-2.5 font-black text-emerald-900 dark:text-emerald-200">LƯU &amp; IN NGAY</td>
                        <td className="p-2.5 text-slate-800 dark:text-slate-200 font-semibold">Quy trình 1 phím: Lưu hồ sơ và mở ngay trang in cho bệnh nhân!</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold">
                          <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">F8</kbd> / <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">Alt + R</kbd>
                        </td>
                        <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">Xem trước toa</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">Mở cửa sổ review trực quan toa thuốc và ma trận lịch uống.</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold">
                          <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">Alt + 1 .. 4</kbd>
                        </td>
                        <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">Chuyển tab</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">1: Kê toa | 2: Bệnh nhân | 3: Lịch sử đơn | 4: Trang in.</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold">
                          <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">?</kbd> hoặc <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">F12</kbd>
                        </td>
                        <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">Bảng phím tắt</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">Mở nhanh bảng tra cứu các phím tắt.</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold">
                          <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">Esc</kbd>
                        </td>
                        <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">Đóng / Thoát</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">Đóng bất kỳ pop-up modal nào hoặc xóa ô tìm kiếm.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Section 3: Prescription Flow */}
            {activeSection === 'prescription_flow' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                    3. Quy Trình Kê Đơn 30 Giây Không Cần Dùng Chuột
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Kịch bản thực chiến minh họa khám và kê đơn cho bệnh nhân Tăng Huyết Áp &amp; Đái Tháo Đường
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-md border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center shrink-0">1</span>
                    <div className="space-y-1">
                      <strong className="text-sm font-bold text-slate-900 dark:text-slate-100">Chọn bệnh nhân</strong>
                      <p className="text-slate-600 dark:text-slate-400">
                        Nhấn <kbd className="font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-bold">F1</kbd> → Gõ tên bệnh nhân hoặc 4 số cuối điện thoại. Nếu là bệnh nhân mới, nhấn <kbd className="font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-bold">F3</kbd> để tiếp nhận.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-md border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center shrink-0">2</span>
                    <div className="space-y-1">
                      <strong className="text-sm font-bold text-slate-900 dark:text-slate-100">Ghi nhận chẩn đoán</strong>
                      <p className="text-slate-600 dark:text-slate-400">
                        Nhấn <kbd className="font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-bold">F4</kbd> → Gõ chẩn đoán hoặc chọn nhanh từ các nút gợi ý có sẵn (ví dụ: Tăng huyết áp nguyên phát).
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-md border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center shrink-0">3</span>
                    <div className="space-y-1">
                      <strong className="text-sm font-bold text-slate-900 dark:text-slate-100">Kê thuốc bằng phím F2</strong>
                      <p className="text-slate-600 dark:text-slate-400">
                        Nhấn <kbd className="font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-bold">F2</kbd> → Gõ <code>Amlo</code> → Nhấn <kbd className="font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-bold">Enter</kbd> (Amlodipin 5mg đã vào toa). Ô tìm kiếm lập tức trống, gõ tiếp <code>Metfor</code> → Nhấn <kbd className="font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-bold">Enter</kbd> (Metformin 500mg đã vào toa).
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-md border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center shrink-0">4</span>
                    <div className="space-y-1">
                      <strong className="text-sm font-bold text-slate-900 dark:text-slate-100">Lưu và In toa 1-chạm</strong>
                      <p className="text-slate-600 dark:text-slate-400">
                        Nhấn <kbd className="font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-bold">Ctrl + Enter</kbd> → Đơn thuốc được lưu vào cơ sở dữ liệu và tự động chuyển sang trang in kèm lịch uống!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 4: Patients */}
            {activeSection === 'patients' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                    4. Quản Lý Hồ Sơ Bệnh Nhân &amp; Tiền Sử Bệnh
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Theo dõi đầy đủ nhân khẩu học, dị ứng thuốc và bệnh lý mạn tính
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <p>Mỗi bệnh nhân trong hệ thống được cấp một mã số duy nhất theo định dạng <code>BN-xxxx</code> (ví dụ: BN-0001, BN-0002). Hồ sơ lưu trữ bao gồm:</p>
                  <ul className="list-disc pl-5 space-y-1.5 text-slate-700 dark:text-slate-300">
                    <li><strong>Thông tin hành chính:</strong> Họ tên, năm sinh, giới tính, số điện thoại, địa chỉ, số thẻ BHYT.</li>
                    <li><strong>Cảnh báo dị ứng (Crucial):</strong> Bất kỳ dị ứng thuốc nào (như Penicillin, NSAIDs, Sulfonamide) sẽ được làm nổi bật với biểu tượng đỏ cảnh báo trên màn hình kê đơn để ngăn ngừa tai biến y khoa.</li>
                    <li><strong>Bệnh mạn tính & Tiền sử:</strong> Tăng huyết áp, Đái tháo đường, Loét dạ dày, Bệnh thận mạn... phục vụ phân tích tương tác khi kê đơn.</li>
                    <li><strong>Người liên hệ khẩn cấp:</strong> Tên và số điện thoại người nhà khi cần thiết.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Section 5: Pharmacy */}
            {activeSection === 'pharmacy' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Pill className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                    5. Danh Mục Kho Dược &amp; Lịch Uống (Sáng / Trưa / Chiều / Tối)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Hơn 44 biệt dược thông dụng sẵn có và cơ chế tính toán tổng số viên tự động
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <p>Hệ thống tích hợp sẵn kho thuốc chuẩn với đầy đủ các nhóm điều trị phổ biến tại phòng khám:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <span className="p-2 bg-slate-100 dark:bg-slate-800 rounded font-semibold text-center">Tim mạch & Huyết áp</span>
                    <span className="p-2 bg-slate-100 dark:bg-slate-800 rounded font-semibold text-center">Nội tiết & Tiểu đường</span>
                    <span className="p-2 bg-slate-100 dark:bg-slate-800 rounded font-semibold text-center">Tiêu hóa & Dạ dày</span>
                    <span className="p-2 bg-slate-100 dark:bg-slate-800 rounded font-semibold text-center">Kháng sinh & Hô hấp</span>
                    <span className="p-2 bg-slate-100 dark:bg-slate-800 rounded font-semibold text-center">Giảm đau & Khớp</span>
                    <span className="p-2 bg-slate-100 dark:bg-slate-800 rounded font-semibold text-center">Thần kinh & Tiền đình</span>
                    <span className="p-2 bg-slate-100 dark:bg-slate-800 rounded font-semibold text-center">Vitamin & Bổ trợ</span>
                    <span className="p-2 bg-slate-100 dark:bg-slate-800 rounded font-semibold text-center">Thuốc khác</span>
                  </div>

                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-md text-emerald-900 dark:text-emerald-200 space-y-1">
                    <strong>Chỉnh sửa kho &amp; Báo cáo lọc trùng thông minh:</strong>
                    <p>
                      Bác sĩ có thể bấm <strong>[Sửa]</strong> trên từng loại thuốc để tùy chỉnh lại hoạt chất, hàm lượng, nhóm dược lý (nếu bot cào hoặc AI gán nhầm).
                      Đồng thời tab <strong>[Báo Cáo &amp; Lọc Trùng]</strong> sẽ tự động phát hiện thuốc trùng lặp, cảnh báo sai nhóm dược lý và cho phép gộp/dọn sạch bằng 1 click.
                    </p>
                  </div>

                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-md text-amber-900 dark:text-amber-200">
                    <strong>Tự động tính tổng viên:</strong> Khi bác sĩ thay đổi số viên uống Sáng, Trưa, Chiều, Tối hoặc số ngày dùng thuốc, tổng số viên cấp sẽ tự động cập nhật ngay lập tức theo công thức:
                    <div className="font-mono text-center my-1 text-sm font-bold">
                      Tổng cấp = (Sáng + Trưa + Chiều + Tối) × Số ngày điều trị
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 6: Print */}
            {activeSection === 'print_guide' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Printer className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                    6. In Ấn Toa Thuốc &amp; Bảng Nhắc Lịch Uống Khổ A4 / A5
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Định dạng chuẩn theo Thông tư Bộ Y Tế và tối ưu cho người bệnh lớn tuổi
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <p>Hệ thống cung cấp 3 chế độ in tùy chọn:</p>
                  <ol className="list-decimal pl-5 space-y-2 text-slate-700 dark:text-slate-300">
                    <li>
                      <strong>In Đầy Đủ (Toa Thuốc + Bảng Nhắc Lịch Uống):</strong> Khuyên dùng. Bản in gồm 2 phần: Toa thuốc chuẩn pháp lý phía trên và bảng phân chia liều uống sáng/trưa/chiều/tối với icon sinh động phía dưới để dán tủ lạnh.
                    </li>
                    <li>
                      <strong>Chỉ In Toa Thuốc:</strong> Tiết kiệm giấy, in toa theo chuẩn đơn thuốc ngoại trú.
                    </li>
                    <li>
                      <strong>Chỉ In Bảng Nhắc Lịch Uống:</strong> Bảng ma trận theo dõi thuốc dành riêng cho người già hoặc người nhà hỗ trợ chia thuốc.
                    </li>
                  </ol>
                  <p className="text-slate-500 italic">Mẹo in: Trong hộp thoại in của trình duyệt (Chrome/Edge), hãy bỏ tích ô "Headers and footers" (Tiêu đề và chân trang) để bản in sạch đẹp nhất.</p>
                </div>
              </div>
            )}

            {/* Section 7: Clinical AI */}
            {activeSection === 'clinical_ai' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                    7. Trợ Lý AI Lâm Sàng Gemini Hỗ Trợ Kê Đơn
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Công nghệ AI hỗ trợ rà soát tương tác, chống chỉ định và liều lượng theo cân nặng
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <p>Trợ lý AI Gemini được tích hợp chuyên biệt cho phòng khám Bác sĩ Trần Văn Diệu:</p>
                  <ul className="list-disc pl-5 space-y-1.5 text-slate-700 dark:text-slate-300">
                    <li><strong>Rà soát tương tác thuốc:</strong> Đánh giá mức độ tương tác giữa các thuốc trong toa (ví dụ: phối hợp NSAIDs với Corticoid hoặc tương tác thuốc tim mạch).</li>
                    <li><strong>Gợi ý phác đồ chuẩn:</strong> Hỗ trợ bác sĩ tham khảo hướng dẫn chẩn đoán của Bộ Y Tế và các hiệp hội Tim Mạch, Nội Tiết quốc tế.</li>
                    <li><strong>Nhắc nhở dặn dò dinh dưỡng:</strong> Đưa ra lời khuyên chế độ ăn phù hợp với bệnh lý (ăn nhạt cho THA, hạn chế tinh bột cho ĐTĐ).</li>
                  </ul>
                  <p>Nhấn <kbd className="font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-bold">F7</kbd> hoặc nút "Trợ Lý Gemini AI" ở góc phải màn hình để kích hoạt.</p>
                </div>
              </div>
            )}

            {/* Section 8: Backup & FAQ */}
            {activeSection === 'backup_faq' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                    8. Sao Lưu Dữ Liệu &amp; Câu Hỏi Thường Gặp (FAQ)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Đảm bảo an toàn dữ liệu và giải đáp các thắc mắc trong quá trình sử dụng
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-md space-y-1.5">
                    <strong className="font-bold text-slate-900 dark:text-slate-100 block">Q1: Dữ liệu phòng khám được lưu ở đâu? Có bị mất khi tắt máy không?</strong>
                    <p className="text-slate-600 dark:text-slate-400">
                      Toàn bộ dữ liệu được lưu tức thì vào bộ nhớ trình duyệt (LocalStorage an toàn). Bạn có thể tắt máy mở lại bất kỳ lúc nào mà không bị mất. Ngoài ra, khuyến nghị mỗi tuần bấm "Sao lưu dữ liệu phòng khám (JSON)" ở chân trang để tải file lưu trữ về máy tính cá nhân.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-md space-y-1.5">
                    <strong className="font-bold text-slate-900 dark:text-slate-100 block">Q2: Làm sao để thay đổi thông tin phòng khám và số giấy phép hoạt động?</strong>
                    <p className="text-slate-600 dark:text-slate-400">
                      Bấm vào biểu tượng Bánh răng (Cài đặt) ở góc trên bên phải để cập nhật tên phòng khám, họ tên bác sĩ, số CCHN, địa chỉ và hotline. Mọi thay đổi sẽ tự động áp dụng lên tiêu đề đơn thuốc.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-md space-y-1.5">
                    <strong className="font-bold text-slate-900 dark:text-slate-100 block">Q3: Tôi muốn thêm thuốc mới chưa có trong danh mục thì làm thế nào?</strong>
                    <p className="text-slate-600 dark:text-slate-400">
                      Cách 1: Nhấn <kbd className="font-mono bg-white dark:bg-slate-700 px-1 py-0.5 rounded font-bold">Alt + T</kbd> để tạo dòng thuốc tự do và gõ tên thuốc.<br />
                      Cách 2: Nhấn <kbd className="font-mono bg-white dark:bg-slate-700 px-1 py-0.5 rounded font-bold">F6</kbd> mở Kho Dược và nhấn "+ Thêm Thuốc Mới Vào Kho" để lưu vĩnh viễn vào danh mục.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Phòng Khám Bác Sĩ Trần Văn Diệu · Phần mềm kê đơn chuyên nghiệp</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-md bg-emerald-800 hover:bg-emerald-900 text-white transition-colors cursor-pointer"
          >
            Đóng Hướng Dẫn
          </button>
        </div>
      </div>
    </div>
  );
};
