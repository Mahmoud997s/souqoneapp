import React from 'react'
import { WizardImagesStep } from '../../wizard/WizardImagesStep'
import { MAX_BUS_IMAGES } from '../../../constants/buses'

export interface BusStep2Props {
  images: (string | { uri: string })[]
  existingImages?: (string | { id?: string; url: string })[]
  errors: Record<string, string>
  isUploading?: boolean
  onPickImages: () => void
  onRemoveNewImage: (index: number) => void
  onRemoveExistingImage?: (idOrUrl: string) => void
  onMakePrimaryNew?: (index: number) => void
  onMakePrimaryExisting?: (index: number) => void
}

export function BusStep2Images(props: BusStep2Props) {
  return (
    <WizardImagesStep
      {...props}
      maxImages={MAX_BUS_IMAGES}
      uploadTitle="إرفاق صور واضحة للحافلة *"
      uploadBoxTestID="upload-action-box"
      errorTestID="error-images"
    />
  )
}
