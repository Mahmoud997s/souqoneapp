import React from 'react'
import { render, fireEvent, cleanup } from '@testing-library/react-native'
import {
  SearchInitialState,
  QUICK_CATEGORIES,
} from '../../screens/search/components/SearchInitialState'
import { CATEGORY_ICONS } from '../../constants/categoryIcons'

jest.mock('expo-image', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    Image: (props: any) =>
      React.createElement(View, { ...props, testID: props.testID || 'quick-category-image' }),
  }
})

describe('SearchInitialState — 3D Category Icons Parity (D-163c)', () => {
  afterEach(() => {
    cleanup()
  })

  it('QUICK_CATEGORIES has 3D image assets matching CATEGORY_ICONS', () => {
    expect(QUICK_CATEGORIES).toHaveLength(5)
    const expectedIds = ['cars', 'parts', 'buses', 'equipment', 'services']
    expect(QUICK_CATEGORIES.map((c) => c.id)).toEqual(expectedIds)

    QUICK_CATEGORIES.forEach((cat) => {
      expect((cat as any).image).toBeDefined()
      expect((cat as any).image).toEqual(CATEGORY_ICONS[cat.id as keyof typeof CATEGORY_ICONS])
    })
  })

  it('renders 3D images for all 5 quick categories and calls onSelectCategory on press', async () => {
    const onSelectCategory = jest.fn()

    const { getByText, getAllByTestId } = await render(
      <SearchInitialState
        searchHistory={[]}
        onSelectTerm={jest.fn()}
        onRemoveHistoryItem={jest.fn()}
        onClearHistory={jest.fn()}
        onSelectCategory={onSelectCategory}
      />
    )

    // Verify 5 images are rendered
    const images = getAllByTestId('quick-category-image')
    expect(images).toHaveLength(5)

    // Verify labels and interaction
    const carsBtn = getByText('سيارات')
    fireEvent.press(carsBtn)
    expect(onSelectCategory).toHaveBeenCalledWith('cars')

    const partsBtn = getByText('قطع غيار')
    fireEvent.press(partsBtn)
    expect(onSelectCategory).toHaveBeenCalledWith('parts')
  })
})
