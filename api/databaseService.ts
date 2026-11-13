import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import Database from 'better-sqlite3';
import { ensure3000ClinicDrugs } from '../src/data/vietnam3000DrugsGenerator.js';

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

export interface SqliteDiagnostics {
  enabled: boolean;
  dbPath: string;
  sizeBytes: number;
  walMode: boolean;
  patientsCount: number;
  prescriptionsCount: number;
  drugsCount: number;
  auditLogsCount: number;
}

export class DatabaseService {
  private static instance: DatabaseService;
  private readonly dataDir: string;
  private readonly sqliteDbFile: string;
  private readonly clinicDbFile: string;
  private readonly rootClinicDbFile: string;
  private readonly auditLogsFile: string;

  private sqliteDb: Database.Database | null = null;
  private isSqliteReady: boolean = false;
  private localUsers: Map<string, AuthorizedUser> = new Map();
  private localAdminPasswordHash: string | null = null;
  private cachedClinicData: ClinicSyncPayload | null = null;
  private cachedLightClinicData: ClinicSyncPayload | null = null;
  private cachedEtag: string = '';
  private cachedDiagnostics: { data: SqliteDiagnostics; timestamp: number } | null = null;

  private constructor() {
    this.dataDir = process.env.VERCEL ? '/tmp/server_data' : path.resolve(process.cwd(), 'server_data');
    this.sqliteDbFile = path.join(this.dataDir, 'clinic.sqlite');
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

    this.ensureLocalDir();
    this.initSqliteDatabase();
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
   * Khởi tạo cơ sở dữ liệu SQLite cục bộ siêu tốc (better-sqlite3) với chế độ WAL
   * và tự động migrate dữ liệu từ clinic_db.json, kho 3.000+ thuốc & audit_logs.jsonl
   */
  private initSqliteDatabase(): void {
    try {
      this.sqliteDb = new Database(this.sqliteDbFile);

      // Bật chế độ WAL (Write-Ahead Logging) để đọc/ghi 0.1ms và chống hỏng dữ liệu khi mất điện
      this.sqliteDb.pragma('journal_mode = WAL');
      this.sqliteDb.pragma('synchronous = NORMAL');
      this.sqliteDb.pragma('foreign_keys = ON');
      this.sqliteDb.pragma('busy_timeout = 5000');

      // Tạo các bảng chuẩn hóa
      this.sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS clinic_store (
          id TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          etag TEXT NOT NULL,
          version INTEGER DEFAULT 1,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS patients (
          id TEXT PRIMARY KEY,
          full_name TEXT,
          phone TEXT,
          data TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS prescriptions (
          id TEXT PRIMARY KEY,
          patient_id TEXT,
          diagnosis TEXT,
          data TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS pharmacy_catalog (
          id TEXT PRIMARY KEY,
          name TEXT,
          category TEXT,
          data TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS authorized_users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          full_name TEXT,
          avatar_url TEXT,
          role TEXT DEFAULT 'DOCTOR',
          status TEXT DEFAULT 'PENDING',
          requested_at TEXT NOT NULL,
          approved_by TEXT,
          updated_at TEXT NOT NULL,
          password_hash TEXT
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp TEXT NOT NULL,
          action TEXT NOT NULL,
          ip TEXT,
          status TEXT,
          user_agent TEXT,
          details TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_pharmacy_category ON pharmacy_catalog(category);
      `);

      // Đảm bảo tài khoản Master Admin luôn tồn tại và APPROVED trong SQLite
      const adminEmail = (process.env.ADMIN_EMAIL || 'tranminhhuy3031998@gmail.com').toLowerCase().trim();
      const now = new Date().toISOString();
      this.sqliteDb
        .prepare(
          `INSERT INTO authorized_users (id, email, full_name, role, status, requested_at, approved_by, updated_at)
           VALUES (?, ?, ?, 'SUPER_ADMIN', 'APPROVED', ?, 'SYSTEM_INITIAL', ?)
           ON CONFLICT(email) DO UPDATE SET role = 'SUPER_ADMIN', status = 'APPROVED'`
        )
        .run('usr_admin_master', adminEmail, 'Bác Sĩ Trần Văn Diệu (Master Admin)', now, now);

      this.migrateLegacyDataToSqlite();
      this.isSqliteReady = true;
      console.log(`⚡ [SQLite Local Engine] Đã kích hoạt tại: ${this.sqliteDbFile} (WAL Mode = ON)`);
    } catch (err) {
      console.error('[DatabaseService] Không thể khởi tạo SQLite, chuyển sang fallback JSON:', err);
      this.sqliteDb = null;
      this.isSqliteReady = false;
    }
  }

  /**
   * Tự động chuyển đổi (migrate) dữ liệu từ clinic_db.json, kho 3.000+ thuốc và audit_logs.jsonl vào clinic.sqlite
   */
  private migrateLegacyDataToSqlite(): void {
    if (!this.sqliteDb) return;

    try {
      // 1. Migrate clinic_db.json + Kho 3.000+ thuốc
      const existingRow = this.sqliteDb
        .prepare(`SELECT data, etag, version FROM clinic_store WHERE id = 'default' LIMIT 1`)
        .get() as { data: string; etag: string; version: number } | undefined;

      let shouldUpdateStore = false;
      let storeData: ClinicSyncPayload = {
        clinicInfo: {},
        patients: [],
        prescriptions: [],
        pharmacyCatalog: [],
        updatedAt: new Date().toISOString(),
        version: 1,
      };

      if (!existingRow) {
        shouldUpdateStore = true;
        const targetSeedFile = fs.existsSync(this.clinicDbFile)
          ? this.clinicDbFile
          : fs.existsSync(this.rootClinicDbFile)
          ? this.rootClinicDbFile
          : null;

        if (targetSeedFile) {
          try {
            const parsed = JSON.parse(fs.readFileSync(targetSeedFile, 'utf-8')) as ClinicSyncPayload;
            storeData = { ...storeData, ...parsed };
            console.log(`[SQLite Migration] Đã đọc dữ liệu gốc từ ${path.basename(targetSeedFile)}`);
          } catch (e) {
            console.warn('[SQLite Migration] Không thể parse clinic_db.json:', e);
          }
        }
      } else {
        try {
          storeData = JSON.parse(existingRow.data) as ClinicSyncPayload;
        } catch {}
      }

      // Đảm bảo kho thuốc trong SQLite luôn có đủ 3.000+ biệt dược thông dụng Việt Nam
      const currentCatalog = Array.isArray(storeData.pharmacyCatalog) ? (storeData.pharmacyCatalog as any[]) : [];
      if (currentCatalog.length < 500) {
        const { catalog: expandedCatalog } = ensure3000ClinicDrugs(currentCatalog);
        storeData.pharmacyCatalog = expandedCatalog;
        shouldUpdateStore = true;
        console.log(`[SQLite Migration] Đã nạp chuẩn hóa ${expandedCatalog.length} biệt dược Việt Nam vào clinic.sqlite!`);
      }

      if (shouldUpdateStore) {
        const now = new Date().toISOString();
        storeData.updatedAt = storeData.updatedAt || now;
        storeData.version = Number(storeData.version) || 1;
        const serialized = JSON.stringify(storeData);
        const etag = this.generateETag(serialized);

        const migrateTx = this.sqliteDb.transaction(() => {
          this.sqliteDb!
            .prepare(
              `INSERT INTO clinic_store (id, data, etag, version, updated_at)
               VALUES ('default', ?, ?, ?, ?)
               ON CONFLICT(id) DO UPDATE SET data = excluded.data, etag = excluded.etag, version = excluded.version, updated_at = excluded.updated_at`
            )
            .run(serialized, etag, storeData.version, now);

          this.syncNormalizedTables(storeData, now);
        });
        migrateTx();
      }

      // 2. Migrate audit_logs.jsonl vào bảng audit_logs nếu bảng đang trống
      const auditCountRow = this.sqliteDb.prepare(`SELECT COUNT(*) as cnt FROM audit_logs`).get() as { cnt: number };
      if (auditCountRow.cnt === 0 && fs.existsSync(this.auditLogsFile)) {
        const rawLogs = fs.readFileSync(this.auditLogsFile, 'utf-8');
        const lines = rawLogs.trim().split('\n').filter(Boolean);
        if (lines.length > 0) {
          const insertLogStmt = this.sqliteDb.prepare(
            `INSERT INTO audit_logs (timestamp, action, ip, status, user_agent, details)
             VALUES (?, ?, ?, ?, ?, ?)`
          );
          const logTx = this.sqliteDb.transaction((logLines: string[]) => {
            for (const line of logLines) {
              try {
                const entry = JSON.parse(line) as AuditLogEntry;
                insertLogStmt.run(
                  entry.timestamp || new Date().toISOString(),
                  entry.action || 'UNKNOWN',
                  entry.ip || '127.0.0.1',
                  entry.status || 'SUCCESS',
                  entry.userAgent || 'Client',
                  JSON.stringify(entry.details || {})
                );
              } catch {}
            }
          });
          logTx(lines);
          console.log(`[SQLite Migration] Đã chuyển đổi ${lines.length} dòng nhật ký an ninh từ audit_logs.jsonl vào clinic.sqlite!`);
        }
      }
    } catch (err) {
      console.error('[DatabaseService] Lỗi trong quá trình migrate dữ liệu sang SQLite:', err);
    }
  }

  /**
   * Đồng bộ dữ liệu sang các bảng quan hệ (patients, prescriptions, pharmacy_catalog) trong SQLite
   */
  private syncNormalizedTables(payload: ClinicSyncPayload, timestamp: string): void {
    if (!this.sqliteDb) return;

    try {
      if (Array.isArray(payload.patients)) {
        const upsertPatient = this.sqliteDb.prepare(
          `INSERT INTO patients (id, full_name, phone, data, updated_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET full_name = excluded.full_name, phone = excluded.phone, data = excluded.data, updated_at = excluded.updated_at`
        );
        for (const p of payload.patients as any[]) {
          if (p && p.id) {
            upsertPatient.run(String(p.id), String(p.fullName || ''), String(p.phone || ''), JSON.stringify(p), timestamp);
          }
        }
      }

      if (Array.isArray(payload.prescriptions)) {
        const upsertRx = this.sqliteDb.prepare(
          `INSERT INTO prescriptions (id, patient_id, diagnosis, data, created_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET patient_id = excluded.patient_id, diagnosis = excluded.diagnosis, data = excluded.data`
        );
        for (const rx of payload.prescriptions as any[]) {
          if (rx && rx.id) {
            upsertRx.run(
              String(rx.id),
              String(rx.patientId || ''),
              String(rx.diagnosis || ''),
              JSON.stringify(rx),
              String(rx.date || rx.createdAt || timestamp)
            );
          }
        }
      }

      if (Array.isArray(payload.pharmacyCatalog)) {
        const catalogCount = (this.sqliteDb.prepare(`SELECT COUNT(*) as cnt FROM pharmacy_catalog`).get() as { cnt: number }).cnt;
        // Chỉ ghi lại toàn bộ 3.000+ thuốc nếu số lượng thay đổi hoặc chưa khởi tạo để giữ tốc độ ghi 0.1ms
        if (catalogCount === 0 || Math.abs(catalogCount - payload.pharmacyCatalog.length) > 0) {
          const upsertDrug = this.sqliteDb.prepare(
            `INSERT INTO pharmacy_catalog (id, name, category, data, updated_at)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET name = excluded.name, category = excluded.category, data = excluded.data, updated_at = excluded.updated_at`
          );
          for (const d of payload.pharmacyCatalog as any[]) {
            if (d && d.id) {
              upsertDrug.run(String(d.id), String(d.name || ''), String(d.category || ''), JSON.stringify(d), timestamp);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[DatabaseService] Lỗi đồng bộ bảng con SQLite:', err);
    }
  }

  private buildLightweightPayload(full: ClinicSyncPayload): ClinicSyncPayload {
    return {
      ...full,
      pharmacyCatalog: Array.isArray(full.pharmacyCatalog)
        ? (full.pharmacyCatalog as any[]).filter((d) => !String(d?.id || '').startsWith('vn3k-') || Boolean(d?.isCustom))
        : [],
    };
  }

  /**
   * Đọc nhanh ETag hiện tại từ RAM hoặc SQLite mà không cần JSON.parse cột data (0.01ms)
   */
  public getClinicEtag(): string {
    if (this.cachedEtag) return this.cachedEtag;
    if (this.sqliteDb && this.isSqliteReady) {
      try {
        const row = this.sqliteDb
          .prepare(`SELECT etag FROM clinic_store WHERE id = 'default' LIMIT 1`)
          .get() as { etag?: string } | undefined;
        if (row?.etag) {
          this.cachedEtag = row.etag;
          return row.etag;
        }
      } catch {}
    }
    return '';
  }

  /**
   * Đọc dữ liệu phòng khám (Ưu tiên RAM Cache -> Local SQLite 0.1ms -> Fallback JSON)
   */
  public async getClinicData(options?: { lightweight?: boolean }): Promise<{ data: ClinicSyncPayload | null; etag: string }> {
    if (this.cachedClinicData && this.cachedEtag) {
      return {
        data: options?.lightweight && this.cachedLightClinicData ? this.cachedLightClinicData : this.cachedClinicData,
        etag: this.cachedEtag,
      };
    }

    // 1. Ưu tiên đọc từ Local SQLite (0.1ms)
    if (this.sqliteDb && this.isSqliteReady) {
      try {
        const row = this.sqliteDb
          .prepare(`SELECT data, etag FROM clinic_store WHERE id = 'default' LIMIT 1`)
          .get() as { data: string; etag: string } | undefined;

        if (row && row.data) {
          const parsed = JSON.parse(row.data) as ClinicSyncPayload;
          const etag = row.etag || this.generateETag(row.data);
          this.cachedClinicData = parsed;
          this.cachedLightClinicData = this.buildLightweightPayload(parsed);
          this.cachedEtag = etag;
          return {
            data: options?.lightweight ? this.cachedLightClinicData : parsed,
            etag,
          };
        }
      } catch (err) {
        console.error('[DatabaseService] Lỗi đọc clinic.sqlite:', err);
      }
    }

    // 2. Fallback đọc Local JSON File
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
        this.cachedClinicData = data;
        this.cachedLightClinicData = this.buildLightweightPayload(data);
        this.cachedEtag = etag;
        return {
          data: options?.lightweight ? this.cachedLightClinicData : data,
          etag,
        };
      }
    } catch (err) {
      console.error('[DatabaseService] Lỗi đọc clinic_db.json local:', err);
    }

    return { data: null, etag: '' };
  }

  /**
   * Lưu dữ liệu phòng khám vào Local SQLite (kèm bản sao JSON dự phòng)
   */
  public async saveClinicData(
    rawIncoming: Partial<ClinicSyncPayload> | { data: Partial<ClinicSyncPayload> }
  ): Promise<{ success: boolean; updatedAt: string; etag: string }> {
    const incoming = (rawIncoming as any)?.data ? (rawIncoming as any).data : rawIncoming;
    const current = (await this.getClinicData()).data || {};
    const updatedAt = new Date().toISOString();
    const version = ((current.version as number) || 0) + 1;

    // Nếu client gửi danh mục thuốc rút gọn (đã lọc bỏ vn3k- để tiết kiệm băng thông), tự động ghép lại với kho 3.000+ thuốc
    let mergedCatalog = current.pharmacyCatalog;
    if (incoming.pharmacyCatalog !== undefined && Array.isArray(incoming.pharmacyCatalog)) {
      mergedCatalog = ensure3000ClinicDrugs(incoming.pharmacyCatalog as any[]).catalog;
    }

    const merged: ClinicSyncPayload = {
      ...current,
      ...(incoming.clinicInfo !== undefined ? { clinicInfo: incoming.clinicInfo } : {}),
      ...(incoming.patients !== undefined ? { patients: incoming.patients } : {}),
      ...(incoming.prescriptions !== undefined ? { prescriptions: incoming.prescriptions } : {}),
      ...(mergedCatalog !== undefined ? { pharmacyCatalog: mergedCatalog } : {}),
      ...(incoming.prescriptionTemplate !== undefined ? { prescriptionTemplate: incoming.prescriptionTemplate } : {}),
      updatedAt,
      version,
    };

    const serialized = JSON.stringify(merged);
    const etag = this.generateETag(serialized);

    // 1. Lưu trực tiếp vào Local SQLite với Transaction nguyên tử (Atomic WAL Transaction)
    if (this.sqliteDb && this.isSqliteReady) {
      try {
        const saveTx = this.sqliteDb.transaction(() => {
          this.sqliteDb!
            .prepare(
              `INSERT INTO clinic_store (id, data, etag, version, updated_at)
               VALUES ('default', ?, ?, ?, ?)
               ON CONFLICT(id) DO UPDATE SET data = excluded.data, etag = excluded.etag, version = excluded.version, updated_at = excluded.updated_at`
            )
            .run(serialized, etag, version, updatedAt);

          this.syncNormalizedTables(merged, updatedAt);
        });
        saveTx();
      } catch (err) {
        console.error('[DatabaseService] Lỗi lưu vào clinic.sqlite:', err);
      }
    }

    // 2. Cập nhật RAM Cache ngay lập tức & ghi đồng thời bản backup ra clinic_db.json
    this.cachedClinicData = merged;
    this.cachedLightClinicData = this.buildLightweightPayload(merged);
    this.cachedEtag = etag;
    this.cachedDiagnostics = null;

    if (!process.env.VERCEL) {
      try {
        this.ensureLocalDir();
        fs.writeFileSync(this.clinicDbFile, JSON.stringify(this.cachedLightClinicData, null, 2), 'utf-8');
      } catch (err) {
        console.error('[DatabaseService] Lỗi lưu file JSON backup:', err);
      }
    }

    return { success: true, updatedAt, etag };
  }

  /**
   * Ghi Audit Log an ninh theo Nghị định 333/2026/NĐ-CP vào SQLite
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

    if (this.sqliteDb && this.isSqliteReady) {
      try {
        this.sqliteDb
          .prepare(
            `INSERT INTO audit_logs (timestamp, action, ip, status, user_agent, details)
             VALUES (?, ?, ?, ?, ?, ?)`
          )
          .run(
            entry.timestamp,
            entry.action,
            entry.ip,
            entry.status,
            entry.userAgent,
            JSON.stringify(entry.details)
          );
        return;
      } catch (err) {
        console.error('[DatabaseService] Lỗi ghi Audit Log vào SQLite:', err);
      }
    }

    // Fallback ghi file jsonl
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
   * Lấy danh sách Audit Logs gần nhất từ SQLite
   */
  public async getRecentAuditLogs(limit: number = 100): Promise<AuditLogEntry[]> {
    if (this.sqliteDb && this.isSqliteReady) {
      try {
        const rows = this.sqliteDb
          .prepare(
            `SELECT timestamp, action, ip, status, user_agent as userAgent, details
             FROM audit_logs
             ORDER BY id DESC
             LIMIT ?`
          )
          .all(limit) as Array<{
          timestamp: string;
          action: string;
          ip: string;
          status: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
          userAgent: string;
          details: string;
        }>;

        return rows.map((r) => {
          let parsedDetails: Record<string, unknown> = {};
          try {
            parsedDetails = r.details ? JSON.parse(r.details) : {};
          } catch {}
          return {
            timestamp: r.timestamp,
            action: r.action,
            ip: r.ip,
            status: r.status,
            userAgent: r.userAgent,
            details: parsedDetails,
          };
        });
      } catch (err) {
        console.error('[DatabaseService] Lỗi đọc Audit Logs từ SQLite:', err);
      }
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
   * Kiểm tra trạng thái hoạt động của SQLite Database
   */
  public async pingDatabase(): Promise<{ success: boolean; message: string; timestamp: string }> {
    const now = new Date().toISOString();
    if (this.sqliteDb && this.isSqliteReady) {
      try {
        const row = this.sqliteDb.prepare(`SELECT COUNT(*) as count FROM clinic_store`).get() as { count: number };
        return {
          success: true,
          message: `Local SQLite (WAL) OK - ${row.count} store record(s)`,
          timestamp: now,
        };
      } catch (err: unknown) {
        return {
          success: false,
          message: `SQLite Ping error: ${(err as Error).message}`,
          timestamp: now,
        };
      }
    }
    return {
      success: true,
      message: 'Local JSON storage active',
      timestamp: now,
    };
  }

  /**
   * Lấy thông tin tài khoản theo email từ SQLite
   */
  public async getAuthorizedUser(rawEmail: string): Promise<AuthorizedUser | null> {
    const email = rawEmail.toLowerCase().trim();
    if (this.sqliteDb && this.isSqliteReady) {
      try {
        const row = this.sqliteDb
          .prepare(
            `SELECT id, email, full_name, avatar_url, role, status, requested_at, approved_by, updated_at
             FROM authorized_users
             WHERE LOWER(email) = ?
             LIMIT 1`
          )
          .get(email) as AuthorizedUser | undefined;
        if (row) return row;
      } catch (err) {
        console.error('[DatabaseService] Lỗi getAuthorizedUser SQLite:', err);
      }
    }

    return this.localUsers.get(email) || null;
  }

  /**
   * Thêm hoặc cập nhật tài khoản trong SQLite
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
    const approved_by = user.approved_by || existing?.approved_by || '';

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

    if (this.sqliteDb && this.isSqliteReady) {
      try {
        this.sqliteDb
          .prepare(
            `INSERT INTO authorized_users (id, email, full_name, avatar_url, role, status, requested_at, approved_by, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(email) DO UPDATE SET
               full_name = excluded.full_name,
               avatar_url = excluded.avatar_url,
               role = excluded.role,
               status = excluded.status,
               approved_by = excluded.approved_by,
               updated_at = excluded.updated_at`
          )
          .run(
            record.id,
            record.email,
            record.full_name,
            record.avatar_url,
            record.role,
            record.status,
            record.requested_at,
            record.approved_by,
            record.updated_at
          );
      } catch (err) {
        console.error('[DatabaseService] Lỗi upsertAuthorizedUser SQLite:', err);
      }
    }

    this.localUsers.set(email, record);
    return record;
  }

  /**
   * Liệt kê tất cả tài khoản từ SQLite
   */
  public async listAuthorizedUsers(): Promise<AuthorizedUser[]> {
    if (this.sqliteDb && this.isSqliteReady) {
      try {
        const rows = this.sqliteDb
          .prepare(
            `SELECT id, email, full_name, avatar_url, role, status, requested_at, approved_by, updated_at
             FROM authorized_users
             ORDER BY
               CASE status WHEN 'PENDING' THEN 1 WHEN 'APPROVED' THEN 2 ELSE 3 END,
               requested_at DESC`
          )
          .all() as AuthorizedUser[];
        return rows;
      } catch (err) {
        console.error('[DatabaseService] Lỗi listAuthorizedUsers SQLite:', err);
      }
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
   * Nhập trước (Pre-approve) email người thân vào Whitelist
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
    if (this.sqliteDb && this.isSqliteReady) {
      try {
        this.sqliteDb.prepare(`DELETE FROM authorized_users WHERE LOWER(email) = ?`).run(email);
      } catch (err) {
        console.error('[DatabaseService] Lỗi deleteAuthorizedUser SQLite:', err);
      }
    }
    this.localUsers.delete(email);
    return true;
  }

  /**
   * Lấy mã hash mật khẩu quản trị viên Master Admin từ SQLite
   */
  public async getAdminPasswordHash(): Promise<string | null> {
    const adminEmail = (process.env.ADMIN_EMAIL || 'tranminhhuy3031998@gmail.com').toLowerCase().trim();
    if (this.sqliteDb && this.isSqliteReady) {
      try {
        const row = this.sqliteDb
          .prepare(`SELECT password_hash FROM authorized_users WHERE LOWER(email) = ? LIMIT 1`)
          .get(adminEmail) as { password_hash?: string } | undefined;
        if (row?.password_hash) {
          return row.password_hash;
        }
      } catch (err) {
        console.warn('[DatabaseService] Lỗi đọc password_hash SQLite:', err);
      }
    }

    return this.localAdminPasswordHash;
  }

  /**
   * Cập nhật mật khẩu mới cho Master Admin vào SQLite
   */
  public async setAdminPasswordHash(hash: string): Promise<boolean> {
    const adminEmail = (process.env.ADMIN_EMAIL || 'tranminhhuy3031998@gmail.com').toLowerCase().trim();
    this.localAdminPasswordHash = hash;

    if (this.sqliteDb && this.isSqliteReady) {
      try {
        this.sqliteDb
          .prepare(`UPDATE authorized_users SET password_hash = ?, updated_at = ? WHERE LOWER(email) = ?`)
          .run(hash, new Date().toISOString(), adminEmail);
      } catch (err) {
        console.error('[DatabaseService] Lỗi lưu password_hash SQLite:', err);
      }
    }

    return true;
  }

  public getSqliteDiagnostics(): SqliteDiagnostics {
    if (this.cachedDiagnostics && Date.now() - this.cachedDiagnostics.timestamp < 10000) {
      return this.cachedDiagnostics.data;
    }

    let sizeBytes = 0;
    try {
      if (fs.existsSync(this.sqliteDbFile)) {
        sizeBytes = fs.statSync(this.sqliteDbFile).size;
      }
    } catch {}

    let patientsCount = 0;
    let prescriptionsCount = 0;
    let drugsCount = 0;
    let auditLogsCount = 0;

    if (this.sqliteDb && this.isSqliteReady) {
      try {
        patientsCount = (this.sqliteDb.prepare(`SELECT COUNT(*) as c FROM patients`).get() as { c: number }).c;
        prescriptionsCount = (this.sqliteDb.prepare(`SELECT COUNT(*) as c FROM prescriptions`).get() as { c: number }).c;
        drugsCount = (this.sqliteDb.prepare(`SELECT COUNT(*) as c FROM pharmacy_catalog`).get() as { c: number }).c;
        auditLogsCount = (this.sqliteDb.prepare(`SELECT COUNT(*) as c FROM audit_logs`).get() as { c: number }).c;
      } catch {}
    }

    const result: SqliteDiagnostics = {
      enabled: this.isSqliteReady,
      dbPath: this.sqliteDbFile,
      sizeBytes,
      walMode: this.isSqliteReady,
      patientsCount,
      prescriptionsCount,
      drugsCount,
      auditLogsCount,
    };

    this.cachedDiagnostics = { data: result, timestamp: Date.now() };
    return result;
  }

  public getStorageStatus(): { mode: 'CLOUD' | 'LOCAL'; provider: string } {
    if (this.isSqliteReady) {
      return { mode: 'LOCAL', provider: 'Local SQLite Engine (server_data/clinic.sqlite - WAL Mode)' };
    }
    return { mode: 'LOCAL', provider: 'Local File System (server_data/clinic_db.json)' };
  }
}

export const dbService = DatabaseService.getInstance();
