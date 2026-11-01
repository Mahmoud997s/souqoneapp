import React from 'react'
import { StyleSheet, View } from 'react-native'
import { render, screen, cleanup } from '@testing-library/react-native'
import { AnimatedHeroHeader } from '../../components/ui/AnimatedHeroHeader'
import { DetailTopBar } from '../../components/listing-detail/DetailTopBar'
import { TopBarTokens } from '../../constants/topBarTokens'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
  },
}))

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light' },
}))

jest.mock('expo-blur', () => {
  const ReactLib = require('react')
  const { View: RNView } = require('react-native')
  return {
    BlurView: (props: Record<string, unknown>) =>
      ReactLib.createElement(RNView, { testID: 'mock-blur-view', ...props }),
  }
})

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

describe('D-182a2 Pre-Change Characterization: Top Bar Parity & Fixed Pill Fill', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('1. Current Pre-Change Baseline: AnimatedHeroHeader controls are transparent with nested GlassSurface', () => {
    it('(a) circular buttons on AnimatedHeroHeader currently have transparent background and contain GlassSurface', async () => {
      await render(
        <AnimatedHeroHeader
          title="ســوق ون"
          onBackPress={jest.fn()}
          onHeaderIconPress={jest.fn()}
          onChatPress={jest.fn()}
        />
      )

      const backBtn = screen.getByTestId('hero-header-back-btn')
      const notifBtn = screen.getByTestId('hero-header-notification-btn')
      const chatBtn = screen.getByTestId('hero-header-chat-btn')

      expect(StyleSheet.flatten(backBtn.props.style).backgroundColor).toBe('transparent')
      expect(StyleSheet.flatten(notifBtn.props.style).backgroundColor).toBe('transparent')
      expect(StyleSheet.flatten(chatBtn.props.style).backgroundColor).toBe('transparent')

      // Pre-change: they contain GlassSurface instances (liquid in default test env)
      expect(screen.getByTestId('hero-header-back-btn-glass-liquid')).toBeTruthy()
      expect(screen.getByTestId('hero-header-notification-btn-glass-liquid')).toBeTruthy()
      expect(screen.getByTestId('hero-header-chat-btn-glass-liquid')).toBeTruthy()
    })

    it('(b) search bars on AnimatedHeroHeader currently have transparent background and contain GlassSurface', async () => {
      await render(
        <AnimatedHeroHeader
          title="ســوق ون"
          hideBackButton
          onNavSearchPress={jest.fn()}
        />
      )

      const compactSearch = screen.getByTestId('hero-header-compact-search')
      const compactFilter = screen.getByTestId('hero-header-compact-filter-btn')
      const largeSearch = screen.getByTestId('hero-header-large-search')
      const largeFilter = screen.getByTestId('hero-header-large-filter-btn')

      expect(StyleSheet.flatten(compactSearch.props.style).backgroundColor).toBe('transparent')
      expect(StyleSheet.flatten(compactFilter.props.style).backgroundColor).toBe('transparent')
      expect(StyleSheet.flatten(largeSearch.props.style).backgroundColor).toBe('transparent')
      expect(StyleSheet.flatten(largeFilter.props.style).backgroundColor).toBe('transparent')

      // Pre-change: nested GlassSurface instances (liquid in default test env)
      expect(screen.getByTestId('hero-header-compact-search-glass-liquid')).toBeTruthy()
      expect(screen.getByTestId('hero-header-compact-filter-btn-glass-liquid')).toBeTruthy()
      expect(screen.getByTestId('hero-header-large-search-glass-liquid')).toBeTruthy()
      expect(screen.getByTestId('hero-header-large-filter-btn-glass-liquid')).toBeTruthy()
    })
  })

  describe('2. Current Pre-Change Baseline: DetailTopBar has solid background tokens and NO child GlassSurface', () => {
    it('(a) circular action buttons on DetailTopBar have TopBarTokens.buttonBg and no child GlassSurface', async () => {
      await render(
        <DetailTopBar
          onBack={jest.fn()}
          onShare={jest.fn()}
          canFavorite
          onToggleFavorite={jest.fn()}
        />
      )

      const backBtn = screen.getByTestId('nav-back-button')
      const backStyle = StyleSheet.flatten(backBtn.props.style)
      expect(backStyle.backgroundColor).toBe(TopBarTokens.buttonBg)
      expect(screen.queryByTestId('nav-back-button-glass-blur')).toBeNull()
      expect(screen.queryByTestId('nav-back-button-glass-liquid')).toBeNull()
    })

    it('(b) search container on DetailTopBar currently has TopBarTokens.searchBg (#EEF2F5) and no child GlassSurface', async () => {
      await render(
        <DetailTopBar
          onBack={jest.fn()}
          searchValue="تويوتا"
          onSearchChange={jest.fn()}
        />
      )

      const searchContainer = screen.getByTestId('nav-search-container')
      const searchStyle = StyleSheet.flatten(searchContainer.props.style)
      expect(searchStyle.backgroundColor).toBe(TopBarTokens.searchBg)
      expect(screen.queryByTestId('nav-search-container-glass-blur')).toBeNull()
      expect(screen.queryByTestId('nav-search-container-glass-liquid')).toBeNull()
    })
  })

  describe('3. Current Pre-Change Baseline: Drift between AnimatedHeroHeader and DetailTopBar', () => {
    it('proves that currently AnimatedHeroHeader pill is transparent whereas DetailTopBar pill is grey-blue (#EEF2F5)', async () => {
      const { unmount } = await render(
        <AnimatedHeroHeader
          title="ســوق ون"
          hideBackButton
          onNavSearchPress={jest.fn()}
        />
      )
      const heroCompactSearch = screen.getByTestId('hero-header-compact-search')
      const heroBg = StyleSheet.flatten(heroCompactSearch.props.style).backgroundColor
      expect(heroBg).toBe('transparent')
      unmount()

      await render(
        <DetailTopBar
          onBack={jest.fn()}
          searchValue="تويوتا"
          onSearchChange={jest.fn()}
        />
      )
      const detailSearch = screen.getByTestId('nav-search-container')
      const detailBg = StyleSheet.flatten(detailSearch.props.style).backgroundColor
      expect(detailBg).toBe(TopBarTokens.searchBg)

      // Drift verified: 'transparent' !== 'rgba(238, 242, 245, 0.95)'
      expect(heroBg).not.toBe(detailBg)
    })
  })
})
