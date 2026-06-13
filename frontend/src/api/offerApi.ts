import api from './axiosConfig'
import type { PagedResponse } from './userApi'
import type { Offer, OfferCreateRequest, OfferFilters, OfferStatus } from '@/types/offer.types'

export const offerApi = {
  create:  (data: OfferCreateRequest) =>
    api.post<{ data: Offer }>('/offers', data),
  list:    (params: OfferFilters) =>
    api.get<{ data: PagedResponse<Offer> }>('/offers', { params }),
  getById: (id: number) =>
    api.get<{ data: Offer }>(`/offers/${id}`),
  revise:  (id: number, data: OfferCreateRequest) =>
    api.post<{ data: Offer }>(`/offers/${id}/revise`, data),
  updateStatus: (id: number, status: OfferStatus) =>
    api.patch<{ data: Offer }>(`/offers/${id}/status`, { status }),
  compare: (ids: number[]) =>
    api.post<{ data: Offer[] }>('/offers/compare', { ids }),
}
