import { apiClient } from './client'
import { EquipmentListing, OperatorListing, EquipmentBid } from '../types/equipment.types'
import { PaginatedResponse } from '../types/api.types'

export const equipmentApi = {
  // Equipment Listings
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<EquipmentListing>>('/equipment', { params }),
  getById: (id: string) => apiClient.get<EquipmentListing>(`/equipment/${id}`),
  create: (data: Partial<EquipmentListing>) => apiClient.post<EquipmentListing>('/equipment', data),
  update: (id: string, data: Partial<EquipmentListing>) => apiClient.patch<EquipmentListing>(`/equipment/${id}`, data),
  delete: (id: string) => apiClient.delete(`/equipment/${id}`),

  // Operators
  getOperators: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<OperatorListing>>('/operators', { params }),
  getOperatorById: (id: string) => apiClient.get<OperatorListing>(`/operators/${id}`),
  createOperator: (data: Partial<OperatorListing>) => apiClient.post<OperatorListing>('/operators', data),
  updateOperator: (id: string, data: Partial<OperatorListing>) =>
    apiClient.patch<OperatorListing>(`/operators/${id}`, data),
  deleteOperator: (id: string) => apiClient.delete(`/operators/${id}`),

  // Bids (for EQUIPMENT_WANTED)
  getBids: (equipmentId: string) => apiClient.get<PaginatedResponse<EquipmentBid>>(`/equipment/${equipmentId}/bids`),
  createBid: (equipmentId: string, data: Partial<EquipmentBid>) =>
    apiClient.post<EquipmentBid>(`/equipment/${equipmentId}/bids`, data),
}
