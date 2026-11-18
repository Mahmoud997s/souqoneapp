import React from 'react'
import { I18nManager, Text } from 'react-native'
import fs from 'fs'
import path from 'path'
import { act, render, waitFor } from '@testing-library/react-native'
import * as Reanimated from 'react-native-reanimated'
import {
  WizardStepTransition,
  getStepTransitionDirection,
  getStepTransitionOffsets,
  STEP_TRANSITION_OFFSET,
  STEP_TRANSITION_EXIT_MS,
  STEP_TRANSITION_ENTER_MS,
} from '../components/wizard/WizardStepTransition'
import * as reducedMotionMod from '../utils/listing-detail/useAppReducedMotion'

describe('D-364: WizardStepTransition shared step transition across 5 wizards', () => {
  const originalRTL = I18nManager.isRTL

  beforeEach(() => {
    I18nManager.isRTL = true
  })

  afterEach(() => {
    I18nManager.isRTL = originalRTL
    jest.restoreAllMocks()
  })

  it('derives forward / backward / none direction, RTL offsets, and exports exact timing constants', () => {
    expect(STEP_TRANSITION_OFFSET).toBe(24)
    expect(STEP_TRANSITION_EXIT_MS).toBe(110)
    expect(STEP_TRANSITION_ENTER_MS).toBe(200)
    expect(getStepTransitionDirection(1, 2)).toBe('forward')
    expect(getStepTransitionDirection(3, 2)).toBe('backward')
    expect(getStepTransitionDirection(2, 2)).toBe('none')

    // RTL (app forces I18nManager.forceRTL(true)):
    // forward: old exits left (-24), new enters from +24 -> 0
    expect(getStepTransitionOffsets('forward', true)).toEqual({ exitX: -24, enterX: 24 })
    expect(getStepTransitionOffsets('backward', true)).toEqual({ exitX: 24, enterX: -24 })
    // LTR mirror:
    expect(getStepTransitionOffsets('forward', false)).toEqual({ exitX: 24, enterX: -24 })
    expect(getStepTransitionOffsets('backward', false)).toEqual({ exitX: -24, enterX: 24 })
    expect(getStepTransitionOffsets('none', true)).toEqual({ exitX: 0, enterX: 0 })
  })

  it('animates exit (110ms) then enter (200ms), handles interrupted double-tap without blocking touches, and respects reducedMotion', async () => {
    const timingSpy = jest.spyOn(Reanimated, 'withTiming')
    const cancelSpy = jest.spyOn(Reanimated, 'cancelAnimation')
    const reducedSpy = jest.spyOn(reducedMotionMod, 'useAppReducedMotion').mockReturnValue(false)

    const { getByText, getByTestId, queryByTestId, queryByText, rerender } = await render(
      <WizardStepTransition stepKey={1}>
        <Text>الخطوة 1</Text>
      </WizardStepTransition>
    )
    expect(getByText('الخطوة 1')).toBeTruthy()
    expect(queryByTestId('wizard-step-transition-exiting')).toBeNull()
    expect(getByTestId('wizard-step-transition').props.pointerEvents).not.toBe('none')
    expect(timingSpy).not.toHaveBeenCalled()

    // Forward 1 -> 2: exiting overlay keeps Step 1 for ~110ms while Step 2 enters immediately
    await rerender(
      <WizardStepTransition stepKey={2}>
        <Text>الخطوة 2</Text>
      </WizardStepTransition>
    )
    expect(getByText('الخطوة 1')).toBeTruthy()
    expect(getByText('الخطوة 2')).toBeTruthy()
    expect(getByTestId('wizard-step-transition-exiting').props.pointerEvents).toBe('none')
    expect(timingSpy).toHaveBeenCalledWith(-24, expect.objectContaining({ duration: STEP_TRANSITION_EXIT_MS }))
    expect(timingSpy).toHaveBeenCalledWith(0, expect.objectContaining({ duration: STEP_TRANSITION_ENTER_MS }))

    // Complete 110ms exit -> exiting overlay unmounts
    await waitFor(() => {
      expect(queryByTestId('wizard-step-transition-exiting')).toBeNull()
    })
    expect(queryByText('الخطوة 1')).toBeNull()
    expect(getByText('الخطوة 2')).toBeTruthy()

    // Rapid interrupted double-tap 2 -> 3 -> 4 before exit timer completes
    cancelSpy.mockClear()
    await rerender(
      <WizardStepTransition stepKey={3}>
        <Text>الخطوة 3</Text>
      </WizardStepTransition>
    )
    await rerender(
      <WizardStepTransition stepKey={4}>
        <Text>الخطوة 4</Text>
      </WizardStepTransition>
    )
    expect(cancelSpy).toHaveBeenCalled()
    await act(async () => {
      await new Promise((r) => setTimeout(r, STEP_TRANSITION_EXIT_MS + 30))
    })
    expect(getByText('الخطوة 4')).toBeTruthy()
    expect(getByTestId('wizard-step-transition').props.pointerEvents).not.toBe('none')

    // Reduced motion = instant swap, no animation
    timingSpy.mockClear()
    reducedSpy.mockReturnValue(true)
    await rerender(
      <WizardStepTransition stepKey={5}>
        <Text>الخطوة 5</Text>
      </WizardStepTransition>
    )
    expect(getByText('الخطوة 5')).toBeTruthy()
    expect(timingSpy).not.toHaveBeenCalled()
  })

  it('wires WizardStepTransition in all 5 wizard screens around step body only', () => {
    const root = path.resolve(__dirname, '..', '..')
    const wizards = [
      'app/cars/new.tsx',
      'app/buses/new.tsx',
      'app/equipment/new.tsx',
      'app/parts/new.tsx',
      'app/services/new.tsx',
    ]

    for (const rel of wizards) {
      const src = fs.readFileSync(path.join(root, rel), 'utf8')
      expect(src).toContain('WizardStepTransition')
      expect(src).toMatch(/<WizardStepTransition\s+stepKey=\{currentStep\}>/)
    }
  })
})
