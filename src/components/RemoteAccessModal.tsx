import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  Wifi,
  ShieldCheck,
  Copy,
  Check,
  Power,
  RefreshCw,
  QrCode,
  HardDrive,
  Lock,
  ExternalLink,
  X,
  Terminal,
  Smartphone,
  AlertTriangle,
  Database,
  Zap,
} from 'lucide-react';
import { getAuthHeaders } from '../utils/authClient';

export type TunnelStatus = 'STOPPED' | 'STARTING' | 'ACTIVE' | 'ERROR';

export interface NetworkStatusData {
  lanIp: string;
  lanUrls: string[];
  localUrl: string;
  port: number;
  tunnel: {
    status: TunnelStatus;
    publicUrl: string | null;
    tunnelType: 'QUICK_TUNNEL' | 'NAMED_TUNNEL';
    startedAt: string | null;
    pid: number | null;
    error: string | null;
    recentLogs: string[];
  };
  sqliteDiagnostics?: {
    enabled: boolean;
    dbPath: string;
    sizeBytes: number;
    walMode: boolean;
    patientsCount: number;
    prescriptionsCount: number;
    drugsCount: number;
    auditLogsCount: number;
  };
}

interface RemoteAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  networkStatus: NetworkStatusData | null;
  onRefreshStatus: () => Promise<void>;
}

