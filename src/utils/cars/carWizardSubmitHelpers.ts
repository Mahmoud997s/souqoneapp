import { CarFormData, CarFormField } from '../../types/carForm.types'
import { validateCarStep } from '../../hooks/useCarValidation'

export interface CarBackendPayload {
  title: string
  description: string
  listingType: 'SALE' | 'RENTAL' | 'WANTED'
  condition?: 'USED' | 'NEW' | 'LIKE_NEW'
  year?: number
  mileage?: number
  fuelType?: string
  transmission?: string
  bodyType?: string
  exteriorColor?: string
  interior?: string
  engineSize?: string
  horsepower?: number
  doors?: number
  seats?: number
  driveType?: string
  features?: string[]
  isPriceNegotiable: boolean
  whatsappEnabled: boolean
  governorateId?: number
  wilayaId?: number
  latitude?: number
  longitude?: number
  brandId?: string
  carModelId?: string
  carTrimId?: string
  version?: number
  images?: string[]
  price?: number
  dailyPrice?: number
  monthlyPrice?: number
  withDriver?: boolean
  depositAmount?: number
  minRentalDays?: number
  kmLimitPerDay?: number
  cancellationPolicy?: string
  deliveryAvailable?: boolean
  insuranceIncluded?: boolean
}

export function extractImageUrlsFromCarFormData(
  existingImages?: Array<string | { url?: string; uri?: string; id?: string } | any>
): string[] {
  if (!Array.isArray(existingImages) || existingImages.length === 0) {
    return []
  }
  const urls: string[] = []
  for (const img of existingImages) {
    const url = typeof img === 'string' ? img : img?.url || img?.uri
    if (url && typeof url === 'string') {
      urls.push(url)
    }
  }
  return urls
}

export function validateAllCarStepsBeforeSubmit(
  formData: CarFormData
): { isValid: boolean; invalidStep: number | null; errors: Record<string, string | undefined> } {
  for (let s = 1; s <= 4; s++) {
    const result = validateCarStep(s, formData)
    if (!result.isValid) {
      return {
        isValid: false,
        invalidStep: s,
        errors: result.errors,
      }
    }
  }

  // Image validation for non-WANTED listings
  const hasNewImages = Array.isArray(formData.images) && formData.images.length > 0
  const hasExistingImages = Array.isArray(formData.existingImages) && formData.existingImages.length > 0
  if (formData.listingType !== 'WANTED' && !hasNewImages && !hasExistingImages) {
    return {
      isValid: false,
      invalidStep: 2,
      errors: { images: 'يجب إضافة صورة واحدة على الأقل للسيارة' },
    }
  }

  return {
    isValid: true,
    invalidStep: null,
    errors: {},
  }
}

export function buildCarListingPayload(
  formData: CarFormData,
  finalImageUrls: string[]
): CarBackendPayload {
  const payload: CarBackendPayload = {
    title: formData.title.trim(),
    description: formData.description.trim(),
    listingType: (formData.listingType as 'SALE' | 'RENTAL' | 'WANTED') || 'SALE',
    condition: (formData.condition as 'USED' | 'NEW' | 'LIKE_NEW') || undefined,

    year: formData.year ? Number(formData.year) : undefined,
    mileage:
      formData.condition === 'NEW'
        ? 0
        : formData.mileage
        ? Number(formData.mileage)
        : undefined,
    fuelType: formData.fuelType || undefined,
    transmission: formData.transmission || undefined,
    bodyType: formData.bodyType || undefined,
    exteriorColor: formData.exteriorColor || undefined,
    interior: formData.interior || undefined,
    engineSize: formData.engineSize || undefined,
    horsepower: formData.horsepower ? Number(formData.horsepower) : undefined,
    doors: formData.doors ? Number(formData.doors) : undefined,
    seats: formData.seats ? Number(formData.seats) : undefined,
    driveType: formData.driveType || undefined,
    features: formData.features && formData.features.length > 0 ? formData.features : undefined,

    isPriceNegotiable: formData.isPriceNegotiable,
    whatsappEnabled: formData.whatsappEnabled === true,

    governorateId: formData.governorateId ? Number(formData.governorateId) : undefined,
    wilayaId: formData.wilayaId ? Number(formData.wilayaId) : undefined,
    latitude: formData.latitude || undefined,
    longitude: formData.longitude || undefined,

    ...(formData.editMode
      ? formData.brandId !== formData.originalBrandId ||
        formData.carModelId !== formData.originalCarModelId
        ? {
            brandId: formData.brandId,
            carModelId: formData.carModelId,
            carTrimId: formData.carTrimId || undefined,
          }
        : {}
      : {
          brandId: formData.brandId,
          carModelId: formData.carModelId,
          carTrimId: formData.carTrimId || undefined,
        }),

    ...(formData.editMode
      ? { version: formData.version || 1 }
      : { images: finalImageUrls.length > 0 ? finalImageUrls : undefined }),
  }

  if (formData.listingType === 'SALE') {
    payload.price = formData.price
      ? isNaN(Number(formData.price))
        ? undefined
        : Number(formData.price)
      : undefined
  } else if (formData.listingType === 'RENTAL') {
    payload.price = 0 // Required by backend even for rentals
    payload.dailyPrice = formData.dailyPrice
      ? isNaN(Number(formData.dailyPrice))
        ? undefined
        : Number(formData.dailyPrice)
      : undefined
    payload.monthlyPrice = formData.monthlyPrice
      ? isNaN(Number(formData.monthlyPrice))
        ? undefined
        : Number(formData.monthlyPrice)
      : undefined
    payload.withDriver = formData.withDriver
    payload.depositAmount = formData.depositAmount
      ? isNaN(Number(formData.depositAmount))
        ? undefined
        : Number(formData.depositAmount)
      : undefined
    payload.minRentalDays = formData.minRentalDays
      ? isNaN(Number(formData.minRentalDays))
        ? undefined
        : Number(formData.minRentalDays)
      : undefined
    payload.kmLimitPerDay = formData.kmLimitPerDay
      ? isNaN(Number(formData.kmLimitPerDay))
        ? undefined
        : Number(formData.kmLimitPerDay)
      : undefined
    payload.cancellationPolicy = formData.cancellationPolicy || undefined
    payload.deliveryAvailable = formData.deliveryAvailable
    payload.insuranceIncluded = formData.insuranceIncluded
  } else if (formData.listingType === 'WANTED') {
    payload.price = formData.price
      ? isNaN(Number(formData.price))
        ? 0
        : Number(formData.price)
      : 0
  }

  return payload
}
