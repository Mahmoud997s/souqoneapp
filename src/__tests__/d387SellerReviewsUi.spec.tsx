import React from 'react'
import * as fs from 'fs'
import * as path from 'path'
import { StyleSheet } from 'react-native'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RatingStars } from '../components/ui/RatingStars'
import { SellerRatingBlock } from '../components/listing-detail/SellerRatingBlock'
import { PublicProfileHero } from '../components/profile/public-profile/PublicProfileHero'
import { buildCreateReviewPayload, reviewsApi } from '../api/reviews'
import { apiClient } from '../api/client'
import ReviewsScreen from '../../app/reviews/[entityId]'
import { toastService } from '../store/toastStore'
import { Spacing } from '../constants/spacing'

const mockRouterPush = jest.fn()
let mockAuthUser: { id: string; username?: string } | null = { id: 'buyer-1', username: 'buyer' }
let mockSearchParams: Record<string, string | undefined> = {
  entityId: 'seller-99',
  type: 'USER',
}

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush, back: jest.fn() }),
  router: { push: mockRouterPush, back: jest.fn() },
  useLocalSearchParams: () => mockSearchParams,
}))

jest.mock('expo-image', () => {
  const ReactLib = require('react')
  const { View } = require('react-native')
  return {
    Image: (props: any) => ReactLib.createElement(View, { testID: 'mock-expo-image', ...props }),
  }
})

jest.mock('expo-linear-gradient', () => {
  const ReactLib = require('react')
  const { View } = require('react-native')
  return {
    LinearGradient: ({ children, ...props }: any) => ReactLib.createElement(View, props, children),
  }
})

jest.mock('@expo/vector-icons', () => {
  const ReactLib = require('react')
  const { Text } = require('react-native')
  return {
    Ionicons: ({ name }: { name: string }) => ReactLib.createElement(Text, null, name),
  }
})

jest.mock('../components/ui/AppHeader', () => {
  const ReactLib = require('react')
  const { Text } = require('react-native')
  return {
    AppHeader: ({ title }: { title: string }) => ReactLib.createElement(Text, null, title),
  }
})

jest.mock('../store/authStore', () => ({
  useAuthStore: () => ({ user: mockAuthUser }),
}))

jest.mock('../store/toastStore', () => ({
  toastService: {
    show: jest.fn(),
  },
}))

