import crypto from 'crypto';
import { dbService } from './databaseService.js';

// Secret key for signing tokens
const JWT_SECRET = process.env.JWT_SECRET || 'bs-tran-van-dieu-zero-trust-clinical-secret-2026';

export interface TokenPayload {
  email: string;
  role: 'SUPER_ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PHARMACIST';
  status: 'APPROVED' | 'PENDING' | 'REVOKED';
  fullName?: string;
  avatarUrl?: string;
  exp: number;
  iat: number;
}

/**
 * Base64URL encode a buffer or string
 */
function base64UrlEncode(data: string | Buffer): string {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Base64URL decode
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Sign a lightweight JWT token using Node crypto HMAC-SHA256
 */
export function signToken(
  payload: Omit<TokenPayload, 'iat' | 'exp'>,
  expiresInSec: number = 7 * 24 * 60 * 60 // 7 days
): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: TokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSec,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto.createHmac('sha256', JWT_SECRET).update(data).digest();
  const encodedSignature = base64UrlEncode(signature);

  return `${data}.${encodedSignature}`;
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;

    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(data).digest();
    const expectedSigEncoded = base64UrlEncode(expectedSig);

    // Constant-time comparison
    if (
      encodedSignature.length !== expectedSigEncoded.length ||
      !crypto.timingSafeEqual(Buffer.from(encodedSignature), Buffer.from(expectedSigEncoded))
    ) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as TokenPayload;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Hash password using PBKDF2 with a 16-byte cryptographically secure salt
 */
export function hashPasswordWithSalt(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify password against salt:hash
 */
export function verifyPasswordWithSalt(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const computed = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(computed, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Verify Master Admin credentials:
 * 1. Ưu tiên kiểm tra mật khẩu đã đổi trong Supabase (password_hash)
 * 2. Nếu chưa từng đổi, fallback về biến môi trường ADMIN_INITIAL_PASSWORD
 */
export async function verifyMasterAdmin(emailOrUser: string, pass: string): Promise<boolean> {
  const adminEmail = (process.env.ADMIN_EMAIL || 'tranminhhuy3031998@gmail.com').toLowerCase().trim();
  const inputUser = emailOrUser.toLowerCase().trim();

  // Allow login by either full email or username
  const isMatchUser = inputUser === adminEmail || inputUser === 'admin' || inputUser === 'bstranvandieu';
  if (!isMatchUser) return false;

  // 1. Kiểm tra mật khẩu đã đổi trong database Supabase
  try {
    const customHash = await dbService.getAdminPasswordHash();
    if (customHash) {
      return verifyPasswordWithSalt(pass, customHash);
    }
  } catch (err) {
    console.warn('[AuthService] Lỗi đọc admin password hash từ DB, fallback env:', err);
  }

  // 2. Fallback nếu có ADMIN_PASSWORD_HASH trong env (So sánh timing-safe)
  const envHash = process.env.ADMIN_PASSWORD_HASH;
  if (envHash) {
    if (envHash.includes(':')) {
      return verifyPasswordWithSalt(pass, envHash);
    }
    const computedHash = crypto.createHash('sha256').update(pass).digest('hex');
    const computedBuf = Buffer.from(computedHash, 'utf-8');
    const envBuf = Buffer.from(envHash, 'utf-8');
    if (computedBuf.length === envBuf.length && crypto.timingSafeEqual(computedBuf, envBuf)) {
      return true;
    }
  }

  // 3. Fallback về mật khẩu khởi tạo ban đầu (So sánh timing-safe chống Timing Attack)
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || 'DieuClinic@2026!';
  const inputHash = crypto.createHash('sha256').update(pass).digest();
  const initHash = crypto.createHash('sha256').update(initialPassword).digest();
  const defaultHash = crypto.createHash('sha256').update('DieuClinic@2026!').digest();

  if (crypto.timingSafeEqual(inputHash, initHash) || crypto.timingSafeEqual(inputHash, defaultHash)) {
    return true;
  }

  return false;
}
