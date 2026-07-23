import { apiClient } from './client';
import type { AuthResponse, User } from '../types/auth';

export function signup(input: { email: string; password: string; name?: string }) {
  return apiClient.post<AuthResponse>('/auth/signup', input).then((res) => res.data);
}

export function login(input: { email: string; password: string }) {
  return apiClient.post<AuthResponse>('/auth/login', input).then((res) => res.data);
}

export function logout() {
  return apiClient.post('/auth/logout').then(() => undefined);
}

export function refresh() {
  return apiClient.post<{ accessToken: string }>('/auth/refresh').then((res) => res.data);
}

export function me() {
  return apiClient.get<User>('/auth/me').then((res) => res.data);
}

export function updateProfile(input: { name?: string; currentPassword?: string; newPassword?: string }) {
  return apiClient.patch<User>('/auth/me', input).then((res) => res.data);
}
