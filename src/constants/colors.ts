export const Colors = {
  // Official SouqOne Turquoise (#009CB5)
  primary:      '#009CB5', // الفيروزي الرئيسي: للأزرار الرئيسية، أيقونات الأقسام، والعناصر النشطة
  primaryDark:  '#192435', // الكحلي: لخلفية البانر الداكن والبطاقات العميقة
  primaryMid:   '#009CB5', // الفيروزي الرئيسي
  primaryLight: '#009CB5', // الفيروزي الرئيسي
  primaryDeep:  '#11232E', // الفحمي: للعناوين، أسماء الأقسام، أسماء السيارات، والأسعار

  // Accent & Brand
  accent:       '#009CB5',
  brandOrange:  '#009CB5',

  // Backward-compatible token aliases mapped to the new palette
  darkForest:   '#11232E',
  pineGreen:    '#192435',
  hunterGreen:  '#009CB5',
  forestGreen:  '#009CB5',
  sage:         '#009CB5',
  paleMint:     '#ECF8FA', // الفيروزي الفاتح: لخلفية القسم المحدد وخلفية أيقونة الرئيسية النشطة

  // Equipment Theme
  equipmentPrimary: '#009CB5',
  equipmentDark:    '#192435',
  equipmentLight:   '#ECF8FA',
  equipmentBg:      '#F7F8FA',

  // Surfaces & Backgrounds
  surface:      '#FFFFFF', // الأبيض: للخلفية العامة، بطاقات الإعلانات، والشريط السفلي
  surfaceAlt:   '#F7F8FA', // الرمادي الفاتح جدًا: لخلفيات بطاقات الأقسام
  homeBg:       '#F8F9FB', // خلفية الرئيسية والصفحات المحايدة
  white:        '#FFFFFF', // الأبيض
  inputBg:      '#EEF2F5', // الرمادي الفاتح: لمربعات الأيقونات وحقول الإدخال والبحث

  // Text & Typography (100% Opacity)
  text:         '#11232E', // الفحمي: للعناوين، أسماء الأقسام، أسماء السيارات، والأسعار
  text2:        '#11232E',
  textMuted:    '#6B7280', // الرمادي للنصوص: للموقع، الوصف، والنصوص والأيقونات غير النشطة
  placeholder:  '#6B7280',

  // Borders & Dividers
  border:       '#E5E7EB', // الحدود والفواصل: للإطارات والخطوط الفاصلة الخفيفة
  borderStrong: '#009CB5', // حدود العناصر النشطة والمركّزة

  // Semantic
  success:      '#009CB5',
  successDeep:  '#192435',
  error:        '#dc2626',
  errorSoftBg:  'rgba(220, 38, 38, 0.08)', // خلفية خفيفة لأزرار الحذف والتحذير (Danger tint)
  warning:      '#f59e0b',
  warningBg:     '#FFFBEB',
  warningBorder: '#FDE68A',
  warningText:   '#92400E',
  info:         '#009CB5',
  transparent:  'transparent',

  // Named soft tokens (pre-computed alpha variants so render paths never call withAlpha per item)
  primarySoft12: 'rgba(0, 156, 181, 0.12)',
  primarySoft14: 'rgba(0, 156, 181, 0.14)',
  primarySoft15: 'rgba(0, 156, 181, 0.15)',
  primarySoft25: 'rgba(0, 156, 181, 0.25)',
  primarySoft30: 'rgba(0, 156, 181, 0.30)',
  primaryHex12:  '#009CB512',
  primaryHex14:  '#009CB514',
  primaryHex15:  '#009CB515',
  primaryHex25:  '#009CB525',
  primaryHex30:  '#009CB530',
  errorSoft06:   'rgba(220, 38, 38, 0.06)',
  errorSoft10:   'rgba(220, 38, 38, 0.10)',
  errorSoft12:   'rgba(220, 38, 38, 0.12)',
  errorSoft25:   'rgba(220, 38, 38, 0.25)',
  errorBorder40: 'rgba(220, 38, 38, 0.40)',
  errorHex40:    '#dc262640',
  scrimDark45:   'rgba(0, 0, 0, 0.45)',
  scrimDark60:   'rgba(0, 0, 0, 0.60)',
  scrimDark65:   'rgba(0, 0, 0, 0.65)',
  scrimSlate85:  'rgba(15, 23, 42, 0.85)',
  whiteAlpha20:  'rgba(255, 255, 255, 0.20)',
  whiteAlpha45:  'rgba(255, 255, 255, 0.45)',
  whiteAlpha85:  'rgba(255, 255, 255, 0.85)',
  whiteAlpha05:  'rgba(255, 255, 255, 0.05)',
  whiteAlpha06:  'rgba(255, 255, 255, 0.06)',
  whiteAlpha08:  'rgba(255, 255, 255, 0.08)',
  whiteAlpha10:  'rgba(255, 255, 255, 0.10)',
  whiteAlpha12:  'rgba(255, 255, 255, 0.12)',
  whiteAlpha14:  'rgba(255, 255, 255, 0.14)',
  whiteAlpha15:  'rgba(255, 255, 255, 0.15)',
  whiteAlpha16:  'rgba(255, 255, 255, 0.16)',
  whiteAlpha18:  'rgba(255, 255, 255, 0.18)',
  whiteAlpha22:  'rgba(255, 255, 255, 0.22)',
  whiteAlpha25:  'rgba(255, 255, 255, 0.25)',
  whiteAlpha30:  'rgba(255, 255, 255, 0.30)',
  whiteAlpha35:  'rgba(255, 255, 255, 0.35)',
  whiteAlpha40:  'rgba(255, 255, 255, 0.40)',
  whiteAlpha50:  'rgba(255,255,255,0.5)',
  whiteAlpha60:  'rgba(255, 255, 255, 0.60)',
  whiteAlpha70:  'rgba(255,255,255,0.7)',
  whiteAlpha72:  'rgba(255, 255, 255, 0.72)',
  whiteAlpha75:  'rgba(255, 255, 255, 0.75)',
  whiteAlpha80:  'rgba(255,255,255,0.8)',
  whiteAlpha82:  'rgba(255, 255, 255, 0.82)',
  whiteAlpha88:  'rgba(255, 255, 255, 0.88)',
  whiteAlpha90:  'rgba(255, 255, 255, 0.90)',
  whiteAlpha92:  'rgba(255, 255, 255, 0.92)',
  whiteAlpha95:  'rgba(255, 255, 255, 0.95)',
  scrimDark03:   'rgba(0, 0, 0, 0.03)',
  scrimDark04:   'rgba(0, 0, 0, 0.04)',
  scrimDark05:   'rgba(0, 0, 0, 0.05)',
  scrimDark06:   'rgba(0, 0, 0, 0.06)',
  scrimDark08:   'rgba(0, 0, 0, 0.08)',
  scrimDark10:   'rgba(0, 0, 0, 0.10)',
  scrimDark15:   'rgba(0, 0, 0, 0.15)',
  scrimDark20:   'rgba(0, 0, 0, 0.20)',
  scrimDark30:   'rgba(0, 0, 0, 0.30)',
  scrimDark35:   'rgba(0, 0, 0, 0.35)',
  scrimDark40:   'rgba(0, 0, 0, 0.40)',
  scrimDark50:   'rgba(0, 0, 0, 0.50)',
  navyDarkSoft85:'rgba(25, 36, 53, 0.85)',
  emeraldBrightSoft10: 'rgba(22, 163, 74, 0.10)',
  emeraldBrightSoft25: 'rgba(22, 163, 74, 0.25)',
  amberTextSoft10:     'rgba(217, 119, 6, 0.10)',
  amberTextSoft25:     'rgba(217, 119, 6, 0.25)',
  scrimSlate06:  'rgba(15, 23, 42, 0.06)',
  scrimSlate08:  'rgba(15, 23, 42, 0.08)',
  scrimSlate55:  'rgba(15, 23, 42, 0.55)',
  scrimSlate60:  'rgba(15, 23, 42, 0.60)',
  scrimSlate75:  'rgba(15, 23, 42, 0.75)',
  navySoft06:    'rgba(13, 48, 96, 0.06)',
  navySoft08:    'rgba(13, 48, 96, 0.08)',
  navySoft14:    'rgba(13, 48, 96, 0.14)',
  navySoft16:    'rgba(13, 48, 96, 0.16)',
  blueSoft10:    'rgba(0, 74, 198, 0.10)',
  readReceiptSoft10: 'rgba(52, 183, 241, 0.10)',
  flameSoft12:   'rgba(254, 94, 0, 0.12)',
  amberDeepSoft10: 'rgba(232, 120, 30, 0.10)',
  iosRedSoft10:  'rgba(255, 59, 48, 0.10)',
  errorSoft35:   'rgba(220, 38, 38, 0.35)',
  mutedSoft12:   'rgba(107, 114, 128, 0.12)',
  iosRedSoft90:  'rgba(255, 59, 48, 0.90)',
  skySoft10:     'rgba(56, 189, 248, 0.10)',
  warningSoft15: 'rgba(245, 158, 11, 0.15)',
  warningSoft16: 'rgba(245, 158, 11, 0.16)',
  warningSoft18: 'rgba(245, 158, 11, 0.18)',
  warningBorder38: 'rgba(245, 158, 11, 0.38)',
  warningBorder45: 'rgba(245, 158, 11, 0.45)',

  // legacy palette, exact values, consolidation candidates
  slateBorder:       '#E2E8F0',
  slateSurface:      '#F8FAFC',
  slateHeading:      '#0F172A',
  slateMuted:        '#94A3B8',
  slateSubtleBg:     '#F1F5F9',
  slateText:         '#64748B',
  infoSoftBg:        '#EFF6FF',
  emerald:           '#059669',
  slateBorderStrong: '#CBD5E1',
  slateBody:         '#334155',
  slateSecondary:    '#475569',
  slateDark:         '#1E293B',
  shadowBlack:       '#000000',
  dangerBg:          '#FEF2F2',
  emeraldBright:     '#16A34A',
  dangerBorder:      '#FECACA',
  emeraldBg:         '#ECFDF5',
  infoBorder:        '#BFDBFE',
  infoText:          '#1E40AF',
  amberText:         '#D97706',
  infoPrimary:       '#2563EB',
  dangerBright:      '#EF4444',
  orangeBorder:      '#FED7AA',
  orangeDarkText:    '#9A3412',
  dangerSurface:     '#FFFBFB',
  slateTintBg:       '#F7F9FC',
  amberGold:         '#FBBF24',
  orangePrimary:     '#EA580C',
  orangeBg:          '#FFF7ED',
  orangeDeep:        '#C2410C',
  greenSoftBg:       '#F0FDF4',
  rosePrimary:       '#E11D48',
  violetSoftBg:      '#F3EEFF',
  dangerDarkText:    '#991B1B',
  dangerDeep:        '#B91C1C',
  greenBorder:       '#BBF7D0',
  greenDarkText:     '#166534',
  amberSoftBg:       '#FEF3C7',
  roseSoftBg:        '#FFF1F2',
  violetPrimary:     '#7C3AED',
  skyPrimary:        '#0284C7',
  blueTintBg:        '#EAF2FF',
  peachTintBg:       '#FFF6EE',
  neutralSurface:    '#F8F9FA',
  blueSoftBg:        '#DBEAFE',
  blueDeepText:      '#1E3A8A',
  blueBright:        '#3B82F6',
  skySoftBg:         '#F0F9FF',
  skyBorder:         '#BAE6FD',
  indigoTintBg:      '#EEF3FF',
  neutralBorder:     '#E2E4E8',
  emeraldSoft:       '#10B981',
  greenMintBg:       '#DCFCE7',
  chatDivider:       '#EDF2F7',
  emeraldLight:      '#34D399',
  iosRed:            '#FF3B30',
  iosRedSoftBg:      '#FFE5E5',
  chatBubbleMutedBg: '#F4F6F9',
  chatSurfaceTint:   '#FAFBFD',
  readReceiptBlue:   '#34B7F1',
  neutralLightBg:    '#F5F5F5',
  coralDanger:       '#FF4D4D',
  mintSoftBg:        '#E5F6E5',
  forestBadgeText:   '#2E7D32',
  slateSoftBorder:   '#EBF0F6',
  gray50Surface:     '#F9FAFB',
  slateCoolMuted:    '#8E9BAE',
  chatHeaderBg:      '#F4F7FB',
  chatInputBorder:   '#E6ECF3',
  slateCoolBg:       '#EEF2F6',
  skyLightBg:        '#E0F2FE',
  coralLight:        '#FF6B6B',
  dangerLightBorder: '#FCA5A5',
  neutralBorderLight:'#E5E5E5',
  slateMutedCool:    '#8791A3',
  blueLightBorder:   '#93C5FD',
  blueIceTintBg:     '#F0F7FF',
  dangerSoftBg:      '#FEE2E2',
  emeraldDeepText:   '#065F46',
  emeraldBorder:     '#A7F3D0',
  emeraldDark:       '#047857',
  warningYellow:     '#FFCC00',
  emeraldSoftBg:     '#D1FAE5',
  neutralBgLight:    '#FAFAFA',
} as const

