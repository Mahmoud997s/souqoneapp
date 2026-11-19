import React from 'react'
import { router } from 'expo-router'
import { useEquipmentWizardStore } from '../../src/store/equipmentWizardStore'
import { confirmClearDraft } from '../../src/utils/confirmClearDraft'
import { DraftResumeScreen } from '../../src/components/post/DraftResumeScreen'

export default function EquipmentDraftsScreen() {
  const { formData, currentStep, resetDraft } = useEquipmentWizardStore()

  const handleResume = () => {
    router.replace('/equipment/new')
  }

  const handleDiscard = () => {
    confirmClearDraft(
      () => {
        resetDraft()
        router.replace('/equipment/new')
      },
      'هل أنت متأكد؟ سيتم حذف جميع البيانات المدخلة.'
    )
  }

  // Calculate completion percentage based on 5 steps
  const completionPercentage = Math.min(Math.round((currentStep / 5) * 100), 100)

  const title = formData.title || 'مسودة معدة جديدة'
  const draftImages = [
    ...(formData.images?.map((img: string | { uri?: string; url?: string }) =>
      typeof img === 'string' ? img : img.uri || img.url || ''
    ) || []),
    ...(formData.existingImages?.map((img: string | { url?: string; uri?: string }) =>
      typeof img === 'string' ? img : img.url || img.uri || ''
    ) || []),
  ].filter(Boolean)

  return (
    <DraftResumeScreen
      categoryName="معدات ثقيلة"
      draftTitle={title}
      images={draftImages}
      completionPercentage={completionPercentage}
      onResume={handleResume}
      onDiscard={handleDiscard}
    />
  )
}
