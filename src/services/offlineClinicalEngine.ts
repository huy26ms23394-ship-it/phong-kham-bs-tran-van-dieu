/**
 * Offline Clinical Decision Support Engine (0ms Zero-Latency)
 * Hệ thống Cảnh báo Lâm sàng 5 Tầng Chuẩn Y Khoa Phòng Khám BS. Trần Văn Diệu
 * Tuân thủ Dược thư Quốc gia Việt Nam & Phác đồ Bộ Y Tế
 */

export type ClinicalTier = 1 | 2 | 3 | 4 | 5;
export type AlertSeverity = 'contraindicated' | 'major' | 'moderate' | 'info';

export interface FiveTierAlert {
  id: string;
  tier: ClinicalTier;
  tierName: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  recommendation: string;
  involvedItems: string[];
  pointsDeducted: number;
}

export interface FiveTierSafetyReport {
  safetyScore: number; // 0 - 100
  isSafe: boolean; // true nếu không có cảnh báo nghiêm trọng (score >= 85 & không có contraindicated)
  isPerfect: boolean; // 100/100, 0 cảnh báo
  tier1Alerts: FiveTierAlert[]; // Dị ứng & Dị ứng chéo
  tier2Alerts: FiveTierAlert[]; // Tương tác thuốc - thuốc & Trùng hoạt chất
  tier3Alerts: FiveTierAlert[]; // Bệnh nền & Chỉ số sinh hiệu
  tier4Alerts: FiveTierAlert[]; // Liều tối đa 24h & Cách dùng
  tier5Alerts: FiveTierAlert[]; // Lưu ý lâm sàng & Theo dõi
  allAlerts: FiveTierAlert[];
  summaryText: string;
  estimatedCrCl?: number; // mL/phút tính theo Cockcroft-Gault
}

export interface MedicationInput {
  name: string;
  activeIngredient?: string;
  strength?: string;
  dosage?: {
    morning?: number;
    noon?: number;
    afternoon?: number;
    evening?: number;
    timing?: string;
    customTimingNote?: string;
  };
  durationDays?: number;
  instructions?: string;
}

export interface PatientSafetyContext {
  fullName?: string;
  birthYear?: number | string;
  gender?: 'nam' | 'nu' | string;
  weight?: number | string;
  allergies?: string[];
  chronicConditions?: string[];
  diagnosis?: string;
  serumCreatinine?: number; // mg/dL (nếu có xét nghiệm)
  vitals?: {
    bloodPressureSystolic?: number | string;
    bloodPressureDiastolic?: number | string;
    heartRate?: number | string;
    temperature?: number | string;
  };
}

// ================= TẦNG 1: QUY TẮC DỊ ỨNG & DỊ ỨNG CHÉO =================
interface AllergyRule {
  allergyKeywords: string[];
  triggerKeywords: string[];
  severity: AlertSeverity;
  title: string;
  description: string;
  recommendation: string;
}

const ALLERGY_RULES: AllergyRule[] = [
  {
    allergyKeywords: ['penicillin', 'amoxicillin', 'augmentin', 'ampicillin', 'klamentin', 'beta-lactam', 'b-lactam'],
    triggerKeywords: ['amoxicillin', 'augmentin', 'klamentin', 'ampicillin', 'unasyn', 'penicillin', 'cloxacillin', 'oxacillin'],
    severity: 'contraindicated',
    title: '🔴 Dị ứng trực tiếp nhóm Penicillin / Aminopenicillin',
    description: 'Bệnh nhân có tiền sử dị ứng Penicillin. Thuốc trong đơn chứa dẫn chất nhóm Penicillin nguy cơ gây sốc phản vệ đe dọa tính mạng.',
    recommendation: 'CHỐNG CHỈ ĐỊNH TUYỆT ĐỐI. Đổi sang nhóm Macrolide (Azithromycin, Clarithromycin) hoặc Quinolone/Clindamycin.',
  },
  {
    allergyKeywords: ['penicillin', 'amoxicillin', 'augmentin', 'ampicillin'],
    triggerKeywords: ['cefuroxime', 'zinnat', 'cefixime', 'cefpodoxime', 'orelox', 'cefaclor', 'ceftriaxone', 'cefditoren', 'meiact'],
    severity: 'major',
    title: '🔴 Nguy cơ dị ứng chéo Penicillin - Cephalosporin (5-10%)',
    description: 'Bệnh nhân có tiền sử dị ứng Penicillin. Nhóm Cephalosporin có tỷ lệ dị ứng chéo từ 5% đến 10% do cùng cấu trúc vòng Beta-lactam.',
    recommendation: 'Nếu tiền sử dị ứng Penicillin ở mức độ sốc phản vệ, mề đay cấp tính: TRÁNH DÙNG Cephalosporin. Ưu tiên Macrolide (Azithromycin, Klacid) hoặc Clindamycin.',
  },
  {
    allergyKeywords: ['nsaid', 'aspirin', 'meloxicam', 'ibuprofen', 'celecoxib', 'voltaren', 'diclofenac'],
    triggerKeywords: ['aspirin', 'ibuprofen', 'meloxicam', 'mobic', 'celecoxib', 'celebrex', 'diclofenac', 'voltaren', 'etoricoxib', 'arcoxia', 'piroxicam', 'brexin', 'tenoxicam', 'tilcotil', 'gofen'],
    severity: 'contraindicated',
    title: '🔴 Dị ứng thuốc kháng viêm không steroid (NSAIDs / Aspirin)',
    description: 'Bệnh nhân có tiền sử dị ứng nhóm NSAIDs/Aspirin (co thắt phế quản, phù mạch, mề đay). Việc kê NSAID có thể gây cơn hen giả dị ứng cấp tính.',
    recommendation: 'CHỐNG CHỈ ĐỊNH. Đổi sang giảm đau đơn thuần bằng Paracetamol liều chuẩn, hoặc Tramadol nếu đau mức độ vừa - nặng.',
  },
  {
    allergyKeywords: ['sulfonamide', 'sulfa', 'bactrim', 'cotrimoxazole'],
    triggerKeywords: ['bactrim', 'cotrimoxazole', 'sulfamethoxazole', 'gliclazide', 'diamicron', 'glimepiride', 'amaryl', 'hydrochlorothiazide', 'hypothiazid'],
    severity: 'major',
    title: '🔴 Dị ứng nhóm Sulfonamide (Sulfa)',
    description: 'Bệnh nhân có tiền sử dị ứng Sulfa. Nguy cơ dị ứng da nặng (hội chứng Stevens-Johnson / Lyell).',
    recommendation: 'Tránh dùng Bactrim và hết sức thận trọng khi dùng các thuốc có gốc Sulfonamide như Sulfonylurea hạ đường huyết, lợi tiểu Thiazide.',
  },
  {
    allergyKeywords: ['quinolone', 'ciprofloxacin', 'levofloxacin', 'ofloxacin'],
    triggerKeywords: ['ciprofloxacin', 'ciprobay', 'levofloxacin', 'cravit', 'tavanic', 'moxifloxacin', 'avelox', 'norfloxacin', 'nolicin'],
    severity: 'contraindicated',
    title: '🔴 Dị ứng nhóm kháng sinh Quinolone / Fluoroquinolone',
    description: 'Bệnh nhân có tiền sử phản ứng quá mẫn với nhóm Quinolone.',
    recommendation: 'CHỐNG CHỈ ĐỊNH. Đổi kháng sinh nhóm khác theo vị trí nhiễm khuẩn.',
  },
  {
    allergyKeywords: ['paracetamol', 'acetaminophen', 'panadol', 'efferalgan'],
    triggerKeywords: ['paracetamol', 'acetaminophen', 'panadol', 'efferalgan', 'hapacol', 'tylenol', 'ultracet', 'zaldiar', 'alaxan', 'decolgen', 'tiffy'],
    severity: 'contraindicated',
    title: '🔴 Dị ứng Paracetamol (Acetaminophen)',
    description: 'Tiền sử dị ứng Paracetamol. Thuốc trong toa có chứa Paracetamol đơn độc hoặc phối hợp.',
    recommendation: 'CHỐNG CHỈ ĐỊNH. Thay thế bằng thuốc giảm đau khác không chứa dẫn xuất paracetamol.',
  },
];

