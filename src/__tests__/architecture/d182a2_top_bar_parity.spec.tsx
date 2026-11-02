import React from 'react'
import { AccessibilityInfo, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { render, screen, act } from '@testing-library/react-native'
import type { SharedValue } from 'react-native-reanimated'
import * as fs from 'fs'
import * as path from 'path'
import { AnimatedHeroHeader } from '../../components/ui/AnimatedHeroHeader'
import { DetailTopBar } from '../../components/listing-detail/DetailTopBar'
import { TopBarTokens } from '../../constants/topBarTokens'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { CATEGORY_ICONS } from '../../constants/categoryIcons'
import {
  CategorySection,
  SECTION_ICON_MAP,
  SECTION_ICON_BOX_SIZE,
  SECTION_ICON_3D_SIZE,
  SECTION_ICON_3D_POP_OUT_TOP,
} from '../../../app/(tabs)/index'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

jest.mock('react-native-reanimated', () => {
  const reanimated = require('react-native-reanimated/mock')
  return {
    ...reanimated,
    FadeInDown: {
      duration: () => ({}),
    },
    useSharedValue: jest.fn((init) => ({ value: init })),
    useAnimatedScrollHandler: jest.fn(() => jest.fn()),
    useAnimatedStyle: jest.fn((cb) => cb()),
    interpolate: jest.fn((val: number, input: number[], output: number[]) => {
      if (val <= input[0]) return output[0]
      if (val >= input[input.length - 1]) return output[output.length - 1]
      for (let i = 0; i < input.length - 1; i++) {
        if (val >= input[i] && val <= input[i + 1]) {
          const span = input[i + 1] - input[i]
          const ratio = span === 0 ? 0 : (val - input[i]) / span
          return output[i] + ratio * (output[i + 1] - output[i])
        }
      }
      return output[0]
    }),
    withSpring: jest.fn((val) => val),
    withTiming: jest.fn((val) => val),
  }
})

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}))

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light' },
}))

jest.mock('expo-blur', () => {
  const ReactLib = require('react')
  const { View: RNView } = require('react-native')
  return {
    BlurView: (props: Record<string, unknown>) =>
      ReactLib.createElement(RNView, { testID: 'mock-blur-view', ...props }),
  }
})

jest.mock('expo-image', () => {
  const ReactLib = require('react')
  const { View: RNView } = require('react-native')
  return {
    Image: (props: Record<string, unknown>) =>
      ReactLib.createElement(RNView, { ...props }),
  }
})

jest.mock('@expo/vector-icons', () => {
  const ReactLib = require('react')
  const { View: RNView } = require('react-native')
  return {
    Ionicons: (props: Record<string, unknown>) =>
      ReactLib.createElement(RNView, { testID: `icon-${String(props.name)}`, ...props }),
    MaterialCommunityIcons: (props: Record<string, unknown>) =>
      ReactLib.createElement(RNView, { testID: `m-icon-${String(props.name)}`, ...props }),
  }
})

interface TestNode {
  props?: {
    testID?: string
    style?: StyleProp<ViewStyle>
    children?: unknown
  }
  parent?: TestNode | null
  children?: Array<TestNode | string>
}

function assertAncestorsHaveFullOpacity(node: unknown) {
  let current = node as TestNode | null | undefined
  while (current) {
    const flatStyle = (StyleSheet.flatten(current.props?.style) || {}) as Record<
      string,
      unknown
    >
    if (flatStyle.opacity !== undefined) {
      expect(flatStyle.opacity).toBe(1)
    }
    current = current.parent
  }
}

