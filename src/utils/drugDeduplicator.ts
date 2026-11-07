/**
 * Bộ Lọc Chống Trùng Thuốc Chuẩn Y Khoa (DrugDeduplicator)
 * Chuẩn hóa Tên biệt dược, Hoạt chất INN và Hàm lượng để loại bỏ trùng lặp tuyệt đối
 */

export interface DrugIdentity {
  name: string;
  activeIngredient?: string;
  strength?: string;
  form?: string;
  warningNote?: string;
  defaultInstructions?: string;
  unitPrice?: number;
  [key: string]: any;
}

/**
 * Loại bỏ dấu tiếng Việt và chuyển về dạng ký tự ASCII thuần
 */
export function removeVietnameseAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Chuẩn hóa hàm lượng thuốc về đơn vị đồng nhất (mg)
 * VD: "1g" -> "1000mg", "0.5g" -> "500mg", "0,5g" -> "500mg", "0,5mg" -> "0.5mg"
 */
export function normalizeDrugStrength(rawStrength: string): string {
  if (!rawStrength) return '';
  let s = rawStrength.toLowerCase().trim().replace(/,/g, '.');

  // Xử lý đơn vị g -> mg (VD: "1g" -> "1000mg", "0.5g" -> "500mg")
  s = s.replace(/(\d+(?:\.\d+)?)\s*g\b/gi, (_match, num) => {
    const val = parseFloat(num);
    if (!isNaN(val)) {
      return `${Math.round(val * 1000)}mg`;
    }
    return `${num}g`;
  });

  // Xử lý đơn vị mcg / microgram -> mg (nếu >= 1000mcg)
  s = s.replace(/(\d+(?:\.\d+)?)\s*(?:mcg|µg)\b/gi, (_match, num) => {
    const val = parseFloat(num);
    if (!isNaN(val) && val >= 1000) {
      return `${val / 1000}mg`;
    }
    return `${num}mcg`;
  });

  // Chuẩn hóa khoảng cách và ký tự ngăn cách: 875mg / 125mg -> 875/125mg
  s = s.replace(/\s*\+\s*/g, '+').replace(/\s*\/\s*/g, '/').replace(/\s+/g, '');

  return s;
}

/**
 * Trích xuất hàm lượng từ tên thuốc nếu trường strength bị thiếu
 * VD: "Amlor 5mg" -> strength: "5mg", nameClean: "amlor"
 */
export function extractStrengthFromName(name: string): { cleanName: string; extractedStrength: string } {
  if (!name) return { cleanName: '', extractedStrength: '' };
  const strengthRegex = /(\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?\s*(?:mg|g|mcg|ml|iu|ui|microkatals))/i;
  const match = name.match(strengthRegex);
  if (match) {
    const extractedStrength = normalizeDrugStrength(match[0]);
    const cleanName = name.replace(strengthRegex, '').replace(/\(.*?\)/g, '').trim();
    return { cleanName, extractedStrength };
  }
  return { cleanName: name.replace(/\(.*?\)/g, '').trim(), extractedStrength: '' };
}

/**
 * Hàm chuẩn hóa khóa định danh thuốc getDrugCanonicalKey(drug):
 * 1. Chuyển chữ thường, loại bỏ dấu tiếng Việt, ký tự đặc biệt
 * 2. Chuẩn hóa đơn vị hàm lượng (1g -> 1000mg, 0.5g -> 500mg, 0,5mg -> 0.5mg)
 * 3. Tạo 2 khóa kiểm tra:
 *    - Khóa theo Tên biệt dược + Hàm lượng (brandKey)
 *    - Khóa theo Tổ hợp Hoạt chất + Hàm lượng (innKey)
 */
