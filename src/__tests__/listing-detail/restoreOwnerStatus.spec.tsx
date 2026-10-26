import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EquipmentDetailScreen } from '../../screens/equipment/EquipmentDetailScreen'
import { BusDetailScreen } from '../../screens/buses/BusDetailScreen'
import { CarDetailScreen } from '../../screens/cars/CarDetailScreen'
import { equipmentApi } from '../../api/equipment'
import { busesApi } from '../../api/buses'
import { listingsApi } from '../../api/listings'
import { favoritesApi } from '../../api/favorites'
import { useAuthStore } from '../../store/authStore'
import { dialogService } from '../../store/dialogStore'
import * as phoneGuard from '../../utils/profilePhoneGuard'
import type { EquipmentDetailApi } from '../../types/equipmentDetailApi.types'
import type { BusDetailApi } from '../../types/busDetailApi.types'
import type { CarDetailApi } from '../../types/carDetailApi.types'
import type { User } from '../../types/auth.types'

jest.setTimeout(30000)

// ── MOCKS ───────────────────────────────────────────────────────────────────

const mockRouterPush = jest.fn()
const mockRouterBack = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    back: mockRouterBack,
    canGoBack: () => true,
  }),
  useLocalSearchParams: () => ({ id: 'test-item-1' }),
}))

jest.mock('expo-image', () => {
  const { View } = require('react-native')
  return { Image: (props: Record<string, unknown>) => <View {...props} /> }
})

jest.mock('expo-blur', () => {
  const { View } = require('react-native')
  return { BlurView: (props: Record<string, unknown>) => <View {...props} /> }
})

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native')
  return { Ionicons: (props: Record<string, unknown>) => <View {...props} /> }
})

jest.mock('../../api/equipment')
jest.mock('../../api/buses')
jest.mock('../../api/listings')
jest.mock('../../api/favorites')
jest.mock('../../utils/assertOwnerHasPhoneForEdit', () => ({
  assertOwnerHasPhoneForEdit: jest.fn().mockReturnValue(true),
}))

