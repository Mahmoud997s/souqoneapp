import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { PublicProfileHero } from '../../components/profile/public-profile/PublicProfileHero'
import { PublicProfileTabs } from '../../components/profile/public-profile/PublicProfileTabs'
import { PublicProfileTopBar } from '../../components/profile/public-profile/PublicProfileTopBar'
import { PublicProfileTokens } from '../../constants/publicProfileTokens'
import { PublicProfile } from '../../types/profile.types'

const profile = {
  id: 'seller-1',
  username: 'seller-one',
  displayName: 'بائع السوق',
  isVerified: true,
  governorateRef: { nameAr: 'مسقط' },
  bio: 'منتجات مختارة بعناية',
  createdAt: '2020-04-17T00:00:00.000Z',
  _count: { listings: 4, busListings: 2, equipmentListings: 0, spareParts: 3, carServices: 1, operatorListings: 0, driverJobs: 0 },
  totalListings: 10,
} as PublicProfile

describe('PublicProfileHero', () => {
  it('renders identity, verification, location, bio, active counts, section count, and join year', async () => {
    await render(<PublicProfileHero profile={profile} support={{ kind: 'blur' }} />)

    expect(screen.getByText('بائع السوق')).toBeTruthy()
    expect(screen.getByTestId('public-profile-verified')).toBeTruthy()
    expect(screen.getByText('@seller-one')).toBeTruthy()
    expect(screen.getByText('مسقط')).toBeTruthy()
    expect(screen.getByText('منتجات مختارة بعناية')).toBeTruthy()
    expect(screen.getByTestId('public-profile-active-count').props.children).toBe('10')
    expect(screen.getByTestId('public-profile-section-count').props.children).toBe('4')
    expect(screen.getByTestId('public-profile-join-year').props.children).toBe('2020')
  })

  it('shows owner edit action or visitor contact action only when supplied', async () => {
    const onPress = jest.fn()
    await render(<PublicProfileHero profile={profile} action={{ kind: 'owner', onPress }} support={{ kind: 'blur' }} />)
    fireEvent.press(screen.getByRole('button', { name: 'تعديل ملفي الشخصي' }))
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'راسل البائع' })).toBeNull()
  })

  it('uses the explicit blur fallback wash on hero, stats, and action glass surfaces', async () => {
    await render(<PublicProfileHero profile={profile} action={{ kind: 'visitor', onPress: jest.fn() }} support={{ kind: 'blur' }} />)

    expect(StyleSheet.flatten(screen.getByTestId('public-profile-hero-surface-wash-overlay').props.style).opacity).toBe(0.58)
    expect(StyleSheet.flatten(screen.getByTestId('public-profile-stats-surface-wash-overlay').props.style).opacity).toBe(PublicProfileTokens.statsWashOpacity)
    expect(StyleSheet.flatten(screen.getByTestId('public-profile-action-surface-wash-overlay').props.style).opacity).toBe(PublicProfileTokens.actionWashOpacity)
  })
})

describe('PublicProfileTabs glass and top bar', () => {
  it('uses a wash on its fallback surface and keeps zero-count tabs visible', async () => {
    const counts = { listings: 0, busListings: 1, equipmentListings: 0, spareParts: 0, carServices: 0, operatorListings: 0, driverJobs: 0 }
    await render(<PublicProfileTabs counts={counts} selected="car" onSelect={jest.fn()} support={{ kind: 'blur' }} />)

    expect(StyleSheet.flatten(screen.getByTestId('public-profile-tabs-surface-wash-overlay').props.style).opacity).toBe(PublicProfileTokens.tabsWashOpacity)
    expect(screen.getAllByRole('tab')).toHaveLength(5)
    expect(screen.getByRole('tab', { name: 'السيارات، 0' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'الخدمات، 0' })).toBeTruthy()
  })

  it('renders the centered title, accessible back target, and fallback wash', async () => {
    const onBack = jest.fn()
    await render(<PublicProfileTopBar topInset={24} onBack={onBack} support={{ kind: 'blur' }} />)

    expect(screen.getByText('ملف البائع')).toBeTruthy()
    expect(screen.getByTestId('public-profile-top-bar-spacer')).toBeTruthy()
    expect(StyleSheet.flatten(screen.getByTestId('public-profile-top-bar').props.style).top).toBe(36)
    expect(StyleSheet.flatten(screen.getByTestId('public-profile-back').props.style).width).toBe(44)
    expect(StyleSheet.flatten(screen.getByTestId('public-profile-back').props.style).height).toBe(44)
    fireEvent.press(screen.getByRole('button', { name: 'رجوع' }))
    expect(onBack).toHaveBeenCalledTimes(1)
    expect(StyleSheet.flatten(screen.getByTestId('public-profile-top-bar-surface-wash-overlay').props.style).opacity).toBe(PublicProfileTokens.topBarWashOpacity)
  })

  it('keeps every glass surface under ancestors with fully visible opacity', async () => {
    const counts = { listings: 1, busListings: 0, equipmentListings: 0, spareParts: 0, carServices: 0, operatorListings: 0, driverJobs: 0 }
    await render(
      <>
        <PublicProfileTopBar topInset={0} onBack={jest.fn()} support={{ kind: 'blur' }} />
        <PublicProfileHero profile={profile} action={{ kind: 'visitor', onPress: jest.fn() }} support={{ kind: 'blur' }} />
        <PublicProfileTabs counts={counts} selected="car" onSelect={jest.fn()} support={{ kind: 'blur' }} />
      </>,
    )

    const surfaces = screen.getAllByTestId(/public-profile-.*-surface-glass-blur/)
    expect(surfaces.length).toBeGreaterThanOrEqual(5)
    surfaces.forEach((surface) => {
      let ancestor = surface.parent
      while (ancestor) {
        const opacity = StyleSheet.flatten(ancestor.props.style)?.opacity
        expect(opacity === undefined || opacity >= 1).toBe(true)
        ancestor = ancestor.parent
      }
    })
  })
})
