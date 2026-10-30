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

    it('CATEGORY_GRID_COLUMNS is 3 and tile size is 80x80 square (D-163a)', () => {
      expect(CATEGORY_GRID_COLUMNS).toBe(3)
      expect(CATEGORY_ITEM_SIZE).toBe(80)
      expect(calculateCategoryItemWidth(360)).toBe(80)
      expect(calculateCategoryItemWidth(430)).toBe(80)
    })

    it('calculateCategoryGridGap calculates equal edge and between gaps correctly for 360dp and 430dp screens (D-163a)', () => {
      // 360dp screen: (360 - 3 * 80) / 4 = 120 / 4 = 30
      expect(calculateCategoryGridGap(360)).toBe(30)

      // 430dp screen: (430 - 3 * 80) / 4 = 190 / 4 = 47.5 -> 47
      expect(calculateCategoryGridGap(430)).toBe(47)
    })
  })
})
