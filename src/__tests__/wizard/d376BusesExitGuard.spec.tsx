import React from 'react'
import { BackHandler } from 'react-native'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import NewBusListingScreen from '../../../app/buses/new'
import { router } from 'expo-router'
import { useBusWizardStore } from '../../store/busWizardStore'
import { toastService, useToastStore } from '../../store/toastStore'
import { WIZARD_EXIT_COPY } from '../../hooks/useWizardExitGuard'

type BeforeRemoveListener = (e: { preventDefault: () => void; data?: { action?: unknown } }) => void
let mockBeforeRemoveListener: BeforeRemoveListener | null = null
const mockDispatch = jest.fn()

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
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
  useProfilePhoneGuard: () => ({ hasPhone: true }),
}))

describe('D-376 Buses Wizard Exit Guard Integration', () => {
  let queryClient: QueryClient
  let hwBackHandler: (() => boolean | null | undefined) | null = null

  beforeEach(() => {
    jest.clearAllMocks()
    mockBeforeRemoveListener = null
    hwBackHandler = null
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    useBusWizardStore.getState().reset()
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
        <NewBusListingScreen />
      </QueryClientProvider>
    )
  }

  it('guards header back, bottom back, Android hardware back, and beforeRemove when form has data', async () => {
    const confirmSpy = jest.spyOn(toastService, 'confirm')

    useBusWizardStore.setState({
      currentStep: 2,
      editMode: false,
      data: {
        ...useBusWizardStore.getState().data,
        title: 'تويوتا كوستر 2022',
      },
    })

    await renderWizard()

    // Bottom back at step 2 -> step 1 without prompt
    await act(async () => {
      fireEvent.press(screen.getByText('السابق'))
    })
    expect(useBusWizardStore.getState().currentStep).toBe(1)
    expect(confirmSpy).not.toHaveBeenCalled()

    // Hardware back at step 2 -> step 1 without prompt
    await act(async () => {
      useBusWizardStore.setState({ currentStep: 2 })
    })
    await act(async () => {
      hwBackHandler?.()
    })
    expect(useBusWizardStore.getState().currentStep).toBe(1)
    expect(confirmSpy).not.toHaveBeenCalled()

    // Header back at step 1 with data -> unified create confirm
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

    // Hardware back at step 1 with data -> same confirm
    await act(async () => {
      hwBackHandler?.()
    })
    expect(confirmSpy).toHaveBeenCalledTimes(2)
    await act(async () => { useToastStore.getState().resolveDecision('cancel') })

    // beforeRemove with data -> prevents and asks same confirm
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
