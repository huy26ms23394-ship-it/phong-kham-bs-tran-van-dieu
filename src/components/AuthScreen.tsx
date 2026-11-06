import React, { useState } from 'react';
import {
  Stethoscope,
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  UserCheck,
  Sparkles,
  CheckCircle2,
  KeyRound,
  FileText,
} from 'lucide-react';

export interface GoogleUser {
  name: string;
  email: string;
  picture?: string;
  role: string;
  isSignedIn: boolean;
}

interface AuthScreenProps {
  onLogin: (user: GoogleUser) => void;
  onContinueAsGuest: () => void;
}

const PRESET_ACCOUNTS = [
  {
    name: 'Bác Sĩ Trần Văn Diệu',
    email: 'tranminhhuy3031998@gmail.com',
    role: 'Bác Sĩ Trưởng Phòng Khám',
    cchn: '04512/HCM-CCHN',
    avatar: 'D',
  },
  {
    name: 'Dược Sĩ Mai Phương',
    email: 'duocsi.maiphuong@gmail.com',
    role: 'Dược Sĩ Phụ Trách Nhà Thuốc',
    cchn: '09823/HCM-DS',
    avatar: 'P',
  },
  {
    name: 'ĐD. Nguyễn Thu Hà',
    email: 'letan.clinicdieu@gmail.com',
    role: 'Điều Dưỡng & Tiếp Đón Bệnh Nhân',
    cchn: '11204/HCM-DD',
    avatar: 'H',
  },
];

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLogin,
  onContinueAsGuest,
}) => {
  const [tab, setTab] = useState<'google' | 'email'>('google');
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('Bác Sĩ Trưởng Phòng Khám');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleInstantGoogleLogin = (account: typeof PRESET_ACCOUNTS[0]) => {
    setIsLoading(true);
    setErrorMessage('');
    setTimeout(() => {
      setIsLoading(false);
      onLogin({
        name: account.name,
        email: account.email,
        role: account.role,
        isSignedIn: true,
      });
    }, 300);
  };

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) {
      setErrorMessage('Vui lòng nhập địa chỉ Gmail');
      return;
    }
    if (!customEmail.includes('@')) {
      setErrorMessage('Địa chỉ email không hợp lệ');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const inferredName =
        customName.trim() ||
        (customEmail.toLowerCase().includes('dieu') || customEmail.toLowerCase().includes('huy')
          ? 'Bác Sĩ Trần Văn Diệu'
          : `Bác Sĩ ${customEmail.split('@')[0]}`);

      onLogin({
        name: inferredName,
        email: customEmail.trim(),
        role: selectedRole,
        isSignedIn: true,
      });
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#090b10] text-slate-100 flex flex-col justify-between selection:bg-emerald-800 selection:text-white relative">
      {/* Subtle architectural grid background */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#161b26_1px,transparent_1px),linear-gradient(to_bottom,#161b26_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />

      {/* Top Architectural Header */}
      <header className="relative z-10 px-6 h-12 border-b border-slate-800 bg-[#0d1017] w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-emerald-800 border border-emerald-600 flex items-center justify-center text-white">
            <Stethoscope className="w-4 h-4 text-emerald-100" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold tracking-tight text-white uppercase">
              PHÒNG KHÁM BS. TRẦN VĂN DIỆU
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold">
              CCHN: 04512/HCM-CCHN
            </span>
          </div>
        </div>

        <button
          onClick={onContinueAsGuest}
          className="h-8 px-3 text-xs font-bold text-slate-200 hover:text-white rounded-md border border-slate-700 hover:border-emerald-500 bg-[#141923] hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span>VÀO THẲNG PHÒNG KHÁM (CHẾ ĐỘ KHÁCH)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Main Login Box (Sharp Architectural Geometry) */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-[#0e121b] border border-slate-700 rounded-md shadow-2xl overflow-hidden">
          {/* Top Status Strip */}
          <div className="px-6 py-4 bg-[#131824] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-emerald-900 border border-emerald-600 text-emerald-300 flex items-center justify-center">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold tracking-tight text-white uppercase">
                  Xác Thực Tài Khoản Bác Sĩ
                </h1>
                <p className="text-[11px] font-mono text-slate-400">
                  GOOGLE WORKSPACE &amp; GMAIL CLINICAL AUTH
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-md">
              ONLINE
            </span>
          </div>

          <div className="p-6 space-y-5">
            {/* Tab Switcher (Flush Sharp Tabs) */}
            <div className="grid grid-cols-2 border border-slate-700 rounded-md bg-[#090b10] p-0.5">
              <button
                type="button"
                onClick={() => {
                  setTab('google');
                  setErrorMessage('');
                }}
                className={`py-2 text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  tab === 'google'
                    ? 'bg-emerald-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
                <span>ĐĂNG NHẬP GMAIL</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTab('email');
                  setErrorMessage('');
                }}
                className={`py-2 text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  tab === 'email'
                    ? 'bg-emerald-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>MẬT KHẨU Y TẾ</span>
              </button>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-md bg-rose-950/70 border-l-2 border-rose-500 text-rose-200 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {tab === 'google' && (
              <div className="space-y-4">
                {/* 1-Click Google Accounts */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-mono font-bold text-slate-400 mb-2">
                    CHỌN TÀI KHOẢN GMAIL PHÒNG KHÁM (1-CLICK):
                  </label>
                  <div className="divide-y divide-slate-800 border border-slate-700 rounded-md overflow-hidden">
                    {PRESET_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleInstantGoogleLogin(acc)}
                        className="w-full text-left p-3 bg-[#090b10] hover:bg-[#141b29] transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-emerald-800 border border-emerald-600 text-white font-mono font-bold flex items-center justify-center text-xs shrink-0">
                            {acc.avatar}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                              {acc.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {acc.email}
                            </div>
                            <div className="text-[10px] text-emerald-400 font-mono">
                              {acc.role} · [{acc.cchn}]
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-slate-800 group-hover:bg-emerald-700 text-slate-300 group-hover:text-white font-mono text-[10px] font-bold rounded-md transition-colors">
                          CHỌN →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Gmail Input */}
                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-mono">
                    <span className="bg-[#0e121b] px-3 text-slate-400">HOẶC NHẬP GMAIL BẤT KỲ</span>
                  </div>
                </div>

                <form onSubmit={handleCustomGoogleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-mono uppercase font-bold text-slate-300 mb-1">
                      Địa chỉ Gmail:
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        placeholder="tenbacsi@gmail.com"
                        className="w-full h-9 pl-9 pr-3 bg-[#090b10] border border-slate-700 focus:border-emerald-500 rounded-md text-xs text-white placeholder-slate-500 font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-mono uppercase font-bold text-slate-300 mb-1">
                        Họ tên Bác Sĩ:
                      </label>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="BS. Trần Văn Diệu"
                        className="w-full h-9 px-2.5 bg-[#090b10] border border-slate-700 focus:border-emerald-500 rounded-md text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono uppercase font-bold text-slate-300 mb-1">
                        Chức danh:
                      </label>
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-full h-9 px-2 bg-[#090b10] border border-slate-700 focus:border-emerald-500 rounded-md text-xs text-white focus:outline-none"
                      >
                        <option value="Bác Sĩ Trưởng Phòng Khám">Bác Sĩ Trưởng</option>
                        <option value="Bác Sĩ Khám Bệnh">Bác Sĩ Khám Bệnh</option>
                        <option value="Dược Sĩ Phụ Trách">Dược Sĩ Phụ Trách</option>
                        <option value="Điều Dưỡng / Tiếp Đón">Điều Dưỡng</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-9 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-md text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>ĐĂNG NHẬP VỚI TÀI KHOẢN GMAIL NÀY</span>
                  </button>
                </form>
              </div>
            )}

            {tab === 'email' && (
              <form onSubmit={handleCustomGoogleSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-mono uppercase font-bold text-slate-300 mb-1">
                    Email hoặc Mã định danh Y tế:
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="tranminhhuy3031998@gmail.com"
                      className="w-full h-9 pl-9 pr-3 bg-[#090b10] border border-slate-700 focus:border-emerald-500 rounded-md text-white placeholder-slate-500 font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase font-bold text-slate-300 mb-1">
                    Mật khẩu / Mã CCHN:
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-9 pl-9 pr-3 bg-[#090b10] border border-slate-700 focus:border-emerald-500 rounded-md text-white placeholder-slate-500 font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase font-bold text-slate-300 mb-1">
                    Họ tên Bác Sĩ:
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="BS. Trần Văn Diệu"
                    className="w-full h-9 px-3 bg-[#090b10] border border-slate-700 focus:border-emerald-500 rounded-md text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-9 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-md text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>XÁC NHẬN ĐĂNG NHẬP HỆ THỐNG</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Institutional Footer */}
      <footer className="relative z-10 py-3 px-6 border-t border-slate-800 bg-[#0d1017] text-[11px] font-mono text-slate-400">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>CHỨNG THỰC BẢO MẬT Y TẾ 256-BIT</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>CHUẨN THÔNG TƯ 52/2017/TT-BYT</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>TÍCH HỢP TRỢ LÝ DƯỢC LÂM SÀNG GEMINI AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
