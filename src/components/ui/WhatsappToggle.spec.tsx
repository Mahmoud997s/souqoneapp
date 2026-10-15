import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { Switch, Text } from 'react-native'
import { WhatsappToggle } from './WhatsappToggle'

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light' },
}))

describe('WhatsappToggle', () => {
  it('renders card variant with title and helper subtitle', () => {
    let renderer: any
    act(() => {
      renderer = TestRenderer.create(
        <WhatsappToggle value={false} onValueChange={jest.fn()} />
      )
    })

    const switchComp = renderer.root.findByType(Switch)
    expect(switchComp).toBeDefined()
    expect(switchComp.props.value).toBe(false)
    expect(switchComp.props.testID).toBe('whatsapp-enabled-switch')

    const texts = renderer.root.findAllByType(Text)
    const textContents = texts.map((t: any) => t.props.children).flat().join(' ')
    expect(textContents).toContain('التواصل عبر واتساب')
    expect(textContents).toContain('يظهر زر واتساب للمشتري على رقم بروفايلك')
  })

  it('triggers onValueChange callback when toggled', () => {
    const onValueChange = jest.fn()
    let renderer: any
    act(() => {
      renderer = TestRenderer.create(
        <WhatsappToggle value={false} onValueChange={onValueChange} />
      )
    })

    const switchComp = renderer.root.findByType(Switch)
    act(() => {
      switchComp.props.onValueChange(true)
    })

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith(true)
  })

  it('renders row variant cleanly without WizardCard wrapping', () => {
    let renderer: any
    act(() => {
      renderer = TestRenderer.create(
        <WhatsappToggle value={true} onValueChange={jest.fn()} variant="row" />
      )
    })

    const switchComp = renderer.root.findByType(Switch)
    expect(switchComp.props.value).toBe(true)

    const texts = renderer.root.findAllByType(Text)
    const textContents = texts.map((t: any) => t.props.children).flat().join(' ')
    expect(textContents).toContain('التواصل عبر واتساب')
    expect(textContents).toContain('يظهر زر واتساب للمشتري على رقم بروفايلك')
  })

  it('respects disabled state and ignores toggle', () => {
    const onValueChange = jest.fn()
    let renderer: any
    act(() => {
      renderer = TestRenderer.create(
        <WhatsappToggle value={false} onValueChange={onValueChange} disabled />
      )
    })

    const switchComp = renderer.root.findByType(Switch)
    expect(switchComp.props.disabled).toBe(true)
    act(() => {
      switchComp.props.onValueChange(true)
    })
    expect(onValueChange).not.toHaveBeenCalled()
  })
})
