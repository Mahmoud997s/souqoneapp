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
  describe('Part A: Home Categories (Single Row Layout D-163f)', () => {
    it('HOME_CATEGORIES length is exactly 6 and order is unchanged', () => {
      expect(HOME_CATEGORIES).toHaveLength(6)
      const ids = HOME_CATEGORIES.map((c) => c.id)
      expect(ids).toEqual(['cars', 'services', 'parts', 'equipment', 'buses', 'browse'])
    })

    it('CATEGORY_GRID_COLUMNS is defined and tile size is 78x90 portrait with 12px gap (D-163h)', () => {
      expect(CATEGORY_GRID_COLUMNS).toBeDefined()
      expect(CATEGORY_ITEM_SIZE).toBe(78)
      expect(CATEGORY_ITEM_WIDTH).toBe(78)
      expect(CATEGORY_ITEM_HEIGHT).toBe(90)
      expect(calculateCategoryItemWidth(360)).toBe(78)
      expect(calculateCategoryItemWidth(430)).toBe(78)
      expect(calculateCategoryGridGap(360)).toBe(12)
      expect(calculateCategoryGridGap(430)).toBe(12)
    })
  })
})
