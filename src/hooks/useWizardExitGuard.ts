import { useCallback, useEffect, useRef } from 'react'
import { BackHandler } from 'react-native'
import { router, useFocusEffect, useNavigation } from 'expo-router'
import { toastService } from '../store/toastStore'

export const WIZARD_EXIT_COPY = {
  create: {
    title: 'الخروج',
    message: 'هل تريد الخروج؟ يتم حفظ مسودتك تلقائياً ويمكنك العودة إليها لاحقاً.',
    intent: 'primary' as const,
    confirmLabel: 'خروج',
    cancelLabel: 'متابعة الإعلان',
  },
  edit: {
    title: 'الخروج من التعديل',
    message: 'هل تريد الخروج؟ لن يتم حفظ أي تعديلات غير منشورة.',
    intent: 'danger' as const,
    confirmLabel: 'خروج',
    cancelLabel: 'متابعة التعديل',
  },
}

interface BeforeRemoveEvent {
  preventDefault: () => void
  data?: {
    action?: unknown
  }
}

interface GuardNavigation {
  addListener?: (
    event: 'beforeRemove',
    listener: (e: BeforeRemoveEvent) => void
  ) => (() => void) | void
  dispatch?: (action: unknown) => void
}

export interface UseWizardExitGuardOptions {
  currentStep: number
  isEditMode: boolean
  /** Create mode: whether the form has meaningful data to lose. */
  hasData: boolean
  /** Edit mode: whether the form differs from the loaded listing. */
  isDirty: boolean
  isSubmitting: boolean
  isPublished: boolean
  /** Optional disable flag (e.g. phone guard view or initial redirect). */
  disabled?: boolean
  onPrevStep: () => void
  onExit?: () => void
}

export interface UseWizardExitGuardResult {
  /** Use for header back button and bottom "السابق" button. */
  handleBack: () => void
  /** Explicit exit trigger (e.g. step 1 back). */
  requestExit: () => void
  /** Current computed guard flag (exposed for tests/debugging). */
  shouldGuard: boolean
}

/**
 * Tracks whether an edit-mode form differs from its initial loaded snapshot.
 * Resets automatically when `enabled` turns false or `resetKey` changes.
 */
export function useEditDirtyBaseline(
  enabled: boolean,
  data: unknown,
  resetKey?: string | null
): boolean {
  const baselineRef = useRef<{ key: string; snapshot: string } | null>(null)

  if (!enabled) {
    baselineRef.current = null
    return false
  }

  const effectiveKey = resetKey ?? '__edit__'
  const serialized = JSON.stringify(data)

  if (!baselineRef.current || baselineRef.current.key !== effectiveKey) {
    baselineRef.current = { key: effectiveKey, snapshot: serialized }
    return false
  }

  return baselineRef.current.snapshot !== serialized
}

/**
 * Unified exit guard for all add/edit wizards.
 * Handles header back, bottom back, Android hardware back (via useFocusEffect),
 * and iOS edge-swipe / navigation `beforeRemove`.
 */
export function useWizardExitGuard({
  currentStep,
  isEditMode,
  hasData,
  isDirty,
  isSubmitting,
  isPublished,
  disabled = false,
  onPrevStep,
  onExit,
}: UseWizardExitGuardOptions): UseWizardExitGuardResult {
  let navigation: GuardNavigation | null = null
  try {
    navigation =
      typeof useNavigation === 'function'
        ? (useNavigation() as unknown as GuardNavigation | null)
        : null
  } catch {
    navigation = null
  }

  const shouldGuard =
    !disabled && !isSubmitting && !isPublished && (isEditMode ? isDirty : hasData)

  const bypassRef = useRef(false)
  const isPromptOpenRef = useRef(false)

  const performDefaultExit = useCallback(() => {
    if (onExit) {
      onExit()
    } else {
      router.back()
    }
  }, [onExit])

  const openExitPrompt = useCallback(
    (confirmExitAction: () => void) => {
      if (isPromptOpenRef.current) return
      isPromptOpenRef.current = true
      const copy = isEditMode ? WIZARD_EXIT_COPY.edit : WIZARD_EXIT_COPY.create

      toastService.confirm({
        title: copy.title,
        message: copy.message,
        intent: copy.intent,
        confirmLabel: copy.confirmLabel,
        cancelLabel: copy.cancelLabel,
        onConfirm: () => {
          isPromptOpenRef.current = false
          bypassRef.current = true
          confirmExitAction()
        },
        onCancel: () => {
          isPromptOpenRef.current = false
        },
      })
    },
    [isEditMode]
  )

  const requestExit = useCallback(() => {
    if (bypassRef.current || !shouldGuard) {
      bypassRef.current = true
      performDefaultExit()
      return
    }
    openExitPrompt(performDefaultExit)
  }, [openExitPrompt, performDefaultExit, shouldGuard])

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      if (!isSubmitting) {
        onPrevStep()
      }
      return
    }
    requestExit()
  }, [currentStep, isSubmitting, onPrevStep, requestExit])

  const stateRef = useRef({
    currentStep,
    shouldGuard,
    isSubmitting,
    isPublished,
    disabled,
    onPrevStep,
    performDefaultExit,
    openExitPrompt,
  })

  stateRef.current = {
    currentStep,
    shouldGuard,
    isSubmitting,
    isPublished,
    disabled,
    onPrevStep,
    performDefaultExit,
    openExitPrompt,
  }

  // Intercept navigation removal (iOS edge-swipe, programmatic pop, tab switch)
  useEffect(() => {
    if (!navigation || typeof navigation.addListener !== 'function') {
      return undefined
    }

    const unsubscribe = navigation.addListener('beforeRemove', (e: BeforeRemoveEvent) => {
      const latest = stateRef.current
      if (bypassRef.current || !latest.shouldGuard) {
        return
      }

      e.preventDefault()

      if (isPromptOpenRef.current) {
        return
      }

      latest.openExitPrompt(() => {
        if (e.data?.action && typeof navigation?.dispatch === 'function') {
          navigation.dispatch(e.data.action)
        } else {
          latest.performDefaultExit()
        }
      })
    })

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [navigation])

  // Register Android hardware back handler only while wizard screen is focused
  const focusEffect = typeof useFocusEffect === 'function' ? useFocusEffect : useEffect
  focusEffect(
    useCallback(() => {
      bypassRef.current = false
      isPromptOpenRef.current = false

      if (isPublished || disabled) {
        return undefined
      }

      const subscription = BackHandler?.addEventListener?.('hardwareBackPress', () => {
        const latest = stateRef.current
        if (latest.isPublished || latest.disabled) {
          return false
        }
        if (isPromptOpenRef.current) {
          return true
        }
        if (latest.currentStep > 1) {
          if (!latest.isSubmitting) {
            latest.onPrevStep()
          }
          return true
        }
        if (!latest.shouldGuard) {
          bypassRef.current = true
          latest.performDefaultExit()
          return true
        }
        latest.openExitPrompt(latest.performDefaultExit)
        return true
      })

      return () => {
        subscription?.remove?.()
      }
    }, [isPublished, disabled])
  )

  return {
    handleBack,
    requestExit,
    shouldGuard,
  }
}
