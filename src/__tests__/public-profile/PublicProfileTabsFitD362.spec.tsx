import React from 'react'
import { StyleSheet } from 'react-native'
import { render, fireEvent } from '@testing-library/react-native'
import { PublicProfileTabs } from '../../components/profile/public-profile/PublicProfileTabs'
import { PublicProfileCounts } from '../../types/profile.types'
import { Colors } from '../../constants/colors'

const counts: PublicProfileCounts = {
  listings: 5,
  busListings: 2,
  equipmentListings: 1,
  operatorListings: 0,
  spareParts: 3,
  carServices: 4,
  driverJobs: 0,
}

describe('D-362: PublicProfileTabs equal-width 5 tabs, no horizontal scroll, lower height', () => {
  it('renders all 5 tabs in a non-scrolling View row with flex: 1, stacked label+count, and lower height', async () => {
    const onSelect = jest.fn()
    const { getByTestId, getAllByRole, getByRole, getByText, toJSON } = await render(
      <PublicProfileTabs counts={counts} selected="car" onSelect={onSelect} />
    )

    // No ScrollView
    expect(JSON.stringify(toJSON())).not.toContain('RCTScrollView')

    // Track padding 3 + GlassSurface intact
    const trackStyle = StyleSheet.flatten(getByTestId('public-profile-tabs').props.style)
    expect(trackStyle.padding).toBe(3)
    expect(getByTestId('public-profile-tabs-surface-glass-liquid')).toBeTruthy()

    // Row container
    const rowStyle = StyleSheet.flatten(getByTestId('public-profile-tabs-row').props.style)
    expect(rowStyle.flexDirection).toBe('row')

    // All 5 tabs equal width flex:1, minWidth:0, stacked column, lower height (<= 36)
    const tabs = getAllByRole('tab')
    expect(tabs).toHaveLength(5)
    for (const tab of tabs) {
      const style = StyleSheet.flatten(tab.props.style)
      expect(style.flex).toBe(1)
      expect(style.minWidth).toBe(0)
      expect(style.flexDirection).toBe('column')
      expect(style.minHeight).toBeLessThanOrEqual(36)
    }

    // Label props
    const partsLabel = getByText('قطع الغيار')
    const labelStyle = StyleSheet.flatten(partsLabel.props.style)
    expect(labelStyle.fontSize).toBe(11)
    expect(partsLabel.props.numberOfLines).toBe(1)
    expect(partsLabel.props.adjustsFontSizeToFit).toBe(true)

    // Selected state & a11y preserved
    const selectedTab = getByRole('tab', { name: 'السيارات، 5' })
    expect(StyleSheet.flatten(selectedTab.props.style).backgroundColor).toBe(Colors.primary)
    fireEvent.press(getByRole('tab', { name: 'الخدمات، 4' }))
    expect(onSelect).toHaveBeenCalledWith('service')
  })
})
