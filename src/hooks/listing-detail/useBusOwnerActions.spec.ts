import React from 'react'
import { render, waitFor, act } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useBusOwnerActions, isOptimisticLockError, UseBusOwnerActionsResult } from './useBusOwnerActions'
import type { BusDetailViewModel } from '../../types/busDetailViewModel.types'
import { busesApi } from '../../api/buses'
import { useAuthStore } from '../../store/authStore'
import { promptProfilePhoneRequired } from '../../utils/profilePhoneGuard'

jest.mock('../../api/buses', () => ({
  busesApi: {
    update: jest.fn(),
    remove: jest.fn(),
  },
}))

jest.mock('../../utils/profilePhoneGuard', () => ({
  promptProfilePhoneRequired: jest.fn(),
  isProfilePhoneRequiredError: jest.fn(),
}))

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

function makeBusVm(
  overrides: Partial<Pick<BusDetailViewModel, 'status' | 'busListingType' | 'id' | 'version' | 'viewCount'>>
): BusDetailViewModel {
  return {
    id: 'bus-test-1',
    version: 2,
    status: 'ACTIVE',
    busListingType: 'BUS_SALE',
    busTypeLabel: 'كوستر',
    make: 'Toyota',
    model: 'Coaster',
    title: 'تويوتا كوستر للبيع',
    description: '',
    price: {
      amount: 15000,
      formattedAmount: '15,000',
      currency: 'ر.ع',
      fullPriceLabel: '15,000 ر.ع',
      isNegotiable: false,
      listingType: 'BUS_SALE',
    },
    images: [],
    location: { fullLocationText: 'مسقط', hasCoordinates: false },
    seller: {
      id: 'seller-1',
      name: 'سالم',
      username: 'salim',
      isVerified: true,
      memberSinceLabel: 'عضو منذ 2024',
    },
    whatsappEnabled: true,
    postedAtLabel: 'الآن',
    viewCount: 50,
    listingType: 'BUS_SALE',
    keySpecs: [],
    specsSections: [],
    features: [],
    contract: { access: 'hidden' },
    ...overrides,
  }
}

function renderOwnerActions(vm: BusDetailViewModel) {
  const queryClient = createTestQueryClient()
  let hookResult: UseBusOwnerActionsResult | undefined

  function Consumer() {
    hookResult = useBusOwnerActions(vm)
    return null
  }

  const rendered = render(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(Consumer)
    )
  )

  return {
    get current(): UseBusOwnerActionsResult {
      return hookResult!
    },
    queryClient,
    ...rendered,
  }
}

const ids = (result: UseBusOwnerActionsResult) => result.actions.map((a) => a.id)

