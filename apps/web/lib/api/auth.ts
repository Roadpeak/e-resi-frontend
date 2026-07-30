import { apiClient } from './client';
import type { User } from '../types';

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
  role: 'BUYER' | 'DEVELOPER' | 'INVESTOR' | 'TENANT';
  companyName?: string;
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

  forgotPassword: (email: string) =>
    apiClient.post<{ message: string }>('/auth/forgot-password', { email }, { skipAuth: true }),

  resetPassword: (token: string, password: string) =>
    apiClient.post<{ message: string }>('/auth/reset-password', { token, password }, { skipAuth: true }),

  updateProfile: (payload: { firstName?: string; lastName?: string; phone?: string; avatarUrl?: string }) =>
    apiClient.patch<User>('/auth/me', payload),
};
