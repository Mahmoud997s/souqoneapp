import React from 'react'
import { View, Text, StyleSheet, I18nManager, AccessibilityInfo } from 'react-native'
import { render, act, fireEvent } from '@testing-library/react-native'
import { Gesture } from 'react-native-gesture-handler'
import {
  HorizontalScrollCard,
  HORIZONTAL_WINDOW_BUFFER,
  shouldMountHorizontalSlot,
} from '../../components/ui/HorizontalScrollCard'
import { CardImageSwiper } from '../../components/ui/CardImageSwiper'
import { Spacing } from '../../constants/spacing'
import { physicalRightStyle } from '../../utils/physicalDirection'
import {
  CategorySection,
  HomeCarCard,
  HomeServiceCard,
  HomePartCard,
  HomeBusCard,
  HomeEquipCard,
} from '../../../app/(tabs)/index'
import { CarHorizontalList } from '../../components/cars/CarHorizontalList'
import { BusHorizontalList } from '../../components/buses/landing/BusHorizontalList'
import { EquipmentHorizontalList } from '../../components/equipment/landing/EquipmentHorizontalList'
import { OperatorHorizontalList } from '../../components/equipment/landing/OperatorHorizontalList'
import { PartHorizontalList } from '../../components/parts/PartHorizontalList'
import { ServiceHorizontalList } from '../../components/services/ServiceHorizontalList'
import { HomeCategoriesGrid } from '../../components/home/HomeCategoriesGrid'
import { HomeAddListingBanner } from '../../components/home/HomeAddListingBanner'
import { GlassCategoriesGrid } from '../../components/ui/GlassCategoriesGrid'
import { AnimatedHeroHeader } from '../../components/ui/AnimatedHeroHeader'
import { type GlassSupport } from '../../components/navigation/glassSupport'

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

  describe('Item 2: CardImageSwiper static path bypasses Gesture.Pan/Tap/Exclusive hooks when disableImageSwipe is true', () => {
    it('does NOT call Gesture.Pan, Gesture.Tap, or Gesture.Exclusive when disableImageSwipe={true} or count <= 1, while keeping tap and imageCountBadge identical', async () => {
      const panSpy = jest.spyOn(Gesture, 'Pan')
      const tapSpy = jest.spyOn(Gesture, 'Tap')
      const exclusiveSpy = jest.spyOn(Gesture, 'Exclusive')
      const onPress = jest.fn()

      const { getByTestId, getByText } = await render(
        <CardImageSwiper
          images={[
            'https://cdn.example.com/1.jpg',
            'https://cdn.example.com/2.jpg',
            'https://cdn.example.com/3.jpg',
          ]}
          imageCount={5}
          cardWidth={312}
          imageHeight={133}
          disableImageSwipe={true}
          onPress={onPress}
        />
      )

      // Zero gesture recognizers created when disableImageSwipe={true}
      expect(panSpy).not.toHaveBeenCalled()
      expect(tapSpy).not.toHaveBeenCalled()
      expect(exclusiveSpy).not.toHaveBeenCalled()

      // Static image container, badge count, and tap handler remain identical
      const staticCard = getByTestId('card-image-static')
      expect(staticCard).toBeTruthy()
      expect(getByText('5')).toBeTruthy()

      fireEvent.press(staticCard)
      expect(onPress).toHaveBeenCalledTimes(1)

      panSpy.mockRestore()
      tapSpy.mockRestore()
      exclusiveSpy.mockRestore()
    })

    it('creates Gesture.Pan, Gesture.Tap, and Gesture.Exclusive when disableImageSwipe={false} and count > 1', async () => {
      const panSpy = jest.spyOn(Gesture, 'Pan')
      const tapSpy = jest.spyOn(Gesture, 'Tap')
      const exclusiveSpy = jest.spyOn(Gesture, 'Exclusive')

      const { getByTestId } = await render(
        <CardImageSwiper
          images={[
            'https://cdn.example.com/1.jpg',
            'https://cdn.example.com/2.jpg',
          ]}
          cardWidth={312}
          imageHeight={133}
          disableImageSwipe={false}
          onPress={jest.fn()}
        />
      )

      expect(getByTestId('card-image-swipeable')).toBeTruthy()
      expect(panSpy).toHaveBeenCalledTimes(1)
      expect(tapSpy).toHaveBeenCalledTimes(1)
      expect(exclusiveSpy).toHaveBeenCalledTimes(1)

      panSpy.mockRestore()
      tapSpy.mockRestore()
      exclusiveSpy.mockRestore()
    })
  })

  describe('Item 3: Memoized sections/lists, stable Home card components, and single glassSupport per screen', () => {
    const sharedGlassSupport: GlassSupport = {
      kind: 'blur',
    }

    it('wraps CategorySection, Home*Card components, and all 6 landing HorizontalLists in React.memo', () => {
      const reactMemoSymbol = Symbol.for('react.memo')
      expect((CategorySection as unknown as { $$typeof?: symbol }).$$typeof).toBe(reactMemoSymbol)
      expect((HomeCarCard as unknown as { $$typeof?: symbol }).$$typeof).toBe(reactMemoSymbol)
      expect((HomeServiceCard as unknown as { $$typeof?: symbol }).$$typeof).toBe(reactMemoSymbol)
      expect((HomePartCard as unknown as { $$typeof?: symbol }).$$typeof).toBe(reactMemoSymbol)
      expect((HomeBusCard as unknown as { $$typeof?: symbol }).$$typeof).toBe(reactMemoSymbol)
      expect((HomeEquipCard as unknown as { $$typeof?: symbol }).$$typeof).toBe(reactMemoSymbol)

      expect((CarHorizontalList as unknown as { $$typeof?: symbol }).$$typeof).toBe(reactMemoSymbol)
      expect((BusHorizontalList as unknown as { $$typeof?: symbol }).$$typeof).toBe(reactMemoSymbol)
      expect((EquipmentHorizontalList as unknown as { $$typeof?: symbol }).$$typeof).toBe(reactMemoSymbol)
      expect((OperatorHorizontalList as unknown as { $$typeof?: symbol }).$$typeof).toBe(reactMemoSymbol)
      expect((PartHorizontalList as unknown as { $$typeof?: symbol }).$$typeof).toBe(reactMemoSymbol)
      expect((ServiceHorizontalList as unknown as { $$typeof?: symbol }).$$typeof).toBe(reactMemoSymbol)
      expect((HomeCategoriesGrid as unknown as { $$typeof?: symbol }).$$typeof).toBe(reactMemoSymbol)
      expect((HomeAddListingBanner as unknown as { $$typeof?: symbol }).$$typeof).toBe(reactMemoSymbol)
    })

    it('does NOT subscribe to AccessibilityInfo.addEventListener in HomeCategoriesGrid, GlassCategoriesGrid, AnimatedHeroHeader, or HomeAddListingBanner when shared glassSupport is passed', async () => {
      const addListenerSpy = jest
        .spyOn(AccessibilityInfo, 'addEventListener')
        .mockReturnValue({ remove: jest.fn() } as never)
      const isReduceSpy = jest
        .spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled')
        .mockResolvedValue(false)

      await render(
        <View>
          <AnimatedHeroHeader
            title="ســوق ون"
            titleAccent="أهلاً بك"
            hideBackButton
            glassSupport={sharedGlassSupport}
          />
          <HomeCategoriesGrid support={sharedGlassSupport} reducedMotion={false} />
          <GlassCategoriesGrid
            items={[
              {
                id: 'new',
                label: 'جديدة',
                icon: 'sparkles',
                iconBg: '#E6F4F1',
                iconColor: '#0A6847',
                onPress: jest.fn(),
              },
            ]}
            support={sharedGlassSupport}
          />
          <HomeAddListingBanner onPress={jest.fn()} support={sharedGlassSupport} />
        </View>
      )

      const transparencyListeners = addListenerSpy.mock.calls.filter(
        (call) => String(call[0]) === 'reduceTransparencyChanged'
      )
      expect(transparencyListeners).toHaveLength(0)
      expect(isReduceSpy).not.toHaveBeenCalled()

      addListenerSpy.mockRestore()
      isReduceSpy.mockRestore()
    })

    it('skips CategorySection re-render when props are unchanged, and re-renders card when item reference changes (e.g. status/favorite update)', async () => {
      const cardRenderSpy = jest.fn(({ item }: { item: { id: string; title: string } }) => (
        <View testID={`custom-card-${item.id}`}>
          <Text>{item.title}</Text>
        </View>
      ))
      const MemoCustomCard = React.memo(cardRenderSpy)

      const initialItems = [
        { id: 'c1', title: 'Car 1' },
        { id: 'c2', title: 'Car 2' },
      ]

      const { rerender, getByText } = await render(
        <CategorySection
          peek={true}
          title="أحدث إعلانات السيارات"
          subTitle="أفضل عروض البيع"
          icon="car-sports"
          seeAllRoute="/cars/browse"
          data={initialItems as never}
          isLoading={false}
          routeBase="cars"
          CustomCard={MemoCustomCard as never}
          glassSupport={sharedGlassSupport}
        />
      )

      expect(cardRenderSpy).toHaveBeenCalledTimes(2)
      expect(getByText('Car 1')).toBeTruthy()

      // Re-rendering parent with identical props skips CategorySection and CustomCard re-render
      await rerender(
        <CategorySection
          peek={true}
          title="أحدث إعلانات السيارات"
          subTitle="أفضل عروض البيع"
          icon="car-sports"
          seeAllRoute="/cars/browse"
          data={initialItems as never}
          isLoading={false}
          routeBase="cars"
          CustomCard={MemoCustomCard as never}
          glassSupport={sharedGlassSupport}
        />
      )
      expect(cardRenderSpy).toHaveBeenCalledTimes(2)

      // Updating item c1 (e.g. title/status update) re-renders only c1 while c2 stays memoized
      const updatedItems = [
        { id: 'c1', title: 'Car 1 Updated' },
        initialItems[1],
      ]
      await rerender(
        <CategorySection
          peek={true}
          title="أحدث إعلانات السيارات"
          subTitle="أفضل عروض البيع"
          icon="car-sports"
          seeAllRoute="/cars/browse"
          data={updatedItems as never}
          isLoading={false}
          routeBase="cars"
          CustomCard={MemoCustomCard as never}
          glassSupport={sharedGlassSupport}
        />
      )
      expect(getByText('Car 1 Updated')).toBeTruthy()
    })
  })
})
