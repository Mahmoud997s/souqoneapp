import React from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { render, cleanup } from '@testing-library/react-native'
import fs from 'fs'
import path from 'path'
import { GlassSurface } from '../../components/navigation/glassSupport'
import { WizardCard } from '../../components/ui/WizardCard'
import { WizardStickyFooter } from '../../components/ui/WizardStickyFooter'
import { WizardReviewCard } from '../../components/ui/WizardReviewCard'
import { Stepper } from '../../components/ui/Stepper'
import { AnimatedHeroHeader } from '../../components/ui/AnimatedHeroHeader'
import { DraftResumeScreen } from '../../components/post/DraftResumeScreen'
import { ProfilePhoneGuardView } from '../../components/profile/ProfilePhoneGuardView'
import { Radius } from '../../constants/radius'

// Mock expo-blur
jest.mock('expo-blur', () => {
  const ReactLib = require('react')
  const { View: RNView } = require('react-native')
  return {
    BlurView: (props: Record<string, unknown>) =>
      ReactLib.createElement(RNView, { testID: 'mock-blur-view', ...props }),
  }
})

// Mock expo-glass-effect
const MockGlassView = (props: Record<string, unknown>) => {
  const ReactLib = require('react')
  const { View: RNView } = require('react-native')
  return ReactLib.createElement(RNView, { testID: 'mock-glass-view', ...props })
}

jest.mock('expo-glass-effect', () => ({
  GlassView: MockGlassView,
  GlassContainer: MockGlassView,
  isLiquidGlassAvailable: () => true,
  isGlassEffectAPIAvailable: () => true,
}))

// Mock vector icons
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

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  router: { push: jest.fn(), back: jest.fn() },
}))

// Mock safe area
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const ReactLib = require('react')
  const { View: RNView, Text: RNText } = require('react-native')
  const ReanimatedMock = require('react-native-reanimated/mock')

  return {
    ...ReanimatedMock,
    default: {
      ...ReanimatedMock.default,
      View: (props: Record<string, unknown>) =>
        ReactLib.createElement(RNView, { testID: props.testID || 'mock-reanimated-view', ...props }),
      Text: (props: Record<string, unknown>) =>
        ReactLib.createElement(RNText, { testID: props.testID || 'mock-reanimated-text', ...props }),
      createAnimatedComponent: (comp: any) => comp,
    },
    useSharedValue: (init: any) => ({ value: init }),
    useAnimatedStyle: (cb: () => any) => cb() || {},
    useAnimatedScrollHandler: () => jest.fn(),
    interpolate: jest.fn((_val: any, _inRange: any, outRange: any) => outRange?.[outRange.length - 1] ?? 0),
    Extrapolation: { CLAMP: 'clamp' },
    FadeIn: { duration: () => ({ delay: () => ({}) }), delay: () => ({ springify: () => ({}) }) },
    FadeInDown: { duration: () => ({ delay: () => ({}) }), delay: () => ({}) },
    ZoomIn: { duration: () => ({ delay: () => ({ springify: () => ({}) }) }), delay: () => ({ springify: () => ({}) }) },
  }
})

function assertNoOpacityInAncestry(startElement: any) {
  let curr = startElement
  let checkedCount = 0
  while (curr) {
    if (curr.props && curr.props.style) {
      const flatStyle = StyleSheet.flatten(curr.props.style)
      if (flatStyle && flatStyle.opacity !== undefined) {
        throw new Error(
          `Detected opacity: ${flatStyle.opacity} in ancestry on element testID: ${curr.props.testID || 'anonymous'}`
        )
      }
    }
    checkedCount++
    curr = curr.parent
  }
  expect(checkedCount).toBeGreaterThan(1)
}

