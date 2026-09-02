import {
  ServiceFormData,
  ServiceImageItem,
  ServiceExistingImage,
} from '../store/serviceWizardStore'

export interface ServiceStepProps {
  formData: ServiceFormData
  errors: Record<string, string>
  onUpdateField: <K extends keyof ServiceFormData>(field: K, value: ServiceFormData[K]) => void
}

export interface ServiceStep1Props extends ServiceStepProps {}
export interface ServiceStep3Props extends ServiceStepProps {}
export interface ServiceStep4Props extends ServiceStepProps {}
export interface ServiceStep5Props extends ServiceStepProps {
  onLocationChange: (govId: number, wilId: number, govNameAr: string, wilNameAr: string) => void
}
export interface ServiceStep6Props {
  formData: ServiceFormData
  onEditStep: (step: number) => void
}

export interface ServiceStep2Props {
  images: ServiceImageItem[]
  existingImages: ServiceExistingImage[]
  errors: Record<string, string>
  isUploading?: boolean
  onPickImages: () => void
  onRemoveNewImage: (index: number) => void
  onRemoveExistingImage: (idOrUrl: string) => void
  onMakePrimaryNew?: (index: number) => void
  onMakePrimaryExisting?: (index: number) => void
}
