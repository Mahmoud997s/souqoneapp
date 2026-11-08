import React from 'react'
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react-native'
import EditListingLoader from '../../app/post/edit/[id]'
import { partsApi } from '../api/parts'
import { busesApi } from '../api/buses'
import { usePartWizardStore } from '../store/partWizardStore'
import { usePostStore } from '../store/postStore'
import { router, useLocalSearchParams } from 'expo-router'

jest.mock('../../src/api/parts')
jest.mock('../../src/api/listings')
jest.mock('../../src/api/buses')
jest.mock('../../src/api/equipment')
jest.mock('../../src/api/services')
jest.mock('../../src/api/cars', () => ({
  carsApi: {
    getBrands: jest.fn().mockResolvedValue([]),
    getModels: jest.fn().mockResolvedValue([]),
    getTrims: jest.fn().mockResolvedValue([]),
  },
}))

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
}))

describe('Parts Edit Detail Retry & State Handling (D-236)', () => {
  const mockPartData = {
    id: 'part-123',
    title: 'مساعدات هايلوكس أصلية',
    description: 'طقم مساعدات أمامي وخلفي بحالة ممتازة',
    partCategory: 'SUSPENSION',
    condition: 'NEW',
    partNumber: '48510-09L00',
    price: 120,
    currency: 'OMR',
    isPriceNegotiable: true,
    whatsappEnabled: true,
    governorateId: 1,
    wilayaId: 10,
    governorateRef: { id: 1, nameAr: 'مسقط' },
    wilayaRef: { id: 10, nameAr: 'السيب' },
    images: [{ id: 'img-10', url: 'https://cdn.example.com/p10.jpg' }],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(partsApi.getById as jest.Mock).mockReset()
    ;(busesApi.getById as jest.Mock).mockReset()
    usePartWizardStore.getState().reset()
    usePostStore.getState().reset()
  })

  afterEach(() => {
    cleanup()
  })

  it('shows DetailSkeleton while loading parts edit', async () => {
    ;(useLocalSearchParams as jest.Mock).mockReturnValue({
      id: 'part-123',
      type: 'parts',
    })

    ;(partsApi.getById as jest.Mock).mockImplementationOnce(() => new Promise(() => {}))

    await render(<EditListingLoader />)

    expect(screen.getByTestId('detail-state-loading')).toBeTruthy()
    expect(screen.getByTestId('detail-skeleton')).toBeTruthy()
  })

  it('handles first load failure then retry succeeds, populates store and navigates', async () => {
    ;(useLocalSearchParams as jest.Mock).mockReturnValue({
      id: 'part-123',
      type: 'parts',
    })

    ;(partsApi.getById as jest.Mock)
      .mockRejectedValueOnce(new Error('Network offline'))
      .mockResolvedValueOnce({ data: mockPartData })

    await render(<EditListingLoader />)

    // Wait for failure
    await waitFor(() => {
      expect(screen.getByTestId('detail-state-error')).toBeTruthy()
      expect(screen.getByText('تعذر تحميل بيانات قطعة الغيار')).toBeTruthy()
    })

    // Retry button must be present
    const retryBtn = screen.getByText('إعادة المحاولة')
    expect(retryBtn).toBeTruthy()

    // Press retry
    await act(async () => {
      fireEvent.press(retryBtn)
    })

    // Verify retry succeeds
    await waitFor(() => {
      expect(partsApi.getById).toHaveBeenCalledTimes(2)
      expect(router.replace).toHaveBeenCalledWith('/parts/new')

      const store = usePartWizardStore.getState()
      expect(store.formData.editMode).toBe(true)
      expect(store.formData.editListingId).toBe('part-123')
      expect(store.formData.title).toBe('مساعدات هايلوكس أصلية')
      expect(store.formData.partCategory).toBe('SUSPENSION')
      expect(store.formData.price).toBe(120)
    })
  })

  it('retry fails -> stays in error state without crashing or navigating', async () => {
    ;(useLocalSearchParams as jest.Mock).mockReturnValue({
      id: 'part-123',
      type: 'parts',
    })

    ;(partsApi.getById as jest.Mock).mockRejectedValue(new Error('Persistent 500 error'))

    await render(<EditListingLoader />)

    await waitFor(() => {
      expect(screen.getByTestId('detail-state-error')).toBeTruthy()
    })

    const retryBtn = screen.getByText('إعادة المحاولة')
    await act(async () => {
      fireEvent.press(retryBtn)
    })

    await waitFor(() => {
      expect(partsApi.getById).toHaveBeenCalledTimes(2)
      expect(screen.getByTestId('detail-state-error')).toBeTruthy()
      expect(router.replace).not.toHaveBeenCalled()
    })
  })

  it('preserves route params and pre-filled store draft across load failure', async () => {
    ;(useLocalSearchParams as jest.Mock).mockReturnValue({
      id: 'part-123',
      type: 'parts',
    })

    // Simulate pre-existing draft data in store before loader was mounted
    usePartWizardStore.getState().setField('partCategory', 'BODY')
    usePartWizardStore.getState().setField('title', 'مسودة سابقة')

    ;(partsApi.getById as jest.Mock).mockRejectedValueOnce(new Error('Load failed'))

    await render(<EditListingLoader />)

    await waitFor(() => {
      expect(screen.getByTestId('detail-state-error')).toBeTruthy()
    })

    // Store draft is NOT wiped by load failure
    const store = usePartWizardStore.getState()
    expect(store.formData.partCategory).toBe('BODY')
    expect(store.formData.title).toBe('مسودة سابقة')
  })

  it('Back button is separate and calls router.back() without triggering retry', async () => {
    ;(useLocalSearchParams as jest.Mock).mockReturnValue({
      id: 'part-123',
      type: 'parts',
    })

    ;(partsApi.getById as jest.Mock).mockRejectedValueOnce(new Error('Fetch failed'))

    await render(<EditListingLoader />)

    await waitFor(() => {
      expect(screen.getByTestId('detail-state-error')).toBeTruthy()
    })

    const backBtn = screen.getByText('الرجوع')
    expect(backBtn).toBeTruthy()

    await act(async () => {
      fireEvent.press(backBtn)
    })

    expect(router.back).toHaveBeenCalledTimes(1)
    // partsApi should NOT be called again on back
    expect(partsApi.getById).toHaveBeenCalledTimes(1)
  })

  it('in-flight guard: rapid double press on retry issues only one network request', async () => {
    ;(useLocalSearchParams as jest.Mock).mockReturnValue({
      id: 'part-123',
      type: 'parts',
    })

    let resolveRetry: (val: any) => void = () => {}
    const retryPromise = new Promise((res) => {
      resolveRetry = res
    })

    ;(partsApi.getById as jest.Mock)
      .mockRejectedValueOnce(new Error('First fail'))
      .mockReturnValueOnce(retryPromise)

    await render(<EditListingLoader />)

    await waitFor(() => {
      expect(screen.getByTestId('detail-state-error')).toBeTruthy()
    })

    const retryBtn = screen.getByText('إعادة المحاولة')

    // Double press rapidly while in-flight
    await act(async () => {
      fireEvent.press(retryBtn)
      fireEvent.press(retryBtn)
    })

    // Total calls must be 2 (1 initial + 1 retry, NOT 3)
    expect(partsApi.getById).toHaveBeenCalledTimes(2)

    // Resolve in-flight request
    await act(async () => {
      resolveRetry({ data: mockPartData })
    })

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/parts/new')
    })
  })

  it('non-parts regression: other types (e.g. buses) keep original ActivityIndicator and plain error', async () => {
    ;(useLocalSearchParams as jest.Mock).mockReturnValue({
      id: 'bus-777',
      type: 'buses',
    })

    ;(busesApi.getById as jest.Mock).mockRejectedValueOnce(new Error('Bus error'))

    await render(<EditListingLoader />)

    // For buses, error renders plain s.error and s.backBtn instead of DetailStates
    await waitFor(() => {
      expect(screen.getByText('تعذر تحميل بيانات الإعلان')).toBeTruthy()
      expect(screen.getByText('رجوع')).toBeTruthy()
      expect(screen.queryByTestId('detail-state-error')).toBeNull()
      expect(screen.queryByTestId('detail-skeleton')).toBeNull()
    })
  })
})
