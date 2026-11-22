import React from 'react'
import { router } from 'expo-router'
import { useCarWizardStore } from '../../src/store/carWizardStore'
import { confirmClearDraft } from '../../src/utils/confirmClearDraft'
import { DraftResumeScreen } from '../../src/components/post/DraftResumeScreen'

export default function CarDraftsScreen() {
  const { formData, currentStep, resetForm } = useCarWizardStore()
  
  const handleResume = () => {
    router.replace('/cars/new')
  }

  const handleDiscard = () => {
    confirmClearDraft(
      () => {
        resetForm()
        router.replace('/cars/new')
      },
      'هل أنت متأكد؟ سيتم حذف جميع البيانات المدخلة.'
    )
  }
  
  // Calculate a rough completion percentage based on steps (5 steps total)
  // Step 1: 20%, Step 2: 40%, etc.
  const completionPercentage = Math.min(Math.round((currentStep / 5) * 100), 100)
  
  const title = formData.title || `${formData.brandId || ''} ${formData.model || ''}`.trim() || 'بدون عنوان'
  const draftImages = [
    ...(formData.images?.map((img: any) => img.uri || img) || []),
    ...(formData.existingImages?.map((img: any) => img.url || img) || []),
  ].filter(Boolean)

  return (
    <DraftResumeScreen
      categoryName="سيارات"
      draftTitle={title}
      images={draftImages}
      completionPercentage={completionPercentage}
      onResume={handleResume}
      onDiscard={handleDiscard}
    />
  )
}
