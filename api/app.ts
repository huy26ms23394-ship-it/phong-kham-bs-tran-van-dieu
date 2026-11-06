import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { crawlerService } from './crawlerService.js';
import { dbService } from './databaseService.js';

dotenv.config();

export const app = express();

app.use(express.json({ limit: '10mb' }));

// ================= BẢO MẬT & SECURITY HARDENING (LUẬT 116/2025/QH15 & NĐ 333/2026/NĐ-CP) =================
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// In-Memory Sliding-Window IP Rate Limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 120;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  record.count += 1;
  return record.count <= MAX_REQUESTS_PER_WINDOW;
}

const apiRouter = express.Router();

// Rate limiting middleware on apiRouter
apiRouter.use((req, res, next) => {
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
  if (!checkRateLimit(clientIp)) {
    dbService.recordAuditLog({
      action: 'RATE_LIMIT_EXCEEDED',
      ip: clientIp,
      status: 'BLOCKED',
      userAgent: req.headers['user-agent'],
      details: { path: req.path, method: req.method },
    });
    return res.status(429).json({
      success: false,
      error: 'Quá nhiều yêu cầu trong thời gian ngắn (Rate limit exceeded). Vui lòng đợi 1 phút.',
    });
  }
  next();
});

// ================= ROUTE DEFINITIONS =================

// Health & System Status
apiRouter.get('/health', (_req, res) => {
  const storage = dbService.getStorageStatus();
  res.json({
    status: 'ONLINE',
    system: 'Hệ thống Quản lý Phòng Khám BS. Trần Văn Diệu',
    storage,
    timestamp: new Date().toISOString(),
  });
});

