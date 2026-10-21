import React from 'react'
import { Text } from 'react-native'
import { render, screen } from '@testing-library/react-native'
import { useAppReducedMotion } from './useAppReducedMotion'

describe('useAppReducedMotion', () => {
  async function renderHookValue(getter?: () => boolean): Promise<boolean> {
    function TestConsumer() {
      const val = useAppReducedMotion(getter)
      return <Text testID="val">{val ? 'true' : 'false'}</Text>
    }
    await render(<TestConsumer />)
    return screen.getByTestId('val').props.children === 'true'
  }

  it('defaults to false when useReducedMotion is undefined in mock environment', async () => {
    expect(await renderHookValue()).toBe(false)
  })

  it('returns true when getter supplies true', async () => {
    expect(await renderHookValue(() => true)).toBe(true)
  })

  it('returns false when getter supplies false', async () => {
    expect(await renderHookValue(() => false)).toBe(false)
  })
})
