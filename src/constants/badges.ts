export type BadgeIntent =
  'primary' | 'success' | 'danger' |
  'orange' | 'neutral' | 'gold' | 'silver'

export const BADGE_COLORS: Record<BadgeIntent, {
  bg: string; text: string; border?: string
}> = {
  primary: { bg: '#dbeafe', text: '#1d4ed8', border: '#bfdbfe' },
  success: { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' },
  danger:  { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
  orange:  { bg: '#ffedd5', text: '#9a3412', border: '#fed7aa' },
  neutral: { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb' },
  gold:    { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
  silver:  { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
}

export const CONDITION_INTENT: Record<string, BadgeIntent> = {
  NEW: 'success', LIKE_NEW: 'success', USED: 'neutral',
  GOOD: 'primary', FAIR: 'orange',
  POOR: 'danger', REFURBISHED: 'orange',
}

export const LISTING_TYPE_INTENT: Record<string, BadgeIntent> = {
  SALE: 'primary', RENTAL: 'success', WANTED: 'orange',
  BUS_SALE: 'primary', BUS_RENT: 'success',
  EQUIPMENT_SALE: 'primary', EQUIPMENT_RENT: 'success',
  PART: 'neutral', SERVICE: 'success',
}

export const LISTING_TYPE_LABELS: Record<string, string> = {
  SALE: 'للبيع', RENTAL: 'إيجار', WANTED: 'مطلوب',
  BUS_SALE: 'للبيع', BUS_RENT: 'إيجار',
  EQUIPMENT_SALE: 'للبيع', EQUIPMENT_RENT: 'إيجار',
  PART: 'قطعة غيار', SERVICE: 'خدمة',
}

export const CONDITION_DOTS: Record<string, string> = {
  NEW: '#10b981', LIKE_NEW: '#14b8a6', USED: '#94a3b8',
  GOOD: '#0ea5e9', FAIR: '#f59e0b',
  POOR: '#ef4444', REFURBISHED: '#f97316',
}
