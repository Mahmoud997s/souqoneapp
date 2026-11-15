import React from 'react'
import { WizardImagesStep } from '../../wizard/WizardImagesStep'
import { PartStep2Props } from '../../../types/partForm.types'
import { MAX_PART_IMAGES } from '../../../constants/parts'

export function PartStep2Images(props: PartStep2Props) {
  return (
    <WizardImagesStep
      {...props}
      maxImages={MAX_PART_IMAGES}
      uploadTitle="إرفاق صور واضحة لقطعة الغيار"
    />
  )
}
