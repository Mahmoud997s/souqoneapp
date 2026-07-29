import { apiClient } from './client'
import { PaginatedResponse } from '../types/api.types'
import { BusListing } from '../types/bus.types'

export const busesApi = {
  getAll:  (params?: Record<string, unknown>) =>
             apiClient.get<PaginatedResponse<BusListing>>('/buses', { params }),
  getById: (id: string) => apiClient.get<BusListing>(`/buses/${id}`),
  create:  (data: Partial<BusListing>) => apiClient.post<BusListing>('/buses', data),
  update:  (id: string, data: Partial<BusListing>) => apiClient.patch<BusListing>(`/buses/${id}`, data),
  addImages: (id: string, urls: string[]) => apiClient.post(`/buses/${id}/images`, { urls }),
  removeImage: (imageId: string) => apiClient.delete(`/buses/images/${imageId}`),
}
