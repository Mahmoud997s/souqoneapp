import React from 'react'
import { StyleSheet } from 'react-native'
import { render, screen } from '@testing-library/react-native'
import { ServiceSpecializations } from '../ServiceSpecializations'
import { Colors } from '../../../../constants/colors'
import { Spacing } from '../../../../constants/spacing'

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

  describe('Card Spacing and Visual Tokens (D-170b)', () => {
    it('applies Spacing.space4 horizontal margin and Spacing.space2 vertical margin (Req a)', async () => {
      await render(<ServiceSpecializations specializations={['تغيير زيت']} />)
      const card = screen.getByTestId('service-specializations-card')
      const flatStyle = StyleSheet.flatten(card.props.style)
      expect(flatStyle.marginHorizontal).toBe(Spacing.space4)
      expect(flatStyle.marginVertical).toBe(Spacing.space2)
    })

    it('uses Colors.white background and card shadow matching Cars and Parts (Req b)', async () => {
      await render(<ServiceSpecializations specializations={['تغيير زيت']} />)
      const card = screen.getByTestId('service-specializations-card')
      const flatStyle = StyleSheet.flatten(card.props.style)
      expect(flatStyle.backgroundColor).toBe(Colors.white)
      expect(flatStyle.borderWidth).toBe(1)
      expect(flatStyle.borderColor).toBe(Colors.border)
    })
  })
})
