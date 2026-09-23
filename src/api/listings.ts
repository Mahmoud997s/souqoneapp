import { apiClient } from './client'
import { Listing } from '../types/listing.types'
import { PaginatedResponse } from '../types/api.types'
import { PaginationMeta } from '../types/my-listings.types'

export const listingsApi = {
  getAll:    (params?: Record<string, unknown>) =>
               apiClient.get<PaginatedResponse<Listing>>('/listings', { params }),
  getById:   (id: string)                      => apiClient.get<Listing>(`/listings/${id}`),
  getSimilar: (id: string, limit = 8)          => apiClient.get<Listing[]>(`/listings/${id}/similar`, { params: { limit } }),
  getMy:     (params?: { page?: number; limit?: number; status?: string }) =>
               apiClient.get<{ items: Listing[]; meta: PaginationMeta }>('/listings/my', { params }),
  create:    (data: Partial<Listing>)          => apiClient.post<Listing>('/listings', data),

  update:    (id: string, data: Partial<Listing>) => apiClient.patch<Listing>(`/listings/${id}`, data),
  updateStatus: (id: string, action: 'submit' | 'mark-sold' | 'archive' | 'restore', version: number) => 
    apiClient.post(`/listings/${id}/${action}`, { version }),
  remove:    (id: string)                      => apiClient.delete(`/listings/${id}`),
  report:    (id: string, reason?: string) => apiClient.post(`/listings/${id}/report`, { reason }),
}
