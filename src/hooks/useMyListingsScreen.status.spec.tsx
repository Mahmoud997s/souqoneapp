import React from 'react'
import { renderHook, act } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMyListingsScreen } from './useMyListingsScreen'
import { listingsApi } from '../api/listings'
import { busesApi } from '../api/buses'
import { equipmentApi } from '../api/equipment'
import { dialogService } from '../store/dialogStore'
import { useAuthStore } from '../store/authStore'
import { promptProfilePhoneRequired } from '../utils/profilePhoneGuard'
import { invalidateBusListingQueries } from '../utils/listing-detail/busQueryKeys'
import { invalidateEquipmentListingQueries } from '../utils/listing-detail/equipmentQueryKeys'
import type { MyListingItem, MyListingEntityType } from '../types/my-listings.types'
import type { User } from '../types/auth.types'

const mockRefetch = jest.fn().mockResolvedValue(undefined)

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}))

jest.mock('./useAllMyListings', () => ({
  useAllMyListings: () => ({
    items: [],
    isLoading: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    refetch: mockRefetch,
  }),
}))

jest.mock('../api/listings', () => ({
  listingsApi: {
    updateStatus: jest.fn(),
    remove: jest.fn(),
  },
}))

jest.mock('../api/buses', () => ({
  busesApi: {
    update: jest.fn(),
    remove: jest.fn(),
  },
}))

jest.mock('../api/equipment', () => ({
  equipmentApi: {
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
  },
}))

jest.mock('../store/dialogStore', () => ({
  dialogService: {
    showOptions: jest.fn(),
    confirm: jest.fn(),
    alert: jest.fn(),
  },
}))

jest.mock('../utils/profilePhoneGuard', () => ({
  promptProfilePhoneRequired: jest.fn(),
}))

jest.mock('../utils/listing-detail/busQueryKeys', () => ({
  invalidateBusListingQueries: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../utils/listing-detail/equipmentQueryKeys', () => ({
  invalidateEquipmentListingQueries: jest.fn().mockResolvedValue(undefined),
}))

function makeItem(params: {
  id: string
  entityType: MyListingEntityType
  rawStatus: string
  version?: number
  raw: Record<string, unknown>
}): MyListingItem {
  return {
    id: params.id,
    entityType: params.entityType,
    normalizedStatus: 'active',
    rawStatus: params.rawStatus,
    title: 'Test Item',
    updatedAt: '2026-10-26T00:00:00.000Z',
    raw: params.raw,
    version: params.version,
  }
}

