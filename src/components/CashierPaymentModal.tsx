import React, { useState, useMemo } from 'react';
import {
  ClinicSettings,
  Prescription,
  PrescribedMedication,
  MedicationCatalogItem,
} from '../types/medical';
import {
  calculatePrescriptionCost,
  generateVietQrUrl,
  removeVietnameseAccents,
  POPULAR_VIETNAMESE_BANKS,
} from '../utils/vietQr';
import {
  QrCode,
  X,
  CreditCard,
  DollarSign,
  Copy,
  Check,
  Printer,
  ShieldCheck,
  Building,
  User,
  Hash,
  Download,
} from 'lucide-react';

interface CashierPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicInfo: ClinicSettings;
  catalog: MedicationCatalogItem[];
  patientName: string;
  prescriptionCode: string;
  medications: PrescribedMedication[];
  onConfirmPaid?: (amount: number, method: 'transfer' | 'cash') => void;
}

export const CashierPaymentModal: React.FC<CashierPaymentModalProps> = ({
  isOpen,
  onClose,
  clinicInfo,
  catalog,
  patientName,
  prescriptionCode,
  medications,
  onConfirmPaid,
}) => {
  const [customConsultationFee, setCustomConsultationFee] = useState<number>(() => {
    return clinicInfo.consultationFee ?? 120000;
  });
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  // Tính chi phí
  const cost = useMemo(() => {
    return calculatePrescriptionCost(medications, catalog, customConsultationFee);
  }, [medications, catalog, customConsultationFee]);

  const bankId = clinicInfo.bankId || 'VCB';
  const accountNo = clinicInfo.bankAccountNo || '0071000987654';
  const accountName = clinicInfo.bankAccountName || clinicInfo.doctorName || 'TRAN VAN DIEU';
  const transferContent = `${String(prescriptionCode || '').replace(/[^a-zA-Z0-9]/g, '')} ${removeVietnameseAccents(patientName || '')}`.slice(0, 35);

  // Tạo URL VietQR
  const qrUrl = useMemo(() => {
    return generateVietQrUrl({
      bankId,
      accountNo,
      accountName,
      amount: cost.grandTotal,
      content: transferContent,
      template: 'compact2',
    });
  }, [bankId, accountNo, accountName, cost.grandTotal, transferContent]);

  const bankInfo = useMemo(() => {
    return POPULAR_VIETNAMESE_BANKS.find((b) => b.id.toUpperCase() === bankId.toUpperCase()) || {
      id: bankId,
      name: clinicInfo.bankName || 'Ngân hàng',
      shortName: bankId,
    };
  }, [bankId, clinicInfo.bankName]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCompletePayment = (method: 'transfer' | 'cash') => {
    setPaymentSuccess(true);
    if (onConfirmPaid) {
      onConfirmPaid(cost.grandTotal, method);
    }
    setTimeout(() => {
      setPaymentSuccess(false);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-4 flex items-center justify-between border-b border-emerald-950 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
              <QrCode className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Thu Phí Khám &amp; Thanh Toán VietQR
              </h2>
              <p className="text-xs text-emerald-100">
                Toa: <strong>{prescriptionCode}</strong> • Bệnh nhân: <strong>{patientName}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {paymentSuccess ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <Check className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Đã Xác Nhận Thu Phí Thành Công!
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Số tiền: <strong className="text-emerald-700 dark:text-emerald-400 font-mono text-sm">{cost.grandTotal.toLocaleString('vi-VN')} đ</strong>
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Grid 2 cột: Bảng tính tiền & Mã QR */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cột 1: Chi tiết tiền khám & tiền thuốc */}
              <div className="space-y-3">
                <div className="bg-slate-50 dark:bg-[#121824] p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Chi Tiết Bảng Kê Thanh Toán</span>
                  </h4>

                  {/* Tiền công khám */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400">Tiền công khám:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        inputMode="numeric"
                        value={customConsultationFee}
                        onChange={(e) => setCustomConsultationFee(Number(e.target.value) || 0)}
                        className="w-24 px-1.5 py-0.5 text-right font-mono font-bold text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                      <span className="text-slate-500 font-mono text-[11px]">đ</span>
                    </div>
                  </div>

                  {/* Tiền thuốc */}
                  <div className="space-y-1 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">
                        Tiền thuốc ({cost.items.length} loại):
                      </span>
                      <strong className="font-mono text-slate-900 dark:text-slate-100">
                        {cost.medicationTotal.toLocaleString('vi-VN')} đ
                      </strong>
                    </div>

                    {/* Danh sách từng thuốc */}
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-[11px]">
                      {cost.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                          <span className="truncate max-w-[140px]" title={it.name}>
                            {idx + 1}. {it.name} ({it.quantity} {it.unit})
                          </span>
                          <span className="font-mono">{it.subtotal.toLocaleString('vi-VN')} đ</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tổng cộng */}
                  <div className="flex items-center justify-between text-sm pt-2 border-t-2 border-emerald-600 dark:border-emerald-500 font-extrabold text-slate-900 dark:text-slate-100">
                    <span>TỔNG CỘNG:</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-mono text-base">
                      {cost.grandTotal.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>

                {/* Thông tin tài khoản ngân hàng */}
                <div className="bg-slate-50 dark:bg-[#121824] p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-500" /> Ngân hàng:
                    </span>
                    <strong className="text-slate-900 dark:text-slate-100">{bankInfo.shortName} ({bankId})</strong>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-slate-500" /> Số tài khoản:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(accountNo, 'acc')}
                      className="font-mono font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <span>{accountNo}</span>
                      {copiedField === 'acc' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-500" /> Chủ tài khoản:
                    </span>
                    <strong className="text-slate-900 dark:text-slate-100 uppercase">{accountName}</strong>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span>Nội dung CK:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(transferContent, 'content')}
                      className="font-mono font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <span className="truncate max-w-[130px]">{transferContent}</span>
                      {copiedField === 'content' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Cột 2: Hiển thị Mã QR VietQR Napas 247 */}
              <div className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-[#121824] rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Quét mã VietQR bằng App Ngân Hàng</span>
                </span>

                {/* Khung ảnh QR */}
                <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 max-w-[220px]">
                  {accountNo ? (
                    <img
                      src={qrUrl}
                      alt={`Mã VietQR thanh toán ${cost.grandTotal} đ`}
                      className="w-full h-auto object-contain rounded"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400 italic">
                      Chưa cấu hình STK ngân hàng
                    </div>
                  )}
                </div>

                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
                  * Tự động điền đúng số tiền và nội dung chuyển khoản
                </p>
              </div>
            </div>

            {/* Các nút xác nhận thanh toán */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleCompletePayment('cash')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                <span>Đã Thu Tiền Mặt</span>
              </button>

              <button
                type="button"
                onClick={() => handleCompletePayment('transfer')}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Đã Nhận Chuyển Khoản ({cost.grandTotal.toLocaleString('vi-VN')} đ)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
