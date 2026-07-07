import React from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'

interface StepperProps {
  currentStep: number
  totalSteps: number
  title?: string
}

export function Stepper({ currentStep, totalSteps, title }: StepperProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1)

  return (
    <Animated.View entering={FadeIn.duration(400)} style={s.banner}>
      {title && (
        <Animated.Text entering={FadeIn.delay(200)} style={s.bannerTitle}>
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
                style={[s.circle, isActive && s.circleActive]}
              >
                <Text style={[s.stepText, isActive && s.stepTextActive]}>
                  {step}
                </Text>
              </Animated.View>

              {/* Connecting Line */}
              {!isLast && (
                <Animated.View
                  entering={FadeIn.delay(index * 150 + 100)}
                  style={[s.line, isLineActive && s.lineActive]}
                />
              )}
            </React.Fragment>
          )
        })}
      </View>
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
    fontSize: 16,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.space4,
    includeFontPadding: false,
    paddingTop: 4,
    paddingBottom: 4,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    includeFontPadding: false,
    paddingTop: 2,
  },
  stepTextActive: {
    color: Colors.white,
  },
  line: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: -2,
    zIndex: 1,
    borderRadius: 1.5,
  },
  lineActive: {
    backgroundColor: Colors.accent,
  },
})
