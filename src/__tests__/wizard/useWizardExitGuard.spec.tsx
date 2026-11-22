import React from 'react'
import { BackHandler, View } from 'react-native'
import { render, renderHook, act, cleanup } from '@testing-library/react-native'
import { router } from 'expo-router'
import {
  useWizardExitGuard,
  useEditDirtyBaseline,
  WIZARD_EXIT_COPY,
} from '../../hooks/useWizardExitGuard'
import { hasMeaningfulOperatorData } from '../../components/ui/DraftResumePrompt'
import { DecisionToastCard } from '../../components/ui/DecisionToastCard'
import { toastService, useToastStore } from '../../store/toastStore'

type BeforeRemoveListener = (e: {
  preventDefault: () => void
  data?: { action?: unknown }
}) => void

let mockBeforeRemoveListener: BeforeRemoveListener | null = null
const mockDispatch = jest.fn()
const mockRemoveBeforeRemove = jest.fn()
let mockFocusCleanup: (() => void) | void
let mockLatestFocusCallback: (() => (() => void) | void) | null = null

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  },
  usePathname: () => '/cars/new',
  useNavigation: () => ({
    addListener: jest.fn((event: string, cb: BeforeRemoveListener) => {
      if (event === 'beforeRemove') {
        mockBeforeRemoveListener = cb
      }
      return mockRemoveBeforeRemove
    }),
    dispatch: mockDispatch,
  }),
  useFocusEffect: (cb: () => (() => void) | void) => {
    const ReactMock = require('react')
    mockLatestFocusCallback = cb
    ReactMock.useEffect(() => {
      mockFocusCleanup = cb()
      return () => {
        if (typeof mockFocusCleanup === 'function') {
          mockFocusCleanup()
        }
      }
    }, [cb])
  },
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

jest.mock('@expo/vector-icons', () => {
  const ReactMock = require('react')
  const { Text: RNText } = require('react-native')
  return {
    Ionicons: (props: { name: string }) =>
      ReactMock.createElement(RNText, { testID: 'mock-ionicon' }, props.name),
  }
})

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Warning: 'warning' },
  ImpactFeedbackStyle: { Light: 'light' },
}))

jest.mock('../../utils/listing-detail/useAppReducedMotion', () => ({
  useAppReducedMotion: () => true,
}))

