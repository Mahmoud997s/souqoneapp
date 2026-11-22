import React from 'react'
import { BackHandler } from 'react-native'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import NewCarListingScreen from '../../../app/cars/new'
import { router } from 'expo-router'
import { useCarWizardStore } from '../../store/carWizardStore'
import { useAuthStore } from '../../store/authStore'
import { toastService, useToastStore } from '../../store/toastStore'
import { WIZARD_EXIT_COPY } from '../../hooks/useWizardExitGuard'

type BeforeRemoveListener = (e: { preventDefault: () => void; data?: { action?: unknown } }) => void
let mockBeforeRemoveListener: BeforeRemoveListener | null = null
const mockDispatch = jest.fn()

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: jest.fn(() => ({})),
  useNavigation: () => ({
    addListener: jest.fn((event: string, cb: BeforeRemoveListener) => {
      if (event === 'beforeRemove') mockBeforeRemoveListener = cb
      return jest.fn()
    }),
    dispatch: mockDispatch,
  }),
  useFocusEffect: (cb: () => (() => void) | void) => {
    const ReactMock = require('react')
    ReactMock.useEffect(() => {
      const cleanupFn = cb()
      return () => {
        if (typeof cleanupFn === 'function') cleanupFn()
      }
    }, [cb])
  },
  Stack: { Screen: () => null },
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}))

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}))

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}))

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}))

jest.mock('../../hooks/useProfilePhoneGuard', () => ({
  useProfilePhoneGuard: () => ({ hasPhone: true, checking: false, checkPhone: jest.fn() }),
}))

jest.mock('../../api/cars', () => ({
  carsApi: {
    getBrands: jest.fn().mockResolvedValue([]),
    getModels: jest.fn().mockResolvedValue([]),
    getTrims: jest.fn().mockResolvedValue([]),
  },
}))

describe('D-376 Cars Wizard Exit Guard Integration', () => {
  let queryClient: QueryClient
  let hwBackHandler: (() => boolean | null | undefined) | null = null

  beforeEach(() => {
    jest.clearAllMocks()
    mockBeforeRemoveListener = null
    hwBackHandler = null
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    useAuthStore.setState({ user: { id: 'u1', phone: '+96891234567' } as never })
    useCarWizardStore.getState().resetForm()
    useToastStore.setState({
      current: null,
      queuedNotice: null,
      activeDecision: null,
      decisionQueue: [],
      activeSheet: null,
      modalHostIds: [],
    })
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, cb) => {
      hwBackHandler = () => (cb as () => boolean | null | undefined)()
      return { remove: jest.fn() }
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    queryClient.clear()
  })

  function renderWizard() {
    return render(
      <QueryClientProvider client={queryClient}>
        <NewCarListingScreen />
      </QueryClientProvider>
    )
  }

  it('guards header back, bottom back, Android hardware back, and beforeRemove when form has data', async () => {
    const confirmSpy = jest.spyOn(toastService, 'confirm')

    useCarWizardStore.setState({
      currentStep: 2,
      formData: {
        ...useCarWizardStore.getState().formData,
        title: 'تويوتا كامري 2023',
      },
    })

    await renderWizard()

    // Bottom back at step 2 goes to step 1 with no question
    await act(async () => {
      fireEvent.press(screen.getByText('السابق'))
    })
    expect(useCarWizardStore.getState().currentStep).toBe(1)
    expect(confirmSpy).not.toHaveBeenCalled()

    // Move back to step 2 -> hardware back goes to step 1 with no question
    await act(async () => {
      useCarWizardStore.setState({ currentStep: 2 })
    })
    await act(async () => {
      hwBackHandler?.()
    })
    expect(useCarWizardStore.getState().currentStep).toBe(1)
    expect(confirmSpy).not.toHaveBeenCalled()

    // Step 1 header back with data -> asks unified create confirm
    await act(async () => {
      fireEvent.press(screen.getByLabelText('رجوع'))
    })
    expect(confirmSpy).toHaveBeenCalledWith(expect.objectContaining({
      title: WIZARD_EXIT_COPY.create.title,
      intent: 'primary',
      confirmLabel: 'خروج',
      cancelLabel: 'متابعة الإعلان',
    }))
    await act(async () => { useToastStore.getState().resolveDecision('cancel') })

    // Step 1 hardware back with data -> asks same confirm
    await act(async () => {
      hwBackHandler?.()
    })
    expect(confirmSpy).toHaveBeenCalledTimes(2)
    await act(async () => { useToastStore.getState().resolveDecision('cancel') })

    // beforeRemove (iOS swipe) with data -> prevents and asks same confirm; confirming dispatches action
    const preventDefault = jest.fn()
    const navAction = { type: 'GO_BACK' }
    await act(async () => {
      mockBeforeRemoveListener?.({ preventDefault, data: { action: navAction } })
    })
    expect(preventDefault).toHaveBeenCalledTimes(1)
    expect(confirmSpy).toHaveBeenCalledTimes(3)
    await act(async () => { useToastStore.getState().resolveDecision('confirm') })
    expect(mockDispatch).toHaveBeenCalledWith(navAction)
  })

  it('exits silently when create form is empty', async () => {
    const confirmSpy = jest.spyOn(toastService, 'confirm')
    await renderWizard()

    await act(async () => {
      fireEvent.press(screen.getByLabelText('رجوع'))
    })
    expect(confirmSpy).not.toHaveBeenCalled()
    expect(router.back).toHaveBeenCalledTimes(1)
  })
})
