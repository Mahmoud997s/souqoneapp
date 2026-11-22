import { renderHook, act } from '@testing-library/react-native'
import { useAccountDeletion } from '../hooks/useAccountDeletion'
import { useAuthStore } from '../store/authStore'
import { usersApi } from '../api/users'
import { toastService } from '../store/toastStore'

const mockInvalidateQueries = jest.fn()
jest.mock('../api/queryClient', () => ({
  queryClient: {
    invalidateQueries: (...args: any[]) => mockInvalidateQueries(...args),
  },
}))

describe('useAccountDeletion hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useAuthStore.setState({
      user: {
        id: 'u-123',
        email: 'user@example.com',
        username: 'user123',
        role: 'user',
        isVerified: true,
        createdAt: '2026-01-01',
        deletionScheduledAt: '2026-10-25T11:15:00.000Z',
      },
    })
  })

  it('correctly derives isScheduled and deletionScheduledAt from authStore', async () => {
    const { result } = await renderHook(() => useAccountDeletion())
    expect(result.current.isScheduled).toBe(true)
    expect(result.current.deletionScheduledAt).toBe('2026-10-25T11:15:00.000Z')
  })

  it('handleCancelDeletion prompts confirmation dialog and calls cancelDeletion API on confirm', async () => {
    const spyCancel = jest.spyOn(usersApi, 'cancelDeletion').mockResolvedValue({
      data: { message: 'تم إلغاء طلب حذف الحساب بنجاح' },
    } as any)
    const spyShow = jest.spyOn(toastService, 'show').mockImplementation(() => {})
    const spyConfirm = jest
      .spyOn(toastService, 'confirm')
      .mockImplementation(({ onConfirm }) => {
        onConfirm()
      })

    const { result } = await renderHook(() => useAccountDeletion())

    await act(async () => {
      result.current.handleCancelDeletion()
    })

    expect(spyConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'إلغاء طلب حذف الحساب',
        message: 'هل تريد بالتأكيد إلغاء طلب حذف حسابك واستعادة إعلاناتك؟',
        confirmLabel: 'نعم، إلغاء الحذف',
        cancelLabel: 'تراجع',
        onConfirm: expect.any(Function),
      })
    )
    expect(spyCancel).toHaveBeenCalledTimes(1)
    expect(useAuthStore.getState().user?.deletionScheduledAt).toBeNull()
    expect(mockInvalidateQueries).toHaveBeenCalledTimes(1)
    expect(spyShow).toHaveBeenCalledWith({
      kind: 'success',
      title: 'تم إلغاء طلب حذف الحساب',
    })
  })

  it('handles 400 "غير مجدول" error gracefully by clearing local state without crash', async () => {
    jest.spyOn(usersApi, 'cancelDeletion').mockRejectedValue({
      response: {
        status: 400,
        data: { message: 'الحساب غير مجدول للحذف' },
      },
    })
    const spyShow = jest.spyOn(toastService, 'show').mockImplementation(() => {})
    jest
      .spyOn(toastService, 'confirm')
      .mockImplementation(({ onConfirm }) => {
        onConfirm()
      })

    const { result } = await renderHook(() => useAccountDeletion())

    await act(async () => {
      result.current.handleCancelDeletion()
    })

    expect(useAuthStore.getState().user?.deletionScheduledAt).toBeNull()
    expect(mockInvalidateQueries).toHaveBeenCalledTimes(1)
    expect(spyShow).toHaveBeenCalledWith({
      kind: 'info',
      title: 'الحساب غير مجدول للحذف حالياً',
    })
  })

  it('handles unexpected errors by displaying server error message', async () => {
    jest.spyOn(usersApi, 'cancelDeletion').mockRejectedValue({
      response: {
        status: 500,
        data: { message: 'حدث خطأ في الخادم' },
      },
    })
    const spyShow = jest.spyOn(toastService, 'show').mockImplementation(() => {})
    jest
      .spyOn(toastService, 'confirm')
      .mockImplementation(({ onConfirm }) => {
        onConfirm()
      })

    const { result } = await renderHook(() => useAccountDeletion())

    await act(async () => {
      result.current.handleCancelDeletion()
    })

    expect(useAuthStore.getState().user?.deletionScheduledAt).toBe('2026-10-25T11:15:00.000Z')
    expect(spyShow).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'error',
        title: 'تعذر إلغاء طلب حذف الحساب. يرجى المحاولة مرة أخرى.',
      })
    )
  })
})
