import React from 'react'
import { StyleSheet, View } from 'react-native'
import { render, cleanup } from '@testing-library/react-native'
import { GlassSurface } from '../../components/navigation/glassSupport'
import { VerifiedBadge } from '../../components/ui/VerifiedBadge'
import { SearchCategoryTabs } from '../../screens/search/components/SearchCategoryTabs'
import { Colors } from '../../constants/colors'
import { BottomBarTokens } from '../../constants/bottomBarTokens'
import { ListingCardBase } from '../../components/ui/ListingCardBase'

// Mock expo-blur
jest.mock('expo-blur', () => {
  const ReactLib = require('react')
  const { View: RNView } = require('react-native')
  return {
    BlurView: (props: Record<string, unknown>) =>
      ReactLib.createElement(RNView, { testID: 'mock-blur-view', ...props }),
  }
})

// Mock expo-glass-effect
const MockGlassView = (props: Record<string, unknown>) =>
  React.createElement(View, { testID: 'mock-glass-view', ...props })

jest.mock('expo-glass-effect', () => ({
  GlassView: MockGlassView,
  GlassContainer: MockGlassView,
  isLiquidGlassAvailable: () => true,
  isGlassEffectAPIAvailable: () => true,
}))

// Mock vector icons
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

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  router: { push: jest.fn() },
}))

// Mock stores
jest.mock('../../store/authStore', () => ({
  useAuthStore: () => ({ user: { id: 'test-user' } }),
}))
jest.mock('../../features/favorites/useFavoriteToggle', () => ({
  useFavoriteToggle: () => ({ isFavorite: false, toggle: jest.fn() }),
}))

