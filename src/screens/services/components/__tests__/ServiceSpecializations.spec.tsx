import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { ServiceSpecializations } from '../ServiceSpecializations'

jest.setTimeout(15000)

describe('ServiceSpecializations', () => {
  it('returns null when specializations array is empty', async () => {
    await render(<ServiceSpecializations specializations={[]} />)
    expect(screen.queryByTestId('service-specializations-card')).toBeNull()
  })

  it('returns null when specializations is undefined or invalid', async () => {
    // @ts-expect-error test invalid prop
    await render(<ServiceSpecializations specializations={null} />)
    expect(screen.queryByTestId('service-specializations-card')).toBeNull()
  })

  it('renders all specialization chips with title', async () => {
    const specs = ['تغيير زيت وفلاتر', 'صيانة محركات', 'فحص كمبيوتر', 'كهرباء وتكييف']
    await render(<ServiceSpecializations specializations={specs} />)

    expect(screen.getByTestId('service-specializations-card')).toBeTruthy()
    expect(screen.getByText('التخصصات والخدمات المقدمة')).toBeTruthy()

    for (const spec of specs) {
      expect(screen.getByText(spec)).toBeTruthy()
    }
  })
})
