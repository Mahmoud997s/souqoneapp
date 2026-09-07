import { BusWizardData } from '../store/busWizardStore'

export function buildBusPayload(data: BusWizardData) {
  const payload: any = {
    title: data.title.trim(),
    description: data.description.trim(),
    busListingType: data.busListingType,
    busType: data.busType,
    make: data.make.trim(),
    model: data.model.trim(),
    year: Number(data.year),
    capacity: Number(data.capacity),
    currency: 'OMR',
    governorateId: Number(data.governorateId),
    wilayaId: Number(data.wilayaId),
  }

  // Optional string IDs (explicit null if free-text)
  payload.manufacturerId = data.manufacturerId && data.manufacturerId.trim() ? data.manufacturerId.trim() : null
  payload.modelId = data.modelId && data.modelId.trim() ? data.modelId.trim() : null

  // Mileage
  if (data.mileage && data.mileage.trim()) {
    payload.mileage = Number(data.mileage)
  }

  // Enums
  if (data.fuelType) payload.fuelType = data.fuelType
  if (data.transmission) payload.transmission = data.transmission
  if (data.condition) payload.condition = data.condition

  // Arrays
  if (data.features && data.features.length > 0) {
    payload.features = data.features
  }

  // Plate
  if (data.plateNumber && data.plateNumber.trim()) {
    payload.plateNumber = data.plateNumber.trim()
  }

  // Pricing branches
  if (data.busListingType === 'BUS_SALE' || data.busListingType === 'BUS_SALE_WITH_CONTRACT') {
    if (data.price && data.price.trim()) {
      payload.price = Number(data.price)
    }
    payload.isPriceNegotiable = Boolean(data.isPriceNegotiable)
  }

  if (data.busListingType === 'BUS_RENT') {
    if (data.dailyPrice && data.dailyPrice.trim()) {
      payload.dailyPrice = Number(data.dailyPrice)
    }
    if (data.monthlyPrice && data.monthlyPrice.trim()) {
      payload.monthlyPrice = Number(data.monthlyPrice)
    }
    payload.withDriver = Boolean(data.withDriver)
  }

  if (data.busListingType === 'BUS_SALE_WITH_CONTRACT') {
    if (data.contractType) payload.contractType = data.contractType
    if (data.contractClient && data.contractClient.trim()) {
      payload.contractClient = data.contractClient.trim()
    }
    if (data.contractMonthly && data.contractMonthly.trim()) {
      payload.contractMonthly = Number(data.contractMonthly)
    }
    if (data.contractDuration && data.contractDuration.trim()) {
      payload.contractDuration = Number(data.contractDuration)
    }
    if (data.contractExpiry && data.contractExpiry.trim()) {
      payload.contractExpiry = data.contractExpiry.trim()
    }
  }

  // Coordinates
  if (data.latitude != null) payload.latitude = data.latitude
  if (data.longitude != null) payload.longitude = data.longitude

  // Contact
  if (data.contactPhone && data.contactPhone.trim()) {
    payload.contactPhone = data.contactPhone.trim()
  }
  if (data.whatsapp && data.whatsapp.trim()) {
    payload.whatsapp = data.whatsapp.trim()
  }

  return payload
}
