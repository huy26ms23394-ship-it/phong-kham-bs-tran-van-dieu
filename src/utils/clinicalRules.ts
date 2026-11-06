/**
 * Clinical Drug Interaction & Safety Rules Engine (Local Zero-Latency 0ms)
 * Cơ sở dữ liệu luật tương tác thuốc & an toàn lâm sàng ngoại trú chuẩn Bộ Y Tế & Dược Thư
 * Chạy trực tiếp phía Client, phát hiện tương tác nguy hiểm trong 0ms trước khi gọi Gemini AI.
 */

export interface ClinicalRuleAlert {
  id: string;
  severity: 'contraindicated' | 'major' | 'moderate' | 'info';
  type: 'drug-drug' | 'drug-disease' | 'drug-vitals' | 'dosage';
  title: string;
  description: string;
  recommendation: string;
  involvedItems: string[];
}

export interface DrugRuleDefinition {
  id: string;
  drugAKeywords: string[];
  drugBKeywords: string[];
  severity: 'contraindicated' | 'major' | 'moderate';
  title: string;
  mechanism: string;
  clinicalEffect: string;
  recommendation: string;
}

// Danh mục các cặp tương tác thuốc - thuốc nguy hiểm thường gặp tại phòng khám đa khoa & nội tổng quát
export const DRUG_INTERACTION_RULES: DrugRuleDefinition[] = [
  {
    id: 'ddi-acei-nsaid',
    drugAKeywords: ['enalapril', 'captopril', 'lisinopril', 'perindopril', 'coversyl', 'losartan', 'valsartan', 'telmisartan', 'micardis', 'co-diovan'],
    drugBKeywords: ['ibuprofen', 'meloxicam', 'celecoxib', 'diclofenac', 'voltaren', 'etoricoxib', 'arcoxia', 'piroxicam'],
    severity: 'major',
    title: 'Ức chế men chuyển / Chẹn thụ thể (ACEI/ARB) + Kháng viêm NSAID',
    mechanism: 'NSAID ức chế tổng hợp Prostaglandin tại cầu thận, làm co tiểu động mạch vào; ACEI/ARB làm giãn tiểu động mạch ra.',
    clinicalEffect: 'Làm giảm mạnh mức lọc cầu thận (GFR), nguy cơ suy thận cấp và giảm tác dụng hạ áp, tăng kali máu.',
    recommendation: 'Tránh phối hợp kéo dài. Ưu tiên Paracetamol giảm đau. Nếu bắt buộc dùng NSAID: dùng liều thấp nhất, thời gian ngắn nhất và bù đủ nước.',
  },
  {
    id: 'ddi-statin-macrolide',
    drugAKeywords: ['atorvastatin', 'lipitor', 'simvastatin', 'zocor', 'rosuvastatin', 'crestor'],
    drugBKeywords: ['clarithromycin', 'klacid', 'erythromycin', 'azithromycin', 'zithromax'],
    severity: 'major',
    title: 'Statin hạ mỡ máu + Kháng sinh nhóm Macrolide',
    mechanism: 'Macrolide ức chế mạnh enzym CYP3A4 ở gan, làm chậm chuyển hóa và tăng nồng độ Statin trong máu gấp 4-10 lần.',
    clinicalEffect: 'Tăng nguy cơ nhiễm độc cơ vân, đau cơ dữ dội và tiêu cơ vân cấp (Rhabdomyolysis) dẫn đến suy thận.',
    recommendation: 'Tạm ngưng Statin trong thời gian uống kháng sinh Macrolide (5-7 ngày), hoặc chuyển sang kháng sinh khác không ức chế CYP3A4.',
  },
  {
    id: 'ddi-clopidogrel-omeprazole',
    drugAKeywords: ['clopidogrel', 'plavix'],
    drugBKeywords: ['omeprazole', 'losec', 'esomeprazole', 'nexium'],
    severity: 'major',
    title: 'Kháng kết tập tiểu cầu Clopidogrel + PPI (Omeprazole/Esomeprazole)',
    mechanism: 'Omeprazole ức chế enzym CYP2C19, ngăn cản Clopidogrel chuyển hóa thành dạng có hoạt tính.',
    clinicalEffect: 'Giảm đáng kể hiệu quả bảo vệ tim mạch của Clopidogrel, tăng nguy cơ tái phát huyết khối hoặc nhồi máu cơ tim.',
    recommendation: 'Khuyến cáo thay thế bằng Pantoprazole hoặc Rabeprazole (ít tương tác CYP2C19), hoặc dùng kháng thụ thể H2 (Famotidine).',
  },
  {
    id: 'ddi-sulfonylurea-nsaid',
    drugAKeywords: ['gliclazide', 'diamicron', 'glimepiride', 'amaryl', 'glibenclamide'],
    drugBKeywords: ['meloxicam', 'ibuprofen', 'diclofenac', 'aspirin', 'etoricoxib'],
    severity: 'major',
    title: 'Hạ đường huyết Sulfonylurea + NSAID / Aspirin',
    mechanism: 'NSAID cạnh tranh liên kết protein huyết tương và ức chế chuyển hóa Sulfonylurea.',
    clinicalEffect: 'Làm giải phóng nhiều Sulfonylurea tự do, nguy cơ gây hạ đường huyết nặng và kéo dài, đặc biệt ở người cao tuổi.',
    recommendation: 'Cảnh báo bệnh nhân theo dõi sát đường huyết mao mạch, hướng dẫn xử trí hạ đường huyết và ưu tiên giảm đau an toàn.',
  },
  {
    id: 'ddi-quinolone-corticoid',
    drugAKeywords: ['ciprofloxacin', 'levofloxacin', 'cravit', 'moxifloxacin', 'avelox', 'ofloxacin'],
    drugBKeywords: ['prednisolone', 'methylprednisolone', 'medrol', 'dexamethasone', 'hydrocortisone'],
    severity: 'major',
    title: 'Kháng sinh Quinolone + Thuốc Corticoid toàn thân',
    mechanism: 'Hiệp đồng phá hủy cấu trúc collagen của gân cơ.',
    clinicalEffect: 'Tăng đột biến nguy cơ viêm gân và đứt gân gót chân (gân Achilles), đặc biệt ở người >60 tuổi.',
    recommendation: 'Hạn chế phối hợp. Nếu bắt buộc, dặn dò bệnh nhân ngừng thuốc ngay và báo bác sĩ khi thấy đau tức gót chân hoặc khớp cổ chân.',
  },
  {
    id: 'ddi-quinolone-antacid',
    drugAKeywords: ['ciprofloxacin', 'levofloxacin', 'cravit', 'moxifloxacin', 'ofloxacin'],
    drugBKeywords: ['almagel', 'maalox', 'yumangel', 'canxi', 'calci', 'sat', 'ferrovit', 'tardyferon'],
    severity: 'moderate',
    title: 'Kháng sinh Quinolone + Thuốc chứa Nhôm/Magie/Canxi/Sắt',
    mechanism: 'Ion kim loại đa hóa trị tạo phức chelat không tan với kháng sinh Quinolone trong ống tiêu hóa.',
    clinicalEffect: 'Giảm hấp thu kháng sinh đến 70-90%, gây thất bại điều trị nhiễm khuẩn.',
    recommendation: 'Phải uống kháng sinh Quinolone cách xa các thuốc kháng acid, canxi, viên sắt ít nhất 2 giờ trước hoặc 4 giờ sau.',
  },
  {
    id: 'ddi-betablocker-verapamil',
    drugAKeywords: ['bisoprolol', 'concor', 'metoprolol', 'betaloc', 'atenolol', 'nebivolol', 'carvedilol'],
    drugBKeywords: ['verapamil', 'diltiazem'],
    severity: 'contraindicated',
    title: 'Chẹn Beta + Chẹn kênh Canxi nhóm Non-DHP (Verapamil / Diltiazem)',
    mechanism: 'Hiệp đồng ức chế dẫn truyền nút nhĩ thất (AV node) và giảm co bóp cơ tim.',
    clinicalEffect: 'Nguy cơ block nhĩ thất độ 3, tụt huyết áp nghiêm trọng, ngưng tim hoặc suy tim cấp.',
    recommendation: 'CHỐNG CHỈ ĐỊNH PHỐI HỢP. Chỉ dùng Chẹn Beta phối hợp với nhóm Dihydropyridine (Amlodipine, Felodipine, Nifedipine).',
  },
  {
    id: 'ddi-warfarin-nsaid',
    drugAKeywords: ['warfarin', 'sintrom', 'rivaroxaban', 'xarelto', 'apixaban', 'eliquis', 'dabigatran', 'pradaxa'],
    drugBKeywords: ['aspirin', 'ibuprofen', 'meloxicam', 'celecoxib', 'diclofenac'],
    severity: 'contraindicated',
    title: 'Thuốc chống đông máu (VKA / NOAC) + Kháng viêm NSAID',
    mechanism: 'Tác động kép: ức chế chức năng tiểu cầu, loét niêm mạc dạ dày và ức chế đông máu toàn thân.',
    clinicalEffect: 'Nguy cơ xuất huyết tiêu hóa ồ ạt, đe dọa tính mạng.',
    recommendation: 'Tránh dùng NSAID trên bệnh nhân đang dùng kháng đông. Nếu giảm đau, lựa chọn hàng đầu là Paracetamol.',
  },
  {
    id: 'ddi-ssri-tramadol',
    drugAKeywords: ['sertraline', 'zoloft', 'fluoxetine', 'prozac', 'escitalopram', 'lexapro'],
    drugBKeywords: ['tramadol', 'ultracet', 'zaldiar'],
    severity: 'major',
    title: 'Thuốc chống trầm cảm SSRI + Thuốc giảm đau Tramadol',
    mechanism: 'Tăng nồng độ Serotonin tại khe synap thần kinh trung ương.',
    clinicalEffect: 'Nguy cơ hội chứng Serotonin (kích động, run, sốt cao, co giật) và giảm ngưỡng co giật.',
    recommendation: 'Theo dõi sát triệu chứng thần kinh, cân nhắc giảm liều hoặc dùng nhóm giảm đau khác.',
  },
];

