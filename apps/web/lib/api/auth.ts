import { apiClient } from './client';
import type { User } from '../types';
import type { AgentSpecialty } from './agents';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: 'BUYER' | 'DEVELOPER' | 'AGENT' | 'INVESTOR' | 'TENANT';
  companyName?: string;
  /** Agent accounts only — all three are required when role is AGENT. */
  agentKind?: 'COMPANY' | 'INDIVIDUAL';
  displayName?: string;
  specialties?: AgentSpecialty[];
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface MeResponse {
  user: User;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<AuthResponse>('/auth/login', payload, { skipAuth: true }),

  register: (payload: RegisterPayload) =>
    apiClient.post<{ message: string }>('/auth/register', payload, { skipAuth: true }),

  logout: () => apiClient.post<void>('/auth/logout'),

  refresh: () =>
    apiClient.post<{ accessToken: string }>('/auth/refresh', undefined, {
      skipAuth: true,
    }),

  me: () => apiClient.get<User>('/auth/me'),

  verifyEmail: (token: string) =>
    apiClient.get<{ message: string }>(`/auth/verify-email?token=${token}`, { skipAuth: true }),

  sendVerificationCode: (email: string) =>
    apiClient.post<{ message: string }>('/auth/send-verification-code', { email }, { skipAuth: true }),

  verifyCode: (email: string, code: string) =>
    apiClient.post<{ message: string }>('/auth/verify-code', { email, code }, { skipAuth: true }),

  forgotPassword: (email: string) =>
    apiClient.post<{ message: string }>('/auth/forgot-password', { email }, { skipAuth: true }),

  resetPassword: (token: string, password: string) =>
    apiClient.post<{ message: string }>('/auth/reset-password', { token, password }, { skipAuth: true }),

  updateProfile: (payload: { firstName?: string; lastName?: string; phone?: string; avatarUrl?: string }) =>
    apiClient.patch<User>('/auth/me', payload),
};
