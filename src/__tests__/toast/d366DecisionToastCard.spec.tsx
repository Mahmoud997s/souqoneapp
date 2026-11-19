import React from 'react'
import { BackHandler } from 'react-native'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react-native'
import * as Haptics from 'expo-haptics'
import { DecisionToastCard } from '../../components/ui/DecisionToastCard'
import { toastService, useToastStore } from '../../store/toastStore'

jest.mock('expo-router', () => ({
  usePathname: jest.fn(() => '/'),
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
  NotificationFeedbackType: {
    Warning: 'warning',
  },
  ImpactFeedbackStyle: {
    Light: 'light',
  },
}))

jest.mock('../../utils/listing-detail/useAppReducedMotion', () => ({
  useAppReducedMotion: () => true,
}))

describe('D-366 DecisionToastCard interaction, outside-tap shake/haptic, and BackHandler', () => {
  let backHandlerCallback: (() => boolean | null | undefined) | null = null
  const removeSpy = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    backHandlerCallback = null
    useToastStore.setState({
      current: null,
      queuedNotice: null,
      activeDecision: null,
      decisionQueue: [],
      activeSheet: null,
      modalHostIds: [],
    })
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, cb) => {
      backHandlerCallback = () => (cb as () => boolean | null | undefined)()
      return { remove: removeSpy }
    })
  })

  afterEach(async () => {
    await cleanup()
  })

  it('renders title, message, and two full-pill capsule buttons with >=44pt hitSlop', async () => {
    const onConfirm = jest.fn()
    const onCancel = jest.fn()

    toastService.confirm({
      title: 'مسح المسودة',
      message: 'هل أنت متأكد من مسح المسودة؟',
      intent: 'danger',
      confirmLabel: 'مسح',
      cancelLabel: 'إلغاء',
      onConfirm,
      onCancel,
    })

    await render(<DecisionToastCard />)

    expect(screen.getByText('مسح المسودة')).toBeTruthy()
    expect(screen.getByText('هل أنت متأكد من مسح المسودة؟')).toBeTruthy()

    const confirmBtn = screen.getByTestId('decision-toast-confirm-btn')
    const cancelBtn = screen.getByTestId('decision-toast-cancel-btn')

    expect(confirmBtn.props.hitSlop).toEqual({ top: 7, bottom: 7, left: 6, right: 6 })
    expect(cancelBtn.props.hitSlop).toEqual({ top: 7, bottom: 7, left: 6, right: 6 })
  })

  it('does NOT dismiss on outside scrim press and debounces warning haptics by 400ms', async () => {
    const onConfirm = jest.fn()
    const onCancel = jest.fn()

    toastService.confirm({
      title: 'مسح المسودة',
      intent: 'danger',
      confirmLabel: 'مسح',
      cancelLabel: 'إلغاء',
      onConfirm,
      onCancel,
    })

    await render(<DecisionToastCard />)

    const scrim = screen.getByTestId('decision-toast-scrim')
    await act(async () => {
      fireEvent.press(scrim)
    })

    expect(useToastStore.getState().activeDecision).not.toBeNull()
    expect(onCancel).not.toHaveBeenCalled()
    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1)

    // Immediate second tap within 400ms window is debounced
    await act(async () => {
      fireEvent.press(scrim)
    })
    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1)

    // Wait >400ms then tap again -> triggers second warning haptic
    await new Promise((r) => setTimeout(r, 420))
    await act(async () => {
      fireEvent.press(scrim)
    })
    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(2)
  })

  it('invokes onConfirm and dismisses when confirm button is pressed', async () => {
    const onConfirm = jest.fn()
    toastService.confirm({
      title: 'مسح المسودة',
      intent: 'danger',
      confirmLabel: 'مسح',
      cancelLabel: 'إلغاء',
      onConfirm,
    })

    await render(<DecisionToastCard />)

    await act(async () => {
      fireEvent.press(screen.getByTestId('decision-toast-confirm-btn'))
    })
    expect(useToastStore.getState().activeDecision).toBeNull()
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('treats Android hardware BackHandler as Cancel', async () => {
    const onConfirm = jest.fn()
    const onCancel = jest.fn()

    toastService.confirm({
      title: 'مسح المسودة',
      intent: 'danger',
      confirmLabel: 'مسح',
      cancelLabel: 'إلغاء',
      onConfirm,
      onCancel,
    })

    await render(<DecisionToastCard />)

    expect(backHandlerCallback).not.toBeNull()
    let handled = false
    await act(async () => {
      handled = Boolean(backHandlerCallback!())
    })

    expect(handled).toBe(true)
    expect(useToastStore.getState().activeDecision).toBeNull()
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
