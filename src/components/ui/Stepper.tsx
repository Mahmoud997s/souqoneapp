import React from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Gradients } from '../../constants/gradients'

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

interface StepperProps {
  currentStep: number
  totalSteps: number
  title?: string
  variant?: 'dark' | 'light'
}

export function Stepper({ currentStep, totalSteps, title, variant = 'dark' }: StepperProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1)
  const isLight = variant === 'light'

  const body = (
    <>
      {title && (
        <Animated.Text entering={FadeIn.delay(200)} style={[s.bannerTitle, isLight && s.bannerTitleLight]}>
          {title}
        </Animated.Text>
      )}
      <View style={s.stepperContainer}>
        {steps.map((step, index) => {
          const isActive = step <= currentStep
          const isLast = index === steps.length - 1
          const isLineActive = step < currentStep

          return (
            <React.Fragment key={step}>
              {/* Circle */}
              <Animated.View
                entering={ZoomIn.delay(index * 150).springify()}
                style={[
                  s.circle,
                  isLight && s.circleLight,
                  isActive && (isLight ? s.circleActiveLight : s.circleActive),
                ]}
              >
                <Text style={[s.stepText, isLight && s.stepTextLight, isActive && s.stepTextActive]}>
                  {step}
                </Text>
              </Animated.View>

              {/* Connecting Line */}
              {!isLast && (
                <Animated.View
                  entering={FadeIn.delay(index * 150 + 100)}
                  style={[
                    s.line,
                    isLight && s.lineLight,
                    isLineActive && (isLight ? s.lineActiveLight : s.lineActive),
                  ]}
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
      <AnimatedBlurView
        entering={FadeIn.duration(400)}
        intensity={50}
        tint="light"
        experimentalBlurMethod="dimezisBlurView"
        style={[s.banner, s.bannerLight]}
      >
        {/* Same wash + tint formula used across the rest of this session's glass surfaces */}
        <View style={s.whiteWash} pointerEvents="none" />
        <View style={s.tint} pointerEvents="none" />
        {body}
      </AnimatedBlurView>
    )
  }

  return (
    <Animated.View entering={FadeIn.duration(400)} style={[s.banner, { overflow: 'hidden' }]}>
      <LinearGradient colors={Gradients.hero as any} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { opacity: 0.8 }]} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <Path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#grid)" />
        </Svg>
      </View>
      {body}
    </Animated.View>
  )
}

const s = StyleSheet.create({
  banner: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: Spacing.space4,
    paddingHorizontal: Spacing.space5,
    marginBottom: Spacing.space2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  bannerTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 17,
    lineHeight: 23,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.space4,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  circleActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
    ...Platform.select({
      ios: {
        shadowColor: Colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  stepText: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 15,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
  stepTextActive: {
    color: Colors.white,
  },
  line: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: -2,
    zIndex: 1,
    borderRadius: 2,
  },
  lineActive: {
    backgroundColor: Colors.accent,
  },

  /* Light glass variant — matches GlassNavBar's palette */
  bannerLight: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
    borderColor: 'rgba(255,255,255,0.6)',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 1.5 },
    }),
  },
  whiteWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    opacity: 0.08,
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primary,
    opacity: 0.04,
  },
  bannerTitleLight: {
    color: Colors.text,
  },
  circleLight: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  circleActiveLight: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },
  stepTextLight: {
    color: '#94A3B8',
  },
  lineLight: {
    backgroundColor: '#E2E8F0',
  },
  lineActiveLight: {
    backgroundColor: Colors.primary,
  },
})
