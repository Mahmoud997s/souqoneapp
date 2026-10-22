import { renderHook, act } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useEquipmentOwnerActions } from './useEquipmentOwnerActions'
import { equipmentApi } from '../../api/equipment'
import { useAuthStore } from '../../store/authStore'
import * as phoneGuard from '../../utils/profilePhoneGuard'
import type { EquipmentDetailViewModel } from '../../types/equipmentDetailViewModel.types'

jest.mock('../../api/equipment')
jest.mock('../../utils/profilePhoneGuard')

const createMockEquipmentVm = (
  overrides?: Partial<EquipmentDetailViewModel>
): EquipmentDetailViewModel =>
  ({
    id: 'eq-owner-1',
    version: 4,
    status: 'ACTIVE',
    title: 'معدة تجريبية',
    description: 'وصف المعدة',
    listingType: 'EQUIPMENT_SALE',
    equipmentListingType: 'EQUIPMENT_SALE',
    equipmentType: 'EXCAVATOR',
    equipmentTypeLabel: 'حفار',
    price: {
      amount: 10000,
      formattedAmount: '10,000',
      currency: 'ر.ع',
      fullPriceLabel: '10,000 ر.ع',
      isNegotiable: false,
      listingType: 'EQUIPMENT_SALE',
    },
    images: [],
    location: { fullLocationText: 'مسقط', hasCoordinates: false },
    seller: {
      id: 'user-1',
      name: 'مالك المعدة',
      username: 'owner',
      isVerified: true,
      memberSinceLabel: 'عضو في سوق ون',
    },
    whatsappEnabled: true,
    postedAtLabel: 'الآن',
    viewCount: 25,
    keySpecs: [],
    specsSections: [],
    features: [],
    operatorBadge: null,
    rental: null,
    wanted: null,
    ...overrides,
  } as EquipmentDetailViewModel)

