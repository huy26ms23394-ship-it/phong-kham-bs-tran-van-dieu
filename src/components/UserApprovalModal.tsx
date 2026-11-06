import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  UserPlus,
  Shield,
  Clock,
  RefreshCw,
  X,
  AlertCircle,
  UserCheck,
  Ban,
  Mail,
  HeartHandshake,
  KeyRound,
} from 'lucide-react';
import { ClinicUser, UserRole, UserStatus } from '../types/auth';
import {
  fetchUsers,
  approveUser,
  preApproveUser,
  deleteUser,
} from '../utils/authClient';

interface UserApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUsersUpdated?: () => void;
  onOpenChangePassword?: () => void;
}

export const UserApprovalModal: React.FC<UserApprovalModalProps> = ({
  isOpen,
  onClose,
  onUsersUpdated,
  onOpenChangePassword,
}) => {
  const [tab, setTab] = useState<'pending' | 'approved' | 'preapprove'>('pending');
  const [users, setUsers] = useState<ClinicUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Pre-approve form state
  const [preEmail, setPreEmail] = useState('');
  const [preName, setPreName] = useState('');
  const [preRole, setPreRole] = useState<UserRole>('DOCTOR');
  const [isSubmittingPre, setIsSubmittingPre] = useState(false);

  // Selected roles per pending user
  const [roleMap, setRoleMap] = useState<Record<string, UserRole>>({});

  const loadUsers = async () => {
    setIsLoading(true);
    setActionError(null);
    const data = await fetchUsers();
    setUsers(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const pendingUsers = users.filter((u) => u.status === 'PENDING');
  const approvedUsers = users.filter((u) => u.status === 'APPROVED');

  const handleRoleChange = (email: string, role: UserRole) => {
    setRoleMap((prev) => ({ ...prev, [email]: role }));
  };

  const handleApprove = async (email: string) => {
    setActionError(null);
    setActionSuccess(null);
    const role = roleMap[email] || 'DOCTOR';
    const res = await approveUser(email, 'APPROVED', role);
    if (res.success) {
      setActionSuccess(`Đã phê duyệt tài khoản ${email} với vai trò ${role}`);
      await loadUsers();
      if (onUsersUpdated) onUsersUpdated();
    } else {
      setActionError(res.error || 'Phê duyệt thất bại');
    }
  };

  const handleRevoke = async (email: string) => {
    if (!window.confirm(`Bạn có chắc muốn thu hồi quyền truy cập của ${email}?`)) {
      return;
    }
    setActionError(null);
    setActionSuccess(null);
    const res = await approveUser(email, 'REVOKED');
    if (res.success) {
      setActionSuccess(`Đã khóa quyền truy cập của ${email}`);
      await loadUsers();
      if (onUsersUpdated) onUsersUpdated();
    } else {
      setActionError(res.error || 'Thu hồi thất bại');
    }
  };

  const handleDelete = async (email: string) => {
    if (!window.confirm(`Xóa hoàn toàn tài khoản ${email} khỏi hệ thống?`)) {
      return;
    }
    const res = await deleteUser(email);
    if (res.success) {
      setActionSuccess(`Đã xóa tài khoản ${email}`);
      await loadUsers();
      if (onUsersUpdated) onUsersUpdated();
    }
  };

  const handlePreApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preEmail.trim()) {
      setActionError('Vui lòng nhập địa chỉ email Google');
      return;
    }
    setIsSubmittingPre(true);
    setActionError(null);
    setActionSuccess(null);

    const res = await preApproveUser(preEmail.trim().toLowerCase(), preName.trim(), preRole);
    setIsSubmittingPre(false);

    if (res.success) {
      setActionSuccess(`Đã thêm ${preEmail} vào Danh Sách Trắng. Người thân có thể đăng nhập Google vào thẳng ngay!`);
      setPreEmail('');
      setPreName('');
      await loadUsers();
      if (onUsersUpdated) onUsersUpdated();
    } else {
      setActionError(res.error || 'Thêm vào danh sách trắng thất bại');
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Quản trị viên tối cao (Admin)';
      case 'DOCTOR':
        return 'Bác Sĩ Khám Bệnh';
      case 'RECEPTIONIST':
        return 'Tiếp Tân / Lễ Tân';
      case 'PHARMACIST':
        return 'Dược Sĩ / Thu Ngân';
      default:
        return role;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-emerald-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-tight">
                Quản Lý Thành Viên & Phê Duyệt Zero-Trust
              </h3>
              <p className="text-[11px] text-emerald-200">
                Phân quyền truy cập hồ sơ bệnh án Bác sĩ Trần Văn Diệu
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenChangePassword && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenChangePassword();
                }}
                className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                title="Đổi mật khẩu tài khoản Master Admin"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Đổi MK Admin</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 pt-2 gap-2 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setTab('pending')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              tab === 'pending'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Chờ Phê Duyệt
            {pendingUsers.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-mono animate-pulse">
                {pendingUsers.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTab('approved')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              tab === 'approved'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Đã Phê Duyệt ({approvedUsers.length})
          </button>

          <button
            type="button"
            onClick={() => setTab('preapprove')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              tab === 'preapprove'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Thêm Trước Người Thân (Whitelist)
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3">
          {actionError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {actionSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* TAB 1: PENDING USERS */}
          {tab === 'pending' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Danh sách tài khoản Google vừa đăng nhập lần đầu và đang chờ bạn phê duyệt:</span>
                <button
                  type="button"
                  onClick={loadUsers}
                  className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  Làm mới
                </button>
              </div>

              {pendingUsers.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <HeartHandshake className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Hiện tại không có tài khoản nào trong phòng chờ!
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Khi người thân đăng nhập Google lần đầu, yêu cầu sẽ hiển thị tại đây.
                  </p>
                </div>
              ) : (
                pendingUsers.map((u) => (
                  <div
                    key={u.id || u.email}
                    className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {u.avatar_url ? (
                        <img
                          src={u.avatar_url}
                          alt={u.full_name || u.email}
                          className="w-10 h-10 rounded-full border border-amber-300 object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 flex items-center justify-center font-bold shrink-0">
                          {u.email.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {u.full_name || 'Người dùng mới'}
                        </div>
                        <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 truncate">
                          {u.email}
                        </div>
                        <div className="text-[10px] text-amber-700 dark:text-amber-400">
                          Chờ từ: {new Date(u.requested_at || Date.now()).toLocaleTimeString('vi-VN')} {new Date(u.requested_at || Date.now()).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <select
                        value={roleMap[u.email] || u.role || 'DOCTOR'}
                        onChange={(e) => handleRoleChange(u.email, e.target.value as UserRole)}
                        className="py-1 px-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="DOCTOR">Bác Sĩ</option>
                        <option value="RECEPTIONIST">Lễ Tân</option>
                        <option value="PHARMACIST">Dược Sĩ / Thu Ngân</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleApprove(u.email)}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Duyệt
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRevoke(u.email)}
                        className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Từ chối
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: APPROVED USERS */}
          {tab === 'approved' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500">
                Danh sách các tài khoản có quyền truy cập vào phần mềm phòng khám:
              </div>

              {approvedUsers.map((u) => {
                const isSuperAdmin = u.role === 'SUPER_ADMIN';
                return (
                  <div
                    key={u.id || u.email}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {u.avatar_url ? (
                        <img
                          src={u.avatar_url}
                          alt={u.full_name || u.email}
                          className="w-9 h-9 rounded-full border border-emerald-500 object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                          {u.email.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span className="truncate">{u.full_name || u.email}</span>
                          {isSuperAdmin && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-[10px] font-bold">
                              MASTER ADMIN
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 truncate">
                          {u.email} · {getRoleLabel(u.role)}
                        </div>
                      </div>
                    </div>

                    {!isSuperAdmin && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.email, e.target.value as UserRole)}
                          onBlur={() => {
                            if (roleMap[u.email] && roleMap[u.email] !== u.role) {
                              handleApprove(u.email);
                            }
                          }}
                          className="py-1 px-2 text-[11px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                        >
                          <option value="DOCTOR">Bác Sĩ</option>
                          <option value="RECEPTIONIST">Lễ Tân</option>
                          <option value="PHARMACIST">Dược Sĩ / Thu Ngân</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleRevoke(u.email)}
                          title="Khóa hoặc thu hồi quyền truy cập"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg cursor-pointer transition-colors"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: PRE-APPROVE FAMILY WHITELIST */}
          {tab === 'preapprove' && (
            <form onSubmit={handlePreApproveSubmit} className="space-y-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Cơ chế Thêm Trước (Pre-approve Whitelist):
                </p>
                <p>
                  Nhập trước email Google của người thân trong gia đình hoặc trợ lý phòng khám tại đây. Khi họ bấm nút <strong>'Đăng nhập bằng Google'</strong> lần đầu, hệ thống sẽ tự động đối chiếu và cho vào thẳng ngay lập tức mà không phải qua phòng chờ!
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Google của người thân (@gmail.com) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={preEmail}
                    onChange={(e) => setPreEmail(e.target.value)}
                    placeholder="nguoithan@gmail.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Họ và tên người thân (Hiển thị)
                </label>
                <input
                  type="text"
                  value={preName}
                  onChange={(e) => setPreName(e.target.value)}
                  placeholder="Ví dụ: Vợ / Con / Trợ lý Lễ tân"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vai trò phân quyền
                </label>
                <select
                  value={preRole}
                  onChange={(e) => setPreRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="DOCTOR">Bác Sĩ Khám Bệnh</option>
                  <option value="RECEPTIONIST">Lễ Tân (Tiếp nhận & Quản lý danh sách bệnh nhân)</option>
                  <option value="PHARMACIST">Dược Sĩ / Thu Ngân (Phát thuốc & Thu tiền đơn thuốc)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmittingPre}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <UserPlus className="w-4 h-4" />
                {isSubmittingPre ? 'Đang thêm vào Whitelist...' : 'Thêm Vào Danh Sách Trắng'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold cursor-pointer transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
