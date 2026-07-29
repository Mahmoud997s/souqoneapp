import { apiClient } from './client'
import { Listing } from '../types/listing.types'
import { PaginatedResponse } from '../types/api.types'

export const listingsApi = {
  getAll:    (params?: Record<string, unknown>) =>
               apiClient.get<PaginatedResponse<Listing>>('/listings', { params }),
  getById:   (id: string)                      => apiClient.get<Listing>(`/listings/${id}`),
  getMy:     ()                                => apiClient.get<Listing[]>('/listings/my'),
  create:    (data: Partial<Listing>)          => apiClient.post<Listing>('/listings', data),
  update:    (id: string, data: Partial<Listing>) => apiClient.patch<Listing>(`/listings/${id}`, data),
  remove:    (id: string)                      => apiClient.delete(`/listings/${id}`),
  addImages: (id: string, formData: FormData)  =>
               apiClient.post(`/listings/${id}/images`, formData, {
                 headers: { 'Content-Type': 'multipart/form-data' },
               }),
  report:    (id: string, reason?: string) => apiClient.post(`/listings/${id}/report`, { reason }),
}
