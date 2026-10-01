import { apiClient } from './client'

export type EntityType = 'listings' | 'jobs' | 'services' | 'parts' | 'buses' | 'equipment' | 'operators'
export type SortBy = 'newest' | 'price:asc' | 'price:desc' | 'createdAt:desc'

export interface SearchParams {
  q?: string
  entityType?: EntityType
  governorate?: string
  governorateId?: number
  wilayaId?: number
  minPrice?: number
  maxPrice?: number
  condition?: string
  make?: string
  listingType?: string
  sortBy?: SortBy
  page?: number
  limit?: number
}

export const searchApi = {
  search:       (params: SearchParams)      => apiClient.get('/search', { params }),
  autocomplete: (q: string, limit = 8)     => apiClient.get('/search/autocomplete', { params: { q, limit } }),
}
