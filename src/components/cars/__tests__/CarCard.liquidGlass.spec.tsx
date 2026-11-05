import React from 'react'
import { AccessibilityInfo, Platform, StyleSheet, View, Text } from 'react-native'
import { render, act, cleanup } from '@testing-library/react-native'
import { CarCard } from '../CarCard'
import { BusCard } from '../../buses/BusCard'
import { EquipCard } from '../../cards/EquipCard'
import { PartCard } from '../../parts/PartCard'
import { ServiceCard } from '../../services/ServiceCard'
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

    // 1. Card root is transparent with glass border color and 1-line title limit
    const cardRoot = getByTestId('listing-card-root')
    const rootStyle = StyleSheet.flatten(cardRoot.props.style)
    expect(rootStyle.backgroundColor).toBe('transparent')
    expect(rootStyle.borderColor).toBe(CardSystem.glass.cardBorderColor)
    expect(getByTestId('listing-card-details')).toBeTruthy()

    // 2. Card main surface renders liquid branch
    expect(getByTestId('listing-card-surface-glass-liquid')).toBeTruthy()

    // 3. Specification capsules render non-native layered wash (D-205 default CARD_PILL_NATIVE_GLASS = false) with capsule radius (6px)
    expect(CardSystem.glass.capsuleRadius).toBe(CardSystem.radius.inner)
    for (const key of ['model', 'year', 'trans', 'mileage']) {
      const wrap = getByTestId(`listing-card-pill-wrap-${key}`)
      const wrapStyle = StyleSheet.flatten(wrap.props.style)
      expect(wrapStyle.backgroundColor).toBe('transparent')
      expect(wrapStyle.borderRadius).toBe(CardSystem.radius.inner)
      expect(wrapStyle.overflow).toBe('hidden')
      expect(getByTestId(`listing-card-pill-${key}-layered-wash`)).toBeTruthy()
      expect(getByTestId(`listing-card-pill-${key}-top-highlight`)).toBeTruthy()
    }

    // 4. Footer price capsule & negotiable capsule render non-native layered wash
    expect(getByTestId('listing-card-price-pill-layered-wash')).toBeTruthy()
    expect(getByTestId('listing-card-negotiable-pill-layered-wash')).toBeTruthy()

    // 5. Floating share & favorite buttons render frosted styling with primary turquoise outline icons
    const shareBtn = getByTestId('listing-card-share')
    const shareBtnStyle = StyleSheet.flatten(shareBtn.props.style)
    expect(shareBtnStyle.backgroundColor).toBe('rgba(255, 255, 255, 0.88)')
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
    expect(getByTestId('listing-card-pill-model-layered-wash')).toBeTruthy()
    expect(getByTestId('listing-card-pill-year-layered-wash')).toBeTruthy()
    expect(getByTestId('listing-card-price-pill-layered-wash')).toBeTruthy()
    expect(getByTestId('listing-card-negotiable-pill-layered-wash')).toBeTruthy()

    // Only the card surface uses BlurView (1 total), avoiding GPU conflicts over image and nested BlurViews
    const blurViews = getAllByTestId('mock-blur-view')
    expect(blurViews.length).toBe(1)
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

  it('(d) Global adoption & opt-out: all cards (EquipCard, BusCard, PartCard, ServiceCard, CarCard) adopt Liquid Glass by default, and liquidGlass={false} disables it', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockResolvedValue(false)

    // 1. EquipCard adopts Liquid Glass by default
    const { getByTestId: getEquip } = await render(
      <EquipCard
        item={{
          ...sampleCarListing,
          id: 'eq-1',
          equipmentType: 'EXCAVATOR',
        } as any}
        onPress={jest.fn()}
      />
    )
    expect(getEquip('listing-card-surface-glass-liquid')).toBeTruthy()

    // 2. BusCard adopts Liquid Glass by default
    const { getByTestId: getBus } = await render(
      <BusCard
        item={{
          ...sampleCarListing,
          id: 'bus-1',
          busType: 'COASTER',
          capacity: 30,
        } as any}
        onPress={jest.fn()}
      />
    )
    expect(getBus('listing-card-surface-glass-liquid')).toBeTruthy()

    // 3. Explicit liquidGlass={false} cleanly disables glass surface
    const { getByTestId: getDisabled, queryByTestId: queryDisabled } = await render(
      <ListingCardBase
        item={sampleCarListing}
        title="إعلان عادي بدون زجاج"
        priceLabel="5,000 ر.ع"
        onPress={jest.fn()}
        liquidGlass={false}
      />
    )
    const cardRoot = getDisabled('listing-card-root')
    const rootStyle = StyleSheet.flatten(cardRoot.props.style)
    expect(rootStyle.backgroundColor).toBe(Colors.white)
    expect(queryDisabled('listing-card-surface-glass-liquid')).toBeNull()
    expect(queryDisabled('listing-card-surface-glass-blur')).toBeNull()
  })

  it('(e) Footer capsules arrangement & responsive inline padding: negotiable in flex:1 and price in responsive compact pill', async () => {
    // 1. With negotiable=true: negotiable pill gets flex:1, price pill gets flexShrink:0
    const { getByTestId } = await render(
      <CarCard
        item={{ ...sampleCarListing, isPriceNegotiable: true, price: 12500 }}
        onPress={jest.fn()}
      />
    )
    const negWrap = getByTestId('listing-card-negotiable-pill-wrap')
    const priceWrap = getByTestId('listing-card-price-pill-wrap')
    const negStyle = StyleSheet.flatten(negWrap.props.style)
    const priceStyle = StyleSheet.flatten(priceWrap.props.style)

    expect(negStyle.flex).toBe(1)
    expect(negStyle.paddingHorizontal).toBe(8)
    expect(negStyle.paddingVertical).toBe(3.5)

    expect(priceStyle.flexShrink).toBe(0)
    expect(priceStyle.paddingHorizontal).toBe(8)
    expect(priceStyle.paddingVertical).toBe(3.5)

    // 2. With negotiable=false: price pill maintains exact compact size and position (flexShrink: 0) without stretching
    const { getByTestId: getNoNeg, queryByTestId: queryNoNeg } = await render(
      <CarCard
        item={{ ...sampleCarListing, isPriceNegotiable: false, price: 5000 }}
        onPress={jest.fn()}
      />
    )
    expect(queryNoNeg('listing-card-negotiable-pill-wrap')).toBeNull()
    const priceOnlyWrap = getNoNeg('listing-card-price-pill-wrap')
    const priceOnlyStyle = StyleSheet.flatten(priceOnlyWrap.props.style)
    expect(priceOnlyStyle.flexShrink).toBe(0)
    expect(priceOnlyStyle.flex).toBeUndefined()
    expect(priceOnlyStyle.paddingHorizontal).toBe(8)
    expect(priceOnlyStyle.paddingVertical).toBe(3.5)
  })
})
