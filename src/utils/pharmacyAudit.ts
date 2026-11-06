import { MedicationCatalogItem } from '../types/medical';

export const CLINIC_CATEGORIES = [
  'Tim mạch - Huyết áp',
  'Mỡ máu - Tim mạch',
  'Đái tháo đường',
  'Dạ dày - Tiêu hóa',
  'Kháng sinh',
  'Hô hấp - Tai mũi họng',
  'Kháng viêm - Phù nề',
  'Giảm đau - Hạ sốt',
  'Cơ xương khớp',
  'Tuần hoàn não',
  'Vitamin & Bổ dưỡng',
] as const;

export type ClinicCategory = (typeof CLINIC_CATEGORIES)[number];

// Quy tắc từ khóa dược lý đối chiếu chuẩn xác
const CATEGORY_RULES: { category: ClinicCategory; keywords: string[]; priorityKeywords?: string[] }[] = [
  {
    category: 'Giảm đau - Hạ sốt',
    keywords: [
      'paracetamol',
      'acetaminophen',
      'codeine',
      'butalbital',
      'tramadol',
      'efferalgan',
      'panadol',
      'hapacol',
      'tylenol',
      'ultracet',
      'alaxan',
      'doliprane',
      'antipyretic',
      'analgesic',
    ],
    priorityKeywords: ['acetaminophen', 'paracetamol', 'codeine', 'butalbital', 'tramadol'],
  },
  {
    category: 'Kháng sinh',
    keywords: [
      'amoxicillin',
      'augmentin',
      'klamentin',
      'clavulanic',
      'cefuroxime',
      'zinnat',
      'cefixime',
      'cefpodoxime',
      'ceftriaxone',
      'azithromycin',
      'zithromax',
      'clarithromycin',
      'klacid',
      'ciprofloxacin',
      'ciprobay',
      'levofloxacin',
      'tavanic',
      'doxycycline',
      'metronidazole',
      'klion',
      'bactrim',
      'cotrimoxazol',
      'ampicillin',
      'gentamicin',
    ],
  },
  {
    category: 'Mỡ máu - Tim mạch',
    keywords: [
      'atorvastatin',
      'lipitor',
      'rosuvastatin',
      'crestor',
      'simvastatin',
      'zocor',
      'fenofibrate',
      'lipanthyl',
      'gemfibrozil',
      'ezetimibe',
      'vytorin',
      'statin',
      'cholesterol',
      'triglyceride',
    ],
  },
  {
    category: 'Đái tháo đường',
    keywords: [
      'metformin',
      'glucophage',
      'gliclazide',
      'diamicron',
      'glimepiride',
      'amaryl',
      'sitagliptin',
      'januvia',
      'vildagliptin',
      'galvus',
      'dapagliflozin',
      'forxiga',
      'empagliflozin',
      'jardiance',
      'canagliflozin',
      'insulin',
      'novorapid',
      'lantus',
      'mixtard',
      'glibenclamide',
    ],
  },
  {
    category: 'Tim mạch - Huyết áp',
    keywords: [
      'amlodipine',
      'amlor',
      'perindopril',
      'coversyl',
      'losartan',
      'cozaar',
      'telmisartan',
      'micardis',
      'twynsta',
      'enalapril',
      'captopril',
      'lisinopril',
      'valsartan',
      'diovan',
      'exforge',
      'metoprolol',
      'betaloc',
      'bisoprolol',
      'concor',
      'carvedilol',
      'nebivolol',
      'nifedipine',
      'adalat',
      'diltiazem',
      'verapamil',
      'plavix',
      'clopidogrel',
      'brilinta',
      'ticagrelor',
      'nitroglycerin',
      'hydralazine',
      'furosemide',
      'lasix',
      'spironolactone',
      'aldactone',
    ],
  },
  {
    category: 'Dạ dày - Tiêu hóa',
    keywords: [
      'omeprazole',
      'esomeprazole',
      'nexium',
      'pantoprazole',
      'pantoloc',
      'rabeprazole',
      'pariet',
      'lansoprazole',
      'famotidine',
      'domperidone',
      'motilium',
      'phosphalugel',
      'gaviscon',
      'drotaverine',
      'no-spa',
      'trimebutine',
      'debridat',
      'berberin',
      'lactomin',
      'smecta',
      'gastric',
    ],
  },
  {
    category: 'Hô hấp - Tai mũi họng',
    keywords: [
      'salbutamol',
      'ventolin',
      'budesonide',
      'pulmicort',
      'symbicort',
      'seretide',
      'fluticasone',
      'montelukast',
      'singulair',
      'ambroxol',
      'mucosolvan',
      'bromhexine',
      'bisolvon',
      'acetylcysteine',
      'acemuc',
      'cetirizine',
      'zyrtec',
      'loratadine',
      'clarityne',
      'fexofenadine',
      'telfast',
      'inhaler',
    ],
  },
  {
    category: 'Kháng viêm - Phù nề',
    keywords: [
      'methylprednisolone',
      'medrol',
      'prednisolone',
      'dexamethasone',
      'alphachymotrypsin',
      'alpha chymotrypsin',
      'chymoral',
      'chophytol',
      'corticoid',
    ],
  },
  {
    category: 'Cơ xương khớp',
    keywords: [
      'meloxicam',
      'mobic',
      'celecoxib',
      'celebrex',
      'etoricoxib',
      'arcoxia',
      'diclofenac',
      'voltaren',
      'glucosamine',
      'diacerein',
      'artrodar',
      'colchicine',
      'allopurinol',
      'zyloric',
      'febuxostat',
      'nsaid',
    ],
  },
  {
    category: 'Tuần hoàn não',
    keywords: [
      'ginkgo',
      'tanakan',
      'piracetam',
      'nootropil',
      'vinpocetine',
      'cavinton',
      'citicoline',
      'stugeron',
      'cinnarizine',
      'flunarizine',
      'sibelium',
      'betahistine',
      'betaserc',
    ],
  },
  {
    category: 'Vitamin & Bổ dưỡng',
    keywords: [
      'vitamin',
      'calcium',
      'calci',
      'iron',
      'fervit',
      'zinc',
      'kẽm',
      'magne',
      'b6',
      'omega',
      'dha',
      'folic',
      'multivitamin',
    ],
  },
];