// Audit Logs
apiRouter.get('/security/audit-logs', async (_req, res) => {
  try {
    const logs = await dbService.getRecentAuditLogs(100);
    return res.json({ success: true, count: logs.length, logs });
  } catch (err: unknown) {
    return res.status(500).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.post('/security/audit-event', async (req, res) => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
    const { action, status, details } = req.body || {};
    if (!action) return res.status(400).json({ success: false, error: 'Thiếu trường action' });

    await dbService.recordAuditLog({
      action: String(action),
      ip: clientIp,
      status: status === 'FAILURE' || status === 'BLOCKED' ? status : 'SUCCESS',
      userAgent: req.headers['user-agent'],
      details: typeof details === 'object' ? details : {},
    });
    return res.json({ success: true });
  } catch (err: unknown) {
    return res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// AI Copilot
apiRouter.post('/ai/clinic-copilot', async (req, res) => {
  try {
    const {
      action,
      query,
      currentPatient,
      allPatientsSummary,
      currentPrescription,
      allPrescriptionsCount,
      pharmacyCatalogSummary,
      vitals,
      diagnosis,
      symptoms,
    } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ text: null, reason: 'NO_API_KEY' });
    }

    const ai = new GoogleGenAI({});
    const anonymizedPatientCode = currentPatient?.patientCode || 'BN-NOI-BO';
    const patientAge = currentPatient?.birthYear
      ? new Date().getFullYear() - Number(currentPatient.birthYear)
      : '---';
    const chronicList = currentPatient?.chronicConditions || currentPatient?.medicalHistory || [];

    const contextPrompt = `
=== DỮ LIỆU PHÒNG KHÁM BÁC SĨ TRẦN VĂN DIỆU (ẨN DANH PII THEO NĐ 13/2023/NĐ-CP & HIPAA) ===
Bác sĩ phụ trách: Bác Sĩ Trần Văn Diệu (CCHN: 04512/HCM-CCHN, Trưởng Phòng Khám Nội Khoa)
Tổng số bệnh nhân đang quản lý: ${allPatientsSummary?.totalPatients || 'Nhiều'} bệnh nhân
Tổng số đơn thuốc đã lưu trữ: ${allPrescriptionsCount || 'Nhiều'} đơn
Danh mục thuốc sẵn có trong kho phòng khám (44+ loại thuốc):
${pharmacyCatalogSummary || 'Amlor, Lipitor, Glucophage, Nexium, Augmentin, v.v.'}

=== THÔNG TIN LÂM SÀNG BỆNH NHÂN ĐANG KHÁM (MÃ: ${anonymizedPatientCode}) ===
- Năm sinh: ${currentPatient?.birthYear || '---'} (${patientAge} tuổi), Giới tính: ${currentPatient?.gender === 'nam' ? 'Nam' : 'Nữ'}
- Tiền sử bệnh lý: ${chronicList.join(', ') || 'Không có'}
- Dị ứng: ${(currentPatient?.allergies || []).join(', ') || 'Không ghi nhận'}
- Sinh hiệu: HA: ${vitals?.bloodPressure || 'Chưa đo'} mmHg | Mạch: ${vitals?.pulse || 'Chưa đo'} ck/phút | Cân nặng: ${vitals?.weight || 'Chưa đo'} kg
- Triệu chứng: ${symptoms || 'Khám sức khỏe định kỳ'}
- Chẩn đoán: ${diagnosis || 'Chưa chẩn đoán'}
- Các thuốc trong đơn:
${(currentPrescription || [])
  .map((m: any, idx: number) => {
    const morning = m.dosage?.morning ?? m.morning ?? 0;
    const noon = m.dosage?.noon ?? m.noon ?? 0;
    const afternoon = m.dosage?.afternoon ?? m.afternoon ?? 0;
    const evening = m.dosage?.evening ?? m.evening ?? 0;
    return `${idx + 1}. ${m.name} ${m.strength || ''}: Sáng ${morning}, Trưa ${noon}, Chiều ${afternoon}, Tối ${evening} - ${m.instructions || ''}`;
  })
  .join('\n') || 'Chưa có thuốc nào trong đơn'}

=== YÊU CẦU TỪ BÁC SĨ TRẦN VĂN DIỆU ===
Hành động: ${action}
Nội dung: ${query || 'Phân tích dữ liệu lâm sàng toàn diện'}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contextPrompt,
      config: {
        systemInstruction:
          'Bạn là Trợ lý AI Cố vấn Lâm sàng Cấp cao của Bác Sĩ Trần Văn Diệu tại Phòng Khám Nội Khoa BS. Diệu. ' +
          'Nhiệm vụ: 1. Cảnh báo tương tác thuốc và chống chỉ định. ' +
          '2. Ưu tiên gợi ý thuốc CÓ SẴN trong danh mục phòng khám. ' +
          '3. Hỗ trợ tra cứu chẩn đoán phân biệt và phác đồ chuẩn Bộ Y Tế. ' +
          'Trả lời bằng phong cách chuyên môn y khoa chính xác, súc tích, phân mục rõ ràng.',
      },
    });

    res.json({ text: response.text });
  } catch (err: unknown) {
    console.error('Gemini Copilot API error:', err);
    res.status(200).json({ text: null, error: (err as Error).message });
  }
});

// AI Assistant Legacy
apiRouter.post('/ai/assistant', async (req, res) => {
  try {
    const { action, diagnosis, symptoms, patientName, patientAge, allergies, medications, question } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(200).json({ text: null, reason: 'NO_API_KEY' });
    }

    const ai = new GoogleGenAI({});
    let prompt = '';
    if (action === 'check_interactions') {
      prompt = `Kiểm tra tương tác thuốc cho Bác sĩ Trần Văn Diệu:\n- Danh sách thuốc: ${(medications || []).join(', ')}\n- Bệnh nhân: ${patientName || 'Bệnh nhân'} (${patientAge || 60} tuổi)\n- Tiền sử dị ứng: ${(allergies || []).join(', ')}\n- Chẩn đoán: ${diagnosis || 'Chưa rõ'}\nHãy phân tích tương tác đối kháng, chống chỉ định và hướng dẫn liều dùng.`;
    } else if (action === 'suggest_rx') {
      prompt = `Gợi ý phác đồ điều trị cho Bác Sĩ Trần Văn Diệu:\n- Chẩn đoán: ${diagnosis}\n- Triệu chứng: ${symptoms || 'Khám tổng quát'}\n- Dị ứng: ${(allergies || []).join(', ')}`;
    } else {
      prompt = `Bác Sĩ Trần Văn Diệu hỏi: ${question || 'Hướng dẫn dược lý lâm sàng'}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Bạn là Trợ lý AI Y Khoa đắc lực của Bác Sĩ Trần Văn Diệu tại Phòng Khám BS. Diệu. Trả lời bằng tiếng Việt y khoa chuẩn mực, súc tích.',
      },
    });

    res.json({ text: response.text });
  } catch (err: unknown) {
    res.status(200).json({ text: null, error: (err as Error).message });
  }
});