// ================= TẦNG 2: TƯƠNG TÁC THUỐC & TRÙNG HOẠT CHẤT =================
interface DdiRule {
  id: string;
  keywordsA: string[];
  keywordsB: string[];
  severity: AlertSeverity;
  title: string;
  description: string;
  recommendation: string;
}

const DDI_RULES: DdiRule[] = [
  {
    id: 'ddi-clopidogrel-omeprazole',
    keywordsA: ['clopidogrel', 'plavix'],
    keywordsB: ['omeprazole', 'losec', 'omez', 'esomeprazole', 'nexium'],
    severity: 'major',
    title: '🟠 Clopidogrel + PPI ức chế CYP2C19 (Omeprazole / Esomeprazole)',
    description: 'Omeprazole và Esomeprazole ức chế mạnh men gan CYP2C19, làm giảm chuyển hóa Clopidogrel thành dạng có hoạt tính chống kết tập tiểu cầu, tăng nguy cơ tái phát huyết khối mạch vành.',
    recommendation: 'Khuyến cáo đổi sang Pantoprazole (Pantoloc) hoặc Rabeprazole (Pariet/Barole) - các thuốc này hầu như không ức chế CYP2C19.',
  },
  {
    id: 'ddi-statin-fibrate',
    keywordsA: ['atorvastatin', 'lipitor', 'rosuvastatin', 'crestor', 'simvastatin', 'zocor'],
    keywordsB: ['fenofibrate', 'lipanthyl', 'gemfibrozil', 'tricor'],
    severity: 'major',
    title: '🟠 Statin hạ mỡ máu + Fibrate (Fenofibrate / Gemfibrozil)',
    description: 'Phối hợp Statin và Fibrate làm tăng nồng độ Statin trong máu, tăng nguy cơ độc cơ vân, đau cơ dữ dội và tiêu cơ vân cấp (Rhabdomyolysis) dẫn đến suy thận cấp.',
    recommendation: 'Hạn chế phối hợp nếu không thật sự cần thiết. Nếu bắt buộc phối hợp: dùng liều Statin thấp, uống Fenofibrate vào bữa trưa và Statin vào buổi tối; dặn bệnh nhân báo ngay khi đau cơ, nước tiểu sẫm màu.',
  },
  {
    id: 'ddi-statin-macrolide',
    keywordsA: ['simvastatin', 'zocor', 'atorvastatin', 'lipitor'],
    keywordsB: ['clarithromycin', 'klacid', 'erythromycin'],
    severity: 'contraindicated',
    title: '🟠 Statin (Simvastatin/Atorvastatin) + Kháng sinh Macrolide (Clarithromycin)',
    description: 'Clarithromycin ức chế mạnh men CYP3A4, làm tăng nồng độ Simvastatin/Atorvastatin trong máu lên 4 - 10 lần, nguy cơ tiêu cơ vân cấp rất cao.',
    recommendation: 'TẠM NGỪNG Statin trong suốt đợt uống Clarithromycin (5-7 ngày) hoặc chuyển sang Azithromycin (không ức chế CYP3A4) hoặc Rosuvastatin (không chuyển hóa qua CYP3A4).',
  },
  {
    id: 'ddi-acei-arb-nsaid',
    keywordsA: ['perindopril', 'coversyl', 'enalapril', 'captopril', 'losartan', 'valsartan', 'telmisartan', 'micardis', 'co-diovan'],
    keywordsB: ['meloxicam', 'mobic', 'celecoxib', 'celebrex', 'diclofenac', 'voltaren', 'etoricoxib', 'arcoxia', 'ibuprofen', 'piroxicam'],
    severity: 'major',
    title: '🟠 Ức chế men chuyển / Chẹn thụ thể (ACEi/ARB) + Kháng viêm NSAID',
    description: 'NSAID ức chế tổng hợp Prostaglandin tại cầu thận làm co tiểu động mạch vào, trong khi ACEi/ARB làm giãn tiểu động mạch ra -> Làm sụt giảm đột ngột mức lọc cầu thận (GFR), nguy cơ suy thận cấp và tăng Kali máu, giảm hiệu quả hạ huyết áp.',
    recommendation: 'Tránh dùng NSAID kéo dài. Ưu tiên giảm đau bằng Paracetamol. Nếu bắt buộc: dùng liều thấp nhất trong thời gian ngắn nhất (<= 5 ngày), uống đủ nước và theo dõi Creatinine/Kali.',
  },
  {
    id: 'ddi-acei-spironolactone',
    keywordsA: ['perindopril', 'coversyl', 'enalapril', 'losartan', 'valsartan', 'telmisartan', 'micardis'],
    keywordsB: ['spironolactone', 'aldactone'],
    severity: 'major',
    title: '🟠 ACEi / ARB + Lợi tiểu giữ Kali (Spironolactone)',
    description: 'Cả 2 nhóm đều làm giảm thải trừ Kali qua thận, nguy cơ tăng Kali máu nặng (> 5.5 - 6.0 mmol/L) gây rối loạn nhịp tim nguy hiểm và ngưng tim.',
    recommendation: 'Bắt buộc kiểm tra định kỳ điện giải đồ (Kali máu) và Creatinine máu sau 1-2 tuần điều trị.',
  },
  {
    id: 'ddi-bb-non-dhp-ccb',
    keywordsA: ['bisoprolol', 'concor', 'metoprolol', 'betaloc', 'atenolol', 'nebivolol', 'carvedilol'],
    keywordsB: ['verapamil', 'diltiazem'],
    severity: 'contraindicated',
    title: '🟠 Chẹn Beta + Chẹn kênh Canxi Non-DHP (Verapamil / Diltiazem)',
    description: 'Hiệp đồng ức chế dẫn truyền nút nhĩ thất (AV) và ức chế co bóp cơ tim mạnh mẽ, có thể dẫn đến block tim hoàn toàn, hạ huyết áp trầm trọng và ngưng tim.',
    recommendation: 'CHỐNG CHỈ ĐỊNH PHỐI HỢP. Chỉ phối hợp Chẹn Beta với nhóm Dihydropyridine (Amlodipine, Lacidipine, Nifedipine).',
  },
  {
    id: 'ddi-quinolone-corticoid',
    keywordsA: ['ciprofloxacin', 'ciprobay', 'levofloxacin', 'cravit', 'tavanic', 'moxifloxacin', 'avelox'],
    keywordsB: ['methylprednisolone', 'medrol', 'prednisolone', 'dexamethasone', 'betamethasone'],
    severity: 'major',
    title: '🟠 Kháng sinh Quinolone + Corticoid toàn thân',
    description: 'Hiệp đồng phá hủy cấu trúc collagen của gân cơ, tăng vọt nguy cơ viêm gân và đứt gân gót chân (Achilles), đặc biệt ở bệnh nhân trên 60 tuổi.',
    recommendation: 'Tránh dùng chung. Nếu bắt buộc phối hợp, dặn bệnh nhân ngưng thuốc ngay và báo bác sĩ khi thấy đau gót chân, hạn chế vận động thể lực mạnh.',
  },
  {
    id: 'ddi-anticoagulant-nsaid',
    keywordsA: ['warfarin', 'sintrom', 'rivaroxaban', 'xarelto', 'apixaban', 'eliquis', 'dabigatran', 'pradaxa', 'plavix', 'clopidogrel'],
    keywordsB: ['aspirin', 'ibuprofen', 'meloxicam', 'diclofenac', 'etoricoxib', 'celecoxib'],
    severity: 'contraindicated',
    title: '🟠 Thuốc chống đông / Kháng tiểu cầu + NSAID',
    description: 'Tác động kép gây ức chế ngưng tập tiểu cầu, loét bào mòn niêm mạc tiêu hóa và chống đông máu toàn thân -> Nguy cơ xuất huyết tiêu hóa ồ ạt đe dọa tính mạng.',
    recommendation: 'CHỐNG CHỈ ĐỊNH dùng kèm NSAID thông thường. Nếu đau nhức, lựa chọn hàng đầu là Paracetamol. Trường hợp sau can thiệp vành cần DAPT (Aspirin + Clopidogrel) phải bắt buộc có PPI bảo vệ.',
  },
  {
    id: 'ddi-ssri-tramadol',
    keywordsA: ['sertraline', 'fluoxetine', 'escitalopram', 'paroxetine'],
    keywordsB: ['tramadol', 'ultracet', 'zaldiar'],
    severity: 'major',
    title: '🟠 Thuốc chống trầm cảm SSRI + Giảm đau Tramadol',
    description: 'Cùng làm tăng tích tụ Serotonin ở khe synap thần kinh trung ương, nguy cơ kích phát Hội chứng Serotonin (run, lú lẫn, sốt cao, co giật) và hạ ngưỡng co giật.',
    recommendation: 'Thận trọng theo dõi sát, cân nhắc giảm đau thay thế bằng Paracetamol hoặc NSAID.',
  },
  {
    id: 'ddi-quinolone-antacid',
    keywordsA: ['ciprofloxacin', 'levofloxacin', 'moxifloxacin', 'norfloxacin'],
    keywordsB: ['phosphalugel', 'yumangel', 'gastropulgite', 'calci', 'calcium', 'ferrovit', 'tardyferon', 'magne'],
    severity: 'moderate',
    title: '🟠 Quinolone + Thuốc kháng acid dạ dày / Kim loại đa hóa trị (Al/Mg/Ca/Fe)',
    description: 'Ion kim loại tạo phức Chelat không tan với kháng sinh Quinolone trong ruột, làm giảm hấp thu kháng sinh từ 70% đến 90%, dẫn đến thất bại điều trị.',
    recommendation: 'Phải uống kháng sinh Quinolone cách xa thuốc dạ dày, viên Sắt, Canxi ít nhất 2 giờ trước hoặc 4 giờ sau.',
  },
  {
    id: 'ddi-sulfonylurea-nsaid',
    keywordsA: ['gliclazide', 'diamicron', 'glimepiride', 'amaryl', 'glibenclamide'],
    keywordsB: ['meloxicam', 'ibuprofen', 'diclofenac', 'aspirin', 'etoricoxib'],
    severity: 'major',
    title: '🟠 Thuốc hạ đường huyết Sulfonylurea + NSAID / Aspirin',
    description: 'NSAID cạnh tranh liên kết protein huyết tương và ức chế thải trừ Sulfonylurea, làm giải phóng nồng độ hoạt chất tự do cao gây hạ đường huyết nặng kéo dài.',
    recommendation: 'Theo dõi sát đường huyết mao mạch, dặn bệnh nhân luôn mang theo kẹo/đường dự phòng.',
  },
];

