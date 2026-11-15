import React from 'react'
import { StyleSheet, View } from 'react-native'
import { render, screen, fireEvent } from '@testing-library/react-native'
import type { GlassViewProps } from 'expo-glass-effect'
import type { SharedValue } from 'react-native-reanimated'
import {
  ContactActions,
  CONTACT_ACTIONS_BAR_HEIGHT,
  CONTACT_ACTIONS_HIDDEN_TRANSLATE_Y,
} from '../../components/listing-detail/ContactActions'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'
import { BottomBarTokens } from '../../constants/bottomBarTokens'

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

// Mock react-native-reanimated interpolate
jest.mock('react-native-reanimated', () => {
  const reanimated = require('react-native-reanimated/mock')
  return {
    ...reanimated,
    interpolate: jest.fn((_val: number, _inRange: number[], outRange: number[]) => outRange[outRange.length - 1] ?? 0),
  }
})

// Mock expo-blur
jest.mock('expo-blur', () => {
  const ReactLib = require('react')
  const { View: RNView } = require('react-native')
  return {
    BlurView: ({ children, ...props }: Record<string, unknown>) =>
      ReactLib.createElement(RNView, { testID: 'mock-blur-view', ...props }, children),
  }
})

// Mock vector icons
jest.mock('@expo/vector-icons', () => {
  const ReactLib = require('react')
  const { View: RNView } = require('react-native')
  return {
    Ionicons: (props: Record<string, unknown>) =>
      ReactLib.createElement(RNView, { testID: `icon-${String(props.name)}`, ...props }),
  }
})

interface TestElementNode {
  props?: { style?: unknown; testID?: string; children?: unknown }
  parent: unknown
}

function assertNoOpacityInAncestry(startElement: unknown, rootTestId?: string) {
  let current = startElement as TestElementNode | null
  while (current) {
    const flatStyle = (StyleSheet.flatten(current.props?.style) || {}) as Record<string, unknown>
    expect(flatStyle.opacity).toBeUndefined()
    if (rootTestId && current.props?.testID === rootTestId) {
      break
    }
    current = current.parent as TestElementNode | null
  }
}

