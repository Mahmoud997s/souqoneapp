import React from 'react'
import { render, fireEvent, cleanup } from '@testing-library/react-native'
import {
  SearchInitialState,
  QUICK_CATEGORIES,
} from '../../screens/search/components/SearchInitialState'
import { Colors } from '../../constants/colors'

jest.mock('@expo/vector-icons', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    Ionicons: (props: any) =>
      React.createElement(View, { ...props, testID: props.testID || `ionicons-${props.name}` }),
    MaterialCommunityIcons: (props: any) =>
      React.createElement(View, { ...props, testID: props.testID || `m-icon-${props.name}` }),
  }
})

describe('SearchInitialState — Vector Category Icons Parity (D-196)', () => {
  afterEach(() => {
    cleanup()
  })

  it('QUICK_CATEGORIES has vector icon names and no 3D image assets', () => {
    expect(QUICK_CATEGORIES).toHaveLength(5)
    const expectedIds = ['cars', 'parts', 'buses', 'equipment', 'services']
    expect(QUICK_CATEGORIES.map((c) => c.id)).toEqual(expectedIds)

    QUICK_CATEGORIES.forEach((cat) => {
      expect(cat.icon).toBeDefined()
      expect(typeof cat.icon).toBe('string')
      expect((cat as any).image).toBeUndefined()
    })
  })

  it('renders vector icons for all 5 quick categories and calls onSelectCategory on press', async () => {
    const onSelectCategory = jest.fn()

    const { getByText, getByTestId, queryAllByTestId } = await render(
      <SearchInitialState
        searchHistory={[]}
        onSelectTerm={jest.fn()}
        onRemoveHistoryItem={jest.fn()}
        onClearHistory={jest.fn()}
        onSelectCategory={onSelectCategory}
      />
    )

    // Verify vector icons are rendered for all 5 categories
    for (const cat of QUICK_CATEGORIES) {
      const icon = getByTestId(`quick-category-icon-${cat.id}`)
      expect(icon).toBeTruthy()
      expect(icon.props.name).toBe(cat.icon)
      expect(icon.props.size).toBe(22)
      expect(icon.props.color).toBe(Colors.primary)
    }

    // Verify NO 3D images are rendered
    expect(queryAllByTestId('quick-category-image')).toHaveLength(0)

    // Verify labels and interaction
    const carsBtn = getByText('سيارات')
    fireEvent.press(carsBtn)
    expect(onSelectCategory).toHaveBeenCalledWith('cars')

    const partsBtn = getByText('قطع غيار')
    fireEvent.press(partsBtn)
    expect(onSelectCategory).toHaveBeenCalledWith('parts')
  })
})
