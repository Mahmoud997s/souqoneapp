import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { OperatorCardChips } from './OperatorCardChips'
import { buildOperatorChips } from './buildOperatorChips'

describe('OperatorCardChips', () => {
  it('renders chips and certification badge when present', async () => {
    const chips = [
      { key: 'c1', label: 'حفار', icon: 'construct-outline' },
      { key: 'c2', label: 'رافعة', icon: 'construct-outline' },
    ]

    await render(
      <OperatorCardChips
        chips={chips}
        hasCertifications={true}
        extraCount={2}
      />
    )

    expect(screen.getByText('حفار')).toBeTruthy()
    expect(screen.getByText('رافعة')).toBeTruthy()
    expect(screen.getByText('شهادة معتمدة')).toBeTruthy()
    expect(screen.getByText('+2')).toBeTruthy()
  })

  it('renders null when chips empty and no certifications', async () => {
    const { toJSON } = await render(
      <OperatorCardChips
        chips={[]}
        hasCertifications={false}
        extraCount={0}
      />
    )

    expect(toJSON()).toBeNull()
  })

  it('teeth check 1: chipsRow style has flexWrap nowrap and overflow hidden', async () => {
    const chips = [{ key: 'c1', label: 'حفار', icon: 'construct-outline' }]

    const { getByTestId } = await render(
      <OperatorCardChips chips={chips} />
    )

    const row = getByTestId('operator-chips-row')
    const flat = StyleSheet.flatten(row.props.style)
    expect(flat.flexWrap).toBe('nowrap')
    expect(flat.overflow).toBe('hidden')
  })

  it('teeth check 2: with 5 inputs only maxChips chips render plus +N with the exact hidden count', async () => {
    const built = buildOperatorChips({
      operatorTypeLabel: 'مشغل معدات',
      experienceText: '6 سنوات خبرة',
      hasCertifications: true,
      equipmentTags: ['حفار', 'جرافة'],
      maxChips: 3,
    })

    expect(built.totalChips).toBe(5)
    expect(built.chips).toHaveLength(3)
    expect(built.extraCount).toBe(2)

    const { getByTestId, queryByTestId, getByText } = await render(
      <OperatorCardChips chips={built.chips} extraCount={built.extraCount} />
    )

    // exactly 3 chip elements render
    expect(getByTestId('operator-chip-type')).toBeTruthy()
    expect(getByTestId('operator-chip-exp')).toBeTruthy()
    expect(getByTestId('operator-chip-cert')).toBeTruthy()

    // hidden equipment chips do not render
    expect(queryByTestId('operator-chip-eq-0')).toBeNull()
    expect(queryByTestId('operator-chip-eq-1')).toBeNull()

    // extra count badge displays exactly +2
    expect(getByTestId('operator-chip-extra')).toBeTruthy()
    expect(getByText('+2')).toBeTruthy()
  })
})
