import crypto from 'crypto';

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
 * Verify Master Admin credentials
 */
export function verifyMasterAdmin(emailOrUser: string, pass: string): boolean {
  const adminEmail = (process.env.ADMIN_EMAIL || 'tranminhhuy3031998@gmail.com').toLowerCase().trim();
  const inputUser = emailOrUser.toLowerCase().trim();

  // Allow login by either full email or username
  const isMatchUser = inputUser === adminEmail || inputUser === 'admin' || inputUser === 'bstranvandieu';
  if (!isMatchUser) return false;

  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || 'DieuClinic@2026!';
  const customHash = process.env.ADMIN_PASSWORD_HASH;

  if (customHash) {
    const computedHash = crypto.createHash('sha256').update(pass).digest('hex');
    if (computedHash === customHash) return true;
  }

  // Fallback to initial password
  return pass === initialPassword || pass === 'DieuClinic@2026!';
}
