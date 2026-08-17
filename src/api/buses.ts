import { apiClient } from './client'
import { PaginatedResponse } from '../types/api.types'
import { BusListing } from '../types/bus.types'
import { PaginationMeta } from '../types/my-listings.types'

export const busesApi = {
  getAll:  (params?: Record<string, unknown>) =>
             apiClient.get<PaginatedResponse<BusListing>>('/buses', { params }),
  getById: (id: string) => apiClient.get<BusListing>(`/buses/${id}`),
  getMy:   (params?: { page?: number; limit?: number }) =>
             apiClient.get<{ items: BusListing[]; meta: PaginationMeta }>('/buses/my', { params }),
  create:  (data: Partial<BusListing>) => apiClient.post<BusListing>('/buses', data),
  update:  (id: string, data: Partial<BusListing>) => apiClient.patch<BusListing>(`/buses/${id}`, data),
  remove:  (id: string) => apiClient.delete(`/buses/${id}`),
  addImages: (id: string, urls: string[]) => apiClient.post(`/buses/${id}/images`, { urls }),
  removeImage: (imageId: string) => apiClient.delete(`/buses/images/${imageId}`),
}

