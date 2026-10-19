import { renderHook, act } from '@testing-library/react-native'
import { useAccountDeletion } from '../hooks/useAccountDeletion'
import { useAuthStore } from '../store/authStore'
import { usersApi } from '../api/users'
import { dialogService } from '../store/dialogStore'

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
    const spyAlert = jest.spyOn(dialogService, 'alert').mockImplementation(() => {})
    const spyConfirm = jest
      .spyOn(dialogService, 'confirm')
      .mockImplementation((_title, _msg, onConfirm) => {
        onConfirm()
      })

    const { result } = await renderHook(() => useAccountDeletion())

    await act(async () => {
      result.current.handleCancelDeletion()
    })

    expect(spyConfirm).toHaveBeenCalledWith(
      'إلغاء طلب حذف الحساب',
      'هل تريد بالتأكيد إلغاء طلب حذف حسابك واستعادة إعلاناتك؟',
      expect.any(Function),
      'نعم، إلغاء الحذف',
      'تراجع'
    )
    expect(spyCancel).toHaveBeenCalledTimes(1)
    expect(useAuthStore.getState().user?.deletionScheduledAt).toBeNull()
    expect(mockInvalidateQueries).toHaveBeenCalledTimes(1)
    expect(spyAlert).toHaveBeenCalledWith(
      'تم الإلغاء',
      'تم إلغاء طلب حذف حسابك وسيتم إظهار إعلاناتك مرة أخرى.',
      'success'
    )
  })

  it('handles 400 "غير مجدول" error gracefully by clearing local state without crash', async () => {
    jest.spyOn(usersApi, 'cancelDeletion').mockRejectedValue({
      response: {
        status: 400,
        data: { message: 'الحساب غير مجدول للحذف' },
      },
    })
    const spyAlert = jest.spyOn(dialogService, 'alert').mockImplementation(() => {})
    jest
      .spyOn(dialogService, 'confirm')
      .mockImplementation((_title, _msg, onConfirm) => {
        onConfirm()
      })

    const { result } = await renderHook(() => useAccountDeletion())

    await act(async () => {
      result.current.handleCancelDeletion()
    })

    expect(useAuthStore.getState().user?.deletionScheduledAt).toBeNull()
    expect(mockInvalidateQueries).toHaveBeenCalledTimes(1)
    expect(spyAlert).toHaveBeenCalledWith(
      'تنبيه',
      'الحساب غير مجدول للحذف حالياً.',
      'info'
    )
  })

  it('handles unexpected errors by displaying server error message', async () => {
    jest.spyOn(usersApi, 'cancelDeletion').mockRejectedValue({
      response: {
        status: 500,
        data: { message: 'حدث خطأ في الخادم' },
      },
    })
    const spyAlert = jest.spyOn(dialogService, 'alert').mockImplementation(() => {})
    jest
      .spyOn(dialogService, 'confirm')
      .mockImplementation((_title, _msg, onConfirm) => {
        onConfirm()
      })

    const { result } = await renderHook(() => useAccountDeletion())

    await act(async () => {
      result.current.handleCancelDeletion()
    })

    expect(useAuthStore.getState().user?.deletionScheduledAt).toBe('2026-10-25T11:15:00.000Z')
    expect(spyAlert).toHaveBeenCalledWith('خطأ', 'حدث خطأ في الخادم')
  })
})
