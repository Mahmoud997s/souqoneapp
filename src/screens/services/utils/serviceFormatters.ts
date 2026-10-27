import { WORKING_DAYS_AR } from '../../../constants/services'
import type {
  ServicePriceViewModel,
  ServiceWebsiteViewModel,
} from '../../../types/serviceDetailViewModel.types'

// ── CANONICAL ARABIC DAYS MAP ────────────────────────────────────────────────

const DAY_CANONICAL_MAP: Record<string, string> = {
  // Arabic variations
  السبت: 'السبت',
  سبت: 'السبت',
  الأحد: 'الأحد',
  الاحد: 'الأحد',
  أحد: 'الأحد',
  احد: 'الأحد',
  الإثنين: 'الاثنين',
  الاثنين: 'الاثنين',
  إثنين: 'الاثنين',
  اثنين: 'الاثنين',
  الثلاثاء: 'الثلاثاء',
  ثلاثاء: 'الثلاثاء',
  الأربعاء: 'الأربعاء',
  الاربعاء: 'الأربعاء',
  أربعاء: 'الأربعاء',
  اربعاء: 'الأربعاء',
  الخميس: 'الخميس',
  خميس: 'الخميس',
  الجمعة: 'الجمعة',
  جمعة: 'الجمعة',

  // English full (case-insensitive)
  saturday: 'السبت',
  sunday: 'الأحد',
  monday: 'الاثنين',
  tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday: 'الخميس',
  friday: 'الجمعة',

  // English short
  sat: 'السبت',
  sun: 'الأحد',
  mon: 'الاثنين',
  tue: 'الثلاثاء',
  tues: 'الثلاثاء',
  wed: 'الأربعاء',
  thu: 'الخميس',
  thur: 'الخميس',
  thurs: 'الخميس',
  fri: 'الجمعة',
}

// Map numbers 0-6 where 0=Sunday (JS standard) or 0=Saturday (Arabic week start)
const NUM_DAY_MAP_JS: Record<number, string> = {
  0: 'الأحد',
  1: 'الاثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
  5: 'الجمعة',
  6: 'السبت',
}

/**
 * Normalizes any day name representation (Arabic string, English string, short key, number 0-6)
 * to canonical Arabic day name. Unknown or invalid values return null (skipped, never shown raw).
 */
export function normalizeArabicDayName(day: unknown): string | null {
  if (day === null || day === undefined) return null

  if (typeof day === 'number') {
    if (day >= 0 && day <= 6 && Number.isInteger(day)) {
      return NUM_DAY_MAP_JS[day] ?? null
    }
    return null
  }

  if (typeof day === 'string') {
    const trimmed = day.trim().toLowerCase()
    if (!trimmed) return null

    // Check if numeric string '0'..'6'
    if (/^[0-6]$/.test(trimmed)) {
      const n = parseInt(trimmed, 10)
      return NUM_DAY_MAP_JS[n] ?? null
    }

    if (DAY_CANONICAL_MAP[trimmed]) {
      return DAY_CANONICAL_MAP[trimmed]
    }
  }

  return null
}

/**
 * Takes a list of raw day inputs and produces canonical Arabic day names and smart summary text.
 */
export function formatWorkingDays(days?: unknown[]): {
  labels: string[]
  summary: string
} {
  if (!Array.isArray(days) || days.length === 0) {
    return { labels: [], summary: '' }
  }

  const seen = new Set<string>()
  const labels: string[] = []

  for (const rawDay of days) {
    const normalized = normalizeArabicDayName(rawDay)
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized)
      labels.push(normalized)
    }
  }

  if (labels.length === 0) {
    return { labels: [], summary: '' }
  }

  // Smart summary detection
  if (labels.length === 7) {
    return { labels, summary: 'طوال أيام الأسبوع (يومياً)' }
  }

  const isSatToThu =
    labels.length === 6 &&
    !seen.has('الجمعة') &&
    WORKING_DAYS_AR.filter((d) => d !== 'الجمعة').every((d) => seen.has(d))
  if (isSatToThu) {
    return { labels, summary: 'من السبت إلى الخميس' }
  }

  const isSunToThu =
    labels.length === 5 &&
    !seen.has('الجمعة') &&
    !seen.has('السبت') &&
    ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'].every((d) => seen.has(d))
  if (isSunToThu) {
    return { labels, summary: 'من الأحد إلى الخميس' }
  }

  return { labels, summary: labels.join('، ') }
}

