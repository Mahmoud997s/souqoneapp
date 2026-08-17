import { apiClient } from './client'
import { Service } from '../types/listing.types'
import { PaginatedResponse } from '../types/api.types'
import { PaginationMeta } from '../types/my-listings.types'

export const servicesApi = {
  getAll:  (params?: Record<string, unknown>) =>
             apiClient.get<PaginatedResponse<Service>>('/services', { params }),
  getById: (id: string) => apiClient.get<Service>(`/services/${id}`),
  getMy:   (params?: { page?: number; limit?: number }) =>
             apiClient.get<{ items: Service[]; meta: PaginationMeta }>('/services/my', { params }),
  create:  (data: Partial<Service>) => apiClient.post<Service>('/services', data),
  update:  (id: string, data: Partial<Service>) => apiClient.patch<Service>(`/services/${id}`, data),
  remove:  (id: string) => apiClient.delete(`/services/${id}`),
}

