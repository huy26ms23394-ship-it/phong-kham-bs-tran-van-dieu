export type UserRole = 'SUPER_ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PHARMACIST';
export type UserStatus = 'APPROVED' | 'PENDING' | 'REVOKED';

export interface ClinicUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: UserRole;
  status: UserStatus;
  requested_at?: string;
  approved_by?: string;
  updated_at?: string;
}

export interface AuthSession {
  token: string;
  user: ClinicUser;
}
