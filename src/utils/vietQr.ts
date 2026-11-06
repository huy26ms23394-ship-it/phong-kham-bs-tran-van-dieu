import { PrescribedMedication, MedicationCatalogItem } from '../types/medical';

export interface BankOption {
  id: string; // Mã Napas (VD: 'VCB', 'MB')
  name: string; // Tên ngân hàng
  shortName: string;
  bin: string; // Mã BIN ngân hàng
}

export const POPULAR_VIETNAMESE_BANKS: BankOption[] = [
  { id: 'VCB', name: 'Ngân hàng TMCP Ngoại Thương Việt Nam', shortName: 'Vietcombank', bin: '970436' },
  { id: 'MB', name: 'Ngân hàng TMCP Quân Đội', shortName: 'MBBank', bin: '970422' },
  { id: 'TCB', name: 'Ngân hàng TMCP Kỹ Thương Việt Nam', shortName: 'Techcombank', bin: '970407' },
  { id: 'BIDV', name: 'Ngân hàng TMCP Đầu Tư và Phát Triển VN', shortName: 'BIDV', bin: '970418' },
  { id: 'ICB', name: 'Ngân hàng TMCP Công Thương Việt Nam', shortName: 'VietinBank', bin: '970415' },
  { id: 'ACB', name: 'Ngân hàng TMCP Á Châu', shortName: 'ACB', bin: '970416' },
  { id: 'VPB', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng', shortName: 'VPBank', bin: '970432' },
  { id: 'TPB', name: 'Ngân hàng TMCP Tiên Phong', shortName: 'TPBank', bin: '970423' },
  { id: 'STB', name: 'Ngân hàng TMCP Sài Gòn Thương Tín', shortName: 'Sacombank', bin: '970403' },
  { id: 'HDB', name: 'Ngân hàng TMCP Phát Triển TP.HCM', shortName: 'HDBank', bin: '970437' },
];

/**
 * Loại bỏ dấu tiếng Việt để nội dung chuyển khoản không bị lỗi trên các app ngân hàng
 */
export function removeVietnameseAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

export interface PrescriptionCostBreakdown {
  consultationFee: number;
  medicationTotal: number;
  grandTotal: number;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    subtotal: number;
  }>;
}

/**
 * Tính toán tổng chi phí khám và tiền thuốc cho toa thuốc
 */
export function calculatePrescriptionCost(
  medications: PrescribedMedication[],
  catalog: MedicationCatalogItem[] = [],
  consultationFee: number = 100000
): PrescriptionCostBreakdown {
  const catalogMap = new Map<string, MedicationCatalogItem>();
  catalog.forEach((item) => {
    if (item && item.name) {
      catalogMap.set(item.name.toLowerCase().trim(), item);
    }
  });

  let medicationTotal = 0;
  const items = medications.map((med) => {
    const catalogItem = catalogMap.get(med.name.toLowerCase().trim());
    // Lấy đơn giá trong kho, nếu chưa thiết lập thì gán mức giá sàn hợp lý
    const unitPrice =
      typeof catalogItem?.unitPrice === 'number' && catalogItem.unitPrice > 0
        ? catalogItem.unitPrice
        : 5000; // 5.000đ/viên mặc định
    const subtotal = (med.totalQuantity || 0) * unitPrice;
    medicationTotal += subtotal;

    return {
      name: med.name,
      quantity: med.totalQuantity || 0,
      unit: med.unit || 'viên',
      unitPrice,
      subtotal,
    };
  });

  const grandTotal = (consultationFee || 0) + medicationTotal;

  return {
    consultationFee: consultationFee || 0,
    medicationTotal,
    grandTotal,
    items,
  };
}

/**
 * Tạo URL ảnh mã VietQR Napas 247 chính thống (VietQR.io)
 */
export function generateVietQrUrl(params: {
  bankId: string;
  accountNo: string;
  accountName: string;
  amount: number;
  content: string;
  template?: 'compact' | 'compact2' | 'qr_only' | 'print';
}): string {
  const {
    bankId = 'VCB',
    accountNo = '',
    accountName = '',
    amount = 0,
    content = '',
    template = 'compact2',
  } = params;

  if (!accountNo.trim()) return '';

  const cleanBankId = bankId.trim().toUpperCase();
  const cleanAccountNo = accountNo.trim();
  const cleanContent = removeVietnameseAccents(content).slice(0, 50); // Tối đa 50 ký tự chuẩn Napas
  const cleanAccountName = removeVietnameseAccents(accountName);

  const queryParams = new URLSearchParams();
  if (amount > 0) {
    queryParams.set('amount', String(Math.round(amount)));
  }
  if (cleanContent) {
    queryParams.set('addInfo', cleanContent);
  }
  if (cleanAccountName) {
    queryParams.set('accountName', cleanAccountName);
  }

  const queryString = queryParams.toString();
  return `https://img.vietqr.io/image/${cleanBankId}-${cleanAccountNo}-${template}.png${queryString ? `?${queryString}` : ''}`;
}