// Kiểm tra tương tác thuốc - bệnh nền
export function checkDrugDiseaseInteractions(
  medicationNames: string[],
  chronicConditions: string[] = []
): ClinicalRuleAlert[] {
  const alerts: ClinicalRuleAlert[] = [];
  const medText = medicationNames.join(' ').toLowerCase();
  const condText = chronicConditions.join(' ').toLowerCase();

  // 1. Chẹn Beta trong Hen phế quản / COPD nặng
  if (
    (condText.includes('hen') || condText.includes('asthma') || condText.includes('copd')) &&
    (medText.includes('bisoprolol') || medText.includes('concor') || medText.includes('metoprolol') || medText.includes('atenolol') || medText.includes('carvedilol') || medText.includes('propranolol'))
  ) {
    alerts.push({
      id: 'dis-bb-asthma',
      severity: 'major',
      type: 'drug-disease',
      title: 'Chẹn Beta trên bệnh nhân Hen phế quản / COPD',
      description: 'Thuốc chẹn thụ thể Beta có thể gây co thắt phế quản cấp, kích phát cơn hen phế quản nặng đe dọa tính mạng.',
      recommendation: 'Thận trọng cao độ. Nếu bắt buộc điều trị tim mạch, ưu tiên chẹn beta chọn lọc cao trên tim (Bisoprolol/Nebivolol) liều thấp hoặc đổi sang nhóm Chẹn kênh Canxi (Amlodipine).',
      involvedItems: ['Chẹn Beta', 'Tiền sử Hen/COPD'],
    });
  }

  // 2. NSAID trên bệnh nhân Viêm loét dạ dày tá tràng
  if (
    (condText.includes('dạ dày') || condText.includes('loét') || condText.includes('trào ngược') || condText.includes('gerd')) &&
    (medText.includes('ibuprofen') || medText.includes('meloxicam') || medText.includes('diclofenac') || medText.includes('aspirin') || medText.includes('piroxicam'))
  ) {
    alerts.push({
      id: 'dis-nsaid-peptic',
      severity: 'moderate',
      type: 'drug-disease',
      title: 'NSAID trên bệnh nhân Viêm loét dạ dày - tá tràng',
      description: 'NSAID ức chế enzym COX-1 làm giảm tạo chất nhầy bảo vệ niêm mạc dạ dày, tăng nguy cơ tái phát viêm loét hoặc xuất huyết tiêu hóa.',
      recommendation: 'Bắt buộc uống sau bữa ăn no và nên phối hợp kèm thuốc bảo vệ dạ dày nhóm PPI (Pantoprazole, Esomeprazole). Ưu tiên nhóm ức chế chọn lọc COX-2 (Celecoxib) hoặc Paracetamol.',
      involvedItems: ['Kháng viêm NSAID', 'Bệnh lý Dạ dày'],
    });
  }

  // 3. Metformin trên bệnh nhân Suy thận mạn
  if (
    (condText.includes('thận') || condText.includes('ckd') || condText.includes('suy thận')) &&
    (medText.includes('metformin') || medText.includes('glucophage'))
  ) {
    alerts.push({
      id: 'dis-metformin-ckd',
      severity: 'major',
      type: 'drug-disease',
      title: 'Metformin trên bệnh nhân có tiền sử bệnh thận',
      description: 'Metformin tích lũy khi chức năng lọc của thận suy giảm, nguy cơ biến chứng Nhiễm toan Lactic (Lactic Acidosis) nặng.',
      recommendation: 'Kiểm tra độ lọc cầu thận ước tính (eGFR). Chống chỉ định nếu eGFR < 30 mL/phút/1.73m2. Nếu eGFR 30-44 mL/phút: giảm nửa liều tối đa (không quá 1000mg/ngày).',
      involvedItems: ['Metformin', 'Tiền sử Bệnh Thận'],
    });
  }

  return alerts;
}

