import React from 'react'
import { View } from 'react-native'
import { render, screen } from '@testing-library/react-native'
import { GlobalToast } from '../../components/ui/GlobalToast'
import { ModalToastHost } from '../../components/ui/ModalToastHost'
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

jest.mock('../../utils/listing-detail/useAppReducedMotion', () => ({
  useAppReducedMotion: () => true,
}))

describe('D-366 ModalToastHost LIFO layering and single-host arbitration', () => {
  beforeEach(() => {
    useToastStore.setState({
      current: null,
      queuedNotice: null,
      activeDecision: null,
      decisionQueue: [],
      activeSheet: null,
      modalHostIds: [],
    })
  })

  it('renders toast in root GlobalToast when no modal host is mounted, and moves it to ModalToastHost without duplication when mounted', async () => {
    toastService.show({ kind: 'error', title: 'رسالة فوق المودال' })

    const { rerender } = await render(
      <View>
        <GlobalToast />
      </View>
    )

    expect(screen.queryAllByTestId('global-toast-card')).toHaveLength(1)

    await rerender(
      <View>
        <GlobalToast />
        <ModalToastHost />
      </View>
    )

    // Still exactly 1 toast card rendered (inside the active ModalToastHost, not duplicated in root)
    expect(screen.queryAllByTestId('global-toast-card')).toHaveLength(1)

    await rerender(
      <View>
        <GlobalToast />
      </View>
    )

    // Root GlobalToast resumes rendering once ModalToastHost unmounts
    expect(screen.queryAllByTestId('global-toast-card')).toHaveLength(1)
  })
})
