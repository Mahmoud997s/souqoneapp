import React from 'react'
import {
  HOME_CATEGORIES,
  CATEGORY_ITEM_SIZE,
  CATEGORY_ITEM_WIDTH,
  CATEGORY_ITEM_HEIGHT,
  calculateCategoryItemWidth,
  calculateCategoryGridGap,
  CATEGORY_GRID_COLUMNS,
} from '../components/home/HomeCategoriesGrid'

describe('D-134 Hide Closeout Tests', () => {
  describe('Part A: Home Categories (Single Row Layout D-163j)', () => {
    it('HOME_CATEGORIES length is exactly 6 and order is unchanged', () => {
      expect(HOME_CATEGORIES).toHaveLength(6)
      const ids = HOME_CATEGORIES.map((c) => c.id)
      expect(ids).toEqual(['cars', 'services', 'parts', 'equipment', 'buses', 'browse'])
    })

    it('CATEGORY_GRID_COLUMNS is defined and tile layout matches single row 6 in one row (D-163j)', () => {
      expect(CATEGORY_GRID_COLUMNS).toBe(6)
      expect(CATEGORY_ITEM_HEIGHT).toBe(76)
      expect(CATEGORY_ITEM_WIDTH).toBeGreaterThan(0)
      expect(CATEGORY_ITEM_SIZE).toBe(CATEGORY_ITEM_WIDTH)
      expect(calculateCategoryGridGap(360)).toBe(6)
      expect(calculateCategoryGridGap(430)).toBe(6)
      expect(calculateCategoryItemWidth(360)).toBe(49)
      expect(calculateCategoryItemWidth(390)).toBe(54)
      expect(calculateCategoryItemWidth(430)).toBe(61)
    })
  })
})
