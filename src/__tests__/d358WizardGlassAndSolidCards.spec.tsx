import React from 'react'
import { StyleSheet, Text } from 'react-native'
import { render } from '@testing-library/react-native'
import { WizardCard } from '../components/ui/WizardCard'
import { WizardStickyFooter } from '../components/ui/WizardStickyFooter'
import { AppInput } from '../components/ui/AppInput'
import { AppButton } from '../components/ui/AppButton'
import { WizardSelectField } from '../components/ui/WizardSelectField'
import { BusStep3Details } from '../components/buses/wizard/BusStep3Details'
import { useBusWizardStore } from '../store/busWizardStore'
import { Colors } from '../constants/colors'
import { Radius } from '../constants/radius'
import { Spacing } from '../constants/spacing'

jest.mock('../api/buses', () => ({
  busesApi: {
    getManufacturers: jest.fn().mockResolvedValue({ data: [] }),
    getModels: jest.fn().mockResolvedValue({ data: [] }),
  },
}))

describe('D-358: Wizard solid cards, glass controls, and floating bottom bar', () => {
  it('WizardCard renders solid white card colour (Colors.surface) without GlassSurface (D-367)', async () => {
    const { getByTestId, queryByTestId } = await render(
      <WizardCard testID="d358-card" title="بيانات">
        <Text>محتوى</Text>
      </WizardCard>
    )

    const card = getByTestId('d358-card')
    const cardStyle = StyleSheet.flatten(card.props.style)
    expect(cardStyle.backgroundColor).toBe(Colors.surface)
    expect(cardStyle.borderColor).toBe(Colors.border)
    expect(cardStyle.borderWidth).toBe(1)
    expect(queryByTestId('d358-card-surface')).toBeNull()
  })

  it('WizardStickyFooter renders as a floating rounded glass bar inset from edges', async () => {
    const { getByTestId } = await render(
      <WizardStickyFooter testID="d358-footer" paddingBottom={16}>
        <Text>أزرار</Text>
      </WizardStickyFooter>
    )

    const footer = getByTestId('d358-footer')
    const style = StyleSheet.flatten(footer.props.style)
    expect(style.left).toBeGreaterThan(0)
    expect(style.right).toBeGreaterThan(0)
    expect(style.bottom).toBeGreaterThan(0)
    expect(style.borderRadius).toBe(Radius.lg)
    expect(getByTestId('d358-footer-glass-layers')).toBeTruthy()
  })

  it('AppInput renders nav-bar glass only when glass prop is true', async () => {
    const defaultRender = await render(<AppInput testID="default-input" placeholder="عادي" />)
    expect(defaultRender.queryByTestId('default-input-glass-layers')).toBeNull()

    const glassRender = await render(<AppInput testID="glass-input" glass placeholder="زجاج" />)
    expect(glassRender.getByTestId('glass-input-glass-layers')).toBeTruthy()
  })

  it('WizardSelectField renders nav-bar glass only when glass prop is true', async () => {
    const opts = [{ value: 'a', label: 'أ' }]
    const defaultRender = await render(
      <WizardSelectField testID="default-select" options={opts} onSelect={jest.fn()} />
    )
    expect(defaultRender.queryByTestId('default-select-glass-layers')).toBeNull()

    const glassRender = await render(
      <WizardSelectField testID="glass-select" glass options={opts} onSelect={jest.fn()} />
    )
    expect(glassRender.getByTestId('glass-select-glass-layers')).toBeTruthy()
  })

  it('AppButton renders nav-bar glass only for variant="glass"', async () => {
    const outlineRender = await render(<AppButton testID="outline-btn" variant="outline" title="عادي" />)
    expect(outlineRender.queryByTestId('outline-btn-glass-layers')).toBeNull()

    const glassRender = await render(<AppButton testID="glass-btn" variant="glass" title="زجاج" />)
    expect(glassRender.getByTestId('glass-btn-glass-layers')).toBeTruthy()
  })

  it('BusStep3Details manual-brand button uses glass variant with minHeight >= 44 and regular font', async () => {
    const { getByTestId, getByText } = await render(
      <BusStep3Details
        data={{
          ...useBusWizardStore.getState().data,
          busListingType: 'SALE',
          busType: 'MINIBUS',
        }}
        errors={{}}
        onUpdateField={jest.fn()}
      />
    )

    expect(getByTestId('enable-custom-make-btn-glass-layers')).toBeTruthy()
    const btn = getByTestId('enable-custom-make-btn')
    const btnStyle = StyleSheet.flatten(btn.props.style)
    expect(btnStyle.minHeight).toBeGreaterThanOrEqual(44)
    expect(btnStyle.paddingHorizontal).toBeGreaterThanOrEqual(Spacing.space3)

    const label = getByText('الماركة غير موجودة؟ اكتبها يدوياً')
    const labelStyle = StyleSheet.flatten(label.props.style)
    expect(labelStyle.fontFamily).toBe('Almarai_400Regular')
  })
})
