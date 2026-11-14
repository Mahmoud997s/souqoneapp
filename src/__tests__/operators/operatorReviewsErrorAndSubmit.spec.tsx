import React from 'react'
import axios from 'axios'
import { render, fireEvent, renderHook, waitFor, act } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ReviewsScreen from '../../../app/reviews/[entityId]'
import { useOperatorReviews } from '../../hooks/listing-detail/useOperatorReviews'
import { reviewsApi } from '../../api/reviews'
import { dialogService } from '../../store/dialogStore'
import { ListContractError } from '../../utils/parseListEnvelope'
import { getPublishRateLimitErrorMessage } from '../../utils/publishRateLimitError'
import { getMutationErrorMessage } from '../../utils/listing-detail/getDetailErrorKind'

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ entityId: 'op-123', type: 'OPERATOR_LISTING' }),
}))

jest.mock('../../api/reviews')
jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
    confirm: jest.fn(),
  },
}))

const mockedReviewsApi = jest.mocked(reviewsApi)
const mockedDialogAlert = jest.mocked(dialogService.alert)

jest.setTimeout(25000)

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

async function renderWithClient(ui: React.ReactElement, client = createTestQueryClient()) {
  return await render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('Operator Reviews Hook & Screen Error / Submit Handling (D-283 / R5-1)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useOperatorReviews hook with S1 parseListEnvelope contract', () => {
    it('parses standardized envelope and computes average rating and count', async () => {
      mockedReviewsApi.getByEntity.mockResolvedValueOnce({
        data: {
          items: [
            { id: 'rev-1', rating: 5, comment: 'ممتاز جداً', reviewerId: 'u-1', createdAt: '2026-11-01T00:00:00Z' },
            { id: 'rev-2', rating: 4, comment: 'عمل رائع', reviewerId: 'u-2', createdAt: '2026-11-02T00:00:00Z' },
          ],
          meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
        },
      } as any)

      const queryClient = createTestQueryClient()
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = await renderHook(() => useOperatorReviews('op-123'), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isError).toBe(false)
      expect(result.current.reviews).toHaveLength(2)
      expect(result.current.summary.reviewCount).toBe(2)
      expect(result.current.summary.averageRating).toBe(4.5)
      expect(result.current.isRefetchError).toBe(false)
    })

    it('rejects corrupted non-list payload and flags isError via ListContractError', async () => {
      mockedReviewsApi.getByEntity.mockResolvedValueOnce({
        data: { corrupt: true },
      } as any)

      const queryClient = createTestQueryClient()
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = await renderHook(() => useOperatorReviews('op-123'), { wrapper })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeInstanceOf(ListContractError)
      expect(result.current.reviews).toEqual([])
      expect(result.current.summary.reviewCount).toBe(0)
      expect(result.current.summary.averageRating).toBe(0)
    })
  })

  describe('ReviewsScreen Error States & Submit Invalidation', () => {
    it('renders classified reviews-error-state when initial query fails with empty list', async () => {
      mockedReviewsApi.getByEntity.mockRejectedValueOnce(
        new axios.AxiosError('Network Offline', 'ERR_NETWORK', {} as any, {}, undefined)
      )

      const { getByTestId, getByText, queryByText } = await renderWithClient(<ReviewsScreen />)

      await waitFor(() => {
        expect(getByTestId('reviews-error-state')).toBeTruthy()
      })

      expect(getByText('لا يوجد اتصال بالإنترنت')).toBeTruthy()
      expect(queryByText('لا توجد تقييمات')).toBeNull()
    })

    it('preserves cached reviews and displays StaleDataBanner on refetch error', async () => {
      mockedReviewsApi.getByEntity
        .mockResolvedValueOnce({
          data: {
            items: [
              { id: 'rev-c1', rating: 5, comment: 'تقييم ممتاز قديم', reviewerId: 'u-1', createdAt: '2026-11-01T00:00:00Z' },
            ],
            meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
          },
        } as any)
        .mockRejectedValueOnce(new Error('Background fetch failed'))

      const queryClient = createTestQueryClient()
      const { getByTestId, getByText } = await renderWithClient(<ReviewsScreen />, queryClient)

      await waitFor(() => {
        expect(getByText('تقييم ممتاز قديم')).toBeTruthy()
      })

      // Trigger refetch failure
      await act(async () => {
        try {
          await queryClient.refetchQueries({ queryKey: ['reviews', 'op-123'] })
        } catch {}
      })

      // Cached review remains visible and StaleDataBanner is displayed
      await waitFor(() => {
        expect(getByTestId('stale-data-banner')).toBeTruthy()
      })
      expect(getByText('تقييم ممتاز قديم')).toBeTruthy()
    })

    it('handles 429 rate limit error on submit review with getPublishRateLimitErrorMessage', async () => {
      mockedReviewsApi.getByEntity.mockResolvedValueOnce({
        data: {
          items: [],
          meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
        },
      } as any)

      const rateLimitError = new axios.AxiosError(
        'Too Many Requests',
        'ERR_BAD_REQUEST',
        {} as any,
        {},
        {
          status: 429,
          statusText: 'Too Many Requests',
          data: {
            message: 'RATE_LIMIT_DAILY_EXCEEDED',
            retryAfter: 86400,
          },
          headers: {},
          config: {} as any,
        }
      )
      mockedReviewsApi.create.mockRejectedValueOnce(rateLimitError)

      const { getByTestId } = await renderWithClient(<ReviewsScreen />)

      // Open write review form
      await waitFor(() => {
        expect(getByTestId('open-write-review-btn')).toBeTruthy()
      })
      await act(async () => {
        fireEvent.press(getByTestId('open-write-review-btn'))
      })

      // Select star rating 5
      await waitFor(() => {
        expect(getByTestId('review-star-btn-5')).toBeTruthy()
      })
      await act(async () => {
        fireEvent.press(getByTestId('review-star-btn-5'))
      })

      // Submit
      await act(async () => {
        fireEvent.press(getByTestId('submit-review-btn'))
      })

      await waitFor(() => {
        expect(mockedDialogAlert).toHaveBeenCalledWith(
          'خطأ',
          getPublishRateLimitErrorMessage(rateLimitError)
        )
      })
    })

    it('formats submit error using getMutationErrorMessage on server failure', async () => {
      mockedReviewsApi.getByEntity.mockResolvedValueOnce({
        data: {
          items: [],
          meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
        },
      } as any)

      const serverError = new axios.AxiosError(
        'Internal Server Error',
        'ERR_BAD_RESPONSE',
        {} as any,
        {},
        {
          status: 500,
          statusText: 'Server Error',
          data: { message: 'Internal Server Error' },
          headers: {},
          config: {} as any,
        }
      )
      mockedReviewsApi.create.mockRejectedValueOnce(serverError)

      const { getByTestId } = await renderWithClient(<ReviewsScreen />)

      await waitFor(() => {
        expect(getByTestId('open-write-review-btn')).toBeTruthy()
      })
      await act(async () => {
        fireEvent.press(getByTestId('open-write-review-btn'))
      })

      await waitFor(() => {
        expect(getByTestId('review-star-btn-4')).toBeTruthy()
      })
      await act(async () => {
        fireEvent.press(getByTestId('review-star-btn-4'))
      })

      await act(async () => {
        fireEvent.press(getByTestId('submit-review-btn'))
      })

      await waitFor(() => {
        expect(mockedDialogAlert).toHaveBeenCalledWith(
          'خطأ',
          getMutationErrorMessage(serverError, 'تعذر إضافة التقييم')
        )
      })
    })

    it('invalidates entity details and reviews cache when submit succeeds', async () => {
      mockedReviewsApi.getByEntity.mockResolvedValueOnce({
        data: {
          items: [],
          meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
        },
      } as any)
      mockedReviewsApi.create.mockResolvedValueOnce({ data: { success: true } } as any)

      const queryClient = createTestQueryClient()
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

      const { getByTestId } = await renderWithClient(<ReviewsScreen />, queryClient)

      await waitFor(() => {
        expect(getByTestId('open-write-review-btn')).toBeTruthy()
      })
      await act(async () => {
        fireEvent.press(getByTestId('open-write-review-btn'))
      })

      await waitFor(() => {
        expect(getByTestId('review-star-btn-5')).toBeTruthy()
      })
      await act(async () => {
        fireEvent.press(getByTestId('review-star-btn-5'))
      })

      await act(async () => {
        fireEvent.press(getByTestId('submit-review-btn'))
      })

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['reviews', 'op-123'] })
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['operator-detail', 'op-123'] })
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['operator-item', 'op-123'] })
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['equipment-item', 'op-123'] })
      })
    })
  })
})
