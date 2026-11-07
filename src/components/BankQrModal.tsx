import React, { useState, useMemo, useRef } from 'react';
import {
  ClinicSettings,
} from '../types/medical';
import {
  generateVietQrUrl,
  POPULAR_VIETNAMESE_BANKS,
} from '../utils/vietQr';
import {
  QrCode,
  X,
  Copy,
  Check,
  Building,
  User,
  Hash,
  Upload,
  Crop,
  Trash2,
  Download,
  Sparkles,
  Info,
} from 'lucide-react';
import { ImageCropperModal } from './ImageCropperModal';

interface BankQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicInfo: ClinicSettings;
  onUpdateClinicSettings?: (settings: ClinicSettings) => void;
  patientName?: string;
  prescriptionCode?: string;
}

export const BankQrModal: React.FC<BankQrModalProps> = ({
  isOpen,
  onClose,
  clinicInfo,
  onUpdateClinicSettings,
  patientName,
  prescriptionCode,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedRawImage, setSelectedRawImage] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bankId = clinicInfo.bankId || 'VCB';
  const accountNo = clinicInfo.bankAccountNo || '0071000987654';
  const accountName = clinicInfo.bankAccountName || clinicInfo.doctorName || 'TRAN VAN DIEU';

  const defaultTransferContent = useMemo(() => {
    if (prescriptionCode) {
      return `${String(prescriptionCode).replace(/[^a-zA-Z0-9]/g, '')} ${patientName || ''}`.trim().slice(0, 30);
    }
    return `KHAM BENH ${patientName || ''}`.trim().slice(0, 30);
  }, [prescriptionCode, patientName]);

  // Tạo URL VietQR dự phòng nếu chưa có ảnh tải lên
  const generatedVietQrUrl = useMemo(() => {
    return generateVietQrUrl({
      bankId,
      accountNo,
      accountName,
      amount: 0,
      content: defaultTransferContent,
      template: 'compact2',
    });
  }, [bankId, accountNo, accountName, defaultTransferContent]);

  const bankInfo = useMemo(() => {
    return POPULAR_VIETNAMESE_BANKS.find((b) => b.id.toUpperCase() === bankId.toUpperCase()) || {
      id: bankId,
      name: clinicInfo.bankName || 'Ngân hàng',
      shortName: bankId,
    };
  }, [bankId, clinicInfo.bankName]);

  const handleCopy = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Mở chọn file ảnh
  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh (PNG, JPG, WEBP)!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setSelectedRawImage(event.target.result);
        setIsCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);

    // Reset input để có thể chọn lại file cùng tên nếu muốn
    e.target.value = '';
  };

  // Hoàn tất cắt ảnh 3:4 và lưu vào clinicInfo
  const handleCropComplete = (croppedBase64: string) => {
    if (onUpdateClinicSettings) {
      onUpdateClinicSettings({
        ...clinicInfo,
        bankQrImage: croppedBase64,
      });
    }
    setSelectedRawImage(null);
  };

  // Xóa ảnh tùy chỉnh, quay về VietQR tạo tự động
  const handleRemoveCustomQr = () => {
    if (window.confirm('Bạn có chắc muốn xóa ảnh mã QR đã tải lên và dùng mã VietQR mặc định?')) {
      if (onUpdateClinicSettings) {
        onUpdateClinicSettings({
          ...clinicInfo,
          bankQrImage: undefined,
        });
      }
    }
  };

  // Tải ảnh QR về máy
  const handleDownloadQr = () => {
    const src = clinicInfo.bankQrImage || generatedVietQrUrl;
    const a = document.createElement('a');
    a.href = src;
    a.download = `QR_NganHang_${bankId}_${accountNo}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen) return null;

  const currentQrImage = clinicInfo.bankQrImage;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-emerald-950 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
                <QrCode className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold">
                  Mã QR Ngân Hàng Phòng Khám
                </h2>
                <p className="text-xs text-emerald-100">
                  {clinicInfo.clinicName || 'Phòng Khám Bác Sĩ'} • Quét mã chuyển khoản nhanh 24/7
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Input file ẩn để tải ảnh */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleSelectFile}
            />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* Cột trái: Khung hiển thị Mã QR (Chuẩn tỉ lệ 3:4) */}
              <div className="md:col-span-6 flex flex-col items-center">
                <div className="relative group bg-slate-100 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm w-full max-w-[270px] flex flex-col items-center">
                  {/* Badge định dạng */}
                  <div className="w-full flex items-center justify-between pb-2 text-[11px] font-bold">
                    {currentQrImage ? (
                      <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        Ảnh QR chuẩn 3:4
                      </span>
                    ) : (
                      <span className="text-blue-700 dark:text-blue-400 flex items-center gap-1">
                        <QrCode className="w-3.5 h-3.5" />
                        VietQR tự động
                      </span>
                    )}

                    <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px]">
                      3:4
                    </span>
                  </div>

                  {/* Vùng hiển thị ảnh với tỉ lệ 3:4 */}
                  <div className="w-full aspect-3/4 bg-white rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center p-1 shadow-inner relative">
                    <img
                      src={currentQrImage || generatedVietQrUrl}
                      alt="Mã QR Chuyển Khoản Ngân Hàng"
                      className="w-full h-full object-contain rounded"
                    />
                  </div>

                  {/* Nút thao tác dưới ảnh */}
                  <div className="w-full grid grid-cols-2 gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                      title="Tải ảnh mã QR mới và cắt theo tỉ lệ 3:4"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{currentQrImage ? 'Đổi Ảnh' : 'Tải Ảnh Lên'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadQr}
                      className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      title="Tải ảnh QR về máy tính"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải Về</span>
                    </button>
                  </div>

                  {currentQrImage && (
                    <button
                      type="button"
                      onClick={handleRemoveCustomQr}
                      className="w-full mt-2 py-1 text-[11px] text-rose-600 dark:text-rose-400 hover:underline flex items-center justify-center gap-1 cursor-pointer"
                      title="Xóa ảnh tùy chỉnh và quay lại mã VietQR tạo tự động"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Xóa ảnh &amp; dùng VietQR chuẩn</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 text-center max-w-[260px]">
                  Bệnh nhân dùng app mọi ngân hàng hoặc ví điện tử để quét mã này.
                </p>
              </div>

              {/* Cột phải: Thông tin chi tiết tài khoản ngân hàng & Hướng dẫn */}
              <div className="md:col-span-6 space-y-4">
                <div className="bg-slate-50 dark:bg-[#121824] p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-emerald-600" />
                    <span>Thông Tin Tài Khoản Ngân Hàng</span>
                  </h4>

                  {/* Ngân hàng */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Ngân hàng:</span>
                    <strong className="text-slate-900 dark:text-slate-100 text-right">
                      {bankInfo.shortName} ({bankId})
                    </strong>
                  </div>

                  {/* Số tài khoản */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-slate-500" />
                      Số tài khoản:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(accountNo, 'acc')}
                      className="font-mono font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 hover:underline cursor-pointer bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800"
                      title="Nhấn để sao chép số tài khoản"
                    >
                      <span className="text-sm">{accountNo}</span>
                      {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Chủ tài khoản */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      Chủ tài khoản:
                    </span>
                    <strong className="text-slate-900 dark:text-slate-100 uppercase">
                      {accountName}
                    </strong>
                  </div>

                  {/* Nội dung gợi ý */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Nội dung CK:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(defaultTransferContent, 'content')}
                      className="font-mono font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 hover:underline cursor-pointer"
                      title="Nhấn để sao chép nội dung chuyển khoản"
                    >
                      <span className="truncate max-w-[150px]">{defaultTransferContent}</span>
                      {copiedField === 'content' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Khối hướng dẫn tải ảnh cắt 3:4 */}
                <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-emerald-900 dark:text-emerald-200 space-y-1">
                      <p className="font-bold">Tính năng tải ảnh &amp; cắt chuẩn 3:4:</p>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-emerald-800 dark:text-emerald-300">
                        <li>Bấm nút <strong>Tải Ảnh Lên</strong> để chọn ảnh mã QR ngân hàng từ máy tính/điện thoại.</li>
                        <li>Hệ thống tự động mở công cụ cắt ảnh khóa tỉ lệ <strong>3:4</strong> (tỉ lệ chuẩn của poster / standee ngân hàng).</li>
                        <li>Bạn có thể phóng to, thu nhỏ, xoay 90° và kéo di chuyển ảnh để vừa vặn.</li>
                      </ul>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full mt-1 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <Crop className="w-3.5 h-3.5" />
                    <span>Tải File Ảnh &amp; Cắt Theo Tỉ Lệ 3:4</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 sm:p-4 bg-slate-50 dark:bg-[#121824] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              * Mã QR sẽ được lưu trữ cục bộ và đồng bộ khi in toa thuốc
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* Modal cắt ảnh 3:4 */}
      <ImageCropperModal
        isOpen={isCropperOpen}
        imageSrc={selectedRawImage}
        onClose={() => {
          setIsCropperOpen(false);
          setSelectedRawImage(null);
        }}
        onCropComplete={handleCropComplete}
        aspectRatio={3 / 4}
      />
    </>
  );
};
