import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'
import { HomeAddListingBanner } from './HomeAddListingBanner'
import { HOME_BOTTOM_TOKENS, HOME_LISTING_CATEGORIES } from './homeBottomContent'
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

describe('Home bottom content (D-196)', () => {
  it('shows the five expected vector category icons and labels with wrapping enabled', async () => {
    const { getByTestId, getByText, queryByTestId } = await render(
      <HomeAddListingBanner onPress={jest.fn()} />
    )

    expect(HOME_LISTING_CATEGORIES).toHaveLength(5)
    for (const category of HOME_LISTING_CATEGORIES) {
      const icon = getByTestId(`home-add-listing-banner-icon-${category.id}`)
      expect(icon).toBeTruthy()
      expect(icon.props.name).toBe(category.icon)
      expect(icon.props.size).toBe(HOME_BOTTOM_TOKENS.categoryIconSize)
      expect(icon.props.color).toBe(Colors.primary)

      const label = getByText(category.title)
      expect(label).toBeTruthy()
      // Category labels must allow wrapping (>= 2 lines) so they do not truncate on narrow screens / larger text
      expect(label.props.numberOfLines).toBeGreaterThanOrEqual(2)
    }
    expect(
      queryByTestId('home-add-listing-banner-glass-blur') ||
        queryByTestId('home-add-listing-banner-glass-liquid')
    ).toBeTruthy()
  })

  it('renders formal Arabic title and subtitle on the listing banner', async () => {
    const { getByTestId } = await render(<HomeAddListingBanner onPress={jest.fn()} />)

    const titleElement = getByTestId('home-add-listing-banner-title')
    expect(titleElement.props.children).toBe('هل لديك ما تريد بيعه أو تأجيره؟')
    expect(titleElement.props.children).not.toContain('عندك حاجة')
  })

  it('routes the primary action through the existing Home add handler', async () => {
    const onPress = jest.fn()
    const { getByRole } = await render(<HomeAddListingBanner onPress={onPress} />)

    fireEvent.press(getByRole('button', { name: 'أضف إعلانك' }))

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('has categoryLabelLines set to at least 2 in HOME_BOTTOM_TOKENS', () => {
    expect(HOME_BOTTOM_TOKENS.categoryLabelLines).toBeGreaterThanOrEqual(2)
  })
})