// Kiểm tra tương tác thuốc - sinh hiệu
export function checkDrugVitalsInteractions(
  medicationNames: string[],
  vitals?: {
    bloodPressureSystolic?: string | number;
    bloodPressureDiastolic?: string | number;
    heartRate?: string | number;
    temperature?: string | number;
  }
): ClinicalRuleAlert[] {
  const alerts: ClinicalRuleAlert[] = [];
  if (!vitals) return alerts;

  const medText = medicationNames.join(' ').toLowerCase();
  const sbp = Number(vitals.bloodPressureSystolic) || 0;
  const dbp = Number(vitals.bloodPressureDiastolic) || 0;
  const hr = Number(vitals.heartRate) || 0;

  // 1. Huyết áp thấp mà kê thuốc hạ áp liều cao
  if (sbp > 0 && sbp < 95 && (medText.includes('amlor') || medText.includes('amlodipine') || medText.includes('losartan') || medText.includes('coversyl') || medText.includes('co-diovan') || medText.includes('concor'))) {
    alerts.push({
      id: 'vit-hypotension-antihypertensive',
      severity: 'major',
      type: 'drug-vitals',
      title: 'Cảnh báo: Huyết áp bệnh nhân đang thấp (< 95 mmHg)',
      description: `Huyết áp tâm thu đo được là ${sbp} mmHg. Việc kê đơn thêm thuốc hạ huyết áp có thể gây tụt huyết áp tư thế, chóng mặt, té ngã hoặc ngất xỉu.`,
      recommendation: 'Kiểm tra lại kỹ thuật đo huyết áp. Cân nhắc tạm hoãn hoặc giảm liều thuốc hạ áp, dặn dò uống đủ nước.',
      involvedItems: ['Huyết áp thấp', 'Thuốc hạ áp'],
    });
  }

  // 2. Nhịp tim chậm (< 55 lần/phút) mà dùng Chẹn Beta
  if (hr > 0 && hr < 55 && (medText.includes('concor') || medText.includes('bisoprolol') || medText.includes('betaloc') || medText.includes('metoprolol') || medText.includes('atenolol'))) {
    alerts.push({
      id: 'vit-bradycardia-betablocker',
      severity: 'major',
      type: 'drug-vitals',
      title: 'Cảnh báo: Nhịp tim chậm (< 55 lần/phút) kèm Chẹn Beta',
      description: `Nhịp tim ghi nhận là ${hr} lần/phút. Nhóm Chẹn Beta ức chế nút xoang làm chậm nhịp tim thêm, nguy cơ block nhĩ thất hoặc vô tâm thu.`,
      recommendation: 'Đo điện tâm đồ (ECG) kiểm tra. Cân nhắc tạm dừng hoặc không tăng liều Chẹn Beta.',
      involvedItems: [`Mạch ${hr} bpm`, 'Chẹn Beta'],
    });
  }

  return alerts;
}

