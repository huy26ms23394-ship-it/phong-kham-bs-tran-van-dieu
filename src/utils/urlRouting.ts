export type RouteTab =
  | 'consultation'
  | 'patients'
  | 'prescriptions'
  | 'print'
  | 'appointments'
  | 'reports';

export interface RouteState {
  tab: RouteTab;
  params: Record<string, string>;
}

/**
 * Phân tích hash URL hiện tại (VD: "#/consultation?patientId=pat-001")
 */
export function parseCurrentRoute(): RouteState {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (!hash) {
    return { tab: 'consultation', params: {} };
  }

  const [pathPart, queryPart] = hash.split('?');
  const cleanTab = pathPart.toLowerCase().trim();

  let tab: RouteTab = 'consultation';
  if (
    cleanTab === 'patients' ||
    cleanTab === 'prescriptions' ||
    cleanTab === 'print' ||
    cleanTab === 'appointments' ||
    cleanTab === 'reports'
  ) {
    tab = cleanTab;
  }

  const params: Record<string, string> = {};
  if (queryPart) {
    const searchParams = new URLSearchParams(queryPart);
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
  }

  return { tab, params };
}

/**
 * Điều hướng tới một route và lưu hash vào URL
 */
export function navigateTo(tab: RouteTab, params?: Record<string, string | number | undefined>): void {
  let hashStr = `#/${tab}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.set(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      hashStr += `?${queryString}`;
    }
  }

  if (window.location.hash !== hashStr) {
    window.location.hash = hashStr;
  }
}

/**
 * Đăng ký lắng nghe sự kiện thay đổi hash của trình duyệt (Back / Forward / Link click)
 */
export function subscribeToRouteChanges(
  callback: (route: RouteState) => void
): () => void {
  const handler = () => {
    callback(parseCurrentRoute());
  };

  window.addEventListener('hashchange', handler);
  return () => window.removeEventListener('hashchange', handler);
}
