import React from 'react'
import { WizardImagesStep } from '../../wizard/WizardImagesStep'
import { EquipmentStep2Props } from '../../../types/equipmentForm.types'

export function EquipmentStep2Images(props: EquipmentStep2Props) {
  return (
    <WizardImagesStep
      {...props}
      maxImages={10}
      uploadTitle="إرفاق صور واضحة للمعدة"
      existingSubtitle="يمكنك حذف أي صورة غير مناسبة بالضغط على علامة الإغلاق"
    />
  )
}
