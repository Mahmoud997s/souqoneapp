import React from 'react'
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native'
import { render, act, cleanup } from '@testing-library/react-native'
import { ListingCardBase, type ListingCardPill } from '../../components/ui/ListingCardBase'
import * as CardSystemModule from '../../constants/cardSystem'
import { CARD_PILL_NATIVE_GLASS, CardSystem } from '../../constants/cardSystem'
import { Colors } from '../../constants/colors'
import { areListingCardBasePropsEqual } from '../../utils/cardMemoComparison'

jest.mock('@expo/vector-icons', () => {
  const ReactLib = require('react')
  const { View: RNView } = require('react-native')
  return {
    Ionicons: (props: Record<string, unknown>) =>
      ReactLib.createElement(RNView, { testID: `icon-${String(props.name)}`, ...props }),
    MaterialCommunityIcons: (props: Record<string, unknown>) =>
      ReactLib.createElement(RNView, { testID: `m-icon-${String(props.name)}`, ...props }),
  }
})

const mockIsLiquidGlassAvailable = jest.fn(() => true)
const mockIsGlassEffectAPIAvailable = jest.fn(() => true)
const MockGlassView = (props: Record<string, unknown>) =>
  React.createElement(View, { testID: 'mock-native-glass-view', ...props })

jest.mock('expo-glass-effect', () => ({
  GlassView: (props: Record<string, unknown>) => MockGlassView(props),
  GlassContainer: (props: Record<string, unknown>) => MockGlassView(props),
  isLiquidGlassAvailable: () => mockIsLiquidGlassAvailable(),
  isGlassEffectAPIAvailable: () => mockIsGlassEffectAPIAvailable(),
}))

jest.mock('expo-blur', () => {
  const ReactLib = require('react')
  const { View: RNView } = require('react-native')
  return {
    BlurView: (props: Record<string, unknown>) =>
      ReactLib.createElement(RNView, { testID: 'mock-blur-view', ...props }),
  }
})

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  router: { push: jest.fn() },
}))

jest.mock('../../store/authStore', () => ({
  useAuthStore: () => ({ user: { id: 'viewer-1' } }),
}))

jest.mock('../../features/favorites/useFavoriteToggle', () => ({
  useFavoriteToggle: () => ({
    isFavorite: false,
    toggle: jest.fn(),
  }),
}))

