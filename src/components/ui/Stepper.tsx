import React, { useEffect } from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { GlassSurface } from '../navigation/glassSupport'
import { BottomBarTokens } from '../../constants/bottomBarTokens'
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Gradients } from '../../constants/gradients'
import { useAppReducedMotion } from '../../utils/listing-detail/useAppReducedMotion'

interface StepperProps {
  currentStep: number
  totalSteps: number
  title?: string
  variant?: 'dark' | 'light'
}

const TRANSITION_DURATION_MS = 250
const TRANSITION_EASING = Easing.out(Easing.cubic)

function StepperConnector({
  step,
  isDone,
  isLight,
  reducedMotion,
}: {
  step: number
  isDone: boolean
  isLight: boolean
  reducedMotion: boolean
}) {
  const progress = useSharedValue(isDone ? 1 : 0)

  useEffect(() => {
    const target = isDone ? 1 : 0
    progress.value = reducedMotion
      ? target
      : withTiming(target, { duration: TRANSITION_DURATION_MS, easing: TRANSITION_EASING })
  }, [isDone, reducedMotion, progress])

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
    opacity: progress.value > 0 ? 1 : 0,
  }))

  return (
    <View
      testID={`stepper-connector-${step}`}
      style={[s.line, isLight && s.lineLight]}
    >
      <Animated.View
        style={[
          s.lineFill,
          isLight ? s.lineActiveLight : s.lineActive,
          fillStyle,
        ]}
      />
    </View>
  )
}

function CurrentStepRing({
  isLight,
  reducedMotion,
}: {
  isLight: boolean
  reducedMotion: boolean
}) {
  const anim = useSharedValue(reducedMotion ? 1 : 0.85)

  useEffect(() => {
    if (reducedMotion) {
      anim.value = 1
      return
    }
    anim.value = 0.85
    anim.value = withTiming(1, { duration: TRANSITION_DURATION_MS, easing: TRANSITION_EASING })
  }, [reducedMotion, anim])

  const ringAnimStyle = useAnimatedStyle(() => ({
    opacity: anim.value,
    transform: [{ scale: anim.value }],
  }))

  return (
    <Animated.View
      testID="stepper-current-ring"
      pointerEvents="none"
      style={[
        s.currentRing,
        isLight ? s.currentRingLight : s.currentRingDark,
        ringAnimStyle,
      ]}
    />
  )
}

export function Stepper({ currentStep, totalSteps, title, variant = 'dark' }: StepperProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1)
  const isLight = variant === 'light'
  const reducedMotion = useAppReducedMotion()
  const stepCaption = `الخطوة ${currentStep} من ${totalSteps}`

  const body = (
    <>
      {title && (
        <View style={s.headerWrap}>
          <Text style={[s.bannerTitle, isLight && s.bannerTitleLight]}>
            {title}
          </Text>
          <Text style={[s.captionText, isLight && s.captionTextLight]}>
            {stepCaption}
          </Text>
        </View>
      )}
      <View style={s.stepperContainer}>
        {steps.map((step, index) => {
          const isDone = step < currentStep
          const isCurrent = step === currentStep
          const isLast = index === steps.length - 1

          return (
            <React.Fragment key={step}>
              <View style={s.stepNodeWrap}>
                {isCurrent && (
                  <CurrentStepRing isLight={isLight} reducedMotion={reducedMotion} />
                )}
                <View
                  testID={`stepper-circle-${step}`}
                  style={[
                    s.circle,
                    isLight ? s.circleUpcomingLight : s.circleUpcomingDark,
                    (isDone || isCurrent) && (isLight ? s.circleFilledLight : s.circleFilledDark),
                  ]}
                >
                  {isDone ? (
                    <Ionicons
                      testID={`stepper-check-${step}`}
                      name="checkmark"
                      size={16}
                      color={Colors.white}
                    />
                  ) : (
                    <Text
                      style={[
                        s.stepText,
                        isLight && s.stepTextLight,
                        isCurrent && s.stepTextActive,
                      ]}
                    >
                      {step}
                    </Text>
                  )}
                </View>
              </View>

              {!isLast && (
                <StepperConnector
                  step={step}
                  isDone={isDone}
                  isLight={isLight}
                  reducedMotion={reducedMotion}
                />
              )}
            </React.Fragment>
          )
        })}
      </View>
    </>
  )

  if (isLight) {
    return (
      <View
        accessibilityLabel={stepCaption}
        style={[s.banner, s.bannerLight]}
      >
        <GlassSurface
          variant="surface"
          borderRadius={Radius.lg}
          noBorder
          intensity={50}
          washColor={Colors.white}
          washOpacity={BottomBarTokens.lightWashOpacity}
        />
        <View style={s.tint} pointerEvents="none" />
        {body}
      </View>
    )
  }

  return (
    <View
      accessibilityLabel={stepCaption}
      style={[s.banner, { overflow: 'hidden' }]}
    >
      <LinearGradient colors={Gradients.hero as any} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { opacity: 0.8 }]} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <Path d="M 40 0 L 0 0 0 40" fill="none" stroke={Colors.whiteAlpha20} strokeWidth="1" />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#grid)" />
        </Svg>
      </View>
      {body}
    </View>
  )
}

const s = StyleSheet.create({
  banner: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.space4,
    paddingHorizontal: Spacing.space5,
    marginBottom: Spacing.space2,
    borderWidth: 1,
    borderColor: Colors.whiteAlpha20,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  headerWrap: {
    alignItems: 'center',
    marginBottom: Spacing.space3,
    gap: 2,
  },
  bannerTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    lineHeight: 22,
    color: Colors.white,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  bannerTitleLight: {
    color: Colors.text,
  },
  captionText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.whiteAlpha85,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  captionTextLight: {
    color: Colors.textMuted,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepNodeWrap: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  currentRing: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
  },
  currentRingLight: {
    borderColor: Colors.primary,
  },
  currentRingDark: {
    borderColor: Colors.whiteAlpha85,
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.transparent,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleUpcomingDark: {
    borderColor: Colors.whiteAlpha45,
    backgroundColor: Colors.transparent,
  },
  circleUpcomingLight: {
    borderColor: Colors.slateBorderStrong,
    backgroundColor: Colors.transparent,
  },
  circleFilledDark: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  circleFilledLight: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 17,
    color: Colors.whiteAlpha45,
    textAlign: 'center',
  },
  stepTextLight: {
    color: Colors.textMuted,
  },
  stepTextActive: {
    fontFamily: 'Almarai_800ExtraBold',
    color: Colors.white,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.whiteAlpha20,
    marginHorizontal: -2,
    zIndex: 1,
    borderRadius: 1,
    overflow: 'hidden',
  },
  lineLight: {
    backgroundColor: Colors.border,
  },
  lineFill: {
    ...StyleSheet.absoluteFill,
    borderRadius: 1,
  },
  lineActive: {
    backgroundColor: Colors.accent,
  },
  lineActiveLight: {
    backgroundColor: Colors.primary,
  },

  /* Light glass variant — matches GlassNavBar's palette */
  bannerLight: {
    backgroundColor: Colors.transparent,
    overflow: 'hidden',
    borderColor: Colors.whiteAlpha60,
    ...Platform.select({
      ios: {
        shadowColor: Colors.slateHeading,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 1.5 },
    }),
  },
  tint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.primary,
    opacity: 0.04,
  },
})
