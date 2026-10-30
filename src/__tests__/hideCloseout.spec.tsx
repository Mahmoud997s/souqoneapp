import React from 'react'
import {
  HOME_CATEGORIES,
  CATEGORY_ITEM_SIZE,
  calculateCategoryItemWidth,
  calculateCategoryGridGap,
  CATEGORY_GRID_COLUMNS,
} from '../components/home/HomeCategoriesGrid'

describe('D-134 Hide Closeout Tests', () => {
  describe('Part A: Home Categories Grid (3 columns x 2 rows)', () => {
    it('HOME_CATEGORIES length is exactly 6 and order is unchanged', () => {
      expect(HOME_CATEGORIES).toHaveLength(6)
      const ids = HOME_CATEGORIES.map((c) => c.id)
      expect(ids).toEqual(['cars', 'services', 'parts', 'equipment', 'buses', 'browse'])
    })

    it('CATEGORY_GRID_COLUMNS is 3 and tile size is 88x88 square with 12px gap (D-163e)', () => {
      expect(CATEGORY_GRID_COLUMNS).toBe(3)
      expect(CATEGORY_ITEM_SIZE).toBe(88)
      expect(calculateCategoryItemWidth(360)).toBe(88)
      expect(calculateCategoryItemWidth(430)).toBe(88)
      expect(calculateCategoryGridGap(360)).toBe(12)
      expect(calculateCategoryGridGap(430)).toBe(12)
    })
  })
})
