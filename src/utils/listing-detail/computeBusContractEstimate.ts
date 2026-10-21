import { BusListingType } from '../../types/bus.types'

export interface BusContractEstimateInput {
  busListingType: BusListingType
  price?: number            // سعر البيع
  monthlyIncome: number     // > 0
  durationMonths?: number   // مدة العقد الأصلية (احتياطي)
  expiryIso?: string        // تاريخ الانتهاء
}

export interface BusContractEstimate {
  monthlyIncome: number
  annualIncome: number                // monthly * 12
  remainingMonths: number | null      // عدد صحيح مقرّب لأعلى، من expiryIso لو موجود، وإلا durationMonths، وإلا null
  remainingIncome: number | null      // monthly * remainingMonths
  recoveryPercent: number | null      // remainingIncome / price * 100، رقم صحيح، بدون سقف 100
  annualYieldPercent: number | null   // annualIncome / price * 100، رقم عشري بخانة واحدة
  paybackMonths: number | null        // ceil(price / monthly)
  progressPercent: number | null      // نسبة المدة المنقضية من مدة العقد الأصلية (0 - 100)
}

const AVERAGE_DAYS_PER_MONTH = 30.4375

/**
 * Pure function computing commercial bus contract financial estimates.
 *
 * Rules:
 * - Deterministic: `now` is a mandatory parameter (no internal `new Date()`).
 * - Price-dependent metrics (recoveryPercent, annualYieldPercent, paybackMonths)
 *   are ONLY computed for sale types (BUS_SALE, BUS_SALE_WITH_CONTRACT) with price > 0.
 *   For rentals, price <= 0, or non-sale listings, they return null.
 * - Remaining months: computed from `expiryIso` relative to `now`.
 *   If <= 0 days remaining, returns 0. If > 0 days but < 1 month, returns 1.
 *   Falls back to `durationMonths` if `expiryIso` is missing.
 * - Recovery percent has NO artificial 100% ceiling.
 * - Invalid monthlyIncome (<= 0 or non-finite) safely returns all null/zero metrics, never NaN.
 */
export function computeBusContractEstimate(
  input: BusContractEstimateInput,
  now: Date
): BusContractEstimate {
  if (
    !input ||
    typeof input.monthlyIncome !== 'number' ||
    !Number.isFinite(input.monthlyIncome) ||
    input.monthlyIncome <= 0
  ) {
    return {
      monthlyIncome: 0,
      annualIncome: 0,
      remainingMonths: null,
      remainingIncome: null,
      recoveryPercent: null,
      annualYieldPercent: null,
      paybackMonths: null,
      progressPercent: null,
    }
  }

  const monthlyIncome = input.monthlyIncome
  const annualIncome = monthlyIncome * 12

  // 1. Calculate remainingMonths
  let remainingMonths: number | null = null

  if (input.expiryIso) {
    const expiryDate = new Date(input.expiryIso)
    if (!isNaN(expiryDate.getTime()) && !isNaN(now.getTime())) {
      const diffMs = expiryDate.getTime() - now.getTime()
      if (diffMs <= 0) {
        remainingMonths = 0
      } else {
        const diffDays = diffMs / (1000 * 60 * 60 * 24)
        const rawMonths = diffDays / AVERAGE_DAYS_PER_MONTH
        remainingMonths = Math.max(1, Math.ceil(rawMonths))
      }
    }
  }

  // Fallback to durationMonths if expiry was not present or invalid
  if (remainingMonths === null && typeof input.durationMonths === 'number' && Number.isFinite(input.durationMonths)) {
    if (input.durationMonths > 0) {
      remainingMonths = Math.round(input.durationMonths)
    } else {
      remainingMonths = 0
    }
  }

  // 2. Calculate remainingIncome
  let remainingIncome: number | null = null
  if (remainingMonths !== null) {
    remainingIncome = monthlyIncome * remainingMonths
  }

  // 3. Price-dependent metrics
  const isSaleType =
    input.busListingType === 'BUS_SALE' || input.busListingType === 'BUS_SALE_WITH_CONTRACT'
  const hasValidPrice =
    typeof input.price === 'number' && Number.isFinite(input.price) && input.price > 0

  let recoveryPercent: number | null = null
  let annualYieldPercent: number | null = null
  let paybackMonths: number | null = null

  if (isSaleType && hasValidPrice) {
    const price = input.price!

    // Recovery percent
    if (remainingIncome !== null) {
      if (remainingMonths === 0) {
        recoveryPercent = 0
      } else {
        recoveryPercent = Math.round((remainingIncome / price) * 100)
      }
    }

    // Annual yield % (1 decimal place)
    const rawYield = (annualIncome / price) * 100
    annualYieldPercent = Number(rawYield.toFixed(1))

    // Payback months
    paybackMonths = Math.ceil(price / monthlyIncome)
  }

  // 4. Contract duration progress (0 - 100%)
  let progressPercent: number | null = null
  if (
    typeof input.durationMonths === 'number' &&
    Number.isFinite(input.durationMonths) &&
    input.durationMonths > 0 &&
    remainingMonths !== null
  ) {
    const elapsed = Math.max(0, input.durationMonths - remainingMonths)
    progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / input.durationMonths) * 100)))
  }

  return {
    monthlyIncome,
    annualIncome,
    remainingMonths,
    remainingIncome,
    recoveryPercent,
    annualYieldPercent,
    paybackMonths,
    progressPercent,
  }
}