// Nhóm dược lý để phát hiện trùng lặp
const DRUG_CLASS_MAP: { classId: string; className: string; keywords: string[] }[] = [
  {
    classId: 'paracetamol',
    className: 'Thuốc chứa Paracetamol',
    keywords: ['paracetamol', 'acetaminophen', 'panadol', 'efferalgan', 'hapacol', 'tylenol', 'ultracet', 'zaldiar', 'alaxan', 'decolgen', 'tiffy'],
  },
  {
    classId: 'nsaid',
    className: 'Kháng viêm không steroid (NSAID)',
    keywords: ['meloxicam', 'mobic', 'celecoxib', 'celebrex', 'diclofenac', 'voltaren', 'etoricoxib', 'arcoxia', 'ibuprofen', 'piroxicam', 'brexin', 'tenoxicam', 'tilcotil'],
  },
  {
    classId: 'ppi',
    className: 'Ức chế bơm Proton (PPI dạ dày)',
    keywords: ['esomeprazole', 'nexium', 'pantoprazole', 'pantoloc', 'rabeprazole', 'pariet', 'barole', 'omeprazole', 'omez'],
  },
  {
    classId: 'acei_arb',
    className: 'Hạ áp nhóm Ức chế men chuyển / Chẹn thụ thể (ACEi / ARB)',
    keywords: ['perindopril', 'coversyl', 'enalapril', 'losartan', 'valsartan', 'diovan', 'telmisartan', 'micardis', 'irbesartan', 'aprovel'],
  },
  {
    classId: 'statin',
    className: 'Hạ mỡ máu nhóm Statin',
    keywords: ['atorvastatin', 'lipitor', 'rosuvastatin', 'crestor', 'simvastatin', 'zocor', 'pitavastatin', 'livalo'],
  },
  {
    classId: 'betablocker',
    className: 'Thuốc Chẹn Beta giao cảm',
    keywords: ['bisoprolol', 'concor', 'metoprolol', 'betaloc', 'nebivolol', 'nebilet', 'atenolol', 'carvedilol'],
  },
  {
    classId: 'corticoid',
    className: 'Corticoid toàn thân',
    keywords: ['methylprednisolone', 'medrol', 'prednisolone', 'dexamethasone', 'betamethasone'],
  },
];

