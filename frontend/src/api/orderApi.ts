import api from './axiosConfig'
import type { PagedResponse } from './userApi'
import type { Order, OrderCreateRequest, OrderFilters, OrderStatus } from '@/types/order.types'

export const orderApi = {
  create:  (data: OrderCreateRequest) =>
    api.post<{ data: Order }>('/orders', data),
  list:    (params: OrderFilters) =>
    api.get<{ data: PagedResponse<Order> }>('/orders', { params }),
  getById: (id: number) =>
    api.get<{ data: Order }>(`/orders/${id}`),
  updateStatus: (id: number, status: OrderStatus) =>
    api.patch<{ data: Order }>(`/orders/${id}/status`, { status }),
}
