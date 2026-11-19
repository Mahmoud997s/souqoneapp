import React from 'react'
import { StyleSheet, Text } from 'react-native'
import fs from 'fs'
import path from 'path'
import { render } from '@testing-library/react-native'
import { WizardReviewCard } from '../components/ui/WizardReviewCard'
import { Colors } from '../constants/colors'
import { Radius } from '../constants/radius'
import { Spacing } from '../constants/spacing'

describe('D-370: WizardReviewCard solid Colors.surface & BusStep6Review fontFamily', () => {
  it('renders solid Colors.surface with Colors.border, no GlassSurface/BlurView, preserving padding/gap/radius', async () => {
    const { getByTestId, queryByTestId } = await render(
      <WizardReviewCard testID="review-card">
        <Text>محتوى المراجعة</Text>
      </WizardReviewCard>
    )

    expect(queryByTestId('review-card-surface')).toBeNull()
    expect(queryByTestId('review-card-surface-glass-liquid')).toBeNull()
    expect(queryByTestId('mock-blur-view')).toBeNull()

    const card = getByTestId('review-card')
    const flat = StyleSheet.flatten(card.props.style)
    expect(flat.backgroundColor).toBe(Colors.surface)
    expect(flat.borderColor).toBe(Colors.border)
    expect(flat.borderWidth).toBe(1)
    expect(flat.borderRadius).toBe(Radius.lg)
    expect(flat.padding).toBe(Spacing.space4)
    expect(flat.gap).toBe(12)
  })

  it('WizardReviewCard.tsx does not import GlassSurface or BottomBarTokens', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '..', 'components', 'ui', 'WizardReviewCard.tsx'),
      'utf8'
    )
    expect(src).not.toContain('GlassSurface')
    expect(src).not.toContain('BottomBarTokens')
  })

  it('BusStep6Review valueHighlight style defines Almarai fontFamily alongside fontSize', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '..', 'components', 'buses', 'wizard', 'BusStep6Review.tsx'),
      'utf8'
    )
    expect(src).toMatch(/valueHighlight:\s*\{[^}]*fontFamily:\s*'Almarai_/)
  })
})
