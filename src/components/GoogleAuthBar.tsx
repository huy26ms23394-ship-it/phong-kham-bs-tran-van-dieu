import React, { useState, useRef, useEffect } from 'react';
import {
  UserCheck,
  LogOut,
  ShieldCheck,
  Mail,
  ExternalLink,
  ChevronDown,
  X,
} from 'lucide-react';

export interface GoogleUser {
  name: string;
  email: string;
  picture?: string;
  role: string;
  isSignedIn: boolean;
}

interface GoogleAuthBarProps {
  currentUser: GoogleUser;
  onLogin: (user: GoogleUser) => void;
  onLogout: () => void;
  onOpenGmailInbox?: () => void;
}

export const GoogleAuthBar: React.FC<GoogleAuthBarProps> = ({
  currentUser,
  onLogin,
  onLogout,
  onOpenGmailInbox,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [customEmail, setCustomEmail] = useState('tranminhhuy3031998@gmail.com');
  const [customName, setCustomName] = useState('Bác Sĩ Trần Văn Diệu');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleSimulateGoogleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({
      name: customName.trim() || 'Bác Sĩ Trần Văn Diệu',
      email: customEmail.trim() || 'tranminhhuy3031998@gmail.com',
      role: 'Bác Sĩ Trưởng Phòng Khám',
      isSignedIn: true,
    });
    setShowLoginModal(false);
  };

  // Compact short name for navbar pill (e.g. "Bác Sĩ Trần Văn Diệu" -> "BS. Diệu")
  const shortDoctorName = currentUser.name
    .replace(/^Bác Sĩ\s+/i, 'BS. ')
    .replace(/^BS\.\s+Trần Văn\s+/i, 'BS. ');

  return (
    <div className="relative flex items-center gap-1" ref={menuRef}>
      {/* Quick Check Mail Icon Button */}
      {currentUser.isSignedIn && onOpenGmailInbox && (
        <button
          type="button"
          onClick={onOpenGmailInbox}
          className="relative h-8.5 w-8.5 rounded-md bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors duration-150 border border-slate-200/80 dark:border-slate-700/80 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none cursor-pointer"
          title="Hộp thư Gmail Phòng Khám (4 thư mới)"
          aria-label="Mở hộp thư Gmail phòng khám"
        >
          <Mail className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"
            aria-hidden="true"
          />
        </button>
      )}

      {currentUser.isSignedIn ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            aria-expanded={showMenu}
            aria-haspopup="menu"
            aria-label={`Tài khoản ${currentUser.name}`}
            className="h-8.5 flex items-center gap-1.5 pl-1.5 pr-2 rounded-md bg-slate-100/80 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors duration-150 border border-slate-200/80 dark:border-slate-700/80 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none cursor-pointer"
            title={`${currentUser.name} (${currentUser.email})`}
          >
            <div className="w-6 h-6 rounded-md bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap hidden xl:inline">
              {shortDoctorName}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
          </button>

          {/* Account Dropdown Menu */}
          {showMenu && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-md shadow-xl border border-slate-200 dark:border-slate-800 py-3.5 px-4 z-50 text-xs space-y-3"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-md bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                    {currentUser.email}
                  </div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 shrink-0" aria-hidden="true" />
                    <span>Đã xác thực Google Workspace</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions in Dropdown */}
              <div className="space-y-1.5">
                {onOpenGmailInbox && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onOpenGmailInbox();
                    }}
                    className="w-full h-9 px-3 py-1.5 rounded-md bg-slate-50 hover:bg-emerald-50/60 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-left font-semibold flex items-center justify-between transition-colors border border-slate-200/60 dark:border-slate-700/60 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                      <span>Hộp Thư Phòng Khám</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                      4 mới
                    </span>
                  </button>
                )}

                <a
                  href="https://mail.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-9 px-3 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-left font-medium flex items-center justify-between transition-colors"
                >
                  <span>Mở Gmail trực tuyến</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                </a>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    setShowLoginModal(true);
                  }}
                  className="h-8 px-2.5 rounded-md text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 font-semibold transition-colors cursor-pointer"
                >
                  Đổi tài khoản
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onLogout();
                  }}
                  className="h-8 px-2.5 rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowLoginModal(true)}
          className="h-8 px-2.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="hidden sm:inline">Đăng nhập</span>
        </button>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="google-login-title"
        >
          <div className="bg-white dark:bg-slate-900 rounded-md max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            <div className="bg-emerald-800 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-200" aria-hidden="true" />
                <h3 id="google-login-title" className="font-bold text-sm">
                  Đăng Nhập Tài Khoản Google Phòng Khám
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                aria-label="Đóng hộp thoại đăng nhập"
                className="w-8 h-8 rounded-md text-white/80 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSimulateGoogleLogin} className="p-6 space-y-4 text-xs">
              <div>
                <label
                  htmlFor="google-doctor-name"
                  className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Họ tên Bác sĩ / Người dùng:
                </label>
                <input
                  id="google-doctor-name"
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full h-10 px-3.5 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label
                  htmlFor="google-doctor-email"
                  className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Địa chỉ Gmail liên kết:
                </label>
                <input
                  id="google-doctor-email"
                  type="email"
                  required
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full h-10 px-3.5 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-md border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
                <UserCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  Kết nối đồng bộ với hộp thư Gmail và cấp quyền cho Trợ lý Gemini AI đọc hồ sơ bệnh nhân, kho thuốc để hỗ trợ kê đơn.
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="h-9 px-4 rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Xác Nhận Đăng Nhập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
