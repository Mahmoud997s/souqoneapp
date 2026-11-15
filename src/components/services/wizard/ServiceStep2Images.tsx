import React from 'react'
import { WizardImagesStep } from '../../wizard/WizardImagesStep'
import { ServiceStep2Props } from '../../../types/serviceForm.types'
import { MAX_SERVICE_IMAGES } from '../../../constants/services'

export function ServiceStep2Images(props: ServiceStep2Props) {
  return (
    <WizardImagesStep
      {...props}
      maxImages={MAX_SERVICE_IMAGES}
      uploadTitle="إرفاق صور واضحة للخدمة أو المركز"
      requiredBadge="مطلوب"
      uploadBoxTestID="upload-box"
      removeTestIdStyle="image"
    />
  )
}
