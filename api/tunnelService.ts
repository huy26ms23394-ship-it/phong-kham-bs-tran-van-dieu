import os from 'os';
import fs from 'fs';
import { spawn, ChildProcess, execSync } from 'child_process';

export type TunnelStatus = 'STOPPED' | 'STARTING' | 'ACTIVE' | 'ERROR';

export interface NetworkAndTunnelStatus {
  lanIp: string;
  lanUrls: string[];
  localUrl: string;
  port: number;
  tunnel: {
    status: TunnelStatus;
    publicUrl: string | null;
    tunnelType: 'QUICK_TUNNEL' | 'NAMED_TUNNEL';
    startedAt: string | null;
    pid: number | null;
    error: string | null;
    recentLogs: string[];
  };
  sqlite: {
    enabled: boolean;
    dbPath: string;
    sizeBytes: number;
    walMode: boolean;
  };
}

class TunnelService {
  private static instance: TunnelService;
  private process: ChildProcess | null = null;
  private status: TunnelStatus = 'STOPPED';
  private publicUrl: string | null = null;
  private startedAt: string | null = null;
  private lastError: string | null = null;
  private recentLogs: string[] = [];
  private activePort: number = Number(process.env.PORT) || 3000;

  private constructor() {
    // Đảm bảo tắt tiến trình cloudflared khi tắt server Node
    const cleanup = () => {
      this.stopTunnel();
    };
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);
  }

  public static getInstance(): TunnelService {
    if (!TunnelService.instance) {
      TunnelService.instance = new TunnelService();
    }
    return TunnelService.instance;
  }

  public setPort(port: number): void {
    this.activePort = port;
  }

  public getPort(): number {
    return this.activePort;
  }

  /**
   * Quét toàn bộ địa chỉ IPv4 mạng LAN nội bộ (Wi-Fi / Ethernet), ưu tiên HOST_LAN_IP khi chạy trong Docker
   */
  public getLanAddresses(port: number = this.activePort): { primaryIp: string; lanUrls: string[] } {
    const interfaces = os.networkInterfaces();
    const ips: string[] = [];
    const dockerBridgePrefixes = ['172.17.', '172.18.', '172.19.', '172.20.'];

    const hostLanIp = process.env.HOST_LAN_IP?.trim();
    if (hostLanIp) {
      ips.push(hostLanIp);
    }

    for (const name of Object.keys(interfaces)) {
      const netList = interfaces[name];
      if (!netList) continue;
      for (const net of netList) {
        if (net.family === 'IPv4' && !net.internal) {
          if (dockerBridgePrefixes.some((prefix) => net.address.startsWith(prefix))) {
            continue;
          }
          // Ưu tiên dải mạng gia đình/phòng khám 192.168.x.x, 10.x.x.x
          if (net.address.startsWith('192.168.') && !hostLanIp) {
            ips.unshift(net.address);
          } else {
            ips.push(net.address);
          }
        }
      }
    }

    const uniqueIps = Array.from(new Set(ips));
    const primaryIp = uniqueIps[0] || '127.0.0.1';
    const lanUrls = uniqueIps.map((ip) => `http://${ip}:${port}`);

    return { primaryIp, lanUrls };
  }

  private pushLog(line: string): void {
    const trimmed = line.trim();
    if (!trimmed) return;
    this.recentLogs.push(`[${new Date().toLocaleTimeString('vi-VN')}] ${trimmed}`);
    if (this.recentLogs.length > 35) {
      this.recentLogs.shift();
    }
  }

  /**
   * Kiểm tra một đường dẫn binary cloudflared có chạy hợp lệ với spawn() không (chống lỗi spawn EFTYPE / ENOENT)
   */
  private isBinaryValid(binCandidate: string): boolean {
    try {
      if (!fs.existsSync(binCandidate)) return false;
      const stat = fs.statSync(binCandidate);
      // File cloudflared thực thi chuẩn phải lớn hơn 10MB
      if (stat.size < 10 * 1024 * 1024) return false;
      execSync(`"${binCandidate}" --version`, { stdio: 'ignore', timeout: 5000, windowsHide: true });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Đảm bảo có sẵn binary cloudflared hợp lệ (ưu tiên bản hệ thống Winget/Linux -> bản local node_modules -> tự tải lại nếu hỏng)
   */
  private async resolveCloudflaredBinary(): Promise<string> {
    // 1. Ưu tiên kiểm tra đường dẫn tuyệt đối của bản cài đặt chính thức trên hệ thống (Windows Winget / Linux Docker / macOS)
    const systemCandidates =
      process.platform === 'win32'
        ? [
            'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe',
            'C:\\Program Files\\cloudflared\\cloudflared.exe',
          ]
        : [
            '/usr/local/bin/cloudflared',
            '/usr/bin/cloudflared',
            '/opt/homebrew/bin/cloudflared',
          ];

    for (const candidate of systemCandidates) {
      if (this.isBinaryValid(candidate)) {
        this.pushLog(`Sử dụng cloudflared hệ thống: ${candidate}`);
        return candidate;
      }
    }

    // 2. Kiểm tra binary trong node_modules/cloudflared và tự chữa lành nếu bị hỏng (EFTYPE)
    try {
      const cfModule = await import('cloudflared');
      const binPath = cfModule.bin;

      if (fs.existsSync(binPath) && !this.isBinaryValid(binPath)) {
        this.pushLog('Phát hiện cloudflared.exe nội bộ bị lỗi/tải dở (EFTYPE). Đang xóa và tải lại bản chuẩn...');
        try {
          fs.unlinkSync(binPath);
        } catch {
          // ignore unlink error
        }
      }

      if (!fs.existsSync(binPath)) {
        this.pushLog('Đang tải công cụ Cloudflare Tunnel (cloudflared binary) bản chuẩn...');
        await cfModule.install(binPath);
        this.pushLog('Đã tải xong cloudflared binary!');
      }

      if (this.isBinaryValid(binPath)) {
        this.pushLog(`Sử dụng cloudflared nội bộ dự án: ${binPath}`);
        return binPath;
      }
    } catch (err) {
      this.pushLog(`Fallback tìm cloudflared trong hệ thống: ${(err as Error).message}`);
    }

    return 'cloudflared';
  }

  /**
   * Khởi chạy tiến trình ngầm Cloudflare Tunnel và bắt đường dẫn https://*.trycloudflare.com
   */
  public async startTunnel(targetPort?: number): Promise<{
    success: boolean;
    status: TunnelStatus;
    publicUrl: string | null;
    error?: string;
  }> {
    if (targetPort) {
      this.activePort = targetPort;
    }

    if (this.status === 'ACTIVE' && this.publicUrl && this.process) {
      return {
        success: true,
        status: this.status,
        publicUrl: this.publicUrl,
      };
    }

    if (this.status === 'STARTING' && this.process) {
      // Đợi thêm nếu đang khởi tạo
      const waitedUrl = await this.waitForUrl(10000);
      return {
        success: Boolean(waitedUrl),
        status: this.status,
        publicUrl: this.publicUrl,
        error: this.lastError || undefined,
      };
    }

    // Dọn tiến trình cũ nếu còn sót
    this.stopTunnel();

    this.status = 'STARTING';
    this.publicUrl = null;
    this.lastError = null;
    this.recentLogs = [];

    try {
      const binPath = await this.resolveCloudflaredBinary();
      const customToken = process.env.CLOUDFLARE_TUNNEL_TOKEN?.trim();
      const localTarget = `http://127.0.0.1:${this.activePort}`;

      const args = customToken
        ? ['tunnel', '--no-autoupdate', 'run', '--token', customToken]
        : ['tunnel', '--no-autoupdate', '--url', localTarget];

      this.pushLog(`Khởi chạy Cloudflare Tunnel tới ${localTarget}...`);

      const child = spawn(binPath, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      });

      this.process = child;

      const urlRegex = /(https:\/\/(?!api\.trycloudflare\.com)[a-zA-Z0-9-]+\.trycloudflare\.com)/i;

      const handleOutput = (chunk: Buffer) => {
        const text = chunk.toString('utf-8');
        const lines = text.split(/\r?\n/);
        for (const line of lines) {
          if (line.trim()) {
            this.pushLog(line);
          }
          const match = line.match(urlRegex);
          if (match && match[1]) {
            this.publicUrl = match[1];
            this.status = 'ACTIVE';
            this.startedAt = new Date().toISOString();
            console.log(`\n🌐 [Cloudflare Tunnel ACTIVE] Đường dẫn truy cập từ xa: ${this.publicUrl}\n`);
          }
        }

        // Nếu dùng Named Tunnel có token riêng và đã kết nối thành công
        if (customToken && (text.includes('Registered tunnel connection') || text.includes('Connection') && text.includes('registered'))) {
          this.status = 'ACTIVE';
          this.startedAt = this.startedAt || new Date().toISOString();
          this.publicUrl = process.env.CLOUDFLARE_PUBLIC_HOSTNAME || 'https://named-tunnel-active.cloudflare.com';
        }
      };

      child.stdout?.on('data', handleOutput);
      child.stderr?.on('data', handleOutput);

      child.on('error', (err) => {
        this.status = 'ERROR';
        this.lastError = `Không thể khởi chạy cloudflared: ${err.message}`;
        this.pushLog(`LỖI: ${this.lastError}`);
        this.process = null;
      });

      child.on('close', (code) => {
        if (this.status !== 'STOPPED') {
          this.pushLog(`Tiến trình cloudflared đã dừng (mã: ${code}).`);
          this.status = 'STOPPED';
          this.publicUrl = null;
          this.startedAt = null;
        }
        this.process = null;
      });

      // Chờ tối đa 15 giây để nhận URL từ Cloudflare
      const detectedUrl = await this.waitForUrl(15000);
      const currentStatus = this.status as TunnelStatus;
      if (detectedUrl) {
        return {
          success: true,
          status: 'ACTIVE',
          publicUrl: detectedUrl,
        };
      }

      if (currentStatus === 'ERROR') {
        return {
          success: false,
          status: 'ERROR',
          publicUrl: null,
          error: this.lastError || 'Lỗi khởi tạo kết nối Cloudflare Tunnel.',
        };
      }

      return {
        success: true,
        status: currentStatus,
        publicUrl: this.publicUrl,
        error: 'Tunnel đang thiết lập kết nối, vui lòng chờ thêm vài giây...',
      };
    } catch (err: unknown) {
      this.status = 'ERROR';
      this.lastError = (err as Error).message;
      return {
        success: false,
        status: 'ERROR',
        publicUrl: null,
        error: this.lastError,
      };
    }
  }

  private waitForUrl(timeoutMs: number): Promise<string | null> {
    return new Promise((resolve) => {
      const start = Date.now();
      const timer = setInterval(() => {
        if (this.publicUrl && this.status === 'ACTIVE') {
          clearInterval(timer);
          resolve(this.publicUrl);
          return;
        }
        if (this.status === 'ERROR' || this.status === 'STOPPED') {
          clearInterval(timer);
          resolve(null);
          return;
        }
        if (Date.now() - start >= timeoutMs) {
          clearInterval(timer);
          resolve(this.publicUrl);
        }
      }, 250);
    });
  }

  /**
   * Ngắt ngay lập tức tiến trình cloudflared để đóng kết nối Internet
   */
  public stopTunnel(): { success: boolean; status: TunnelStatus } {
    const proc = this.process;
    this.status = 'STOPPED';
    this.publicUrl = null;
    this.startedAt = null;
    this.lastError = null;
    this.process = null;

    if (proc) {
      try {
        if (process.platform === 'win32' && proc.pid) {
          try {
            execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
          } catch {
            proc.kill('SIGTERM');
          }
        } else {
          proc.kill('SIGTERM');
        }
        this.pushLog('Đã ngắt kết nối Cloudflare Tunnel an toàn.');
      } catch (err) {
        console.warn('[TunnelService] Lỗi khi dừng tiến trình cloudflared:', err);
      }
    }

    return {
      success: true,
      status: 'STOPPED',
    };
  }

  public getStatus(sqliteInfo?: { enabled: boolean; dbPath: string; sizeBytes: number; walMode: boolean }): NetworkAndTunnelStatus {
    const { primaryIp, lanUrls } = this.getLanAddresses(this.activePort);
    const hasToken = Boolean(process.env.CLOUDFLARE_TUNNEL_TOKEN?.trim());

    return {
      lanIp: primaryIp,
      lanUrls,
      localUrl: `http://localhost:${this.activePort}`,
      port: this.activePort,
      tunnel: {
        status: this.status,
        publicUrl: this.publicUrl,
        tunnelType: hasToken ? 'NAMED_TUNNEL' : 'QUICK_TUNNEL',
        startedAt: this.startedAt,
        pid: this.process?.pid || null,
        error: this.lastError,
        recentLogs: this.recentLogs,
      },
      sqlite: sqliteInfo || {
        enabled: true,
        dbPath: 'server_data/clinic.sqlite',
        sizeBytes: 0,
        walMode: true,
      },
    };
  }
}

export const tunnelService = TunnelService.getInstance();
