import React from 'react'
import { router } from 'expo-router'
import { useEquipmentWizardStore } from '../../src/store/equipmentWizardStore'
import { dialogService } from '../../src/store/dialogStore'
import { DraftResumeScreen } from '../../src/components/post/DraftResumeScreen'

export default function EquipmentDraftsScreen() {
  const { formData, currentStep, resetDraft } = useEquipmentWizardStore()

  const handleResume = () => {
    router.replace('/equipment/new')
  }

  const handleDiscard = () => {
    dialogService.confirm(
      'مسح المسودة',
      'هل أنت متأكد؟ سيتم حذف جميع البيانات المدخلة.',
      () => {
        resetDraft()
        router.replace('/equipment/new')
      },
      'نعم، امسح البيانات',
      'تراجع',
      true
    )
  }

  // Calculate completion percentage based on 5 steps
  const completionPercentage = Math.min(Math.round((currentStep / 5) * 100), 100)

  const title = formData.title || 'مسودة معدة جديدة'
  const draftImages = [
    ...(formData.images?.map((img: any) => img.uri || img) || []),
    ...(formData.existingImages?.map((img: any) => img.url || img) || []),
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
