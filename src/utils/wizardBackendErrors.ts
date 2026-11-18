import { MappedBackendErrorsResult } from './publishErrorDialog'

function buildLowercaseLookup(map: Record<string, number>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key of Object.keys(map)) {
    out[key.toLowerCase()] = key
  }
  return out
}

export function mapWizardBackendErrors(
  errorResponse: unknown,
  fieldStepMap: Record<string, number>,
  fieldFallbacks: Record<string, string> = {}
): MappedBackendErrorsResult {
  const fieldErrors: Record<string, string> = {}
  if (!errorResponse || typeof errorResponse !== 'object') {
    return { fieldErrors, firstInvalidStep: null }
  }

  const lookup = buildLowercaseLookup(fieldStepMap)
  const rawObj = errorResponse as Record<string, unknown>
  const res: Record<string, unknown> =
    rawObj.response &&
    typeof rawObj.response === 'object' &&
    (rawObj.response as Record<string, unknown>).data &&
    typeof (rawObj.response as Record<string, unknown>).data === 'object'
      ? ((rawObj.response as Record<string, unknown>).data as Record<string, unknown>)
      : rawObj

  const resolveField = (raw: string): string | undefined =>
    fieldStepMap[raw] !== undefined ? raw : lookup[raw.toLowerCase()]

  if (Array.isArray(res.fieldErrors)) {
    for (const item of res.fieldErrors) {
      if (item && typeof item === 'object' && typeof (item as { field?: unknown }).field === 'string') {
        const entry = item as { field: string; message?: unknown }
        const canonical = resolveField(entry.field)
        if (canonical && !fieldErrors[canonical]) {
          fieldErrors[canonical] =
            typeof entry.message === 'string' && entry.message.trim().length > 0
              ? entry.message
              : fieldFallbacks[canonical] ?? 'قيمة غير صالحة'
        }
      }
    }
  } else if (res.fieldErrors && typeof res.fieldErrors === 'object') {
    for (const [key, val] of Object.entries(res.fieldErrors as Record<string, unknown>)) {
      const canonical = resolveField(key)
      if (canonical && !fieldErrors[canonical]) {
        fieldErrors[canonical] =
          typeof val === 'string' && val.trim().length > 0
            ? val
            : fieldFallbacks[canonical] ?? 'قيمة غير صالحة'
      }
    }
  }

  const messages: string[] = []
  if (Array.isArray(res.message)) {
    for (const m of res.message) {
      if (typeof m === 'string') messages.push(m)
    }
  } else if (typeof res.message === 'string') {
    messages.push(res.message)
  }

  for (const rawMsg of messages) {
    const englishMatch = rawMsg.match(/^([a-zA-Z0-9_]+)\s+/)
    if (englishMatch) {
      const canonical = resolveField(englishMatch[1])
      if (canonical && !fieldErrors[canonical]) {
        fieldErrors[canonical] = fieldFallbacks[canonical] ?? rawMsg
      }
    }
  }

  let firstInvalidStep: number | null = null
  for (const field of Object.keys(fieldErrors)) {
    const step = fieldStepMap[field]
    if (step !== undefined && (firstInvalidStep === null || step < firstInvalidStep)) {
      firstInvalidStep = step
    }
  }

  return { fieldErrors, firstInvalidStep }
}

const BUS_FIELD_STEP_MAP: Record<string, number> = {
  busListingType: 1,
  busType: 1,
  images: 2,
  title: 3,
  make: 3,
  model: 3,
  year: 3,
  seats: 3,
  condition: 3,
  description: 3,
  price: 4,
  dailyRate: 4,
  monthlyRate: 4,
  contractPrice: 4,
  governorateId: 5,
  wilayaId: 5,
  governorate: 5,
  city: 5,
}

const EQUIPMENT_FIELD_STEP_MAP: Record<string, number> = {
  listingType: 1,
  equipmentType: 1,
  images: 2,
  title: 3,
  make: 3,
  model: 3,
  year: 3,
  condition: 3,
  description: 3,
  price: 3,
  dailyPrice: 3,
  monthlyPrice: 3,
  governorateId: 4,
  wilayaId: 4,
  governorate: 4,
  city: 4,
}

const PART_FIELD_STEP_MAP: Record<string, number> = {
  listingType: 1,
  partCategoryId: 1,
  images: 2,
  title: 3,
  condition: 3,
  partNumber: 3,
  description: 3,
  compatibleMakes: 4,
  price: 5,
  governorateId: 5,
  wilayaId: 5,
  governorate: 5,
  city: 5,
}

export function mapBusBackendErrors(errorResponse: unknown): MappedBackendErrorsResult {
  return mapWizardBackendErrors(errorResponse, BUS_FIELD_STEP_MAP)
}

export function mapEquipmentBackendErrors(errorResponse: unknown): MappedBackendErrorsResult {
  return mapWizardBackendErrors(errorResponse, EQUIPMENT_FIELD_STEP_MAP)
}

export function mapPartBackendErrors(errorResponse: unknown): MappedBackendErrorsResult {
  return mapWizardBackendErrors(errorResponse, PART_FIELD_STEP_MAP)
}
