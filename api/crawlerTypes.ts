import { MedicationCatalogItem } from '../src/types/medical';

export interface CrawledDrugItem extends MedicationCatalogItem {
  registrationNumber?: string; // Số đăng ký lưu hành (VD: VN-22104-19, VD-29831-18)
  manufacturer?: string; // Nhà sản xuất (VD: AstraZeneca, Sanofi, Dược Hậu Giang...)
  source: string; // Nguồn cào dữ liệu
  crawledAt: string; // Thời gian cào dữ liệu (ISO)
  confidenceScore: number; // Độ tin cậy dữ liệu (0-100)
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface CrawlerSettings {
  enabled: boolean; // Bật/tắt tự động chạy mỗi ngày
  dailyRunTime: string; // Giờ chạy hàng ngày (định dạng HH:mm, ví dụ "06:00")
  batchSize: number; // Số lượng thuốc cào mỗi lần (5, 10, 20, 30)
  targetSources: string[]; // Danh sách nguồn dữ liệu mục tiêu
  targetCategories: string[]; // Danh mục bệnh lý cần ưu tiên cào
  autoDiscardDuplicates: boolean; // Tự động bỏ qua thuốc đã có trong kho hoặc đã cào
  lastRunTime?: string | null;
  nextRunTime?: string | null;
}

export interface CrawlerLogEntry {
  id: string;
  timestamp: string;
  triggerType: 'scheduled' | 'manual';
  itemsFound: number;
  itemsAdded: number;
  itemsSkipped: number;
  status: 'success' | 'warning' | 'error';
  message: string;
}

export interface CrawlerStatusResponse {
  isRunning: boolean;
  settings: CrawlerSettings;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  recentLogs: CrawlerLogEntry[];
}