export const BrandColors = {
  googleBg:     '#FFFFFF',
  googleBorder: '#DADCE0',
  googleText:   '#3C4043',
  googleBlue:   '#4285F4',
  googleGreen:  '#34A853',
  googleYellow: '#FBBC05',
  googleRed:    '#EA4335',
  appleBg:      '#000000',
  appleText:    '#FFFFFF',
  whatsapp:     '#25D366',
} as const

/**
 * Converts a CSS/RN color (#RGB, #RRGGBB, #RRGGBBAA, rgb(), rgba()) to rgba(r, g, b, alpha).
 * Clamps alpha to [0, 1], never throws, never double-wraps rgba, and returns invalid input unchanged.
 */
export function withAlpha(color: string, alpha: number): string {
  if (typeof color !== 'string' || typeof alpha !== 'number' || !Number.isFinite(alpha)) {
    return color
  }
  const trimmed = color.trim()
  if (!trimmed) return color

  const clamped = Math.min(1, Math.max(0, alpha))
  const alphaOut = Number(clamped.toFixed(4))

  const hex3 = trimmed.match(/^#([0-9a-fA-F]{3})$/)
  if (hex3) {
    const [r, g, b] = hex3[1].split('').map((ch) => parseInt(ch + ch, 16))
    return `rgba(${r}, ${g}, ${b}, ${alphaOut})`
  }

  const hex6or8 = trimmed.match(/^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/)
  if (hex6or8) {
    const hex = hex6or8[1]
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alphaOut})`
  }

  const rgbMatch = trimmed.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(?:\d*\.?\d+))?\s*\)$/i
  )
  if (rgbMatch) {
    const r = Math.min(255, parseInt(rgbMatch[1], 10))
    const g = Math.min(255, parseInt(rgbMatch[2], 10))
    const b = Math.min(255, parseInt(rgbMatch[3], 10))
    return `rgba(${r}, ${g}, ${b}, ${alphaOut})`
  }

  return color
}
