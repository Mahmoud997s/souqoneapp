import React from 'react'
import { View, Text, StyleSheet, I18nManager } from 'react-native'
import { render, act } from '@testing-library/react-native'
import { Gesture } from 'react-native-gesture-handler'
import {
  HorizontalScrollCard,
  HORIZONTAL_WINDOW_BUFFER,
  shouldMountHorizontalSlot,
} from '../../components/ui/HorizontalScrollCard'
import { Spacing } from '../../constants/spacing'
import { physicalRightStyle } from '../../utils/physicalDirection'

describe('D-203 Home + Landing Scroll Safe Fixes', () => {
  describe('Item 1: HorizontalScrollCard windowing while preserving slot geometry', () => {
    it('exports HORIZONTAL_WINDOW_BUFFER = 2 and mounts only activeIndex +- 2 slots', () => {
      expect(HORIZONTAL_WINDOW_BUFFER).toBe(2)

      // At activeIndex = 0: visible cards are 0 and 1; card 2 is off-screen buffer; cards 3..9 are unmounted
      expect(shouldMountHorizontalSlot(0, 0)).toBe(true)
      expect(shouldMountHorizontalSlot(1, 0)).toBe(true)
      expect(shouldMountHorizontalSlot(2, 0)).toBe(true)
      expect(shouldMountHorizontalSlot(3, 0)).toBe(false)
      expect(shouldMountHorizontalSlot(8, 0)).toBe(false)

      // At activeIndex = 4: slots 2..6 are mounted; 0, 1, 7, 8 are unmounted
      expect(shouldMountHorizontalSlot(1, 4)).toBe(false)
      expect(shouldMountHorizontalSlot(2, 4)).toBe(true)
      expect(shouldMountHorizontalSlot(4, 4)).toBe(true)
      expect(shouldMountHorizontalSlot(6, 4)).toBe(true)
      expect(shouldMountHorizontalSlot(7, 4)).toBe(false)
    })

    it('mounts only 3 card children initially for a 10-item carousel while keeping all 11 HorizontalCardSlot placeholders at exact RTL offsets', async () => {
      let capturedOnStart: (() => void) | undefined
      let capturedOnUpdate: ((e: { translationX: number }) => void) | undefined
      let capturedOnEnd: ((e: { translationX: number; velocityX: number }) => void) | undefined

      const origPan = Gesture.Pan.bind(Gesture)
      const panSpy = jest.spyOn(Gesture, 'Pan').mockImplementation(() => {
        const pan = origPan()
        const origOnStart = pan.onStart.bind(pan)
        const origOnUpdate = pan.onUpdate.bind(pan)
        const origOnEnd = pan.onEnd.bind(pan)
        pan.onStart = (cb: never) => {
          capturedOnStart = cb
          return origOnStart(cb)
        }
        pan.onUpdate = (cb: never) => {
          capturedOnUpdate = cb
          return origOnUpdate(cb)
        }
        pan.onEnd = (cb: never) => {
          capturedOnEnd = cb
          return origOnEnd(cb)
        }
        return pan
      })

      const items = Array.from({ length: 10 }, (_, i) => ({
        id: `item-${i}`,
        title: `Card ${i}`,
      }))
      const cardWidth = 312
      const gap = 6
      const step = cardWidth + gap

      const renderItemSpy = jest.fn(({ item }: { item: { id: string; title: string } }) => (
        <View testID={`mounted-card-${item.id}`}>
          <Text>{item.title}</Text>
        </View>
      ))

      const origRTL = I18nManager.isRTL
      I18nManager.isRTL = true

      const { getByTestId, queryByTestId, getByText } = await render(
        <HorizontalScrollCard
          data={items}
          cardWidth={cardWidth}
          cardHeight={250}
          gap={gap}
          paddingEnd={Spacing.space5}
          paging={false}
          depthEffect={true}
          showDots={true}
          keyExtractor={(item) => item.id}
          onSeeAll={jest.fn()}
          renderItem={renderItemSpy}
        />
      )

      // Only indices 0, 1, 2 mount heavy card children at activeIndex = 0
      expect(queryByTestId('mounted-card-item-0')).toBeTruthy()
      expect(queryByTestId('mounted-card-item-1')).toBeTruthy()
      expect(queryByTestId('mounted-card-item-2')).toBeTruthy()
      expect(queryByTestId('mounted-card-item-3')).toBeNull()
      expect(queryByTestId('mounted-card-item-9')).toBeNull()
      expect(renderItemSpy).toHaveBeenCalledTimes(3)

      // All 10 item slots + 1 SeeAll slot remain mounted with exact width & physical offset
      for (let i = 0; i < 10; i++) {
        const slotStyle = StyleSheet.flatten(getByTestId(`card-slot-${i}`).props.style)
        expect(slotStyle.width).toBe(cardWidth)
        expect(slotStyle).toEqual(
          expect.objectContaining(physicalRightStyle(Spacing.space5 + i * step))
        )
        expect(getByTestId(`card-slot-${i}-depth`)).toBeTruthy()
      }
      const seeAllSlotStyle = StyleSheet.flatten(getByTestId('card-slot-see-all').props.style)
      expect(seeAllSlotStyle.width).toBe(cardWidth)
      expect(seeAllSlotStyle).toEqual(
        expect.objectContaining(physicalRightStyle(Spacing.space5 + 10 * step))
      )

      // Drag to index 2: slots 0..4 should be mounted, slots 5..9 unmounted
      await act(async () => {
        capturedOnStart?.()
        capturedOnUpdate?.({ translationX: step * 2 })
      })

      expect(queryByTestId('mounted-card-item-3')).toBeTruthy()
      expect(queryByTestId('mounted-card-item-4')).toBeTruthy()
      expect(queryByTestId('mounted-card-item-5')).toBeNull()

      // Drag to index 8 (near end): SeeAll card at index 10 mounts before entering viewport,
      // while early cards (0..5) unmount their children
      await act(async () => {
        capturedOnUpdate?.({ translationX: step * 8 })
      })

      expect(queryByTestId('mounted-card-item-0')).toBeNull()
      expect(queryByTestId('mounted-card-item-5')).toBeNull()
      expect(queryByTestId('mounted-card-item-6')).toBeTruthy()
      expect(queryByTestId('mounted-card-item-8')).toBeTruthy()
      expect(queryByTestId('mounted-card-item-9')).toBeTruthy()
      expect(getByText('عرض الكل')).toBeTruthy()

      I18nManager.isRTL = origRTL
      panSpy.mockRestore()
    })
  })
})