// ================= TẦNG 4: LIỀU TỐI ĐA 24H =================
interface MaxDoseRule {
  keywords: string[];
  maxMgPerDay: number;
  elderlyMaxMg?: number;
  drugName: string;
}

const MAX_DOSE_RULES: MaxDoseRule[] = [
  { keywords: ['paracetamol', 'acetaminophen', 'panadol', 'efferalgan', 'hapacol', 'tylenol'], maxMgPerDay: 4000, elderlyMaxMg: 3000, drugName: 'Paracetamol' },
  { keywords: ['meloxicam', 'mobic'], maxMgPerDay: 15, elderlyMaxMg: 7.5, drugName: 'Meloxicam' },
  { keywords: ['celecoxib', 'celebrex'], maxMgPerDay: 400, elderlyMaxMg: 200, drugName: 'Celecoxib' },
  { keywords: ['etoricoxib', 'arcoxia'], maxMgPerDay: 120, elderlyMaxMg: 60, drugName: 'Etoricoxib' },
  { keywords: ['amlodipine', 'amlor'], maxMgPerDay: 10, drugName: 'Amlodipine' },
  { keywords: ['metformin', 'glucophage'], maxMgPerDay: 2550, elderlyMaxMg: 1500, drugName: 'Metformin' },
  { keywords: ['atorvastatin', 'lipitor'], maxMgPerDay: 80, drugName: 'Atorvastatin' },
  { keywords: ['rosuvastatin', 'crestor'], maxMgPerDay: 40, elderlyMaxMg: 20, drugName: 'Rosuvastatin' },
  { keywords: ['gliclazide', 'diamicron'], maxMgPerDay: 120, elderlyMaxMg: 60, drugName: 'Gliclazide' },
  { keywords: ['bisoprolol', 'concor'], maxMgPerDay: 10, drugName: 'Bisoprolol' },
  { keywords: ['perindopril', 'coversyl'], maxMgPerDay: 10, drugName: 'Perindopril' },
  { keywords: ['telmisartan', 'micardis'], maxMgPerDay: 80, drugName: 'Telmisartan' },
];

/**
 * Trích xuất hàm lượng số (mg) từ chuỗi strength hoặc tên thuốc
 */
function extractMgValue(strengthStr?: string): number {
  if (!strengthStr) return 0;
  const s = strengthStr.toLowerCase().replace(/,/g, '.');
  const matchG = s.match(/(\d+(?:\.\d+)?)\s*g\b/);
  if (matchG) return parseFloat(matchG[1]) * 1000;
  const matchMg = s.match(/(\d+(?:\.\d+)?)\s*mg\b/);
  if (matchMg) return parseFloat(matchMg[1]);
  return 0;
}

/**
 * HÀM CHÍNH: ĐÁNH GIÁ MA TRẬN AN TOÀN Y KHOA 5 TẦNG (0ms Offline Non-AI)
 */