describe('D-205 — Card Glass Native View Reduction (1 GlassSurface per Card)', () => {
  const originalOS = Platform.OS

  const samplePills: ListingCardPill[] = [
    { key: 'model', label: 'لاندكروزر', iconName: 'car-outline' },
    { key: 'year', label: '2024', iconName: 'calendar-outline' },
    { key: 'trans', label: 'أوتوماتيك', iconName: 'cog-outline' },
    { key: 'mileage', label: '12,000 كم', iconName: 'speedometer-outline' },
    { key: 'fuel', label: 'بنزين', iconName: 'flame-outline' },
  ]

  const sampleItem = {
    id: 'car-d205',
    title: 'تويوتا لاندكروزر 2024',
    price: 28500,
    currency: 'OMR',
    status: 'ACTIVE',
    seller: { id: 'seller-99', isVerified: true },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockIsLiquidGlassAvailable.mockReturnValue(true)
    mockIsGlassEffectAPIAvailable.mockReturnValue(true)
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'ios' })
    jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockResolvedValue(false)
  })

  afterEach(async () => {
    await cleanup()
    jest.restoreAllMocks()
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => originalOS })
  })

  it('(a) with CARD_PILL_NATIVE_GLASS = false (default), rendered card contains exactly 1 GlassSurface (1 native GlassView) and renders non-native layered wash inside all pills', async () => {
    expect(CARD_PILL_NATIVE_GLASS).toBe(false)

    const rendered = await render(
      <ListingCardBase
        item={{ ...sampleItem, id: 'car-d205-a' }}
        title="تويوتا لاندكروزر 2024"
        priceLabel="28,500 ر.ع"
        isPriceNegotiable={true}
        location="مسقط"
        onPress={jest.fn()}
        pills={samplePills}
        maxChips={4}
      />
    )
    await act(async () => {})

    // 1. Exactly 1 native GlassView in the entire card (the card-level GlassSurface)
    const nativeGlassViews = rendered.getAllByTestId('mock-native-glass-view')
    expect(nativeGlassViews).toHaveLength(1)
    expect(rendered.getByTestId('listing-card-surface-glass-liquid')).toBeTruthy()

    // 2. None of the pills mount a native GlassSurface
    for (const key of ['model', 'year', 'trans', 'mileage']) {
      expect(rendered.queryByTestId(`listing-card-pill-${key}-glass-liquid`)).toBeNull()
      const wash = rendered.getByTestId(`listing-card-pill-${key}-layered-wash`)
      const washStyle = StyleSheet.flatten(wash.props.style)
      expect(washStyle.borderRadius).toBe(CardSystem.glass.capsuleRadius)
      expect(washStyle.backgroundColor).toBe(CardSystem.glass.capsuleBlurWashBg)
      expect(washStyle.borderWidth).toBe(StyleSheet.hairlineWidth)
      expect(washStyle.borderColor).toBe(CardSystem.glass.capsuleBorderColor)

      const highlight = rendered.getByTestId(`listing-card-pill-${key}-top-highlight`)
      const highlightStyle = StyleSheet.flatten(highlight.props.style)
      expect(highlightStyle.height).toBe(StyleSheet.hairlineWidth)
      expect(highlightStyle.backgroundColor).toBe(Colors.white)
    }

    // 3. Remaining (+1), negotiable, and price pills also use non-native layered wash
    expect(rendered.queryByTestId('listing-card-pill-remaining-glass-liquid')).toBeNull()
    expect(rendered.getByTestId('listing-card-pill-remaining-layered-wash')).toBeTruthy()

    expect(rendered.queryByTestId('listing-card-negotiable-pill-glass-liquid')).toBeNull()
    const negWash = rendered.getByTestId('listing-card-negotiable-pill-layered-wash')
    const negWashStyle = StyleSheet.flatten(negWash.props.style)
    expect(negWashStyle.backgroundColor).toBe(CardSystem.glass.negotiableTint)
    expect(negWashStyle.borderColor).toBe(CardSystem.glass.negotiableBorderColor)

    expect(rendered.queryByTestId('listing-card-price-pill-glass-liquid')).toBeNull()
    const priceWash = rendered.getByTestId('listing-card-price-pill-layered-wash')
    const priceWashStyle = StyleSheet.flatten(priceWash.props.style)
    expect(priceWashStyle.backgroundColor).toBe(CardSystem.glass.negotiableTint)
    expect(priceWashStyle.borderColor).toBe(CardSystem.glass.negotiableBorderColor)
  })

  it('(b) with constant true (via pillNativeGlass={true} prop override AND via CARD_PILL_NATIVE_GLASS = true), restores the old native GlassSurface count (8 total)', async () => {
    // 1. Prop override verification
    const renderedProp = await render(
      <ListingCardBase
        item={{ ...sampleItem, id: 'car-d205-b1' }}
        title="تويوتا لاندكروزر 2024"
        priceLabel="28,500 ر.ع"
        isPriceNegotiable={true}
        location="مسقط"
        onPress={jest.fn()}
        pills={samplePills}
        maxChips={4}
        pillNativeGlass={true}
      />
    )
    await act(async () => {})

    // 1 card surface + 4 spec pills + 1 remaining pill + 1 negotiable pill + 1 price pill = 8 native GlassViews
    expect(renderedProp.getAllByTestId('mock-native-glass-view')).toHaveLength(8)
    expect(renderedProp.getByTestId('listing-card-surface-glass-liquid')).toBeTruthy()
    expect(renderedProp.getByTestId('listing-card-pill-model-glass-liquid')).toBeTruthy()
    expect(renderedProp.getByTestId('listing-card-pill-remaining-glass-liquid')).toBeTruthy()
    expect(renderedProp.getByTestId('listing-card-negotiable-pill-glass-liquid')).toBeTruthy()
    expect(renderedProp.getByTestId('listing-card-price-pill-glass-liquid')).toBeTruthy()
    await cleanup()

    // 2. Exported constant switch verification (flipping CARD_PILL_NATIVE_GLASS to true)
    ;(CardSystemModule as { CARD_PILL_NATIVE_GLASS: boolean }).CARD_PILL_NATIVE_GLASS = true
    try {
      const renderedConst = await render(
        <ListingCardBase
          item={{ ...sampleItem, id: 'car-d205-b2' }}
          title="تويوتا لاندكروزر 2024"
          priceLabel="28,500 ر.ع"
          isPriceNegotiable={true}
          location="مسقط"
          onPress={jest.fn()}
          pills={samplePills}
          maxChips={4}
        />
      )
      await act(async () => {})

      expect(renderedConst.getAllByTestId('mock-native-glass-view')).toHaveLength(8)
    } finally {
      ;(CardSystemModule as { CARD_PILL_NATIVE_GLASS: boolean }).CARD_PILL_NATIVE_GLASS = false
    }
  })

  it('(c) keeps pill wrapper layout, sizes, borders, RTL, and React.memo comparator behavior identical', async () => {
    const onPress = jest.fn()
    const baseProps = {
      item: { ...sampleItem, id: 'car-d205-c1' },
      title: 'تويوتا لاندكروزر 2024',
      priceLabel: '28,500 ر.ع',
      isPriceNegotiable: true,
      location: 'مسقط',
      onPress,
      pills: [...samplePills],
      maxChips: 4,
    }

    const renderedNonNative = await render(
      <ListingCardBase {...baseProps} />
    )
    await act(async () => {})
    const nonNativeModelWrap = StyleSheet.flatten(
      renderedNonNative.getByTestId('listing-card-pill-wrap-model').props.style
    )
    const nonNativeNegWrap = StyleSheet.flatten(
      renderedNonNative.getByTestId('listing-card-negotiable-pill-wrap').props.style
    )
    const nonNativePriceWrap = StyleSheet.flatten(
      renderedNonNative.getByTestId('listing-card-price-pill-wrap').props.style
    )
    await cleanup()

    const renderedNative = await render(
      <ListingCardBase {...baseProps} item={{ ...sampleItem, id: 'car-d205-c2' }} pillNativeGlass={true} />
    )
    await act(async () => {})
    const nativeModelWrap = StyleSheet.flatten(
      renderedNative.getByTestId('listing-card-pill-wrap-model').props.style
    )
    const nativeNegWrap = StyleSheet.flatten(
      renderedNative.getByTestId('listing-card-negotiable-pill-wrap').props.style
    )
    const nativePriceWrap = StyleSheet.flatten(
      renderedNative.getByTestId('listing-card-price-pill-wrap').props.style
    )

    expect(nonNativeModelWrap).toEqual(nativeModelWrap)
    expect(nonNativeNegWrap).toEqual(nativeNegWrap)
    expect(nonNativePriceWrap).toEqual(nativePriceWrap)

    // React.memo comparator keeps working
    expect(areListingCardBasePropsEqual(baseProps, { ...baseProps })).toBe(true)
    expect(
      areListingCardBasePropsEqual(baseProps, { ...baseProps, pillNativeGlass: true })
    ).toBe(false)
  })
})
