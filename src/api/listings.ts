import { apiClient } from './client'
import { Listing } from '../types/listing.types'
import { PaginatedResponse } from '../types/api.types'
import { PaginationMeta } from '../types/my-listings.types'

export const listingsApi = {
  getAll:    (params?: Record<string, unknown>) =>
               apiClient.get<PaginatedResponse<Listing>>('/listings', { params }),
  getById:   (id: string)                      => apiClient.get<Listing>(`/listings/${id}`),
  getMy:     (params?: { page?: number; limit?: number; status?: string }) =>
               apiClient.get<{ items: Listing[]; meta: PaginationMeta }>('/listings/my', { params }),
  create:    (data: Partial<Listing>)          => apiClient.post<Listing>('/listings', data),

  update:    (id: string, data: Partial<Listing>) => apiClient.patch<Listing>(`/listings/${id}`, data),
  remove:    (id: string)                      => apiClient.delete(`/listings/${id}`),
  addImages: (id: string, formData: FormData)  =>
               apiClient.post(`/listings/${id}/images`, formData, {
                 headers: { 'Content-Type': 'multipart/form-data' },
               }),
  report:    (id: string, reason?: string) => apiClient.post(`/listings/${id}/report`, { reason }),
}
