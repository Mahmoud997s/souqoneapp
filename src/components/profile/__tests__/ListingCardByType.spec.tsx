import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { ListingCardByType, ProfileListingVertical } from '../ListingCardByType'
import { CarCard } from '../../cars/CarCard'
import { PartCard } from '../../parts/PartCard'

jest.mock('../../cars/CarCard', () => ({ CarCard: jest.fn(() => require('react').createElement(require('react-native').View, { testID: 'car-card' })) }))
jest.mock('../../buses/BusCard', () => ({ BusCard: () => require('react').createElement(require('react-native').View, { testID: 'bus-card' }) }))
jest.mock('../../cards/EquipCard', () => ({ EquipCard: () => require('react').createElement(require('react-native').View, { testID: 'equipment-card' }) }))
jest.mock('../../parts/PartCard', () => ({ PartCard: jest.fn(({ item }: { item: { raw?: { id?: string } } }) => require('react').createElement(require('react-native').View, { testID: 'part-card', accessibilityLabel: item.raw?.id })) }))
jest.mock('../../services/ServiceCard', () => ({ ServiceCard: () => require('react').createElement(require('react-native').View, { testID: 'service-card' }) }))

const sample = {
  id: 'card-1',
  title: 'Inventory card',
  images: [],
  raw: { id: 'raw-part-1', title: 'Inventory card' },
}

describe('ListingCardByType', () => {
  const cases: Array<[ProfileListingVertical, string]> = [
    ['car', 'car-card'],
    ['bus', 'bus-card'],
    ['equipment', 'equipment-card'],
    ['part', 'part-card'],
    ['service', 'service-card'],
  ]

  it.each(cases)('renders the existing %s card', async (vertical, testId) => {
    await render(<ListingCardByType vertical={vertical} item={sample} onPress={jest.fn()} />)
    expect(screen.getByTestId(testId)).toBeTruthy()
  })

  it('passes the mapped item and embedded raw payload through to PartCard', async () => {
    await render(<ListingCardByType vertical="part" item={sample} onPress={jest.fn()} />)
    expect(screen.getByLabelText('raw-part-1')).toBeTruthy()
  })

  it('keeps public cards free of action menus and adapts Listing card input once', async () => {
    await render(<ListingCardByType vertical="car" item={sample} onPress={jest.fn()} />)
    const props = jest.mocked(CarCard).mock.calls[0][0]
    expect(props.item.id).toBe(sample.id)
    expect(Object.getOwnPropertyDescriptor(props.item, 'raw')?.value).toBe(sample.raw)
    expect(props.actionMenu).toBeUndefined()
  })
})
