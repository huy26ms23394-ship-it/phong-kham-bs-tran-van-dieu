import React, { useState, useMemo } from 'react';
import { MedicationCatalogItem, MealTiming } from '../types/medical';
import {
  Pill,
  Plus,
  X,
  Search,
  Sparkles,
  Download,
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Bot,
  Edit3,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Layers,
  ArrowRight,
  Check,
  FileSpreadsheet,
  Globe,
  ExternalLink,
} from 'lucide-react';

export const getGoogleSearchUrl = (name: string, activeIngredient?: string): string => {
  const query = [name, activeIngredient, 'dược thư chỉ định liều dùng tác dụng'].filter(Boolean).join(' ');
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
};
import { lookupDrugFromPharmacopoeia } from '../utils/clinicalAi';
import { EXPANDED_OUTPATIENT_MEDICATIONS } from '../data/expandedMedications';
import {
  CLINIC_CATEGORIES,
  ClinicCategory,
  auditPharmacyCatalog,
  autoCleanAndDeduplicate,
  detectMisclassifiedDrug,
  exportPharmacyAuditToCsv,
  PharmacyAuditReport,
} from '../utils/pharmacyAudit';

interface PharmacyCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: MedicationCatalogItem[];
  onAddCatalogItem: (item: MedicationCatalogItem) => void;
  onUpdateCatalogItem?: (item: MedicationCatalogItem) => void;
  onDeleteCatalogItem?: (itemId: string) => void;
  onBatchUpdateCatalog?: (items: MedicationCatalogItem[]) => void;
  onOpenCrawlerBot?: () => void;
}

const CATEGORIES = ['Tất cả', ...CLINIC_CATEGORIES];

