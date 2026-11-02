import React from 'react'
import { render, fireEvent, act } from '@testing-library/react-native'
import fs from 'fs'
import path from 'path'
import {
  GlassCategoriesGrid,
  clampCategoryScrollOffset,
  buildCategoryScrollDecayConfig,
  type GlassCategoryTabItem,
} from '../../components/ui/GlassCategoriesGrid'

describe('D-182a9 — Category Grid Swiper No Bounce & No Rubber-Band Stretch', () => {
  const maxScroll = 498 // 9 tabs * 88 + 8 * 8 + 32 - 390

  describe('1. Source & Behavioral Teeth: No withSpring and No 0.25 Rubber-Band Stretch', () => {
    it('removes withSpring and 0.25 rubber-band stretch from GlassCategoriesGrid.tsx while preserving cancelAnimation, activeOffsetX, failOffsetY, and withDecay', () => {
      const sourcePath = path.resolve(
        __dirname,
        '../../components/ui/GlassCategoriesGrid.tsx'
      )
      const source = fs.readFileSync(sourcePath, 'utf-8')

      // Must NOT use withSpring or the 0.25 rubber-band factor:
      expect(source).not.toMatch(/\bwithSpring\b/)
      expect(source).not.toMatch(/\*\s*0\.25/)

      // Must keep cancelAnimation, gesture thresholds, and use withDecay:
      expect(source).toMatch(/\bcancelAnimation\s*\(\s*translateX\s*\)/)
      expect(source).toMatch(/\.activeOffsetX\s*\(\s*\[\s*-10\s*,\s*10\s*\]\s*\)/)
      expect(source).toMatch(/\.failOffsetY\s*\(\s*\[\s*-15\s*,\s*15\s*\]\s*\)/)
      expect(source).toMatch(/\bwithDecay\s*\(/)
    })

    it('clamps translateX strictly to [0, maxScroll] while dragging past either end (no rubber-band stretch) for both RTL (+1) and LTR (-1) multipliers', () => {
      // RTL multiplier = +1
      // Dragging before 0 (e.g. startX = 0, translationX = -200 -> rawX = -200 -> clamped to 0, NOT -50)
      expect(clampCategoryScrollOffset(0, -200, 1, maxScroll)).toBe(0)
      expect(clampCategoryScrollOffset(50, -200, 1, maxScroll)).toBe(0)

      // Dragging within [0, maxScroll]
      expect(clampCategoryScrollOffset(0, 180, 1, maxScroll)).toBe(180)
      expect(clampCategoryScrollOffset(100, 150, 1, maxScroll)).toBe(250)

      // Dragging past maxScroll (e.g. startX = 400, translationX = +300 -> rawX = 700 -> clamped to 498, NOT 498 + 202*0.25)
      expect(clampCategoryScrollOffset(400, 300, 1, maxScroll)).toBe(maxScroll)
      expect(clampCategoryScrollOffset(maxScroll, 120, 1, maxScroll)).toBe(
        maxScroll
      )

      // LTR multiplier = -1
      // Dragging before 0 (startX = 0, translationX = +200 -> rawX = -200 -> clamped to 0)
      expect(clampCategoryScrollOffset(0, 200, -1, maxScroll)).toBe(0)
      // Dragging within [0, maxScroll] (startX = 0, translationX = -180 -> rawX = +180)
      expect(clampCategoryScrollOffset(0, -180, -1, maxScroll)).toBe(180)
      // Dragging past maxScroll (startX = 400, translationX = -300 -> rawX = 700 -> clamped to 498)
      expect(clampCategoryScrollOffset(400, -300, -1, maxScroll)).toBe(
        maxScroll
      )

      // When maxScroll <= 0 (content fits container), offset is always 0
      expect(clampCategoryScrollOffset(0, 150, 1, 0)).toBe(0)
      expect(clampCategoryScrollOffset(0, -150, -1, -20)).toBe(0)
    })
  })

  describe('2. Decay Config Unit Tests (Clamp [0, maxScroll] & RTL Multipliers 1 and -1)', () => {
    it('builds non-bouncy withDecay config with exact clamp [0, maxScroll] and directional velocity for multiplier 1 and -1', () => {
      // RTL multiplier = 1
      const rtlForward = buildCategoryScrollDecayConfig(850, 1, maxScroll)
      expect(rtlForward).toEqual({
        velocity: 850,
        clamp: [0, 498],
      })

      const rtlBackward = buildCategoryScrollDecayConfig(-620, 1, maxScroll)
      expect(rtlBackward).toEqual({
        velocity: -620,
        clamp: [0, 498],
      })

      // LTR multiplier = -1
      const ltrForward = buildCategoryScrollDecayConfig(-850, -1, maxScroll)
      expect(ltrForward).toEqual({
        velocity: 850,
        clamp: [0, 498],
      })

      const ltrBackward = buildCategoryScrollDecayConfig(620, -1, maxScroll)
      expect(ltrBackward).toEqual({
        velocity: -620,
        clamp: [0, 498],
      })

      // Negative maxScroll safely clamps to [0, 0]
      expect(buildCategoryScrollDecayConfig(500, 1, -10)).toEqual({
        velocity: 500,
        clamp: [0, 0],
      })
    })

    it('preserves scrollable track rendering and item tap behaviour (onPress)', async () => {
      const onPress0 = jest.fn()
      const items: GlassCategoryTabItem[] = Array.from({ length: 9 }, (_, i) => ({
        id: `item-${i}`,
        label: `قسم ${i}`,
        icon: 'wrench',
        iconType: 'material',
        onPress: i === 0 ? onPress0 : jest.fn(),
      }))

      const { getByTestId } = await render(
        <GlassCategoriesGrid items={items} scrollable />
      )

      await act(async () => {
        fireEvent.press(getByTestId('category-tile-item-0'))
      })
      expect(onPress0).toHaveBeenCalledTimes(1)
    })
  })
})
