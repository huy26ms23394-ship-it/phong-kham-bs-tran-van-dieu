import { GoogleGenAI } from '@google/genai';

export const GEMINI_MODEL_CHAIN = [
  'gemini-3.5-flash',
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
] as const;

export type GeminiModelName = (typeof GEMINI_MODEL_CHAIN)[number] | 'offline-engine';

export const SYSTEM_INSTRUCTION_VIETNAM_MEDICAL =
  'Bạn là Hội đồng Dược Lâm Sàng & Bác sĩ Nội khoa tại Việt Nam, tuân thủ Dược thư Quốc gia Việt Nam và Phác đồ Bộ Y Tế. ' +
  'Khi tư vấn hoặc tra cứu thuốc, bạn bắt buộc chỉ sử dụng các biệt dược đang lưu hành hợp pháp tại Việt Nam ' +
  '(bao gồm cả thuốc biệt dược gốc như Nexium Mups, Klamentin, Co-Diovan, Forxiga, Januvia, Coversyl, Concor, Crestor, Lipanthyl, Plavix, Daflon, Ginkgo Biloba... ' +
  'và các thuốc Generic phổ biến của DHG Pharma, Stada, Hasan, Imexpharm, Pymepharco, Sanofi VN, AstraZeneca VN...), ' +
  'đi kèm đầy đủ: Tên biệt dược, Hoạt chất (INN), Hàm lượng chính xác, Phân vào đúng 1 trong 11 nhóm thuốc của phòng khám, ' +
  'Liều gợi ý Sáng-Trưa-Chiều-Tối, Thời điểm uống (Trước/Sau ăn), Số đăng ký tham khảo và Giá ước tính (VNĐ). ' +
  'Hệ thống đánh giá qua Ma trận Cảnh báo Y khoa 5 tầng (Tầng 1: Dị ứng, Tầng 2: Tương tác & Trùng hoạt chất, Tầng 3: Bệnh nền & Sinh hiệu, Tầng 4: Liều tối đa 24h & Cách dùng, Tầng 5: Lưu ý & Theo dõi).';

export interface GeminiExecutionResult {
  success: boolean;
  text: string | null;
  model: string;
  latencyMs: number;
  fallbackUsed: boolean;
  attemptedModels: string[];
  error?: string;
  fallbackToOffline?: boolean;
}

export interface GeminiCallOptions {
  prompt: string;
  systemInstruction?: string;
  preferredModel?: string;
  jsonMode?: boolean;
  temperature?: number;
}

/**
 * Thực thi gọi Google Gemini AI với cơ chế Auto-Fallback Chain y khoa:
 * gemini-3.5-flash -> gemini-3.8-flash -> gemini-3.5-flash-lite -> gemini-2.5-flash -> Offline Rules Engine
 * Nhiệt độ mặc định: 0.1 (chuẩn y khoa, chống bịa đặt tên thuốc và hàm lượng)
 */
export async function executeGeminiWithFallback(
  options: GeminiCallOptions
): Promise<GeminiExecutionResult> {
  const {
    prompt,
    systemInstruction = SYSTEM_INSTRUCTION_VIETNAM_MEDICAL,
    preferredModel,
    jsonMode = false,
    temperature = 0.1,
  } = options;

  // Nếu bác sĩ chủ động chọn chế độ Offline Clinical Rules Engine
  if (preferredModel === 'offline-engine') {
    return {
      success: false,
      text: null,
      model: 'offline_clinical_engine',
      latencyMs: 0,
      fallbackUsed: false,
      attemptedModels: ['offline-engine'],
      fallbackToOffline: true,
      error: 'Chế độ Offline Clinical Rules Engine được chọn.',
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    return {
      success: false,
      text: null,
      model: 'offline_clinical_engine',
      latencyMs: 0,
      fallbackUsed: false,
      attemptedModels: [],
      fallbackToOffline: true,
      error: 'GEMINI_API_KEY chưa được cấu hình. Sử dụng Offline Clinical Rules Engine.',
    };
  }

  // Khởi tạo SDK với GEMINI_API_KEY
  const ai = new GoogleGenAI({});

  // Xây dựng danh sách chuỗi model ưu tiên
  let modelSequence: string[] = [...GEMINI_MODEL_CHAIN];
  if (preferredModel && GEMINI_MODEL_CHAIN.includes(preferredModel as any)) {
    modelSequence = [preferredModel, ...GEMINI_MODEL_CHAIN.filter((m) => m !== preferredModel)];
  }

  const initialTargetModel = modelSequence[0];
  const attemptedModels: string[] = [];
  let lastError = '';

  for (const model of modelSequence) {
    attemptedModels.push(model);
    const startMs = Date.now();

    try {
      const config: any = {
        temperature,
      };

      if (jsonMode) {
        config.responseMimeType = 'application/json';
      }

      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config,
      });

      const latencyMs = Date.now() - startMs;
      const text = response.text || '';

      if (text.trim().length > 0) {
        return {
          success: true,
          text,
          model,
          latencyMs,
          fallbackUsed: model !== initialTargetModel,
          attemptedModels,
        };
      }
    } catch (err: unknown) {
      const errMsg = (err as Error).message || String(err);
      lastError = errMsg;
      console.warn(
        `[Gemini Auto-Fallback] Model "${model}" gặp sự cố (${errMsg.slice(0, 150)}). Tự động chuyển đổi sang model kế tiếp trong chuỗi...`
      );
      // Tiếp tục vòng lặp sang model kế tiếp
    }
  }

  // Nếu toàn bộ chuỗi model AI đều gặp sự cố, tự động chuyển sang Offline Clinical Rules Engine (0ms)
  console.warn(
    `[Gemini Auto-Fallback] Toàn bộ chuỗi model ${attemptedModels.join(' -> ')} đều không phản hồi. Tự động chuyển đổi sang Offline Clinical Rules Engine (0ms).`
  );

  return {
    success: false,
    text: null,
    model: 'offline_clinical_engine',
    latencyMs: 0,
    fallbackUsed: true,
    attemptedModels,
    fallbackToOffline: true,
    error: `Lỗi AI: ${lastError}. Đã chuyển sang Offline Clinical Rules Engine (0ms).`,
  };
}