/**
 * Chuẩn hóa tên thuốc để so sánh trùng lặp
 */
export function normalizeDrugName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt để so sánh tên
    .replace(/\(.*?\)/g, '') // Bỏ phần trong ngoặc đơn ví dụ (300mg)
    .replace(/[^a-z0-9]/g, ' ') // Giữ lại chữ và số
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tự động suy luận nhóm dược lý chuẩn từ hoạt chất và tên biệt dược
 */
export function inferDrugCategory(name: string, activeIngredient?: string): ClinicCategory | null {
  const combined = `${name || ''} ${activeIngredient || ''}`.toLowerCase();

  for (const rule of CATEGORY_RULES) {
    if (rule.priorityKeywords?.some((kw) => combined.includes(kw))) {
      return rule.category;
    }
  }

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => combined.includes(kw))) {
      return rule.category;
    }
  }

  return null;
}

export interface MisclassificationAlert {
  item: MedicationCatalogItem;
  currentCategory: string;
  suggestedCategory: ClinicCategory;
  reason: string;
  severity: 'high' | 'medium';
}

/**
 * Kiểm tra xem một loại thuốc có bị gán sai nhóm dược lý hay không
 * (Ví dụ: Butalbital/Acetaminophen/Codeine bị xếp vào Tim mạch - Huyết áp)
 */
export function detectMisclassifiedDrug(item: MedicationCatalogItem): MisclassificationAlert | null {
  const inferred = inferDrugCategory(item.name, item.activeIngredient);
  if (!inferred) return null;

  if (item.category !== inferred) {
    const combined = `${item.name} ${item.activeIngredient || ''}`.toLowerCase();
    const isHighSeverity =
      (combined.includes('acetaminophen') || combined.includes('paracetamol') || combined.includes('codeine')) &&
      item.category.includes('Tim mạch');

    let reason = `Hoạt chất hoặc biệt dược chỉ định đúng nhóm [${inferred}], nhưng đang lưu trong nhóm [${item.category}].`;
    if (isHighSeverity) {
      reason = `Chứa hoạt chất giảm đau/hạ sốt/an thần (${item.activeIngredient || 'Acetaminophen'}), nhưng bị gán nhầm vào nhóm [${item.category}].`;
    }

    return {
      item,
      currentCategory: item.category,
      suggestedCategory: inferred,
      reason,
      severity: isHighSeverity ? 'high' : 'medium',
    };
  }

  return null;
}

export interface DuplicateGroup {
  key: string;
  matchType: 'exact_name' | 'normalized_name' | 'same_active_and_strength' | 'id_collision';
  title: string;
  reason: string;
  items: MedicationCatalogItem[];
  suggestedPrimaryId: string;
}

export interface IncompleteItemAlert {
  item: MedicationCatalogItem;
  missingFields: string[];
}

export interface PharmacyAuditReport {
  timestamp: string;
  totalDrugs: number;
  duplicateGroups: DuplicateGroup[];
  totalDuplicateItems: number;
  misclassifiedAlerts: MisclassificationAlert[];
  incompleteAlerts: IncompleteItemAlert[];
  qualityScore: number; // 0 - 100%
  healthStatus: 'excellent' | 'good' | 'warning' | 'needs_attention';
}

