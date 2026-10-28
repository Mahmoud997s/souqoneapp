import { AxiosRequestConfig } from 'axios'
import { apiClient } from './client'
import { Part } from '../types/listing.types'
import { PaginatedResponse } from '../types/api.types'

export const partsApi = {
  getAll:  (params?: Record<string, unknown>) =>
             apiClient.get<PaginatedResponse<Part>>('/parts', { params }),
  getById: (id: string, config?: AxiosRequestConfig) =>
             apiClient.get<Part>(`/parts/${id}`, config),
  getMy:   () => apiClient.get<Part[]>('/parts/my'),
  create:  (data: Partial<Part>) => apiClient.post<Part>('/parts', data),
  update:  (id: string, data: Partial<Part>) => apiClient.patch<Part>(`/parts/${id}`, data),
  remove:  (id: string) => apiClient.delete(`/parts/${id}`),
}

