import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import pg from 'pg';

const { Pool } = pg;

export interface ClinicSyncPayload {
  clinicInfo?: Record<string, unknown>;
  patients?: unknown[];
  prescriptions?: unknown[];
  pharmacyCatalog?: unknown[];
  prescriptionTemplate?: unknown[];
  updatedAt?: string;
  version?: number;
  [key: string]: unknown;
}

export interface AuditLogEntry {
  timestamp: string;
  action: string;
  ip: string;
  status: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  userAgent?: string;
  userEmail?: string;
  details?: Record<string, unknown>;
}

export type UserRole = 'SUPER_ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PHARMACIST';
export type UserStatus = 'APPROVED' | 'PENDING' | 'REVOKED';

export interface AuthorizedUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: UserRole;
  status: UserStatus;
  requested_at: string;
  approved_by?: string;
  updated_at?: string;
}

export class DatabaseService {
  private static instance: DatabaseService;
  private readonly dataDir: string;
  private readonly clinicDbFile: string;
  private readonly rootClinicDbFile: string;
  private readonly auditLogsFile: string;

  private pgPool: pg.Pool | null = null;
  private isPgConnected: boolean = false;
  private isTableInitialized: boolean = false;

  private readonly supabaseUrl?: string;
  private readonly supabaseKey?: string;
  private localUsers: Map<string, AuthorizedUser> = new Map();
  private localAdminPasswordHash: string | null = null;

