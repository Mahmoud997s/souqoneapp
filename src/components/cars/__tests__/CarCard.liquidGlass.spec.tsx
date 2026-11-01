import React from 'react'
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native'
import { render, act, cleanup } from '@testing-library/react-native'
import { CarCard } from '../CarCard'
import { ListingCardBase } from '../../ui/ListingCardBase'
import { CardSystem } from '../../../constants/cardSystem'
import { Colors } from '../../../constants/colors'

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

jest.mock('../../../store/authStore', () => ({
  useAuthStore: () => ({ user: { id: 'viewer-1' } }),
}))

jest.mock('../../../features/favorites/useFavoriteToggle', () => ({
  useFavoriteToggle: () => ({
    isFavorite: false,
    toggle: jest.fn(),
  }),
}))

describe('CarCard & Capsules — Liquid Glass Stage 1', () => {
  const originalOS = Platform.OS

  const sampleCarListing: any = {
    id: 'car-101',
    title: 'تويوتا لاندكروزر 2024',
    price: 28500,
    currency: 'OMR',
    listingType: 'SALE',
    condition: 'NEW',
    isPriceNegotiable: true,
    make: 'تويوتا',
    model: 'لاندكروزر',
    year: 2024,
    transmission: 'AUTOMATIC',
    mileage: 12000,
    images: ['https://example.com/car1.jpg'],
    seller: { id: 'seller-99', isVerified: true },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockIsLiquidGlassAvailable.mockReturnValue(true)
    mockIsGlassEffectAPIAvailable.mockReturnValue(true)
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'ios' })
  })

  afterEach(() => {
    cleanup()
    jest.restoreAllMocks()
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => originalOS })
  })

  it('(a) Liquid branch (iOS 26): renders Liquid Glass card surface, spec capsules, price & negotiable capsules, and floating action buttons', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockResolvedValue(false)

    const { getByTestId } = await render(
      <CarCard item={sampleCarListing} onPress={jest.fn()} maxChips={4} />
    )
    await act(async () => {})

    // 1. Card root is transparent with glass border color
    const cardRoot = getByTestId('listing-card-root')
    const rootStyle = StyleSheet.flatten(cardRoot.props.style)
    expect(rootStyle.backgroundColor).toBe('transparent')
    expect(rootStyle.borderColor).toBe(CardSystem.glass.cardBorderColor)

    // 2. Card main surface renders liquid branch
    expect(getByTestId('listing-card-surface-glass-liquid')).toBeTruthy()

    // 3. Specification capsules render liquid branch with capsule radius
    for (const key of ['model', 'year', 'trans', 'mileage']) {
      const wrap = getByTestId(`listing-card-pill-wrap-${key}`)
      const wrapStyle = StyleSheet.flatten(wrap.props.style)
      expect(wrapStyle.backgroundColor).toBe('transparent')
      expect(wrapStyle.borderRadius).toBe(CardSystem.glass.capsuleRadius)
      expect(wrapStyle.overflow).toBe('hidden')
      expect(getByTestId(`listing-card-pill-${key}-glass-liquid`)).toBeTruthy()
    }

    // 4. Footer price capsule & negotiable capsule render liquid branch
    expect(getByTestId('listing-card-price-pill-glass-liquid')).toBeTruthy()
    expect(getByTestId('listing-card-negotiable-pill-glass-liquid')).toBeTruthy()

    // 5. Floating share & favorite buttons render liquid branch with primary turquoise outline icons
    expect(getByTestId('listing-card-share-btn-glass-liquid')).toBeTruthy()
    expect(getByTestId('listing-card-favorite-btn-glass-liquid')).toBeTruthy()
    const shareIcon = getByTestId('icon-share-social-outline')
    const favIcon = getByTestId('icon-heart-outline')
    expect(shareIcon.props.color).toBe(Colors.primary)
    expect(favIcon.props.color).toBe(Colors.primary)
  })

  it('(b) Blur branch (Reduce Transparency / fallback): renders blur card surface and frosted capsule wash without nested BlurViews inside capsules', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockResolvedValue(true)

    const { getByTestId, getAllByTestId } = await render(
      <CarCard item={sampleCarListing} onPress={jest.fn()} maxChips={4} />
    )
    await act(async () => {})

    expect(getByTestId('listing-card-surface-glass-blur')).toBeTruthy()
    expect(getByTestId('listing-card-pill-model-glass-blur')).toBeTruthy()
    expect(getByTestId('listing-card-pill-year-glass-blur')).toBeTruthy()
    expect(getByTestId('listing-card-price-pill-glass-blur')).toBeTruthy()
    expect(getByTestId('listing-card-negotiable-pill-glass-blur')).toBeTruthy()

    // Only the card surface and the 2 floating image buttons use BlurView (3 total),
    // NOT the 6 inner body capsules (avoiding nested BlurView overdraw on Android)
    const blurViews = getAllByTestId('mock-blur-view')
    expect(blurViews.length).toBe(3)
  })

  it('(c) Hook deduplication: registers at most 1 reduceTransparencyChanged listener per card (not per capsule), and 0 when glassSupport prop is provided', async () => {
    const isReduceTransparencySpy = jest
      .spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled')
      .mockResolvedValue(false)
    const addListenerSpy = jest.spyOn(AccessibilityInfo, 'addEventListener')

    await render(<CarCard item={sampleCarListing} onPress={jest.fn()} maxChips={4} />)
    await act(async () => {})

    const reduceTransparencyListeners = addListenerSpy.mock.calls.filter(
      (call) => String(call[0]) === 'reduceTransparencyChanged'
    )
    // Despite 8 GlassSurface instances inside the card, useGlassSupport subscribes only ONCE
    expect(isReduceTransparencySpy).toHaveBeenCalledTimes(1)
    expect(reduceTransparencyListeners.length).toBe(1)

    isReduceTransparencySpy.mockClear()
    addListenerSpy.mockClear()

    // When glassSupport prop is passed from parent list, 0 reduceTransparency checks/subscriptions are created
    await render(
      <CarCard
        item={sampleCarListing}
        onPress={jest.fn()}
        maxChips={4}
        glassSupport={{ kind: 'blur' }}
      />
    )
    await act(async () => {})
    const reduceTransparencyListenersWithProp = addListenerSpy.mock.calls.filter(
      (call) => String(call[0]) === 'reduceTransparencyChanged'
    )
    expect(isReduceTransparencySpy).toHaveBeenCalledTimes(0)
    expect(reduceTransparencyListenersWithProp.length).toBe(0)
  })

  it('(d) Scope isolation: equipment items passed through CarCard and default ListingCardBase do NOT activate liquidGlass automatically', async () => {
    const isReduceTransparencySpy = jest
      .spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled')
      .mockResolvedValue(false)
    const addListenerSpy = jest.spyOn(AccessibilityInfo, 'addEventListener')

    const equipmentItem: any = {
      ...sampleCarListing,
      id: 'eq-1',
      listingType: 'EQUIPMENT_SALE',
      category: 'equipment',
    }

    const { getByTestId, queryByTestId } = await render(
      <CarCard item={equipmentItem} onPress={jest.fn()} />
    )

    const cardRoot = getByTestId('listing-card-root')
    const rootStyle = StyleSheet.flatten(cardRoot.props.style)
    expect(rootStyle.backgroundColor).toBe(Colors.white)
    expect(queryByTestId('listing-card-surface-glass-liquid')).toBeNull()
    expect(queryByTestId('listing-card-surface-glass-blur')).toBeNull()
    expect(isReduceTransparencySpy).toHaveBeenCalledTimes(0)
    expect(
      addListenerSpy.mock.calls.filter((call) => String(call[0]) === 'reduceTransparencyChanged')
        .length
    ).toBe(0)

    // Direct ListingCardBase without liquidGlass prop also stays standard
    const { queryByTestId: queryBase } = await render(
      <ListingCardBase
        item={sampleCarListing}
        title="إعلان عادي"
        priceLabel="5,000 ر.ع"
        onPress={jest.fn()}
      />
    )
    expect(queryBase('listing-card-surface-glass-liquid')).toBeNull()
    expect(queryBase('listing-card-surface-glass-blur')).toBeNull()
    expect(isReduceTransparencySpy).toHaveBeenCalledTimes(0)
    expect(
      addListenerSpy.mock.calls.filter((call) => String(call[0]) === 'reduceTransparencyChanged')
        .length
    ).toBe(0)
  })
})
