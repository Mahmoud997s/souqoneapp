import React from 'react'
import { router } from 'expo-router'
import { useServiceWizardStore } from '../../src/store/serviceWizardStore'
import { confirmClearDraft } from '../../src/utils/confirmClearDraft'
import { DraftResumeScreen } from '../../src/components/post/DraftResumeScreen'

export default function ServiceDraftsScreen() {
  const { formData, currentStep, reset } = useServiceWizardStore()

  const handleResume = () => {
    router.replace('/services/new')
  }

  const handleDiscard = () => {
    confirmClearDraft(
      () => {
        reset()
        router.replace('/services/new')
      },
      'هل أنت متأكد؟ سيتم حذف جميع البيانات المدخلة.'
    )
  }

  // Calculate completion percentage based on 6 steps
  const completionPercentage = Math.min(Math.round((currentStep / 6) * 100), 100)

  const title = formData.title || 'بدون عنوان'
  const draftImages = [
    ...(formData.images?.map((img: any) => img.uri || img) || []),
    ...(formData.existingImages?.map((img: any) => img.url || img) || []),
  ].filter(Boolean)

  return (
    <DraftResumeScreen
      categoryName="خدمات السيارات"
      draftTitle={title}
      images={draftImages}
      completionPercentage={completionPercentage}
      onResume={handleResume}
      onDiscard={handleDiscard}
    />
  )
}