function assertBackingBeforeGlassWithSameRadius(
  containerNode: unknown,
  backingTestId: string,
  glassTestIdPrefix: string,
  expectedRadius: number
) {
  const container = containerNode as TestNode
  const backing = screen.getByTestId(backingTestId, { includeHiddenElements: true })
  const glass =
    screen.queryByTestId(`${glassTestIdPrefix}-glass-liquid`, { includeHiddenElements: true }) ||
    screen.queryByTestId(`${glassTestIdPrefix}-glass-blur`, { includeHiddenElements: true })

  expect(backing).toBeTruthy()
  expect(glass).toBeTruthy()

  const backingStyle = StyleSheet.flatten(backing.props.style)
  const glassStyle = StyleSheet.flatten(glass!.props.style)

  expect(backingStyle.backgroundColor).toBe(TopBarTokens.iceGlass)
  expect(backingStyle.borderRadius).toBe(expectedRadius)
  expect(glassStyle.borderRadius).toBe(expectedRadius)
  expect(backing.props.pointerEvents).toBe('none')

  // Verify sibling order inside control container: backing is rendered strictly BEFORE GlassSurface
  const children = (container.children || []).filter(
    (child): child is TestNode => typeof child === 'object' && child !== null
  )
  const backingIdx = children.findIndex((c) => c.props?.testID === backingTestId)
  const glassIdx = children.findIndex(
    (c) =>
      c.props?.testID === `${glassTestIdPrefix}-glass-liquid` ||
      c.props?.testID === `${glassTestIdPrefix}-glass-blur`
  )
  expect(backingIdx).toBeGreaterThanOrEqual(0)
  expect(glassIdx).toBeGreaterThan(backingIdx)
}

