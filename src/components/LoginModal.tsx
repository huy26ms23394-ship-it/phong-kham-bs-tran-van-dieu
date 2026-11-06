import React, { useState } from 'react';
import {
  X,
  Mail,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { GoogleUser } from './AuthScreen';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: GoogleUser;
  onLogin: (user: GoogleUser) => void;
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
    role: 'Điều Dưỡng & Tiếp Đón',
    cchn: '11204/HCM-DD',
    avatar: 'H',
  },
];

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
}) => {
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [selectedRole, setSelectedRole] = useState('Bác Sĩ Trưởng Phòng Khám');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSelectPreset = (acc: typeof PRESET_ACCOUNTS[0]) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin({
        name: acc.name,
        email: acc.email,
        role: acc.role,
        isSignedIn: true,
      });
      onClose();
    }, 250);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin({
        name: customName.trim() || `Bác Sĩ ${customEmail.split('@')[0]}`,
        email: customEmail.trim(),
        role: selectedRole,
        isSignedIn: true,
      });
      onClose();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-[#0e121b] rounded-md max-w-md w-full shadow-2xl border border-slate-300 dark:border-slate-700 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-slate-900 dark:bg-[#131824] text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-emerald-800 border border-emerald-600 flex items-center justify-center text-emerald-100">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white uppercase tracking-tight">
                Đăng Nhập Gmail / Đổi Tài Khoản
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                GOOGLE WORKSPACE CLINICAL AUTH
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Current Status */}
          {currentUser.isSignedIn && (
            <div className="p-3 bg-slate-50 dark:bg-[#131824] border border-slate-200 dark:border-slate-800 rounded-md flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                  TÀI KHOẢN HIỆN TẠI:
                </div>
                <div className="text-xs font-extrabold text-slate-900 dark:text-white uppercase mt-0.5">
                  {currentUser.name}
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {currentUser.email}
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-900 text-emerald-100 font-mono font-bold text-[10px]">
                {currentUser.role}
              </span>
            </div>
          )}

          {/* Fast Switch Preset */}
          <div>
            <div className="text-[10px] uppercase tracking-wider font-mono font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              CHỌN NHANH TÀI KHOẢN GMAIL PHÒNG KHÁM:
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-300 dark:border-slate-700 rounded-md">
              {PRESET_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleSelectPreset(acc)}
                  className="w-full text-left p-2.5 bg-white dark:bg-[#090b10] hover:bg-emerald-50/50 dark:hover:bg-[#141c2b] transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-emerald-800 text-white font-mono font-bold flex items-center justify-center text-xs">
                      {acc.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                        {acc.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {acc.email}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-800 group-hover:text-white text-slate-700 dark:text-slate-300 rounded-md transition-colors">
                    CHỌN →
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Or Custom Gmail */}
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-mono">
              <span className="bg-white dark:bg-[#0e121b] px-3 text-slate-400">
                HOẶC NHẬP ĐỊA CHỈ GMAIL KHÁC
              </span>
            </div>
          </div>

          <form onSubmit={handleCustomSubmit} className="space-y-3">
            <div>
              <label className="block font-mono text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
                Địa chỉ Gmail:
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="email"
                  required
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="bacsi.dieutri@gmail.com"
                  className="w-full h-8.5 pl-8 pr-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#090b10] text-slate-900 dark:text-slate-100 font-mono text-xs focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-mono text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Họ tên Bác Sĩ:
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="BS. Trần Văn Diệu"
                  className="w-full h-8.5 px-2.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#090b10] text-slate-900 dark:text-slate-100 font-semibold text-xs focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vai trò:
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full h-8.5 px-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#090b10] text-slate-900 dark:text-slate-100 text-xs focus:border-emerald-600 focus:outline-none"
                >
                  <option value="Bác Sĩ Trưởng Phòng Khám">Bác Sĩ Trưởng</option>
                  <option value="Bác Sĩ Khám Bệnh">Bác Sĩ Khám</option>
                  <option value="Dược Sĩ Phụ Trách">Dược Sĩ</option>
                  <option value="Điều Dưỡng">Điều Dưỡng</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-9 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold rounded-md text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>XÁC NHẬN ĐĂNG NHẬP GMAIL</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
