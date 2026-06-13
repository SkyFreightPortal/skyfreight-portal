import api from './axiosConfig'
import type {
  AvailabilityResult,
  CalendarPricingResult,
  RecommendationResult,
  RouteSearchResult,
  SearchParams,
} from '@/types/search.types'

export const searchApi = {
  routes: (params: SearchParams) =>
    api.get<{ data: RouteSearchResult }>('/search/routes', { params }),
  availability: (params: Pick<SearchParams, 'origin' | 'destination' | 'date'>) =>
    api.get<{ data: AvailabilityResult }>('/search/availability', { params }),
  calendar: (params: Pick<SearchParams, 'origin' | 'destination' | 'serviceType' | 'rateType'> & { startDate?: string; days?: number }) =>
    api.get<{ data: CalendarPricingResult }>('/search/calendar', { params }),
  recommendations: (params: Omit<SearchParams, 'date'>) =>
    api.get<{ data: RecommendationResult }>('/search/recommendations', { params }),
}
