import { apiClient } from './client'

export interface ContactInfo {
  phone: string | null
  whatsappNumber: string | null
  timestamp?: string
}

export const contactApi = {
  getContact: (entityType: string, entityId: string) =>
    apiClient.get<ContactInfo>(`/contact/${entityType}/${entityId}`),
}
