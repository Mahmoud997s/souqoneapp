import React from 'react'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  uploadAndReconcileEquipmentImages,
  buildEquipmentListingPayload,
} from '../../utils/equipment/equipmentWizardSubmitHelpers'
import ReviewsScreen, { StarRow } from '../../../app/reviews/[entityId]'
import { EquipmentFormData } from '../../types/equipmentForm.types'
import { reviewsApi } from '../../api/reviews'
import { uploadsApi } from '../../api/uploads'

// Mocks
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ entityId: 'eq-test-456', type: 'equipment' }),
  router: { back: jest.fn(), push: jest.fn() },
}))

jest.mock('../../api/reviews', () => ({
  reviewsApi: {
    getByEntity: jest.fn(),
    create: jest.fn(),
  },
}))

jest.mock('../../api/uploads', () => ({
  uploadsApi: {
    single: jest.fn(),
  },
}))

jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
    confirm: jest.fn(),
  },
}))

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

describe('Phase 6 Equipment & Operators Types Sweep and Star Rating Accessibility (P6-3 / D-290)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('equipmentWizardSubmitHelpers', () => {
    describe('uploadAndReconcileEquipmentImages', () => {
      it('reconciles existing http urls and prepares remote upload results', async () => {
        ;(uploadsApi.single as jest.Mock).mockResolvedValueOnce({
          data: { url: 'https://cdn.souqone.com/uploads/new_image.jpg' },
        })

        const rawImages = [
          'https://existing.cdn/image1.jpg',
          'file:///local/cache/new_image.jpg',
        ]

        const result = await uploadAndReconcileEquipmentImages(rawImages, undefined)

        expect(result.finalImageUrls).toEqual([
          'https://existing.cdn/image1.jpg',
          'https://cdn.souqone.com/uploads/new_image.jpg',
        ])
        expect(result.newImageUrls).toEqual([
          'https://cdn.souqone.com/uploads/new_image.jpg',
        ])
      })

      it('handles empty image arrays cleanly', async () => {
        const result = await uploadAndReconcileEquipmentImages([], [])
        expect(result).toEqual({ finalImageUrls: [], newImageUrls: [] })
      })
    })

    describe('buildEquipmentListingPayload', () => {
      const baseForm: EquipmentFormData = {
        title: '   حفارة كاتربيلر 320   ',
        description: '   حفارة بحالة ممتازة وجاهزة للعمل فورا   ',
        equipmentType: 'EXCAVATOR',
        listingType: 'EQUIPMENT_SALE',
        make: ' Caterpillar ',
        model: ' 320D ',
        year: '2020',
        condition: 'USED',
        capacity: ' 20 Ton ',
        power: ' 150 HP ',
        weight: ' 22000 kg ',
        hoursUsed: '3500',
        features: ['GPS', 'AC Cabin'],
        price: '28000',
        dailyPrice: '',
        monthlyPrice: '',
        isPriceNegotiable: true,
        withOperator: false,
        deliveryAvailable: true,
        budgetMin: '',
        budgetMax: '',
        rentalDuration: '',
        quantity: '',
        siteDetails: '',
        governorate: 'مسقط',
        city: 'السيب',
        governorateId: 1,
        wilayaId: 10,
        latitude: 23.6,
        longitude: 58.1,
        whatsappEnabled: true,
        images: [],
        existingImages: [],
        removedImageIds: [],
      }

      it('builds valid SALE payload with trimmed fields and parsed numbers', () => {
        const payload = buildEquipmentListingPayload(baseForm, ['https://cdn.souqone.com/img1.jpg'])

        expect(payload.title).toBe('حفارة كاتربيلر 320')
        expect(payload.description).toBe('حفارة بحالة ممتازة وجاهزة للعمل فورا')
        expect(payload.equipmentType).toBe('EXCAVATOR')
        expect(payload.listingType).toBe('EQUIPMENT_SALE')
        expect(payload.make).toBe('Caterpillar')
        expect(payload.model).toBe('320D')
        expect(payload.year).toBe(2020)
        expect(payload.condition).toBe('USED')
        expect(payload.capacity).toBe('20 Ton')
        expect(payload.hoursUsed).toBe(3500)
        expect(payload.price).toBe(28000)
        expect(payload.dailyPrice).toBeUndefined()
        expect(payload.isPriceNegotiable).toBe(true)
        expect(payload.whatsappEnabled).toBe(true)
        expect(payload.features).toEqual(['GPS', 'AC Cabin'])
        expect(payload.images).toEqual(['https://cdn.souqone.com/img1.jpg'])
      })

      it('builds valid RENT payload with dailyPrice and monthlyPrice', () => {
        const rentForm: EquipmentFormData = {
          ...baseForm,
          listingType: 'EQUIPMENT_RENT',
          price: '',
          dailyPrice: '150',
          monthlyPrice: '3200',
        }
        const payload = buildEquipmentListingPayload(rentForm, [])

        expect(payload.listingType).toBe('EQUIPMENT_RENT')
        expect(payload.price).toBeUndefined()
        expect(payload.dailyPrice).toBe(150)
        expect(payload.monthlyPrice).toBe(3200)
        expect(payload.images).toBeUndefined()
      })

      it('builds valid WANTED payload with budget and duration', () => {
        const wantedForm: EquipmentFormData = {
          ...baseForm,
          listingType: 'EQUIPMENT_WANTED',
          price: '',
          budgetMin: '500',
          budgetMax: '1200',
          rentalDuration: 'شهر واحد',
          quantity: '2',
          siteDetails: 'موقع العمل في صحار',
        }
        const payload = buildEquipmentListingPayload(wantedForm, [])

        expect(payload.listingType).toBe('EQUIPMENT_WANTED')
        expect(payload.budgetMin).toBe(500)
        expect(payload.budgetMax).toBe(1200)
        expect(payload.rentalDuration).toBe('شهر واحد')
        expect(payload.quantity).toBe(2)
        expect(payload.siteDetails).toBe('موقع العمل في صحار')
      })
    })
  })

  describe('StarRow and Reviews Accessibility', () => {
    it('renders StarRow container with text accessibility role and label', async () => {
      const { root } = await render(<StarRow rating={4} />)
      expect(root).toBeTruthy()
      expect(root?.props.accessible).toBe(true)
      expect(root?.props.accessibilityRole).toBe('text')
      expect(root?.props.accessibilityLabel).toBe('التقييم 4 من 5 نجوم')
    })

    it('renders interactive review stars with button role and state accessibility in ReviewsScreen write box', async () => {
      ;(reviewsApi.getByEntity as jest.Mock).mockResolvedValueOnce({
        data: { data: [], meta: { total: 0 } },
      })

      const queryClient = createTestQueryClient()

      const { getByTestId } = await renderWithClient(
        <ReviewsScreen />,
        queryClient
      )

      await waitFor(() => {
        expect(getByTestId('open-write-review-btn')).toBeTruthy()
      })

      await act(async () => {
        fireEvent.press(getByTestId('open-write-review-btn'))
      })

      // Wait for writeBox to open and star buttons to appear
      await waitFor(() => {
        expect(getByTestId('review-star-btn-1')).toBeTruthy()
      })

      // Verify star rating buttons accessibility via testID directly on TouchableOpacity
      for (let star = 1; star <= 5; star++) {
        const starBtn = getByTestId(`review-star-btn-${star}`)
        expect(starBtn).toBeTruthy()
        expect(starBtn.props.accessibilityRole).toBe('button')
        expect(starBtn.props.accessibilityLabel).toBe(`تقييم ${star} من 5 نجوم`)
        expect(starBtn.props.accessibilityState).toEqual({ selected: false })
        // Must be directly on the interactive pressable button, never a hidden View
        expect(starBtn.props.style?.display).not.toBe('none')
      }

      // Press star 4
      await act(async () => {
        fireEvent.press(getByTestId('review-star-btn-4'))
      })

      // Verify selected state updated
      const star4Btn = getByTestId('review-star-btn-4')
      expect(star4Btn.props.accessibilityState).toEqual({ selected: true })

      const star1Btn = getByTestId('review-star-btn-1')
      expect(star1Btn.props.accessibilityState).toEqual({ selected: true })

      const star5Btn = getByTestId('review-star-btn-5')
      expect(star5Btn.props.accessibilityState).toEqual({ selected: false })
    })
  })
})
