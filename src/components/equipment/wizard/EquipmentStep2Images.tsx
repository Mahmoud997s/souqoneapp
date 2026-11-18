import React from 'react'
import { WizardImagesStep } from '../../wizard/WizardImagesStep'
import { EquipmentStep2Props } from '../../../types/equipmentForm.types'
import { MAX_EQUIPMENT_IMAGES } from '../../../constants/equipment'

export function EquipmentStep2Images(props: EquipmentStep2Props) {
  return (
    <WizardImagesStep
      {...props}
      maxImages={MAX_EQUIPMENT_IMAGES}
      uploadTitle="إرفاق صور واضحة للمعدة"
      existingSubtitle="يمكنك حذف أي صورة غير مناسبة بالضغط على علامة الإغلاق"
    />
  )
}
