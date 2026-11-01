import React from 'react'
import { StyleSheet, View } from 'react-native'
import { render, fireEvent, cleanup } from '@testing-library/react-native'
import { SearchHeaderBar } from '../../screens/search/components/SearchHeaderBar'
import { TopBarTokens } from '../../constants/topBarTokens'
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

describe('SearchHeaderBar — TopBarTokens & Glassmorphism Parity (D-163b / D-175a)', () => {
  afterEach(() => {
    cleanup()
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

  it('renders liquid branch GlassView and has no opacity in ancestry', async () => {
    const MockGlassView: React.ComponentType<GlassViewProps> = (props: GlassViewProps) => (
      <View testID="search-mock-glass-view" {...props} />
    )
    const { getByTestId } = await render(
      <SearchHeaderBar
        query=""
        onChangeText={jest.fn()}
        onSubmit={jest.fn()}
        onClear={jest.fn()}
        activeFiltersCount={0}
        onOpenFilters={jest.fn()}
        support={{ kind: 'liquid', GlassView: MockGlassView }}
      />
    )

    const liquidSurface = getByTestId('search-header-glass-liquid')
    expect(liquidSurface).toBeTruthy()
    expect(getByTestId('search-mock-glass-view')).toBeTruthy()
    assertNoOpacityInAncestry(liquidSurface, 'search-header')
  })

  it('renders blur branch matching exact TopBarTokens recipe and has no opacity in ancestry', async () => {
    const { getByTestId } = await render(
      <SearchHeaderBar
        query=""
        onChangeText={jest.fn()}
        onSubmit={jest.fn()}
        onClear={jest.fn()}
        activeFiltersCount={0}
        onOpenFilters={jest.fn()}
        support={{ kind: 'blur' }}
      />
    )

    const blurSurface = getByTestId('search-header-glass-blur')
    expect(blurSurface).toBeTruthy()

    // 1. BlurView recipe
    const blur = getByTestId('mock-blur-view')
    expect(blur).toBeTruthy()
    expect(blur.props.intensity).toBe(TopBarTokens.blurIntensity)
    expect(blur.props.tint).toBe(TopBarTokens.blurTint)
    expect(blur.props.blurMethod).toBe(TopBarTokens.blurMethod)

    // 2. Whitewash overlay recipe
    const children = blurSurface.props.children
    const washView = Array.isArray(children) ? children[1] : null
    expect(washView).toBeTruthy()
    const washStyle = StyleSheet.flatten(washView.props.style)
    expect(washStyle.backgroundColor).toBe(TopBarTokens.whiteWashBg)

    // 3. Tint overlay and grid
    const tint = getByTestId('search-header-tint')
    const tintStyle = StyleSheet.flatten(tint.props.style)
    expect(tintStyle.backgroundColor).toBe(TopBarTokens.tintOverlayColor)
    expect(tintStyle.opacity).toBe(TopBarTokens.tintOverlayOpacity)

    const grid = getByTestId('search-header-grid')
    expect(grid).toBeTruthy()

    // 4. No opacity in ancestry
    assertNoOpacityInAncestry(blurSurface, 'search-header')
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
