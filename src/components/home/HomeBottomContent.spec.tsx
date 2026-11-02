import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'
import { Dimensions } from 'react-native'
import { CATEGORY_ICONS } from '../../constants/categoryIcons'
import { HomeAddListingBanner } from './HomeAddListingBanner'
import { HomeHowItWorks } from './HomeHowItWorks'
import { HOME_LISTING_CATEGORIES, getHomeHowItWorksWidth } from './homeBottomContent'

describe('Home bottom content', () => {
  it('sizes the centered how-it-works block to 80% of the viewport', async () => {
    expect(getHomeHowItWorksWidth(400)).toBe(320)
    expect(getHomeHowItWorksWidth(375)).toBe(300)
    const { getByTestId } = await render(<HomeHowItWorks />)
    const blockStyle = getByTestId('home-how-it-works').props.style
    expect(blockStyle[0].alignSelf).toBe('center')
    expect(blockStyle[1].width).toBe(getHomeHowItWorksWidth())
  })

  it('shows the five expected 3D category images and labels', async () => {
    const { getByTestId, getByText, queryByTestId } = await render(<HomeAddListingBanner onPress={jest.fn()} />)

    expect(HOME_LISTING_CATEGORIES).toHaveLength(5)
    for (const category of HOME_LISTING_CATEGORIES) {
      expect(getByTestId(`home-add-listing-banner-image-${category.id}`).props.source).toEqual([CATEGORY_ICONS[category.id]])
      expect(getByText(category.title)).toBeTruthy()
    }
    expect(
      queryByTestId('home-add-listing-banner-glass-blur') ||
        queryByTestId('home-add-listing-banner-glass-liquid')
    ).toBeTruthy()
  })

  it('routes the primary action through the existing Home add handler', async () => {
    const onPress = jest.fn()
    const { getByRole } = await render(<HomeAddListingBanner onPress={onPress} />)

    fireEvent.press(getByRole('button', { name: 'أضف إعلانك' }))

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('keeps the 80% width calculation tied to the current screen width', () => {
    expect(getHomeHowItWorksWidth()).toBe(Math.round(Dimensions.get('window').width * 0.8))
  })
})