describe('useMyListingsScreen — status actions from shared matrix', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    jest.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
    useAuthStore.setState({
      user: {
        id: 'u-1',
        username: 'owner',
        phone: '+96891234567',
      } as unknown as User,
      isLoggedIn: true,
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  describe('handleStatusChange — option texts per entity/status/type', () => {
    const cases: Array<{
      name: string
      entityType: MyListingEntityType
      rawStatus: string
      raw: Record<string, unknown>
      expectedTexts: string[]
    }> = [
      {
        name: 'car ACTIVE/SALE',
        entityType: 'car',
        rawStatus: 'ACTIVE',
        raw: { listingType: 'SALE' },
        expectedTexts: ['تعليم كمباع', 'أرشفة'],
      },
      {
        name: 'car ACTIVE/RENTAL',
        entityType: 'car',
        rawStatus: 'ACTIVE',
        raw: { listingType: 'RENTAL' },
        expectedTexts: ['إيقاف مؤقت'],
      },
      {
        name: 'car ACTIVE/WANTED',
        entityType: 'car',
        rawStatus: 'ACTIVE',
        raw: { listingType: 'WANTED' },
        expectedTexts: ['إيقاف البحث'],
      },
      {
        name: 'car ARCHIVED',
        entityType: 'car',
        rawStatus: 'ARCHIVED',
        raw: { listingType: 'SALE' },
        expectedTexts: ['استعادة'],
      },
      {
        name: 'bus ACTIVE/BUS_RENT',
        entityType: 'bus',
        rawStatus: 'ACTIVE',
        raw: { busListingType: 'BUS_RENT' },
        expectedTexts: ['تعليم كمؤجر', 'إيقاف مؤقت'],
      },
      {
        name: 'bus RENTED',
        entityType: 'bus',
        rawStatus: 'RENTED',
        raw: { busListingType: 'BUS_RENT' },
        expectedTexts: ['إعادة إتاحة للإيجار'],
      },
      {
        name: 'bus ACTIVE/BUS_SALE',
        entityType: 'bus',
        rawStatus: 'ACTIVE',
        raw: { busListingType: 'BUS_SALE' },
        expectedTexts: ['تعليم كمباع', 'أرشفة'],
      },
      {
        name: 'equipment ACTIVE/EQUIPMENT_RENT',
        entityType: 'equipment',
        rawStatus: 'ACTIVE',
        raw: { equipmentListingType: 'EQUIPMENT_RENT' },
        expectedTexts: ['تعليم كمؤجر', 'إيقاف مؤقت'],
      },
      {
        name: 'equipment RENTED',
        entityType: 'equipment',
        rawStatus: 'RENTED',
        raw: { equipmentListingType: 'EQUIPMENT_RENT' },
        expectedTexts: ['إعادة إتاحة للإيجار'],
      },
      {
        name: 'equipment ARCHIVED',
        entityType: 'equipment',
        rawStatus: 'ARCHIVED',
        raw: { equipmentListingType: 'EQUIPMENT_SALE' },
        expectedTexts: ['استعادة'],
      },
      {
        name: 'equipment DRAFT',
        entityType: 'equipment',
        rawStatus: 'DRAFT',
        raw: { equipmentListingType: 'EQUIPMENT_SALE' },
        expectedTexts: ['نشر'],
      },
    ]

    it.each(cases)(
      '$name -> showOptions receives expected texts $expectedTexts',
      async ({ entityType, rawStatus, raw, expectedTexts }) => {
        const { result } = await renderHook(() => useMyListingsScreen(), {
          wrapper,
        })

        const item = makeItem({
          id: 'item-1',
          entityType,
          rawStatus,
          version: 2,
          raw,
        })

        result.current.handleStatusChange(item)

        expect(dialogService.showOptions).toHaveBeenCalledTimes(1)
        const [title, options] = (dialogService.showOptions as jest.Mock).mock
          .calls[0]
        expect(title).toBe('تغيير الحالة')
        expect(options.map((o: { text: string }) => o.text)).toEqual(
          expectedTexts
        )
      }
    )
  })

  describe('confirmStatusChange — API execution and error handling', () => {
    it('car archive -> calls listingsApi.updateStatus(id, "archive", version)', async () => {
      ;(listingsApi.updateStatus as jest.Mock).mockResolvedValueOnce({
        data: {},
      })
      const { result } = await renderHook(() => useMyListingsScreen(), {
        wrapper,
      })

      const item = makeItem({
        id: 'car-42',
        entityType: 'car',
        rawStatus: 'ACTIVE',
        version: 5,
        raw: { listingType: 'SALE' },
      })

      result.current.handleStatusChange(item)
      const [, options] = (dialogService.showOptions as jest.Mock).mock.calls[0]
      const archiveOption = options.find(
        (o: { text: string }) => o.text === 'أرشفة'
      )

      jest.useFakeTimers()
      archiveOption.onPress()
      jest.advanceTimersByTime(400)
      jest.useRealTimers()

      expect(dialogService.confirm).toHaveBeenCalledTimes(1)
      const onConfirm = (dialogService.confirm as jest.Mock).mock.calls[0][2]

      await act(async () => {
        await onConfirm()
      })

      expect(listingsApi.updateStatus).toHaveBeenCalledWith(
        'car-42',
        'archive',
        5
      )
      expect(mockRefetch).toHaveBeenCalled()
    })

    it('bus restore -> calls busesApi.update with { version, status: "ACTIVE" } and invalidateBusListingQueries', async () => {
      ;(busesApi.update as jest.Mock).mockResolvedValueOnce({ data: {} })
      const { result } = await renderHook(() => useMyListingsScreen(), {
        wrapper,
      })

      const item = makeItem({
        id: 'bus-99',
        entityType: 'bus',
        rawStatus: 'RENTED',
        version: 6,
        raw: { busListingType: 'BUS_RENT' },
      })

      result.current.handleStatusChange(item)
      const [, options] = (dialogService.showOptions as jest.Mock).mock.calls[0]

      jest.useFakeTimers()
      options[0].onPress()
      jest.advanceTimersByTime(400)
      jest.useRealTimers()

      const onConfirm = (dialogService.confirm as jest.Mock).mock.calls[0][2]
      await act(async () => {
        await onConfirm()
      })

      expect(busesApi.update).toHaveBeenCalledWith('bus-99', {
        version: 6,
        status: 'ACTIVE',
      })
      expect(invalidateBusListingQueries).toHaveBeenCalledWith(
        queryClient,
        'bus-99'
      )
      expect(mockRefetch).toHaveBeenCalled()
    })

    it('equipment markRented -> calls equipmentApi.update with { version, status: "RENTED" } and invalidateEquipmentListingQueries', async () => {
      ;(equipmentApi.update as jest.Mock).mockResolvedValueOnce({ data: {} })
      const { result } = await renderHook(() => useMyListingsScreen(), {
        wrapper,
      })

      const item = makeItem({
        id: 'eq-77',
        entityType: 'equipment',
        rawStatus: 'ACTIVE',
        version: 3,
        raw: { equipmentListingType: 'EQUIPMENT_RENT' },
      })

      result.current.handleStatusChange(item)
      const [, options] = (dialogService.showOptions as jest.Mock).mock.calls[0]
      const markRentedOpt = options.find(
        (o: { text: string }) => o.text === 'تعليم كمؤجر'
      )

      jest.useFakeTimers()
      markRentedOpt.onPress()
      jest.advanceTimersByTime(400)
      jest.useRealTimers()

      const onConfirm = (dialogService.confirm as jest.Mock).mock.calls[0][2]
      await act(async () => {
        await onConfirm()
      })

      expect(equipmentApi.update).toHaveBeenCalledWith('eq-77', {
        version: 3,
        status: 'RENTED',
      })
      expect(invalidateEquipmentListingQueries).toHaveBeenCalledWith(
        queryClient,
        'eq-77'
      )
      expect(mockRefetch).toHaveBeenCalled()
    })

    it('missing phone on restore/submit -> calls promptProfilePhoneRequired and makes NO API call', async () => {
      useAuthStore.setState({
        user: {
          id: 'u-no-phone',
          username: 'owner',
          phone: '',
        } as unknown as User,
      })

      const { result } = await renderHook(() => useMyListingsScreen(), {
        wrapper,
      })

      const item = makeItem({
        id: 'bus-arch',
        entityType: 'bus',
        rawStatus: 'ARCHIVED',
        version: 2,
        raw: { busListingType: 'BUS_SALE' },
      })

      result.current.handleStatusChange(item)
      const [, options] = (dialogService.showOptions as jest.Mock).mock.calls[0]

      options[0].onPress()

      expect(promptProfilePhoneRequired).toHaveBeenCalledTimes(1)
      expect(dialogService.confirm).not.toHaveBeenCalled()
      expect(busesApi.update).not.toHaveBeenCalled()
    })

    it('409 conflict -> shows conflict alert and refreshes', async () => {
      ;(busesApi.update as jest.Mock).mockRejectedValueOnce({
        response: { status: 409 },
      })
      const { result } = await renderHook(() => useMyListingsScreen(), {
        wrapper,
      })

      const item = makeItem({
        id: 'bus-409',
        entityType: 'bus',
        rawStatus: 'ACTIVE',
        version: 1,
        raw: { busListingType: 'BUS_SALE' },
      })

      result.current.handleStatusChange(item)
      const [, options] = (dialogService.showOptions as jest.Mock).mock.calls[0]

      jest.useFakeTimers()
      options[0].onPress()
      jest.advanceTimersByTime(400)
      jest.useRealTimers()

      const onConfirm = (dialogService.confirm as jest.Mock).mock.calls[0][2]
      await act(async () => {
        await onConfirm()
      })

      expect(dialogService.alert).toHaveBeenCalledWith(
        'تحديث مطلوب',
        'تم تعديل الإعلان من جهاز آخر. يرجى التحديث والمحاولة مجدداً.'
      )
      expect(mockRefetch).toHaveBeenCalled()
    })

    it('clears pending confirm timer on unmount and ignores option selection after unmount', async () => {
      const rendered = await renderHook(() => useMyListingsScreen(), {
        wrapper,
      })

      const item = makeItem({
        id: 'bus-unmount',
        entityType: 'bus',
        rawStatus: 'ACTIVE',
        version: 1,
        raw: { busListingType: 'BUS_SALE' },
      })

      rendered.result.current.handleStatusChange(item)
      const [, options] = (dialogService.showOptions as jest.Mock).mock.calls[0]

      jest.useFakeTimers()
      options[0].onPress()

      const unmountPromise = rendered.unmount()
      jest.advanceTimersByTime(0)
      await unmountPromise

      jest.advanceTimersByTime(400)
      expect(dialogService.confirm).not.toHaveBeenCalled()

      // Also verify pressing an option AFTER unmount is ignored
      options[1].onPress()
      jest.advanceTimersByTime(400)
      expect(dialogService.confirm).not.toHaveBeenCalled()
      jest.useRealTimers()
    })

    it('cancels earlier pending timer when a newer status option is pressed within 400 ms', async () => {
      const { result } = await renderHook(() => useMyListingsScreen(), {
        wrapper,
      })

      const item = makeItem({
        id: 'bus-double',
        entityType: 'bus',
        rawStatus: 'ACTIVE',
        version: 1,
        raw: { busListingType: 'BUS_SALE' },
      })

      result.current.handleStatusChange(item)
      const [, options] = (dialogService.showOptions as jest.Mock).mock.calls[0]

      jest.useFakeTimers()
      options[0].onPress() // markSold ("تأكيد البيع")
      jest.advanceTimersByTime(200)
      options[1].onPress() // archive ("تأكيد الإجراء")
      jest.advanceTimersByTime(400)
      jest.useRealTimers()

      expect(dialogService.confirm).toHaveBeenCalledTimes(1)
      expect((dialogService.confirm as jest.Mock).mock.calls[0][0]).toBe(
        'تأكيد الإجراء'
      )
    })
  })
})
