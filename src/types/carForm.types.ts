export type CarFormField =
  | 'title'
  | 'description'
  | 'listingType'
  | 'condition'
  | 'year'
  | 'price'
  | 'mileage'
  | 'fuelType'
  | 'transmission'
  | 'bodyType'
  | 'exteriorColor'
  | 'interior'
  | 'engineSize'
  | 'horsepower'
  | 'doors'
  | 'seats'
  | 'driveType'
  | 'features'
  | 'currency'
  | 'isPriceNegotiable'
  | 'dailyPrice'
  | 'monthlyPrice'
  | 'withDriver'
  | 'depositAmount'
  | 'minRentalDays'
  | 'kmLimitPerDay'
  | 'cancellationPolicy'
  | 'deliveryAvailable'
  | 'insuranceIncluded'
  | 'governorateId'
  | 'wilayaId'
  | 'latitude'
  | 'longitude'
  | 'brandId'
  | 'carModelId'
  | 'carTrimId'
  | 'make'
  | 'model'
  | 'trim'
  | 'governorateName'
  | 'wilayaName'
  | 'images'
  | 'existingImages'
  | 'removedImageIds'
  | 'version'
  | 'originalBrandId'
  | 'originalCarModelId'

export interface CarFormData {
  title: string
  description: string
  listingType: string // 'SALE' | 'RENTAL' | 'WANTED'
  condition: string // 'NEW' | 'USED'

  year: string
  price: string
  mileage: string
  fuelType: string
  transmission: string
  bodyType: string
  exteriorColor: string
  interior: string
  engineSize: string
  horsepower: string
  doors: string
  seats: string
  driveType: string
  features: string[]
  currency: string
  isPriceNegotiable: boolean

  // Rental fields
  dailyPrice: string
  monthlyPrice: string
  withDriver: boolean
  depositAmount: string
  minRentalDays: string
  kmLimitPerDay: string
  cancellationPolicy: string
  deliveryAvailable: boolean
  insuranceIncluded: boolean

  // Location
  governorateId: number | null
  wilayaId: number | null
  latitude: number | null
  longitude: number | null

  // Master Data
  brandId: string
  carModelId: string
  carTrimId: string
  make?: string
  model?: string
  trim?: string
  governorateName?: string
  wilayaName?: string

  // Images
  images: any[]
  existingImages: any[]
  removedImageIds: string[]

  editMode?: boolean
  editListingId?: string
  version?: number
  originalBrandId?: string
  originalCarModelId?: string
}

export interface CarFormErrors {
  [key: string]: string | undefined
}

export interface CarStep1Props {
  formData: CarFormData
  errors: CarFormErrors
  onUpdateField: (field: CarFormField, value: any) => void
}

export interface CarStep2Props {
  images: any[]
  existingImages: any[]
  errors: CarFormErrors
  isUploading: boolean
  onPickImages: () => void
  onRemoveNewImage: (index: number) => void
  onRemoveExistingImage: (idOrUrl: string) => void
  onMakePrimaryNew?: (index: number) => void
  onMakePrimaryExisting?: (index: number) => void
}

export interface CarStep3Props {
  formData: CarFormData
  errors: CarFormErrors
  customFeatureInput: string
  onChangeCustomFeatureInput: (val: string) => void
  onToggleFeature: (feature: string) => void
  onAddCustomFeature: () => void
  onRemoveFeature: (feature: string) => void
  onUpdateField: (field: CarFormField, value: any) => void
}

export interface CarStep4Props {
  formData: CarFormData
  errors: CarFormErrors
  onUpdateField: (field: CarFormField, value: any) => void
  onLocationChange: (govId: number, wilId: number, govNameAr: string, wilNameAr: string) => void
}

export interface CarStep5Props {
  formData: CarFormData
  onEditStep: (step: number) => void
}
