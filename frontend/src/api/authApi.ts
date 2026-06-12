import api from './axiosConfig'
import type { AuthResponse, User } from '@/types/auth.types'

export interface LoginPayload    { email: string; password: string }
export interface RegisterPayload {
  firstName: string; lastName: string; email: string
  password: string; company: string; phone?: string; accountType: string
}

export const authApi = {
  login:     (data: LoginPayload)    => api.post<{ data: AuthResponse }>('/auth/login', data),
  register:  (data: RegisterPayload) => api.post<{ data: User }>('/auth/register', data),
  refresh:   (refreshToken: string)  => api.post<{ data: AuthResponse }>('/auth/refresh', { refreshToken }),
  logout:    (refreshToken: string)  => api.post('/auth/logout', { refreshToken }),
  verifyMfa: (userId: number, totpCode: string) =>
    api.post<{ data: AuthResponse }>('/auth/mfa/verify', { userId, totpCode }),
  setupMfa:  (userId: number) =>
    api.post<{ data: { secret: string; qrCodeUrl: string } }>(`/auth/mfa/setup/${userId}`),
  enableMfa: (userId: number, totpCode: string) =>
    api.post(`/auth/mfa/enable/${userId}`, { totpCode }),
}
