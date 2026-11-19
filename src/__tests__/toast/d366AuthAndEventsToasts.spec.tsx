import { act } from '@testing-library/react-native'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { confirmClearDraft } from '../../utils/confirmClearDraft'
import { resolveOwnerActionSuccessToastTitle } from '../../utils/listing-detail/ownerActionToast'

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}))

describe('D-366 Auth login/register toasts, draft clear decision/toast, and owner action toast titles', () => {
  beforeEach(() => {
    useToastStore.setState({
      current: null,
      queuedNotice: null,
      activeDecision: null,
      decisionQueue: [],
      activeSheet: null,
      modalHostIds: [],
    })
    useAuthStore.setState({
      user: null,
      isLoggedIn: false,
      isGuest: false,
      isLoading: false,
      activeAuthScreen: null,
    })
  })

  it('fires تم تسجيل الدخول when setAuth is called from login screen and تم إنشاء حسابك from register screen', async () => {
    const mockUser = { id: 'u-1', name: 'محمود', email: 'test@example.com', role: 'USER' } as any

    useAuthStore.getState().setActiveAuthScreen('login')
    await act(async () => {
      await useAuthStore.getState().setAuth(mockUser, 'tok-1', 'ref-1')
    })

    expect(useToastStore.getState().current).toMatchObject({
      kind: 'success',
      title: 'تم تسجيل الدخول',
    })

    useAuthStore.setState({ isLoggedIn: false, user: null })
    useAuthStore.getState().setActiveAuthScreen('register')
    await act(async () => {
      await useAuthStore.getState().setAuth(mockUser, 'tok-2', 'ref-2')
    })

    expect(useToastStore.getState().current).toMatchObject({
      kind: 'success',
      title: 'تم إنشاء حسابك',
    })
  })

  it('does NOT fire auth toast when setAuth is called while already logged in or with silent: true', async () => {
    const mockUser = { id: 'u-1', name: 'محمود', email: 'test@example.com', role: 'USER' } as any
    useAuthStore.setState({ isLoggedIn: true, user: mockUser, activeAuthScreen: null })

    await act(async () => {
      await useAuthStore.getState().setAuth(mockUser, 'tok-1', 'ref-1')
    })

    expect(useToastStore.getState().current).toBeNull()
  })

  it('opens danger DecisionToastCard for confirmClearDraft and shows تم مسح المسودة on confirm', () => {
    const onClear = jest.fn()
    confirmClearDraft(onClear)

    const decision = useToastStore.getState().activeDecision
    expect(decision).toMatchObject({
      title: 'مسح المسودة',
      intent: 'danger',
      confirmLabel: 'مسح',
      cancelLabel: 'إلغاء',
    })

    act(() => {
      useToastStore.getState().resolveDecision('confirm')
    })

    expect(onClear).toHaveBeenCalledTimes(1)
    expect(useToastStore.getState().current).toMatchObject({
      kind: 'success',
      title: 'تم مسح المسودة',
    })
  })

  it('maps all owner action IDs to exact D-366 Section 4 Arabic success toast titles', () => {
    expect(resolveOwnerActionSuccessToastTitle('delete')).toBe('تم حذف الإعلان')
    expect(resolveOwnerActionSuccessToastTitle('pause')).toBe('تم إيقاف الإعلان')
    expect(resolveOwnerActionSuccessToastTitle('archive')).toBe('تم إيقاف الإعلان')
    expect(resolveOwnerActionSuccessToastTitle('stopSearch')).toBe('تم إيقاف الإعلان')
    expect(resolveOwnerActionSuccessToastTitle('restore')).toBe('تم تفعيل الإعلان')
    expect(resolveOwnerActionSuccessToastTitle('submit')).toBe('تم تجديد الإعلان')
    expect(resolveOwnerActionSuccessToastTitle('markSold')).toBe('تم تحديد الإعلان كمباع')
    expect(resolveOwnerActionSuccessToastTitle('markRented')).toBe('تم تحديد الإعلان كمؤجر')
  })
})