describe('D-182a2: Top Bar Parity, Fixed iceGlass (#F9FCFE) Backing Layer & Home Section 3D Pop-Out Icons', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('1. TopBarTokens.iceGlass single source of truth (#F9FCFE)', () => {
    it('defines TopBarTokens.iceGlass = #F9FCFE and unifies searchPillFill, buttonBg, and searchBg', () => {
      expect(TopBarTokens.iceGlass).toBe('#F9FCFE')
      expect(TopBarTokens.searchPillFill).toBe(TopBarTokens.iceGlass)
      expect(TopBarTokens.buttonBg).toBe(TopBarTokens.iceGlass)
      expect(TopBarTokens.searchBg).toBe(TopBarTokens.iceGlass)
    })
  })

  describe('2. Backing Layer + Native Liquid Glass & Blur Fallback on Controls', () => {
    it('(a) AnimatedHeroHeader controls render iceGlass backing layer BEFORE GlassSurface with matching borderRadius', async () => {
      await render(
        <AnimatedHeroHeader
          title="ســوق ون"
          onBackPress={jest.fn()}
          onHeaderIconPress={jest.fn()}
          onChatPress={jest.fn()}
          onNavSearchPress={jest.fn()}
        />
      )
      await act(async () => {})

      assertBackingBeforeGlassWithSameRadius(
        screen.getByTestId('hero-header-back-btn', { includeHiddenElements: true }),
        'hero-header-back-btn-backing',
        'hero-header-back-btn',
        TopBarTokens.buttonRadius
      )
      assertBackingBeforeGlassWithSameRadius(
        screen.getByTestId('hero-header-compact-search', { includeHiddenElements: true }),
        'hero-header-compact-search-backing',
        'hero-header-compact-search',
        TopBarTokens.searchRadius
      )
      assertBackingBeforeGlassWithSameRadius(
        screen.getByTestId('hero-header-compact-filter-btn', { includeHiddenElements: true }),
        'hero-header-compact-filter-btn-backing',
        'hero-header-compact-filter-btn',
        14
      )
      assertBackingBeforeGlassWithSameRadius(
        screen.getByTestId('hero-header-chat-btn', { includeHiddenElements: true }),
        'hero-header-chat-btn-backing',
        'hero-header-chat-btn',
        TopBarTokens.buttonRadius
      )
      assertBackingBeforeGlassWithSameRadius(
        screen.getByTestId('hero-header-notification-btn', { includeHiddenElements: true }),
        'hero-header-notification-btn-backing',
        'hero-header-notification-btn',
        TopBarTokens.buttonRadius
      )
      assertBackingBeforeGlassWithSameRadius(
        screen.getByTestId('hero-header-large-search', { includeHiddenElements: true }),
        'hero-header-large-search-backing',
        'hero-header-large-search',
        Radius.md
      )
      assertBackingBeforeGlassWithSameRadius(
        screen.getByTestId('hero-header-large-filter-btn', { includeHiddenElements: true }),
        'hero-header-large-filter-btn-backing',
        'hero-header-large-filter-btn',
        Radius.sm
      )
    })

    it('(b) DetailTopBar controls render iceGlass backing layer BEFORE GlassSurface with matching borderRadius and share exact fill tokens', async () => {
      await render(
        <DetailTopBar
          onBack={jest.fn()}
          onShare={jest.fn()}
          canFavorite
          onToggleFavorite={jest.fn()}
          searchValue="تويوتا"
          onSearchChange={jest.fn()}
        />
      )
      await act(async () => {})

      assertBackingBeforeGlassWithSameRadius(
        screen.getByTestId('nav-back-button'),
        'nav-back-button-backing',
        'nav-back-button',
        TopBarTokens.buttonRadius
      )
      assertBackingBeforeGlassWithSameRadius(
        screen.getByTestId('nav-search-container'),
        'nav-search-container-backing',
        'nav-search-container',
        TopBarTokens.searchRadius
      )
      assertBackingBeforeGlassWithSameRadius(
        screen.getByTestId('btn-detail-share'),
        'btn-detail-share-backing',
        'btn-detail-share',
        TopBarTokens.buttonRadius
      )
      assertBackingBeforeGlassWithSameRadius(
        screen.getByTestId('nav-favorite-button'),
        'nav-favorite-button-backing',
        'nav-favorite-button',
        TopBarTokens.buttonRadius
      )

      // DetailTopBar container styles also resolve to TopBarTokens.iceGlass
      expect(
        StyleSheet.flatten(screen.getByTestId('nav-search-container').props.style).backgroundColor
      ).toBe(TopBarTokens.iceGlass)
      expect(
        StyleSheet.flatten(screen.getByTestId('nav-back-button').props.style).backgroundColor
      ).toBe(TopBarTokens.iceGlass)
    })

    it('(c) Blur fallback branch uses TopBarTokens.iceGlass washColor on AnimatedHeroHeader controls', async () => {
      const spy = jest
        .spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled')
        .mockResolvedValue(true)

      const { getByTestId } = await render(
        <AnimatedHeroHeader
          title="ســوق ون"
          onBackPress={jest.fn()}
          onHeaderIconPress={jest.fn()}
          onChatPress={jest.fn()}
        />
      )
      await act(async () => {})

      const heroCompactWash = getByTestId('hero-header-compact-search-wash-overlay', {
        includeHiddenElements: true,
      })
      expect(StyleSheet.flatten(heroCompactWash.props.style).backgroundColor).toBe(
        TopBarTokens.iceGlass
      )
      const heroBackWash = getByTestId('hero-header-back-btn-wash-overlay', {
        includeHiddenElements: true,
      })
      expect(StyleSheet.flatten(heroBackWash.props.style).backgroundColor).toBe(
        TopBarTokens.iceGlass
      )
      spy.mockResolvedValue(false)
    })

    it('(d) Blur fallback branch uses TopBarTokens.iceGlass washColor on DetailTopBar controls', async () => {
      const { getByTestId } = await render(
        <DetailTopBar
          onBack={jest.fn()}
          searchValue="نيسان"
          onSearchChange={jest.fn()}
          support={{ kind: 'blur' }}
        />
      )

      const detailSearchWash = getByTestId('nav-search-container-wash-overlay')
      expect(StyleSheet.flatten(detailSearchWash.props.style).backgroundColor).toBe(
        TopBarTokens.iceGlass
      )
      const detailBackWash = getByTestId('nav-back-button-wash-overlay')
      expect(StyleSheet.flatten(detailBackWash.props.style).backgroundColor).toBe(
        TopBarTokens.iceGlass
      )
    })
  })

  describe('3. Zero Ancestor Opacity < 1 for Every GlassSurface Across Scroll States', () => {
    it.each([0, 10, 40])(
      'AnimatedHeroHeader has NO ancestor with opacity < 1 at scrollY = %d',
      async (scrollValue) => {
        const scrollY = { value: scrollValue } as unknown as SharedValue<number>
        await render(
          <AnimatedHeroHeader
            scrollY={scrollY}
            title="ســوق ون"
            onBackPress={jest.fn()}
            onHeaderIconPress={jest.fn()}
            onChatPress={jest.fn()}
            onNavSearchPress={jest.fn()}
          />
        )
        await act(async () => {})

        const glassPrefixes = [
          'animated-hero-header-glass',
          'hero-header-back-btn',
          'hero-header-compact-search',
          'hero-header-compact-filter-btn',
          'hero-header-chat-btn',
          'hero-header-notification-btn',
          'hero-header-large-search',
          'hero-header-large-filter-btn',
        ]

        for (const prefix of glassPrefixes) {
          const glassNode =
            screen.queryByTestId(`${prefix}-glass-liquid`, { includeHiddenElements: true }) ||
            screen.queryByTestId(`${prefix}-glass-blur`, { includeHiddenElements: true })
          expect(glassNode).toBeTruthy()
          assertAncestorsHaveFullOpacity(glassNode)
        }
      }
    )

    it('DetailTopBar has NO ancestor with opacity < 1 on bar or control GlassSurfaces', async () => {
      await render(
        <DetailTopBar
          onBack={jest.fn()}
          onShare={jest.fn()}
          canFavorite
          onToggleFavorite={jest.fn()}
          searchValue="لكزس"
          onSearchChange={jest.fn()}
        />
      )
      await act(async () => {})

      const glassPrefixes = [
        'detail-top-bar',
        'nav-back-button',
        'nav-search-container',
        'btn-detail-share',
        'nav-favorite-button',
      ]

      for (const prefix of glassPrefixes) {
        const glassNode =
          screen.queryByTestId(`${prefix}-glass-liquid`, { includeHiddenElements: true }) ||
          screen.queryByTestId(`${prefix}-glass-blur`, { includeHiddenElements: true })
        expect(glassNode).toBeTruthy()
        assertAncestorsHaveFullOpacity(glassNode)
      }
    })
  })

  describe('4. Home CategorySection Headers: iceGlass Fill, 3D Category Icons & Pop-Out Geometry', () => {
    const sections: Array<{
      routeBase: 'cars' | 'services' | 'parts' | 'buses' | 'equipment'
      title: string
      icon: 'car-sports' | 'car-wrench' | 'car-cog' | 'bus-side' | 'excavator'
      expectedAsset: unknown
    }> = [
      {
        routeBase: 'cars',
        title: 'أحدث إعلانات السيارات',
        icon: 'car-sports',
        expectedAsset: CATEGORY_ICONS.cars,
      },
      {
        routeBase: 'services',
        title: 'خدمات السيارات',
        icon: 'car-wrench',
        expectedAsset: CATEGORY_ICONS.services,
      },
      {
        routeBase: 'parts',
        title: 'قطع الغيار',
        icon: 'car-cog',
        expectedAsset: CATEGORY_ICONS.parts,
      },
      {
        routeBase: 'buses',
        title: 'حافلات ونقل ركاب',
        icon: 'bus-side',
        expectedAsset: CATEGORY_ICONS.buses,
      },
      {
        routeBase: 'equipment',
        title: 'معدات ومشغلون',
        icon: 'excavator',
        expectedAsset: CATEGORY_ICONS.equipment,
      },
    ]

    it.each(sections)(
      'Section "$routeBase" renders 3D asset, iceGlass icon box (32x32) & "الكل" pill, 1/3 pop-out top offset (-10 on 30px), and unclipped ancestors',
      async ({ routeBase, title, icon, expectedAsset }) => {
        await render(
          <CategorySection
            title={title}
            subTitle="وصف القسم"
            icon={icon}
            seeAllRoute={`/${routeBase}`}
            data={[{ id: `${routeBase}-1`, title: 'عنصر تجريبي', price: 100, images: [] }]}
            isLoading={false}
            routeBase={routeBase}
            CustomCard={() => <View testID={`card-${routeBase}`} />}
          />
        )

        // 1. 32x32 Icon box uses TopBarTokens.iceGlass and unchanged dimensions
        const iconBox = screen.getByTestId(`home-section-icon-box-${routeBase}`)
        const boxStyle = StyleSheet.flatten(iconBox.props.style)
        expect(boxStyle.width).toBe(32)
        expect(boxStyle.height).toBe(32)
        expect(boxStyle.borderRadius).toBe(10)
        expect(boxStyle.backgroundColor).toBe(TopBarTokens.iceGlass)
        expect(boxStyle.borderWidth).toBe(1)
        expect(boxStyle.borderColor).toBe(Colors.border)
        expect(boxStyle.overflow).toBe('visible')

        // 2. "الكل" pill uses TopBarTokens.iceGlass
        const seeAllBtn = screen.getByTestId(`home-section-see-all-${routeBase}`)
        const seeAllStyle = StyleSheet.flatten(seeAllBtn.props.style)
        expect(seeAllStyle.backgroundColor).toBe(TopBarTokens.iceGlass)
        expect(seeAllStyle.borderRadius).toBe(Radius.pill)
        expect(seeAllStyle.borderWidth).toBe(1)
        expect(seeAllStyle.borderColor).toBe(Colors.border)

        // 3. 3D Image replaces MaterialCommunityIcons glyph and has 1/3 pop-out above the box
        expect(screen.queryByTestId(`m-icon-${icon}`)).toBeNull()
        const icon3D = screen.getByTestId(`home-section-icon-3d-${routeBase}`)
        expect(icon3D.props.source).toBe(expectedAsset)
        expect(icon3D.props.contentFit).toBe('contain')
        expect(icon3D.props.pointerEvents).toBe('none')

        const imgStyle = StyleSheet.flatten(icon3D.props.style)
        expect(imgStyle.position).toBe('absolute')
        expect(imgStyle.width).toBe(SECTION_ICON_3D_SIZE) // 30
        expect(imgStyle.height).toBe(SECTION_ICON_3D_SIZE) // 30
        expect(imgStyle.top).toBe(SECTION_ICON_3D_POP_OUT_TOP) // -10
        // Pop-out top offset is strictly 1/3 of image height above the box
        expect(Math.abs(imgStyle.top as number)).toBeCloseTo((imgStyle.height as number) / 3, 2)

        // 4. No ancestor up to the section root has overflow 'hidden' or 'scroll'
        const sectionRoot = screen.getByTestId(`home-section-${routeBase}`)
        let curr: TestNode | null | undefined = icon3D as unknown as TestNode
        while (curr) {
          const flat = (StyleSheet.flatten(curr.props?.style) || {}) as Record<
            string,
            unknown
          >
          expect(flat.overflow).not.toBe('hidden')
          expect(flat.overflow).not.toBe('scroll')
          assertAncestorsHaveFullOpacity(curr)
          if (curr.props?.testID === sectionRoot.props.testID) break
          curr = curr.parent
        }
      }
    )

    it('Scope Limit: pop-out style (negative top on category icon) exists ONLY in Home section header and nowhere else', () => {
      expect(SECTION_ICON_BOX_SIZE).toBe(32)
      expect(SECTION_ICON_3D_SIZE).toBe(30)
      expect(SECTION_ICON_3D_POP_OUT_TOP).toBe(-10)
      expect(SECTION_ICON_MAP).toEqual({
        cars: 'cars',
        services: 'services',
        parts: 'parts',
        buses: 'buses',
        equipment: 'equipment',
        operators: 'operators',
      })

      // Verify HomeCategoriesGrid, AnimatedHeroHeader, and DetailTopBar do NOT define sectionIcon3D or top: -10 pop-out
      const gridSrc = fs.readFileSync(
        path.resolve(__dirname, '../../components/home/HomeCategoriesGrid.tsx'),
        'utf8'
      )
      const heroSrc = fs.readFileSync(
        path.resolve(__dirname, '../../components/ui/AnimatedHeroHeader.tsx'),
        'utf8'
      )
      const detailSrc = fs.readFileSync(
        path.resolve(__dirname, '../../components/listing-detail/DetailTopBar.tsx'),
        'utf8'
      )
      expect(gridSrc).not.toContain('sectionIcon3D')
      expect(gridSrc).not.toContain('SECTION_ICON_3D_POP_OUT_TOP')
      expect(heroSrc).not.toContain('sectionIcon3D')
      expect(detailSrc).not.toContain('sectionIcon3D')
    })
  })

  describe('5. Overlap Prevention & Clip Rect Visibility Across Scroll States (0, 5, 11, 17, 40)', () => {
    function getTranslateY(styleObj: Record<string, unknown>): number {
      const transform = styleObj.transform as Array<{ translateY?: number }> | undefined
      if (!Array.isArray(transform)) return 0
      const entry = transform.find((t) => typeof t.translateY === 'number')
      return entry?.translateY ?? 0
    }

    function isLayerInsideVerticalClipRect(
      translateY: number,
      layerHeight: number,
      clipHeight: number
    ): boolean {
      if (clipHeight <= 0 || layerHeight <= 0) return false
      const layerTop = translateY
      const layerBottom = translateY + layerHeight
      const visibleTop = Math.max(0, layerTop)
      const visibleBottom = Math.min(clipHeight, layerBottom)
      return visibleBottom > visibleTop
    }

    it.each([
      {
        scrollValue: 0,
        expectExpandedVisible: true,
        expectCompactVisible: false,
        expectedTitlePointer: 'auto',
        expectedLargePointer: 'auto',
        expectedChatPointer: 'auto',
        expectedCompactPointer: 'none',
      },
      {
        scrollValue: 5,
        expectExpandedVisible: true,
        expectCompactVisible: false,
        expectedTitlePointer: 'auto',
        expectedLargePointer: 'auto',
        expectedChatPointer: 'auto',
        expectedCompactPointer: 'none',
      },
      {
        scrollValue: 11,
        expectExpandedVisible: false,
        expectCompactVisible: false,
        expectedTitlePointer: 'none',
        expectedLargePointer: 'none',
        expectedChatPointer: 'none',
        expectedCompactPointer: 'none',
      },
      {
        scrollValue: 17,
        expectExpandedVisible: false,
        expectCompactVisible: true,
        expectedTitlePointer: 'none',
        expectedLargePointer: 'none',
        expectedChatPointer: 'none',
        expectedCompactPointer: 'auto',
      },
      {
        scrollValue: 40,
        expectExpandedVisible: false,
        expectCompactVisible: true,
        expectedTitlePointer: 'none',
        expectedLargePointer: 'none',
        expectedChatPointer: 'none',
        expectedCompactPointer: 'auto',
      },
    ])(
      'scrollY = $scrollValue: enforces clip containers (overflow hidden), non-overlapping search bars, and exact pointerEvents',
      async ({
        scrollValue,
        expectExpandedVisible,
        expectCompactVisible,
        expectedTitlePointer,
        expectedLargePointer,
        expectedChatPointer,
        expectedCompactPointer,
      }) => {
        const scrollY = { value: scrollValue } as unknown as SharedValue<number>
        const { getByTestId } = await render(
          <AnimatedHeroHeader
            scrollY={scrollY}
            title="ســوق ون"
            onBackPress={jest.fn()}
            onHeaderIconPress={jest.fn()}
            onChatPress={jest.fn()}
            onNavSearchPress={jest.fn()}
          />
        )
        await act(async () => {})

        const centerClip = getByTestId('hero-header-center-clip', { includeHiddenElements: true })
        const row2Clip = getByTestId('hero-header-row2-clip', { includeHiddenElements: true })
        const chatClip = getByTestId('hero-header-chat-btn-clip', { includeHiddenElements: true })
        const expandedTitle = getByTestId('hero-header-expanded-title', {
          includeHiddenElements: true,
        })
        const compactWrapper = getByTestId('hero-header-compact-search-wrapper', {
          includeHiddenElements: true,
        })
        const row2 = getByTestId('hero-header-row2', { includeHiddenElements: true })

        const centerClipStyle = StyleSheet.flatten(centerClip.props.style) as Record<
          string,
          unknown
        >
        const row2ClipStyle = StyleSheet.flatten(row2Clip.props.style) as Record<string, unknown>
        const chatClipStyle = StyleSheet.flatten(chatClip.props.style) as Record<string, unknown>
        const titleStyle = StyleSheet.flatten(expandedTitle.props.style) as Record<string, unknown>
        const compactStyle = StyleSheet.flatten(compactWrapper.props.style) as Record<
          string,
          unknown
        >
        const row2Style = StyleSheet.flatten(row2.props.style) as Record<string, unknown>

        // All 3 clip containers MUST have overflow: 'hidden'
        expect(centerClipStyle.overflow).toBe('hidden')
        expect(row2ClipStyle.overflow).toBe('hidden')
        expect(chatClipStyle.overflow).toBe('hidden')

        const centerClipHeight = centerClipStyle.height as number // 38
        const row2ClipHeight = row2ClipStyle.height as number // 64 -> 0
        const chatClipHeight = chatClipStyle.height as number // 38
        const chatWidth = chatClipStyle.width as number // 38 -> 0

        const compactTranslateY = getTranslateY(compactStyle)
        const row2TranslateY = getTranslateY(row2Style)
        const titleTranslateY = getTranslateY(titleStyle)
        const chatTranslateY = getTranslateY(chatClipStyle)

        const compactInsideClip = isLayerInsideVerticalClipRect(
          compactTranslateY,
          TopBarTokens.searchHeight,
          centerClipHeight
        )
        const largeInsideClip = isLayerInsideVerticalClipRect(row2TranslateY, 64, row2ClipHeight)
        const titleInsideClip =
          isLayerInsideVerticalClipRect(titleTranslateY, centerClipHeight, centerClipHeight) &&
          (titleStyle.opacity as number) > 0
        const chatInsideClip =
          chatWidth > 0 &&
          isLayerInsideVerticalClipRect(chatTranslateY, TopBarTokens.buttonSize, chatClipHeight)

        // NEVER both search bars inside visible clip rect at the same time
        expect(compactInsideClip && largeInsideClip).toBe(false)

        expect(largeInsideClip).toBe(expectExpandedVisible)
        expect(titleInsideClip).toBe(expectExpandedVisible)
        expect(compactInsideClip).toBe(expectCompactVisible)
        if (scrollValue === 0 || scrollValue === 5) {
          expect(chatInsideClip).toBe(true)
        }
        if (scrollValue >= 17) {
          expect(chatInsideClip).toBe(false)
        }

        // Verify pointerEvents on each layer
        expect(titleStyle.pointerEvents).toBe(expectedTitlePointer)
        expect(row2Style.pointerEvents).toBe(expectedLargePointer)
        expect(chatClipStyle.pointerEvents).toBe(expectedChatPointer)
        expect(compactStyle.pointerEvents).toBe(expectedCompactPointer)
      }
    )
  })
})
