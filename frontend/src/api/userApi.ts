import api from './axiosConfig'
import type { User, UserStatus } from '@/types/auth.types'

export interface UserFilters {
  status?: UserStatus; accountType?: string; search?: string; page?: number; size?: number
}
export interface PagedResponse<T> {
  content: T[]; totalElements: number; totalPages: number; number: number; size: number
}

export const userApi = {
  list:       (params: UserFilters) =>
    api.get<{ data: PagedResponse<User> }>('/users', { params }),
  getById:    (id: number) =>
    api.get<{ data: User }>(`/users/${id}`),
  update:     (id: number, data: Partial<User>) =>
    api.put<{ data: User }>(`/users/${id}`, data),
  updateStatus: (id: number, status: UserStatus) =>
    api.patch<{ data: User }>(`/users/${id}/status`, { status }),
  assignRole: (userId: number, roleId: number) =>
    api.post<{ data: User }>(`/users/${userId}/roles/${roleId}`),
  revokeRole: (userId: number, roleId: number) =>
    api.delete<{ data: User }>(`/users/${userId}/roles/${roleId}`),
}
