import { MY_LISTINGS_SECTIONS_CONFIG } from '../sections.config'
import { MAIN_CATEGORY_TABS } from '../../MyListingsVisualFilters'

describe('My Listings — Operators Exclusion (D-154)', () => {
  it('MY_LISTINGS_SECTIONS_CONFIG does not contain operator / operators', () => {
    const entityTypes = MY_LISTINGS_SECTIONS_CONFIG.map((s) => s.entityType)
    const categoryIds = MY_LISTINGS_SECTIONS_CONFIG.map((s) => s.categoryId)

    expect(entityTypes).not.toContain('operator')
    expect(categoryIds).not.toContain('operators')

    // Exactly 5 sections: car, bus, equipment, part, service
    expect(MY_LISTINGS_SECTIONS_CONFIG).toHaveLength(5)
    expect(entityTypes).toEqual(['car', 'bus', 'equipment', 'part', 'service'])
  })

  it('MAIN_CATEGORY_TABS does not contain operators category tab', () => {
    const categoryIds = MAIN_CATEGORY_TABS.map((c) => c.id)

    expect(categoryIds).not.toContain('operators')
    expect(categoryIds).toEqual(['all', 'cars', 'buses', 'equipment', 'parts', 'services'])
  })
})
