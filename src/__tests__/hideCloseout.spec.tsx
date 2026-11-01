import React from 'react'
import {
  HOME_CATEGORIES,
  CATEGORY_ITEM_SIZE,
  CATEGORY_ITEM_WIDTH,
  CATEGORY_ITEM_HEIGHT,
  calculateCategoryItemWidth,
  calculateCategoryItemHeight,
  calculateCategoryGridGap,
  CATEGORY_GRID_COLUMNS,
} from '../components/home/HomeCategoriesGrid'

describe('D-134 Hide Closeout Tests', () => {
  describe('Part A: Home Categories (4 Columns Square Layout D-172a)', () => {
    it('HOME_CATEGORIES length is exactly 7 and order is unchanged', () => {
      expect(HOME_CATEGORIES).toHaveLength(7)
      const ids = HOME_CATEGORIES.map((c) => c.id)
      expect(ids).toEqual(['cars', 'services', 'parts', 'equipment', 'buses', 'operators', 'browse'])
    })

    it('CATEGORY_GRID_COLUMNS is defined and tile layout matches 4 columns with geometric proportion (D-172a)', () => {
      expect(CATEGORY_GRID_COLUMNS).toBe(4)
      expect(CATEGORY_ITEM_HEIGHT).toBe(calculateCategoryItemHeight())
      expect(CATEGORY_ITEM_WIDTH).toBeGreaterThan(0)
      expect(CATEGORY_ITEM_SIZE).toBe(CATEGORY_ITEM_WIDTH)
      expect(calculateCategoryGridGap(360)).toBe(6)
      expect(calculateCategoryGridGap(430)).toBe(6)
      expect(calculateCategoryItemWidth(360)).toBe(77)
      expect(calculateCategoryItemWidth(390)).toBe(85)
      expect(calculateCategoryItemWidth(430)).toBe(95)
    })
  })
})
