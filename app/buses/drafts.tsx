import React from 'react'
import { router } from 'expo-router'
import { useBusWizardStore } from '../../src/store/busWizardStore'
import { confirmClearDraft } from '../../src/utils/confirmClearDraft'
import { DraftResumeScreen } from '../../src/components/post/DraftResumeScreen'

export default function BusDraftsScreen() {
  const { data, currentStep, reset } = useBusWizardStore()

  const handleResume = () => {
    router.replace('/buses/new')
  }

  const handleDiscard = () => {
    confirmClearDraft(
      () => {
        reset()
        router.replace('/buses/new')
      },
      'هل أنت متأكد؟ سيتم حذف جميع البيانات المدخلة.'
    )
  }

  // Calculate completion percentage based on 6 steps
  const completionPercentage = Math.min(Math.round((currentStep / 6) * 100), 100)

  const title = data.title || 'مسودة حافلة جديدة'
  const draftImages = [
    ...(data.images?.map((img: any) => img.uri || img) || []),
    ...(data.existingImages?.map((img: any) => img.url || img) || []),
  ].filter(Boolean)

  return (
    <DraftResumeScreen
      categoryName="حافلات"
      draftTitle={title}
      images={draftImages}
      completionPercentage={completionPercentage}
      onResume={handleResume}
      onDiscard={handleDiscard}
    />
  )
}
