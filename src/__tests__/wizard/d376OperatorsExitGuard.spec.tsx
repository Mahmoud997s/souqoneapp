import React from 'react'
import { BackHandler } from 'react-native'
import { render, screen, fireEvent, act, cleanup, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AddOperatorScreen from '../../../app/equipment/operators/add'
import EditOperatorScreen from '../../../app/equipment/operators/edit/[id]'
import { router } from 'expo-router'
import { useOperatorWizardStore, DEFAULT_OPERATOR_WIZARD_DATA } from '../../store/operatorWizardStore'
import { useAuthStore } from '../../store/authStore'
import * as equipmentHooks from '../../hooks/useEquipment'
import { toastService, useToastStore } from '../../store/toastStore'
import { WIZARD_EXIT_COPY } from '../../hooks/useWizardExitGuard'

type BeforeRemoveListener = (e: { preventDefault: () => void; data?: { action?: unknown } }) => void
let mockBeforeRemoveListener: BeforeRemoveListener | null = null
const mockDispatch = jest.fn()
const mockRouterBack = jest.fn()

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: mockRouterBack }),
  useLocalSearchParams: () => ({ id: 'op-123' }),
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

jest.mock('../../components/ui/GovernorateWilayaSelect', () => ({
  GovernorateWilayaSelect: () => null,
}))

jest.mock('../../hooks/useProfilePhoneGuard', () => ({
  useProfilePhoneGuard: () => ({ hasPhone: true }),
}))

describe('D-376 Operators Add & Edit Wizard Exit Guard Integration', () => {
  let queryClient: QueryClient
  let hwBackHandler: (() => boolean | null | undefined) | null = null

  beforeEach(() => {
    jest.clearAllMocks()
    mockBeforeRemoveListener = null
    hwBackHandler = null
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    useAuthStore.setState({ user: { id: 'u1', phone: '+96891234567' } as never })
    useOperatorWizardStore.setState({
      currentStep: 1,
      formData: { ...DEFAULT_OPERATOR_WIZARD_DATA },
      errors: {},
    })
    useToastStore.setState({
      current: null,
      queuedNotice: null,
      activeDecision: null,
      decisionQueue: [],
      activeSheet: null,
      modalHostIds: [],
    })
    jest.spyOn(equipmentHooks, 'useMyOperators').mockReturnValue({ data: [], isLoading: false } as never)
    jest.spyOn(equipmentHooks, 'useCreateOperator').mockReturnValue({ mutate: jest.fn(), isPending: false } as never)
    jest.spyOn(equipmentHooks, 'useUpdateOperator').mockReturnValue({ mutate: jest.fn(), isPending: false } as never)
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, cb) => {
      hwBackHandler = () => (cb as () => boolean | null | undefined)()
      return { remove: jest.fn() }
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    queryClient.clear()
  })

  it('AddOperatorScreen guards header back, bottom back, hardware back, and beforeRemove when form has data', async () => {
    const confirmSpy = jest.spyOn(toastService, 'confirm')

    useOperatorWizardStore.setState({
      currentStep: 2,
      formData: {
        ...DEFAULT_OPERATOR_WIZARD_DATA,
        title: 'مشغل كرين معتمد',
      },
      errors: {},
    })

    await render(
      <QueryClientProvider client={queryClient}>
        <AddOperatorScreen />
      </QueryClientProvider>
    )

    // Bottom back at step 2 -> step 1 without prompt
    await act(async () => {
      fireEvent.press(screen.getByText('السابق'))
    })
    expect(useOperatorWizardStore.getState().currentStep).toBe(1)
    expect(confirmSpy).not.toHaveBeenCalled()

    // Hardware back at step 2 -> step 1 without prompt
    await act(async () => {
      useOperatorWizardStore.setState({ currentStep: 2 })
    })
    await act(async () => {
      hwBackHandler?.()
    })
    expect(useOperatorWizardStore.getState().currentStep).toBe(1)
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

  it('AddOperatorScreen exits silently when create form is empty', async () => {
    const confirmSpy = jest.spyOn(toastService, 'confirm')
    await render(
      <QueryClientProvider client={queryClient}>
        <AddOperatorScreen />
      </QueryClientProvider>
    )

    await act(async () => {
      fireEvent.press(screen.getByLabelText('رجوع'))
    })
    expect(confirmSpy).not.toHaveBeenCalled()
    expect(router.back).toHaveBeenCalledTimes(1)
  })

  it('EditOperatorScreen exits silently when clean and asks unified edit confirm when dirty', async () => {
    const confirmSpy = jest.spyOn(toastService, 'confirm')
    jest.spyOn(equipmentHooks, 'useOperatorItem').mockReturnValue({
      data: {
        id: 'op-123',
        operatorType: 'OPERATOR',
        title: 'مشغل شيول',
        description: 'خبرة 8 سنوات',
        experienceYears: 8,
        equipmentTypes: ['LOADER'],
        specializations: [],
        certifications: [],
        dailyRate: 30,
        governorateId: 1,
        wilayaId: 10,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    } as never)

    await render(
      <QueryClientProvider client={queryClient}>
        <EditOperatorScreen />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('مشغل شيول')).toBeTruthy()
    })

    // Clean edit -> beforeRemove does not prevent
    const preventClean = jest.fn()
    await act(async () => {
      mockBeforeRemoveListener?.({ preventDefault: preventClean, data: { action: { type: 'GO_BACK' } } })
    })
    expect(preventClean).not.toHaveBeenCalled()
    expect(confirmSpy).not.toHaveBeenCalled()

    // Edit title -> becomes dirty -> header back asks edit confirm
    await act(async () => {
      fireEvent.changeText(screen.getByDisplayValue('مشغل شيول'), 'مشغل شيول محترف')
    })

    await act(async () => {
      fireEvent.press(screen.getByLabelText('رجوع'))
    })
    expect(confirmSpy).toHaveBeenCalledWith(expect.objectContaining({
      title: WIZARD_EXIT_COPY.edit.title,
      message: WIZARD_EXIT_COPY.edit.message,
      intent: 'danger',
      confirmLabel: 'خروج',
      cancelLabel: 'متابعة التعديل',
    }))
  })
})
