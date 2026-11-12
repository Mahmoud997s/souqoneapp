import { ServiceFormData } from '../../store/serviceWizardStore'
import { validateStep } from '../../hooks/useServiceValidation'

export interface ServiceBackendPayload {
  title: string
  description: string
  serviceType: string
  providerType: string
  providerName: string
  specializations?: string[]
  priceFrom: number
  priceTo?: number
  currency: string
  isHomeService: boolean
  workingHoursOpen?: string | null
  workingHoursClose?: string | null
  workingDays: string[]
  governorateId: number
  wilayaId: number
  address?: string
  latitude?: number
  longitude?: number
  whatsappEnabled: boolean
  website?: string
  images: string[]
}

export function extractImageUrlsFromServiceFormData(
  existingImages?: Array<string | { url?: string; uri?: string } | any>
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

export function validateAllServiceStepsBeforeSubmit(
  formData: ServiceFormData
): { isValid: boolean; invalidStep: number | null; errors: Record<string, string> } {
  for (let s = 1; s <= 5; s++) {
    const result = validateStep(s, formData)
    if (!result.isValid) {
      return {
        isValid: false,
        invalidStep: s,
        errors: result.errors,
      }
    }
  }

  return {
    isValid: true,
    invalidStep: null,
    errors: {},
  }
}

export function buildServiceListingPayload(
  formData: ServiceFormData,
  finalImageUrls: string[]
): ServiceBackendPayload {
  const isEdit = Boolean(formData.editMode && formData.editListingId)

  const workingDaysToSubmit =
    Array.isArray(formData.workingDays) && formData.workingDays.length > 0
      ? formData.workingDays
      : []

  const workingHoursOpen = formData.workingHoursOpen
    ? formData.workingHoursOpen
    : isEdit
      ? null
      : undefined

  const workingHoursClose = formData.workingHoursClose
    ? formData.workingHoursClose
    : isEdit
      ? null
      : undefined

  return {
    title: formData.title.trim(),
    description: formData.description.trim(),
    serviceType: formData.serviceType!,
    providerType: formData.providerType!,
    providerName: formData.providerName.trim(),
    specializations:
      formData.specializations && formData.specializations.length > 0
        ? formData.specializations
        : undefined,
    priceFrom: Number(formData.priceFrom),
    ...(formData.priceTo != null ? { priceTo: Number(formData.priceTo) } : {}),
    currency: formData.currency || 'OMR',
    isHomeService: Boolean(formData.isHomeService),
    workingHoursOpen,
    workingHoursClose,
    workingDays: workingDaysToSubmit,
    governorateId: Number(formData.governorateId),
    wilayaId: Number(formData.wilayaId),
    address: formData.address ? formData.address.trim() : undefined,
    latitude: formData.latitude != null ? Number(formData.latitude) : undefined,
    longitude: formData.longitude != null ? Number(formData.longitude) : undefined,
    whatsappEnabled: formData.whatsappEnabled === true,
    website: formData.website ? formData.website.trim() : undefined,
    images: finalImageUrls,
  }
}