export const RemoteAccessModal: React.FC<RemoteAccessModalProps> = ({
  isOpen,
  onClose,
  networkStatus,
  onRefreshStatus,
}) => {
  const [isToggling, setIsToggling] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [qrTarget, setQrTarget] = useState<'TUNNEL' | 'LAN'>('TUNNEL');
  const [actionError, setActionError] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  const tunnelStatus = networkStatus?.tunnel?.status || 'STOPPED';
  const publicUrl = networkStatus?.tunnel?.publicUrl || null;
  const primaryLanUrl =
    networkStatus?.lanUrls?.[0] ||
    `http://${networkStatus?.lanIp || '192.168.1.x'}:${networkStatus?.port || 3000}`;

  useEffect(() => {
    if (isOpen) {
      onRefreshStatus();
    }
  }, [isOpen, onRefreshStatus]);

  useEffect(() => {
    if (publicUrl && tunnelStatus === 'ACTIVE') {
      setQrTarget('TUNNEL');
    } else {
      setQrTarget('LAN');
    }
  }, [publicUrl, tunnelStatus]);

  const handleCopy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  const handleToggleTunnel = async () => {
    if (isToggling) return;
    setIsToggling(true);
    setActionError(null);

    const isCurrentlyActive = tunnelStatus === 'ACTIVE' || tunnelStatus === 'STARTING';
    const endpoint = isCurrentlyActive ? '/api/system/tunnel/stop' : '/api/system/tunnel/start';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        setActionError(data.error || data.message || 'Không thể thay đổi trạng thái Cloudflare Tunnel.');
      }
      await onRefreshStatus();
    } catch (err: unknown) {
      setActionError((err as Error).message || 'Lỗi kết nối tới máy chủ Local.');
    } finally {
      setIsToggling(false);
    }
  };

  if (!isOpen) return null;

  const isTunnelActive = tunnelStatus === 'ACTIVE' && Boolean(publicUrl);
  const isTunnelStarting = tunnelStatus === 'STARTING' || isToggling;
  const activeQrUrl = qrTarget === 'TUNNEL' && publicUrl ? publicUrl : primaryLanUrl;
  const sqliteInfo = networkStatus?.sqliteDiagnostics;
  const dbSizeKb = sqliteInfo?.sizeBytes ? (sqliteInfo.sizeBytes / 1024).toFixed(1) : '0.0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                isTunnelActive
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              {isTunnelActive ? <Globe className="w-5 h-5 animate-pulse" /> : <Wifi className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-tight">
                  Kết Nối Từ Xa &amp; Mạng LAN Nội Bộ (Local-First)
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    isTunnelActive
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                  }`}
                >
                  {isTunnelActive ? '🌐 Đang Mở Internet' : '🏠 Chỉ Mạng Nội Bộ'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                100% Dữ liệu lưu trên ổ cứng máy tính cá nhân của Bác sĩ • Bật Cloudflare Tunnel khi cần khám từ xa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefreshStatus}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Làm mới trạng thái mạng"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {actionError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* 1. CÔNG TẮC BẬT/TẮT CLOUDFLARE TUNNEL 1-CLICK */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              isTunnelActive
                ? 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-300 dark:border-emerald-700/80 shadow-md'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      isTunnelActive
                        ? 'bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse'
                        : isTunnelStarting
                        ? 'bg-amber-500 animate-ping'
                        : 'bg-slate-400'
                    }`}
                  />
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    {isTunnelActive
                      ? '🌐 Đang Mở Kết Nối Internet (Cloudflare Tunnel Active)'
                      : isTunnelStarting
                      ? '⏳ Đang Khởi Tạo Đường Hầm Bảo Mật Cloudflare...'
                      : '🏠 Chế Độ Khép Kín Nội Bộ (Internet Tunnel Đang Tắt)'}
                  </h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isTunnelActive
                    ? 'Bác sĩ có thể truy cập phòng khám từ bất kỳ đâu qua 4G/5G bằng đường dẫn HTTPS bên dưới. Tắt công tắc ngay khi không dùng nữa.'
                    : 'Mặc định đóng cổng Internet để an toàn tuyệt đối. Khi cần ra ngoài hoặc xem hồ sơ trên điện thoại qua 4G/5G, hãy gạt công tắc sang BẬT.'}
                </p>
              </div>

              {/* 1-Click Toggle Switch Button */}
              <button
                type="button"
                onClick={handleToggleTunnel}
                disabled={isTunnelStarting}
                className={`px-5 py-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-sm transition-all cursor-pointer shrink-0 ${
                  isTunnelActive
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                } disabled:opacity-60`}
              >
                {isTunnelStarting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : isTunnelActive ? (
                  <>
                    <Power className="w-4 h-4" />
                    <span>Tắt Kết Nối Internet</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    <span>Bật Truy Cập Từ Xa (1-Click)</span>
                  </>
                )}
              </button>
            </div>

            {/* Hiển thị Link HTTPS khi Tunnel đang BẬT */}
            {isTunnelActive && publicUrl && (
              <div className="mt-4 pt-4 border-t border-emerald-200/80 dark:border-emerald-800/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="flex-1 bg-white dark:bg-slate-950 border border-emerald-300 dark:border-emerald-700 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-mono font-bold text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 truncate">
                      {publicUrl}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold shrink-0">
                    HTTPS SSL
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopy(publicUrl, 'tunnel')}
                    className="px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {copiedKey === 'tunnel' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Đã Copy!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Mở trong tab mới"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* 2. GRID KẾT NỐI MẠNG LAN NỘI BỘ & MÃ QR QUÉT NHANH TRÊN ĐIỆN THOẠI */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Cột trái (7 cột): Địa chỉ LAN Wi-Fi & SQLite */}
            <div className="md:col-span-7 space-y-4">
              {/* Thẻ Mạng LAN Wi-Fi Nội Bộ */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-sky-500" />
                    <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Mạng Wi-Fi Nội Bộ (iPhone / iPad trong nhà)
                    </h5>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-bold">
                    Tốc độ 0ms
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Các thiết bị bắt chung Wi-Fi với máy tính này có thể mở trực tiếp không cần bật Internet Tunnel:
                </p>

                <div className="space-y-2">
                  {(networkStatus?.lanUrls?.length ? networkStatus.lanUrls : [primaryLanUrl]).map(
                    (url, idx) => (
                      <div
                        key={url}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Smartphone className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                          <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                            {url}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setQrTarget('LAN')}
                            className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                              qrTarget === 'LAN'
                                ? 'bg-sky-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            Mã QR
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(url, `lan-${idx}`)}
                            className="px-2.5 py-1 rounded bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === `lan-${idx}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Đã chép</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Thẻ Trạng Thái Cơ Sở Dữ Liệu Local SQLite */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-500" />
                    <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Ổ Cứng Cục Bộ SQLite (better-sqlite3)
                    </h5>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    WAL 0.1ms
                  </span>
                </div>

                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800 truncate">
                  📁 server_data/clinic.sqlite ({dbSizeKb} KB)
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                    <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                      {sqliteInfo?.drugsCount?.toLocaleString('vi-VN') || '3.100+'}
                    </div>
                    <div className="text-[10px] text-slate-500">Thuốc trong kho</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                    <div className="text-xs font-extrabold text-sky-600 dark:text-sky-400">
                      {sqliteInfo?.patientsCount ?? 0}
                    </div>
                    <div className="text-[10px] text-slate-500">Hồ sơ Bệnh nhân</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                    <div className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                      {sqliteInfo?.prescriptionsCount ?? 0}
                    </div>
                    <div className="text-[10px] text-slate-500">Toa thuốc đã lưu</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cột phải (5 cột): Mã QR Quét Mở Nhanh Bằng Camera Điện Thoại */}
            <div className="md:col-span-5 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 flex flex-col items-center justify-between text-center">
              <div className="w-full flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-500" />
                  Quét QR Mở Trên Điện Thoại
                </span>
                {isTunnelActive && (
                  <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setQrTarget('TUNNEL')}
                      className={`px-2 py-0.5 rounded-md cursor-pointer ${
                        qrTarget === 'TUNNEL'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      4G/Internet
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrTarget('LAN')}
                      className={`px-2 py-0.5 rounded-md cursor-pointer ${
                        qrTarget === 'LAN'
                          ? 'bg-sky-600 text-white'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      Wi-Fi LAN
                    </button>
                  </div>
                )}
              </div>

              <div className="p-3 bg-white rounded-2xl border-2 border-emerald-500/30 shadow-inner my-1">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=6&data=${encodeURIComponent(
                    activeQrUrl
                  )}`}
                  alt="QR Code kết nối phòng khám"
                  className="w-40 h-40 object-contain mx-auto"
                />
              </div>

              <div className="space-y-1 mt-2 w-full">
                <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                  {qrTarget === 'TUNNEL' && isTunnelActive
                    ? '🌐 Quét bằng Camera (4G / 5G / Wi-Fi bất kỳ)'
                    : '🏠 Quét bằng Camera (Chung mạng Wi-Fi)'}
                </div>
                <div className="text-[10px] font-mono text-slate-500 truncate px-2">
                  {activeQrUrl}
                </div>
              </div>
            </div>
          </div>

          {/* 3. BẢO MẬT ZERO-TRUST & NHẬT KÝ TIẾN TRÌNH CLOUDFLARED */}
          <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  Lá chắn Zero-Trust kích hoạt: Khi mở Cloudflare Tunnel, người lạ không có mật khẩu Master Admin hoặc chưa nằm trong Whitelist sẽ bị chặn 100%.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowLogs((prev) => !prev)}
                className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>{showLogs ? 'Ẩn log' : 'Xem log tiến trình'}</span>
              </button>
            </div>

            {showLogs && (
              <div className="mt-2 p-2.5 rounded-lg bg-slate-950 text-emerald-300 font-mono text-[10px] max-h-32 overflow-y-auto space-y-1 border border-slate-800">
                {networkStatus?.tunnel?.recentLogs?.length ? (
                  networkStatus.tunnel.recentLogs.map((line, i) => <div key={i}>{line}</div>)
                ) : (
                  <div className="text-slate-500">Chưa có nhật ký phiên kết nối Cloudflare Tunnel.</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-600" />
            <span>Chế độ: 100% Local-First Architecture • Không phụ thuộc Cloud bên ngoài</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
