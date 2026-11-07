import React, { useState } from 'react';
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
} from 'lucide-react';

interface ClinicalKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClinicalKnowledgeModal: React.FC<ClinicalKnowledgeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'tiers' | 'ddi' | 'dosing' | 'allergy' | 'cockcroft'>('tiers');
  const [searchTerm, setSearchTerm] = useState('');

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
        <div className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex flex-wrap gap-1.5 shrink-0">
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
            🟠 Tương Tác Thuốc - Thuốc (DDI)
          </button>
          <button
            onClick={() => setActiveTab('dosing')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'dosing'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            🔵 Liều Tối Đa 24h &amp; Thời Điểm
          </button>
          <button
            onClick={() => setActiveTab('allergy')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'allergy'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            🔴 Dị Ứng &amp; Dị Ứng Chéo
          </button>
          <button
            onClick={() => setActiveTab('cockcroft')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'cockcroft'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            🧮 Cockcroft-Gault &amp; Chỉnh Liều
          </button>
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
                <div className="p-3.5 rounded-md border-l-4 border-rose-600 bg-rose-50/60 dark:bg-rose-950/30 border border-slate-200 dark:border-slate-800 space-y-1.5">
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

                <div className="p-3.5 rounded-md border-l-4 border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 border border-slate-200 dark:border-slate-800 space-y-1.5">
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

                <div className="p-3.5 rounded-md border-l-4 border-yellow-500 bg-yellow-50/60 dark:bg-yellow-950/30 border border-slate-200 dark:border-slate-800 space-y-1.5">
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

                <div className="p-3.5 rounded-md border-l-4 border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 border border-slate-200 dark:border-slate-800 space-y-1.5">
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

                <div className="p-3.5 rounded-md border-l-4 border-purple-500 bg-purple-50/60 dark:bg-purple-950/30 border border-slate-200 dark:border-slate-800 space-y-1.5 md:col-span-2">
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
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-md border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200">
                <p className="font-semibold">
                  Các cặp tương tác thuốc kinh điển cần chú ý đặc biệt trong điều trị ngoại trú:
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-300">
                    <span>1. Clopidogrel (Plavix) + Esomeprazole / Omeprazole</span>
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[11px]">Chống chỉ định</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Cơ chế: Omeprazole và Esomeprazole ức chế mạnh isoenzym CYP2C19, làm giảm chuyển hóa Clopidogrel thành chất có hoạt tính chống đông, làm tăng nguy cơ biến cố huyết khối tắc mạch tái phát.
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
                    ✓ Hướng xử trí: Thay bằng Pantoprazole (Pantocid) hoặc Rabeprazole (Pariet) ít ức chế CYP2C19 hơn nhiều.
                  </p>
                </div>

                <div className="p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-300">
                    <span>2. Statin liều cao (Atorvastatin/Simvastatin) + Fibrate (Fenofibrate) / Macrolide</span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[11px]">Cảnh báo nặng</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Cơ chế: Tăng đáng kể nồng độ Statin trong máu, làm tăng nguy cơ viêm cơ, đau cơ và tiêu cơ vân cấp (Rhabdomyolysis) dẫn đến suy thận cấp.
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
                    ✓ Hướng xử trí: Nếu bắt buộc phối hợp, dùng liều Statin thấp (Atorvastatin 10-20mg), uống cách xa nhau hoặc tạm ngưng Statin khi đang uống kháng sinh Macrolide.
                  </p>
                </div>

                <div className="p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-300">
                    <span>3. ACEi / ARB (Coversyl, Losartan) + NSAIDs (Meloxicam, Celecoxib)</span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[11px]">Tương tác thường gặp</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Cơ chế: NSAIDs ức chế tổng hợp Prostaglandin tại thận làm co tiểu động mạch vào, trong khi ACEi làm giãn tiểu động mạch ra $\rightarrow$ Giảm áp lực lọc cầu thận đột ngột, nguy cơ suy thận cấp và giảm tác dụng hạ áp.
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
                    ✓ Hướng xử trí: Dùng liều NSAIDs thấp nhất trong thời gian ngắn nhất (3-5 ngày), uống đủ nước và kiểm tra Creatinine/eGFR.
                  </p>
                </div>

                <div className="p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-300">
                    <span>4. Beta-blocker (Concor) + Chẹn Canxi Non-DHP (Verapamil, Diltiazem)</span>
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[11px]">Chống chỉ định</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Cơ chế: Cả 2 nhóm cùng ức chế dẫn truyền qua nút nhĩ thất (AV node) và giảm co bóp cơ tim $\rightarrow$ Nguy cơ block nhĩ thất độ III, tụt huyết áp nặng và ngừng tim.
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
                    ✓ Hướng xử trí: Phối hợp Beta-blocker với nhóm DHP-CCB (Amlodipine) thay vì Verapamil/Diltiazem.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DOSING & TIMING */}
          {activeTab === 'dosing' && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-md border border-blue-200 dark:border-blue-800 text-blue-950 dark:text-blue-200">
                <p className="font-semibold">
                  Bảng liều tối đa 24h &amp; Thời điểm uống tối ưu chuẩn Dược thư Quốc gia Việt Nam:
                </p>
              </div>

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
                    <tr>
                      <td className="p-2 font-bold text-slate-800 dark:text-slate-200">Paracetamol (Panadol, Efferalgan)</td>
                      <td className="p-2 font-mono font-bold text-rose-600">4,000 mg/ngày</td>
                      <td className="p-2">Sau ăn hoặc khi có đau/sốt (cách mỗi 4-6h)</td>
                      <td className="p-2">Người già/suy gan &le; 2g-3g/ngày</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-slate-800 dark:text-slate-200">Meloxicam (Mobic)</td>
                      <td className="p-2 font-mono font-bold text-rose-600">15 mg/ngày</td>
                      <td className="p-2">Ngay sau bữa ăn no</td>
                      <td className="p-2">Bắt buộc uống sau ăn, tránh loét dạ dày</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-slate-800 dark:text-slate-200">Celecoxib (Celebrex)</td>
                      <td className="p-2 font-mono font-bold text-rose-600">400 mg/ngày</td>
                      <td className="p-2">Sau bữa ăn no</td>
                      <td className="p-2">Thận trọng tiền sử tim mạch xơ vữa</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-slate-800 dark:text-slate-200">Esomeprazole / Pantoprazole (PPI)</td>
                      <td className="p-2 font-mono font-bold text-rose-600">80 mg/ngày</td>
                      <td className="p-2 font-bold text-emerald-600">Trước bữa ăn sáng 30-60 phút</td>
                      <td className="p-2">Uống nguyên viên, không bẻ, không nhai</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-slate-800 dark:text-slate-200">Atorvastatin / Rosuvastatin (Statin)</td>
                      <td className="p-2 font-mono font-bold text-rose-600">40 mg/ngày</td>
                      <td className="p-2 font-bold text-indigo-600">Buổi tối lúc 20:30 (trước ngủ)</td>
                      <td className="p-2">Thời điểm enzym HMG-CoA tổng hợp mạnh nhất</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-slate-800 dark:text-slate-200">Metformin (Glucophage)</td>
                      <td className="p-2 font-mono font-bold text-rose-600">2,550 mg/ngày</td>
                      <td className="p-2">Trong hoặc ngay sau bữa ăn</td>
                      <td className="p-2">Giảm tác dụng phụ cồn cào buồn nôn</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ALLERGY */}
          {activeTab === 'allergy' && (
            <div className="space-y-3">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-md border border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-200">
                <p className="font-semibold">
                  Quy tắc phát hiện dị ứng thuốc &amp; Dị ứng chéo nhóm Beta-lactam:
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <h4 className="font-bold text-rose-700">Dị ứng Penicillin &amp; Dị ứng chéo Cephalosporin</h4>
                  <p className="mt-1 text-slate-600 dark:text-slate-400">
                    Bệnh nhân có tiền sử dị ứng với Penicillin (Amoxicillin, Augmentin, Klamentin, Ampicillin) có tỷ lệ dị ứng chéo từ 1-5% với các thuốc nhóm Cephalosporin (đặc biệt Cephalosporin thế hệ 1: Cephalexin; thế hệ 2: Cefuroxime; thế hệ 3: Cefixime, Cefpodoxime).
                  </p>
                  <p className="mt-1 font-semibold text-rose-600">
                    Khuyến nghị: Chuyển sang kháng sinh nhóm Macrolide (Azithromycin, Clarithromycin) hoặc Quinolone (nếu phù hợp).
                  </p>
                </div>

                <div className="p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <h4 className="font-bold text-rose-700">Dị ứng nhóm Sulfamid (Sulfa Drugs)</h4>
                  <p className="mt-1 text-slate-600 dark:text-slate-400">
                    Dị ứng Bactrim (Sulfamethoxazole + Trimethoprim) cần cẩn trọng chéo với Sulfonylurea (Gliclazide, Glimepiride), Lợi tiểu Thiazide và Celecoxib (chứa gốc Sulfonamide).
                  </p>
                </div>
              </div>
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