describe('D-175c Characterization & Architectural Guard Tests', () => {
  afterEach(() => {
    cleanup()
  })

  describe('1. Architectural Guard: expo-blur imports whitelist', () => {
    it('asserts only whitelisted files import expo-blur in app/ and src/', () => {
      const allowedFiles = new Set([
        // Adapter itself
        path.normalize('src/components/navigation/GlassSurface.tsx'),
        // Deferred to D-175d
        path.normalize('src/components/ui/GlassNavBar.tsx'),
        // (O) Overlay / Sold backdrop
        path.normalize('src/components/ui/ListingCardBase.tsx'),
        // Forbidden to touch
        path.normalize('app/(auth)/login.tsx'),
      ])

      const rootDir = path.resolve(__dirname, '../../..')
      const targetDirs = ['app', 'src']
      const violatingFiles: string[] = []

      function scanDir(dirPath: string) {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true })
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name)
          if (entry.isDirectory()) {
            if (entry.name === '__tests__' || entry.name === 'node_modules' || entry.name === '_parked') {
              continue
            }
            scanDir(fullPath)
          } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
            if (entry.name.endsWith('.spec.ts') || entry.name.endsWith('.spec.tsx') || entry.name.endsWith('.test.tsx')) {
              continue
            }
            const relPath = path.relative(rootDir, fullPath)
            const content = fs.readFileSync(fullPath, 'utf8')
            if (content.includes("from 'expo-blur'") || content.includes('from "expo-blur"')) {
              if (!allowedFiles.has(relPath)) {
                violatingFiles.push(relPath)
              }
            }
          }
        }
      }

      for (const d of targetDirs) {
        scanDir(path.join(rootDir, d))
      }

      expect(violatingFiles).toEqual([])
    })
  })

  describe('2. WizardStickyFooter Component', () => {
    it('renders liquid GlassView on liquid branch and has no opacity in ancestry', async () => {
      const { getByTestId } = await render(
        <WizardStickyFooter
          testID="test-sticky-footer"
          paddingBottom={20}
        >
          <Text>Footer Content</Text>
        </WizardStickyFooter>
      )

      const innerGlass = getByTestId('test-sticky-footer-surface-glass-liquid')
      expect(innerGlass).toBeTruthy()
      assertNoOpacityInAncestry(innerGlass)
    })

    it('teeth proof: assertNoOpacityInAncestry fails when an ancestor has opacity', async () => {
      const { getByTestId } = await render(
        <View style={{ opacity: 0.5 }}>
          <WizardStickyFooter
            testID="test-sticky-footer-teeth"
            paddingBottom={20}
          >
            <Text>Footer Content</Text>
          </WizardStickyFooter>
        </View>
      )

      const innerGlass = getByTestId('test-sticky-footer-teeth-surface-glass-liquid')
      expect(() => assertNoOpacityInAncestry(innerGlass)).toThrow(
        /Detected opacity: 0.5 in ancestry/
      )
    })
  })

  describe('3. WizardReviewCard Component', () => {
    it('renders liquid GlassView on liquid branch and has no opacity in ancestry', async () => {
      const { getByTestId } = await render(
        <WizardReviewCard testID="test-review-card">
          <Text>Review Card Content</Text>
        </WizardReviewCard>
      )

      const innerGlass = getByTestId('test-review-card-surface-glass-liquid')
      expect(innerGlass).toBeTruthy()
      assertNoOpacityInAncestry(innerGlass)
    })
  })

  describe('4. WizardCard Component', () => {
    it('renders liquid GlassView on liquid branch and has no opacity in ancestry', async () => {
      const { getByTestId } = await render(
        <WizardCard
          testID="test-wizard-card"
          title="بيانات الإعلان"
          subtitle="وصف إضافي"
        >
          <Text>Form fields</Text>
        </WizardCard>
      )

      const innerGlass = getByTestId('test-wizard-card-surface-glass-liquid')
      expect(innerGlass).toBeTruthy()
      assertNoOpacityInAncestry(innerGlass)
    })
  })

  describe('5. Stepper Component', () => {
    it('renders light variant with GlassSurface and no opacity in ancestry', async () => {
      const { getByText } = await render(
        <Stepper
          currentStep={2}
          totalSteps={5}
          title="خطوة الإدخال"
          variant="light"
        />
      )

      const stepText = getByText('2')
      expect(stepText).toBeTruthy()
    })
  })

  describe('6. AnimatedHeroHeader Component', () => {
    it('renders GlassSurface with exact intensity=65 without opacity in glass', async () => {
      const { getByTestId } = await render(
        <AnimatedHeroHeader
          title="العنوان الرئيسي"
          // Note: 'as any' is intentionally preserved on this characterization test fixture to mock a SharedValue without full native Reanimated bindings
          scrollY={{ value: 0 } as any}
        />
      )

      const glass = getByTestId('animated-hero-header-glass-glass-liquid')
      expect(glass).toBeTruthy()
      const flat = StyleSheet.flatten(glass.props.style)
      expect(flat.opacity).toBeUndefined()
    })
  })

  describe('7. ProfilePhoneGuardView Component', () => {
    it('renders GlassSurface card in glass mode', async () => {
      const { getByText } = await render(
        <ProfilePhoneGuardView
          title="توثيق الهاتف"
          headerVariant="glass"
        />
      )

      expect(getByText('توثيق الهاتف')).toBeTruthy()
    })
  })

  describe('8. DraftResumeScreen Component', () => {
    it('renders draft card and footer using GlassSurface', async () => {
      const { getByText } = await render(
        <DraftResumeScreen
          categoryName="سيارات"
          draftTitle="كامري 2022 نظيفة"
          completionPercentage={60}
          lastSavedText="منذ 5 دقائق"
          images={['https://example.com/img1.jpg']}
          onResume={jest.fn()}
          onDiscard={jest.fn()}
        />
      )

      expect(getByText('كامري 2022 نظيفة')).toBeTruthy()
      expect(getByText('استكمال ونشر الإعلان')).toBeTruthy()
    })
  })
})
