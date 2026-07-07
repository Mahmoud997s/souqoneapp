export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiError {
  message: string
  statusCode: number
  error?: string
}

export interface UploadResponse {
  url: string
}

export interface NotificationItem {
  id: string
  title: string
  body: string
  type: string
  isRead: boolean
  data?: Record<string, unknown>
  createdAt: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  currency: 'OMR'
  duration: number
  features: string[]
}

export interface PaymentResponse {
  checkoutUrl: string
  sessionId: string
}