// Tra cứu thuốc theo Dược Thư
apiRouter.post('/ai/lookup-drug', async (req, res) => {
  try {
    const { drugName } = req.body;
    if (!drugName || typeof drugName !== 'string') {
      return res.status(400).json({ error: 'Missing drugName' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ data: null, reason: 'NO_API_KEY' });
    }

    const ai = new GoogleGenAI({});
    const prompt = `Tra cứu thông tin biệt dược lâm sàng "${drugName}" theo Dược Thư Quốc Gia Việt Nam.
Trả về DUY NHẤT một chuỗi JSON hợp lệ:
{
  "name": "${drugName}",
  "activeIngredient": "Tên hoạt chất",
  "strength": "Hàm lượng",
  "form": "Dạng bào chế",
  "unit": "viên hoặc gói",
  "category": "Nhóm dược lý",
  "defaultDosage": { "morning": 1, "noon": 0, "afternoon": 0, "evening": 0, "timing": "sau_an" },
  "defaultDurationDays": 7,
  "defaultInstructions": "Cách uống",
  "warningNote": "Lưu ý an toàn"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json', temperature: 0.1 },
    });

    try {
      const parsed = JSON.parse(response.text || '{}');
      return res.json({ data: parsed });
    } catch {
      return res.json({ data: null, rawText: response.text });
    }
  } catch (err: unknown) {
    res.status(200).json({ data: null, error: (err as Error).message });
  }
});

// Crawler Bot APIs
apiRouter.get('/crawler/status', (_req, res) => {
  try {
    res.json({ success: true, ...crawlerService.getStatus() });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.get('/crawler/pending', (_req, res) => {
  try {
    res.json({ success: true, items: crawlerService.getPendingItems() });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.post('/crawler/settings', (req, res) => {
  try {
    res.json({ success: true, settings: crawlerService.updateSettings(req.body) });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.post('/crawler/run', async (req, res) => {
  try {
    const { clinicCatalogNames } = req.body || {};
    const result = await crawlerService.runCrawl('manual', clinicCatalogNames || []);
    res.json({ success: true, ...result });
  } catch (err: unknown) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.post('/crawler/approve', (req, res) => {
  try {
    const { id, customEdits } = req.body;
    if (!id) return res.status(400).json({ success: false, error: 'Thiếu ID thuốc' });
    res.json({ success: true, item: crawlerService.approveItem(id, customEdits) });
  } catch (err: unknown) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.post('/crawler/approve-all', (_req, res) => {
  try {
    const approvedList = crawlerService.approveAllPending();
    res.json({ success: true, count: approvedList.length, items: approvedList });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.post('/crawler/reject', (req, res) => {
  try {
    const { id, reason } = req.body;
    if (!id) return res.status(400).json({ success: false, error: 'Thiếu ID thuốc' });
    res.json({ success: true, item: crawlerService.rejectItem(id, reason) });
  } catch (err: unknown) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.post('/crawler/reject-all', (_req, res) => {
  try {
    const count = crawlerService.rejectAllPending();
    res.json({ success: true, count });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.put('/crawler/item/:id', (req, res) => {
  try {
    res.json({ success: true, item: crawlerService.updatePendingItem(req.params.id, req.body) });
  } catch (err: unknown) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

// Vercel Cron Job: Daily Maintenance (chạy dưới 30s)
apiRouter.get('/cron/daily-maintenance', async (_req, res) => {
  try {
    const pingResult = await dbService.pingDatabase();
    const { data } = await dbService.getClinicData();
    const catalogCount = (data?.pharmacyCatalog as unknown[])?.length || 0;

    let crawlResult = null;
    try {
      crawlResult = await crawlerService.runCrawl('scheduled', []);
    } catch (crawlErr) {
      console.warn('[Cron] Lỗi crawler nhẹ trong cron maintenance:', crawlErr);
    }

    return res.json({
      success: true,
      job: 'daily-maintenance',
      antiPause: pingResult,
      currentCatalogCount: catalogCount,
      crawlResult,
      executedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// Clinic Sync (Cloud & Local Hybrid)
apiRouter.get('/clinic/sync', async (req, res) => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
    const clientEtag = req.headers['if-none-match'];

    const { data, etag } = await dbService.getClinicData();

    if (clientEtag && clientEtag === etag) {
      return res.status(304).end();
    }

    res.setHeader('ETag', etag);

    dbService.recordAuditLog({
      action: 'CLINIC_SYNC_PULL',
      ip: clientIp,
      status: 'SUCCESS',
      userAgent: req.headers['user-agent'],
      details: {
        patientsCount: (data?.patients as unknown[])?.length || 0,
        prescriptionsCount: (data?.prescriptions as unknown[])?.length || 0,
      },
    });

    return res.json({ success: true, hasServerData: Boolean(data), data, etag });
  } catch (err: unknown) {
    return res.status(500).json({ success: false, error: (err as Error).message });
  }
});

apiRouter.post('/clinic/sync', async (req, res) => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
    const result = await dbService.saveClinicData(req.body || {});

    dbService.recordAuditLog({
      action: 'CLINIC_SYNC_PUSH',
      ip: clientIp,
      status: 'SUCCESS',
      userAgent: req.headers['user-agent'],
      details: {
        updatedAt: result.updatedAt,
        etag: result.etag,
      },
    });

    res.setHeader('ETag', result.etag);
    return res.json({ success: true, updatedAt: result.updatedAt, etag: result.etag });
  } catch (err: unknown) {
    return res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// Mount router under BOTH /api and / to handle all routing environments seamlessly
app.use('/api', apiRouter);
app.use('/', apiRouter);
