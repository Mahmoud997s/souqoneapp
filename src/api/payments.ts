import { apiClient } from './client'
import { SubscriptionPlan, PaymentResponse } from '../types/api.types'

export const paymentsApi = {
  getPlans:        ()                    => apiClient.get<SubscriptionPlan[]>('/payments/plans'),
  subscribe:       (planId: string)      => apiClient.post<PaymentResponse>('/payments/subscribe', { planId }),
  featureListing:  (listingId: string)   =>
                     apiClient.post<PaymentResponse>('/payments/feature-listing', { listingId }),
}
