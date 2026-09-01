import { PartFormData, PartImageItem, PartExistingImage } from '../store/partWizardStore'
import { CarBrand } from '../api/cars'

export interface PartStepProps {
  formData: PartFormData
  errors: Record<string, string>
  onUpdateField: (field: keyof PartFormData, value: any) => void
}

export interface PartStep1Props extends PartStepProps {}
export interface PartStep3Props extends PartStepProps {}
export interface PartStep4Props extends PartStepProps {}
export interface PartStep5Props extends PartStepProps {
  onLocationChange: (govId: number, wilId: number, govNameAr: string, wilNameAr: string) => void
}
export interface PartStep6Props {
  formData: PartFormData
  onEditStep: (step: number) => void
  brands: CarBrand[]
}
export interface PartStep2Props {
  images: PartImageItem[]
  existingImages: PartExistingImage[]
  errors: Record<string, string>
  isUploading: boolean
  onPickImages: () => void
  onRemoveNewImage: (index: number) => void
  onRemoveExistingImage: (idOrUrl: string) => void
  onMakePrimaryNew?: (index: number) => void
  onMakePrimaryExisting?: (index: number) => void
}