/**
 * Kiểm tra toàn diện kho thuốc: trùng lặp, phân loại sai, thiếu thông tin
 */
export function auditPharmacyCatalog(catalog: MedicationCatalogItem[]): PharmacyAuditReport {
  const duplicateGroups: DuplicateGroup[] = [];
  const handledIds = new Set<string>();

  // 1. Kiểm tra trùng lặp theo Normalized Name
  const nameMap = new Map<string, MedicationCatalogItem[]>();
  for (const item of catalog) {
    const norm = normalizeDrugName(item.name);
    if (!norm) continue;
    if (!nameMap.has(norm)) {
      nameMap.set(norm, []);
    }
    nameMap.get(norm)!.push(item);
  }

  for (const [normName, items] of nameMap.entries()) {
    if (items.length > 1) {
      items.forEach((it) => handledIds.add(it.id));
      // Chọn thuốc đầy đủ thông tin nhất làm Primary
      const sorted = [...items].sort((a, b) => {
        const scoreA = (a.defaultInstructions?.length || 0) + (a.warningNote?.length || 0) + (a.activeIngredient ? 20 : 0);
        const scoreB = (b.defaultInstructions?.length || 0) + (b.warningNote?.length || 0) + (b.activeIngredient ? 20 : 0);
        return scoreB - scoreA;
      });

      const isExact = items.every((it) => it.name.trim().toLowerCase() === items[0].name.trim().toLowerCase());

      duplicateGroups.push({
        key: `name_${normName}`,
        matchType: isExact ? 'exact_name' : 'normalized_name',
        title: isExact ? `Trùng tên chính xác: "${items[0].name}"` : `Tên gần giống nhau: "${items[0].name}"`,
        reason: `Có ${items.length} bản ghi cùng tên thuốc được phát hiện trong kho.`,
        items,
        suggestedPrimaryId: sorted[0].id,
      });
    }
  }

  // 2. Kiểm tra trùng theo Hoạt chất + Hàm lượng (nếu chưa nằm trong nhóm trùng tên)
  const substanceMap = new Map<string, MedicationCatalogItem[]>();
  for (const item of catalog) {
    if (handledIds.has(item.id)) continue;
    const act = (item.activeIngredient || '').trim().toLowerCase();
    const str = (item.strength || '').trim().toLowerCase().replace(/\s+/g, '');
    if (act && str && act.length > 3) {
      const key = `${act}_${str}`;
      if (!substanceMap.has(key)) {
        substanceMap.set(key, []);
      }
      substanceMap.get(key)!.push(item);
    }
  }

  for (const [key, items] of substanceMap.entries()) {
    if (items.length > 1) {
      const sorted = [...items].sort((a, b) => {
        const scoreA = (a.defaultInstructions?.length || 0) + (a.warningNote?.length || 0);
        const scoreB = (b.defaultInstructions?.length || 0) + (b.warningNote?.length || 0);
        return scoreB - scoreA;
      });

      duplicateGroups.push({
        key: `substance_${key}`,
        matchType: 'same_active_and_strength',
        title: `Trùng hoạt chất & hàm lượng: ${items[0].activeIngredient} (${items[0].strength})`,
        reason: `Các thuốc khác tên biệt dược nhưng có cùng hoạt chất và hàm lượng điều trị.`,
        items,
        suggestedPrimaryId: sorted[0].id,
      });
    }
  }

  // 3. Kiểm tra phân loại sai nhóm do AI / Crawler
  const misclassifiedAlerts: MisclassificationAlert[] = [];
  for (const item of catalog) {
    const alert = detectMisclassifiedDrug(item);
    if (alert) {
      misclassifiedAlerts.push(alert);
    }
  }

  // 4. Kiểm tra dữ liệu chưa hoàn thiện
  const incompleteAlerts: IncompleteItemAlert[] = [];
  for (const item of catalog) {
    const missing: string[] = [];
    if (!item.activeIngredient || item.activeIngredient.trim() === '') missing.push('Hoạt chất');
    if (!item.strength || item.strength.trim() === '') missing.push('Hàm lượng');
    if (!item.defaultInstructions || item.defaultInstructions.trim() === '') missing.push('Cách dùng mặc định');
    if (missing.length > 0) {
      incompleteAlerts.push({ item, missingFields: missing });
    }
  }

  // Tính điểm chất lượng
  const totalItems = catalog.length || 1;
  const duplicatePenalty = Math.min(35, duplicateGroups.length * 8);
  const misclassPenalty = Math.min(35, misclassifiedAlerts.length * 6);
  const incompletePenalty = Math.min(30, incompleteAlerts.length * 2);

  const rawScore = 100 - duplicatePenalty - misclassPenalty - incompletePenalty;
  const qualityScore = Math.max(10, Math.min(100, rawScore));

  let healthStatus: PharmacyAuditReport['healthStatus'] = 'excellent';
  if (qualityScore < 60) healthStatus = 'needs_attention';
  else if (qualityScore < 80) healthStatus = 'warning';
  else if (qualityScore < 95) healthStatus = 'good';

  const totalDuplicateItems = duplicateGroups.reduce((acc, g) => acc + g.items.length, 0);

  return {
    timestamp: new Date().toISOString(),
    totalDrugs: catalog.length,
    duplicateGroups,
    totalDuplicateItems,
    misclassifiedAlerts,
    incompleteAlerts,
    qualityScore,
    healthStatus,
  };
}

