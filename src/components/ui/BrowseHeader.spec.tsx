import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BrowseHeader } from './BrowseHeader'
import { AppHeader } from './AppHeader'
import { TopBarTokens } from '../../constants/topBarTokens'

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}))

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
  },
}))
jest.mock('./TopBarGlassSurface', () => ({ TopBarGlassSurface: 'TopBarGlassSurface' }))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

describe('BrowseHeader (Light Glassmorphic Default & Theme Support)', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: jest.fn(),
    searchPlaceholder: 'ابحث في سوق ون...',
    activeFiltersCount: 0,
    onFilterPress: jest.fn(),
    onSubmitSearch: jest.fn(),
  }

  test('opts into the liquid glass header while preserving the light theme', () => {
    let renderer: any
    act(() => {
      renderer = TestRenderer.create(<BrowseHeader {...defaultProps} />)
    })

    const appHeader = renderer.root.findByType(AppHeader)
    expect(appHeader.props.theme).toBe('light')
    expect(appHeader.props.glassBackground).toBe(true)
  })

  test('renders light search input styling and placeholder', () => {
    let renderer: any
    act(() => {
      renderer = TestRenderer.create(
        <BrowseHeader {...defaultProps} searchQuery="تويوتا" />
      )
    })

    const input = renderer.root.findByType(TextInput)
    expect(input.props.value).toBe('تويوتا')
    expect(input.props.placeholderTextColor).toBe(TopBarTokens.searchPlaceholderColor)
    expect(StyleSheet.flatten(input.props.style)).toMatchObject({ color: TopBarTokens.searchTextColor })
  })

  test('renders filter badge with count when activeFiltersCount > 0', () => {
    let renderer: any
    act(() => {
      renderer = TestRenderer.create(
        <BrowseHeader {...defaultProps} activeFiltersCount={3} />
      )
    })

    const texts = renderer.root.findAllByType(Text)
    const badgeText = texts.find((t: any) => t.props.children === 3)
    expect(badgeText).toBeDefined()
  })

  test('submits the current search through onSubmitSearch', () => {
    const onSubmitSearch = jest.fn()
    let renderer: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(
        <BrowseHeader {...defaultProps} searchQuery="تويوتا" onSubmitSearch={onSubmitSearch} />
      )
    })

    const input = renderer!.root.findByType(TextInput)
    act(() => {
      input.props.onSubmitEditing()
    })

    expect(onSubmitSearch).toHaveBeenCalledTimes(1)
  })

  test('clears a non-empty search through the clear control', () => {
    const onSearchChange = jest.fn()
    let renderer: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(
        <BrowseHeader {...defaultProps} searchQuery="تويوتا" onSearchChange={onSearchChange} />
      )
    })

    const clearButton = renderer!.root
      .findAllByType(TouchableOpacity)
      .find((button) => button.findAllByType(Ionicons).some((icon) => icon.props.name === 'close-circle'))
    expect(clearButton).toBeDefined()
    act(() => clearButton!.props.onPress())

    expect(onSearchChange).toHaveBeenCalledWith('')
  })

  test('exposes stable IDs and RTL input props for browse controls', () => {
    let renderer: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(
        <BrowseHeader {...defaultProps} searchQuery="تويوتا" />
      )
    })

    expect(renderer!.root.findByProps({ testID: 'browse-header-back' })).toBeDefined()
    expect(renderer!.root.findByProps({ testID: 'browse-header-filter' })).toBeDefined()
    const input = renderer!.root.findByProps({ testID: 'browse-header-search-input' })
    expect(input.props).toMatchObject({ textAlign: 'right', writingDirection: 'rtl' })
    expect(StyleSheet.flatten(input.props.style)).toMatchObject({
      textAlign: 'right',
      writingDirection: 'rtl',
    })
    expect(renderer!.root.findByProps({ testID: 'browse-header-search-clear' })).toBeDefined()
  })

  test('triggers onFilterPress when filter icon button is clicked', () => {
    const onFilterMock = jest.fn()
    let renderer: any
    act(() => {
      renderer = TestRenderer.create(
        <BrowseHeader {...defaultProps} onFilterPress={onFilterMock} />
      )
    })

    const touchables = renderer.root.findAllByType(TouchableOpacity)
    const filterBtn = touchables.find((t: any) => t.props.onPress === onFilterMock)
    expect(filterBtn).toBeDefined()

    act(() => {
      filterBtn.props.onPress()
    })
    expect(onFilterMock).toHaveBeenCalledTimes(1)
  })

  test('supports theme="dark" when explicitly requested', () => {
    let renderer: any
    act(() => {
      renderer = TestRenderer.create(
        <BrowseHeader {...defaultProps} theme="dark" />
      )
    })

    const appHeader = renderer.root.findByType(AppHeader)
    expect(appHeader.props.theme).toBe('dark')
    expect(appHeader.props.glassBackground).toBe(true)
  })
})