export const PharmacyCatalogModal: React.FC<PharmacyCatalogModalProps> = ({
  isOpen,
  onClose,
  catalog,
  onAddCatalogItem,
  onUpdateCatalogItem,
  onDeleteCatalogItem,
  onBatchUpdateCatalog,
  onOpenCrawlerBot,
}) => {
  // Navigation View: 'catalog' (Danh mục thuốc) | 'audit' (Báo cáo & Lọc trùng)
  const [activeView, setActiveView] = useState<'catalog' | 'audit'>('catalog');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form State for Adding New Medication
  const [name, setName] = useState('');
  const [activeIngredient, setActiveIngredient] = useState('');
  const [strength, setStrength] = useState('');
  const [form, setForm] = useState('Viên nén');
  const [unit, setUnit] = useState('viên');
  const [category, setCategory] = useState<string>('Tim mạch - Huyết áp');
  const [instructions, setInstructions] = useState('');
  const [warningNote, setWarningNote] = useState('');

  // AI Lookup State for Add Form
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);

  // Edit Medication State
  const [editingItem, setEditingItem] = useState<MedicationCatalogItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editActiveIngredient, setEditActiveIngredient] = useState('');
  const [editStrength, setEditStrength] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editForm, setEditForm] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editMorning, setEditMorning] = useState(1);
  const [editNoon, setEditNoon] = useState(0);
  const [editAfternoon, setEditAfternoon] = useState(0);
  const [editEvening, setEditEvening] = useState(1);
  const [editTiming, setEditTiming] = useState<MealTiming>('sau_an');
  const [editDurationDays, setEditDurationDays] = useState(7);
  const [editInstructions, setEditInstructions] = useState('');
  const [editWarningNote, setEditWarningNote] = useState('');
  const [isEditLookingUp, setIsEditLookingUp] = useState(false);
  const [editLookupMessage, setEditLookupMessage] = useState<string | null>(null);

  // Delete Confirmation State
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<MedicationCatalogItem | null>(null);

  // Audit Filter
  const [auditFilter, setAuditFilter] = useState<'all' | 'duplicates' | 'misclassified' | 'incomplete'>('all');

  // Notification Toast Message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

  // Run Real-time Audit on Catalog
  const auditReport: PharmacyAuditReport = useMemo(() => {
    return auditPharmacyCatalog(catalog);
  }, [catalog]);

  const totalAuditIssues =
    auditReport.duplicateGroups.length +
    auditReport.misclassifiedAlerts.length +
    auditReport.incompleteAlerts.length;

  if (!isOpen) return null;

  // Filter Catalog
  const filtered = catalog.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.activeIngredient &&
        item.activeIngredient.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'Tất cả' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Open Edit Dialog for a drug
  const handleOpenEdit = (item: MedicationCatalogItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditActiveIngredient(item.activeIngredient || '');
    setEditStrength(item.strength || '');
    setEditCategory(item.category || 'Tim mạch - Huyết áp');
    setEditForm(item.form || 'Viên nén');
    setEditUnit(item.unit || 'viên');
    setEditMorning(item.defaultDosage?.morning ?? 1);
    setEditNoon(item.defaultDosage?.noon ?? 0);
    setEditAfternoon(item.defaultDosage?.afternoon ?? 0);
    setEditEvening(item.defaultDosage?.evening ?? 1);
    setEditTiming((item.defaultDosage?.timing as MealTiming) || 'sau_an');
    setEditDurationDays(item.defaultDurationDays || 7);
    setEditInstructions(item.defaultInstructions || '');
    setEditWarningNote(item.warningNote || '');
    setEditLookupMessage(null);
  };

  // Save Edit Item
  const handleSaveEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editName.trim()) return;

    const updatedItem: MedicationCatalogItem = {
      ...editingItem,
      name: editName.trim(),
      activeIngredient: editActiveIngredient.trim(),
      strength: editStrength.trim() || 'Chuẩn',
      category: editCategory.trim(),
      form: editForm,
      unit: editUnit.trim(),
      defaultDosage: {
        morning: Number(editMorning) || 0,
        noon: Number(editNoon) || 0,
        afternoon: Number(editAfternoon) || 0,
        evening: Number(editEvening) || 0,
        timing: editTiming,
      },
      defaultDurationDays: Number(editDurationDays) || 7,
      defaultInstructions: editInstructions.trim(),
      warningNote: editWarningNote.trim(),
    };

    if (onUpdateCatalogItem) {
      onUpdateCatalogItem(updatedItem);
    } else if (onBatchUpdateCatalog) {
      onBatchUpdateCatalog(
        catalog.map((it) => (it.id === updatedItem.id ? updatedItem : it))
      );
    }

    setEditingItem(null);
    showToast(`Đã cập nhật thành công thông tin thuốc "${updatedItem.name}"!`);
  };

  // AI Lookup in Edit Dialog
  const handleAiLookupInEdit = async () => {
    if (!editName.trim()) {
      setEditLookupMessage('Vui lòng nhập tên thuốc cần tra cứu.');
      return;
    }

    setIsEditLookingUp(true);
    setEditLookupMessage(null);

    try {
      const result = await lookupDrugFromPharmacopoeia(editName.trim());
      if (result.data) {
        if (result.data.name) setEditName(result.data.name);
        if (result.data.activeIngredient) setEditActiveIngredient(result.data.activeIngredient);
        if (result.data.strength) setEditStrength(result.data.strength);
        if (result.data.form) setEditForm(result.data.form);
        if (result.data.unit) setEditUnit(result.data.unit);
        if (result.data.category) setEditCategory(result.data.category);
        if (result.data.defaultInstructions) setEditInstructions(result.data.defaultInstructions);
        if (result.data.warningNote) setEditWarningNote(result.data.warningNote);

        setEditLookupMessage(
          result.source === 'gemini_pharmacopoeia'
            ? '✓ Đã đồng bộ chuẩn Dược Thư Quốc Gia Việt Nam & Gemini AI!'
            : '✓ Đã tìm thấy trong CSDL Dược Ngoại Trú Chuẩn!'
        );
      } else {
        setEditLookupMessage('ℹ️ Không tìm thấy thuốc trong CSDL mẫu, Bác sĩ hãy điều chỉnh thủ công.');
      }
    } catch {
      setEditLookupMessage('Lỗi tra cứu, vui lòng chỉnh sửa thông tin thủ công.');
    } finally {
      setIsEditLookingUp(false);
    }
  };

  // AI / Pharmacopoeia Auto-Fill Lookup for Add Form
  const handleAiLookupDrug = async () => {
    if (!name.trim()) {
      setLookupMessage('Vui lòng nhập tên thuốc cần tra cứu.');
      return;
    }

    setIsLookingUp(true);
    setLookupMessage(null);

    try {
      const result = await lookupDrugFromPharmacopoeia(name.trim());
      if (result.data) {
        if (result.data.name) setName(result.data.name);
        if (result.data.activeIngredient) setActiveIngredient(result.data.activeIngredient);
        if (result.data.strength) setStrength(result.data.strength);
        if (result.data.form) setForm(result.data.form);
        if (result.data.unit) setUnit(result.data.unit);
        if (result.data.category) setCategory(result.data.category);
        if (result.data.defaultInstructions) setInstructions(result.data.defaultInstructions);
        if (result.data.warningNote) setWarningNote(result.data.warningNote);

        setLookupMessage(
          result.source === 'gemini_pharmacopoeia'
            ? '✓ Đã tự động điền từ Dược Thư Quốc Gia Việt Nam & Gemini AI!'
            : '✓ Đã tìm thấy trong CSDL Dược Ngoại Trú Chuẩn!'
        );
      } else {
        setLookupMessage('ℹ️ Không tìm thấy thuốc trong CSDL mẫu, Bác sĩ hãy nhập thủ công các trường bên dưới.');
      }
    } catch {
      setLookupMessage('Lỗi tra cứu, vui lòng nhập thông tin thuốc thủ công.');
    } finally {
      setIsLookingUp(false);
    }
  };

  // Delete Item
  const handleConfirmDelete = () => {
    if (!deleteConfirmItem) return;
    const deletedName = deleteConfirmItem.name;

    if (onDeleteCatalogItem) {
      onDeleteCatalogItem(deleteConfirmItem.id);
    } else if (onBatchUpdateCatalog) {
      onBatchUpdateCatalog(catalog.filter((it) => it.id !== deleteConfirmItem.id));
    }

    setDeleteConfirmItem(null);
    showToast(`Đã xóa thuốc "${deletedName}" khỏi kho thuốc phòng khám.`);
  };

  // Quick Fix Category for a Drug
  const handleQuickFixCategory = (item: MedicationCatalogItem, targetCategory: string) => {
    const updated = { ...item, category: targetCategory };
    if (onUpdateCatalogItem) {
      onUpdateCatalogItem(updated);
    } else if (onBatchUpdateCatalog) {
      onBatchUpdateCatalog(catalog.map((it) => (it.id === item.id ? updated : it)));
    }
    showToast(`Đã đổi nhóm thuốc "${item.name}" sang [${targetCategory}] thành công!`);
  };

  // Merge Duplicate Group
  const handleMergeDuplicateGroup = (primaryId: string, groupItems: MedicationCatalogItem[]) => {
    const primary = groupItems.find((it) => it.id === primaryId);
    if (!primary) return;

    // Remove all others from catalog except primary
    const otherIds = new Set(groupItems.filter((it) => it.id !== primaryId).map((it) => it.id));
    const newCatalog = catalog.filter((it) => !otherIds.has(it.id));

    if (onBatchUpdateCatalog) {
      onBatchUpdateCatalog(newCatalog);
    } else {
      otherIds.forEach((id) => onDeleteCatalogItem?.(id));
    }

    showToast(`Đã gộp thành công ${groupItems.length} bản ghi, giữ lại bản ghi chuẩn "${primary.name}"!`);
  };

  // Auto Clean & Deduplicate All
  const handleAutoCleanAll = () => {
    if (
      !confirm(
        `Thao tác này sẽ tự động:\n1. Gộp tất cả các thuốc trùng tên / trùng hoạt chất (giữ lại bản ghi đầy đủ nhất).\n2. Chuẩn hóa nhóm dược lý cho các thuốc bị gán sai nhóm do AI hoặc bot cào.\n\nBạn có chắc chắn muốn thực hiện?`
      )
    ) {
      return;
    }

    const { cleanedCatalog, removedDuplicatesCount, fixedCategoriesCount } =
      autoCleanAndDeduplicate(catalog, true);

    if (onBatchUpdateCatalog) {
      onBatchUpdateCatalog(cleanedCatalog);
    }

    showToast(
      `✓ Đã dọn dẹp sạch kho: Đã xóa ${removedDuplicatesCount} bản sao trùng lặp và chuẩn hóa ${fixedCategoriesCount} thuốc đúng nhóm dược lý!`
    );
  };

  // Fix All Misclassified Drugs Only
  const handleFixAllMisclassified = () => {
    if (
      !confirm(
        `Xác nhận tự động chuyển toàn bộ ${auditReport.misclassifiedAlerts.length} thuốc đang bị gán sai nhóm (do AI/cào) sang đúng nhóm dược lý chuẩn?`
      )
    ) {
      return;
    }

    const alertMap = new Map<string, string>();
    auditReport.misclassifiedAlerts.forEach((al) => {
      alertMap.set(al.item.id, al.suggestedCategory);
    });

    const updatedCatalog = catalog.map((item) => {
      if (alertMap.has(item.id)) {
        return { ...item, category: alertMap.get(item.id)! };
      }
      return item;
    });

    if (onBatchUpdateCatalog) {
      onBatchUpdateCatalog(updatedCatalog);
    }

    showToast(`✓ Đã chuẩn hóa thành công ${auditReport.misclassifiedAlerts.length} thuốc đúng nhóm dược lý!`);
  };

  // Load 44+ essential outpatient drugs
  const handleLoadFullOutpatientPack = () => {
    if (
      !confirm(
        `Thao tác này sẽ nạp bộ 44+ thuốc thông dụng nhất của Dược Thư Quốc Gia Việt Nam vào kho thuốc phòng khám. Các thuốc trùng tên sẽ được cập nhật. Bạn có chắc chắn muốn nạp?`
      )
    ) {
      return;
    }

    const mergedMap = new Map<string, MedicationCatalogItem>();
    catalog.forEach((item) => mergedMap.set(item.name.toLowerCase(), item));
    EXPANDED_OUTPATIENT_MEDICATIONS.forEach((item) =>
      mergedMap.set(item.name.toLowerCase(), item)
    );

    const mergedList = Array.from(mergedMap.values());
    if (onBatchUpdateCatalog) {
      onBatchUpdateCatalog(mergedList);
    } else {
      EXPANDED_OUTPATIENT_MEDICATIONS.forEach((item) => onAddCatalogItem(item));
    }
    showToast(`Đã nạp thành công bộ CSDL Dược phòng khám với tổng số ${mergedList.length} thuốc!`);
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Tên thuốc',
      'Hoạt chất',
      'Hàm lượng',
      'Dạng',
      'Đơn vị',
      'Nhóm',
      'Cách dùng',
      'Lưu ý',
    ];
    const rows = catalog.map((item) => [
      `"${item.name.replace(/"/g, '""')}"`,
      `"${(item.activeIngredient || '').replace(/"/g, '""')}"`,
      `"${item.strength.replace(/"/g, '""')}"`,
      `"${item.form.replace(/"/g, '""')}"`,
      `"${item.unit.replace(/"/g, '""')}"`,
      `"${item.category.replace(/"/g, '""')}"`,
      `"${item.defaultInstructions.replace(/"/g, '""')}"`,
      `"${(item.warningNote || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Kho_Thuoc_BS_Tran_Van_Dieu_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save new drug
  const handleSaveNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newItem: MedicationCatalogItem = {
      id: `cat-${Date.now()}`,
      name: name.trim(),
      activeIngredient: activeIngredient.trim(),
      strength: strength.trim() || 'Chuẩn',
      form,
      unit,
      category,
      defaultDosage: {
        morning: 1,
        noon: 0,
        afternoon: 0,
        evening: 1,
        timing: 'sau_an',
      },
      defaultDurationDays: 7,
      defaultInstructions:
        instructions.trim() || 'Uống sáng 1 viên, tối 1 viên sau khi ăn',
      warningNote: warningNote.trim(),
    };

    onAddCatalogItem(newItem);
    setIsAddingNew(false);
    setName('');
    setActiveIngredient('');
    setStrength('');
    setInstructions('');
    setWarningNote('');
    setLookupMessage(null);
    showToast(`Đã thêm thuốc mới "${newItem.name}" vào kho phòng khám!`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-md max-w-5xl w-full shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden my-6 transition-colors flex flex-col max-h-[92vh]">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md transition-all">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-200" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white/80 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-md bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
              <Database className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold">
                  Kho Thuốc &amp; Quản Lý CSDL Dược Phòng Khám
                </h2>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/30 text-emerald-200 text-xs font-mono font-bold border border-emerald-400/40">
                  {catalog.length} thuốc
                </span>
                {totalAuditIssues > 0 && (
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-500/30 text-amber-200 text-xs font-bold border border-amber-400/40 flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-amber-300" />
                    <span>{totalAuditIssues} cảnh báo cần rà soát</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-100">
                Cho phép thêm, sửa trực tiếp, kiểm tra trùng lặp &amp; đối soát phân loại AI/Dược Thư Quốc Gia cho BS. Trần Văn Diệu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 px-4 sm:px-6 py-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveView('catalog')}
              className={`min-h-[40px] px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeView === 'catalog'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800'
              }`}
            >
              <Pill className="w-4 h-4" />
              <span>Danh Mục Kho Thuốc ({catalog.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('audit')}
              className={`min-h-[40px] px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-all cursor-pointer relative ${
                activeView === 'audit'
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800'
              }`}
            >
              {totalAuditIssues > 0 ? (
                <ShieldAlert className="w-4 h-4 text-amber-400" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              )}
              <span>Báo Cáo Kiểm Tra &amp; Lọc Trùng</span>
              {totalAuditIssues > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-rose-600 text-white">
                  {totalAuditIssues}
                </span>
              )}
            </button>
          </div>

          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:flex items-center gap-2">
            <span>Chất lượng CSDL:</span>
            <span
              className={`px-2 py-0.5 rounded font-mono font-bold ${
                auditReport.qualityScore >= 90
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : auditReport.qualityScore >= 70
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                  : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
              }`}
            >
              {auditReport.qualityScore}% (
              {auditReport.healthStatus === 'excellent'
                ? 'Xuất sắc'
                : auditReport.healthStatus === 'good'
                ? 'Tốt'
                : auditReport.healthStatus === 'warning'
                ? 'Có cảnh báo'
                : 'Cần rà soát'}
              )
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* ================= VIEW 1: CATALOG VIEW ================= */}
          {activeView === 'catalog' && (
            <>
              {/* Quick Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-md border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleLoadFullOutpatientPack}
                    type="button"
                    className="min-h-[40px] px-3.5 py-2 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white rounded-md text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors border border-emerald-700 cursor-pointer"
                    title="Nạp ngay 44+ thuốc thông dụng chuẩn Dược Thư Việt Nam"
                  >
                    <Database className="w-4 h-4 text-emerald-200" />
                    <span>Nạp Bộ 44+ Thuốc Chuẩn</span>
                  </button>

                  <button
                    onClick={handleExportCsv}
                    type="button"
                    className="min-h-[40px] px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Xuất danh mục thuốc ra file Excel/CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Xuất CSV</span>
                  </button>

                  <button
                    onClick={() => setActiveView('audit')}
                    type="button"
                    className={`min-h-[40px] px-3.5 py-2 border rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      totalAuditIssues > 0
                        ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                        : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                    }`}
                    title="Mở Báo cáo kiểm tra chất lượng kho và lọc trùng"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Kiểm Tra Trùng &amp; Báo Cáo</span>
                    {totalAuditIssues > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold">
                        {totalAuditIssues}
                      </span>
                    )}
                  </button>

                  {onOpenCrawlerBot && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenCrawlerBot();
                      }}
                      type="button"
                      className="min-h-[40px] px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Mở Bot tự động cào thuốc mới & duyệt nhập kho"
                    >
                      <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Bot Cào Thuốc Mới</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    setIsAddingNew(!isAddingNew);
                    setLookupMessage(null);
                  }}
                  className="min-h-[40px] px-4 py-2 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-md text-xs font-bold flex items-center gap-1.5 shadow-xs shrink-0 transition-colors border border-emerald-700 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAddingNew ? 'Đóng Form' : '+ Thêm Thuốc Mới Vào Kho'}</span>
                </button>
              </div>

              {/* Add form with AI / Pharmacopoeia Auto-Fill */}
              {isAddingNew && (
                <form
                  onSubmit={handleSaveNewItem}
                  className="p-5 rounded-md border-2 border-emerald-500/80 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 space-y-4 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-sm uppercase text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                        Thêm thuốc vào danh mục phòng khám
                      </h4>
                      <p className="text-xs text-emerald-800 dark:text-emerald-300">
                        Nhập tên thuốc rồi bấm <strong>&quot;Tra cứu tự động&quot;</strong> để AI điền toàn bộ hoạt chất, hàm lượng, cách dùng.
                      </p>
                    </div>
                  </div>

                  {/* Drug Name with AI Auto-fill Button */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 text-xs">
                        Tên biệt dược hoặc hoạt chất *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="VD: Glucophage, Coversyl, Ventolin, Medrol, Klacid..."
                        className="w-full min-h-[44px] px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <button
                        type="button"
                        onClick={handleAiLookupDrug}
                        disabled={isLookingUp}
                        className="w-full sm:w-auto min-h-[44px] px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-md text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 border border-emerald-700 cursor-pointer"
                      >
                        {isLookingUp ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Đang tra cứu Dược Thư...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-amber-200" />
                            <span>Tra Cứu Tự Động (AI / Dược Thư)</span>
                          </>
                        )}
                      </button>

                      {name.trim() && (
                        <a
                          href={getGoogleSearchUrl(name, activeIngredient)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[44px] px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          title={`Tìm kiếm nhanh "${name}" trên Google`}
                        >
                          <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <span>Google</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      )}
                    </div>
                  </div>

                  {lookupMessage && (
                    <div
                      className={`text-xs p-2.5 rounded-md flex items-center gap-2 ${
                        lookupMessage.includes('✓')
                          ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-semibold border border-emerald-300 dark:border-emerald-700'
                          : 'bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                      }`}
                    >
                      {lookupMessage.includes('✓') ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      )}
                      <span>{lookupMessage}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Hoạt chất chính (INN)
                      </label>
                      <input
                        type="text"
                        value={activeIngredient}
                        onChange={(e) => setActiveIngredient(e.target.value)}
                        placeholder="VD: Metformin HCl"
                        className="w-full min-h-[40px] px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Hàm lượng
                      </label>
                      <input
                        type="text"
                        value={strength}
                        onChange={(e) => setStrength(e.target.value)}
                        placeholder="VD: 500mg, 5mg, 1g..."
                        className="w-full min-h-[40px] px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Nhóm dược lý
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full min-h-[40px] px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                      >
                        {CLINIC_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat} className="dark:bg-slate-900">
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Dạng bào chế
                      </label>
                      <select
                        value={form}
                        onChange={(e) => setForm(e.target.value)}
                        className="w-full min-h-[40px] px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      >
                        <option value="Viên nén">Viên nén</option>
                        <option value="Viên nén bao phim">Viên nén bao phim</option>
                        <option value="Viên nang">Viên nang</option>
                        <option value="Viên nang mềm">Viên nang mềm</option>
                        <option value="Viên sủi">Viên sủi</option>
                        <option value="Gói hỗn dịch">Gói hỗn dịch</option>
                        <option value="Gói bột pha">Gói bột pha</option>
                        <option value="Chai siro">Chai siro</option>
                        <option value="Ống uống">Ống uống</option>
                        <option value="Bình xịt định liều">Bình xịt định liều</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Đơn vị tính
                      </label>
                      <input
                        type="text"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        placeholder="viên, gói, chai, ống..."
                        className="w-full min-h-[40px] px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Lưu ý an toàn / Cảnh báo
                      </label>
                      <input
                        type="text"
                        value={warningNote}
                        onChange={(e) => setWarningNote(e.target.value)}
                        placeholder="VD: Không dùng cho người suy thận nặng..."
                        className="w-full min-h-[40px] px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-xs">
                      Hướng dẫn sử dụng mặc định khi kê đơn
                    </label>
                    <input
                      type="text"
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="VD: Uống 1 viên sau ăn sáng mỗi ngày vào giờ cố định..."
                      className="w-full min-h-[40px] px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingNew(false)}
                      className="min-h-[40px] px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="min-h-[40px] px-5 py-2 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-md text-xs font-bold shadow-xs transition-colors border border-emerald-700 cursor-pointer"
                    >
                      Lưu Thuốc Vào Kho
                    </button>
                  </div>
                </form>
              )}

              {/* Search & Category Filter */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm thuốc nhanh theo tên biệt dược, hoạt chất (VD: Amlor, Metformin, Kháng sinh...)..."
                    className="w-full min-h-[44px] pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-emerald-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-md absolute right-2 top-2.5 border border-slate-300 dark:border-slate-600 cursor-pointer"
                    >
                      Xóa
                    </button>
                  )}
                </div>

                {/* Category chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs custom-scrollbar">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`min-h-[36px] px-3 py-1.5 rounded-md whitespace-nowrap font-medium transition-colors border cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-emerald-800 dark:bg-emerald-700 text-white font-bold border-emerald-800 dark:border-emerald-600 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200/80 dark:border-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Catalog list */}
              {filtered.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/60 rounded-md border border-dashed border-slate-300 dark:border-slate-700">
                  <Pill className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    Không tìm thấy thuốc nào khớp với bộ lọc &quot;{searchTerm}&quot;.
                  </p>
                  <button
                    onClick={handleLoadFullOutpatientPack}
                    className="min-h-[40px] mt-3 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-md text-xs font-bold border border-emerald-700 cursor-pointer"
                  >
                    Nạp CSDL 44+ Thuốc Chuẩn Dược Thư
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filtered.map((item) => {
                    const misclass = detectMisclassifiedDrug(item);
                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-md border bg-white dark:bg-slate-900 shadow-2xs transition-colors space-y-2 text-xs relative flex flex-col justify-between ${
                          misclass
                            ? 'border-amber-400/80 dark:border-amber-500/80 bg-amber-50/10'
                            : 'border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/80 dark:hover:border-emerald-500'
                        }`}
                      >
                        <div className="space-y-1.5">
                          {/* Misclassification Warning Banner */}
                          {misclass && (
                            <div className="bg-amber-100/80 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 p-2 rounded text-[11px] flex items-center justify-between gap-2">
                              <div className="flex items-start gap-1.5 min-w-0">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div className="truncate">
                                  <span className="font-bold text-amber-900 dark:text-amber-200">
                                    Nghi vấn gán sai nhóm:
                                  </span>{' '}
                                  <span className="text-amber-800 dark:text-amber-300">
                                    Nên là [{misclass.suggestedCategory}]
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleQuickFixCategory(item, misclass.suggestedCategory)}
                                className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
                                title="Chuyển ngay sang nhóm đúng"
                              >
                                Đổi sang {misclass.suggestedCategory}
                              </button>
                            </div>
                          )}

                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                                  {item.name}
                                </h4>
                                <a
                                  href={getGoogleSearchUrl(item.name, item.activeIngredient)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline bg-indigo-50/70 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-200/80 dark:border-indigo-800/80 cursor-pointer"
                                  title={`Tra cứu nhanh "${item.name}" trên Google (Tab mới)`}
                                >
                                  <Globe className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                  <span>Google</span>
                                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                                </a>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                {item.activeIngredient ? `Hoạt chất: ${item.activeIngredient}` : ''}{' '}
                                {item.strength ? `• ${item.strength}` : ''}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-md font-semibold text-[10px] shrink-0 border ${
                                misclass
                                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800 line-through'
                                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              }`}
                            >
                              {item.category}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 flex-wrap">
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              Dạng: {item.form}
                            </span>
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              Đơn vị: {item.unit}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded-md font-mono font-bold border ${
                                typeof item.stockQuantity === 'number' && item.stockQuantity < 30
                                  ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 animate-pulse'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                              }`}
                              title={typeof item.stockQuantity === 'number' && item.stockQuantity < 30 ? 'Cảnh báo: Tồn kho dưới mức an toàn!' : 'Số lượng khả dụng'}
                            >
                              Kho: {typeof item.stockQuantity === 'number' ? item.stockQuantity : 100} {item.unit}
                            </span>
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                              HSD: {item.expiryDate || '12/2027'}
                            </span>
                            {typeof item.unitPrice === 'number' && item.unitPrice > 0 && (
                              <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/50 rounded-md text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono font-bold">
                                {item.unitPrice.toLocaleString('vi-VN')} đ
                              </span>
                            )}
                            {item.defaultDosage && (
                              <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-md text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                Liều: S:{item.defaultDosage.morning} T:{item.defaultDosage.noon} C:{item.defaultDosage.afternoon} Tối:{item.defaultDosage.evening}
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-emerald-900 dark:text-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/40 p-2 rounded-md font-medium border border-emerald-200 dark:border-emerald-700/60">
                            Hướng dẫn: {item.defaultInstructions || 'Chưa thiết lập cách dùng mặc định'}
                          </div>

                          {item.warningNote && (
                            <div className="text-[10px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-md border border-amber-300 dark:border-amber-800/40">
                              Lưu ý: {item.warningNote}
                            </div>
                          )}
                        </div>

                        {/* Card Actions: Google, Sửa & Xóa thuốc */}
                        <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                          <a
                            href={getGoogleSearchUrl(item.name, item.activeIngredient)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-h-[32px] px-2.5 py-1 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-slate-200 dark:border-slate-700 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title={`Mở Google tra cứu "${item.name}" trong tab mới`}
                          >
                            <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span>Google</span>
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </a>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="min-h-[32px] px-2.5 py-1 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-slate-200 dark:border-slate-700 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Chỉnh sửa thông tin thuốc"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Sửa</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmItem(item)}
                            className="min-h-[32px] px-2.5 py-1 text-rose-600 dark:text-rose-400 hover:text-white bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 dark:hover:bg-rose-700 border border-rose-200 dark:border-rose-900/60 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Xóa thuốc khỏi kho"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xóa</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ================= VIEW 2: AUDIT & DEDUPLICATION REPORT ================= */}
          {activeView === 'audit' && (
            <div className="space-y-4">
              {/* Report Header Card */}
              <div className="p-4 rounded-md border border-indigo-200 dark:border-indigo-800/80 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      Báo Cáo Kiểm Tra &amp; Lọc Trùng Kho Thuốc
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Tự động đối soát tên thuốc, hoạt chất, hàm lượng và kiểm tra sai sót phân loại do bot cào hoặc AI
                    </p>
                  </div>

                  {/* Actions on Audit */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleAutoCleanAll}
                      className="min-h-[38px] px-3.5 py-1.5 bg-gradient-to-r from-emerald-700 to-indigo-700 hover:from-emerald-800 hover:to-indigo-800 text-white rounded-md text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      title="Tự động gộp tất cả các thuốc trùng lặp và chuẩn hóa nhóm đúng"
                    >
                      <Sparkles className="w-4 h-4 text-amber-200" />
                      <span>Tự Động Gộp &amp; Làm Sạch Toàn Bộ</span>
                    </button>

                    {auditReport.misclassifiedAlerts.length > 0 && (
                      <button
                        type="button"
                        onClick={handleFixAllMisclassified}
                        className="min-h-[38px] px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        title="Chuẩn hóa toàn bộ các thuốc bị gán sai nhóm"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Sửa {auditReport.misclassifiedAlerts.length} Thuốc Sai Nhóm</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => exportPharmacyAuditToCsv(auditReport)}
                      className="min-h-[38px] px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Xuất báo cáo kiểm tra chi tiết ra file CSV"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-slate-500" />
                      <span>Xuất Báo Cáo CSV</span>
                    </button>
                  </div>
                </div>

                {/* Scorecards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                  <div className="bg-white dark:bg-slate-800/90 p-3 rounded-md border border-slate-200/80 dark:border-slate-700">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">
                      Tổng số thuốc trong kho
                    </span>
                    <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                      {auditReport.totalDrugs}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-800/90 p-3 rounded-md border border-slate-200/80 dark:border-slate-700">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">
                      Thuốc trùng lặp phát hiện
                    </span>
                    <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                      {auditReport.duplicateGroups.length}{' '}
                      <span className="text-xs font-normal text-slate-500">
                        nhóm ({auditReport.totalDuplicateItems} bản ghi)
                      </span>
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-800/90 p-3 rounded-md border border-slate-200/80 dark:border-slate-700">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">
                      Nghi ngờ gán sai nhóm
                    </span>
                    <span className="text-xl font-black text-rose-600 dark:text-rose-400">
                      {auditReport.misclassifiedAlerts.length}{' '}
                      <span className="text-xs font-normal text-slate-500">thuốc</span>
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-800/90 p-3 rounded-md border border-slate-200/80 dark:border-slate-700">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">
                      Điểm chất lượng CSDL
                    </span>
                    <span
                      className={`text-xl font-black ${
                        auditReport.qualityScore >= 90
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : auditReport.qualityScore >= 70
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {auditReport.qualityScore}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub-filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setAuditFilter('all')}
                  className={`min-h-[34px] px-3 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                    auditFilter === 'all'
                      ? 'bg-slate-800 text-white dark:bg-slate-700'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Tất cả vấn đề ({totalAuditIssues})
                </button>

                <button
                  type="button"
                  onClick={() => setAuditFilter('duplicates')}
                  className={`min-h-[34px] px-3 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                    auditFilter === 'duplicates'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Thuốc trùng lặp ({auditReport.duplicateGroups.length})
                </button>

                <button
                  type="button"
                  onClick={() => setAuditFilter('misclassified')}
                  className={`min-h-[34px] px-3 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                    auditFilter === 'misclassified'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Sai nhóm dược lý ({auditReport.misclassifiedAlerts.length})
                </button>

                <button
                  type="button"
                  onClick={() => setAuditFilter('incomplete')}
                  className={`min-h-[34px] px-3 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                    auditFilter === 'incomplete'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Thiếu thông tin ({auditReport.incompleteAlerts.length})
                </button>
              </div>

              {/* All Cleaned State */}
              {totalAuditIssues === 0 && (
                <div className="p-8 text-center bg-emerald-50 dark:bg-emerald-950/30 rounded-md border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto" />
                  <h4 className="text-base font-extrabold text-emerald-900 dark:text-emerald-200">
                    Kho Thuốc Đạt Chuẩn Xuất Sắc!
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-md mx-auto">
                    Không phát hiện thuốc trùng lặp nào. Toàn bộ các thuốc đều được phân loại đúng nhóm dược lý và đầy đủ hoạt chất, hàm lượng.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveView('catalog')}
                    className="mt-3 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-bold cursor-pointer"
                  >
                    Quay Lại Xem Danh Mục Kho
                  </button>
                </div>
              )}

              {/* SECTION 1: DUPLICATES */}
              {(auditFilter === 'all' || auditFilter === 'duplicates') &&
                auditReport.duplicateGroups.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        Danh Sách Thuốc Trùng Lặp Cần Xử Lý ({auditReport.duplicateGroups.length} nhóm)
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        Chọn bản ghi chuẩn để giữ lại, các bản sao thừa sẽ được dọn sạch
                      </span>
                    </div>

                    <div className="space-y-3">
                      {auditReport.duplicateGroups.map((group, groupIdx) => (
                        <div
                          key={group.key}
                          className="p-3.5 rounded-md border border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/20 space-y-3"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div>
                              <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                                Nhóm {groupIdx + 1}: {group.title}
                              </span>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                {group.reason}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleMergeDuplicateGroup(group.suggestedPrimaryId, group.items)
                              }
                              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Giữ bản ghi đầy đủ nhất và tự động xóa các bản ghi trùng lặp thừa"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Gộp Nhóm Này (Giữ Bản Ghi Chuẩn)</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {group.items.map((item) => {
                              const isSuggested = item.id === group.suggestedPrimaryId;
                              return (
                                <div
                                  key={item.id}
                                  className={`p-3 rounded border text-xs space-y-1.5 ${
                                    isSuggested
                                      ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700'
                                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <h5 className="font-extrabold text-slate-900 dark:text-slate-100">
                                          {item.name}
                                        </h5>
                                        {isSuggested && (
                                          <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white font-bold text-[10px]">
                                            ★ Đề xuất giữ lại
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-slate-500 font-mono">
                                        {item.activeIngredient || 'Chưa có hoạt chất'} • {item.strength}
                                      </p>
                                    </div>
                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                                      {item.category}
                                    </span>
                                  </div>

                                  <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                                    HD: {item.defaultInstructions || 'Chưa có'}
                                  </p>

                                  <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-700">
                                    <a
                                      href={getGoogleSearchUrl(item.name, item.activeIngredient)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2 py-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                                      title="Tra cứu Google để kiểm tra thuốc này"
                                    >
                                      <Globe className="w-3 h-3" />
                                      <span>Google</span>
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEdit(item)}
                                      className="px-2 py-1 text-slate-600 hover:text-emerald-700 rounded text-[11px] font-semibold cursor-pointer"
                                    >
                                      Sửa
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeleteConfirmItem(item)}
                                      className="px-2 py-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded text-[11px] font-semibold cursor-pointer"
                                    >
                                      Xóa bản này
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* SECTION 2: MISCLASSIFIED DRUGS */}
              {(auditFilter === 'all' || auditFilter === 'misclassified') &&
                auditReport.misclassifiedAlerts.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        Danh Sách Thuốc Nghi Ngờ Gán Sai Nhóm Do AI / Cào ({auditReport.misclassifiedAlerts.length})
                      </h4>
                      <button
                        type="button"
                        onClick={handleFixAllMisclassified}
                        className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
                      >
                        Sửa toàn bộ ({auditReport.misclassifiedAlerts.length} thuốc)
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {auditReport.misclassifiedAlerts.map((alert) => (
                        <div
                          key={alert.item.id}
                          className="p-3.5 rounded-md border border-rose-300 dark:border-rose-800 bg-rose-50/20 dark:bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-slate-900 dark:text-slate-100 text-sm">
                                {alert.item.name}
                              </span>
                              <span className="text-slate-500 font-mono text-[11px]">
                                ({alert.item.activeIngredient || 'Không rõ INN'} • {alert.item.strength})
                              </span>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap text-xs">
                              <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold line-through">
                                Nhóm hiện tại: {alert.currentCategory}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black">
                                Đề xuất đúng: {alert.suggestedCategory}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-600 dark:text-slate-400">
                              Lý do: {alert.reason}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <a
                              href={getGoogleSearchUrl(alert.item.name, alert.item.activeIngredient)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded text-xs font-semibold flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                              title={`Tra cứu Google để kiểm tra chỉ định dược lý của "${alert.item.name}"`}
                            >
                              <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                              <span>Google</span>
                              <ExternalLink className="w-3 h-3 opacity-60" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleQuickFixCategory(alert.item, alert.suggestedCategory)}
                              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold transition-colors cursor-pointer"
                            >
                              Đổi sang [{alert.suggestedCategory}] ngay
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(alert.item)}
                              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-semibold cursor-pointer"
                            >
                              Sửa chi tiết
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* SECTION 3: INCOMPLETE DATA */}
              {(auditFilter === 'all' || auditFilter === 'incomplete') &&
                auditReport.incompleteAlerts.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Thuốc Thiếu Dữ Liệu Cần Bổ Sung ({auditReport.incompleteAlerts.length})
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {auditReport.incompleteAlerts.map(({ item, missingFields }) => (
                        <div
                          key={item.id}
                          className="p-3 rounded border border-indigo-200 dark:border-indigo-800/60 bg-white dark:bg-slate-800/80 flex items-center justify-between gap-2"
                        >
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {item.name}
                            </span>
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                              Thiếu: {missingFields.join(', ')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded font-bold text-[11px] cursor-pointer"
                          >
                            Bổ sung
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* ================= EDIT MEDICATION MODAL ================= */}
      {editingItem && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-md max-w-2xl w-full shadow-2xl border border-slate-300 dark:border-slate-700 overflow-hidden my-6">
            <div className="bg-gradient-to-r from-emerald-800 to-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-300" />
                <div>
                  <h3 className="font-bold text-base">Chỉnh Sửa Thông Tin Thuốc</h3>
                  <p className="text-[11px] text-emerald-100">
                    Cập nhật chuẩn Dược Thư hoặc chỉnh sửa trực tiếp thông tin kho
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditItem} className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto custom-scrollbar text-xs">
              {/* Drug Name with AI Auto-fill Button */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Tên thuốc / Biệt dược *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full min-h-[40px] px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="flex items-end gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleAiLookupInEdit}
                    disabled={isEditLookingUp}
                    className="w-full sm:w-auto min-h-[40px] px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-md font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {isEditLookingUp ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-amber-200" />
                    )}
                    <span>AI / Dược Thư Tra Cứu</span>
                  </button>

                  <a
                    href={getGoogleSearchUrl(editName, editActiveIngredient)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto min-h-[40px] px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md font-bold flex items-center justify-center gap-1.5 border border-slate-300 dark:border-slate-700 cursor-pointer"
                    title={`Mở tìm kiếm Google về "${editName}" trong tab mới`}
                  >
                    <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Tra Google</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                </div>
              </div>

              {editLookupMessage && (
                <div
                  className={`p-2 rounded text-xs flex items-center gap-1.5 ${
                    editLookupMessage.includes('✓')
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{editLookupMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Hoạt chất chính (INN)
                  </label>
                  <input
                    type="text"
                    value={editActiveIngredient}
                    onChange={(e) => setEditActiveIngredient(e.target.value)}
                    placeholder="VD: Amlodipine, Paracetamol..."
                    className="w-full min-h-[38px] px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Hàm lượng
                  </label>
                  <input
                    type="text"
                    value={editStrength}
                    onChange={(e) => setEditStrength(e.target.value)}
                    placeholder="VD: 5mg, 500mg..."
                    className="w-full min-h-[38px] px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Nhóm dược lý
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full min-h-[38px] px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                  >
                    {CLINIC_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Dạng bào chế
                  </label>
                  <input
                    type="text"
                    value={editForm}
                    onChange={(e) => setEditForm(e.target.value)}
                    placeholder="Viên nén, viên nang..."
                    className="w-full min-h-[38px] px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Đơn vị tính
                  </label>
                  <input
                    type="text"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    placeholder="viên, gói, chai..."
                    className="w-full min-h-[38px] px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Số ngày uống mặc định
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={editDurationDays}
                    onChange={(e) => setEditDurationDays(Number(e.target.value))}
                    className="w-full min-h-[38px] px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              {/* Default Dosage Distribution */}
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-md border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">
                  Phân Bổ Liều Mặc Định Khi Kê Toa:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 text-[10px] mb-0.5">
                      Sáng
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={editMorning}
                      onChange={(e) => setEditMorning(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-center font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 text-[10px] mb-0.5">
                      Trưa
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={editNoon}
                      onChange={(e) => setEditNoon(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-center font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 text-[10px] mb-0.5">
                      Chiều
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={editAfternoon}
                      onChange={(e) => setEditAfternoon(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-center font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 text-[10px] mb-0.5">
                      Tối
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={editEvening}
                      onChange={(e) => setEditEvening(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-center font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 text-[10px] mb-0.5">
                      Thời điểm
                    </label>
                    <select
                      value={editTiming}
                      onChange={(e) => setEditTiming(e.target.value as MealTiming)}
                      className="w-full px-1.5 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold"
                    >
                      <option value="sau_an">Sau ăn</option>
                      <option value="truoc_an">Trước ăn</option>
                      <option value="trong_an">Trong ăn</option>
                      <option value="truoc_ngu">Trước ngủ</option>
                      <option value="khi_can">Khi cần</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Hướng dẫn sử dụng mặc định
                </label>
                <input
                  type="text"
                  value={editInstructions}
                  onChange={(e) => setEditInstructions(e.target.value)}
                  placeholder="VD: Uống 1 viên sau khi ăn sáng..."
                  className="w-full min-h-[38px] px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Lưu ý an toàn / Cảnh báo lâm sàng
                </label>
                <input
                  type="text"
                  value={editWarningNote}
                  onChange={(e) => setEditWarningNote(e.target.value)}
                  placeholder="VD: Thận trọng trên bệnh nhân suy thận..."
                  className="w-full min-h-[38px] px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-md font-bold shadow-xs cursor-pointer"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-md max-w-md w-full p-5 shadow-2xl border border-rose-300 dark:border-rose-800 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  Xác Nhận Xóa Thuốc Khỏi Kho?
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Bạn có chắc muốn xóa thuốc{' '}
                  <strong className="text-slate-900 dark:text-slate-200">
                    &quot;{deleteConfirmItem.name}&quot;
                  </strong>{' '}
                  khỏi CSDL phòng khám? Thao tác này sẽ loại bỏ thuốc khỏi danh mục gợi ý khi kê đơn.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md text-xs font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-bold shadow-xs cursor-pointer"
              >
                Xác Nhận Xóa Thuốc
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
