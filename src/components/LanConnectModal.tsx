import React, { useState, useEffect, useMemo } from 'react';
import { generateQrMatrix } from '../utils/qrSvg';
import {
  Wifi,
  Smartphone,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  X,
  ShieldCheck,
  Terminal,
  Laptop,
  CheckCircle2,
  ExternalLink,
  Share2,
} from 'lucide-react';

interface LanAddress {
  ip: string;
  url: string;
  interfaceName: string;
  isPreferred: boolean;
}

interface LanInfoResponse {
  success: boolean;
  hostname: string;
  port: number;
  primaryLanUrl: string;
  primaryIp: string;
  addresses: LanAddress[];
  serverTime: string;
}

interface LanConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  lastSyncedAt?: string | null;
  onManualSync?: () => Promise<void>;
  totalPatients: number;
  totalPrescriptions: number;
}

export const LanConnectModal: React.FC<LanConnectModalProps> = ({
  isOpen,
  onClose,
  lastSyncedAt,
  onManualSync,
  totalPatients,
  totalPrescriptions,
}) => {
  const [lanInfo, setLanInfo] = useState<LanInfoResponse | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedFirewall, setCopiedFirewall] = useState(false);

  const fetchLanInfo = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/lan-info');
      if (res.ok) {
        const data: LanInfoResponse = await res.json();
        setLanInfo(data);
        if (data.primaryLanUrl) {
          setSelectedUrl(data.primaryLanUrl);
        }
      }
    } catch {
      const fallbackUrl = window.location.origin;
      setSelectedUrl(fallbackUrl);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLanInfo();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const activeUrl = selectedUrl || lanInfo?.primaryLanUrl || window.location.origin;

  const qrMatrix = useMemo(() => {
    try {
      return generateQrMatrix(activeUrl);
    } catch {
      return [];
    }
  }, [activeUrl]);

  if (!isOpen) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(activeUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const firewallCmd = `New-NetFirewallRule -DisplayName "Phong Kham BS Dieu LAN (Port ${lanInfo?.port || 3001})" -Direction Inbound -LocalPort ${lanInfo?.port || 3001} -Protocol TCP -Action Allow`;

  const handleCopyFirewall = () => {
    navigator.clipboard.writeText(firewallCmd);
    setCopiedFirewall(true);
    setTimeout(() => setCopiedFirewall(false), 2000);
  };

  const handleTriggerSync = async () => {
    if (!onManualSync) return;
    setSyncing(true);
    try {
      await onManualSync();
    } finally {
      setTimeout(() => setSyncing(false), 400);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 dark:bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lan-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 rounded-md max-w-4xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 flex flex-col max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-emerald-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-white/15 flex items-center justify-center border border-white/20 shrink-0">
              <Wifi className="w-5 h-5 text-emerald-300" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="lan-modal-title" className="text-base sm:text-lg font-black tracking-tight text-white">
                  Kết Nối iPhone &amp; Điện Thoại Nội Bộ (Mạng LAN Wi-Fi)
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-emerald-500/20 text-emerald-200 border border-emerald-400/40">
                  Đồng bộ 2 chiều
                </span>
              </div>
              <p className="text-xs text-emerald-100/90">
                Sử dụng nội bộ tại nhà: Quét mã QR bằng Camera iPhone để nhập bệnh nhân, xem hồ sơ &amp; đồng bộ trực tiếp với máy tính
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ kết nối mạng nội bộ"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-6 text-xs sm:text-sm">
          {/* Top Grid: QR Code + Connection Details */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-emerald-50/50 dark:bg-emerald-950/20 p-5 rounded-md border border-emerald-200/80 dark:border-emerald-800/60">
            {/* QR Code Column */}
            <div className="md:col-span-5 flex flex-col items-center justify-center bg-white p-4 rounded-md border-2 border-emerald-700 shadow-sm">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-2">
                <QrCode className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                <span>Mở Camera iPhone quét mã này</span>
              </div>

              {qrMatrix.length > 0 ? (
                <div className="p-2 bg-white rounded">
                  <svg
                    viewBox={`0 0 ${qrMatrix.length + 4} ${qrMatrix.length + 4}`}
                    className="w-44 h-44 sm:w-48 sm:h-48"
                    shapeRendering="crispEdges"
                    role="img"
                    aria-label={`Mã QR kết nối ${activeUrl}`}
                  >
                    <rect width="100%" height="100%" fill="#ffffff" />
                    {qrMatrix.map((row, rIdx) =>
                      row.map((cell, cIdx) =>
                        cell ? (
                          <rect
                            key={`${rIdx}-${cIdx}`}
                            x={cIdx + 2}
                            y={rIdx + 2}
                            width={1}
                            height={1}
                            fill="#064e3b"
                          />
                        ) : null
                      )
                    )}
                  </svg>
                </div>
              ) : (
                <div className="w-44 h-44 flex items-center justify-center text-slate-400">
                  Đang tạo mã QR...
                </div>
              )}

              <span className="mt-2 font-mono font-bold text-xs text-slate-900 bg-emerald-100 px-2.5 py-1 rounded border border-emerald-300">
                {activeUrl}
              </span>
            </div>

            {/* Right Column: Instructions & LAN Selector */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                  Địa chỉ truy cập trên iPhone / iPad / Android cùng mạng Wi-Fi:
                </span>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={activeUrl}
                    className="flex-1 min-h-[42px] px-3.5 py-2 rounded-md border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 font-mono font-bold text-sm sm:text-base text-emerald-900 dark:text-emerald-300 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="min-h-[42px] px-4 py-2 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold rounded-md text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" aria-hidden="true" />
                        <span>Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" aria-hidden="true" />
                        <span>Sao chép Link</span>
                      </>
                    )}
                  </button>
                  <a
                    href={activeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[42px] px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-md flex items-center justify-center transition-colors"
                    title="Mở thử trong tab mới"
                  >
                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  </a>
                </div>
              </div>

              {/* Network Interfaces List if multiple */}
              {lanInfo && lanInfo.addresses.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Chọn card mạng nội bộ (Máy chủ: {lanInfo.hostname}):
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {lanInfo.addresses.map((addr) => (
                      <button
                        key={addr.url}
                        type="button"
                        onClick={() => setSelectedUrl(addr.url)}
                        className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeUrl === addr.url
                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-emerald-500'
                        }`}
                      >
                        <Wifi className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{addr.ip}:{lanInfo.port}</span>
                        <span className="text-[10px] opacity-80">({addr.interfaceName})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Real-time Multi-Device Sync Status Box */}
              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-400 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Đồng bộ dữ liệu tự động (Máy tính ↔ iPhone): ĐANG BẬT</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Đang lưu trữ <strong>{totalPatients} bệnh nhân</strong> &amp; <strong>{totalPrescriptions} đơn thuốc</strong> tại máy chủ nhà.
                    {lastSyncedAt ? ` Cập nhật lúc: ${new Date(lastSyncedAt).toLocaleTimeString('vi-VN')}` : ''}
                  </p>
                </div>

                {onManualSync && (
                  <button
                    type="button"
                    onClick={handleTriggerSync}
                    disabled={syncing || loading}
                    className="min-h-[38px] px-3.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-bold rounded-md text-xs flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-700 transition-colors shrink-0 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} aria-hidden="true" />
                    <span>{syncing ? 'Đang đồng bộ...' : 'Đồng Bộ Ngay'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 3-Step Guide for iPhone & Home Local Network */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                <Smartphone className="w-4 h-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                <span>Bước 1: Kết nối cùng Wi-Fi</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Đảm bảo <strong>iPhone / Điện thoại</strong> và <strong>Máy tính đang chạy phần mềm</strong> kết nối vào cùng một mạng Wi-Fi gia đình. Mở Camera iPhone quét mã QR ở trên để mở trang.
              </p>
            </div>

            <div className="p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                <Share2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                <span>Bước 2: Tạo App trên iPhone</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Trên trình duyệt Safari của iPhone, bấm nút <strong>Chia sẻ (Share)</strong> ở thanh dưới cùng → chọn <strong>&quot;Thêm vào MH chính&quot; (Add to Home Screen)</strong> để dùng toàn màn hình như ứng dụng iOS.
              </p>
            </div>

            <div className="p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                <Laptop className="w-4 h-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                <span>Bước 3: Nhập trên ĐT, In trên PC</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Bác sĩ hoặc người nhà có thể tiếp nhận bệnh nhân, nhập huyết áp ngay trên iPhone; dữ liệu tự động đồng bộ về máy tính để in toa thuốc ra máy in!
              </p>
            </div>
          </div>

          {/* Windows Firewall Helper Box */}
          <div className="p-4 rounded-md border border-amber-200 dark:border-amber-800/80 bg-amber-50/60 dark:bg-amber-950/30 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 font-bold text-amber-950 dark:text-amber-200 text-xs">
                <Terminal className="w-4 h-4 text-amber-700 dark:text-amber-400" aria-hidden="true" />
                <span>Mẹo xử lý nếu iPhone báo không mở được trang (Do tường lửa Windows chặn cổng {lanInfo?.port || 3001}):</span>
              </div>
              <button
                type="button"
                onClick={handleCopyFirewall}
                className="px-3 py-1 bg-amber-200/80 hover:bg-amber-300 dark:bg-amber-900 dark:hover:bg-amber-800 text-amber-950 dark:text-amber-100 rounded text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedFirewall ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFirewall ? 'Đã chép lệnh mở cổng' : 'Chép lệnh mở Firewall'}</span>
              </button>
            </div>
            <p className="text-[11px] text-amber-900 dark:text-amber-300">
              Mở <strong>PowerShell (Run as Administrator)</strong> trên máy tính Windows và dán lệnh sau (chỉ cần chạy 1 lần duy nhất):
            </p>
            <pre className="p-2.5 rounded bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto">
              {firewallCmd}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
            <span>Mạng nội bộ khép kín (Local LAN Only) — Dữ liệu không đi ra ngoài Internet</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-md text-xs transition-colors cursor-pointer"
          >
            Đóng (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
