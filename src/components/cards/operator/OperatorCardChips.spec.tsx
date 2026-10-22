import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { OperatorCardChips } from './OperatorCardChips'

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
})
