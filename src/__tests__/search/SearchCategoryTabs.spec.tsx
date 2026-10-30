import React from 'react'
import { StyleSheet } from 'react-native'
import { render, fireEvent, cleanup } from '@testing-library/react-native'
import {
  SearchCategoryTabs,
  CATEGORIES,
} from '../../screens/search/components/SearchCategoryTabs'
import { Colors } from '../../constants/colors'

describe('SearchCategoryTabs — MyListings VisualFilters Parity (D-163d)', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders all 6 category tabs in preserved order', () => {
    expect(CATEGORIES).toHaveLength(6)
    expect(CATEGORIES.map((c) => c.id)).toEqual([
      'all',
      'cars',
      'parts',
      'buses',
      'equipment',
      'services',
    ])
  })

  it('matches the segmented tab styling of MyListingsVisualFilters / VisualFiltersBase', async () => {
    const { getByTestId } = await render(
      <SearchCategoryTabs
        selectedCategory="cars"
        onSelectCategory={jest.fn()}
      />
    )

    // Active tab (cars): white card background with subtle shadow, primary color text/icon, radius 6
    const activeTab = getByTestId('category-tab-cars')
    const activeStyle = StyleSheet.flatten(activeTab.props.style)
    expect(activeStyle.borderRadius).toBe(6)
    expect(activeStyle.backgroundColor).toBe('#ffffff')

    const activeText = getByTestId('category-tab-text-cars')
    const activeTextStyle = StyleSheet.flatten(activeText.props.style)
    expect(activeTextStyle.color).toBe(Colors.primary)
    expect(activeTextStyle.fontFamily).toBe('Almarai_800ExtraBold')

    // Inactive tab (parts): transparent background, textMuted color
    const inactiveTab = getByTestId('category-tab-parts')
    const inactiveStyle = StyleSheet.flatten(inactiveTab.props.style)
    expect(inactiveStyle.borderRadius).toBe(6)
    expect(inactiveStyle.backgroundColor).toBe('transparent')

    const inactiveText = getByTestId('category-tab-text-parts')
    const inactiveTextStyle = StyleSheet.flatten(inactiveText.props.style)
    expect(inactiveTextStyle.color).toBe(Colors.textMuted)
  })

  it('calls onSelectCategory when a tab is pressed', async () => {
    const onSelectCategory = jest.fn()
    const { getByTestId } = await render(
      <SearchCategoryTabs
        selectedCategory="all"
        onSelectCategory={onSelectCategory}
      />
    )

    const busesTab = getByTestId('category-tab-buses')
    fireEvent.press(busesTab)
    expect(onSelectCategory).toHaveBeenCalledWith('buses')
  })
})