export function getDrugCanonicalKey(drug: DrugIdentity): {
  brandKey: string;
  innKey: string;
  compositeKey: string;
} {
  const normName = removeVietnameseAccents(drug.name || '').toLowerCase();
  const { cleanName, extractedStrength } = extractStrengthFromName(normName);

  const finalStrength = normalizeDrugStrength(drug.strength || extractedStrength || '');

  // 1. Khóa theo Tên biệt dược + Hàm lượng
  const cleanBrand = cleanName
    .replace(/[^a-z0-9]/g, '')
    .trim();
  const brandKey = `${cleanBrand}_${finalStrength}`.replace(/_+$/, '');

  // 2. Khóa theo Tổ hợp Hoạt chất + Hàm lượng
  const normInn = removeVietnameseAccents(drug.activeIngredient || '').toLowerCase();
  const cleanInn = normInn
    .replace(/[^a-z0-9]/g, '')
    .trim();
  const innKey = cleanInn ? `${cleanInn}_${finalStrength}`.replace(/_+$/, '') : '';

  // 3. Khóa tổng hợp
  const compositeKey = innKey ? `${brandKey}__${innKey}` : brandKey;

  return { brandKey, innKey, compositeKey };
}

// Alias số nhiều để tương thích các import cũ nếu có
export const getDrugCanonicalKeys = getDrugCanonicalKey;

/**
 * Kiểm tra xem 2 thuốc có trùng lặp về mặt y khoa hay không
 */
export function isDuplicateDrug(drugA: DrugIdentity, drugB: DrugIdentity): boolean {
  if (!drugA || !drugB) return false;
  const keysA = getDrugCanonicalKey(drugA);
  const keysB = getDrugCanonicalKey(drugB);

  // 1. Trùng tên biệt dược và hàm lượng
  if (keysA.brandKey && keysB.brandKey && keysA.brandKey === keysB.brandKey) {
    return true;
  }

  // 2. Trùng tổ hợp hoạt chất và hàm lượng (nếu cả 2 đều có hoạt chất)
  if (keysA.innKey && keysB.innKey && keysA.innKey === keysB.innKey) {
    return true;
  }

  return false;
}

/**
 * Lọc sạch danh mục thuốc, tự động gộp và loại bỏ các thuốc trùng lặp
 */
export function deduplicateDrugCatalog<T extends DrugIdentity>(
  catalog: T[]
): {
  cleanCatalog: T[];
  removedCount: number;
  duplicateGroups: { original: T; duplicates: T[] }[];
} {
  const cleanCatalog: T[] = [];
  const seenBrandKeys = new Map<string, T>();
  const seenInnKeys = new Map<string, T>();
  const duplicateGroups: { original: T; duplicates: T[] }[] = [];
  let removedCount = 0;

  for (const item of catalog) {
    if (!item || !item.name) continue;

    const { brandKey, innKey } = getDrugCanonicalKey(item);

    const existingByBrand = brandKey ? seenBrandKeys.get(brandKey) : undefined;
    const existingByInn = innKey ? seenInnKeys.get(innKey) : undefined;
    const existing = existingByBrand || existingByInn;

    if (existing) {
      removedCount++;
      const group = duplicateGroups.find((g) => g.original === existing);
      if (group) {
        group.duplicates.push(item);
      } else {
        duplicateGroups.push({ original: existing, duplicates: [item] });
      }

      // Giữ lại bản ghi chi tiết hơn (nếu item mới có activeIngredient mà bản ghi cũ không có)
      if (!existing.activeIngredient && item.activeIngredient) {
        existing.activeIngredient = item.activeIngredient;
      }
      if (!existing.strength && item.strength) {
        existing.strength = item.strength;
      }
      if (!existing.warningNote && item.warningNote) {
        existing.warningNote = item.warningNote;
      }
      if (!existing.defaultInstructions && item.defaultInstructions) {
        existing.defaultInstructions = item.defaultInstructions;
      }
      if (!existing.unitPrice && item.unitPrice) {
        existing.unitPrice = item.unitPrice;
      }
    } else {
      cleanCatalog.push(item);
      if (brandKey) seenBrandKeys.set(brandKey, item);
      if (innKey) seenInnKeys.set(innKey, item);
    }
  }

  return { cleanCatalog, removedCount, duplicateGroups };
}
