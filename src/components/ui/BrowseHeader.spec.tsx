import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { TextInput, TouchableOpacity, Text } from 'react-native'
import { BrowseHeader } from './BrowseHeader'
import { AppHeader } from './AppHeader'
import { Colors } from '../../constants/colors'

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}))

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
  },
}))

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

  test('defaults to theme="light" and passes theme="light" to AppHeader', () => {
    let renderer: any
    act(() => {
      renderer = TestRenderer.create(<BrowseHeader {...defaultProps} />)
    })

    const appHeader = renderer.root.findByType(AppHeader)
    expect(appHeader.props.theme).toBe('light')
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
    expect(input.props.placeholderTextColor).toBe(Colors.placeholder)
    expect(input.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: Colors.text }),
      ])
    )
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
  })
})