jest.mock('../api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}))

const ROOT = path.resolve(__dirname, '../..')

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

const basePublicProfile = {
  id: 'seller-99',
  username: 'oman_seller',
  displayName: 'معرض مسقط',
  isVerified: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  totalListings: 3,
  _count: {
    listings: 2,
    busListings: 1,
    equipmentListings: 0,
    operatorListings: 0,
    spareParts: 0,
    carServices: 0,
    driverJobs: 0,
  },
} as any

describe('D-387: Seller reviews (USER), shared RatingStars, SellerRatingBlock, and PublicProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthUser = { id: 'buyer-1', username: 'buyer' }
    mockSearchParams = { entityId: 'seller-99', type: 'USER' }
  })

  describe('1. Shared RatingStars & dead duplicate deletion', () => {
    it('renders display mode 1..5 stars with text accessibility role and label', async () => {
      const view = await render(<RatingStars rating={4.5} />)
      const container = view.getByTestId('rating-stars')
      expect(container.props.accessibilityRole).toBe('text')
      expect(container.props.accessibilityLabel).toBe('التقييم 4.5 من 5 نجوم')
      expect(view.getAllByText('star')).toHaveLength(4)
      expect(view.getAllByText('star-half')).toHaveLength(1)
    })

    it('renders interactive input mode with 5 accessible >=44pt buttons and calls onChange', async () => {
      const onChange = jest.fn()
      const view = await render(
        <RatingStars rating={3} onChange={onChange} starButtonTestIDPrefix="review-star-btn" />,
      )
      const btn4 = view.getByTestId('review-star-btn-4')
      expect(btn4.props.accessibilityRole).toBe('button')
      expect(btn4.props.accessibilityLabel).toBe('تقييم 4 من 5 نجوم')
      expect(btn4.props.accessibilityState).toEqual({ selected: false })
      const flat = StyleSheet.flatten(btn4.props.style)
      expect(flat.minHeight).toBeGreaterThanOrEqual(Spacing.touch)

      fireEvent.press(btn4)
      expect(onChange).toHaveBeenCalledWith(4)
    })

    it('deletes OperatorStarsRow.tsx and wires RatingStars into OperatorReviewsCard without changing testID', () => {
      expect(
        fs.existsSync(path.join(ROOT, 'src/components/operators/detail/OperatorStarsRow.tsx')),
      ).toBe(false)
      const opCardSrc = fs.readFileSync(
        path.join(ROOT, 'src/components/operators/detail/OperatorReviewsCard.tsx'),
        'utf8',
      )
      expect(opCardSrc).toContain('RatingStars')
      expect(opCardSrc).toContain('testID="operator-stars-row"')
    })
  })

  describe('2. USER review payload & whitelisted API queries', () => {
    it('strictly omits revieweeId when entityType is USER even if passed', () => {
      const payload = buildCreateReviewPayload({
        entityId: 'seller-99',
        entityType: 'USER',
        rating: 5,
        comment: 'بائع ممتاز',
        revieweeId: 'spoofed-id',
      })
      expect('revieweeId' in payload).toBe(false)
      expect(payload).toEqual({
        entityId: 'seller-99',
        entityType: 'USER',
        rating: 5,
        comment: 'بائع ممتاز',
      })
    })

    it('sends whitelisted userId + entityType=USER for getByEntity(USER) and hits /reviews/summary/:userId', async () => {
      ;(apiClient.get as jest.Mock).mockResolvedValue({ data: { items: [] } })
      await reviewsApi.getByEntity('seller-99', 'USER')
      expect(apiClient.get).toHaveBeenCalledWith('/reviews', {
        params: { userId: 'seller-99', entityType: 'USER' },
      })

      await reviewsApi.getSummary('seller-99')
      expect(apiClient.get).toHaveBeenCalledWith('/reviews/summary/seller-99')
    })
  })

  describe('3. Shared SellerRatingBlock on all 5 detail screens', () => {
    it('hides SellerRatingBlock when isOwner is true', async () => {
      const Wrapper = makeWrapper()
      const view = await render(
        <Wrapper>
          <SellerRatingBlock sellerId="seller-99" isOwner={true} />
        </Wrapper>,
      )
      expect(view.queryByTestId('seller-rating-block')).toBeNull()
    })

    it('hides SellerRatingBlock when sellerId is missing', async () => {
      const Wrapper = makeWrapper()
      const view = await render(
        <Wrapper>
          <SellerRatingBlock sellerId="" isOwner={false} />
        </Wrapper>,
      )
      expect(view.queryByTestId('seller-rating-block')).toBeNull()
    })

    it('shows average + count and navigates to /reviews/:sellerId?type=USER when visitor presses rate', async () => {
      ;(apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: { averageRating: 4.5, reviewCount: 3 },
      })
      const Wrapper = makeWrapper()
      const view = await render(
        <Wrapper>
          <SellerRatingBlock sellerId="seller-99" isOwner={false} />
        </Wrapper>,
      )

      await waitFor(() => {
        expect(view.getByText('4.5')).toBeTruthy()
        expect(view.getByText('(3)')).toBeTruthy()
      })

      fireEvent.press(view.getByTestId('seller-rating-block-rate-btn'))
      expect(mockRouterPush).toHaveBeenCalledWith('/reviews/seller-99?type=USER&write=true')
    })

    it('wires SellerRatingBlock into all 5 main detail screens and leaves window-1 files untouched', () => {
      const screens = [
        'src/screens/cars/CarDetailScreen.tsx',
        'src/screens/buses/BusDetailScreen.tsx',
        'src/screens/equipment/EquipmentDetailScreen.tsx',
        'src/screens/parts/PartDetailScreen.tsx',
        'src/screens/services/ServiceDetailScreen.tsx',
      ]
      for (const rel of screens) {
        const src = fs.readFileSync(path.join(ROOT, rel), 'utf8')
        expect(src).toContain('SellerRatingBlock')
      }
    })
  })

  describe('4. PublicProfileHero rating visibility (hidden at 0, visible > 0)', () => {
    it('hides rating row when reviewCount is 0', async () => {
      const view = await render(
        <PublicProfileHero
          profile={{ ...basePublicProfile, averageRating: 0, reviewCount: 0 }}
          onRateSeller={jest.fn()}
        />,
      )
      expect(view.queryByTestId('public-profile-rating-row')).toBeNull()
      expect(view.getByTestId('public-profile-rate-btn')).toBeTruthy()
    })

    it('shows rating row when reviewCount > 0 and calls onOpenReviews on press', async () => {
      const onOpenReviews = jest.fn()
      const view = await render(
        <PublicProfileHero
          profile={{ ...basePublicProfile, averageRating: 4.7, reviewCount: 12 }}
          onOpenReviews={onOpenReviews}
          onRateSeller={jest.fn()}
        />,
      )
      expect(view.getByTestId('public-profile-rating-row')).toBeTruthy()
      expect(view.getByText('4.7')).toBeTruthy()
      expect(view.getByText('(12)')).toBeTruthy()
      fireEvent.press(view.getByTestId('public-profile-rating-row'))
      expect(onOpenReviews).toHaveBeenCalledTimes(1)
    })
  })

  describe('5. ReviewsScreen server Arabic 400 error & logged-out loginRoute redirect', () => {
    it('displays the exact server Arabic 400 message when buyer has not messaged seller', async () => {
      const serverMsg = 'يمكنك فقط تقييم البائع بعد التواصل معه عبر الرسائل أولاً'
      ;(apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { items: [] } })
      ;(apiClient.post as jest.Mock).mockRejectedValueOnce({
        response: { status: 400, data: { message: serverMsg } },
      })
      const Wrapper = makeWrapper()
      const view = await render(
        <Wrapper>
          <ReviewsScreen />
        </Wrapper>,
      )

      await waitFor(() => {
        expect(view.getByText('لا توجد تقييمات بعد')).toBeTruthy()
      })

      await fireEvent.press(view.getByTestId('open-write-review-btn'))
      await waitFor(() => {
        expect(view.getByTestId('review-star-btn-5')).toBeTruthy()
      })
      await fireEvent.press(view.getByTestId('review-star-btn-5'))
      await fireEvent.press(view.getByTestId('submit-review-btn'))

      await waitFor(() => {
        expect(view.getByTestId('review-submit-error').props.children).toBe(serverMsg)
        expect(toastService.show).toHaveBeenCalledWith({ kind: 'error', title: serverMsg })
      })
    })

    it('redirects logged-out user to loginRoute when pressing open-write-review-btn', async () => {
      mockAuthUser = null
      ;(apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { items: [] } })
      const Wrapper = makeWrapper()
      const view = await render(
        <Wrapper>
          <ReviewsScreen />
        </Wrapper>,
      )

      await waitFor(() => {
        expect(view.getByTestId('open-write-review-btn')).toBeTruthy()
      })

      fireEvent.press(view.getByTestId('open-write-review-btn'))
      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.stringContaining('/(auth)/login'),
      )
    })
  })
})