describe('useEquipmentOwnerActions', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    jest.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
    useAuthStore.setState({
      user: { id: 'user-1', phone: '+96891234567' } as any,
      isLoggedIn: true,
    })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  describe('Action Matrix Derivation', () => {
    it('derives correct actions for ACTIVE + SALE: edit, markSold, archive, delete', async () => {
      const vm = createMockEquipmentVm({ status: 'ACTIVE', equipmentListingType: 'EQUIPMENT_SALE' })
      const { result } = await renderHook(() => useEquipmentOwnerActions(vm), { wrapper })

      const actionIds = result.current.actions.map((a) => a.id)
      expect(actionIds).toEqual(['edit', 'markSold', 'archive', 'delete'])
    })

    it('derives correct actions for ACTIVE + RENT: edit, markRented, pause, delete', async () => {
      const vm = createMockEquipmentVm({ status: 'ACTIVE', equipmentListingType: 'EQUIPMENT_RENT' })
      const { result } = await renderHook(() => useEquipmentOwnerActions(vm), { wrapper })

      const actionIds = result.current.actions.map((a) => a.id)
      expect(actionIds).toEqual(['edit', 'markRented', 'pause', 'delete'])
    })

    it('derives correct actions for ACTIVE + WANTED: edit, archive, delete', async () => {
      const vm = createMockEquipmentVm({ status: 'ACTIVE', equipmentListingType: 'EQUIPMENT_WANTED' })
      const { result } = await renderHook(() => useEquipmentOwnerActions(vm), { wrapper })

      const actionIds = result.current.actions.map((a) => a.id)
      expect(actionIds).toEqual(['edit', 'archive', 'delete'])
    })

    it('derives correct actions for ARCHIVED: edit, restore, delete', async () => {
      const vm = createMockEquipmentVm({ status: 'ARCHIVED' })
      const { result } = await renderHook(() => useEquipmentOwnerActions(vm), { wrapper })

      const actionIds = result.current.actions.map((a) => a.id)
      expect(actionIds).toEqual(['edit', 'restore', 'delete'])
    })

    it('derives correct actions for RENTED: edit, restore, delete', async () => {
      const vm = createMockEquipmentVm({ status: 'RENTED', equipmentListingType: 'EQUIPMENT_RENT' })
      const { result } = await renderHook(() => useEquipmentOwnerActions(vm), { wrapper })

      const actionIds = result.current.actions.map((a) => a.id)
      expect(actionIds).toEqual(['edit', 'restore', 'delete'])
    })

    it('derives correct actions for DRAFT: edit, submit, delete', async () => {
      const vm = createMockEquipmentVm({ status: 'DRAFT' })
      const { result } = await renderHook(() => useEquipmentOwnerActions(vm), { wrapper })

      const actionIds = result.current.actions.map((a) => a.id)
      expect(actionIds).toEqual(['edit', 'submit', 'delete'])
    })

    it('derives delete only for SOLD and SUSPENDED (no edit)', async () => {
      const soldVm = createMockEquipmentVm({ status: 'SOLD' })
      const { result: soldResult } = await renderHook(() => useEquipmentOwnerActions(soldVm), { wrapper })
      expect(soldResult.current.actions.map((a) => a.id)).toEqual(['delete'])

      const suspendedVm = createMockEquipmentVm({ status: 'SUSPENDED' })
      const { result: suspResult } = await renderHook(() => useEquipmentOwnerActions(suspendedVm), { wrapper })
      expect(suspResult.current.actions.map((a) => a.id)).toEqual(['delete'])
    })
  })

  describe('Action Execution', () => {
    it('executes status transition with correct payload and invalidates queries', async () => {
      ;(equipmentApi.update as jest.Mock).mockResolvedValueOnce({ data: {} })
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

      const vm = createMockEquipmentVm({ id: 'eq-1', version: 3, status: 'ACTIVE', equipmentListingType: 'EQUIPMENT_SALE' })
      const { result } = await renderHook(() => useEquipmentOwnerActions(vm), { wrapper })

      await act(async () => {
        await result.current.run('markSold')
      })

      expect(equipmentApi.update).toHaveBeenCalledWith('eq-1', {
        version: 3,
        status: 'SOLD',
      })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['equipment-detail', 'eq-1'] })
    })

    it('executes markRented for EQUIPMENT_RENT', async () => {
      ;(equipmentApi.update as jest.Mock).mockResolvedValueOnce({ data: {} })

      const vm = createMockEquipmentVm({ id: 'eq-2', version: 1, status: 'ACTIVE', equipmentListingType: 'EQUIPMENT_RENT' })
      const { result } = await renderHook(() => useEquipmentOwnerActions(vm), { wrapper })

      await act(async () => {
        await result.current.run('markRented')
      })

      expect(equipmentApi.update).toHaveBeenCalledWith('eq-2', {
        version: 1,
        status: 'RENTED',
      })
    })

    it('executes delete operation and removes detail query cache', async () => {
      ;(equipmentApi.remove as jest.Mock).mockResolvedValueOnce({ data: { deleted: true } })
      const removeSpy = jest.spyOn(queryClient, 'removeQueries')

      const vm = createMockEquipmentVm({ id: 'eq-del-1' })
      const { result } = await renderHook(() => useEquipmentOwnerActions(vm), { wrapper })

      await act(async () => {
        await result.current.run('delete')
      })

      expect(equipmentApi.remove).toHaveBeenCalledWith('eq-del-1')
      expect(removeSpy).toHaveBeenCalledWith({ queryKey: ['equipment-detail', 'eq-del-1'] })
    })

    it('refetches detail query on 409 conflict and rethrows', async () => {
      const error409 = { response: { status: 409 } }
      ;(equipmentApi.update as jest.Mock).mockRejectedValueOnce(error409)
      const refetchSpy = jest.spyOn(queryClient, 'refetchQueries')

      const vm = createMockEquipmentVm({ id: 'eq-lock-1', version: 2 })
      const { result } = await renderHook(() => useEquipmentOwnerActions(vm), { wrapper })

      await expect(
        act(async () => {
          await result.current.run('archive')
        })
      ).rejects.toEqual(error409)

      expect(refetchSpy).toHaveBeenCalledWith({ queryKey: ['equipment-detail', 'eq-lock-1'] })
    })

    it('guards restore and submit on user phone requirement', async () => {
      useAuthStore.setState({
        user: { id: 'user-no-phone', phone: null } as any,
      })

      const vm = createMockEquipmentVm({ status: 'ARCHIVED' })
      const { result } = await renderHook(() => useEquipmentOwnerActions(vm), { wrapper })

      await act(async () => {
        await result.current.run('restore')
      })

      expect(phoneGuard.promptProfilePhoneRequired).toHaveBeenCalled()
      expect(equipmentApi.update).not.toHaveBeenCalled()
    })
  })
})
