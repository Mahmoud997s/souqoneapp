import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { PublicProfileTabs } from '../../components/profile/public-profile/PublicProfileTabs'
import { PublicProfileCounts } from '../../types/profile.types'

const counts: PublicProfileCounts = {
  listings: 0,
  busListings: 2,
  equipmentListings: 0,
  operatorListings: 9,
  spareParts: 0,
  carServices: 3,
  jobs: 4,
}

describe('PublicProfileTabs', () => {
  it('shows all five tabs and their counts including zero', async () => {
    await render(<PublicProfileTabs counts={counts} selected="car" onSelect={jest.fn()} />)
    expect(screen.getAllByRole('tab')).toHaveLength(5)
    expect(screen.getByRole('tab', { name: 'السيارات، 0' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'الحافلات، 2' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'المعدات، 0' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'قطع الغيار، 0' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'الخدمات، 3' })).toBeTruthy()
  })

  it('lets every tab be selected and exposes selected state', async () => {
    const onSelect = jest.fn()
    await render(<PublicProfileTabs counts={counts} selected="car" onSelect={onSelect} />)
    fireEvent.press(screen.getByRole('tab', { name: 'الحافلات، 2' }))
    expect(onSelect).toHaveBeenCalledWith('bus')
    expect(screen.getByRole('tab', { name: 'السيارات، 0' }).props.accessibilityState.selected).toBe(true)
  })
})
