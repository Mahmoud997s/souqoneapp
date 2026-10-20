import type { BusDetailApi } from '../../types/busDetailApi.types'
import type { BusWizardData } from '../../store/busWizardStore'

/**
 * Maps a raw BusDetailApi entity into BusWizardData format for editing in the bus wizard.
 * Preserves all specifications, rental, contract, location, and existing images.
 */
export function busListingToFormData(raw: BusDetailApi | any): Partial<BusWizardData> {
  if (!raw) return {}

  let contractExpiryFormatted: string | null = null
  if (raw.contractExpiry) {
    contractExpiryFormatted =
      typeof raw.contractExpiry === 'string'
        ? raw.contractExpiry.split('T')[0]
        : new Date(raw.contractExpiry).toISOString().split('T')[0]
  }

  const existingImages = (raw.images || []).map((img: any) => ({
    id: img.id,
    url: img.url || img,
  }))

  const governorateNameAr =
    raw.governorateRef?.nameAr ??
    raw.governorate?.nameAr ??
    raw.governorateNameAr ??
    ''

  const wilayaNameAr =
    raw.wilayaRef?.nameAr ??
    raw.wilaya?.nameAr ??
    raw.wilayaNameAr ??
    ''

  return {
    busListingType: raw.busListingType || '',
    busType: raw.busType || '',
    make: raw.make || '',
    model: raw.model || '',
    manufacturerId: raw.manufacturerId || '',
    modelId: raw.modelId || '',
    year: raw.year ? String(raw.year) : '',
    capacity: raw.capacity ? String(raw.capacity) : '',
    condition: raw.condition || 'USED',
    transmission: raw.transmission || '',
    fuelType: raw.fuelType || '',
    mileage: raw.mileage ? String(raw.mileage) : '',
    plateNumber: raw.plateNumber || '',
    features: raw.features || [],
    price: raw.price ? String(raw.price) : '',
    currency: raw.currency || 'OMR',
    isPriceNegotiable: Boolean(raw.isPriceNegotiable),
    dailyPrice: raw.dailyPrice ? String(raw.dailyPrice) : '',
    monthlyPrice: raw.monthlyPrice ? String(raw.monthlyPrice) : '',
    withDriver: Boolean(raw.withDriver),
    contractType: raw.contractType || '',
    contractClient: raw.contractClient || '',
    contractMonthly: raw.contractMonthly ? String(raw.contractMonthly) : '',
    contractDuration: raw.contractDuration ? String(raw.contractDuration) : '',
    contractExpiry: contractExpiryFormatted,
    title: raw.title || '',
    description: raw.description || '',
    governorateId: raw.governorateId ? Number(raw.governorateId) : null,
    wilayaId: raw.wilayaId ? Number(raw.wilayaId) : null,
    governorateNameAr,
    wilayaNameAr,
    latitude: raw.latitude != null ? Number(raw.latitude) : null,
    longitude: raw.longitude != null ? Number(raw.longitude) : null,
    existingImages,
    images: [],
    removedImageIds: [],
    whatsappEnabled: raw.whatsappEnabled === true,
  }
}
