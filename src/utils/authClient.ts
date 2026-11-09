import { ClinicUser, UserRole, UserStatus } from '../types/auth';

const TOKEN_KEY = 'mediba_auth_token_v3';
const USER_KEY = 'mediba_auth_user_v3';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): ClinicUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: ClinicUser): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
}

export function clearSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('mediba_google_user_v2');
    localStorage.removeItem('mediba_consultation_draft');
    localStorage.removeItem('mediba_quick_patient_draft');
    sessionStorage.clear();
  } catch {}
}

export function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-clinic-auth-token'] = token;
  }
  return headers;
}

export async function loginAdmin(emailOrUsername: string, password: string): Promise<{
  success: boolean;
  token?: string;
  user?: ClinicUser;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/login-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername, password }),
    });
    const json = await res.json();
    if (res.ok && json.success && json.token && json.user) {
      setSession(json.token, json.user);
    }
    return json;
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi kết nối tới máy chủ' };
  }
}

export async function loginGoogle(payload: {
  credential?: string;
  email?: string;
  name?: string;
  picture?: string;
}): Promise<{
  success: boolean;
  status?: UserStatus;
  token?: string;
  user?: ClinicUser;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.ok && json.success && json.token && json.user) {
      setSession(json.token, json.user);
    } else if (json.user) {
      // Store user info even if pending so UI can show details
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(json.user));
      } catch {}
    }
    return json;
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi kết nối tới máy chủ Google Auth' };
  }
}

export async function fetchMe(): Promise<{ success: boolean; user?: ClinicUser; error?: string }> {
  try {
    const token = getStoredToken();
    if (!token) return { success: false, error: 'NO_TOKEN' };

    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders(),
    });
    if (res.status === 401 || res.status === 403) {
      const errJson = await res.json().catch(() => ({}));
      return { success: false, error: errJson.error || 'UNAUTHORIZED' };
    }
    const json = await res.json();
    if (json.success && json.user) {
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(json.user));
      } catch {}
    }
    return json;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchUsers(): Promise<ClinicUser[]> {
  try {
    const res = await fetch('/api/auth/users', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.users || [];
  } catch {
    return [];
  }
}

export async function approveUser(
  email: string,
  status: UserStatus,
  role?: UserRole
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/auth/approve-user', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, status, role }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function preApproveUser(
  email: string,
  fullName: string,
  role: UserRole
): Promise<{ success: boolean; user?: ClinicUser; error?: string }> {
  try {
    const res = await fetch('/api/auth/pre-approve', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, fullName, role }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteUser(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/auth/user', {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi kết nối máy chủ' };
  }
}
