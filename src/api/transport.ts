import { apiClient } from './client'
import { PaginatedResponse } from '../types/api.types'

export const transportApi = {
  // ── Requests ──
  getAll:    (params?: Record<string, unknown>) =>
               apiClient.get<PaginatedResponse<any>>('/transport/requests', { params }),
  getById:   (id: string) => apiClient.get<any>(`/transport/requests/${id}`),
  create:    (data: Record<string, unknown>) => apiClient.post<any>('/transport/requests', data),
  update:    (id: string, data: Record<string, unknown>) => apiClient.patch<any>(`/transport/requests/${id}`, data),
  uploadImages: (requestId: string, formData: FormData) =>
                  apiClient.post<any>(`/transport/requests/${requestId}/images`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                  }),
  cancel:    (id: string) => apiClient.patch<any>(`/transport/requests/${id}/cancel`),
  myRequests:(params?: Record<string, unknown>) =>
               apiClient.get<PaginatedResponse<any>>('/transport/requests/my', { params }),

  // ── Quotes ──
  submitQuote:  (requestId: string, data: { price: number; estimatedHours?: number; message?: string }) =>
                  apiClient.post<any>(`/transport/requests/${requestId}/quotes`, data),
  getQuotes:    (requestId: string) =>
                  apiClient.get<any>(`/transport/requests/${requestId}/quotes`),
  acceptQuote:  (quoteId: string) =>
                  apiClient.patch<any>(`/transport/quotes/${quoteId}/accept`),
  withdrawQuote:(quoteId: string) =>
                  apiClient.patch<any>(`/transport/quotes/${quoteId}/withdraw`),
  myQuotes:     (params?: Record<string, unknown>) =>
                  apiClient.get<PaginatedResponse<any>>('/transport/quotes/my', { params }),

  // ── Bookings ──
  getBooking:     (id: string) => apiClient.get<any>(`/transport/bookings/${id}`),
  myBookings:     (params?: Record<string, unknown>) =>
                    apiClient.get<PaginatedResponse<any>>('/transport/bookings/my', { params }),
  markInProgress: (bookingId: string) =>
                    apiClient.patch<any>(`/transport/bookings/${bookingId}/start`),
  completeBooking:(bookingId: string) =>
                    apiClient.patch<any>(`/transport/bookings/${bookingId}/complete`),
  cancelBooking:  (bookingId: string, reason?: string) =>
                    apiClient.patch<any>(`/transport/bookings/${bookingId}/cancel`, { reason }),

  // ── Carrier Profile ──
  createCarrierProfile: (data: Record<string, unknown>) =>
                          apiClient.post<any>('/transport/carrier-profile', data),
  getMyCarrierProfile:  () =>
                          apiClient.get<any>('/transport/carrier-profile/me'),
  updateCarrierProfile: (data: Record<string, unknown>) =>
                          apiClient.patch<any>('/transport/carrier-profile', data),
  setAvailability:      (available: boolean) =>
                          apiClient.patch<any>('/transport/carrier-profile/availability', { isAvailable: available }),
  getCarriers:          (params?: Record<string, unknown>) =>
                          apiClient.get<PaginatedResponse<any>>('/transport/carriers', { params }),
  getCarrier:           (id: string) =>
                          apiClient.get<any>(`/transport/carriers/${id}`),

  // ── Stats ──
  getStats:             () => apiClient.get<any>('/transport/stats'),
}
