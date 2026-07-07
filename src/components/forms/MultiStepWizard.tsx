import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { Stepper } from '../ui/Stepper'
import { AppButton } from '../ui/AppButton'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface MultiStepWizardProps {
  steps: { title: string; component: React.ReactNode }[]
  onComplete: () => void
  isLoading?: boolean
  initialStep?: number
  bannerTitle?: string
}

export function MultiStepWizard({ steps, onComplete, isLoading = false, initialStep = 1, bannerTitle }: MultiStepWizardProps) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const insets = useSafeAreaInsets()

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1)
    } else {
      onComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const CurrentComponent = steps[currentStep - 1].component

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progressWrap}>
          <Stepper 
            currentStep={currentStep} 
            totalSteps={steps.length} 
            title={bannerTitle || steps[currentStep - 1].title} 
          />
        </View>
        
        <View style={styles.stepContainer}>
          {CurrentComponent}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { bottom: Math.max(insets.bottom, Spacing.space4) }]}>
        <AppButton 
          title="السابق" 
          variant="outline" 
          onPress={handlePrev} 
          style={[styles.prevButton, currentStep === 1 && { display: 'none' }]} 
          disabled={isLoading || currentStep === 1}
        />
        <AppButton 
          title={currentStep === steps.length ? 'إرسال' : 'التالي'} 
          onPress={handleNext} 
          style={styles.nextButton} 
          loading={isLoading}
        />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: Spacing.space4,
    paddingBottom: 100,
  },
  progressWrap: {
    marginBottom: Spacing.space6,
  },
  stepContainer: {
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.space4,
    flexDirection: 'row',
    gap: Spacing.space3,
  },
  prevButton: {
    flex: 1,
  },
  nextButton: {
    flex: 1,
  }
})
