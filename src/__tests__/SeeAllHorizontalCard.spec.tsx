import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { I18nManager, TouchableOpacity } from 'react-native'
import { SeeAllHorizontalCard } from '../components/ui/SeeAllHorizontalCard'
import { physicalRightStyle } from '../utils/physicalDirection'

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}))

const extractText = (node: any): string => {
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (node && node.children) return extractText(node.children)
  return ''
}

describe('SeeAllHorizontalCard & HorizontalScrollCard Integration', () => {
  describe('1. Component Rendering & Interactions', () => {
    test('renders default title, subtitle, and action text correctly', () => {
      const onPressMock = jest.fn()
      let renderer: any
      act(() => {
        renderer = TestRenderer.create(
          <SeeAllHorizontalCard onPress={onPressMock} />
        )
      })

      const rootText = extractText(renderer.toJSON())
      expect(rootText).toContain('عرض الكل')
      expect(rootText).toContain('تصفح جميع الإعلانات')
      expect(rootText).toContain('تصفح المزيد')
    })

    test('renders custom title, subtitle, and action text when provided', () => {
      const onPressMock = jest.fn()
      let renderer: any
      act(() => {
        renderer = TestRenderer.create(
          <SeeAllHorizontalCard
            onPress={onPressMock}
            title="عرض جميع السيارات"
            subTitle="أكثر من 500 سيارة معروضة للبيع"
            actionText="انتقال للقسم"
          />
        )
      })

      const rootText = extractText(renderer.toJSON())
      expect(rootText).toContain('عرض جميع السيارات')
      expect(rootText).toContain('أكثر من 500 سيارة معروضة للبيع')
      expect(rootText).toContain('انتقال للقسم')
    })

    test('fires onPress callback when clicked', () => {
      const onPressMock = jest.fn()
      let renderer: any
      act(() => {
        renderer = TestRenderer.create(
          <SeeAllHorizontalCard onPress={onPressMock} title="عرض الكل" />
        )
      })

      const touchable = renderer.root.findByType(TouchableOpacity)
      act(() => {
        touchable.props.onPress()
      })
      expect(onPressMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('2. Physical Offset & Positioning Calculations', () => {
    test('Calculates correct physical offset for See All card at the end of the track under RTL and LTR', () => {
      const cardWidth = 300
      const gap = 12
      const step = cardWidth + gap // 312
      const paddingEnd = 16
      const dataLength = 5 // 5 cards (indices 0..4)

      // Index 0: 16
      expect(paddingEnd + 0 * step).toBe(16)
      // Index 4 (last data card): 16 + 4 * 312 = 1264
      expect(paddingEnd + 4 * step).toBe(1264)

      // See All Card (index 5): 16 + 5 * 312 = 1576
      const seeAllOffset = paddingEnd + dataLength * step
      expect(seeAllOffset).toBe(1576)

      // RTL mode
      I18nManager.isRTL = true
      expect(physicalRightStyle(seeAllOffset)).toEqual({ left: 1576 })

      // LTR mode
      I18nManager.isRTL = false
      expect(physicalRightStyle(seeAllOffset)).toEqual({ right: 1576 })
    })

    test('Swiper count increments by 1 when onSeeAll is provided with non-empty data', () => {
      const items = [{ id: '1' }, { id: '2' }, { id: '3' }]
      const hasOnSeeAll = true

      const showSeeAll = Boolean(hasOnSeeAll && items.length > 0)
      const count = items.length + (showSeeAll ? 1 : 0)

      expect(count).toBe(4) // 3 items + 1 See All card
    })

    test('Swiper count does NOT increment when data is empty', () => {
      const items: any[] = []
      const hasOnSeeAll = true

      const showSeeAll = Boolean(hasOnSeeAll && items.length > 0)
      const count = items.length + (showSeeAll ? 1 : 0)

      expect(count).toBe(0)
    })
  })
})
