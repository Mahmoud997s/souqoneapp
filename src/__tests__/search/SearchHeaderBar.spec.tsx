import React from 'react'
import { StyleSheet } from 'react-native'
import { render, fireEvent, cleanup } from '@testing-library/react-native'
import { SearchHeaderBar } from '../../screens/search/components/SearchHeaderBar'
import { TopBarTokens } from '../../constants/topBarTokens'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

jest.mock('expo-blur', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    BlurView: (props: any) => React.createElement(View, props),
  }
})

describe('SearchHeaderBar — TopBarTokens & Glassmorphism Parity (D-163b)', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders glassmorphic layers with TopBarTokens matching Home compact bar', async () => {
    const { getByTestId } = await render(
      <SearchHeaderBar
        query=""
        onChangeText={jest.fn()}
        onSubmit={jest.fn()}
        onClear={jest.fn()}
        activeFiltersCount={0}
        onOpenFilters={jest.fn()}
      />
    )

    // 1. BlurView
    const blur = getByTestId('search-header-blur')
    expect(blur).toBeTruthy()
    expect(blur.props.intensity).toBe(TopBarTokens.blurIntensity)
    expect(blur.props.tint).toBe(TopBarTokens.blurTint)

    // 2. Whitewash overlay
    const whitewash = getByTestId('search-header-whitewash')
    const whitewashStyle = StyleSheet.flatten(whitewash.props.style)
    expect(whitewashStyle.backgroundColor).toBe(TopBarTokens.whiteWashBg)

    // 3. Tint overlay
    const tint = getByTestId('search-header-tint')
    const tintStyle = StyleSheet.flatten(tint.props.style)
    expect(tintStyle.backgroundColor).toBe(TopBarTokens.tintOverlayColor)
    expect(tintStyle.opacity).toBe(TopBarTokens.tintOverlayOpacity)

    // 4. Architectural Grid pattern
    const grid = getByTestId('search-header-grid')
    expect(grid).toBeTruthy()
  })

  it('uses 38h pill search bar and 38x38 circular filter button with 44px min touch target', async () => {
    const { getByTestId, getByPlaceholderText } = await render(
      <SearchHeaderBar
        query="تويوتا"
        onChangeText={jest.fn()}
        onSubmit={jest.fn()}
        onClear={jest.fn()}
        activeFiltersCount={3}
        onOpenFilters={jest.fn()}
      />
    )

    // Search bar container: 38h, pill radius, matching tokens
    const searchContainer = getByTestId('search-bar-container')
    const containerStyle = StyleSheet.flatten(searchContainer.props.style)
    expect(containerStyle.height).toBe(TopBarTokens.searchHeight)
    expect(containerStyle.borderRadius).toBe(TopBarTokens.searchRadius)
    expect(containerStyle.backgroundColor).toBe(TopBarTokens.searchBg)

    // TextInput: 12/16 Almarai typography
    const input = getByPlaceholderText('ابحث عن سيارات، معدات، قطع غيار...')
    const inputStyle = StyleSheet.flatten(input.props.style)
    expect(inputStyle.fontSize).toBe(TopBarTokens.searchFontSize)
    expect(inputStyle.lineHeight).toBe(TopBarTokens.searchLineHeight)
    expect(inputStyle.fontFamily).toBe(TopBarTokens.searchFontFamily)

    // Filter button: 38x38 circular with radius 19 and hitSlop 3
    const filterBtn = getByTestId('search-filter-button')
    const btnStyle = StyleSheet.flatten(filterBtn.props.style)
    expect(btnStyle.width).toBe(TopBarTokens.buttonSize)
    expect(btnStyle.height).toBe(TopBarTokens.buttonSize)
    expect(btnStyle.borderRadius).toBe(TopBarTokens.buttonRadius)
    expect(filterBtn.props.hitSlop).toEqual(TopBarTokens.buttonHitSlop)

    // Filter badge with active count
    const badge = getByTestId('search-filter-badge')
    expect(badge).toBeTruthy()
    const badgeText = getByTestId('search-filter-badge-text')
    expect(badgeText.props.children).toBe(3)
  })

  it('preserves real search input behavior, submit, clear, and filter handlers', async () => {
    const onChangeText = jest.fn()
    const onSubmit = jest.fn()
    const onClear = jest.fn()
    const onOpenFilters = jest.fn()

    const { getByPlaceholderText, getByTestId } = await render(
      <SearchHeaderBar
        query="نيسان"
        onChangeText={onChangeText}
        onSubmit={onSubmit}
        onClear={onClear}
        activeFiltersCount={0}
        onOpenFilters={onOpenFilters}
      />
    )

    const input = getByPlaceholderText('ابحث عن سيارات، معدات، قطع غيار...')
    fireEvent.changeText(input, 'لكزس')
    expect(onChangeText).toHaveBeenCalledWith('لكزس')

    fireEvent(input, 'submitEditing')
    expect(onSubmit).toHaveBeenCalled()

    const clearBtn = getByTestId('search-clear-button')
    fireEvent.press(clearBtn)
    expect(onClear).toHaveBeenCalled()

    const filterBtn = getByTestId('search-filter-button')
    fireEvent.press(filterBtn)
    expect(onOpenFilters).toHaveBeenCalled()
  })
})
