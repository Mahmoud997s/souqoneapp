import React from 'react'
import { WizardImagesStep } from '../../wizard/WizardImagesStep'
import { CarStep2Props } from '../../../types/carForm.types'
import { MAX_CAR_IMAGES } from '../../../constants/cars'

export function CarStep2Images(props: CarStep2Props) {
  return (
    <WizardImagesStep
      {...props}
      maxImages={MAX_CAR_IMAGES}
      uploadTitle="إرفاق صور واضحة للسيارة"
    />
  )
}
