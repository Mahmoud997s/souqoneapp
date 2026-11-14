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

  it('non-parts regression: other types (e.g. buses) render DetailStates with error and retry', async () => {
    ;(useLocalSearchParams as jest.Mock).mockReturnValue({
      id: 'bus-777',
      type: 'buses',
    })

    ;(busesApi.getById as jest.Mock).mockRejectedValueOnce(new Error('Bus error'))

    await render(<EditListingLoader />)

    // With R4-2 (D-282), DetailStates is unified for all types including buses
    await waitFor(() => {
      expect(screen.getByTestId('detail-state-error')).toBeTruthy()
      expect(screen.getByLabelText('إعادة المحاولة')).toBeTruthy()
      expect(screen.getByLabelText('الرجوع')).toBeTruthy()
    })
  })

  it('guards against stale results and does not block when route id/type changes mid-request (A-047 F1 fix)', async () => {
    let resolveP1: (val: any) => void = () => {}
    const p1Promise = new Promise((res) => {
      resolveP1 = res
    })

    let resolveP2: (val: any) => void = () => {}
    const p2Promise = new Promise((res) => {
      resolveP2 = res
    })

    ;(partsApi.getById as jest.Mock).mockImplementation((id: string) => {
      if (id === 'part-old') return p1Promise
      if (id === 'part-new') return p2Promise
      return Promise.resolve({ data: mockPartData })
    })

    ;(useLocalSearchParams as jest.Mock).mockReturnValue({
      id: 'part-old',
      type: 'parts',
    })

    const { rerender } = await render(<EditListingLoader />)

    // Old request was triggered
    expect(partsApi.getById).toHaveBeenCalledWith('part-old')

    // Mid-flight, route param changes to a different id
    ;(useLocalSearchParams as jest.Mock).mockReturnValue({
      id: 'part-new',
      type: 'parts',
    })
    await rerender(<EditListingLoader />)

    // New request is NOT blocked by old request
    expect(partsApi.getById).toHaveBeenCalledWith('part-new')

    // Now old request finishes first
    await act(async () => {
      resolveP1({
        data: {
          ...mockPartData,
          id: 'part-old',
          title: 'Old Part Title (Stale)',
        },
      })
    })

    // Stale result should NOT have populated the store nor navigated
    expect(usePartWizardStore.getState().formData.title).not.toBe('Old Part Title (Stale)')
    expect(router.replace).not.toHaveBeenCalledWith('/parts/new')

    // Now new request finishes
    await act(async () => {
      resolveP2({
        data: {
          ...mockPartData,
          id: 'part-new',
          title: 'New Part Title (Fresh)',
        },
      })
    })

    // Fresh result should populate the store and navigate
    await waitFor(() => {
      expect(usePartWizardStore.getState().formData.title).toBe('New Part Title (Fresh)')
      expect(router.replace).toHaveBeenCalledWith('/parts/new')
    })
  })

  it('discards in-flight responses and does not navigate when unmounted (A-047 F1 cleanup)', async () => {
    let resolvePending: (val: any) => void = () => {}
    const pendingPromise = new Promise((res) => {
      resolvePending = res
    })

    ;(useLocalSearchParams as jest.Mock).mockReturnValue({
      id: 'part-unmount',
      type: 'parts',
    })

    ;(partsApi.getById as jest.Mock).mockReturnValueOnce(pendingPromise)

    const { unmount } = await render(<EditListingLoader />)

    expect(partsApi.getById).toHaveBeenCalledWith('part-unmount')

    // Unmount while request is pending
    await unmount()

    // Resolve deferred promise after unmount
    await act(async () => {
      resolvePending({
        data: {
          ...mockPartData,
          id: 'part-unmount',
          title: 'Should Be Discarded',
        },
      })
    })

    // Store should not be populated and router.replace should not be called
    expect(usePartWizardStore.getState().formData.title).not.toBe('Should Be Discarded')
    expect(router.replace).not.toHaveBeenCalled()
  })
})
