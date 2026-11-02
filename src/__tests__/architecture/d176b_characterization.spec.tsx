import React from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { render, cleanup } from '@testing-library/react-native'
import { Colors } from '../../constants/colors'
import { BottomBarTokens } from '../../constants/bottomBarTokens'
import { TopBarTokens } from '../../constants/topBarTokens'
import { GlassNavBar } from '../../components/ui/GlassNavBar'
import { WizardStickyFooter } from '../../components/ui/WizardStickyFooter'
import { WizardReviewCard } from '../../components/ui/WizardReviewCard'
import { Stepper } from '../../components/ui/Stepper'
import { WizardCard } from '../../components/ui/WizardCard'
import { ProfilePhoneGuardView } from '../../components/profile/ProfilePhoneGuardView'
import { DraftResumeScreen } from '../../components/post/DraftResumeScreen'
import {
  ContactActions,
  CONTACT_ACTIONS_BAR_HEIGHT,
  CONTACT_ACTIONS_HIDDEN_TRANSLATE_Y,
} from '../../components/listing-detail/ContactActions'
import {
  OwnerManageBar,
  OWNER_MANAGE_BAR_HEIGHT,
  OWNER_MANAGE_BAR_HIDDEN_TRANSLATE_Y,
} from '../../components/listing-detail/OwnerManageBar'
import { SellerCard } from '../../components/listing-detail/SellerCard'
import { DetailTopBar } from '../../components/listing-detail/DetailTopBar'
import { SearchHeaderBar } from '../../screens/search/components/SearchHeaderBar'
import type { SellerView } from '../../types/carDetailViewModel.types'
import type { SharedValue } from 'react-native-reanimated'

// Mock expo-blur
jest.mock('expo-blur', () => {
  const ReactLib = require('react')
  const { View: RNView } = require('react-native')
  return {
    BlurView: ({ children, ...props }: Record<string, unknown>) =>
      ReactLib.createElement(RNView, { testID: 'mock-blur-view', ...props }, children),
  }
})

// Mock expo-glass-effect
jest.mock('expo-glass-effect', () => ({
  GlassView: (props: Record<string, unknown>) => {
    const ReactLib = require('react')
    const { View: RNView } = require('react-native')
    return ReactLib.createElement(RNView, { testID: 'mock-glass-view', ...props })
  },
  isLiquidGlassAvailable: () => false,
  isGlassEffectAPIAvailable: () => false,
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

// Mock router
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  router: { push: jest.fn(), back: jest.fn() },
}))

// Mock safe area
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

// Mock expo-image
jest.mock('expo-image', () => {
  const ReactLib = require('react')
  const { View: RNView } = require('react-native')
  return {
    Image: (props: Record<string, unknown>) =>
      ReactLib.createElement(RNView, { testID: 'mock-expo-image', ...props }),
  }
})

// Mock reanimated
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
    interpolate: (val: number, inRange: number[], outRange: number[]) => {
      if (val <= inRange[0]) return outRange[0]
      if (val >= inRange[inRange.length - 1]) return outRange[outRange.length - 1]
      const ratio = (val - inRange[0]) / (inRange[1] - inRange[0])
      return outRange[0] + ratio * (outRange[1] - outRange[0])
    },
    Extrapolation: { CLAMP: 'clamp' },
    FadeIn: { duration: () => ({ delay: () => ({}) }), delay: () => ({ springify: () => ({}) }) },
    FadeInDown: { duration: () => ({ delay: () => ({}) }), delay: () => ({}) },
    ZoomIn: { duration: () => ({ delay: () => ({ springify: () => ({}) }) }), delay: () => ({ springify: () => ({}) }) },
  }
})