  private constructor() {
    this.dataDir = process.env.VERCEL ? '/tmp/server_data' : path.resolve(process.cwd(), 'server_data');
    this.clinicDbFile = path.join(this.dataDir, 'clinic_db.json');
    this.rootClinicDbFile = path.resolve(process.cwd(), 'server_data', 'clinic_db.json');
    this.auditLogsFile = path.join(this.dataDir, 'audit_logs.jsonl');

    const adminEmail = (process.env.ADMIN_EMAIL || 'tranminhhuy3031998@gmail.com').toLowerCase().trim();
    this.localUsers.set(adminEmail, {
      id: 'usr_admin_master',
      email: adminEmail,
      full_name: 'Bác Sĩ Trần Văn Diệu (Master Admin)',
      role: 'SUPER_ADMIN',
      status: 'APPROVED',
      requested_at: new Date().toISOString(),
      approved_by: 'SYSTEM_INITIAL',
      updated_at: new Date().toISOString(),
    });

    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (dbUrl) {
      try {
        let connectionString = dbUrl;
        try {
          // Xóa tham số sslmode khỏi connection string để tránh pg-connection-string ghi đè thành ssl: true
          const parsed = new URL(dbUrl);
          parsed.searchParams.delete('sslmode');
          parsed.searchParams.delete('ssl');
          connectionString = parsed.toString();
        } catch {}

        this.pgPool = new Pool({
          connectionString,
          ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
          max: 5,
          idleTimeoutMillis: 10000,
          connectionTimeoutMillis: 5000,
        });
        this.isPgConnected = true;
      } catch (err) {
        console.warn('[DatabaseService] Không thể kết nối DATABASE_URL, sẽ fallback:', err);
      }
    }

    this.supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!process.env.VERCEL) {
      this.ensureLocalDir();
    }
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private ensureLocalDir(): void {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
    } catch (err) {
      console.warn('[DatabaseService] Không thể tạo thư mục server_data:', err);
    }
  }

  public generateETag(data: unknown): string {
    const raw = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto.createHash('md5').update(raw).digest('hex');
  }

  /**
   * Khởi tạo bảng Cloud DB (clinic_store, audit_logs) và tự động nạp seed data
   */
  public async ensureCloudTables(): Promise<void> {
    if (!this.pgPool || this.isTableInitialized) return;

    try {
      await this.pgPool.query(`
        CREATE TABLE IF NOT EXISTS clinic_store (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          etag TEXT,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      await this.pgPool.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id BIGSERIAL PRIMARY KEY,
          timestamp TIMESTAMPTZ,
          action TEXT,
          ip TEXT,
          status TEXT,
          user_agent TEXT,
          details JSONB
        );
      `);

      await this.pgPool.query(`
        CREATE TABLE IF NOT EXISTS authorized_users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          full_name TEXT,
          avatar_url TEXT,
          role TEXT DEFAULT 'DOCTOR',
          status TEXT DEFAULT 'PENDING',
          requested_at TIMESTAMPTZ DEFAULT NOW(),
          approved_by TEXT,
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          password_hash TEXT
        );
        ALTER TABLE authorized_users ADD COLUMN IF NOT EXISTS password_hash TEXT;
      `);

      const adminEmail = (process.env.ADMIN_EMAIL || 'tranminhhuy3031998@gmail.com').toLowerCase().trim();
      await this.pgPool.query(
        `INSERT INTO authorized_users (id, email, full_name, role, status, requested_at, approved_by, updated_at)
         VALUES ($1, $2, $3, 'SUPER_ADMIN', 'APPROVED', NOW(), 'SYSTEM_INITIAL', NOW())
         ON CONFLICT (email) DO UPDATE SET role = 'SUPER_ADMIN', status = 'APPROVED'`,
        ['usr_admin_master', adminEmail, 'Bác Sĩ Trần Văn Diệu (Master Admin)']
      );

      // Kiểm tra seed data
      const checkRes = await this.pgPool.query(`SELECT id FROM clinic_store WHERE id = 'default' LIMIT 1`);
      if (checkRes.rowCount === 0) {
        let seedData: ClinicSyncPayload = {
          clinicInfo: {},
          patients: [],
          prescriptions: [],
          pharmacyCatalog: [],
          updatedAt: new Date().toISOString(),
          version: 1,
        };

        const targetSeedFile = fs.existsSync(this.clinicDbFile)
          ? this.clinicDbFile
          : fs.existsSync(this.rootClinicDbFile)
          ? this.rootClinicDbFile
          : null;

        if (targetSeedFile) {
          try {
            seedData = JSON.parse(fs.readFileSync(targetSeedFile, 'utf-8'));
          } catch {}
        }

        const etag = this.generateETag(seedData);
        await this.pgPool.query(
          `INSERT INTO clinic_store (id, data, etag, updated_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT (id) DO NOTHING`,
          ['default', JSON.stringify(seedData), etag]
        );
        console.log('[DatabaseService] Đã nạp seed data vào Cloud Database thành công!');
      }

      this.isTableInitialized = true;
    } catch (err) {
      console.error('[DatabaseService] Lỗi khi tạo bảng Cloud DB:', err);
    }
  }

  /**
   * Đọc dữ liệu phòng khám (Postgres -> Supabase REST -> Local Fallback)
   */
  public async getClinicData(): Promise<{ data: ClinicSyncPayload | null; etag: string }> {
    // 1. Ưu tiên PostgreSQL Pool
    if (this.pgPool) {
      try {
        await this.ensureCloudTables();
        const res = await this.pgPool.query(`SELECT data, etag FROM clinic_store WHERE id = 'default' LIMIT 1`);
        if (res.rowCount && res.rows[0]) {
          const rowData = res.rows[0].data as ClinicSyncPayload;
          const etag = res.rows[0].etag || this.generateETag(rowData);
          return { data: rowData, etag };
        }
      } catch (err) {
        console.error('[DatabaseService] Lỗi đọc Postgres, thử tiếp fallback:', err);
      }
    }

    // 2. Thử Supabase REST API
    if (this.supabaseUrl && this.supabaseKey) {
      try {
        const res = await fetch(`${this.supabaseUrl}/rest/v1/clinic_store?id=eq.default&select=*`, {
          headers: {
            apikey: this.supabaseKey,
            Authorization: `Bearer ${this.supabaseKey}`,
          },
        });
        if (res.ok) {
          const rows = (await res.json()) as Array<{ data: ClinicSyncPayload; etag?: string }>;
          if (rows && rows.length > 0) {
            const data = rows[0].data;
            const etag = rows[0].etag || this.generateETag(data);
            return { data, etag };
          }
        }
      } catch (err) {
        console.error('[DatabaseService] Lỗi đọc Supabase REST:', err);
      }
    }

    // 3. Fallback đọc Local JSON File
    try {
      const targetFile = fs.existsSync(this.clinicDbFile)
        ? this.clinicDbFile
        : fs.existsSync(this.rootClinicDbFile)
        ? this.rootClinicDbFile
        : null;
      if (targetFile) {
        const raw = fs.readFileSync(targetFile, 'utf-8');
        const data = JSON.parse(raw) as ClinicSyncPayload;
        const etag = this.generateETag(data);
        return { data, etag };
      }
    } catch (err) {
      console.error('[DatabaseService] Lỗi đọc clinic_db.json local:', err);
    }

    return { data: null, etag: '' };
  }

  /**
   * Lưu dữ liệu phòng khám
   */
  public async saveClinicData(rawIncoming: Partial<ClinicSyncPayload> | { data: Partial<ClinicSyncPayload> }): Promise<{ success: boolean; updatedAt: string; etag: string }> {
    const incoming = (rawIncoming as any)?.data ? (rawIncoming as any).data : rawIncoming;
    const current = (await this.getClinicData()).data || {};
    const updatedAt = new Date().toISOString();
    const version = ((current.version as number) || 0) + 1;

    const merged: ClinicSyncPayload = {
      ...current,
      ...(incoming.clinicInfo !== undefined ? { clinicInfo: incoming.clinicInfo } : {}),
      ...(incoming.patients !== undefined ? { patients: incoming.patients } : {}),
      ...(incoming.prescriptions !== undefined ? { prescriptions: incoming.prescriptions } : {}),
      ...(incoming.pharmacyCatalog !== undefined ? { pharmacyCatalog: incoming.pharmacyCatalog } : {}),
      ...(incoming.prescriptionTemplate !== undefined ? { prescriptionTemplate: incoming.prescriptionTemplate } : {}),
      updatedAt,
      version,
    };

    const etag = this.generateETag(merged);

    // 1. Lưu qua PostgreSQL
    if (this.pgPool) {
      try {
        await this.ensureCloudTables();
        await this.pgPool.query(
          `INSERT INTO clinic_store (id, data, etag, updated_at) 
           VALUES ($1, $2, $3, NOW()) 
           ON CONFLICT (id) DO UPDATE SET data = $2, etag = $3, updated_at = NOW()`,
          ['default', JSON.stringify(merged), etag]
        );
        return { success: true, updatedAt, etag };
      } catch (err) {
        console.error('[DatabaseService] Lỗi lưu Postgres:', err);
      }
    }

    // 2. Lưu qua Supabase REST
    if (this.supabaseUrl && this.supabaseKey) {
      try {
        await fetch(`${this.supabaseUrl}/rest/v1/clinic_store?on_conflict=id`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: this.supabaseKey,
            Authorization: `Bearer ${this.supabaseKey}`,
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            id: 'default',
            data: merged,
            etag,
            updated_at: updatedAt,
          }),
        });
        return { success: true, updatedAt, etag };
      } catch (err) {
        console.error('[DatabaseService] Lỗi lưu Supabase REST:', err);
      }
    }

    // 3. Fallback lưu Local File
    if (!process.env.VERCEL) {
      try {
        this.ensureLocalDir();
        fs.writeFileSync(this.clinicDbFile, JSON.stringify(merged, null, 2), 'utf-8');
      } catch (err) {
        console.error('[DatabaseService] Lỗi lưu file local:', err);
      }
    }

    return { success: true, updatedAt, etag };
  }

  /**
   * Ghi Audit Log an ninh theo Nghị định 333/2026/NĐ-CP
   */
  public async recordAuditLog(event: {
    action: string;
    ip: string;
    status: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
    userAgent?: string;
    details?: Record<string, unknown>;
  }): Promise<void> {
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      action: event.action,
      ip: event.ip,
      status: event.status,
      userAgent: event.userAgent || 'Client',
      details: event.details || {},
    };

    // Lưu vào Postgres
    if (this.pgPool) {
      try {
        await this.ensureCloudTables();
        await this.pgPool.query(
          `INSERT INTO audit_logs (timestamp, action, ip, status, user_agent, details)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [entry.timestamp, entry.action, entry.ip, entry.status, entry.userAgent, JSON.stringify(entry.details)]
        );
        return;
      } catch (err) {
        console.error('[DatabaseService] Lỗi ghi Audit Log Postgres:', err);
      }
    }

    // Lưu qua Supabase REST
    if (this.supabaseUrl && this.supabaseKey) {
      try {
        await fetch(`${this.supabaseUrl}/rest/v1/audit_logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: this.supabaseKey,
            Authorization: `Bearer ${this.supabaseKey}`,
          },
          body: JSON.stringify(entry),
        });
        return;
      } catch (err) {}
    }

    // Fallback lưu local file jsonl
    if (!process.env.VERCEL) {
      try {
        this.ensureLocalDir();
        fs.appendFileSync(this.auditLogsFile, JSON.stringify(entry) + '\n', 'utf-8');
      } catch (err) {
        console.error('[DatabaseService] Lỗi ghi file audit local:', err);
      }
    }
  }

  /**
   * Lấy danh sách Audit Logs gần nhất
   */
  public async getRecentAuditLogs(limit: number = 100): Promise<AuditLogEntry[]> {
    if (this.pgPool) {
      try {
        await this.ensureCloudTables();
        const res = await this.pgPool.query(
          `SELECT timestamp, action, ip, status, user_agent as "userAgent", details 
           FROM audit_logs 
           ORDER BY timestamp DESC 
           LIMIT $1`,
          [limit]
        );
        return res.rows as AuditLogEntry[];
      } catch (err) {
        console.error('[DatabaseService] Lỗi lấy Audit Logs Postgres:', err);
      }
    }

    if (this.supabaseUrl && this.supabaseKey) {
      try {
        const res = await fetch(`${this.supabaseUrl}/rest/v1/audit_logs?order=timestamp.desc&limit=${limit}`, {
          headers: {
            apikey: this.supabaseKey,
            Authorization: `Bearer ${this.supabaseKey}`,
          },
        });
        if (res.ok) {
          return (await res.json()) as AuditLogEntry[];
        }
      } catch (err) {}
    }

    try {
      if (fs.existsSync(this.auditLogsFile)) {
        const raw = fs.readFileSync(this.auditLogsFile, 'utf-8');
        const lines = raw.trim().split('\n').filter(Boolean);
        const logs: AuditLogEntry[] = [];
        for (let i = lines.length - 1; i >= 0 && logs.length < limit; i--) {
          try {
            logs.push(JSON.parse(lines[i]));
          } catch {}
        }
        return logs;
      }
    } catch (err) {
      console.error('[DatabaseService] Lỗi đọc audit_logs.jsonl:', err);
    }

    return [];
  }

  /**
   * Ping Cloud Database để chống ngủ đông (Anti-Pause) cho Supabase / Cloud Postgres Free Tier
   */
  public async pingDatabase(): Promise<{ success: boolean; message: string; timestamp: string }> {
    const now = new Date().toISOString();
    let lastError = '';
    if (this.pgPool) {
      try {
        await this.ensureCloudTables();
        const res = await this.pgPool.query(`SELECT NOW() as current_time, count(*) as count FROM clinic_store`);
        return {
          success: true,
          message: `PostgreSQL Ping OK (${res.rows[0]?.current_time || now})`,
          timestamp: now,
        };
      } catch (err: any) {
        console.warn('[DatabaseService] pgPool ping failed, attempting Supabase REST fallback:', err.message);
        lastError = err.message;
      }
    }

    if (this.supabaseUrl && this.supabaseKey) {
      try {
        const res = await fetch(`${this.supabaseUrl}/rest/v1/clinic_store?select=id,updated_at&limit=1`, {
          headers: {
            apikey: this.supabaseKey,
            Authorization: `Bearer ${this.supabaseKey}`,
          },
        });
        if (res.ok) {
          return { success: true, message: 'Supabase REST Ping OK', timestamp: now };
        }
        return { success: false, message: `Supabase REST HTTP ${res.status}`, timestamp: now };
      } catch (err: any) {
        return { success: false, message: `Supabase Ping error: ${err.message}`, timestamp: now };
      }
    }

    return {
      success: !lastError,
      message: lastError ? `PostgreSQL Ping error: ${lastError}` : 'Local storage active (no cloud DB configured)',
      timestamp: now,
    };
  }

  /**
   * Lấy thông tin tài khoản theo email
   */
  public async getAuthorizedUser(rawEmail: string): Promise<AuthorizedUser | null> {
    const email = rawEmail.toLowerCase().trim();
    if (this.pgPool) {
      try {
        await this.ensureCloudTables();
        const res = await this.pgPool.query(
          `SELECT id, email, full_name, avatar_url, role, status, requested_at, approved_by, updated_at 
           FROM authorized_users WHERE LOWER(email) = $1 LIMIT 1`,
          [email]
        );
        if (res.rowCount && res.rows[0]) {
          return res.rows[0] as AuthorizedUser;
        }
      } catch (err) {
        console.error('[DatabaseService] Lỗi getAuthorizedUser Postgres:', err);
      }
    }

    if (this.supabaseUrl && this.supabaseKey) {
      try {
        const res = await fetch(`${this.supabaseUrl}/rest/v1/authorized_users?email=ilike.${encodeURIComponent(email)}&select=*`, {
          headers: {
            apikey: this.supabaseKey,
            Authorization: `Bearer ${this.supabaseKey}`,
          },
        });
        if (res.ok) {
          const rows = await res.json();
          if (rows && rows.length > 0) return rows[0] as AuthorizedUser;
        }
      } catch (err) {}
    }

    return this.localUsers.get(email) || null;
  }

  /**
   * Thêm hoặc cập nhật tài khoản
   */
  public async upsertAuthorizedUser(user: {
    email: string;
    full_name?: string;
    avatar_url?: string;
    role?: UserRole;
    status?: UserStatus;
    approved_by?: string;
  }): Promise<AuthorizedUser> {
    const email = user.email.toLowerCase().trim();
    const existing = await this.getAuthorizedUser(email);
    const now = new Date().toISOString();
    const id = existing?.id || `usr_${crypto.randomBytes(6).toString('hex')}`;
    const role: UserRole = user.role || existing?.role || 'DOCTOR';
    const status: UserStatus = user.status || existing?.status || 'PENDING';
    const full_name = user.full_name || existing?.full_name || '';
    const avatar_url = user.avatar_url || existing?.avatar_url || '';
    const approved_by = user.approved_by || existing?.approved_by;

    const record: AuthorizedUser = {
      id,
      email,
      full_name,
      avatar_url,
      role,
      status,
      requested_at: existing?.requested_at || now,
      approved_by,
      updated_at: now,
    };

    if (this.pgPool) {
      try {
        await this.ensureCloudTables();
        await this.pgPool.query(
          `INSERT INTO authorized_users (id, email, full_name, avatar_url, role, status, requested_at, approved_by, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
           ON CONFLICT (email) DO UPDATE SET 
             full_name = EXCLUDED.full_name,
             avatar_url = EXCLUDED.avatar_url,
             role = EXCLUDED.role,
             status = EXCLUDED.status,
             approved_by = EXCLUDED.approved_by,
             updated_at = NOW()`,
          [record.id, record.email, record.full_name, record.avatar_url, record.role, record.status, record.requested_at, record.approved_by]
        );
      } catch (err) {
        console.error('[DatabaseService] Lỗi upsertAuthorizedUser Postgres:', err);
      }
    }

    if (this.supabaseUrl && this.supabaseKey) {
      try {
        await fetch(`${this.supabaseUrl}/rest/v1/authorized_users?on_conflict=email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: this.supabaseKey,
            Authorization: `Bearer ${this.supabaseKey}`,
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify(record),
        });
      } catch (err) {}
    }

    this.localUsers.set(email, record);
    return record;
  }

  /**
   * Liệt kê tất cả tài khoản
   */
  public async listAuthorizedUsers(): Promise<AuthorizedUser[]> {
    if (this.pgPool) {
      try {
        await this.ensureCloudTables();
        const res = await this.pgPool.query(
          `SELECT id, email, full_name, avatar_url, role, status, requested_at, approved_by, updated_at 
           FROM authorized_users 
           ORDER BY 
             CASE status WHEN 'PENDING' THEN 1 WHEN 'APPROVED' THEN 2 ELSE 3 END,
             requested_at DESC`
        );
        return res.rows as AuthorizedUser[];
      } catch (err) {
        console.error('[DatabaseService] Lỗi listAuthorizedUsers Postgres:', err);
      }
    }

    if (this.supabaseUrl && this.supabaseKey) {
      try {
        const res = await fetch(`${this.supabaseUrl}/rest/v1/authorized_users?order=status.asc,requested_at.desc`, {
          headers: {
            apikey: this.supabaseKey,
            Authorization: `Bearer ${this.supabaseKey}`,
          },
        });
        if (res.ok) {
          return (await res.json()) as AuthorizedUser[];
        }
      } catch (err) {}
    }

    return Array.from(this.localUsers.values());
  }

  /**
   * Cập nhật trạng thái duyệt / vai trò của người dùng
   */
  public async updateUserStatus(email: string, status: UserStatus, role?: UserRole, approvedBy?: string): Promise<boolean> {
    const user = await this.getAuthorizedUser(email);
    if (!user) return false;
    await this.upsertAuthorizedUser({
      email,
      status,
      role: role || user.role,
      approved_by: approvedBy || 'ADMIN',
    });
    return true;
  }

  /**
   * Nhập trước (Pre-approve) email người thân
   */
  public async preApproveUser(email: string, fullName: string, role: UserRole, approvedBy: string): Promise<AuthorizedUser> {
    return this.upsertAuthorizedUser({
      email,
      full_name: fullName,
      role,
      status: 'APPROVED',
      approved_by: approvedBy,
    });
  }

  /**
   * Thu hồi hoặc xóa tài khoản
   */
  public async deleteAuthorizedUser(rawEmail: string): Promise<boolean> {
    const email = rawEmail.toLowerCase().trim();
    if (this.pgPool) {
      try {
        await this.ensureCloudTables();
        await this.pgPool.query(`DELETE FROM authorized_users WHERE LOWER(email) = $1`, [email]);
      } catch (err) {
        console.error('[DatabaseService] Lỗi deleteAuthorizedUser Postgres:', err);
      }
    }
    this.localUsers.delete(email);
    return true;
  }

  /**
   * Lấy mã hash mật khẩu quản trị viên Master Admin từ Supabase / Postgres
   */
  public async getAdminPasswordHash(): Promise<string | null> {
    const adminEmail = (process.env.ADMIN_EMAIL || 'tranminhhuy3031998@gmail.com').toLowerCase().trim();
    if (this.pgPool) {
      try {
        await this.ensureCloudTables();
        const res = await this.pgPool.query(
          `SELECT password_hash FROM authorized_users WHERE LOWER(email) = $1 LIMIT 1`,
          [adminEmail]
        );
        if (res.rows[0]?.password_hash) {
          return res.rows[0].password_hash;
        }
      } catch (err) {
        console.warn('[DatabaseService] Lỗi đọc password_hash PG:', err);
      }
    }

    if (this.supabaseUrl && this.supabaseKey) {
      try {
        const res = await fetch(
          `${this.supabaseUrl}/rest/v1/authorized_users?email=ilike.${encodeURIComponent(adminEmail)}&select=password_hash`,
          {
            headers: {
              apikey: this.supabaseKey,
              Authorization: `Bearer ${this.supabaseKey}`,
            },
          }
        );
        if (res.ok) {
          const list = await res.json();
          if (list[0]?.password_hash) {
            return list[0].password_hash;
          }
        }
      } catch (err) {
        console.warn('[DatabaseService] Lỗi đọc password_hash Supabase:', err);
      }
    }

    return this.localAdminPasswordHash;
  }

  /**
   * Cập nhật mật khẩu mới cho Master Admin lên Supabase / Postgres
   */
  public async setAdminPasswordHash(hash: string): Promise<boolean> {
    const adminEmail = (process.env.ADMIN_EMAIL || 'tranminhhuy3031998@gmail.com').toLowerCase().trim();
    this.localAdminPasswordHash = hash;

    if (this.pgPool) {
      try {
        await this.ensureCloudTables();
        await this.pgPool.query(
          `UPDATE authorized_users SET password_hash = $1, updated_at = NOW() WHERE LOWER(email) = $2`,
          [hash, adminEmail]
        );
      } catch (err) {
        console.error('[DatabaseService] Lỗi lưu password_hash PG:', err);
      }
    }

    if (this.supabaseUrl && this.supabaseKey) {
      try {
        await fetch(
          `${this.supabaseUrl}/rest/v1/authorized_users?email=ilike.${encodeURIComponent(adminEmail)}`,
          {
            method: 'PATCH',
            headers: {
              apikey: this.supabaseKey,
              Authorization: `Bearer ${this.supabaseKey}`,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({ password_hash: hash, updated_at: new Date().toISOString() }),
          }
        );
      } catch (err) {
        console.error('[DatabaseService] Lỗi lưu password_hash Supabase:', err);
      }
    }

    return true;
  }

  public getStorageStatus(): { mode: 'CLOUD' | 'LOCAL'; provider: string } {
    if (this.isPgConnected) {
      return { mode: 'CLOUD', provider: 'PostgreSQL / Neon Database' };
    }
    if (this.supabaseUrl && this.supabaseKey) {
      return { mode: 'CLOUD', provider: 'Supabase REST API' };
    }
    return { mode: 'LOCAL', provider: 'Local File System (server_data/)' };
  }
}

export const dbService = DatabaseService.getInstance();
