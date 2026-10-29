import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { FEATURES } from '../constants/features'
import { HOME_CATEGORIES } from '../components/home/HomeCategoriesGrid'
import { routeForNotification } from '../utils/notificationRouter'
import { getListingDetailRoute } from '../utils/navigationHelper'
import { QUICK_CATEGORIES, TRENDING_KEYWORDS } from '../screens/search/components/SearchInitialState'
import { SEARCH_CATEGORY_TABS } from '../screens/search/components/SearchCategoryTabs'
import { MY_LISTINGS_SECTIONS_CONFIG } from '../components/profile/my-listings/sections.config'
import { FAVORITES_CATEGORY_FILTERS } from '../../app/profile/favorites'
import { SearchHeaderBar } from '../screens/search/components/SearchHeaderBar'

describe('PR-A: Hide Jobs & Transport Entry Points', () => {
  it('features constants disable jobs and transport', () => {
    expect(FEATURES.JOBS_ENABLED).toBe(false)
    expect(FEATURES.TRANSPORT_ENABLED).toBe(false)
  })

  it('HOME_CATEGORIES contains only 6 active items and omits jobs and transport', () => {
    const ids = HOME_CATEGORIES.map(c => c.id)
    expect(ids).not.toContain('jobs')
    expect(ids).not.toContain('transport')
    expect(ids).toEqual(['cars', 'services', 'parts', 'equipment', 'buses', 'browse'])
  })

  it('routeForNotification routes jobs and transport to null (safe fallback)', () => {
    expect(routeForNotification({ jobId: '123' } as any)).toBeNull()
    expect(routeForNotification({ applicationId: '456' } as any)).toBeNull()
    expect(routeForNotification({ requestId: '789' } as any)).toBeNull()
    expect(routeForNotification({ bookingId: '101' } as any)).toBeNull()
    expect(routeForNotification({ entityType: 'JOB', entityId: '123' } as any)).toBeNull()
    expect(routeForNotification({ entityType: 'TRANSPORT_REQUEST', entityId: '789' } as any)).toBeNull()
  })

  it('getListingDetailRoute routes jobs to /(tabs) safely', () => {
    expect(getListingDetailRoute({ id: '123', category: 'jobs' })).toBe('/(tabs)')
    expect(getListingDetailRoute({ id: '123', category: 'job' })).toBe('/(tabs)')
  })

  it('SearchInitialState quick categories contains no jobs or transport and bus label is باصات', () => {
    const ids = QUICK_CATEGORIES.map(c => c.id)
    expect(ids).not.toContain('jobs')
    expect(ids).not.toContain('transport')
    const busItem = QUICK_CATEGORIES.find(c => c.id === 'buses')
    expect(busItem).toBeDefined()
    expect(busItem?.label).toBe('باصات')
  })

  it('SearchInitialState trending keywords contain no jobs or transport words', () => {
    for (const kw of TRENDING_KEYWORDS) {
      expect(kw).not.toContain('وظائف')
      expect(kw).not.toContain('سائقين')
      expect(kw).not.toContain('نقل بضائع')
    }
  })

  it('SEARCH_CATEGORY_TABS has no jobs or transport tabs', () => {
    const tabIds = SEARCH_CATEGORY_TABS.map(t => t.id)
    expect(tabIds).not.toContain('jobs')
    expect(tabIds).not.toContain('transport')
    expect(tabIds).toEqual(['all', 'cars', 'parts', 'buses', 'equipment', 'services'])
  })

  it('MY_LISTINGS_SECTIONS_CONFIG has no job or transport section', () => {
    const entityTypes = MY_LISTINGS_SECTIONS_CONFIG.map(s => s.entityType)
    expect(entityTypes).not.toContain('job')
    expect(entityTypes).not.toContain('transport')
  })

  it('FAVORITES_CATEGORY_FILTERS has no jobs or transport filter', () => {
    const filterIds = FAVORITES_CATEGORY_FILTERS.map(f => f.id)
    expect(filterIds).not.toContain('jobs')
    expect(filterIds).not.toContain('transport')
    expect(filterIds).toEqual(['all', 'cars', 'services', 'parts', 'buses', 'equipment'])
  })

  it('SearchHeaderBar placeholder does not contain وظائف', async () => {
    await render(
      <SearchHeaderBar
        query=""
        onChangeText={jest.fn()}
        onSubmit={jest.fn()}
        onClear={jest.fn()}
        activeFiltersCount={0}
        onOpenFilters={jest.fn()}
      />
    )
    const input = screen.getByPlaceholderText('ابحث عن سيارات، معدات، قطع غيار...')
    expect(input).toBeTruthy()
    expect(input.props.placeholder).not.toContain('وظائف')
  })
})
