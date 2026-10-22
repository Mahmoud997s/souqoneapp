import React from 'react'
import { renderHook, act } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useOperatorOwnerActions } from './useOperatorOwnerActions'
import { equipmentApi } from '../../api/equipment'
import type { OperatorDetailViewModel } from '../../types/operatorDetailViewModel.types'
import * as phoneGuard from '../../utils/profilePhoneGuard'
import { useAuthStore } from '../../store/authStore'

let mockAuthUser: { id: string; phone?: string | null } | null = { id: 'owner-1', phone: '96891234567' }

jest.mock('../../api/equipment', () => ({
  equipmentApi: {
    deleteOperator: jest.fn(),
    cancelOperatorDeletionRequest: jest.fn(),
  },
}))

jest.mock('../../store/authStore', () => ({
  useAuthStore: Object.assign(
    jest.fn((selector) => selector({ user: mockAuthUser })),
    {
      getState: jest.fn(() => ({ user: mockAuthUser })),
    }
  ),
}))

const sampleOperatorVm: OperatorDetailViewModel = {
  id: 'op-10',
  title: 'مشغل رافعة محترف',
  description: 'وصف المشغل',
  operatorType: 'OPERATOR',
  operatorTypeLabel: 'مشغل معدات',
  specializations: [],
  equipmentTypes: [],
  certifications: [],
  rates: {
    currency: 'ر.ع',
    isNegotiable: false,
    primaryLabel: 'السعر عند التواصل',
    hasAnyRate: false,
  },
  seller: {
    id: 'owner-1',
    name: 'سالم الشامسي',
    username: 'salem',
    isVerified: true,
    memberSinceLabel: 'عضو منذ 2024',
  },
  location: {
    fullLocationText: 'مسقط، السيب',
    hasCoordinates: false,
  },
  whatsappEnabled: true,
  viewCount: 150,
  postedAtLabel: 'منذ يومين',
  status: 'ACTIVE',
  hiddenByOwnerStatus: false,
  pendingDeletion: null,
}

describe('useOperatorOwnerActions', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthUser = { id: 'owner-1' }
    queryClient = new QueryClient()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('provides edit and delete actions when no deletion is pending', async () => {
    const { result } = await renderHook(() => useOperatorOwnerActions(sampleOperatorVm), {
      wrapper,
    })

    expect(result.current.actions).toHaveLength(2)
    expect(result.current.actions[0].id).toBe('edit')
    expect(result.current.actions[1].id).toBe('delete')
    expect(result.current.actions[1].label).toBe('طلب حذف')
    expect(result.current.actions[1].requiresConfirm).toBe(true)
    expect(result.current.viewCount).toBe(150)
  })

  it('provides edit and cancel deletion (restore) action when deletion request is pending', async () => {
    const pendingVm: OperatorDetailViewModel = {
      ...sampleOperatorVm,
      pendingDeletion: {
        id: 'del-req-5',
        requestedAt: '2026-10-20',
        requestedAtLabel: 'منذ يوم',
        status: 'PENDING',
      },
    }

    const { result } = await renderHook(() => useOperatorOwnerActions(pendingVm), {
      wrapper,
    })

    expect(result.current.actions).toHaveLength(2)
    expect(result.current.actions[0].id).toBe('edit')
    expect(result.current.actions[1].id).toBe('restore')
    expect(result.current.actions[1].label).toBe('إلغاء طلب الحذف')
    expect(result.current.actions[1].tone).toBe('primary')
    expect(result.current.actions.find((a) => a.id === 'delete')).toBeUndefined()
  })

  it('hides all owner actions when user is not the owner', async () => {
    mockAuthUser = { id: 'visitor-2' }

    const { result } = await renderHook(() => useOperatorOwnerActions(sampleOperatorVm), {
      wrapper,
    })

    expect(result.current.actions).toEqual([])
  })

  it('executes delete action and invokes equipmentApi.deleteOperator', async () => {
    ;(equipmentApi.deleteOperator as jest.Mock).mockResolvedValueOnce({
      data: { message: 'تم تقديم طلب الحذف بنجاح' },
    })

    const { result } = await renderHook(() => useOperatorOwnerActions(sampleOperatorVm), {
      wrapper,
    })

    await act(async () => {
      await result.current.run('delete')
    })

    expect(equipmentApi.deleteOperator).toHaveBeenCalledWith('op-10')
  })

  it('executes cancel deletion action with deletion request ID', async () => {
    ;(equipmentApi.cancelOperatorDeletionRequest as jest.Mock).mockResolvedValueOnce({
      data: { id: 'del-req-5', status: 'CANCELLED' },
    })

    const pendingVm: OperatorDetailViewModel = {
      ...sampleOperatorVm,
      pendingDeletion: {
        id: 'del-req-5',
        requestedAt: '2026-10-20',
        requestedAtLabel: 'منذ يوم',
        status: 'PENDING',
      },
    }

    const { result } = await renderHook(() => useOperatorOwnerActions(pendingVm), {
      wrapper,
    })

    await act(async () => {
      await result.current.run('restore')
    })

    expect(equipmentApi.cancelOperatorDeletionRequest).toHaveBeenCalledWith('del-req-5')
  })

  it('guards edit action with promptProfilePhoneRequired when phone missing', async () => {
    (useAuthStore.getState as jest.Mock).mockReturnValue({
      user: { id: 'user-1', phone: null },
    })
    const phoneSpy = jest.spyOn(phoneGuard, 'promptProfilePhoneRequired').mockImplementation(() => {})

    const { result } = await renderHook(() => useOperatorOwnerActions(sampleOperatorVm), {
      wrapper,
    })

    await act(async () => {
      await result.current.run('edit')
    })

    expect(phoneSpy).toHaveBeenCalled()
  })
})
