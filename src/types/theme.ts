export type ClinicThemeMode = 'classic-dark' | 'clinical-light' | 'ocean-medical' | 'high-contrast';
export type ClinicLayoutMode = 'standard' | 'focus-prescribing' | 'compact-pro';

export interface ThemeConfig {
  id: ClinicThemeMode;
  name: string;
  badge: string;
  description: string;
  primaryColor: string;
  bgColor: string;
  isDark: boolean;
}

export interface LayoutConfig {
  id: ClinicLayoutMode;
  name: string;
  badge: string;
  description: string;
  iconName: string;
}

export const CLINIC_THEMES: ThemeConfig[] = [
  {
    id: 'classic-dark',
    name: 'Y Tế Tối BS. Diệu',
    badge: 'Mặc định',
    description: 'Nền tối êm dịu, điểm nhấn xanh ngọc lục bảo (Emerald)',
    primaryColor: '#059669',
    bgColor: '#0b0f17',
    isDark: true,
  },
  {
    id: 'clinical-light',
    name: 'Sáng Lâm Sàng (Daylight)',
    badge: 'Ban ngày',
    description: 'Nền trắng xám dịu mắt, chữ đậm nét chống chói đèn',
    primaryColor: '#047857',
    bgColor: '#f8fafc',
    isDark: false,
  },
  {
    id: 'ocean-medical',
    name: 'Bệnh Viện Quốc Tế (Ocean)',
    badge: 'Ocean Blue',
    description: 'Tông xanh biển sâu chuyên nghiệp, công nghệ cao',
    primaryColor: '#0284c7',
    bgColor: '#090e17',
    isDark: true,
  },
  {
    id: 'high-contrast',
    name: 'Tương Phản Cao & Chữ Rõ',
    badge: 'Chống mỏi mắt',
    description: 'Viền sắc nét, chữ phóng to 105% làm việc ca dài',
    primaryColor: '#10b981',
    bgColor: '#000000',
    isDark: true,
  },
];

export const CLINIC_LAYOUTS: LayoutConfig[] = [
  {
    id: 'standard',
    name: 'Bố Cục Chuẩn (8:4)',
    badge: 'Mặc định',
    description: 'Khám bệnh 8 cột + Kho thuốc nhanh 4 cột',
    iconName: 'LayoutGrid',
  },
  {
    id: 'focus-prescribing',
    name: 'Tập Trung Kê Đơn (Full Width)',
    badge: 'Tối ưu kê đơn',
    description: 'Kê đơn toàn màn hình, kho thuốc thu gọn thông minh',
    iconName: 'Maximize2',
  },
  {
    id: 'compact-pro',
    name: 'Gọn Gàng Không Cuộn (1080p)',
    badge: 'Zero-Scroll',
    description: 'Thu gọn khoảng cách vừa khít 1 màn hình Full HD',
    iconName: 'Minimize2',
  },
];