/**
 * Formats 24h time string ('08:00', '18:30') into Arabic 12h display ('08:00 ص', '06:30 م').
 */
export function formatSingleTimeDisplay(timeStr?: string | null): string | null {
  if (!timeStr || typeof timeStr !== 'string') return null
  const parts = timeStr.trim().split(':')
  if (parts.length < 2) return null

  const h = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  if (isNaN(h) || isNaN(m)) return null

  const period = h >= 12 ? 'م' : 'ص'
  const displayHours = h % 12 === 0 ? 12 : h % 12
  const displayMinutes = String(m).padStart(2, '0')
  return `${String(displayHours).padStart(2, '0')}:${displayMinutes} ${period}`
}

/**
 * Formats open and close hours into human readable Arabic schedule label.
 */
export function formatServiceWorkingHours(
  open?: string | null,
  close?: string | null
): string | undefined {
  const formattedOpen = formatSingleTimeDisplay(open)
  const formattedClose = formatSingleTimeDisplay(close)

  if (formattedOpen && formattedClose) {
    return `من ${formattedOpen} إلى ${formattedClose}`
  }
  if (formattedOpen) {
    return `يبدأ العمل ${formattedOpen}`
  }
  if (formattedClose) {
    return `حتى ${formattedClose}`
  }
  return undefined
}

/**
 * Formats service pricing supporting price ranges, starting prices, and contact for price.
 */
export function formatServicePrice(
  priceFrom?: unknown,
  priceTo?: unknown,
  price?: unknown,
  currency?: string
): ServicePriceViewModel {
  const curr = currency === 'OMR' || currency === 'ر.ع' || !currency ? 'ر.ع.' : currency

  const parseNum = (v: unknown): number | null => {
    if (v === null || v === undefined) return null
    const n = typeof v === 'number' ? v : parseFloat(String(v))
    return isNaN(n) || n <= 0 ? null : n
  }

  const pFrom = parseNum(priceFrom)
  const pTo = parseNum(priceTo)
  const pExact = parseNum(price)

  // 1. Range: both from and to exist and to > from
  if (pFrom !== null && pTo !== null && pTo > pFrom) {
    const formattedRange = `${pFrom.toLocaleString('en-US')} - ${pTo.toLocaleString('en-US')} ${curr}`
    return {
      amountLabel: formattedRange,
      typeLabel: 'نطاق السعر التقريبي',
      isRange: true,
      formattedRange,
    }
  }

  // 2. Starting price or exact price
  const singlePrice = pFrom ?? pExact
  if (singlePrice !== null) {
    const formatted = `${singlePrice.toLocaleString('en-US')} ${curr}`
    return {
      amountLabel: formatted,
      typeLabel: pFrom !== null ? 'السعر يبدأ من' : undefined,
      isRange: false,
    }
  }

  // 3. Fallback: contact for price
  return {
    amountLabel: 'تواصل لمعرفة السعر',
    typeLabel: undefined,
    isRange: false,
  }
}

/**
 * Sanitizes website URL ensuring safe http/https protocol and clean display URL.
 * Rejects javascript:, data:, file:, etc.
 */
export function sanitizeWebsiteUrl(rawUrl?: unknown): ServiceWebsiteViewModel | undefined {
  if (!rawUrl || typeof rawUrl !== 'string') return undefined

  const trimmed = rawUrl.trim()
  if (!trimmed) return undefined

  // Reject unsafe schemes
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
    return undefined
  }

  let finalUrl = trimmed
  if (!/^https?:\/\//i.test(trimmed)) {
    // Prefix https:// if domain-like
    if (trimmed.includes('.') && !trimmed.includes(' ')) {
      finalUrl = `https://${trimmed}`
    } else {
      return undefined
    }
  }

  try {
    const parsed = new URL(finalUrl)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return undefined
    }

    // Display URL without protocol and trailing slash
    const displayUrl = finalUrl.replace(/^https?:\/\//i, '').replace(/\/+$/, '')
    return {
      url: finalUrl,
      displayUrl,
    }
  } catch {
    return undefined
  }
}
