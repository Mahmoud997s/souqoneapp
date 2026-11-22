import React from 'react'
import { BackHandler } from 'react-native'
import { render, screen, fireEvent, act } from '@testing-library/react-native'
import { GlassActionSheetHost } from '../../components/ui/GlassActionSheet'
import { toastService, useToastStore } from '../../store/toastStore'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 16, left: 0, right: 0 }),
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
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
  },
}))

describe('D-366 GlassActionSheet multi-option menu', () => {
  let backHandlerCallback: (() => boolean | null | undefined) | null = null

  beforeEach(() => {
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
      return { remove: jest.fn() }
    })
  })

  it('renders options, destructive row, and separated cancel row, and runs option callback on press', async () => {
    const onCopy = jest.fn()
    const onDelete = jest.fn()

    toastService.showActionSheet({
      title: 'خيارات الرسالة',
      options: [
        { text: 'نسخ النص', onPress: onCopy },
        { text: 'حذف الرسالة', style: 'destructive', onPress: onDelete },
      ],
    })

    await render(<GlassActionSheetHost />)

    expect(screen.getByText('خيارات الرسالة')).toBeTruthy()
    expect(screen.getByText('نسخ النص')).toBeTruthy()
    expect(screen.getByText('حذف الرسالة')).toBeTruthy()
    expect(screen.getByTestId('glass-action-sheet-cancel-btn')).toBeTruthy()

    fireEvent.press(screen.getByTestId('glass-action-sheet-option-0'))
    expect(onCopy).toHaveBeenCalledTimes(1)
    expect(useToastStore.getState().activeSheet).toBeNull()
  })

  it('dismisses and invokes onCancel on outside scrim press or Android BackHandler', async () => {
    const onCancel = jest.fn()

    toastService.showActionSheet({
      title: 'خيارات المحادثة',
      options: [{ text: 'كتم الإشعارات', onPress: jest.fn() }],
      onCancel,
    })

    await render(<GlassActionSheetHost />)

    fireEvent.press(screen.getByTestId('glass-action-sheet-scrim'))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(useToastStore.getState().activeSheet).toBeNull()

    act(() => {
      toastService.showActionSheet({
        title: 'خيارات المحادثة',
        options: [{ text: 'كتم الإشعارات', onPress: jest.fn() }],
      })
    })

    await render(<GlassActionSheetHost />)
    expect(backHandlerCallback).not.toBeNull()
    act(() => {
      backHandlerCallback!()
    })
    expect(useToastStore.getState().activeSheet).toBeNull()
  })
})