describe('useBusOwnerActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useAuthStore.setState({
      user: { id: 'u1', username: 'owner', phone: '+96891234567' } as any,
      isLoggedIn: true,
      isGuest: false,
    })
  })

  describe('Action Matrix', () => {
    it('ACTIVE + BUS_SALE: returns edit, markSold, archive, delete', async () => {
      const hook = renderOwnerActions(
        makeBusVm({ status: 'ACTIVE', busListingType: 'BUS_SALE' })
      )
      await waitFor(() => expect(hook.current).toBeDefined())
      expect(ids(hook.current)).toEqual(['edit', 'markSold', 'archive', 'delete'])
    })

    it('ACTIVE + BUS_SALE_WITH_CONTRACT: returns edit, markSold, archive, delete', async () => {
      const hook = renderOwnerActions(
        makeBusVm({ status: 'ACTIVE', busListingType: 'BUS_SALE_WITH_CONTRACT' })
      )
      await waitFor(() => expect(hook.current).toBeDefined())
      expect(ids(hook.current)).toEqual(['edit', 'markSold', 'archive', 'delete'])
    })

    it('ACTIVE + BUS_RENT: returns edit, markRented, pause, delete', async () => {
      const hook = renderOwnerActions(
        makeBusVm({ status: 'ACTIVE', busListingType: 'BUS_RENT' })
      )
      await waitFor(() => expect(hook.current).toBeDefined())
      expect(ids(hook.current)).toEqual(['edit', 'markRented', 'pause', 'delete'])
      const markRented = hook.current.actions.find((a) => a.id === 'markRented')!
      expect(markRented.label).toBe('تعليم كمؤجر')
      expect(markRented.confirmTitle).toBe('تأكيد الإيجار')
    })

    it('ARCHIVED: returns edit, restore, delete', async () => {
      const hook = renderOwnerActions(
        makeBusVm({ status: 'ARCHIVED' })
      )
      await waitFor(() => expect(hook.current).toBeDefined())
      expect(ids(hook.current)).toEqual(['edit', 'restore', 'delete'])
    })

    it('DRAFT: returns edit, submit, delete', async () => {
      const hook = renderOwnerActions(
        makeBusVm({ status: 'DRAFT' })
      )
      await waitFor(() => expect(hook.current).toBeDefined())
      expect(ids(hook.current)).toEqual(['edit', 'submit', 'delete'])
    })

    it('RENTED: returns edit, restore (إعادة إتاحة للإيجار), delete', async () => {
      const hook = renderOwnerActions(
        makeBusVm({ status: 'RENTED', busListingType: 'BUS_RENT' })
      )
      await waitFor(() => expect(hook.current).toBeDefined())
      expect(ids(hook.current)).toEqual(['edit', 'restore', 'delete'])
      const restore = hook.current.actions.find((a) => a.id === 'restore')!
      expect(restore.label).toBe('إعادة إتاحة للإيجار')
    })

    it('SOLD: returns delete only (no edit, no status buttons)', async () => {
      const hook = renderOwnerActions(
        makeBusVm({ status: 'SOLD' })
      )
      await waitFor(() => expect(hook.current).toBeDefined())
      expect(ids(hook.current)).toEqual(['delete'])
    })

    it('SUSPENDED: returns delete only', async () => {
      const hook = renderOwnerActions(
        makeBusVm({ status: 'SUSPENDED' })
      )
      await waitFor(() => expect(hook.current).toBeDefined())
      expect(ids(hook.current)).toEqual(['delete'])
    })
  })

  describe('run Execution', () => {
    it('run("edit") is a no-op (no API calls)', async () => {
      const hook = renderOwnerActions(makeBusVm({ status: 'ACTIVE' }))
      await waitFor(() => expect(hook.current).toBeDefined())

      await act(async () => {
        await hook.current.run('edit')
      })
      expect(busesApi.update).not.toHaveBeenCalled()
      expect(busesApi.remove).not.toHaveBeenCalled()
    })

    it('run("markSold") calls busesApi.update with status SOLD and current version', async () => {
      ;(busesApi.update as jest.Mock).mockResolvedValueOnce({ data: {} })
      const hook = renderOwnerActions(
        makeBusVm({ id: 'bus-1', version: 3, status: 'ACTIVE', busListingType: 'BUS_SALE' })
      )
      await waitFor(() => expect(hook.current).toBeDefined())
      const invalidateSpy = jest.spyOn(hook.queryClient, 'invalidateQueries')

      await act(async () => {
        await hook.current.run('markSold')
      })

      expect(busesApi.update).toHaveBeenCalledWith('bus-1', {
        version: 3,
        status: 'SOLD',
      })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['bus-detail', 'bus-1'] })
    })

    it('run("markRented") calls busesApi.update with status RENTED and current version', async () => {
      ;(busesApi.update as jest.Mock).mockResolvedValueOnce({ data: {} })
      const hook = renderOwnerActions(
        makeBusVm({ id: 'bus-rent-1', version: 2, status: 'ACTIVE', busListingType: 'BUS_RENT' })
      )
      await waitFor(() => expect(hook.current).toBeDefined())

      await act(async () => {
        await hook.current.run('markRented')
      })

      expect(busesApi.update).toHaveBeenCalledWith('bus-rent-1', {
        version: 2,
        status: 'RENTED',
      })
    })

    it('run("archive") calls busesApi.update with status ARCHIVED and current version', async () => {
      ;(busesApi.update as jest.Mock).mockResolvedValueOnce({ data: {} })
      const hook = renderOwnerActions(
        makeBusVm({ id: 'bus-1', version: 2, status: 'ACTIVE' })
      )
      await waitFor(() => expect(hook.current).toBeDefined())

      await act(async () => {
        await hook.current.run('archive')
      })

      expect(busesApi.update).toHaveBeenCalledWith('bus-1', {
        version: 2,
        status: 'ARCHIVED',
      })
    })

    it('run("pause") calls busesApi.update with status ARCHIVED for rental buses', async () => {
      ;(busesApi.update as jest.Mock).mockResolvedValueOnce({ data: {} })
      const hook = renderOwnerActions(
        makeBusVm({ id: 'bus-rent-1', version: 1, status: 'ACTIVE', busListingType: 'BUS_RENT' })
      )
      await waitFor(() => expect(hook.current).toBeDefined())

      await act(async () => {
        await hook.current.run('pause')
      })

      expect(busesApi.update).toHaveBeenCalledWith('bus-rent-1', {
        version: 1,
        status: 'ARCHIVED',
      })
    })

    it('run("restore") calls busesApi.update with status ACTIVE when user has phone (ARCHIVED and RENTED)', async () => {
      ;(busesApi.update as jest.Mock).mockResolvedValue({ data: {} })
      const hook = renderOwnerActions(
        makeBusVm({ id: 'bus-1', version: 4, status: 'RENTED', busListingType: 'BUS_RENT' })
      )
      await waitFor(() => expect(hook.current).toBeDefined())

      await act(async () => {
        await hook.current.run('restore')
      })

      expect(busesApi.update).toHaveBeenCalledWith('bus-1', {
        version: 4,
        status: 'ACTIVE',
      })
    })

    it('run("submit") calls busesApi.update with status ACTIVE when user has phone', async () => {
      ;(busesApi.update as jest.Mock).mockResolvedValueOnce({ data: {} })
      const hook = renderOwnerActions(
        makeBusVm({ id: 'bus-1', version: 1, status: 'DRAFT' })
      )
      await waitFor(() => expect(hook.current).toBeDefined())

      await act(async () => {
        await hook.current.run('submit')
      })

      expect(busesApi.update).toHaveBeenCalledWith('bus-1', {
        version: 1,
        status: 'ACTIVE',
      })
    })

    it('prevents restore/submit if user has no phone and prompts profile phone', async () => {
      useAuthStore.setState({
        user: { id: 'u1', username: 'nophone_user', phone: '' } as any,
      })

      const hook = renderOwnerActions(makeBusVm({ id: 'bus-1', status: 'ARCHIVED' }))
      await waitFor(() => expect(hook.current).toBeDefined())

      await act(async () => {
        await hook.current.run('restore')
      })

      expect(promptProfilePhoneRequired).toHaveBeenCalled()
      expect(busesApi.update).not.toHaveBeenCalled()
    })

    it('run("delete") calls busesApi.remove and removes detail query from cache', async () => {
      ;(busesApi.remove as jest.Mock).mockResolvedValueOnce({ data: {} })
      const hook = renderOwnerActions(makeBusVm({ id: 'bus-to-delete', status: 'ACTIVE' }))
      await waitFor(() => expect(hook.current).toBeDefined())
      const removeSpy = jest.spyOn(hook.queryClient, 'removeQueries')

      await act(async () => {
        await hook.current.run('delete')
      })

      expect(busesApi.remove).toHaveBeenCalledWith('bus-to-delete')
      expect(removeSpy).toHaveBeenCalledWith({ queryKey: ['bus-detail', 'bus-to-delete'] })
      expect(removeSpy).toHaveBeenCalledWith({ queryKey: ['bus', 'bus-to-delete'] })
    })

    it('handles 409 conflict: refetches detail query and re-throws error', async () => {
      const conflictError = {
        response: { status: 409, data: { message: 'Version conflict' } },
      }
      ;(busesApi.update as jest.Mock).mockRejectedValueOnce(conflictError)
      const hook = renderOwnerActions(
        makeBusVm({ id: 'bus-conflict', version: 1, status: 'ACTIVE' })
      )
      await waitFor(() => expect(hook.current).toBeDefined())
      const refetchSpy = jest.spyOn(hook.queryClient, 'refetchQueries')

      let caught: unknown
      await act(async () => {
        try {
          await hook.current.run('archive')
        } catch (e) {
          caught = e
        }
      })

      expect(caught).toBe(conflictError)
      expect(refetchSpy).toHaveBeenCalledWith({ queryKey: ['bus-detail', 'bus-conflict'] })
      expect(isOptimisticLockError(conflictError)).toBe(true)
    })
  })
})
