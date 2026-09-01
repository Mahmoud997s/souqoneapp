import React from 'react'
import { router } from 'expo-router'
import { usePartWizardStore } from '../../src/store/partWizardStore'
import { dialogService } from '../../src/store/dialogStore'
import { DraftResumeScreen } from '../../src/components/post/DraftResumeScreen'

export default function PartDraftsScreen() {
  const { formData, currentStep, reset } = usePartWizardStore()

  const handleResume = () => {
    router.replace('/parts/new')
  }

  const handleDiscard = () => {
    dialogService.confirm(
      'مسح المسودة',
      'هل أنت متأكد؟ سيتم حذف جميع البيانات المدخلة.',
      () => {
        reset()
        router.replace('/parts/new')
      },
      'نعم، امسح البيانات',
      'تراجع',
      true
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
      categoryName="قطع غيار"
      draftTitle={title}
      images={draftImages}
      completionPercentage={completionPercentage}
      onResume={handleResume}
      onDiscard={handleDiscard}
    />
  )
}
