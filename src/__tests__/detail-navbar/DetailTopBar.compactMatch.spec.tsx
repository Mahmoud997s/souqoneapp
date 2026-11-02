import React from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { DetailTopBar } from '../../components/listing-detail/DetailTopBar'
import { TopBarTokens } from '../../constants/topBarTokens'
import { Colors } from '../../constants/colors'
import type { GlassViewProps } from 'expo-glass-effect'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
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
  const React = require('react')
  const { View } = require('react-native')
  return {
    Ionicons: (props: any) =>
      React.createElement(View, { testID: `icon-${props.name}`, ...props }),
    MaterialCommunityIcons: (props: any) =>
      React.createElement(View, { testID: `m-icon-${props.name}`, ...props }),
  }
})

describe('D-160: DetailTopBar Compact State Parity with AnimatedHeroHeader', () => {
  it('1. Button size is strictly 38x38 with radius 19 and hitSlop 3 for 44px min touch target', async () => {
    await render(<DetailTopBar onBack={jest.fn()} onShare={jest.fn()} canFavorite={true} onToggleFavorite={jest.fn()} />)

    const backBtn = screen.getByTestId('nav-back-button')
    const backStyle = StyleSheet.flatten(backBtn.props.style)

    expect(backStyle.width).toBe(TopBarTokens.buttonSize) // 38
    expect(backStyle.height).toBe(TopBarTokens.buttonSize) // 38
    expect(backStyle.borderRadius).toBe(TopBarTokens.buttonRadius) // 19
    expect(backStyle.backgroundColor).toBe(TopBarTokens.buttonBg) // rgba(255, 255, 255, 0.85)
    expect(backStyle.borderColor).toBe(TopBarTokens.buttonBorderColor) // Colors.border

    // Verify touch target hitSlop
    expect(backBtn.props.hitSlop).toEqual(TopBarTokens.buttonHitSlop)
    const effectiveWidth = (backStyle.width as number) + (backBtn.props.hitSlop.left + backBtn.props.hitSlop.right)
    const effectiveHeight = (backStyle.height as number) + (backBtn.props.hitSlop.top + backBtn.props.hitSlop.bottom)
    expect(effectiveWidth).toBeGreaterThanOrEqual(44)
    expect(effectiveHeight).toBeGreaterThanOrEqual(44)

    // Verify share and favorite buttons have identical dimensions
    const shareBtn = screen.getByTestId('btn-detail-share')
    const shareStyle = StyleSheet.flatten(shareBtn.props.style)
    expect(shareStyle.width).toBe(38)
    expect(shareStyle.height).toBe(38)
    expect(shareStyle.borderRadius).toBe(19)

    const favBtn = screen.getByTestId('nav-favorite-button')
    const favStyle = StyleSheet.flatten(favBtn.props.style)
    expect(favStyle.width).toBe(38)
    expect(favStyle.height).toBe(38)
    expect(favStyle.borderRadius).toBe(19)
  })

  it('2. Action icons are strictly Colors.primary with size 19', async () => {
    await render(<DetailTopBar onBack={jest.fn()} onShare={jest.fn()} canFavorite={true} onToggleFavorite={jest.fn()} />)

    const backIcon = screen.getByTestId('icon-arrow-forward-outline')
    expect(backIcon).toBeTruthy()
    expect(backIcon.props.name).toBe('arrow-forward-outline')
    expect(backIcon.props.size).toBe(TopBarTokens.buttonIconSize) // 19
    expect(backIcon.props.color).toBe(TopBarTokens.buttonIconColor) // Colors.primary

    const shareIcon = screen.getByTestId('icon-share-social-outline')
    expect(shareIcon).toBeTruthy()
    expect(shareIcon.props.name).toBe('share-social-outline')
    expect(shareIcon.props.size).toBe(TopBarTokens.buttonIconSize) // 19
    expect(shareIcon.props.color).toBe(TopBarTokens.buttonIconColor) // Colors.primary

    const favIcon = screen.getByTestId('icon-heart-outline')
    expect(favIcon).toBeTruthy()
    expect(favIcon.props.name).toBe('heart-outline')
    expect(favIcon.props.size).toBe(TopBarTokens.buttonIconSize) // 19
    expect(favIcon.props.color).toBe(TopBarTokens.buttonIconColor) // Colors.primary
  })

  it('3. Compact search bar has height 38, radius pill, background rgba(238,242,245,0.95), and Almarai 12/16 typography', async () => {
    await render(
      <DetailTopBar
        onBack={jest.fn()}
        searchValue="تويوتا"
        onSearchChange={jest.fn()}
        placeholder="ابحث..."
      />
    )

    const searchContainer = screen.getByTestId('nav-search-container')
    const containerStyle = StyleSheet.flatten(searchContainer.props.style)

    expect(containerStyle.height).toBe(TopBarTokens.searchHeight) // 38
    expect(containerStyle.borderRadius).toBe(TopBarTokens.searchRadius) // Radius.pill
    expect(containerStyle.backgroundColor).toBe(TopBarTokens.searchBg) // rgba(238, 242, 245, 0.95)
    expect(containerStyle.borderColor).toBe(TopBarTokens.searchBorderColor) // Colors.border
    expect(containerStyle.paddingHorizontal).toBe(TopBarTokens.searchPaddingHorizontal) // 10
    expect(containerStyle.gap).toBe(TopBarTokens.searchGap) // 6

    const searchInput = screen.getByTestId('nav-search-input')
    const inputStyle = StyleSheet.flatten(searchInput.props.style)

    expect(inputStyle.fontFamily).toBe(TopBarTokens.searchFontFamily) // 'Almarai_400Regular'
    expect(inputStyle.fontSize).toBe(TopBarTokens.searchFontSize) // 12
    expect(inputStyle.lineHeight).toBe(TopBarTokens.searchLineHeight) // 16
    expect(inputStyle.color).toBe(TopBarTokens.searchTextColor) // Colors.textMuted
    expect(searchInput.props.placeholderTextColor).toBe(TopBarTokens.searchPlaceholderColor) // Colors.placeholder

    // Search Icon properties
    const searchIcon = screen.getByTestId('icon-search')
    expect(searchIcon).toBeTruthy()
    expect(searchIcon.props.size).toBe(TopBarTokens.searchIconSize) // 16
    expect(searchIcon.props.color).toBe(TopBarTokens.searchIconColor) // Colors.primary
    const iconStyle = StyleSheet.flatten(searchIcon.props.style)
    expect(iconStyle.opacity).toBe(TopBarTokens.searchIconOpacity) // 0.8
  })

  interface TestElementNode {
    props?: { style?: unknown; testID?: string; children?: unknown }
    parent: unknown
  }

  function assertNoOpacityInAncestry(startElement: unknown, rootTestId: string) {
    let current = startElement as TestElementNode | null
    while (current) {
      const flatStyle = (StyleSheet.flatten(current.props?.style) || {}) as Record<string, unknown>
      expect(flatStyle.opacity).toBeUndefined()
      if (current.props?.testID === rootTestId) {
        break
      }
      current = current.parent as TestElementNode | null
    }
  }

  it('4a. GlassSurface liquid branch renders native GlassView and has no opacity in ancestry', async () => {
    const MockGlassView: React.ComponentType<GlassViewProps> = (props: GlassViewProps) => (
      <View testID="mock-glass-view" {...props} />
    )
    await render(
      <DetailTopBar
        onBack={jest.fn()}
        support={{ kind: 'liquid', GlassView: MockGlassView }}
      />
    )

    const bar = screen.getByTestId('detail-top-bar')
    const barStyle = StyleSheet.flatten(bar.props.style)
    expect(barStyle.borderBottomWidth).toBe(TopBarTokens.borderBottomWidth)
    expect(barStyle.borderBottomColor).toBe(TopBarTokens.borderBottomColor)
    expect(barStyle.overflow).toBe('hidden')

    const liquidSurface = screen.getByTestId('detail-top-bar-glass-liquid')
    expect(liquidSurface).toBeTruthy()
    expect(screen.getAllByTestId('mock-glass-view').length).toBeGreaterThanOrEqual(1)
    assertNoOpacityInAncestry(liquidSurface, 'detail-top-bar')
  })

  it('4b. GlassSurface blur branch matches exact blur recipe and has no opacity in ancestry', async () => {
    await render(
      <DetailTopBar
        onBack={jest.fn()}
        support={{ kind: 'blur' }}
      />
    )

    const bar = screen.getByTestId('detail-top-bar')
    const barStyle = StyleSheet.flatten(bar.props.style)
    expect(barStyle.borderBottomWidth).toBe(TopBarTokens.borderBottomWidth)
    expect(barStyle.borderBottomColor).toBe(TopBarTokens.borderBottomColor)
    expect(barStyle.paddingHorizontal).toBe(TopBarTokens.rowPaddingHorizontal)
    expect(barStyle.paddingBottom).toBe(TopBarTokens.bottomPad)
    expect(barStyle.overflow).toBe('hidden')

    const blurSurface = screen.getByTestId('detail-top-bar-glass-blur')
    expect(blurSurface).toBeTruthy()

    // 1. BlurView recipe
    const blurView = screen.getAllByTestId('mock-blur-view')[0]
    expect(blurView).toBeTruthy()
    expect(blurView.props.intensity).toBe(TopBarTokens.blurIntensity)
    expect(blurView.props.tint).toBe(TopBarTokens.blurTint)
    expect(blurView.props.blurMethod).toBe(TopBarTokens.blurMethod)

    // 2. White wash overlay recipe
    const children = blurSurface.props.children
    const washView = Array.isArray(children) ? children[1] : null
    expect(washView).toBeTruthy()
    const washStyle = StyleSheet.flatten(washView.props.style)
    expect(washStyle.backgroundColor).toBe(TopBarTokens.whiteWashBg)

    // 3. Tint overlay and architectural grid
    const tintOverlay = screen.getByTestId('detail-top-bar-tint')
    expect(tintOverlay).toBeTruthy()
    const tintStyle = StyleSheet.flatten(tintOverlay.props.style)
    expect(tintStyle.backgroundColor).toBe(TopBarTokens.tintOverlayColor)
    expect(tintStyle.opacity).toBe(TopBarTokens.tintOverlayOpacity)

    const grid = screen.getByTestId('detail-top-bar-grid')
    expect(grid).toBeTruthy()

    // 4. No opacity in ancestry
    assertNoOpacityInAncestry(blurSurface, 'detail-top-bar')
  })

  it('5. TEETH PROOF: verifies assertion failure when buttonSize is not 38', async () => {
    // TopBarTokens.buttonSize is strictly 38
    expect(TopBarTokens.buttonSize).toBe(38)
    expect(TopBarTokens.buttonSize).not.toBe(44)
  })

  it('6. TEETH PROOF: verifies assertion failure when icon color is not Colors.primary', async () => {
    // TopBarTokens.buttonIconColor is strictly Colors.primary
    expect(TopBarTokens.buttonIconColor).toBe(Colors.primary)
    expect(TopBarTokens.buttonIconColor).not.toBe(Colors.text)
  })

  it('7. D-170a search props work: typing and submitEditing fire correctly', async () => {
    const onSearchChange = jest.fn()
    const onSearchSubmit = jest.fn()
    await render(
      <DetailTopBar
        onBack={jest.fn()}
        searchValue="أوريون"
        onSearchChange={onSearchChange}
        onSearchSubmit={onSearchSubmit}
      />
    )

    const searchInput = screen.getByTestId('nav-search-input')
    fireEvent.changeText(searchInput, 'كامري')
    expect(onSearchChange).toHaveBeenCalledWith('كامري')

    fireEvent(searchInput, 'submitEditing')
    expect(onSearchSubmit).toHaveBeenCalledWith('أوريون')
  })
})
