import { CrawledDrugItem, CrawlerSettings, CrawlerStatusResponse } from '../types/crawler';
import { getAuthHeaders } from './authClient';

// Helper gọi fetch có timeout dứt khoát, chống treo browser vĩnh viễn
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 6500): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const authHeaders = getAuthHeaders();
  const mergedHeaders = {
    ...authHeaders,
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers: mergedHeaders,
      signal: controller.signal,
    });
    return res;
  } catch (err: unknown) {
    if ((err as Error).name === 'AbortError') {
      throw new Error(`Yêu cầu máy chủ vượt quá thời gian cho phép (${timeoutMs / 1000}s). Vui lòng kiểm tra kết nối mạng nội bộ.`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function getCrawlerStatus(): Promise<CrawlerStatusResponse | null> {
  try {
    const res = await fetchWithTimeout('/api/crawler/status', {}, 4000);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Failed to get crawler status:', err);
    return null;
  }
}

export async function getPendingCrawledDrugs(): Promise<CrawledDrugItem[]> {
  try {
    const res = await fetchWithTimeout('/api/crawler/pending', {}, 4000);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.items || [];
  } catch (err) {
    console.error('Failed to get pending crawled drugs:', err);
    return [];
  }
}

export async function saveCrawlerSettings(settings: Partial<CrawlerSettings>): Promise<CrawlerSettings | null> {
  try {
    const res = await fetchWithTimeout('/api/crawler/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    }, 5000);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.settings;
  } catch (err) {
    console.error('Failed to save crawler settings:', err);
    throw err;
  }
}

export async function triggerCrawlerRun(
  clinicCatalogNames: string[] = []
): Promise<{ added: number; skipped: number; totalPending: number }> {
  const res = await fetchWithTimeout('/api/crawler/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clinicCatalogNames }),
  }, 7500);

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function approveCrawledDrug(
  id: string,
  customEdits?: Partial<CrawledDrugItem>
): Promise<CrawledDrugItem> {
  const res = await fetchWithTimeout('/api/crawler/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, customEdits }),
  }, 5000);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.item;
}

export async function approveAllCrawledDrugs(): Promise<CrawledDrugItem[]> {
  const res = await fetchWithTimeout('/api/crawler/approve-all', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, 6000);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.items || [];
}

export async function rejectCrawledDrug(id: string, reason?: string): Promise<CrawledDrugItem> {
  const res = await fetchWithTimeout('/api/crawler/reject', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, reason }),
  }, 5000);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.item;
}

export async function rejectAllCrawledDrugs(): Promise<number> {
  const res = await fetchWithTimeout('/api/crawler/reject-all', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, 6000);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.count || 0;
}

export async function updatePendingDrug(
  id: string,
  updates: Partial<CrawledDrugItem>
): Promise<CrawledDrugItem> {
  const res = await fetchWithTimeout(`/api/crawler/item/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  }, 5000);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.item;
}
