import React from 'react';
import {
  Keyboard,
  X,
  Search,
  Zap,
  Printer,
  FileText,
  UserPlus,
  Sparkles,
  Pill,
  CheckCircle,
  HelpCircle,
  BookOpen,
} from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUserGuide?: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  onOpenUserGuide,
}) => {
  if (!isOpen) return null;

  const shortcutSections = [
    {
      category: 'Kê Đơn Thần Tốc (Tối Ưu Không Cần Chuột)',
      icon: Zap,
      color: 'emerald',
      items: [
        {
          keys: ['F2', 'hoặc', '/'],
          action: 'Chuyển con trỏ ngay sang ô Tìm Thuốc trong kho',
          note: 'Tự động nhảy về trang Kê Toa và bôi đen ô tìm kiếm',
        },
        {
          keys: ['↓', '↑'],
          action: 'Di chuyển lên / xuống danh sách kết quả thuốc',
          note: 'Khi đang tìm thuốc, duyệt nhanh các biệt dược hiển thị',
        },
        {
          keys: ['Enter'],
          action: 'Thêm ngay thuốc đang chọn vào toa khám',
          note: 'Sau khi thêm, ô tìm kiếm tự làm sạch để gõ ngay thuốc tiếp theo',
        },
        {
          keys: ['Alt', 'T'],
          action: 'Thêm nhanh dòng Thuốc Tự Do',
          note: 'Kê thuốc mới ngoài danh mục hoặc dạng bào chế đặc biệt',
        },
        {
          keys: ['Esc'],
          action: 'Xóa nhanh từ khóa tìm kiếm / Bỏ chọn ô nhập',
          note: 'Giúp thoát nhanh trạng thái gõ phím',
        },
      ],
    },
    {
      category: 'Khám Bệnh & Bệnh Nhân',
      icon: UserPlus,
      color: 'blue',
      items: [
        {
          keys: ['F1', 'hoặc', 'Alt', 'B'],
          action: 'Chuyển con trỏ sang ô Tìm & Chọn Bệnh Nhân',
          note: 'Tìm theo tên, số điện thoại hoặc mã BN-xxxx',
        },
        {
          keys: ['F3', 'hoặc', 'Alt', 'N'],
          action: 'Mở cửa sổ Tiếp Nhận / Thêm Bệnh Nhân Mới',
          note: 'Nhập thông tin hành chính, tiền sử dị ứng và bệnh nền',
        },
        {
          keys: ['F4', 'hoặc', 'Alt', 'D'],
          action: 'Chuyển con trỏ sang ô Chẩn Đoán Bệnh & ICD-10',
          note: 'Gõ kết luận chẩn đoán hoặc chọn mã bệnh',
        },
      ],
    },
    {
      category: 'Lưu Trữ, Xem Trước & In Ấn',
      icon: Printer,
      color: 'indigo',
      items: [
        {
          keys: ['Ctrl', 'S'],
          action: 'Lưu Đơn Thuốc vào hệ thống phòng khám',
          note: 'Lưu trữ hồ sơ mà không cần di chuột bấm nút Lưu',
        },
        {
          keys: ['Ctrl', 'Enter'],
          action: 'Lưu & In Toa Ngay Cho Bệnh Nhân (Khuyên Dùng)',
          note: 'Quy trình 1-chạm: lưu đơn và chuyển sang giao diện in ấn',
        },
        {
          keys: ['F8', 'hoặc', 'Alt', 'R'],
          action: 'Xem Trước / Review Toa Thuốc & Lịch Uống',
          note: 'Kiểm tra liều lượng, tổng số viên trước khi chốt',
        },
      ],
    },
    {
      category: 'Điều Hướng Nhanh Giữa Các Tab',
      icon: FileText,
      color: 'amber',
      items: [
        {
          keys: ['Alt', '1'],
          action: 'Chuyển tab Khám Bệnh & Kê Toa',
          note: 'Màn hình kê toa chính của Bác sĩ Diệu',
        },
        {
          keys: ['Alt', '2'],
          action: 'Chuyển tab Danh Sách Bệnh Nhân',
          note: 'Xem và quản lý hồ sơ bệnh nhân',
        },
        {
          keys: ['Alt', '3'],
          action: 'Chuyển tab Hồ Sơ Toa Thuốc',
          note: 'Lịch sử khám và đơn thuốc đã kê',
        },
        {
          keys: ['Alt', '4'],
          action: 'Chuyển tab In Toa & Lịch Uống',
          note: 'Bản in khổ A4/A5 và bảng nhắc liều',
        },
      ],
    },
    {
      category: 'Kho Dược, AI & Trợ Giúp',
      icon: Sparkles,
      color: 'purple',
      items: [
        {
          keys: ['F6', 'hoặc', 'Alt', 'K'],
          action: 'Mở Kho Thuốc Phòng Khám (44+ Thuốc)',
          note: 'Tra cứu, nhập thêm hoặc cập nhật giá & hàm lượng',
        },
        {
          keys: ['F7', 'hoặc', 'Alt', 'J'],
          action: 'Mở Trợ Lý Lâm Sàng Gemini AI',
          note: 'Phân tích tương tác thuốc, gợi ý phác đồ chuyên khoa',
        },
        {
          keys: ['F9'],
          action: 'Mở Báo Cáo Thống Kê & Quản Lý Kho Dược',
          note: 'Xem doanh thu khám, top 10 thuốc kê nhiều nhất, hạn dùng & xuất Excel',
        },
        {
          keys: ['F10', 'hoặc', 'Alt', 'G'],
          action: 'Mở Tài Liệu Hướng Dẫn Sử Dụng Chi Tiết',
          note: 'Xem cẩm nang quy trình phòng khám đầy đủ',
        },
        {
          keys: ['?', 'hoặc', 'F12'],
          action: 'Mở Bảng Tra Cứu Phím Tắt Này',
          note: 'Bấm ? ở bất kỳ đâu ngoài ô nhập liệu',
        },
        {
          keys: ['Esc'],
          action: 'Đóng tất cả các hộp thoại đang mở',
          note: 'Thoát nhanh màn hình con về trang làm việc',
        },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 dark:bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-4xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 flex flex-col max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-emerald-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
              <Keyboard className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>Bộ Công Cụ Phím Tắt Thao Tác Nhanh</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-700/80 text-emerald-100 border border-emerald-500/50">
                  Zero-Mouse Mode
                </span>
              </h2>
              <p className="text-xs text-emerald-200/90 font-medium">
                Tối ưu hóa tốc độ kê đơn cho Bác Sĩ Trần Văn Diệu · Hạn chế tối đa dùng chuột
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Đóng bảng phím tắt"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 overflow-y-auto space-y-5 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
          {/* Quick highlight banner */}
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-md border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
            <Zap className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-sm">Bí kíp kê đơn 30 giây:</strong>
              <p className="mt-0.5 leading-relaxed">
                Nhấn <kbd className="px-1.5 py-0.5 text-[11px] font-mono bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded font-bold shadow-2xs">F2</kbd> gõ tên thuốc → bấm phím <kbd className="px-1.5 py-0.5 text-[11px] font-mono bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded font-bold shadow-2xs">↓</kbd> để chọn → nhấn <kbd className="px-1.5 py-0.5 text-[11px] font-mono bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded font-bold shadow-2xs">Enter</kbd> thêm vào toa → lặp lại cho các thuốc tiếp theo → nhấn <kbd className="px-1.5 py-0.5 text-[11px] font-mono bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded font-bold shadow-2xs">Ctrl + Enter</kbd> để lưu và in ngay!
              </p>
            </div>
          </div>

          {/* Shortcut Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shortcutSections.map((sec, secIdx) => {
              const IconComp = sec.icon;
              return (
                <div
                  key={sec.category}
                  className={`bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-3 ${
                    secIdx === 0 ? 'md:col-span-2 border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <IconComp className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                      {sec.category}
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {sec.items.map((item, itemIdx) => (
                      <div
                        key={itemIdx}
                        className="flex items-start justify-between gap-3 text-xs py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded px-1 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.action}
                          </div>
                          {item.note && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {item.note}
                            </div>
                          )}
                        </div>

                        {/* Keys Badge */}
                        <div className="flex items-center gap-1 shrink-0 font-mono">
                          {item.keys.map((k, kIdx) =>
                            k === 'hoặc' ? (
                              <span key={kIdx} className="text-[10px] text-slate-400 px-0.5">
                                hoặc
                              </span>
                            ) : (
                              <kbd
                                key={kIdx}
                                className="px-2 py-0.5 text-xs font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 shadow-2xs"
                              >
                                {k}
                              </kbd>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Mẹo: Bạn có thể nhấn phím <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 font-mono font-bold text-slate-700 dark:text-slate-300">?</kbd> bất kỳ lúc nào để mở lại bảng này.</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenUserGuide && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenUserGuide();
                }}
                className="px-3.5 py-2 text-xs font-bold rounded-md bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Xem Tài Liệu Hướng Dẫn Chi Tiết</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white transition-colors cursor-pointer"
            >
              Đã Hiểu & Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
