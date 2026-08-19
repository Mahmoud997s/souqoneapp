/**
 * Accepts both OperatorFormData (edit screen) and OperatorWizardFormData (store/add screen).
 * governorateId/wilayaId are optional here because the store marks them as optional;
 * validation guarantees they are non-null before this function is ever called.
 */
interface OperatorPayloadInput {
  title: string
  description: string
  operatorType: string
  experienceYears: string
  equipmentTypes: string[]
  specializations: string[]
  certifications: string[]
  dailyRate: string
  hourlyRate: string
  currency?: string
  isPriceNegotiable: boolean
  governorateId?: number | null
  wilayaId?: number | null
  contactPhone: string
  whatsapp: string
}

/**
 * Builds the backend-ready DTO payload from operator form data.
 * Single source of truth for both add and edit flows.
 *
 * Rules:
 * - All numeric fields are cast with Number()
 * - currency: formData.currency with fallback to 'OMR'
 * - whatsapp: falls back to contactPhone if empty
 * - No text-based location keys (governorate/city strings) sent to backend
 */
export function buildOperatorPayload(formData: OperatorPayloadInput): Record<string, unknown> {
  return {
    title: formData.title.trim(),
    description: formData.description.trim(),
    operatorType: formData.operatorType,
    experienceYears: formData.experienceYears ? Number(formData.experienceYears) : undefined,
    equipmentTypes: formData.equipmentTypes,
    specializations: formData.specializations,
    certifications: formData.certifications,
    dailyRate: formData.dailyRate ? Number(formData.dailyRate) : undefined,
    hourlyRate: formData.hourlyRate ? Number(formData.hourlyRate) : undefined,
    currency: formData.currency || 'OMR',
    isPriceNegotiable: formData.isPriceNegotiable,
    governorateId: Number(formData.governorateId),
    wilayaId: Number(formData.wilayaId),
    contactPhone: formData.contactPhone.trim(),
    whatsapp: formData.whatsapp.trim() || formData.contactPhone.trim(),
  }
}