// Kiểm tra toàn bộ tương tác thuốc - thuốc (Offline 0ms)
export function checkDrugDrugInteractionsLocal(
  medications: { name: string; activeIngredient?: string }[]
): ClinicalRuleAlert[] {
  const alerts: ClinicalRuleAlert[] = [];
  if (!medications || medications.length < 2) return alerts;

  const medTokens = medications.map((m) => {
    const raw = `${m.name} ${m.activeIngredient || ''}`.toLowerCase();
    return { original: m.name, raw };
  });

  for (const rule of DRUG_INTERACTION_RULES) {
    const matchA = medTokens.find((item) =>
      rule.drugAKeywords.some((keyword) => item.raw.includes(keyword))
    );
    const matchB = medTokens.find((item) =>
      rule.drugBKeywords.some((keyword) => item.raw.includes(keyword))
    );

    if (matchA && matchB && matchA.original !== matchB.original) {
      alerts.push({
        id: rule.id,
        severity: rule.severity,
        type: 'drug-drug',
        title: rule.title,
        description: `${rule.mechanism} ${rule.clinicalEffect}`,
        recommendation: rule.recommendation,
        involvedItems: [matchA.original, matchB.original],
      });
    }
  }

  return alerts;
}

// Tổng hợp kiểm tra an toàn lâm sàng toàn diện 0ms
export function runComprehensiveLocalSafetyCheck(params: {
  medications: { name: string; activeIngredient?: string }[];
  chronicConditions?: string[];
  vitals?: {
    bloodPressureSystolic?: string | number;
    bloodPressureDiastolic?: string | number;
    heartRate?: string | number;
    temperature?: string | number;
  };
}): ClinicalRuleAlert[] {
  const medNames = params.medications.map((m) => m.name);
  const ddiAlerts = checkDrugDrugInteractionsLocal(params.medications);
  const diseaseAlerts = checkDrugDiseaseInteractions(medNames, params.chronicConditions || []);
  const vitalsAlerts = checkDrugVitalsInteractions(medNames, params.vitals);

  return [...ddiAlerts, ...diseaseAlerts, ...vitalsAlerts];
}
