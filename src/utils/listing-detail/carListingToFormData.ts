import { CarDetailApi } from '../../types/carDetailApi.types'
import { CarFormData } from '../../types/carForm.types'

/**
 * Converts a CarDetailApi response into CarFormData suitable for pre-filling the car wizard
 * when entering edit mode.
 *
 * Implements Decision D-30: Separation of API response types from form wizard state,
 * with a single explicit, pure, deterministic converter function.
 *
 * Guarantees 100% field parity with CarFormData, completely eliminating the 16-field
 * data loss bug present in the legacy edit handler.
 */
export function carListingToFormData(raw: CarDetailApi): CarFormData {
  const isRental = raw.listingType === 'RENTAL'

  const existingImages = Array.isArray(raw.images)
    ? raw.images.map((img) => ({
        id: img.id,
        url: img.url,
        isPrimary: Boolean(img.isPrimary),
        order: img.order ?? 0,
      }))
    : []

  return {
    // 1. Basic Content
    title: raw.title ?? '',
    description: raw.description ?? '',
    listingType: raw.listingType ?? '',
    condition: raw.condition ?? '',

    // 2. Specifications (strings in form, numbers/null in API)
    year: raw.year != null ? String(raw.year) : '',
    price: raw.price != null ? String(raw.price) : '',
    mileage: raw.mileage != null ? String(raw.mileage) : '',
    fuelType: raw.fuelType ?? '',
    transmission: raw.transmission ?? '',
    bodyType: raw.bodyType ?? '',
    exteriorColor: raw.exteriorColor ?? '',
    interior: raw.interior ?? '',
    engineSize: raw.engineSize ?? '',
    horsepower: raw.horsepower != null ? String(raw.horsepower) : '',
    doors: raw.doors != null ? String(raw.doors) : '',
    seats: raw.seats != null ? String(raw.seats) : '',
    driveType: raw.driveType ?? '',
    features: Array.isArray(raw.features) ? [...raw.features] : [],
    currency: raw.currency || 'OMR',
    isPriceNegotiable: Boolean(raw.isPriceNegotiable),

    // 3. Rental fields (populated only when listingType === 'RENTAL', otherwise wizard defaults)
    dailyPrice: isRental && raw.dailyPrice != null ? String(raw.dailyPrice) : '',
    monthlyPrice: isRental && raw.monthlyPrice != null ? String(raw.monthlyPrice) : '',
    withDriver: isRental ? Boolean(raw.withDriver) : false,
    depositAmount: isRental && raw.depositAmount != null ? String(raw.depositAmount) : '',
    minRentalDays: isRental && raw.minRentalDays != null ? String(raw.minRentalDays) : '',
    kmLimitPerDay: isRental && raw.kmLimitPerDay != null ? String(raw.kmLimitPerDay) : '',
    cancellationPolicy: isRental ? raw.cancellationPolicy ?? '' : '',
    deliveryAvailable: isRental ? Boolean(raw.deliveryAvailable) : false,
    insuranceIncluded: isRental ? Boolean(raw.insuranceIncluded) : false,

    // 4. Location
    governorateId: raw.governorateId ?? null,
    wilayaId: raw.wilayaId ?? null,
    latitude: raw.latitude ?? null,
    longitude: raw.longitude ?? null,

    // 5. Master Data & Display Names
    brandId: raw.brandId ?? '',
    carModelId: raw.carModelId ?? '',
    carTrimId: raw.carTrimId ?? '',
    make: raw.make ?? '',
    model: raw.model ?? '',
    trim: raw.trim ?? '',
    governorateName: raw.governorateRef?.nameAr ?? raw.governorate ?? '',
    wilayaName: raw.wilayaRef?.nameAr ?? raw.city ?? '',

    // 6. Media
    images: [],
    existingImages,
    removedImageIds: [],

    // 7. Edit Tracking & Optimistic Concurrency
    version: raw.version ?? 1,
    originalBrandId: raw.brandId ?? '',
    originalCarModelId: raw.carModelId ?? '',
    editMode: true,
    editListingId: raw.id,
  }
}