describe('D-376 useWizardExitGuard hook & hasMeaningfulOperatorData', () => {
  let backHandlers: Array<() => boolean | null | undefined> = []

  beforeEach(() => {
    jest.clearAllMocks()
    backHandlers = []
    mockBeforeRemoveListener = null
    mockLatestFocusCallback = null
    mockFocusCleanup = undefined
    useToastStore.setState({
      current: null,
      queuedNotice: null,
      activeDecision: null,
      decisionQueue: [],
      activeSheet: null,
      modalHostIds: [],
    })
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, cb) => {
      const handler = () => (cb as () => boolean | null | undefined)()
      backHandlers.push(handler)
      return {
        remove: () => {
          backHandlers = backHandlers.filter((h) => h !== handler)
        },
      }
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  function fireHardwareBackLIFO(): boolean {
    for (let i = backHandlers.length - 1; i >= 0; i--) {
      if (backHandlers[i]()) {
        return true
      }
    }
    return false
  }

  describe('hasMeaningfulOperatorData', () => {
    it('returns false for empty/default operator draft and true when step > 1 or any field is filled', () => {
      expect(hasMeaningfulOperatorData(null)).toBe(false)
      expect(
        hasMeaningfulOperatorData({
          currentStep: 1,
          formData: {
            title: '',
            description: '   ',
            experienceYears: '',
            equipmentTypes: [],
            specializations: [],
            certifications: [],
            dailyRate: '',
            hourlyRate: '',
            governorateId: null,
            wilayaId: null,
            profileImageUrl: '',
          },
        })
      ).toBe(false)

      expect(hasMeaningfulOperatorData({ currentStep: 2, formData: { title: '' } })).toBe(true)
      expect(hasMeaningfulOperatorData({ currentStep: 1, formData: { title: 'مشغل حفار' } })).toBe(true)
      expect(hasMeaningfulOperatorData({ currentStep: 1, formData: { equipmentTypes: ['EXCAVATOR'] } })).toBe(true)
      expect(hasMeaningfulOperatorData({ currentStep: 1, formData: { governorateId: 1 } })).toBe(true)
    })
  })

  it('create-empty exits silently on header back, hardware back, and beforeRemove', async () => {
    const confirmSpy = jest.spyOn(toastService, 'confirm')
    const onPrevStep = jest.fn()

    const { result } = await renderHook(() =>
      useWizardExitGuard({
        currentStep: 1,
        isEditMode: false,
        hasData: false,
        isDirty: false,
        isSubmitting: false,
        isPublished: false,
        onPrevStep,
      })
    )

    await act(async () => {
      result.current.handleBack()
    })
    expect(confirmSpy).not.toHaveBeenCalled()
    expect(router.back).toHaveBeenCalledTimes(1)

    const preventDefault = jest.fn()
    await act(async () => {
      mockBeforeRemoveListener?.({ preventDefault, data: { action: { type: 'GO_BACK' } } })
    })
    expect(preventDefault).not.toHaveBeenCalled()
    expect(confirmSpy).not.toHaveBeenCalled()
  })

  it('create-with-data asks with unified create copy, confirm exits once with no loop, cancel stays', async () => {
    const confirmSpy = jest.spyOn(toastService, 'confirm')
    const onPrevStep = jest.fn()

    const { result } = await renderHook(() =>
      useWizardExitGuard({
        currentStep: 1,
        isEditMode: false,
        hasData: true,
        isDirty: false,
        isSubmitting: false,
        isPublished: false,
        onPrevStep,
      })
    )

    await act(async () => {
      result.current.handleBack()
    })

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(confirmSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: WIZARD_EXIT_COPY.create.title,
        message: WIZARD_EXIT_COPY.create.message,
        intent: 'primary',
        confirmLabel: 'خروج',
        cancelLabel: 'متابعة الإعلان',
      })
    )
    expect(router.back).not.toHaveBeenCalled()

    // Cancel stays on screen
    await act(async () => {
      useToastStore.getState().resolveDecision('cancel')
    })
    expect(router.back).not.toHaveBeenCalled()

    // Trigger again and confirm -> exits once, subsequent beforeRemove does NOT re-open prompt
    await act(async () => {
      result.current.handleBack()
    })
    expect(confirmSpy).toHaveBeenCalledTimes(2)

    await act(async () => {
      useToastStore.getState().resolveDecision('confirm')
    })
    expect(router.back).toHaveBeenCalledTimes(1)

    const preventDefault = jest.fn()
    await act(async () => {
      mockBeforeRemoveListener?.({ preventDefault, data: { action: { type: 'GO_BACK' } } })
    })
    expect(preventDefault).not.toHaveBeenCalled()
    expect(confirmSpy).toHaveBeenCalledTimes(2)
  })

  it('edit-clean exits silently and edit-dirty asks with unified edit copy', async () => {
    const confirmSpy = jest.spyOn(toastService, 'confirm')
    let formData = { title: 'الأصلي', price: '100' }

    const { result, rerender } = await renderHook(
      (props: { data: { title: string; price: string } }) => {
        const isDirty = useEditDirtyBaseline(true, props.data, 'item-1')
        return useWizardExitGuard({
          currentStep: 1,
          isEditMode: true,
          hasData: false,
          isDirty,
          isSubmitting: false,
          isPublished: false,
          onPrevStep: jest.fn(),
        })
      },
      { initialProps: { data: formData } }
    )

    // Clean edit -> beforeRemove does not prevent
    const preventClean = jest.fn()
    await act(async () => {
      mockBeforeRemoveListener?.({ preventDefault: preventClean, data: { action: { type: 'GO_BACK' } } })
    })
    expect(preventClean).not.toHaveBeenCalled()
    expect(confirmSpy).not.toHaveBeenCalled()

    // Mutate form -> becomes dirty -> asks with edit copy
    formData = { title: 'معدل', price: '100' }
    await rerender({ data: formData })

    await act(async () => {
      result.current.handleBack()
    })
    expect(confirmSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: WIZARD_EXIT_COPY.edit.title,
        message: WIZARD_EXIT_COPY.edit.message,
        intent: 'danger',
        confirmLabel: 'خروج',
        cancelLabel: 'متابعة التعديل',
      })
    )
  })

  it('step > 1 hardware back goes to previous step with no question', async () => {
    const confirmSpy = jest.spyOn(toastService, 'confirm')
    const onPrevStep = jest.fn()

    await renderHook(() =>
      useWizardExitGuard({
        currentStep: 3,
        isEditMode: false,
        hasData: true,
        isDirty: false,
        isSubmitting: false,
        isPublished: false,
        onPrevStep,
      })
    )

    let handled = false
    await act(async () => {
      handled = fireHardwareBackLIFO()
    })

    expect(handled).toBe(true)
    expect(onPrevStep).toHaveBeenCalledTimes(1)
    expect(confirmSpy).not.toHaveBeenCalled()
    expect(router.back).not.toHaveBeenCalled()
  })

  it('never asks while submitting or after publish, and unregisters BackHandler after publish', async () => {
    const confirmSpy = jest.spyOn(toastService, 'confirm')

    const { result, rerender } = await renderHook(
      (props: { isSubmitting: boolean; isPublished: boolean }) =>
        useWizardExitGuard({
          currentStep: 1,
          isEditMode: false,
          hasData: true,
          isDirty: false,
          isSubmitting: props.isSubmitting,
          isPublished: props.isPublished,
          onPrevStep: jest.fn(),
        }),
      { initialProps: { isSubmitting: true, isPublished: false } }
    )

    const preventWhileSubmitting = jest.fn()
    await act(async () => {
      mockBeforeRemoveListener?.({ preventDefault: preventWhileSubmitting })
    })
    expect(preventWhileSubmitting).not.toHaveBeenCalled()
    expect(confirmSpy).not.toHaveBeenCalled()

    await rerender({ isSubmitting: false, isPublished: true })
    expect(backHandlers).toHaveLength(0)

    const preventAfterPublish = jest.fn()
    await act(async () => {
      mockBeforeRemoveListener?.({ preventDefault: preventAfterPublish })
    })
    expect(preventAfterPublish).not.toHaveBeenCalled()
    expect(result.current.shouldGuard).toBe(false)
  })

  it('removes hardware back handler on blur (useFocusEffect cleanup)', async () => {
    await renderHook(() =>
      useWizardExitGuard({
        currentStep: 1,
        isEditMode: false,
        hasData: true,
        isDirty: false,
        isSubmitting: false,
        isPublished: false,
        onPrevStep: jest.fn(),
      })
    )

    expect(backHandlers).toHaveLength(1)
    expect(typeof mockFocusCleanup).toBe('function')

    await act(async () => {
      if (typeof mockFocusCleanup === 'function') {
        mockFocusCleanup()
      }
    })
    expect(backHandlers).toHaveLength(0)

    // Re-focus re-registers the handler
    await act(async () => {
      mockFocusCleanup = mockLatestFocusCallback?.()
    })
    expect(backHandlers).toHaveLength(1)
  })

  it('hardware back while DecisionToastCard is open cancels the question and stays without exiting', async () => {
    function Harness() {
      useWizardExitGuard({
        currentStep: 1,
        isEditMode: false,
        hasData: true,
        isDirty: false,
        isSubmitting: false,
        isPublished: false,
        onPrevStep: jest.fn(),
      })
      return (
        <View>
          <DecisionToastCard />
        </View>
      )
    }

    await render(<Harness />)

    // 1. First hardware back opens the decision toast
    await act(async () => {
      fireHardwareBackLIFO()
    })
    expect(useToastStore.getState().activeDecision?.title).toBe(WIZARD_EXIT_COPY.create.title)
    expect(router.back).not.toHaveBeenCalled()

    // 2. Second hardware back while DecisionToastCard is open cancels the decision and stays
    await act(async () => {
      fireHardwareBackLIFO()
    })
    expect(useToastStore.getState().activeDecision).toBeNull()
    expect(router.back).not.toHaveBeenCalled()
  })
})