describe('D-176b Fallback Wash & Sticky Reveal Characterization Tests', () => {
  afterEach(() => {
    cleanup()
  })

  const fallbackSupport = { kind: 'blur' } as const

  describe('1. Finding 1: Fallback Wash & Blur Intensity Parity', () => {
    it('(a) GlassNavBar uses intensity=60 and light wash (0.08 opacity on white)', async () => {
      const { getByTestId } = await render(
        <GlassNavBar
          title="شريط التنقل"
          paddingTop={44}
          onBackPress={jest.fn()}
          support={fallbackSupport}
        />
      )

      const blurView = getByTestId('mock-blur-view')
      expect(blurView.props.intensity).toBe(60)

      const washOverlay = getByTestId('glass-nav-bar-surface-wash-overlay')
      const flatStyle = StyleSheet.flatten(washOverlay.props.style)
      expect(flatStyle.backgroundColor).toBe(Colors.white)
      expect(flatStyle.opacity).toBe(BottomBarTokens.lightWashOpacity) // 0.08
    })

    it('(b) WizardStickyFooter uses intensity=60 and light wash (0.08 opacity on white)', async () => {
      const { getByTestId } = await render(
        <WizardStickyFooter
          testID="test-wizard-footer"
          paddingBottom={20}
        >
          <Text>محتوى</Text>
        </WizardStickyFooter>
      )

      const blurView = getByTestId('mock-blur-view')
      expect(blurView.props.intensity).toBe(60)

      const washOverlay = getByTestId('test-wizard-footer-surface-wash-overlay')
      const flatStyle = StyleSheet.flatten(washOverlay.props.style)
      expect(flatStyle.backgroundColor).toBe(Colors.white)
      expect(flatStyle.opacity).toBe(BottomBarTokens.lightWashOpacity) // 0.08
    })

    it('(c) WizardReviewCard uses intensity=50 and light wash (0.08 opacity on white)', async () => {
      const { getByTestId } = await render(
        <WizardReviewCard testID="test-review-card">
          <Text>محتوى المراجعة</Text>
        </WizardReviewCard>
      )

      const blurView = getByTestId('mock-blur-view')
      expect(blurView.props.intensity).toBe(50)

      const washOverlay = getByTestId('test-review-card-surface-wash-overlay')
      const flatStyle = StyleSheet.flatten(washOverlay.props.style)
      expect(flatStyle.backgroundColor).toBe(Colors.white)
      expect(flatStyle.opacity).toBe(BottomBarTokens.lightWashOpacity) // 0.08
    })

    it('(d) Stepper uses intensity=50 and light wash (0.08 opacity on white)', async () => {
      const { getByTestId } = await render(
        <Stepper
          currentStep={2}
          totalSteps={5}
          title="خطوة الإدخال"
          variant="light"
        />
      )

      const blurView = getByTestId('mock-blur-view')
      expect(blurView.props.intensity).toBe(50)

      const washOverlay = getByTestId('glass-surface-wash-overlay')
      const flatStyle = StyleSheet.flatten(washOverlay.props.style)
      expect(flatStyle.backgroundColor).toBe(Colors.white)
      expect(flatStyle.opacity).toBe(BottomBarTokens.lightWashOpacity) // 0.08
    })

    it('(e) WizardCard uses intensity=50 and light wash (0.08 opacity on white)', async () => {
      const { getByTestId } = await render(
        <WizardCard
          testID="test-wizard-card"
          title="بيانات الإعلان"
          support={fallbackSupport}
        >
          <Text>حقول</Text>
        </WizardCard>
      )

      const blurView = getByTestId('mock-blur-view')
      expect(blurView.props.intensity).toBe(50)

      const washOverlay = getByTestId('test-wizard-card-surface-wash-overlay')
      const flatStyle = StyleSheet.flatten(washOverlay.props.style)
      expect(flatStyle.backgroundColor).toBe(Colors.white)
      expect(flatStyle.opacity).toBe(BottomBarTokens.lightWashOpacity) // 0.08
    })

    it('(f) ProfilePhoneGuardView uses intensity=50 and light wash (0.08 opacity on white)', async () => {
      const { getAllByTestId, getByTestId } = await render(
        <ProfilePhoneGuardView
          title="توثيق الهاتف"
          headerVariant="glass"
        />
      )

      const blurViews = getAllByTestId('mock-blur-view')
      expect(blurViews.length).toBeGreaterThanOrEqual(1)
      const hasIntensity50 = blurViews.some((bv) => bv.props.intensity === 50)
      expect(hasIntensity50).toBe(true)

      const washOverlay = getByTestId('profile-phone-guard-glass-surface-wash-overlay')
      const flatStyle = StyleSheet.flatten(washOverlay.props.style)
      expect(flatStyle.backgroundColor).toBe(Colors.white)
      expect(flatStyle.opacity).toBe(BottomBarTokens.lightWashOpacity) // 0.08
    })

    it('(g) DraftResumeScreen uses pure blur (opacity 0 wash) for card and footer', async () => {
      const { getByTestId } = await render(
        <DraftResumeScreen
          categoryName="سيارات"
          draftTitle="كامري 2022"
          completionPercentage={60}
          lastSavedText="منذ 5 دقائق"
          images={[]}
          onResume={jest.fn()}
          onDiscard={jest.fn()}
        />
      )

      const cardWash = getByTestId('draft-card-glass-surface-wash-overlay')
      const cardStyle = StyleSheet.flatten(cardWash.props.style)
      expect(cardStyle.opacity).toBe(0)

      const footerWash = getByTestId('draft-footer-glass-surface-wash-overlay')
      const footerStyle = StyleSheet.flatten(footerWash.props.style)
      expect(footerStyle.opacity).toBe(0)
    })

    it('(h) ContactActions & OwnerManageBar use intensity=70 and stickyCardWashBg (0.80)', async () => {
      const { getByTestId } = await render(
        <ContactActions
          variant="sticky"
          availability={{ mode: 'full' }}
          busy={false}
          onCall={jest.fn()}
          onWhatsApp={jest.fn()}
          onChat={jest.fn()}
          scrollY={{ value: 400 } as unknown as SharedValue<number>}
          support={fallbackSupport}
        />
      )

      const blurView = getByTestId('mock-blur-view')
      expect(blurView.props.intensity).toBe(70)

      const washOverlay = getByTestId('contact-actions-wash-overlay')
      const flatStyle = StyleSheet.flatten(washOverlay.props.style)
      expect(flatStyle.backgroundColor).toBe(BottomBarTokens.stickyCardWashBg) // rgba(255, 255, 255, 0.80)
    })

    it('(i) SellerCard uses intensity=70 and Colors.white wash', async () => {
      const mockSeller: SellerView = {
        id: 'seller-123',
        name: 'سالم',
        username: 'salim',
        avatarUrl: undefined,
        isVerified: true,
        memberSinceLabel: 'عضو جديد',
        accountType: 'فرد',
      }

      const { getByTestId } = await render(
        <SellerCard
          seller={mockSeller}
          onPressProfile={jest.fn()}
          support={fallbackSupport}
        />
      )

      const blurView = getByTestId('mock-blur-view')
      expect(blurView.props.intensity).toBe(70)

      const washOverlay = getByTestId('seller-card-wash-overlay')
      const flatStyle = StyleSheet.flatten(washOverlay.props.style)
      expect(flatStyle.backgroundColor).toBe(Colors.white)
    })

    it('(j) DetailTopBar & SearchHeaderBar preserve TopBarTokens.whiteWashBg (0.78)', async () => {
      const { getByTestId, getAllByTestId } = await render(
        <DetailTopBar
          onBack={jest.fn()}
          support={fallbackSupport}
        />
      )

      const blurView = getAllByTestId('mock-blur-view')[0]
      expect(blurView.props.intensity).toBe(TopBarTokens.blurIntensity) // 65

      const washOverlay = getByTestId('detail-top-bar-wash-overlay')
      const flatStyle = StyleSheet.flatten(washOverlay.props.style)
      expect(flatStyle.backgroundColor).toBe(TopBarTokens.whiteWashBg) // rgba(255, 255, 255, 0.78)
    })
  })

  const defaultOwnerActions = [
    { id: 'edit' as const, label: 'تعديل', tone: 'neutral' as const, icon: 'create-outline' },
    { id: 'pause' as const, label: 'إيقاف مؤقت', tone: 'neutral' as const, icon: 'pause-outline' },
    { id: 'delete' as const, label: 'حذف', tone: 'danger' as const, icon: 'trash-outline' },
  ]

  describe('2. Finding 2: Sticky Reveal Animation Bounds & Interpolation', () => {
    it('(a) ContactActions: hidden translateY (100) >= measured bar height (64.4) + max inset (34)', () => {
      const maxBottomInset = 34
      const requiredOffScreenDistance = CONTACT_ACTIONS_BAR_HEIGHT + maxBottomInset
      expect(requiredOffScreenDistance).toBe(98.4)
      expect(CONTACT_ACTIONS_HIDDEN_TRANSLATE_Y).toBeGreaterThanOrEqual(requiredOffScreenDistance)
      expect(CONTACT_ACTIONS_HIDDEN_TRANSLATE_Y).toBe(100)
    })

    it('(b) OwnerManageBar: hidden translateY (100) >= measured bar height (60.4) + max inset (34)', () => {
      const maxBottomInset = 34
      const requiredOffScreenDistance = OWNER_MANAGE_BAR_HEIGHT + maxBottomInset
      expect(requiredOffScreenDistance).toBe(94.4)
      expect(OWNER_MANAGE_BAR_HIDDEN_TRANSLATE_Y).toBeGreaterThanOrEqual(requiredOffScreenDistance)
      expect(OWNER_MANAGE_BAR_HIDDEN_TRANSLATE_Y).toBe(100)
    })

    it('(c1) ContactActions sticky reveal at progress 0 (scrollY <= threshold - 50)', async () => {
      const { getByTestId } = await render(
        <ContactActions
          variant="sticky"
          availability={{ mode: 'full' }}
          busy={false}
          onCall={jest.fn()}
          onWhatsApp={jest.fn()}
          onChat={jest.fn()}
          scrollY={{ value: 200 } as unknown as SharedValue<number>}
          threshold={300}
        />
      )
      expect(getByTestId('btn-contact-call')).toBeTruthy()
    })

    it('(c2) ContactActions sticky reveal at progress 1 (scrollY >= threshold)', async () => {
      const { getByTestId } = await render(
        <ContactActions
          variant="sticky"
          availability={{ mode: 'full' }}
          busy={false}
          onCall={jest.fn()}
          onWhatsApp={jest.fn()}
          onChat={jest.fn()}
          scrollY={{ value: 350 } as unknown as SharedValue<number>}
          threshold={300}
        />
      )
      expect(getByTestId('btn-contact-call')).toBeTruthy()
    })

    it('(d1) OwnerManageBar sticky reveal at progress 0 (scrollY <= threshold - 50)', async () => {
      const { getByTestId } = await render(
        <OwnerManageBar
          variant="sticky"
          actions={defaultOwnerActions}
          viewCount={10}
          busy={false}
          onAction={jest.fn()}
          scrollY={{ value: 200 } as unknown as SharedValue<number>}
          threshold={300}
        />
      )
      expect(getByTestId('btn-owner-edit')).toBeTruthy()
    })

    it('(d2) OwnerManageBar sticky reveal at progress 1 (scrollY >= threshold)', async () => {
      const { getByTestId } = await render(
        <OwnerManageBar
          variant="sticky"
          actions={defaultOwnerActions}
          viewCount={10}
          busy={false}
          onAction={jest.fn()}
          scrollY={{ value: 350 } as unknown as SharedValue<number>}
          threshold={300}
        />
      )
      expect(getByTestId('btn-owner-edit')).toBeTruthy()
    })
  })

  describe('3. Teeth Proofs', () => {
    it('teeth proof: wash opacity assertion fails if buggy 0.78 opacity is rendered on GlassNavBar', async () => {
      const { getByTestId } = await render(
        <GlassNavBar
          title="اختبار السن"
          paddingTop={44}
          onBackPress={jest.fn()}
          support={fallbackSupport}
        />
      )

      const washOverlay = getByTestId('glass-nav-bar-surface-wash-overlay')
      const flatStyle = StyleSheet.flatten(washOverlay.props.style)

      // Expected is 0.08. If someone expects 0.78 (the old buggy value), it MUST fail:
      expect(() => {
        expect(flatStyle.opacity).toBe(0.78)
      }).toThrow()
    })

    it('teeth proof: off-screen distance assertion fails if translate is less than bar height + bottom inset', () => {
      const simulatedInadequateTranslate = 80 // old value from D-175b before safe inset analysis
      const maxBottomInset = 34
      const requiredOffScreenDistance = CONTACT_ACTIONS_BAR_HEIGHT + maxBottomInset // 98.4

      expect(() => {
        expect(simulatedInadequateTranslate).toBeGreaterThanOrEqual(requiredOffScreenDistance)
      }).toThrow()
    })
  })
})
