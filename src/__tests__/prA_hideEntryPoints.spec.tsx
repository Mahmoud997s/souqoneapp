import { FEATURES } from '../constants/features'
import { HOME_CATEGORIES } from '../components/home/HomeCategoriesGrid'
import { routeForNotification } from '../utils/notificationRouter'
import { getListingDetailRoute } from '../utils/navigationHelper'

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
})