export function evaluateFiveTierSafety(
  medications: MedicationInput[],
  patient?: PatientSafetyContext | null
): FiveTierSafetyReport {
  const tier1Alerts: FiveTierAlert[] = [];
  const tier2Alerts: FiveTierAlert[] = [];
  const tier3Alerts: FiveTierAlert[] = [];
  const tier4Alerts: FiveTierAlert[] = [];
  const tier5Alerts: FiveTierAlert[] = [];

  const meds = medications || [];
  const medTexts = meds.map((m) => `${m.name} ${m.activeIngredient || ''}`.toLowerCase());
  const allAllergies = (patient?.allergies || []).map((a) => a.toLowerCase().trim());
  const conditions = (patient?.chronicConditions || []).join(' ').toLowerCase() + ' ' + (patient?.diagnosis || '').toLowerCase();

  const birthYear = Number(patient?.birthYear) || 0;
  const age = birthYear > 0 ? new Date().getFullYear() - birthYear : 0;
  const weight = Number(patient?.weight) || 60;
  const isFemale = patient?.gender === 'nu' || patient?.gender === 'nữ';

  // Tính CrCl Cockcroft-Gault nếu có số liệu
  let estimatedCrCl: number | undefined = undefined;
  if (age > 0 && weight > 0) {
    const scr = patient?.serumCreatinine || (age >= 65 ? 1.1 : 0.9);
    estimatedCrCl = Math.round((((140 - age) * weight) / (72 * scr)) * (isFemale ? 0.85 : 1));
  }

  // ================= 1. TẦNG 1: DỊ ỨNG & DỊ ỨNG CHÉO =================
  for (const allergy of allAllergies) {
    if (!allergy || allergy.includes('không có') || allergy.includes('chưa ghi nhận')) continue;

    for (const rule of ALLERGY_RULES) {
      const matchAllergy = rule.allergyKeywords.some((kw) => allergy.includes(kw));
      if (!matchAllergy) continue;

      for (let i = 0; i < meds.length; i++) {
        const text = medTexts[i];
        const matchDrug = rule.triggerKeywords.some((kw) => text.includes(kw));
        if (matchDrug) {
          tier1Alerts.push({
            id: `t1-allergy-${rule.title}-${meds[i].name}`,
            tier: 1,
            tierName: 'Dị ứng & Dị ứng chéo',
            severity: rule.severity,
            title: rule.title,
            description: `${rule.description} (Phát hiện trên tiền sử dị ứng: "${allergy}").`,
            recommendation: rule.recommendation,
            involvedItems: [meds[i].name, `Dị ứng: ${allergy}`],
            pointsDeducted: rule.severity === 'contraindicated' ? 35 : 20,
          });
        }
      }
    }
  }

  // ================= 2. TẦNG 2: TƯƠNG TÁC THUỐC & TRÙNG LẶP =================
  // 2.1 Cặp tương tác thuốc - thuốc (DDI)
  for (const rule of DDI_RULES) {
    let matchA: MedicationInput | null = null;
    let matchB: MedicationInput | null = null;

    for (let i = 0; i < meds.length; i++) {
      if (rule.keywordsA.some((kw) => medTexts[i].includes(kw))) matchA = meds[i];
      if (rule.keywordsB.some((kw) => medTexts[i].includes(kw))) matchB = meds[i];
    }

    if (matchA && matchB && matchA.name !== matchB.name) {
      tier2Alerts.push({
        id: `t2-ddi-${rule.id}`,
        tier: 2,
        tierName: 'Tương tác Thuốc - Thuốc',
        severity: rule.severity,
        title: rule.title,
        description: rule.description,
        recommendation: rule.recommendation,
        involvedItems: [matchA.name, matchB.name],
        pointsDeducted: rule.severity === 'contraindicated' ? 30 : rule.severity === 'major' ? 20 : 10,
      });
    }
  }

  // 2.2 Trùng hoạt chất / Trùng nhóm dược lý (Duplication)
  for (const group of DRUG_CLASS_MAP) {
    const matchedMeds: MedicationInput[] = [];
    for (let i = 0; i < meds.length; i++) {
      if (group.keywords.some((kw) => medTexts[i].includes(kw))) {
        matchedMeds.push(meds[i]);
      }
    }

    if (matchedMeds.length >= 2) {
      tier2Alerts.push({
        id: `t2-dup-${group.classId}`,
        tier: 2,
        tierName: 'Trùng Hoạt Chất / Trùng Nhóm',
        severity: group.classId === 'paracetamol' || group.classId === 'nsaid' ? 'major' : 'moderate',
        title: `🟠 Trùng lặp nhóm dược lý: ${group.className}`,
        description: `Đơn thuốc đang kê cùng lúc ${matchedMeds.length} thuốc thuộc cùng nhóm: ${matchedMeds.map((m) => m.name).join(', ')}. Việc này làm tăng nguy cơ quá liều và độc tính mà không gia tăng hiệu quả điều trị.`,
        recommendation: `Chọn duy nhất 1 biệt dược tối ưu trong nhóm. Tránh kê chồng chéo 2 thuốc ${group.className}.`,
        involvedItems: matchedMeds.map((m) => m.name),
        pointsDeducted: 20,
      });
    }
  }

  // ================= 3. TẦNG 3: BỆNH NỀN & CHỈ SỐ SINH HIỆU =================
  const sbp = Number(patient?.vitals?.bloodPressureSystolic) || 0;
  const dbp = Number(patient?.vitals?.bloodPressureDiastolic) || 0;
  const hr = Number(patient?.vitals?.heartRate) || 0;

  // 3.1 Huyết áp thấp (< 100/60 mmHg) mà kê thuốc hạ áp
  if ((sbp > 0 && sbp < 100) || (dbp > 0 && dbp < 60)) {
    const antihypertensive = meds.filter((m) =>
      ['amlor', 'amlodipine', 'coversyl', 'perindopril', 'micardis', 'telmisartan', 'concor', 'bisoprolol', 'co-diovan', 'valsartan'].some((kw) =>
        m.name.toLowerCase().includes(kw)
      )
    );
    if (antihypertensive.length > 0) {
      tier3Alerts.push({
        id: 't3-vit-hypotension',
        tier: 3,
        tierName: 'Đối soát Sinh hiệu',
        severity: 'major',
        title: '🟡 Cảnh báo: Huyết áp thấp (< 100/60 mmHg) kèm thuốc hạ áp',
        description: `Chỉ số huyết áp đo được là ${sbp || '--'}/${dbp || '--'} mmHg. Đơn thuốc có chứa thuốc hạ huyết áp (${antihypertensive.map((m) => m.name).join(', ')}), nguy cơ tụt huyết áp tư thế, chóng mặt, té ngã.`,
        recommendation: 'Đo lại huyết áp kiểm tra. Cân nhắc tạm hoãn hoặc giảm nửa liều thuốc hạ áp, dặn bệnh nhân uống đủ nước.',
        involvedItems: antihypertensive.map((m) => m.name),
        pointsDeducted: 20,
      });
    }
  }

  // 3.2 Huyết áp cao (>= 160/100 mmHg) mà kê thuốc làm tăng HA (Corticoid, NSAIDs)
  if (sbp >= 160 || dbp >= 100) {
    const hypertensiveDrugs = meds.filter((m) =>
      ['medrol', 'prednisolone', 'dexamethasone', 'meloxicam', 'celecoxib', 'arcoxia', 'diclofenac'].some((kw) =>
        m.name.toLowerCase().includes(kw)
      )
    );
    if (hypertensiveDrugs.length > 0) {
      tier3Alerts.push({
        id: 't3-vit-hypertension-aggravated',
        tier: 3,
        tierName: 'Đối soát Sinh hiệu',
        severity: 'major',
        title: '🟡 Huyết áp đang cao (>= 160/100 mmHg) kèm thuốc gây giữ muối nước',
        description: `Huyết áp ${sbp}/${dbp} mmHg. Thuốc Corticoid/NSAID (${hypertensiveDrugs.map((m) => m.name).join(', ')}) gây giữ muối nước và co mạch, làm nặng thêm cơn tăng huyết áp.`,
        recommendation: 'Kiểm soát hạ áp trước. Hạn chế Corticoid/NSAID hoặc dùng liều thấp ngắn ngày nhất.',
        involvedItems: hypertensiveDrugs.map((m) => m.name),
        pointsDeducted: 15,
      });
    }
  }

  // 3.3 Nhịp tim chậm (< 60 ck/p) mà kê Beta-blocker
  if (hr > 0 && hr < 60) {
    const bbDrugs = meds.filter((m) =>
      ['concor', 'bisoprolol', 'betaloc', 'metoprolol', 'nebilet', 'atenolol'].some((kw) =>
        m.name.toLowerCase().includes(kw)
      )
    );
    if (bbDrugs.length > 0) {
      tier3Alerts.push({
        id: 't3-vit-bradycardia-bb',
        tier: 3,
        tierName: 'Đối soát Sinh hiệu',
        severity: 'contraindicated',
        title: '🟡 Nhịp tim chậm (< 60 ck/p) - Nguy cơ block tim với Chẹn Beta',
        description: `Nhịp tim ghi nhận là ${hr} lần/phút. Nhóm Chẹn Beta (${bbDrugs.map((m) => m.name).join(', ')}) ức chế nút xoang, có thể gây nhịp chậm xoang nặng hoặc ngưng tim.`,
        recommendation: 'CHỐNG CHỈ ĐỊNH hoặc tạm dừng Chẹn Beta. Làm điện tâm đồ (ECG) kiểm tra trước khi kê.',
        involvedItems: bbDrugs.map((m) => m.name),
        pointsDeducted: 25,
      });
    }
  }

  // 3.4 Bệnh nhân loét dạ dày / GERD dùng NSAID/Corticoid mà không có PPI bảo vệ
  const hasGastricHistory = conditions.includes('dạ dày') || conditions.includes('loét') || conditions.includes('gerd') || conditions.includes('trào ngược');
  const hasNsaidOrCorticoid = meds.some((m) =>
    ['meloxicam', 'celecoxib', 'diclofenac', 'ibuprofen', 'etoricoxib', 'piroxicam', 'medrol', 'prednisolone', 'dexamethasone'].some((kw) =>
      m.name.toLowerCase().includes(kw)
    )
  );
  const hasPpi = meds.some((m) =>
    ['esomeprazole', 'nexium', 'pantoprazole', 'pantoloc', 'rabeprazole', 'pariet', 'omeprazole'].some((kw) =>
      m.name.toLowerCase().includes(kw)
    )
  );
  if (hasGastricHistory && hasNsaidOrCorticoid && !hasPpi) {
    tier3Alerts.push({
      id: 't3-dis-gastric-no-ppi',
      tier: 3,
      tierName: 'Đối soát Bệnh nền',
      severity: 'major',
      title: '🟡 Bệnh lý dạ dày dùng NSAID/Corticoid nhưng thiếu thuốc bảo vệ PPI',
      description: 'Bệnh nhân có tiền sử/chẩn đoán bệnh lý dạ dày tá tràng. Đơn thuốc có NSAID hoặc Corticoid nhưng CHƯA CÓ thuốc ức chế bơm proton (PPI) bảo vệ niêm mạc.',
      recommendation: 'Bắt buộc bổ sung thêm 1 thuốc PPI (Nexium Mups 40mg hoặc Pantoloc 40mg) uống trước ăn sáng 30 phút, dặn uống thuốc giảm đau ngay sau bữa ăn no.',
      involvedItems: ['Tiền sử bệnh dạ dày', 'NSAID/Corticoid thiếu PPI'],
      pointsDeducted: 20,
    });
  }

  // 3.5 Bệnh nhân Đái tháo đường kê Corticoid toàn thân
  const hasDiabetes = conditions.includes('đái tháo đường') || conditions.includes('tiểu đường') || conditions.includes('diabetes') || conditions.includes('dtđ');
  const hasCorticoid = meds.filter((m) =>
    ['medrol', 'methylprednisolone', 'prednisolone', 'dexamethasone'].some((kw) => m.name.toLowerCase().includes(kw))
  );
  if (hasDiabetes && hasCorticoid.length > 0) {
    tier3Alerts.push({
      id: 't3-dis-diabetes-corticoid',
      tier: 3,
      tierName: 'Đối soát Bệnh nền',
      severity: 'major',
      title: '🟡 Bệnh nhân Đái tháo đường dùng Corticoid toàn thân',
      description: `Corticoid (${hasCorticoid.map((m) => m.name).join(', ')}) gây tăng tân tạo đường tại gan và kháng insulin mạnh, nguy cơ gây bùng phát đường huyết mất kiểm soát.`,
      recommendation: 'Nếu bắt buộc dùng: theo dõi sát đường huyết mao mạch, có thể cần tăng liều tạm thời thuốc hạ đường huyết trong thời gian dùng corticoid.',
      involvedItems: hasCorticoid.map((m) => m.name),
      pointsDeducted: 15,
    });
  }

  // 3.6 Chức năng thận / Tuổi cao (>= 65 tuổi hoặc CrCl < 50 mL/p)
  if (age >= 65 || (estimatedCrCl && estimatedCrCl < 50)) {
    const renalClearedDrugs = meds.filter((m) =>
      ['metformin', 'glucophage', 'allopurinol', 'zyloric', 'gabapentin', 'ciprofloxacin'].some((kw) =>
        m.name.toLowerCase().includes(kw)
      )
    );
    if (renalClearedDrugs.length > 0) {
      tier3Alerts.push({
        id: 't3-dis-renal-elderly',
        tier: 3,
        tierName: 'Đối soát Tuổi & Chức năng thận',
        severity: 'moderate',
        title: `🟡 Bệnh nhân cao tuổi (${age} tuổi) - Chú ý chỉnh liều qua thận (CrCl ~ ${estimatedCrCl || 'giảm sinh lý'} mL/p)`,
        description: `Bệnh nhân ${age} tuổi có mức lọc cầu thận suy giảm sinh lý theo tuổi tác. Các thuốc đào thải qua thận (${renalClearedDrugs.map((m) => m.name).join(', ')}) có nguy cơ tích lũy sinh độc tính.`,
        recommendation: 'Đối với Metformin: giảm liều nếu CrCl < 45, ngưng nếu CrCl < 30. Đối với Allopurinol: không quá 100-200mg/ngày. Giữ đủ nước.',
        involvedItems: renalClearedDrugs.map((m) => m.name),
        pointsDeducted: 10,
      });
    }
  }

  // ================= 4. TẦNG 4: LIỀU TỐI ĐA 24H & CÁCH DÙNG =================
  for (const med of meds) {
    const rawText = `${med.name} ${med.activeIngredient || ''}`.toLowerCase();
    const morning = med.dosage?.morning ?? 0;
    const noon = med.dosage?.noon ?? 0;
    const afternoon = med.dosage?.afternoon ?? 0;
    const evening = med.dosage?.evening ?? 0;
    const totalPillsPerDay = morning + noon + afternoon + evening;
    const strengthMg = extractMgValue(med.strength || med.name);

    if (totalPillsPerDay > 0 && strengthMg > 0) {
      const totalDailyMg = totalPillsPerDay * strengthMg;

      for (const rule of MAX_DOSE_RULES) {
        if (rule.keywords.some((kw) => rawText.includes(kw))) {
          const maxAllowed = (age >= 65 && rule.elderlyMaxMg) ? rule.elderlyMaxMg : rule.maxMgPerDay;
          if (totalDailyMg > maxAllowed) {
            tier4Alerts.push({
              id: `t4-overdose-${rule.drugName}`,
              tier: 4,
              tierName: 'Liều Tối Đa 24h',
              severity: 'major',
              title: `🔵 Vượt liều tối đa 24h: ${rule.drugName} (${totalDailyMg}mg/ngày > ${maxAllowed}mg)`,
              description: `Tổng liều kê trong ngày là ${totalDailyMg}mg (${totalPillsPerDay} viên × ${strengthMg}mg). Ngưỡng tối đa an toàn theo Dược thư Quốc gia là ${maxAllowed}mg/ngày.`,
              recommendation: `Giảm liều ${rule.drugName} xuống mức tối đa ${maxAllowed}mg/ngày để tránh độc tính tích lũy.`,
              involvedItems: [med.name, `Tổng: ${totalDailyMg}mg/ngày`],
              pointsDeducted: 25,
            });
          }
        }
      }
    }

    // Kiểm tra thời điểm uống tối ưu
    const timing = med.dosage?.timing || '';
    if (['esomeprazole', 'nexium', 'pantoprazole', 'pantoloc', 'rabeprazole', 'pariet'].some((kw) => rawText.includes(kw))) {
      if (timing === 'sau_an') {
        tier4Alerts.push({
          id: `t4-timing-ppi-${med.name}`,
          tier: 4,
          tierName: 'Thời Điểm Uống Thuốc',
          severity: 'info',
          title: `🔵 Thời điểm uống tối ưu: ${med.name} nên uống TRƯỚC ĂN`,
          description: 'Thuốc ức chế bơm proton (PPI) đạt hiệu quả ức chế acid cao nhất khi uống trước bữa ăn sáng 30 - 60 phút khi các bơm proton được kích hoạt.',
          recommendation: 'Chuyển thời điểm uống sang: "Trước bữa ăn sáng 30 phút".',
          involvedItems: [med.name],
          pointsDeducted: 3,
        });
      }
    }

    if (['meloxicam', 'celecoxib', 'diclofenac', 'ibuprofen', 'medrol', 'prednisolone'].some((kw) => rawText.includes(kw))) {
      if (timing === 'truoc_an') {
        tier4Alerts.push({
          id: `t4-timing-nsaid-${med.name}`,
          tier: 4,
          tierName: 'Thời Điểm Uống Thuốc',
          severity: 'moderate',
          title: `🔵 ${med.name} PHẢI UỐNG NGAY SAU ĂN NO`,
          description: 'NSAIDs và Corticoid uống lúc đói kích ứng trực tiếp niêm mạc dạ dày, gây viêm trợt và loét cấp tính.',
          recommendation: 'Chuyển thời điểm uống sang: "Sau bữa ăn no với 1 ly nước đầy".',
          involvedItems: [med.name],
          pointsDeducted: 10,
        });
      }
    }

    if (['atorvastatin', 'lipitor', 'rosuvastatin', 'crestor', 'simvastatin', 'zocor', 'singulair', 'montelukast'].some((kw) => rawText.includes(kw))) {
      if (morning > 0 && evening === 0) {
        tier4Alerts.push({
          id: `t4-timing-statin-${med.name}`,
          tier: 4,
          tierName: 'Thời Điểm Uống Thuốc',
          severity: 'info',
          title: `🔵 ${med.name} tối ưu nhất khi uống BUỔI TỐI`,
          description: 'Enzym tổng hợp Cholesterol tại gan (HMG-CoA Reductase) hoạt động mạnh nhất vào ban đêm; thuốc nhóm Montelukast cũng phát huy hiệu quả kháng co thắt phế quản tốt nhất về đêm.',
          recommendation: 'Khuyến khích chuyển liều sang uống 1 lần vào buổi tối lúc 20:30.',
          involvedItems: [med.name],
          pointsDeducted: 2,
        });
      }
    }
  }

  // ================= 5. TẦNG 5: LƯU Ý LÂM SÀNG & THEO DÕI =================
  for (const med of meds) {
    const rawText = `${med.name} ${med.activeIngredient || ''}`.toLowerCase();

    // Buồn ngủ
    if (['chlorpheniramine', 'diphenhydramine', 'cinnarizine', 'stugeron', 'alimemazine', 'amitriptyline', 'decolgen', 'tiffy'].some((kw) => rawText.includes(kw))) {
      tier5Alerts.push({
        id: `t5-mon-drowsy-${med.name}`,
        tier: 5,
        tierName: 'Lưu Ý Lâm Sàng',
        severity: 'info',
        title: `🟣 Tác dụng phụ gây buồn ngủ: ${med.name}`,
        description: 'Thuốc có tác dụng kháng Histamin H1 hoặc an thần gây buồn ngủ, giảm phản xạ.',
        recommendation: 'Dặn bệnh nhân không lái xe, không vận hành máy móc nguy hiểm trong thời gian uống thuốc.',
        involvedItems: [med.name],
        pointsDeducted: 2,
      });
    }

    // Hạ đường huyết
    if (['gliclazide', 'diamicron', 'glimepiride', 'amaryl', 'glibenclamide', 'insulin'].some((kw) => rawText.includes(kw))) {
      tier5Alerts.push({
        id: `t5-mon-hypo-${med.name}`,
        tier: 5,
        tierName: 'Theo Dõi Hạ Đường Huyết',
        severity: 'info',
        title: `🟣 Nguy cơ hạ đường huyết: ${med.name}`,
        description: 'Thuốc kích thích tiết insulin có thể gây tụt đường huyết (vã mồ hôi, đói cồn cào, run tay, chóng mặt).',
        recommendation: 'Dặn bệnh nhân ăn đúng giờ không bỏ bữa và luôn mang theo sẵn vài viên kẹo ngọt hoặc gói đường.',
        involvedItems: [med.name],
        pointsDeducted: 2,
      });
    }

    // Ho khan do ACEi
    if (['perindopril', 'coversyl', 'enalapril', 'captopril'].some((kw) => rawText.includes(kw))) {
      tier5Alerts.push({
        id: `t5-mon-acei-cough-${med.name}`,
        tier: 5,
        tierName: 'Theo Dõi Tác Dụng Phụ',
        severity: 'info',
        title: `🟣 Tác dụng phụ ho khan do ACEi: ${med.name}`,
        description: 'Khoảng 10-15% bệnh nhân dùng thuốc ức chế men chuyển xuất hiện ho khan dai dẳng do ứ đọng Bradykinin.',
        recommendation: 'Dặn dò bệnh nhân nếu ho khan kéo dài thì tái khám để bác sĩ đổi sang nhóm Chẹn thụ thể ARB (Telmisartan / Losartan).',
        involvedItems: [med.name],
        pointsDeducted: 2,
      });
    }

    // Phù ngoại biên Amlodipine
    if (['amlodipine', 'amlor'].some((kw) => rawText.includes(kw))) {
      tier5Alerts.push({
        id: `t5-mon-edema-${med.name}`,
        tier: 5,
        tierName: 'Theo Dõi Tác Dụng Phụ',
        severity: 'info',
        title: `🟣 Phù mắt cá chân do Amlodipine`,
        description: 'Chẹn kênh Canxi DHP gây giãn tiểu động mạch nhiều hơn tiểu tĩnh mạch, có thể gây phù nhẹ vùng mắt cá chân.',
        recommendation: 'Giải thích cho bệnh nhân yên tâm (không phải suy thận/suy tim), gác chân cao khi nằm nghỉ.',
        involvedItems: [med.name],
        pointsDeducted: 1,
      });
    }
  }

  // ================= TÍNH TOÁN ĐIỂM AN TOÀN TỔNG HỢP (0 - 100) =================
  const allAlerts = [...tier1Alerts, ...tier2Alerts, ...tier3Alerts, ...tier4Alerts, ...tier5Alerts];
  const totalDeductions = allAlerts.reduce((sum, a) => sum + a.pointsDeducted, 0);
  const safetyScore = Math.max(0, Math.min(100, 100 - totalDeductions));

  const hasContraindicated = allAlerts.some((a) => a.severity === 'contraindicated');
  const isSafe = safetyScore >= 85 && !hasContraindicated;
  const isPerfect = allAlerts.length === 0;

  let summaryText = '✅ Đơn thuốc an toàn tuyệt đối - Không phát hiện tương tác, quá liều hay chống chỉ định nào.';
  if (!isPerfect) {
    summaryText = `Phát hiện ${allAlerts.length} lưu ý an toàn qua 5 tầng kiểm soát y khoa. Điểm an toàn: ${safetyScore}/100.`;
  }

  return {
    safetyScore,
    isSafe,
    isPerfect,
    tier1Alerts,
    tier2Alerts,
    tier3Alerts,
    tier4Alerts,
    tier5Alerts,
    allAlerts,
    summaryText,
    estimatedCrCl,
  };
}

/**
 * Adapter tương thích ngược với API cũ runComprehensiveLocalSafetyCheck
 */
export function runComprehensiveLocalSafetyCheck(params: {
  medications: { name: string; activeIngredient?: string }[];
  chronicConditions?: string[];
  vitals?: {
    bloodPressureSystolic?: string | number;
    bloodPressureDiastolic?: string | number;
    heartRate?: string | number;
    temperature?: string | number;
  };
  allergies?: string[];
  birthYear?: number | string;
  gender?: string;
  weight?: number | string;
}) {
  const report = evaluateFiveTierSafety(
    params.medications,
    {
      allergies: params.allergies,
      chronicConditions: params.chronicConditions,
      birthYear: params.birthYear,
      gender: params.gender,
      weight: params.weight,
      vitals: params.vitals,
    }
  );

  return report.allAlerts.map((a) => ({
    id: a.id,
    severity: a.severity,
    type: (a.tier === 1 ? 'drug-allergy' : a.tier === 2 ? 'drug-drug' : a.tier === 3 ? 'drug-disease' : 'dosage') as any,
    title: a.title,
    description: a.description,
    recommendation: a.recommendation,
    involvedItems: a.involvedItems,
    tier: a.tier,
    tierName: a.tierName,
  }));
}
