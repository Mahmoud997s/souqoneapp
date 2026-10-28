import { AxiosRequestConfig } from 'axios'
import { apiClient } from './client'
import { EquipmentListing, OperatorListing } from '../types/equipment.types'
import { PaginatedResponse } from '../types/api.types'
import { EquipmentDetailApi, EquipmentSimilarItemApi } from '../types/equipmentDetailApi.types'

export interface EquipmentStatusUpdatePayload {
  version: number
  status: string
}

export type EquipmentUpdatePayload = Partial<EquipmentListing> & {
  version?: number
}

export const equipmentApi = {
  // Equipment Listings
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<EquipmentListing>>('/equipment', { params }),
  getById: (id: string, config?: AxiosRequestConfig) =>
    apiClient.get<EquipmentDetailApi>(`/equipment/${id}`, config),
  getSimilar: (id: string, limit = 8) =>
    apiClient.get<EquipmentSimilarItemApi[]>(`/equipment/${id}/similar`, { params: { limit } }),
  getMy: () => apiClient.get<EquipmentListing[]>('/equipment/my'),
  create: (data: Partial<EquipmentListing>) => apiClient.post<EquipmentListing>('/equipment', data),
  update: (id: string, data: EquipmentUpdatePayload | EquipmentStatusUpdatePayload) =>
    apiClient.patch<EquipmentListing>(`/equipment/${id}`, data),
  delete: (id: string) => apiClient.delete<{ deleted: boolean }>(`/equipment/${id}`),
  remove: (id: string) => apiClient.delete<{ deleted: boolean }>(`/equipment/${id}`),
  addImages: (id: string, urls: string[]) => apiClient.post(`/equipment/${id}/images`, { urls }),
  removeImage: (imageId: string) => apiClient.delete(`/equipment/images/${imageId}`),

  // Operators
  getOperators: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<OperatorListing>>('/operators', { params }),
  getOperatorById: (id: string, config?: AxiosRequestConfig) =>
    apiClient.get<OperatorListing>(`/operators/${id}`, config),
  getMyOperators: () => apiClient.get<OperatorListing[]>('/operators/my'),
  createOperator: (data: Partial<OperatorListing>) => apiClient.post<OperatorListing>('/operators', data),
  updateOperator: (id: string, data: Partial<OperatorListing>) =>
    apiClient.patch<OperatorListing>(`/operators/${id}`, data),
  deleteOperator: (id: string, reason?: string) => apiClient.delete(`/operators/${id}`, { data: { reason } }),
  cancelOperatorDeletionRequest: (requestId: string) => apiClient.delete(`/operators/deletion-requests/${requestId}`),
}
