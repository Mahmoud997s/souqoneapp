import { Spacing } from '../constants/spacing'

export const WIZARD_GLASS_HEADER_HEIGHT = 52

/**
 * Shared top content offset so wizard steppers/content clear the absolute GlassNavBar.
 */
export function getWizardContentPaddingTop(topInset: number): number {
  return topInset + WIZARD_GLASS_HEADER_HEIGHT + Spacing.space3
}

/**
 * Keeps Arabic prefix + colon anchored in RTL while isolating Latin/numeric tokens
 * (e.g. "مثال: 30" won't flip to "30 :مثال").
 */
export function formatRtlPlaceholder(text: string): string {
  const withColonAnchor = text.replace(/:\s+/g, ':\u200F ')
  return withColonAnchor.replace(/[A-Za-z0-9][A-Za-z0-9.,:/-]*/g, (token) => `\u2066${token}\u2069`)
}

/**
 * Wraps a numeric value + Latin unit (e.g. "2.0 CC") in LRI/PDI so RTL doesn't flip it to "CC 2.0".
 */
export function formatRtlUnit(value: string | number, unit: string): string {
  return `\u2066${String(value).trim()} ${unit}\u2069`
}

/**
 * Appends Arabic horsepower unit when equipment power is numeric-only; preserves user-entered units (e.g. "160 HP").
 */
export function formatEquipmentPower(power: string): string {
  const trimmed = power.trim()
  if (!trimmed) return ''
  if (/^\d+(?:[.,]\d+)?$/.test(trimmed)) {
    return `${trimmed} حصان`
  }
  return trimmed
}
