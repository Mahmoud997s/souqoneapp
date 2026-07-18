import { apiClient } from './client'
import { PaginatedResponse } from '../types/api.types'
import { 
  TransportRequest, 
  TransportQuote, 
  TransportBooking, 
  CarrierProfile 
} from '../types/transport.types'

export const transportApi = {
  // ── Requests ──
  getAll:    (params?: Record<string, unknown>) =>
               apiClient.get<PaginatedResponse<TransportRequest>>('/transport/requests', { params }),
  getById:   (id: string) => apiClient.get<TransportRequest>(`/transport/requests/${id}`),
  create:    (data: Record<string, unknown>) => apiClient.post<TransportRequest>('/transport/requests', data),
  update:    (id: string, data: Record<string, unknown>) => apiClient.patch<TransportRequest>(`/transport/requests/${id}`, data),
  uploadImages: (requestId: string, formData: FormData) =>
                  apiClient.post<any>(`/transport/requests/${requestId}/images`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                  }),
  cancel:    (id: string) => apiClient.patch<TransportRequest>(`/transport/requests/${id}/cancel`),
  myRequests:(params?: Record<string, unknown>) =>
               apiClient.get<PaginatedResponse<TransportRequest>>('/transport/requests/my', { params }),

  // ── Quotes ──
  submitQuote:  (requestId: string, data: { price: number; estimatedHours?: number; message?: string }) =>
                  apiClient.post<TransportQuote>(`/transport/requests/${requestId}/quotes`, data),
  getQuotes:    (requestId: string) =>
                  apiClient.get<TransportQuote[] | PaginatedResponse<TransportQuote>>(`/transport/requests/${requestId}/quotes`),
  acceptQuote:  (quoteId: string) =>
                  apiClient.patch<TransportBooking>(`/transport/quotes/${quoteId}/accept`),
  withdrawQuote:(quoteId: string) =>
                  apiClient.patch<TransportQuote>(`/transport/quotes/${quoteId}/withdraw`),
  myQuotes:     (params?: Record<string, unknown>) =>
                  apiClient.get<PaginatedResponse<TransportQuote>>('/transport/quotes/my', { params }),

  // ── Bookings ──
  getBooking:     (id: string) => apiClient.get<TransportBooking>(`/transport/bookings/${id}`),
  myBookings:     (params?: Record<string, unknown>) =>
                    apiClient.get<PaginatedResponse<TransportBooking>>('/transport/bookings/my', { params }),
  markInProgress: (bookingId: string) =>
                    apiClient.patch<TransportBooking>(`/transport/bookings/${bookingId}/start`),
  completeBooking:(bookingId: string) =>
                    apiClient.patch<TransportBooking>(`/transport/bookings/${bookingId}/complete`),
  cancelBooking:  (bookingId: string, reason?: string) =>
                    apiClient.patch<TransportBooking>(`/transport/bookings/${bookingId}/cancel`, { reason }),

  // ── Carrier Profile ──
  createCarrierProfile: (data: Record<string, unknown>) =>
                          apiClient.post<CarrierProfile>('/transport/carrier-profile', data),
  getMyCarrierProfile:  () =>
                          apiClient.get<CarrierProfile>('/transport/carrier-profile/me'),
  updateCarrierProfile: (data: Record<string, unknown>) =>
                          apiClient.patch<CarrierProfile>('/transport/carrier-profile', data),
  setAvailability:      (available: boolean) =>
                          apiClient.patch<CarrierProfile>('/transport/carrier-profile/availability', { isAvailable: available }),
  getCarriers:          (params?: Record<string, unknown>) =>
                          apiClient.get<PaginatedResponse<CarrierProfile>>('/transport/carriers', { params }),
  getCarrier:           (id: string) =>
                          apiClient.get<CarrierProfile>(`/transport/carriers/${id}`),

  // ── Stats ──
  getStats:             () => apiClient.get<any>('/transport/stats'),
}
