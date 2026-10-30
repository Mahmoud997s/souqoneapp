import React from 'react'
import {
  HOME_CATEGORIES,
  calculateCategoryItemWidth,
  CATEGORY_GRID_COLUMNS,
  CATEGORY_GRID_GAP,
  CATEGORY_GRID_PADDING_H,
} from '../components/home/HomeCategoriesGrid'

describe('D-134 Hide Closeout Tests', () => {
  describe('Part A: Home Categories Grid (3 columns x 2 rows)', () => {
    it('HOME_CATEGORIES length is exactly 6 and order is unchanged', () => {
      expect(HOME_CATEGORIES).toHaveLength(6)
      const ids = HOME_CATEGORIES.map((c) => c.id)
      expect(ids).toEqual(['cars', 'services', 'parts', 'equipment', 'buses', 'browse'])
    })

    it('CATEGORY_GRID_COLUMNS is 3 with 8px gap and 32px horizontal padding', () => {
      expect(CATEGORY_GRID_COLUMNS).toBe(3)
      expect(CATEGORY_GRID_GAP).toBe(8)
      expect(CATEGORY_GRID_PADDING_H).toBe(32)
    })

    it('calculateCategoryItemWidth calculates correctly for 360dp and 430dp screens', () => {
      // 360dp screen: (360 - 32 - (8 * 2)) / 3 = (360 - 32 - 16) / 3 = 312 / 3 = 104
      expect(calculateCategoryItemWidth(360)).toBe(104)

      // 430dp screen: (430 - 32 - (8 * 2)) / 3 = (430 - 32 - 16) / 3 = 382 / 3 = 127.33 -> 127
      expect(calculateCategoryItemWidth(430)).toBe(127)
    })
  })
})
