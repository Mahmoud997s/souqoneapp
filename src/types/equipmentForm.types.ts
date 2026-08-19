export type EquipmentFormField =
  | 'title'
  | 'description'
  | 'equipmentType'
  | 'listingType'
  | 'make'
  | 'model'
  | 'year'
  | 'condition'
  | 'capacity'
  | 'power'
  | 'weight'
  | 'hoursUsed'
  | 'features'
  | 'price'
  | 'dailyPrice'
  | 'monthlyPrice'
  | 'isPriceNegotiable'
  | 'withOperator'
  | 'deliveryAvailable'
  | 'budgetMin'
  | 'budgetMax'
  | 'rentalDuration'
  | 'quantity'
  | 'siteDetails'
  | 'governorateId'
  | 'wilayaId'
  | 'governorate'
  | 'city'
  | 'latitude'
  | 'longitude'
  | 'contactPhone'
  | 'whatsapp'
  | 'images'
  | 'existingImages'
  | 'removedImageIds'

export interface EquipmentFormData {
  title: string
  description: string
  equipmentType: string
  listingType: string

  make: string
  model: string
  year: string
  condition: string
  capacity: string
  power: string
  weight: string
  hoursUsed: string
  features: string[]

  price: string
  dailyPrice: string
  monthlyPrice: string
  isPriceNegotiable: boolean
  withOperator: boolean
  deliveryAvailable: boolean

  budgetMin: string
  budgetMax: string
  rentalDuration: string
  quantity: string
  siteDetails: string

  governorateId: number | null
  wilayaId: number | null
  governorate: string
  city: string
  latitude: number | null
  longitude: number | null

  contactPhone: string
  whatsapp: string

  images: any[]
  existingImages: any[]
  removedImageIds: string[]

  editMode?: boolean
  editListingId?: string
}

export interface EquipmentFormErrors {
  [key: string]: string | undefined
}

export interface EquipmentStep1Props {
  formData: EquipmentFormData
  errors: EquipmentFormErrors
  onUpdateField: (field: EquipmentFormField, value: any) => void
}

export interface EquipmentStep2Props {
  images: any[]
  existingImages: any[]
  errors: EquipmentFormErrors
  isUploading: boolean
  onPickImages: () => void
  onRemoveNewImage: (index: number) => void
  onRemoveExistingImage: (idOrUrl: string) => void
}

export interface EquipmentStep3Props {
  formData: EquipmentFormData
  errors: EquipmentFormErrors
  customFeatureInput: string
  onChangeCustomFeatureInput: (val: string) => void
  onToggleFeature: (feature: string) => void
  onAddCustomFeature: () => void
  onRemoveFeature: (feature: string) => void
  onUpdateField: (field: EquipmentFormField, value: any) => void
}

export interface EquipmentStep4Props {
  formData: EquipmentFormData
  errors: EquipmentFormErrors
  onUpdateField: (field: EquipmentFormField, value: any) => void
  onLocationChange: (govId: number, wilId: number, govNameAr: string, wilNameAr: string) => void
}

export interface EquipmentStep5Props {
  formData: EquipmentFormData
  onEditStep: (step: number) => void
}
