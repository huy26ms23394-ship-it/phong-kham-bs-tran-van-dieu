import React, { useState } from 'react';
import {
  Clock,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Stethoscope,
  Lock,
  User,
  AlertTriangle,
} from 'lucide-react';
import { ClinicUser } from '../types/auth';
import { clearSession, fetchMe } from '../utils/authClient';

interface PendingApprovalScreenProps {
  user: ClinicUser;
  onApproved: (user: ClinicUser) => void;
  onLogout: () => void;
}

export const PendingApprovalScreen: React.FC<PendingApprovalScreenProps> = ({
  user,
  onApproved,
  onLogout,
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    setStatusMessage(null);
    const res = await fetchMe();
    setIsChecking(false);

    if (res.success && res.user) {
      if (res.user.status === 'APPROVED') {
        onApproved(res.user);
      } else if (res.user.status === 'REVOKED') {
        setStatusMessage('Tài khoản của bạn đã bị từ chối hoặc khóa quyền truy cập.');
      } else {
        setStatusMessage('Tài khoản vẫn đang ở trạng thái chờ duyệt. Vui lòng nhắc Bác sĩ Diệu duyệt trên máy chính.');
      }
    } else {
      setStatusMessage('Chưa thể kiểm tra lại trạng thái. Vui lòng thử lại sau.');
    }
  };

  const handleLogoutClick = () => {
    clearSession();
    onLogout();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-center p-6 sm:p-8 animate-fadeIn">
        {/* Top Icon */}
        <div className="relative w-20 h-20 mx-auto mb-4">
          <div className="w-full h-full rounded-2xl bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800/80 flex items-center justify-center shadow-md">
            <Clock className="w-10 h-10 text-amber-600 dark:text-amber-400 animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-600 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white shadow-xs">
            <Stethoscope className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
          Phòng Chờ Phê Duyệt
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
          Tài khoản Google của bạn đang chờ <strong className="text-emerald-700 dark:text-emerald-400">Bác Sĩ Trần Văn Diệu</strong> xác nhận vai trò và cấp quyền truy cập.
        </p>

        {/* User Card */}
        <div className="mt-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-left flex items-center gap-3.5 shadow-2xs">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name || user.email}
              className="w-12 h-12 rounded-full border-2 border-amber-400 object-cover shrink-0 shadow-xs"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-lg shrink-0">
              {user.email.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate block">
                {user.full_name || 'Thành viên mới'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-300/80 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                PENDING
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate block mt-0.5">
              {user.email}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
              Thời gian gửi: {new Date(user.requested_at || Date.now()).toLocaleTimeString('vi-VN')} {new Date(user.requested_at || Date.now()).toLocaleDateString('vi-VN')}
            </span>
          </div>
        </div>

        {/* Security Alert */}
        <div className="mt-4 p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 text-left flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Theo Nghị định 333/2026/NĐ-CP về an toàn hồ sơ bệnh án, toàn bộ dữ liệu đơn thuốc và bệnh nhân sẽ <strong>không được tải về máy</strong> cho đến khi tài khoản được kích hoạt thành công.
          </span>
        </div>

        {statusMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 text-center animate-fadeIn">
            {statusMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 space-y-2">
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={isChecking}
            className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Đang kiểm tra phê duyệt...' : 'Kiểm Tra Lại Trạng Thái'}
          </button>

          <button
            type="button"
            onClick={handleLogoutClick}
            className="w-full py-2 px-4 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Đăng xuất / Đổi tài khoản khác
          </button>
        </div>
      </div>
    </div>
  );
};
