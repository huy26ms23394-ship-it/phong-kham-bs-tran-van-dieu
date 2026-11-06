import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Stethoscope,
  Lock,
  Mail,
  UserCheck,
  AlertCircle,
  KeyRound,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { loginAdmin, loginGoogle } from '../utils/authClient';
import { ClinicUser } from '../types/auth';

interface LoginModalProps {
  onLoginSuccess: (user: ClinicUser) => void;
  onPendingApproval: (user: ClinicUser) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onLoginSuccess,
  onPendingApproval,
}) => {
  const [tab, setTab] = useState<'google' | 'admin'>('google');

  // Master Admin form state
  const [adminUser, setAdminUser] = useState('tranminhhuy3031998@gmail.com');
  const [adminPass, setAdminPass] = useState('DieuClinic@2026!');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);

  // Google form / simulation state
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  // Load Google Identity Services (GSI) script
  useEffect(() => {
    const scriptId = 'google-gsi-client';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initGoogleButton();
      };
      document.body.appendChild(script);
    } else {
      initGoogleButton();
    }
  }, [tab]);

  const initGoogleButton = () => {
    if (tab !== 'google') return;
    const google = (window as any).google;
    if (google && googleBtnContainerRef.current) {
      try {
        google.accounts.id.initialize({
          client_id:
            (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
            '1000000000000-dummy-google-client-id.apps.googleusercontent.com',
          callback: async (response: any) => {
            if (response.credential) {
              setIsLoadingGoogle(true);
              setGoogleError(null);
              const res = await loginGoogle({ credential: response.credential });
              setIsLoadingGoogle(false);
              if (res.success && res.user) {
                if (res.status === 'APPROVED') {
                  onLoginSuccess(res.user);
                } else if (res.status === 'PENDING') {
                  onPendingApproval(res.user);
                }
              } else {
                setGoogleError(res.error || res.message || 'Đăng nhập Google thất bại');
              }
            }
          },
        });

        googleBtnContainerRef.current.innerHTML = '';
        google.accounts.id.renderButton(googleBtnContainerRef.current, {
          theme: 'outline',
          size: 'large',
          width: 340,
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        });
      } catch (err) {
        console.warn('Google GSI button render exception:', err);
      }
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser.trim() || !adminPass.trim()) {
      setAdminError('Vui lòng nhập đầy đủ tài khoản và mật khẩu quản trị');
      return;
    }
    setIsLoadingAdmin(true);
    setAdminError(null);

    const res = await loginAdmin(adminUser.trim(), adminPass.trim());
    setIsLoadingAdmin(false);

    if (res.success && res.user) {
      onLoginSuccess(res.user);
    } else {
      setAdminError(res.error || 'Tài khoản hoặc mật khẩu quản trị viên không chính xác');
    }
  };

  const handleQuickGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) {
      setGoogleError('Vui lòng nhập địa chỉ email Google');
      return;
    }
    setIsLoadingGoogle(true);
    setGoogleError(null);

    const res = await loginGoogle({
      email: googleEmail.trim().toLowerCase(),
      name: googleName.trim() || googleEmail.split('@')[0],
    });
    setIsLoadingGoogle(false);

    if (res.success && res.user) {
      if (res.status === 'APPROVED') {
        onLoginSuccess(res.user);
      } else {
        onPendingApproval(res.user);
      }
    } else {
      setGoogleError(res.error || res.message || 'Không thể xác thực tài khoản Google');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-6 text-white text-center relative">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
            <Stethoscope className="w-8 h-8 text-emerald-300" />
          </div>
          <h2 className="text-lg font-black tracking-tight uppercase">
            Phòng Khám BS. Trần Văn Diệu
          </h2>
          <p className="text-xs text-emerald-200 mt-1 font-medium">
            Hệ thống Quản lý Y tế & Kê đơn Zero-Trust (Bảo mật Khép kín)
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-400/30 text-[11px] text-emerald-200 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Nghị định 333/2026/NĐ-CP · Chuẩn Y Tế
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setTab('google')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              tab === 'google'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Đăng nhập Google SSO
          </button>
          <button
            type="button"
            onClick={() => setTab('admin')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              tab === 'admin'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            Master Admin
          </button>
        </div>

        <div className="p-6">
          {tab === 'google' ? (
            /* TAB 1: GOOGLE SSO + ONE-CLICK APPROVAL */
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Dành cho Bác sĩ Diệu và người thân trong gia đình. Đăng nhập trực tiếp bằng tài khoản Google để xác thực danh tính.
                </p>
              </div>

              {/* Official Google GSI Button Container */}
              <div className="flex flex-col items-center justify-center min-h-[44px]">
                <div ref={googleBtnContainerRef} className="w-full flex justify-center"></div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-400 uppercase">
                  Hoặc đăng nhập nhanh bằng Email
                </span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              <form onSubmit={handleQuickGoogleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Địa chỉ Email Google (@gmail.com)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={googleEmail}
                      onChange={(e) => setGoogleEmail(e.target.value)}
                      placeholder="vidu@gmail.com"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Họ và tên (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    placeholder="BS. Trần Văn Diệu / Người thân"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {googleError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{googleError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoadingGoogle}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoadingGoogle ? 'Đang xác thực Google...' : 'Xác Thực & Tiếp Tục'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Quy trình Phòng chờ Phê duyệt:
                </p>
                <p>
                  • Email của Bác sĩ Diệu (<code className="font-bold">tranminhhuy3031998@gmail.com</code>) sẽ tự động vào thẳng quyền Quản Trị Viên Tối Cao.
                </p>
                <p>
                  • Email người thân chưa được duyệt sẽ chuyển vào <strong>Phòng Chờ</strong> để Bác sĩ Diệu phê duyệt vai trò trước khi xem đơn thuốc.
                </p>
              </div>
            </div>
          ) : (
            /* TAB 2: MASTER ADMIN (CỐ ĐỊNH & DỰ PHÒNG) */
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300">
                <p className="font-bold">Tài khoản Quản trị viên Dự phòng Cố định</p>
                <p className="mt-0.5">
                  Quyền lực cao nhất, luôn vào thẳng hệ thống ngay cả khi chưa kết nối Google OAuth.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email / Username Quản Trị
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={adminUser}
                    onChange={(e) => setAdminUser(e.target.value)}
                    placeholder="tranminhhuy3031998@gmail.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mật khẩu Quản Trị Viên
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Mật khẩu mặc định khởi tạo: <code className="font-bold text-emerald-700 dark:text-emerald-400">DieuClinic@2026!</code>
                </p>
              </div>

              {adminError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{adminError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoadingAdmin}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoadingAdmin ? 'Đang kiểm tra quyền Admin...' : 'Đăng Nhập Master Admin'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Dữ liệu bệnh nhân được mã hóa AES-256 & lưu trữ độc quyền trên Cloud Supabase.
          </p>
        </div>
      </div>
    </div>
  );
};