describe('D-174a Characterization Tests (Pre-Change Baseline)', () => {
  afterEach(() => {
    cleanup()
  })

  describe('1. GlassSurface baseline styles and element trees', () => {
    it('(a) variant="surface" on blur branch renders blur wrapper, BlurView and white wash overlay', async () => {
      const { getByTestId } = await render(
        <GlassSurface
          testID="test-surface"
          variant="surface"
          support={{ kind: 'blur' }}
        />
      )

      const root = getByTestId('test-surface-glass-blur')
      const rootStyle = StyleSheet.flatten(root.props.style)
      expect(rootStyle.borderWidth).toBe(BottomBarTokens.borderWidth) // 1
      expect(rootStyle.borderColor).toBe('rgba(255, 255, 255, 0.60)')
      expect(rootStyle.overflow).toBe('hidden')

      const blurView = getByTestId('mock-blur-view')
      expect(blurView.props.intensity).toBe(BottomBarTokens.blurIntensity)
      expect(blurView.props.tint).toBe('light')
      expect(blurView.props.blurMethod).toBe('dimezisBlurView')

      // White wash overlay child
      const children = root.props.children
      const washView = Array.isArray(children) ? children[1] : null
      expect(washView).toBeTruthy()
      const washStyle = StyleSheet.flatten(washView.props.style)
      expect(washStyle.backgroundColor).toBe('rgba(255, 255, 255, 0.78)')
    })

    it('(b) variant="surface" on liquid branch renders liquid wrapper and native GlassView', async () => {
      const { getByTestId } = await render(
        <GlassSurface
          testID="test-surface"
          variant="surface"
          support={{ kind: 'liquid', GlassView: MockGlassView as any }}
        />
      )

      const root = getByTestId('test-surface-glass-liquid')
      const rootStyle = StyleSheet.flatten(root.props.style)
      expect(rootStyle.borderWidth).toBe(BottomBarTokens.borderWidth)
      expect(rootStyle.borderColor).toBe('rgba(255, 255, 255, 0.60)')
      expect(rootStyle.overflow).toBe('hidden')

      const glassView = getByTestId('mock-glass-view')
      expect(glassView.props.glassEffectStyle).toBe('regular')
    })

    it('(c) variant="capsule" on blur branch renders capsule blur wrapper and capsule wash overlay', async () => {
      const { getByTestId } = await render(
        <GlassSurface
          testID="test-capsule"
          variant="capsule"
          support={{ kind: 'blur' }}
        />
      )

      const root = getByTestId('test-capsule-glass-blur')
      const rootStyle = StyleSheet.flatten(root.props.style)
      expect(rootStyle.borderWidth).toBe(1)
      expect(rootStyle.borderColor).toBe('rgba(229, 231, 235, 0.90)')
      expect(rootStyle.overflow).toBe('hidden')

      const child = root.props.children
      const washStyle = StyleSheet.flatten(child.props.style)
      expect(washStyle.backgroundColor).toBe('rgba(238, 242, 245, 0.82)')
    })

    it('(d) variant="capsule" on liquid branch renders capsule liquid wrapper, GlassView, and default capsule overlay', async () => {
      const { getByTestId } = await render(
        <GlassSurface
          testID="test-capsule"
          variant="capsule"
          support={{ kind: 'liquid', GlassView: MockGlassView as any }}
        />
      )

      const root = getByTestId('test-capsule-glass-liquid')
      const rootStyle = StyleSheet.flatten(root.props.style)
      expect(rootStyle.borderWidth).toBe(1)
      expect(rootStyle.borderColor).toBe('rgba(229, 231, 235, 0.90)')
      expect(rootStyle.overflow).toBe('hidden')

      const glassView = getByTestId('mock-glass-view')
      expect(glassView.props.glassEffectStyle).toBe('regular')

      const children = root.props.children
      const overlayView = Array.isArray(children) ? children[1] : null
      expect(overlayView).toBeTruthy()
      const overlayStyle = StyleSheet.flatten(overlayView.props.style)
      expect(overlayStyle.backgroundColor).toBe('rgba(238, 242, 245, 0.55)')
    })
  })

  describe('2. ListingCardBase action buttons characterization', () => {
    it('floating action button renders actionBtnGlass with exact backgroundColor and borderColor', async () => {
      const sampleItem = {
        id: 'test-item-1',
        title: 'إعلان تجريبي',
        price: 1500,
        currency: 'OMR',
        images: ['https://example.com/test.jpg'],
      }

      const { getByTestId } = await render(
        <ListingCardBase
          item={sampleItem}
          onPress={jest.fn()}
          showShareButton={true}
        />
      )

      const shareBtn = getByTestId('listing-card-share')
      const shareStyle = StyleSheet.flatten(shareBtn.props.style)
      expect(shareStyle.backgroundColor).toBe('rgba(255, 255, 255, 0.88)')
      expect(shareStyle.borderColor).toBe('rgba(255, 255, 255, 0.95)')
      expect(shareStyle.borderWidth).toBe(1)
    })
  })

  describe('3. VerifiedBadge container and checkStroke characterization', () => {
    it('variant="dark" renders containerDark with exact dark border color', async () => {
      const { getByTestId } = await render(
        <VerifiedBadge showText text="موثق" variant="dark" testID="test-verified-badge" />
      )

      const badge = getByTestId('test-verified-badge')
      const containerStyle = StyleSheet.flatten(badge.props.style)
      expect(containerStyle.backgroundColor).toBe(Colors.primaryDark)
      expect(containerStyle.borderColor).toBe('rgba(0, 156, 181, 0.35)')
      expect(containerStyle.borderWidth).toBe(1)
      expect(containerStyle.borderRadius).toBe(4)
    })

    it('SVG fallback renders svg element', async () => {
      const { getByTestId } = await render(
        <VerifiedBadge size={14} use3d={false} testID="test-verified-svg" />
      )

      const svg = getByTestId('verified-badge-svg')
      expect(svg).toBeTruthy()
      expect(svg.props.width).toBe(14)
      expect(svg.props.height).toBe(14)
    })
  })

  describe('4. SearchCategoryTabs track and active tab characterization', () => {
    it('renders segmented track with exact background #f1f5f9 and active tab with #ffffff', async () => {
      const { getByTestId } = await render(
        <SearchCategoryTabs selectedCategory="all" onSelectCategory={jest.fn()} />
      )

      // Active tab (all)
      const activeTab = getByTestId('category-tab-all')
      const activeStyle = StyleSheet.flatten(activeTab.props.style)
      expect(activeStyle.backgroundColor).toBe('#ffffff')
      expect(activeStyle.borderRadius).toBe(6)

      // Inactive tab (cars)
      const inactiveTab = getByTestId('category-tab-cars')
      const inactiveStyle = StyleSheet.flatten(inactiveTab.props.style)
      expect(inactiveStyle.backgroundColor).toBe('transparent')
      expect(inactiveStyle.borderRadius).toBe(6)
    })
  })
})
