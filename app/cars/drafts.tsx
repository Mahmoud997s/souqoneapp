import React from 'react'
import { router } from 'expo-router'
import { useCarWizardStore } from '../../src/store/carWizardStore'
import { dialogService } from '../../src/store/dialogStore'
import { DraftResumeScreen } from '../../src/components/post/DraftResumeScreen'

export default function CarDraftsScreen() {
  const { formData, currentStep, resetForm } = useCarWizardStore()
  
  const handleResume = () => {
    router.replace('/cars/new')
  }

  const handleDiscard = () => {
    dialogService.confirm(
      'مسح المسودة',
      'هل أنت متأكد؟ سيتم حذف جميع البيانات المدخلة.',
      () => {
        resetForm()
        router.replace('/cars/new')
      },
      'نعم، امسح البيانات',
      'تراجع',
      true
    )
  }
  
  // Calculate a rough completion percentage based on steps (5 steps total)
  // Step 1: 20%, Step 2: 40%, etc.
  const completionPercentage = Math.min(Math.round((currentStep / 5) * 100), 100)
  
  const title = formData.title || `${formData.brandId || ''} ${formData.model || ''}`.trim() || 'بدون عنوان'

  return (
    <DraftResumeScreen
      categoryName="سيارات"
      draftTitle={title}
      completionPercentage={completionPercentage}
      onResume={handleResume}
      onDiscard={handleDiscard}
    />
  )
}