describe('ContactActions Glass Conversion Specification', () => {
  const MockGlassView: React.ComponentType<GlassViewProps> = (props: GlassViewProps) => (
    <View testID="mock-glass-view" {...props} />
  )

  it('1. Sticky liquid branch renders native GlassView and has no opacity in ancestry', async () => {
    const { getByTestId } = await render(
      <ContactActions
        variant="sticky"
        availability={{ mode: 'full' }}
        busyAction={null}
        onCall={jest.fn()}
        onWhatsApp={jest.fn()}
        onChat={jest.fn()}
        scrollY={{ value: 400 } as unknown as SharedValue<number>}
        support={{ kind: 'liquid', GlassView: MockGlassView }}
      />
    )

    const liquidSurface = getByTestId('contact-actions-glass-liquid')
    expect(liquidSurface).toBeTruthy()
    expect(getByTestId('mock-glass-view')).toBeTruthy()

    assertNoOpacityInAncestry(liquidSurface)
  })

  it('2. Sticky blur branch matches exact blur recipe (intensity 70) and has no opacity in ancestry', async () => {
    const { getByTestId } = await render(
      <ContactActions
        variant="sticky"
        availability={{ mode: 'full' }}
        busyAction={null}
        onCall={jest.fn()}
        onWhatsApp={jest.fn()}
        onChat={jest.fn()}
        scrollY={{ value: 400 } as unknown as SharedValue<number>}
        support={{ kind: 'blur' }}
      />
    )

    const blurSurface = getByTestId('contact-actions-glass-blur')
    expect(blurSurface).toBeTruthy()

    const blurView = getByTestId('mock-blur-view')
    expect(blurView.props.intensity).toBe(70)
    expect(blurView.props.tint).toBe('light')
    expect(blurView.props.blurMethod).toBe('dimezisBlurView')

    const children = blurSurface.props.children
    const washView = Array.isArray(children) ? children[1] : null
    expect(washView).toBeTruthy()
    const washStyle = StyleSheet.flatten(washView.props.style)
    expect(washStyle.backgroundColor).toBe(BottomBarTokens.stickyCardWashBg)

    assertNoOpacityInAncestry(blurSurface)
  })

  it('3. Inline variant buttons meet the 44pt touch target, radius md, and correct colors', async () => {
    const { getByTestId } = await render(
      <ContactActions
        variant="inline"
        availability={{ mode: 'full' }}
        busyAction={null}
        onCall={jest.fn()}
        onWhatsApp={jest.fn()}
        onChat={jest.fn()}
      />
    )

    const callBtn = getByTestId('btn-contact-call')
    const callStyle = StyleSheet.flatten(callBtn.props.style)
    expect(callStyle.height).toBe(Spacing.touch)
    expect(callStyle.height).toBeGreaterThanOrEqual(44)
    expect(callStyle.borderRadius).toBe(Radius.md)
    expect(callStyle.backgroundColor).toBe(Colors.primary)

    const waBtn = getByTestId('btn-contact-whatsapp')
    const waStyle = StyleSheet.flatten(waBtn.props.style)
    expect(waStyle.height).toBe(Spacing.touch)
    expect(waStyle.height).toBeGreaterThanOrEqual(44)
    expect(waStyle.borderRadius).toBe(Radius.md)

    const chatBtn = getByTestId('btn-contact-chat')
    const chatStyle = StyleSheet.flatten(chatBtn.props.style)
    expect(chatStyle.height).toBe(Spacing.touch)
    expect(chatStyle.height).toBeGreaterThanOrEqual(44)
    expect(chatStyle.borderRadius).toBe(Radius.md)
  })

  it.each(['inline', 'sticky'] as const)(
    'renders all shared contact actions in the %s variant',
    async (variant) => {
      const { getByTestId } = await render(
        <ContactActions
          variant={variant}
          availability={{ mode: 'full' }}
          busyAction={null}
          onCall={jest.fn()}
          onWhatsApp={jest.fn()}
          onChat={jest.fn()}
          scrollY={variant === 'sticky' ? ({ value: 400 } as unknown as SharedValue<number>) : undefined}
        />
      )

      expect(getByTestId('btn-contact-call')).toBeTruthy()
      expect(getByTestId('btn-contact-whatsapp')).toBeTruthy()
      expect(getByTestId('btn-contact-chat')).toBeTruthy()
      if (variant === 'sticky') {
        expect(StyleSheet.flatten(getByTestId('btn-contact-call').props.style).height).toBe(42)
        expect(CONTACT_ACTIONS_BAR_HEIGHT).toBe(64.4)
        expect(CONTACT_ACTIONS_HIDDEN_TRANSLATE_Y).toBeGreaterThanOrEqual(64.4 + 34)
      }
    }
  )

  it('4. Availability mode chatOnly renders only chat', async () => {
    const { getByTestId, queryByTestId } = await render(
      <ContactActions
        variant="inline"
        availability={{ mode: 'chatOnly' }}
        busyAction={null}
        onCall={jest.fn()}
        onWhatsApp={jest.fn()}
        onChat={jest.fn()}
      />
    )
    const chatButton = getByTestId('btn-contact-chat')
    expect(chatButton).toBeTruthy()
    expect(StyleSheet.flatten(chatButton.props.style).height).toBe(Spacing.touch)
    expect(StyleSheet.flatten(chatButton.props.style).height).toBeGreaterThanOrEqual(44)
    expect(queryByTestId('btn-contact-call')).toBeNull()
    expect(queryByTestId('btn-contact-whatsapp')).toBeNull()
  })

  it('renders 44pt call and chat controls for the noWhatsapp inline mode', async () => {
    const { getByTestId, queryByTestId } = await render(
      <ContactActions
        variant="inline"
        availability={{ mode: 'noWhatsapp' }}
        busyAction={null}
        onCall={jest.fn()}
        onWhatsApp={jest.fn()}
        onChat={jest.fn()}
      />
    )

    for (const testID of ['btn-contact-call', 'btn-contact-chat']) {
      const button = getByTestId(testID)
      expect(StyleSheet.flatten(button.props.style).height).toBe(Spacing.touch)
      expect(StyleSheet.flatten(button.props.style).height).toBeGreaterThanOrEqual(44)
    }
    expect(queryByTestId('btn-contact-whatsapp')).toBeNull()
  })

  it('5. Availability mode hidden returns null', async () => {
    const { toJSON } = await render(
      <ContactActions
        variant="inline"
        availability={{ mode: 'hidden' }}
        busyAction={null}
        onCall={jest.fn()}
        onWhatsApp={jest.fn()}
        onChat={jest.fn()}
      />
    )
    expect(toJSON()).toBeNull()
  })

  describe('6. D-342 per-button busyAction spinner & accessibilityState', () => {
    const cases: Array<{
      action: 'call' | 'whatsapp' | 'chat'
      spinnerId: string
      otherSpinners: string[]
      otherLabels: string[]
      pressedBtnId: string
      otherBtnIds: string[]
    }> = [
      {
        action: 'call',
        spinnerId: 'btn-contact-call-spinner',
        otherSpinners: ['btn-contact-whatsapp-spinner', 'btn-contact-chat-spinner'],
        otherLabels: ['واتساب', 'محادثة'],
        pressedBtnId: 'btn-contact-call',
        otherBtnIds: ['btn-contact-whatsapp', 'btn-contact-chat'],
      },
      {
        action: 'whatsapp',
        spinnerId: 'btn-contact-whatsapp-spinner',
        otherSpinners: ['btn-contact-call-spinner', 'btn-contact-chat-spinner'],
        otherLabels: ['اتصال', 'محادثة'],
        pressedBtnId: 'btn-contact-whatsapp',
        otherBtnIds: ['btn-contact-call', 'btn-contact-chat'],
      },
      {
        action: 'chat',
        spinnerId: 'btn-contact-chat-spinner',
        otherSpinners: ['btn-contact-call-spinner', 'btn-contact-whatsapp-spinner'],
        otherLabels: ['اتصال', 'واتساب'],
        pressedBtnId: 'btn-contact-chat',
        otherBtnIds: ['btn-contact-call', 'btn-contact-whatsapp'],
      },
    ]

    it.each(cases)(
      'shows spinner only on $action when busyAction="$action" and disables all buttons',
      async ({ action, spinnerId, otherSpinners, otherLabels, pressedBtnId, otherBtnIds }) => {
        const onCall = jest.fn()
        const onWhatsApp = jest.fn()
        const onChat = jest.fn()
        const { getByTestId, queryByTestId, getByText } = await render(
          <ContactActions
            variant="inline"
            availability={{ mode: 'full' }}
            busyAction={action}
            onCall={onCall}
            onWhatsApp={onWhatsApp}
            onChat={onChat}
          />
        )

        expect(getByTestId(spinnerId)).toBeTruthy()
        for (const other of otherSpinners) {
          expect(queryByTestId(other)).toBeNull()
        }
        for (const label of otherLabels) {
          expect(getByText(label)).toBeTruthy()
        }

        const pressedBtn = getByTestId(pressedBtnId)
        expect(pressedBtn.props.accessibilityState).toEqual({ disabled: true, busy: true })
        fireEvent.press(pressedBtn)

        for (const otherBtnId of otherBtnIds) {
          const otherBtn = getByTestId(otherBtnId)
          expect(otherBtn.props.accessibilityState).toEqual({ disabled: true, busy: false })
          fireEvent.press(otherBtn)
        }

        expect(onCall).not.toHaveBeenCalled()
        expect(onWhatsApp).not.toHaveBeenCalled()
        expect(onChat).not.toHaveBeenCalled()
      }
    )

    it('renders no spinners and enables all buttons when busyAction=null', async () => {
      const onCall = jest.fn()
      const onWhatsApp = jest.fn()
      const onChat = jest.fn()
      const { getByTestId, queryByTestId } = await render(
        <ContactActions
          variant="inline"
          availability={{ mode: 'full' }}
          busyAction={null}
          onCall={onCall}
          onWhatsApp={onWhatsApp}
          onChat={onChat}
        />
      )

      expect(queryByTestId('btn-contact-call-spinner')).toBeNull()
      expect(queryByTestId('btn-contact-whatsapp-spinner')).toBeNull()
      expect(queryByTestId('btn-contact-chat-spinner')).toBeNull()

      for (const id of ['btn-contact-call', 'btn-contact-whatsapp', 'btn-contact-chat']) {
        const btn = getByTestId(id)
        expect(btn.props.accessibilityState).toEqual({ disabled: false, busy: false })
        fireEvent.press(btn)
      }

      expect(onCall).toHaveBeenCalledTimes(1)
      expect(onWhatsApp).toHaveBeenCalledTimes(1)
      expect(onChat).toHaveBeenCalledTimes(1)
    })
  })
})
