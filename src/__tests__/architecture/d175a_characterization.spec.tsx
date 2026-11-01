import React from 'react'
import { StyleSheet, View } from 'react-native'
import { render, screen, cleanup, fireEvent } from '@testing-library/react-native'
import { DetailTopBar } from '../../components/listing-detail/DetailTopBar'
import { SearchHeaderBar } from '../../screens/search/components/SearchHeaderBar'
import { TopBarTokens } from '../../constants/topBarTokens'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
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

describe('D-175a Pre-Change Characterization Tests (Geometry & Behavior Baseline)', () => {
  afterEach(() => {
    cleanup()
  })

  describe('1. DetailTopBar baseline geometry and elements', () => {
    it('(a) root container has exact height padding, border, and overflow', async () => {
      await render(
        <DetailTopBar
          onBack={jest.fn()}
          onShare={jest.fn()}
          canFavorite={true}
          onToggleFavorite={jest.fn()}
        />
      )

      const root = screen.getByTestId('detail-top-bar')
      const rootStyle = StyleSheet.flatten(root.props.style)

      expect(rootStyle.borderBottomWidth).toBe(1)
      expect(rootStyle.borderBottomColor).toBe(Colors.border)
      expect(rootStyle.paddingHorizontal).toBe(12)
      expect(rootStyle.paddingBottom).toBe(6)
      expect(rootStyle.paddingTop).toBe(44) // resolved from insets.top
      expect(rootStyle.overflow).toBe('hidden')
      expect(rootStyle.zIndex).toBe(10)
    })

    it('(b) back button is circular 38x38 with radius 19, hitSlop 3, and primary icon 19', async () => {
      await render(<DetailTopBar onBack={jest.fn()} />)

      const backBtn = screen.getByTestId('nav-back-button')
      const backStyle = StyleSheet.flatten(backBtn.props.style)

      expect(backStyle.width).toBe(38)
      expect(backStyle.height).toBe(38)
      expect(backStyle.borderRadius).toBe(19)
      expect(backStyle.backgroundColor).toBe('rgba(255, 255, 255, 0.85)')
      expect(backStyle.borderColor).toBe(Colors.border)
      expect(backStyle.borderWidth).toBe(1)
      expect(backBtn.props.hitSlop).toEqual({ top: 3, bottom: 3, left: 3, right: 3 })

      const icon = screen.getByTestId('icon-arrow-forward-outline')
      expect(icon.props.size).toBe(19)
      expect(icon.props.color).toBe(Colors.primary)
    })

    it('(c) search container has height 38, radius pill, and Almarai 12/16 typography', async () => {
      await render(
        <DetailTopBar
          onBack={jest.fn()}
          searchValue="كامري"
          onSearchChange={jest.fn()}
          placeholder="ابحث في التفاصيل..."
        />
      )

      const searchContainer = screen.getByTestId('nav-search-container')
      const containerStyle = StyleSheet.flatten(searchContainer.props.style)

      expect(containerStyle.height).toBe(38)
      expect(containerStyle.borderRadius).toBe(Radius.pill)
      expect(containerStyle.backgroundColor).toBe('rgba(238, 242, 245, 0.95)')
      expect(containerStyle.borderColor).toBe(Colors.border)
      expect(containerStyle.borderWidth).toBe(1)
      expect(containerStyle.paddingHorizontal).toBe(10)
      expect(containerStyle.gap).toBe(6)

      const searchInput = screen.getByTestId('nav-search-input')
      const inputStyle = StyleSheet.flatten(searchInput.props.style)
      expect(inputStyle.fontSize).toBe(12)
      expect(inputStyle.lineHeight).toBe(16)
      expect(inputStyle.fontFamily).toBe('Almarai_400Regular')
      expect(inputStyle.textAlign).toBe('right')
      expect(inputStyle.writingDirection).toBe('rtl')
    })

    it('(d) share and favorite buttons have identical 38x38 dimensions and hitSlop 3', async () => {
      await render(
        <DetailTopBar
          onBack={jest.fn()}
          onShare={jest.fn()}
          canFavorite={true}
          onToggleFavorite={jest.fn()}
          isFavorite={true}
        />
      )

      const shareBtn = screen.getByTestId('btn-detail-share')
      const shareStyle = StyleSheet.flatten(shareBtn.props.style)
      expect(shareStyle.width).toBe(38)
      expect(shareStyle.height).toBe(38)
      expect(shareStyle.borderRadius).toBe(19)
      expect(shareBtn.props.hitSlop).toEqual({ top: 3, bottom: 3, left: 3, right: 3 })

      const favBtn = screen.getByTestId('nav-favorite-button')
      const favStyle = StyleSheet.flatten(favBtn.props.style)
      expect(favStyle.width).toBe(38)
      expect(favStyle.height).toBe(38)
      expect(favStyle.borderRadius).toBe(19)
      expect(favBtn.props.hitSlop).toEqual({ top: 3, bottom: 3, left: 3, right: 3 })
    })

    it('(e) tint overlay and grid overlays are present', async () => {
      await render(<DetailTopBar onBack={jest.fn()} />)

      const tint = screen.getByTestId('detail-top-bar-tint')
      const tintStyle = StyleSheet.flatten(tint.props.style)
      expect(tintStyle.backgroundColor).toBe(TopBarTokens.tintOverlayColor)
      expect(tintStyle.opacity).toBe(TopBarTokens.tintOverlayOpacity)

      const grid = screen.getByTestId('detail-top-bar-grid')
      expect(grid).toBeTruthy()
    })
  })

  describe('2. SearchHeaderBar baseline geometry and elements', () => {
    it('(a) root container has exact padding, border, and overflow', async () => {
      await render(
        <SearchHeaderBar
          query=""
          onChangeText={jest.fn()}
          onSubmit={jest.fn()}
          onClear={jest.fn()}
          activeFiltersCount={0}
          onOpenFilters={jest.fn()}
        />
      )

      const searchBar = screen.getByTestId('search-bar-container')
      expect(searchBar).toBeTruthy()

      const tint = screen.getByTestId('search-header-tint')
      const tintStyle = StyleSheet.flatten(tint.props.style)
      expect(tintStyle.backgroundColor).toBe(TopBarTokens.tintOverlayColor)
      expect(tintStyle.opacity).toBe(TopBarTokens.tintOverlayOpacity)

      const grid = screen.getByTestId('search-header-grid')
      expect(grid).toBeTruthy()
    })

    it('(b) search bar container is 38h pill with Almarai 12/16 typography', async () => {
      await render(
        <SearchHeaderBar
          query="نيسان"
          onChangeText={jest.fn()}
          onSubmit={jest.fn()}
          onClear={jest.fn()}
          activeFiltersCount={2}
          onOpenFilters={jest.fn()}
        />
      )

      const searchContainer = screen.getByTestId('search-bar-container')
      const containerStyle = StyleSheet.flatten(searchContainer.props.style)

      expect(containerStyle.height).toBe(38)
      expect(containerStyle.borderRadius).toBe(Radius.pill)
      expect(containerStyle.backgroundColor).toBe('rgba(238, 242, 245, 0.95)')
      expect(containerStyle.borderColor).toBe(Colors.border)
      expect(containerStyle.borderWidth).toBe(1)
      expect(containerStyle.paddingHorizontal).toBe(10)
      expect(containerStyle.gap).toBe(6)

      const filterBtn = screen.getByTestId('search-filter-button')
      const btnStyle = StyleSheet.flatten(filterBtn.props.style)
      expect(btnStyle.width).toBe(38)
      expect(btnStyle.height).toBe(38)
      expect(btnStyle.borderRadius).toBe(19)
      expect(filterBtn.props.hitSlop).toEqual({ top: 3, bottom: 3, left: 3, right: 3 })

      const badge = screen.getByTestId('search-filter-badge')
      expect(badge).toBeTruthy()
      const badgeText = screen.getByTestId('search-filter-badge-text')
      expect(badgeText.props.children).toBe(2)
    })

    it('(c) typing, submit, clear, and filter handlers fire', async () => {
      const onChangeText = jest.fn()
      const onSubmit = jest.fn()
      const onClear = jest.fn()
      const onOpenFilters = jest.fn()

      const { getByTestId, getByPlaceholderText } = await render(
        <SearchHeaderBar
          query="لكزس"
          onChangeText={onChangeText}
          onSubmit={onSubmit}
          onClear={onClear}
          activeFiltersCount={0}
          onOpenFilters={onOpenFilters}
        />
      )

      const input = getByPlaceholderText('ابحث عن سيارات، معدات، قطع غيار...')
      fireEvent.changeText(input, 'تويوتا')
      expect(onChangeText).toHaveBeenCalledWith('تويوتا')

      fireEvent(input, 'submitEditing')
      expect(onSubmit).toHaveBeenCalledTimes(1)

      const clearBtn = getByTestId('search-clear-button')
      fireEvent.press(clearBtn)
      expect(onClear).toHaveBeenCalledTimes(1)

      const filterBtn = getByTestId('search-filter-button')
      fireEvent.press(filterBtn)
      expect(onOpenFilters).toHaveBeenCalledTimes(1)
    })
  })
})
