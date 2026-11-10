import React, { useState, useMemo } from 'react';
import {
  X,
  BookOpen,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Pill,
  Calculator,
  Search,
  CheckCircle2,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { useSmartPagination } from '../hooks/useSmartPagination';
import { ClinicPaginationBar } from './ClinicPaginationBar';
import { matchesVietnameseSearch } from '../utils/vietnameseSearch';

interface ClinicalKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DdiRule {
  id: string;
  pair: string;
  level: 'Chống chỉ định' | 'Cảnh báo nặng' | 'Tương tác thường gặp';
  mechanism: string;
  solution: string;
}

interface DosingRule {
  id: string;
  name: string;
  maxDose: string;
  timing: string;
  note: string;
}

interface AllergyRule {
  id: string;
  title: string;
  crossRisk: string;
  mechanism: string;
  solution: string;
}

const DDI_RULES_DATA: DdiRule[] = [
  {
    id: 'ddi-1',
    pair: 'Clopidogrel (Plavix) + Esomeprazole / Omeprazole',
    level: 'Chống chỉ định',
    mechanism: 'Omeprazole & Esomeprazole ức chế mạnh CYP2C19, làm giảm nồng độ hoạt chất có hoạt tính của Clopidogrel, tăng nguy cơ tái phát huyết khối cơ tim & đột quỵ.',
    solution: 'Thay bằng Pantoprazole (Pantocid) hoặc Rabeprazole (Pariet) ít ức chế isoenzym CYP2C19.',
  },
  {
    id: 'ddi-2',
    pair: 'Statin liều cao (Atorvastatin/Simvastatin) + Fibrate (Fenofibrate) / Macrolide',
    level: 'Cảnh báo nặng',
    mechanism: 'Tăng đáng kể nồng độ Statin trong huyết tương, tăng vọt nguy cơ viêm cơ, đau cơ và tiêu cơ vân cấp (Rhabdomyolysis) dẫn đến suy thận cấp.',
    solution: 'Dùng Statin liều thấp (10-20mg), uống cách xa nhau hoặc tạm dừng Statin trong đợt dùng Macrolide.',
  },
  {
    id: 'ddi-3',
    pair: 'ACEi / ARB (Coversyl, Losartan) + NSAIDs (Meloxicam, Celecoxib)',
    level: 'Tương tác thường gặp',
    mechanism: 'NSAIDs ức chế tổng hợp Prostaglandin tại thận co tiểu động mạch vào, ACEi làm giãn tiểu động mạch ra -> Giảm áp lực lọc cầu thận đột ngột, nguy cơ suy thận cấp & mất tác dụng hạ áp.',
    solution: 'Dùng NSAIDs liều thấp nhất trong thời gian ngắn nhất (3-5 ngày), uống đủ nước và kiểm tra Creatinine/eGFR.',
  },
  {
    id: 'ddi-4',
    pair: 'Beta-blocker (Concor) + Chẹn Canxi Non-DHP (Verapamil, Diltiazem)',
    level: 'Chống chỉ định',
    mechanism: 'Cả 2 nhóm cùng ức chế dẫn truyền qua nút nhĩ thất (AV node) và giảm co bóp cơ tim -> Nguy cơ block nhĩ thất độ III, tụt huyết áp nặng và ngừng tim.',
    solution: 'Phối hợp Beta-blocker với nhóm DHP-CCB (Amlodipine) thay vì Verapamil/Diltiazem.',
  },
  {
    id: 'ddi-5',
    pair: 'ACEi / ARB (Perindopril, Telmisartan) + Lợi tiểu giữ Kali (Spironolactone)',
    level: 'Cảnh báo nặng',
    mechanism: 'Tăng nồng độ Kali huyết thanh đột ngột (K+ > 5.5 - 6.0 mmol/L), nguy cơ loạn nhịp tim nguy hiểm đe dọa tính mạng.',
    solution: 'Theo dõi chặt chẽ điện giải đồ Kali máu và Creatinine sau 1 và 4 tuần khởi trị.',
  },
  {
    id: 'ddi-6',
    pair: 'Warfarin / Sintrom + Kháng sinh Quinolone / Macrolide / Metronidazole',
    level: 'Cảnh báo nặng',
    mechanism: 'Ức chế chuyển hóa Warfarin qua gan và diệt vi khuẩn đường ruột tổng hợp Vitamin K -> Tăng vọt INR, nguy cơ xuất huyết tiêu hóa & nội sọ.',
    solution: 'Xét nghiệm INR thường xuyên hơn, cân nhắc giảm liều thuốc chống đông từ 20-30%.',
  },
  {
    id: 'ddi-7',
    pair: 'Ciprofloxacin / Levofloxacin + Thuốc kháng acid chứa Nhôm, Magie, Canxi, Sắt',
    level: 'Tương tác thường gặp',
    mechanism: 'Ion kim loại hóa trị 2 & 3 tạo phức chelate không tan với Quinolone, làm giảm hấp thu kháng sinh đến 70-90%.',
    solution: 'Uống kháng sinh Quinolone trước 2 giờ hoặc sau 4 giờ so với thuốc kháng acid hoặc viên sắt.',
  },
  {
    id: 'ddi-8',
    pair: 'Metformin + Thuốc cản quang chứa Iod qua đường tĩnh mạch',
    level: 'Chống chỉ định',
    mechanism: 'Thuốc cản quang gây suy thận cấp làm ứ đọng Metformin trong cơ thể -> Toan acid lactic nguy kịch (tử vong > 50%).',
    solution: 'Tạm ngưng Metformin 48 giờ trước và sau khi chụp CT có cản quang, chỉ dùng lại sau khi kiểm tra chức năng thận bình thường.',
  },
  {
    id: 'ddi-9',
    pair: 'SSRI (Sertraline, Escitalopram) + Tramadol / Linezolid',
    level: 'Cảnh báo nặng',
    mechanism: 'Tăng phóng thích và ức chế tái hấp thu Serotonin -> Hội chứng Serotonin cấp (kích động, run rẩy, sốt cao, co cứng cơ).',
    solution: 'Tránh phối hợp; dùng Paracetamol hoặc NSAID thay cho Tramadol nếu đang dùng SSRI.',
  },
  {
    id: 'ddi-10',
    pair: 'Aspirin liều thấp + Ibuprofen / Naproxen',
    level: 'Tương tác thường gặp',
    mechanism: 'Ibuprofen phong bế cạnh tranh thụ thể COX-1 của tiểu cầu, ngăn cản Aspirin gắn kết không thuận nghịch -> Mất tác dụng bảo vệ tim mạch ngừa huyết khối.',
    solution: 'Uống Aspirin ít nhất 30-60 phút trước khi uống Ibuprofen, hoặc uống Ibuprofen cách Aspirin 8 giờ.',
  },
  {
    id: 'ddi-11',
    pair: 'Digoxin + Clarithromycin / Amiodarone',
    level: 'Cảnh báo nặng',
    mechanism: 'Ức chế P-glycoprotein tại ruột và thận làm tăng nồng độ Digoxin trong huyết tương lên gấp đôi -> Ngộ độc Digoxin (loạn nhịp, nhìn vàng, nôn ói).',
    solution: 'Giảm liều Digoxin 30-50% và định lượng nồng độ Digoxin huyết thanh.',
  },
  {
    id: 'ddi-12',
    pair: 'Methotrexate + NSAIDs (Meloxicam, Diclofenac)',
    level: 'Cảnh báo nặng',
    mechanism: 'NSAIDs làm giảm thanh thải Methotrexate qua thận -> Ngộ độc tủy xương nặng, hạ bạch cầu hạt và loét miệng.',
    solution: 'Tránh dùng NSAIDs liều cao vào ngày bệnh nhân dùng Methotrexate hàng tuần.',
  },
];

const DOSING_RULES_DATA: DosingRule[] = [
  {
    id: 'dos-1',
    name: 'Paracetamol (Panadol, Efferalgan, Hapacol)',
    maxDose: '4,000 mg/ngày',
    timing: 'Sau ăn hoặc khi đau/sốt (cách mỗi 4-6 giờ)',
    note: 'Người cao tuổi hoặc men gan tăng giới hạn <= 2g - 3g/ngày. Tuyệt đối không quá 4g/ngày.',
  },
  {
    id: 'dos-2',
    name: 'Meloxicam (Mobic, Melox)',
    maxDose: '15 mg/ngày',
    timing: 'Ngay sau bữa ăn no',
    note: 'Bắt buộc uống sau ăn no để tránh tổn thương niêm mạc dạ dày. Liều khởi đầu 7.5mg/ngày.',
  },
  {
    id: 'dos-3',
    name: 'Celecoxib (Celebrex)',
    maxDose: '400 mg/ngày',
    timing: 'Sau bữa ăn no',
    note: 'Thận trọng tiền sử bệnh tim mạch xơ vữa. Viêm khớp thoái hóa thường dùng 200mg/ngày.',
  },
  {
    id: 'dos-4',
    name: 'Esomeprazole / Pantoprazole / Omeprazole (PPI)',
    maxDose: '80 mg/ngày',
    timing: 'Trước bữa ăn sáng 30 - 60 phút',
    note: 'Uống nguyên viên với nước lọc, không bẻ, không nhai. Bơm proton được kích hoạt tối đa sau ăn sáng.',
  },
  {
    id: 'dos-5',
    name: 'Atorvastatin / Rosuvastatin (Statin)',
    maxDose: '40 mg - 80 mg/ngày',
    timing: 'Buổi tối lúc 20:30 (trước khi đi ngủ)',
    note: 'Enzym HMG-CoA Reductase tổng hợp Cholesterol mạnh nhất vào ban đêm. Theo dõi AST/ALT sau 3 tháng.',
  },
  {
    id: 'dos-6',
    name: 'Metformin (Glucophage)',
    maxDose: '2,550 mg/ngày',
    timing: 'Trong hoặc ngay sau bữa ăn chính',
    note: 'Uống trong bữa ăn giảm tối đa triệu chứng đầy bụng, cồn cào buồn nôn. Không dùng nếu eGFR < 30.',
  },
  {
    id: 'dos-7',
    name: 'Amlodipine (Amlor)',
    maxDose: '10 mg/ngày',
    timing: 'Buổi sáng cố định cùng giờ mỗi ngày',
    note: 'Theo dõi triệu chứng phù mắt cá chân (phù do giãn mạch, không phải suy tim). Khởi đầu 5mg/ngày.',
  },
  {
    id: 'dos-8',
    name: 'Perindopril (Coversyl)',
    maxDose: '10 mg/ngày',
    timing: 'Buổi sáng trước bữa ăn',
    note: 'Thức ăn làm giảm chuyển hóa Perindopril thành Perindoprilat có hoạt tính. Cảnh báo ho khan.',
  },
  {
    id: 'dos-9',
    name: 'Levothyroxine (Berlthyrox)',
    maxDose: '200 mcg/ngày',
    timing: 'Buổi sáng trước ăn sáng 30 - 60 phút',
    note: 'Hấp thu kém khi có thức ăn, canxi hoặc sắt. Phải uống cách bữa ăn sáng ít nhất 30 phút.',
  },
  {
    id: 'dos-10',
    name: 'Amoxicillin + Acid Clavulanic (Augmentin)',
    maxDose: '3,000 mg/ngày',
    timing: 'Ngay đầu bữa ăn',
    note: 'Uống vào đầu bữa ăn giúp tối ưu hấp thu Amoxicillin và hạn chế tối đa cảm giác buồn nôn do Acid Clavulanic.',
  },
  {
    id: 'dos-11',
    name: 'Allopurinol (Zyloric)',
    maxDose: '800 mg/ngày',
    timing: 'Sau bữa ăn',
    note: 'Uống cùng nhiều nước (ít nhất 2 lít/ngày). Chỉnh liều theo độ thanh thải Creatinine.',
  },
  {
    id: 'dos-12',
    name: 'Alendronate (Fosamax)',
    maxDose: '70 mg/tuần',
    timing: 'Buổi sáng ngay khi thức dậy, bụng đói hoàn toàn',
    note: 'Uống với 200ml nước lọc, giữ tư thế thẳng đứng (không nằm) trong ít nhất 30 phút để chống loét thực quản.',
  },
];

const ALLERGY_RULES_DATA: AllergyRule[] = [
  {
    id: 'alg-1',
    title: 'Dị ứng Penicillin & Dị ứng chéo Cephalosporin',
    crossRisk: 'Tỷ lệ chéo 1% - 5%',
    mechanism: 'Kháng thể IgE phản ứng chéo với chuỗi bên tương đồng cấu trúc beta-lactam, đặc biệt thế hệ 1 (Cephalexin) và thế hệ 2 (Cefuroxime).',
    solution: 'Khuyến nghị thay bằng Macrolide (Azithromycin, Clarithromycin) hoặc Quinolone.',
  },
  {
    id: 'alg-2',
    title: 'Dị ứng nhóm Sulfamid (Sulfa Drugs)',
    crossRisk: 'Tỷ lệ chéo 3% - 8%',
    mechanism: 'Nhóm Sulfonamide arylamine trong Bactrim (Sulfamethoxazole + Trimethoprim) có thể phản ứng chéo với Sulfonylurea (Gliclazide), Lợi tiểu Thiazide và Celecoxib.',
    solution: 'Cẩn trọng khi kê toa Sulfonylurea hoặc Celecoxib cho người dị ứng kháng sinh Sulfa.',
  },
  {
    id: 'alg-3',
    title: 'Dị ứng thuốc chống viêm không Steroid (NSAIDs)',
    crossRisk: 'Tỷ lệ chéo cao giữa các nhóm NSAIDs',
    mechanism: 'Do cơ chế ức chế chọn lọc hoặc không chọn lọc enzym COX-1 chuyển hướng Acid Arachidonic sang con đường Leukotriene gây co thắt phế quản và mày đay.',
    solution: 'Người dị ứng Aspirin/NSAIDs có tiền sử hen suyễn (tam chứng Widal) nên ưu tiên Paracetamol <= 1000mg hoặc Paracetamol + Tramadol.',
  },
  {
    id: 'alg-4',
    title: 'Dị ứng kháng sinh nhóm Quinolone (Ciprofloxacin, Levofloxacin)',
    crossRisk: 'Dị ứng chéo hầu như hoàn toàn trong nhóm',
    mechanism: 'Cấu trúc nhân quinolone giống nhau kích hoạt giải phóng histamin trực tiếp từ dưỡng bào (mast cell).',
    solution: 'Nếu đã dị ứng Ciprofloxacin, chống chỉ định tuyệt đối Levofloxacin, Moxifloxacin và Ofloxacin.',
  },
];

export const ClinicalKnowledgeModal: React.FC<ClinicalKnowledgeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'tiers' | 'ddi' | 'dosing' | 'allergy' | 'cockcroft'>('tiers');
  const [searchTerm, setSearchTerm] = useState('');

  // DDI rules with Vietnamese search & pagination
  const filteredDdiRules = useMemo(() => {
    if (!searchTerm.trim()) return DDI_RULES_DATA;
    return DDI_RULES_DATA.filter((r) =>
      matchesVietnameseSearch(`${r.pair} ${r.level} ${r.mechanism} ${r.solution}`, searchTerm)
    );
  }, [searchTerm]);

  const ddiPagination = useSmartPagination<DdiRule>({
    items: filteredDdiRules,
    initialPageSize: 6,
    resetDependencies: [searchTerm],
  });

  // Dosing rules with Vietnamese search & pagination
  const filteredDosingRules = useMemo(() => {
    if (!searchTerm.trim()) return DOSING_RULES_DATA;
    return DOSING_RULES_DATA.filter((r) =>
      matchesVietnameseSearch(`${r.name} ${r.maxDose} ${r.timing} ${r.note}`, searchTerm)
    );
  }, [searchTerm]);

  const dosingPagination = useSmartPagination<DosingRule>({
    items: filteredDosingRules,
    initialPageSize: 6,
    resetDependencies: [searchTerm],
  });

  // Allergy rules with Vietnamese search & pagination
  const filteredAllergyRules = useMemo(() => {
    if (!searchTerm.trim()) return ALLERGY_RULES_DATA;
    return ALLERGY_RULES_DATA.filter((r) =>
      matchesVietnameseSearch(`${r.title} ${r.crossRisk} ${r.mechanism} ${r.solution}`, searchTerm)
    );
  }, [searchTerm]);

  const allergyPagination = useSmartPagination<AllergyRule>({
    items: filteredAllergyRules,
    initialPageSize: 6,
    resetDependencies: [searchTerm],
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-4xl w-full shadow-2xl border border-slate-300 dark:border-slate-700 overflow-hidden my-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-indigo-600/30 border border-indigo-400/50 flex items-center justify-center text-indigo-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">
                  Kho Nguyên Tắc Y Khoa &amp; Ma Trận 5 Tầng
                </h3>
                <span className="px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300 text-[11px] font-mono font-bold border border-emerald-400/40">
                  0ms Offline Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tuân thủ Dược Thư Quốc Gia Việt Nam &amp; Phác Đồ Bộ Y Tế cho BS. Trần Văn Diệu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-md transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveTab('tiers')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'tiers'
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              🛡️ Ma Trận 5 Tầng Cảnh Báo
            </button>
            <button
              onClick={() => setActiveTab('ddi')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'ddi'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              🟠 Tương Tác Thuốc (DDI) ({filteredDdiRules.length})
            </button>
            <button
              onClick={() => setActiveTab('dosing')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'dosing'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              🔵 Liều 24h &amp; Thời Điểm ({filteredDosingRules.length})
            </button>
            <button
              onClick={() => setActiveTab('allergy')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'allergy'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              🔴 Dị Ứng Chéo ({filteredAllergyRules.length})
            </button>
            <button
              onClick={() => setActiveTab('cockcroft')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'cockcroft'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              🧮 Cockcroft-Gault
            </button>
          </div>

          {(activeTab === 'ddi' || activeTab === 'dosing' || activeTab === 'allergy') && (
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm quy tắc y khoa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-3 py-1 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 text-xs sm:text-sm">
          {/* TAB 1: 5 TIERS OVERVIEW */}
          {activeTab === 'tiers' && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-md border border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200">
                <p className="font-semibold">
                  Mô hình 5 tầng cảnh báo lâm sàng chạy độc lập trực tiếp trong trình duyệt máy tính của Bác sĩ (0ms, không phụ thuộc kết nối Internet). Hệ thống chấm Điểm An Toàn Đơn Thuốc (0 - 100 điểm) và trừ điểm tương ứng theo mức độ nghiêm trọng:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg border border-rose-300 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/20 space-y-1.5">
                  <h4 className="font-bold text-rose-950 dark:text-rose-200 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                    🔴 TẦNG 1: Dị Ứng &amp; Dị Ứng Chéo
                  </h4>
                  <p className="text-slate-700 dark:text-slate-300">
                    Đối chiếu tiền sử dị ứng của bệnh nhân với toàn bộ hoạt chất trong toa. Chống chỉ định tuyệt đối nhóm Beta-lactam (Penicillin, Amoxicillin, Cephalosporin), Sulfamid, NSAIDs, Quinolone...
                  </p>
                  <span className="inline-block text-[11px] font-mono text-rose-700 dark:text-rose-400 font-bold">
                    Trừ 40 - 50 điểm / vi phạm
                  </span>
                </div>

                <div className="p-3.5 rounded-lg border border-amber-300 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 space-y-1.5">
                  <h4 className="font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    🟠 TẦNG 2: Tương Tác Thuốc &amp; Trùng Hoạt Chất
                  </h4>
                  <p className="text-slate-700 dark:text-slate-300">
                    Phát hiện các cặp tương tác kỵ nhau (Clopidogrel + Omeprazole/Esomeprazole, Statin + Macrolide/Fibrate, ACEi + Spironolactone) và cảnh báo kê 2 biệt dược khác tên nhưng trùng hoạt chất.
                  </p>
                  <span className="inline-block text-[11px] font-mono text-amber-700 dark:text-amber-400 font-bold">
                    Trừ 15 - 35 điểm / vi phạm
                  </span>
                </div>

                <div className="p-3.5 rounded-lg border border-yellow-300 dark:border-yellow-900/60 bg-yellow-50/70 dark:bg-yellow-950/20 space-y-1.5">
                  <h4 className="font-bold text-yellow-950 dark:text-yellow-200 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                    🟡 TẦNG 3: Đối Soát Bệnh Nền &amp; Sinh Hiệu
                  </h4>
                  <p className="text-slate-700 dark:text-slate-300">
                    Kiểm tra chéo với Huyết áp (HA &lt; 100/60 chặn hạ áp; HA &ge; 160 nhắc nhở NSAID gây tăng HA), Nhịp tim (&lt; 60 bpm chặn chẹn Beta), Dạ dày chưa có PPI, Đái tháo đường kê Corticoid.
                  </p>
                  <span className="inline-block text-[11px] font-mono text-yellow-700 dark:text-yellow-400 font-bold">
                    Trừ 10 - 25 điểm / vi phạm
                  </span>
                </div>

                <div className="p-3.5 rounded-lg border border-blue-300 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/20 space-y-1.5">
                  <h4 className="font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    🔵 TẦNG 4: Liều Tối Đa 24h &amp; Thời Điểm
                  </h4>
                  <p className="text-slate-700 dark:text-slate-300">
                    Tính tổng hàm lượng 24h = (Sáng + Trưa + Chiều + Tối) &times; Hàm lượng viên, cảnh báo vượt ngưỡng Dược thư (Paracetamol &gt; 4g, Meloxicam &gt; 15mg) và nhắc thời điểm uống chuẩn (Trước ăn/Sau ăn no/Buổi tối).
                  </p>
                  <span className="inline-block text-[11px] font-mono text-blue-700 dark:text-blue-400 font-bold">
                    Trừ 5 - 20 điểm / vi phạm
                  </span>
                </div>

                <div className="p-3.5 rounded-lg border border-purple-300 dark:border-purple-900/60 bg-purple-50/70 dark:bg-purple-950/20 space-y-1.5 md:col-span-2">
                  <h4 className="font-bold text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                    🟣 TẦNG 5: Lưu Ý Lâm Sàng &amp; Theo Dõi Cận Lâm Sàng
                  </h4>
                  <p className="text-slate-700 dark:text-slate-300">
                    Gợi ý dặn dò bệnh nhân các tác dụng phụ thường gặp (ho khan do ACEi, phù mắt cá chân do Amlodipine, buồn ngủ do kháng Histamin H1) và đề xuất xét nghiệm theo dõi định kỳ (AST, ALT men gan, Creatinine/eGFR).
                  </p>
                  <span className="inline-block text-[11px] font-mono text-purple-700 dark:text-purple-400 font-bold">
                    Trừ 1 - 2 điểm / vi phạm
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DDI */}
          {activeTab === 'ddi' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-md border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200 flex items-center justify-between">
                <p className="font-semibold text-xs sm:text-sm">
                  Cặp tương tác thuốc kinh điển cần chú ý đặc biệt trong điều trị ngoại trú ({filteredDdiRules.length} quy tắc):
                </p>
              </div>

              {filteredDdiRules.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Không tìm thấy tương tác thuốc nào khớp với từ khóa &ldquo;{searchTerm}&rdquo;
                </div>
              ) : (
                <div className="space-y-2.5">
                  {ddiPagination.paginatedItems.map((rule, idx) => (
                    <div key={rule.id} className="p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                      <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-300">
                        <span>{ddiPagination.startIndex + idx + 1}. {rule.pair}</span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          rule.level === 'Chống chỉ định'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                            : rule.level === 'Cảnh báo nặng'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                        }`}>
                          {rule.level}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        <strong>Cơ chế:</strong> {rule.mechanism}
                      </p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
                        ✓ <strong>Hướng xử trí:</strong> {rule.solution}
                      </p>
                    </div>
                  ))}
                  <ClinicPaginationBar
                    pagination={ddiPagination}
                    pageSizeOptions={[4, 6, 10, 20]}
                    itemLabel="tương tác thuốc"
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DOSING & TIMING */}
          {activeTab === 'dosing' && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-md border border-blue-200 dark:border-blue-800 text-blue-950 dark:text-blue-200">
                <p className="font-semibold text-xs sm:text-sm">
                  Bảng liều tối đa 24h &amp; Thời điểm uống tối ưu chuẩn Dược thư Quốc gia Việt Nam ({filteredDosingRules.length} hoạt chất):
                </p>
              </div>

              {filteredDosingRules.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Không tìm thấy hoạt chất nào khớp với từ khóa &ldquo;{searchTerm}&rdquo;
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-800 text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                          <th className="p-2 border border-slate-200 dark:border-slate-700">Hoạt chất / Biệt dược</th>
                          <th className="p-2 border border-slate-200 dark:border-slate-700">Liều tối đa 24h</th>
                          <th className="p-2 border border-slate-200 dark:border-slate-700">Thời điểm uống</th>
                          <th className="p-2 border border-slate-200 dark:border-slate-700">Lưu ý lâm sàng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {dosingPagination.paginatedItems.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-2 font-bold text-slate-800 dark:text-slate-200">{item.name}</td>
                            <td className="p-2 font-mono font-bold text-rose-600">{item.maxDose}</td>
                            <td className="p-2">{item.timing}</td>
                            <td className="p-2 text-slate-600 dark:text-slate-300">{item.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <ClinicPaginationBar
                    pagination={dosingPagination}
                    pageSizeOptions={[4, 6, 10, 20]}
                    itemLabel="hoạt chất"
                  />
                </>
              )}
            </div>
          )}

          {/* TAB 4: ALLERGY */}
          {activeTab === 'allergy' && (
            <div className="space-y-3">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-md border border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-200">
                <p className="font-semibold text-xs sm:text-sm">
                  Quy tắc phát hiện dị ứng thuốc &amp; Dị ứng chéo ({filteredAllergyRules.length} nhóm cảnh báo):
                </p>
              </div>

              {filteredAllergyRules.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Không tìm thấy nhóm dị ứng nào khớp với từ khóa &ldquo;{searchTerm}&rdquo;
                </div>
              ) : (
                <div className="space-y-2.5 text-xs">
                  {allergyPagination.paginatedItems.map((alg) => (
                    <div key={alg.id} className="p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-rose-700 dark:text-rose-400 text-xs sm:text-sm">{alg.title}</h4>
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-[10px]">
                          {alg.crossRisk}
                        </span>
                      </div>
                      <p className="mt-1 text-slate-600 dark:text-slate-400">
                        <strong>Cơ chế:</strong> {alg.mechanism}
                      </p>
                      <p className="mt-1 font-semibold text-emerald-700 dark:text-emerald-400">
                        ✓ <strong>Hướng xử trí:</strong> {alg.solution}
                      </p>
                    </div>
                  ))}
                  <ClinicPaginationBar
                    pagination={allergyPagination}
                    pageSizeOptions={[2, 4, 6, 10]}
                    itemLabel="quy tắc dị ứng"
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 5: COCKCROFT-GAULT */}
          {activeTab === 'cockcroft' && (
            <div className="space-y-3">
              <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-md border border-teal-200 dark:border-teal-800 text-teal-950 dark:text-teal-200">
                <p className="font-semibold">
                  Công thức Cockcroft-Gault ước tính độ thanh thải Creatinine (CrCl) &amp; Khuyến nghị chỉnh liều:
                </p>
              </div>

              <div className="p-3 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-center text-xs sm:text-sm text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700">
                Nam: CrCl = [(140 - Tuổi) &times; Cân nặng (kg)] / [72 &times; Creatinine huyết thanh (mg/dL)]
                <br />
                Nữ: CrCl = Nam &times; 0.85
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-md border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <div className="font-bold text-emerald-900 dark:text-emerald-300">CrCl &ge; 60 mL/min</div>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">Chức năng thận bình thường hoặc giảm nhẹ. Dùng liều thông thường.</p>
                </div>
                <div className="p-3 rounded-md border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                  <div className="font-bold text-amber-900 dark:text-amber-300">CrCl 30 - 59 mL/min</div>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">Suy thận vừa. Giảm liều 50% hoặc kéo dài khoảng cách dùng đối với Metformin, Allopurinol, Cefuroxime.</p>
                </div>
                <div className="p-3 rounded-md border border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20">
                  <div className="font-bold text-rose-900 dark:text-rose-300">CrCl &lt; 30 mL/min</div>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">Suy thận nặng. Chống chỉ định Metformin (nguy cơ toan acid lactic), NSAIDs, Spironolactone.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-900 px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-md text-xs cursor-pointer"
          >
            Đã Hiểu &amp; Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