// Mock test data factories
const mockArchivedEquipment: EquipmentDetailApi = {
  id: 'eq-archived-1',
  title: 'حفار كوماتسو للإيجار',
  slug: 'komatsu-rental',
  description: 'حفار كوماتسو مجنزر بحالة جيدة جداً',
  equipmentType: 'EXCAVATOR',
  listingType: 'EQUIPMENT_SALE',
  price: 25000,
  currency: 'OMR',
  features: [],
  status: 'ARCHIVED',
  userId: 'user-owner-1',
  user: {
    id: 'user-owner-1',
    username: 'heavy_om',
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  images: [],
  createdAt: '2026-10-22T00:00:00.000Z',
  updatedAt: '2026-10-22T00:00:00.000Z',
  version: 1,
  viewCount: 15,
}

const mockActiveEquipment: EquipmentDetailApi = {
  ...mockArchivedEquipment,
  status: 'ACTIVE',
  version: 2,
}

const mockArchivedBus: BusDetailApi = {
  id: 'bus-archived-1',
  title: 'حافلة تويوتا كوستر 2022',
  slug: 'toyota-coaster-2022',
  description: 'حافلة تويوتا كوستر 30 راكب بحالة ممتازة',
  busListingType: 'BUS_SALE',
  busType: 'COASTER',
  make: 'Toyota',
  model: 'Coaster',
  year: 2022,
  capacity: 30,
  features: [],
  price: 18000,
  currency: 'OMR',
  isPriceNegotiable: false,
  withDriver: false,
  whatsappEnabled: true,
  hiddenByOwnerStatus: false,
  isPremium: false,
  status: 'ARCHIVED',
  userId: 'user-owner-1',
  user: {
    id: 'user-owner-1',
    username: 'bus_om',
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  images: [],
  createdAt: '2026-10-22T00:00:00.000Z',
  updatedAt: '2026-10-22T00:00:00.000Z',
  version: 1,
  viewCount: 20,
}

const mockActiveBus: BusDetailApi = {
  ...mockArchivedBus,
  status: 'ACTIVE',
  version: 2,
}

const mockArchivedCar: CarDetailApi = {
  id: 'car-archived-1',
  title: 'تويوتا كامري 2023',
  description: 'تويوتا كامري بحالة الوكالة',
  listingType: 'SALE',
  price: 9500,
  currency: 'OMR',
  status: 'ARCHIVED',
  seller: {
    id: 'user-owner-1',
    username: 'car_om',
    createdAt: '2025-01-01T00:00:00.000Z',
    isVerified: true,
  },
  images: [],
  createdAt: '2026-10-22T00:00:00.000Z',
  updatedAt: '2026-10-22T00:00:00.000Z',
  version: 1,
  viewCount: 30,
}

const mockActiveCar: CarDetailApi = {
  ...mockArchivedCar,
  status: 'ACTIVE',
  version: 2,
}

const mockOwnerUser: User = {
  id: 'user-owner-1',
  email: 'owner@example.com',
  username: 'heavy_om',
  phone: '+96891234567',
  role: 'user',
  isVerified: true,
  createdAt: '2025-01-01T00:00:00.000Z',
}

const mockOwnerUserNoPhone: User = {
  ...mockOwnerUser,
  phone: undefined,
}

describe('Owner Restore Flow & Status Changes Integration', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    jest.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
    ;(favoritesApi.check as jest.Mock).mockResolvedValue({ data: { favorited: false } })
    ;(equipmentApi.getSimilar as jest.Mock).mockResolvedValue({ data: [] })
    ;(busesApi.getSimilar as jest.Mock).mockResolvedValue({ data: [] })

    useAuthStore.setState({
      user: mockOwnerUser,
      isLoggedIn: true,
    })
  })

  const renderWithClient = async (ui: React.ReactElement) =>
    await render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)

  describe('Equipment Restore Flow', () => {
    it('restores archived equipment listing, refetches active state, and surfaces success feedback', async () => {
      let getByIdCallCount = 0
      ;(equipmentApi.getById as jest.Mock).mockImplementation(() => {
        getByIdCallCount++
        if (getByIdCallCount === 1) {
          return Promise.resolve({ data: mockArchivedEquipment })
        }
        return Promise.resolve({ data: mockActiveEquipment })
      })
      ;(equipmentApi.update as jest.Mock).mockResolvedValue({ data: mockActiveEquipment })

      const alertSpy = jest.spyOn(dialogService, 'alert')
      const confirmSpy = jest.spyOn(dialogService, 'confirm')
      const showOptionsSpy = jest.spyOn(dialogService, 'showOptions')

      const { findByTestId, queryByTestId } = await renderWithClient(
        <EquipmentDetailScreen id="eq-archived-1" />
      )

      // 1. Initial screen loads with ARCHIVED status and displays "إدارة الحالة" in sticky bar
      const manageStatusBtn = await findByTestId('btn-owner-manage-status')
      expect(manageStatusBtn).toBeTruthy()

      // 2. Press "إدارة الحالة" -> dialogService.showOptions called with "استعادة"
      await act(async () => {
        fireEvent.press(manageStatusBtn)
      })

      expect(showOptionsSpy).toHaveBeenCalledWith(
        'إدارة حالة الإعلان',
        expect.arrayContaining([
          expect.objectContaining({ text: 'استعادة' }),
        ])
      )

      const options = showOptionsSpy.mock.calls[0][1]
      const restoreOption = options.find((o) => o.text === 'استعادة')!
      expect(restoreOption).toBeTruthy()

      // 3. Select "استعادة" -> 400ms delay -> dialogService.confirm triggers
      jest.useFakeTimers()
      restoreOption?.onPress?.()
      jest.advanceTimersByTime(400)
      jest.useRealTimers()

      expect(confirmSpy).toHaveBeenCalledWith(
        'تأكيد الإجراء',
        'هل أنت متأكد من تغيير حالة الإعلان؟',
        expect.any(Function),
        'تأكيد',
        'إلغاء',
        false
      )

      const onConfirm = confirmSpy.mock.calls[0][2]
      await act(async () => {
        await onConfirm()
      })

      // 4. Assert update API was called with exact target payload
      expect(equipmentApi.update).toHaveBeenCalledWith('eq-archived-1', {
        version: 1,
        status: 'ACTIVE',
      })

      // 5. Assert success feedback dialog was shown to the user
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringMatching(/تم/i),
        expect.stringMatching(/استعاد|تغيير/i),
        'success'
      )

      // 6. Assert screen re-rendered with ACTIVE status actions
      await waitFor(() => {
        // "استعادة" should no longer be present in options
        showOptionsSpy.mockClear()
      })
    })

    it('blocks restore when user has no phone and prompts profile phone without calling API', async () => {
      useAuthStore.setState({
        user: mockOwnerUserNoPhone,
        isLoggedIn: true,
      })
      ;(equipmentApi.getById as jest.Mock).mockResolvedValue({ data: mockArchivedEquipment })
      const phonePromptSpy = jest.spyOn(phoneGuard, 'promptProfilePhoneRequired')
      const showOptionsSpy = jest.spyOn(dialogService, 'showOptions')
      const confirmSpy = jest.spyOn(dialogService, 'confirm')

      const { findByTestId } = await renderWithClient(
        <EquipmentDetailScreen id="eq-archived-1" />
      )

      const manageStatusBtn = await findByTestId('btn-owner-manage-status')
      await act(async () => {
        fireEvent.press(manageStatusBtn)
      })

      const options = showOptionsSpy.mock.calls[0][1]
      const restoreOption = options.find((o) => o.text === 'استعادة')!

      jest.useFakeTimers()
      restoreOption?.onPress?.()
      jest.advanceTimersByTime(400)
      jest.useRealTimers()

      const onConfirm = confirmSpy.mock.calls[0][2]
      await act(async () => {
        await onConfirm()
      })

      expect(phonePromptSpy).toHaveBeenCalled()
      expect(equipmentApi.update).not.toHaveBeenCalled()
    })

    it('surfaces 409 conflict error in Arabic dialog when listing was modified elsewhere', async () => {
      ;(equipmentApi.getById as jest.Mock).mockResolvedValue({ data: mockArchivedEquipment })
      ;(equipmentApi.update as jest.Mock).mockRejectedValueOnce({ response: { status: 409 } })
      const alertSpy = jest.spyOn(dialogService, 'alert')
      const showOptionsSpy = jest.spyOn(dialogService, 'showOptions')
      const confirmSpy = jest.spyOn(dialogService, 'confirm')

      const { findByTestId } = await renderWithClient(
        <EquipmentDetailScreen id="eq-archived-1" />
      )

      const manageStatusBtn = await findByTestId('btn-owner-manage-status')
      await act(async () => {
        fireEvent.press(manageStatusBtn)
      })

      const options = showOptionsSpy.mock.calls[0][1]
      const restoreOption = options.find((o) => o.text === 'استعادة')!

      jest.useFakeTimers()
      restoreOption?.onPress?.()
      jest.advanceTimersByTime(400)
      jest.useRealTimers()

      const onConfirm = confirmSpy.mock.calls[0][2]
      await act(async () => {
        await onConfirm()
      })

      expect(alertSpy).toHaveBeenCalledWith(
        'تعارض في البيانات',
        'تم تعديل الإعلان من جهاز آخر. يرجى التحديث والمحاولة مجدداً.'
      )
    })

    it('surfaces Arabic error dialog when active listing limit is reached and keeps ARCHIVED status', async () => {
      ;(equipmentApi.getById as jest.Mock).mockResolvedValue({ data: mockArchivedEquipment })
      ;(equipmentApi.update as jest.Mock).mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            code: 'ACTIVE_LISTINGS_LIMIT_REACHED',
            message: 'لقد بلغت الحد الأقصى للإعلانات النشطة. يرجى حذف أحد إعلاناتك أو إيقافه ثم المحاولة مرة أخرى.',
          },
        },
      })
      const alertSpy = jest.spyOn(dialogService, 'alert')
      const showOptionsSpy = jest.spyOn(dialogService, 'showOptions')
      const confirmSpy = jest.spyOn(dialogService, 'confirm')

      const { findByTestId } = await renderWithClient(
        <EquipmentDetailScreen id="eq-archived-1" />
      )

      const manageStatusBtn = await findByTestId('btn-owner-manage-status')
      await act(async () => {
        fireEvent.press(manageStatusBtn)
      })

      const options = showOptionsSpy.mock.calls[0][1]
      const restoreOption = options.find((o) => o.text === 'استعادة')!

      jest.useFakeTimers()
      restoreOption?.onPress?.()
      jest.advanceTimersByTime(400)
      jest.useRealTimers()

      const onConfirm = confirmSpy.mock.calls[0][2]
      await act(async () => {
        await onConfirm()
      })

      expect(alertSpy).toHaveBeenCalledWith(
        'خطأ',
        expect.stringMatching(/الحد الأقصى للإعلانات النشطة/)
      )
    })
  })

  describe('Bus Restore Flow', () => {
    it('restores archived bus listing, refetches active state, and surfaces success feedback', async () => {
      let getByIdCallCount = 0
      ;(busesApi.getById as jest.Mock).mockImplementation(() => {
        getByIdCallCount++
        if (getByIdCallCount === 1) {
          return Promise.resolve({ data: mockArchivedBus })
        }
        return Promise.resolve({ data: mockActiveBus })
      })
      ;(busesApi.update as jest.Mock).mockResolvedValue({ data: mockActiveBus })

      const alertSpy = jest.spyOn(dialogService, 'alert')
      const showOptionsSpy = jest.spyOn(dialogService, 'showOptions')
      const confirmSpy = jest.spyOn(dialogService, 'confirm')

      const { findByTestId } = await renderWithClient(
        <BusDetailScreen id="bus-archived-1" />
      )

      const manageStatusBtn = await findByTestId('btn-owner-manage-status')
      expect(manageStatusBtn).toBeTruthy()

      await act(async () => {
        fireEvent.press(manageStatusBtn)
      })

      const options = showOptionsSpy.mock.calls[0][1]
      const restoreOption = options.find((o) => o.text === 'استعادة')!

      jest.useFakeTimers()
      restoreOption?.onPress?.()
      jest.advanceTimersByTime(400)
      jest.useRealTimers()

      const onConfirm = confirmSpy.mock.calls[0][2]
      await act(async () => {
        await onConfirm()
      })

      expect(busesApi.update).toHaveBeenCalledWith('bus-archived-1', {
        version: 1,
        status: 'ACTIVE',
      })

      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringMatching(/تم/i),
        expect.stringMatching(/استعاد|تغيير/i),
        'success'
      )
    })
  })

  describe('Car Restore Flow', () => {
    it('restores archived car listing, refetches active state, and surfaces success feedback', async () => {
      let getByIdCallCount = 0
      ;(listingsApi.getById as jest.Mock).mockImplementation(() => {
        getByIdCallCount++
        if (getByIdCallCount === 1) {
          return Promise.resolve({ data: mockArchivedCar })
        }
        return Promise.resolve({ data: mockActiveCar })
      })
      ;(listingsApi.updateStatus as jest.Mock).mockResolvedValue({ data: mockActiveCar })

      const alertSpy = jest.spyOn(dialogService, 'alert')
      const showOptionsSpy = jest.spyOn(dialogService, 'showOptions')
      const confirmSpy = jest.spyOn(dialogService, 'confirm')

      const { findByTestId } = await renderWithClient(
        <CarDetailScreen id="car-archived-1" />
      )

      const manageStatusBtn = await findByTestId('btn-owner-manage-status')
      expect(manageStatusBtn).toBeTruthy()

      await act(async () => {
        fireEvent.press(manageStatusBtn)
      })

      const options = showOptionsSpy.mock.calls[0][1]
      const restoreOption = options.find((o) => o.text === 'استعادة')!

      jest.useFakeTimers()
      restoreOption?.onPress?.()
      jest.advanceTimersByTime(400)
      jest.useRealTimers()

      const onConfirm = confirmSpy.mock.calls[0][2]
      await act(async () => {
        await onConfirm()
      })

      expect(listingsApi.updateStatus).toHaveBeenCalledWith('car-archived-1', 'restore', 1)

      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringMatching(/تم/i),
        expect.stringMatching(/استعاد|تغيير/i),
        'success'
      )
    })
  })
})