/**
 * Tự động dọn sạch và gộp tất cả các thuốc trùng lặp
 */
export function autoCleanAndDeduplicate(
  catalog: MedicationCatalogItem[],
  autoFixMisclassified = true
): {
  cleanedCatalog: MedicationCatalogItem[];
  removedDuplicatesCount: number;
  fixedCategoriesCount: number;
} {
  const audit = auditPharmacyCatalog(catalog);
  const removeIds = new Set<string>();

  // Loại bỏ các bản sao thừa, giữ lại primaryId
  for (const group of audit.duplicateGroups) {
    for (const item of group.items) {
      if (item.id !== group.suggestedPrimaryId) {
        removeIds.add(item.id);
      }
    }
  }

  let fixedCount = 0;
  const cleanedCatalog = catalog
    .filter((item) => !removeIds.has(item.id))
    .map((item) => {
      if (autoFixMisclassified) {
        const alert = detectMisclassifiedDrug(item);
        if (alert) {
          fixedCount++;
          return {
            ...item,
            category: alert.suggestedCategory,
          };
        }
      }
      return item;
    });

  return {
    cleanedCatalog,
    removedDuplicatesCount: removeIds.size,
    fixedCategoriesCount: fixedCount,
  };
}

/**
 * Xuất báo cáo kiểm tra kho ra CSV
 */
export function exportPharmacyAuditToCsv(audit: PharmacyAuditReport): void {
  const lines: string[] = [];
  lines.push('\uFEFF"BÁO CÁO KIỂM TRA CHẤT LƯỢNG KHO THUỐC PHÒNG KHÁM"');
  lines.push(`"Thời gian xuất:","${new Date().toLocaleString('vi-VN')}"`);
  lines.push(`"Tổng số thuốc trong kho:","${audit.totalDrugs}"`);
  lines.push(`"Điểm chất lượng CSDL:","${audit.qualityScore}%"`);
  lines.push(`"Số nhóm thuốc trùng lặp:","${audit.duplicateGroups.length}"`);
  lines.push(`"Số thuốc nghi ngờ gán sai nhóm:","${audit.misclassifiedAlerts.length}"`);
  lines.push('');

  // Phần 1: Danh sách thuốc trùng
  lines.push('"--- PHẦN 1: CÁC THUỐC TRÙNG LẶP CẦN XỬ LÝ ---"');
  lines.push('"Nhóm trùng","Tên thuốc","Hoạt chất","Hàm lượng","Dạng","Đơn vị","Nhóm hiện tại","Bản ghi đề xuất giữ"');
  audit.duplicateGroups.forEach((group, idx) => {
    group.items.forEach((item) => {
      const isPrimary = item.id === group.suggestedPrimaryId ? 'Gợi ý giữ lại' : 'Bản sao thừa';
      lines.push(
        `"Nhóm ${idx + 1} (${group.title})","${item.name}","${item.activeIngredient || ''}","${item.strength}","${item.form}","${item.unit}","${item.category}","${isPrimary}"`
      );
    });
  });
  lines.push('');

  // Phần 2: Thuốc sai nhóm
  lines.push('"--- PHẦN 2: THUỐC NGHI NGỜ GÁN SAI NHÓM DO AI / CÀO ---"');
  lines.push('"Tên thuốc","Hoạt chất","Nhóm hiện tại (Sai)","Nhóm khuyến nghị (Đúng)","Lý do & Cảnh báo lâm sàng"');
  audit.misclassifiedAlerts.forEach((alert) => {
    lines.push(
      `"${alert.item.name}","${alert.item.activeIngredient || ''}","${alert.currentCategory}","${alert.suggestedCategory}","${alert.reason}"`
    );
  });
  lines.push('');

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Bao_Cao_Kiem_Tra_Kho_Thuoc_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
