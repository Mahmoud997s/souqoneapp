import { Platform, I18nManager } from 'react-native'
import { Colors } from './colors'
import { Spacing } from './spacing'
import { Radius } from './radius'

/**
 * BottomBarTokens
 * Single source of truth for the glassmorphic bottom navigation bar styling,
 * shared across the unified bottom bar shell, section action bars, and tab bar.
 * Built per task D-166 to eliminate visual drift between bottom bars.
 */
export const BottomBarTokens = {
  // ── Layout Dimensions (Expanded) ──
  expandedHeight: 52,
  expandedRadius: 26,
  marginHorizontal: 16,
  maxWidth: 480,

  // ── Layout Dimensions (Collapsed Circle) ──
  collapsedSize: 56,
  collapsedRadius: 28,
  collapsedIconSize: 24,
  minTouchTarget: 44, // Meets Apple HIG (>= 44pt) and WCAG standards

  // ── Glass Background Layers ──
  blurIntensityIos: 65,
  blurIntensityAndroid: 45,
  blurIntensity: Platform.OS === 'ios' ? 65 : 45,
  blurTint: 'light' as const,
  blurMethod: 'dimezisBlurView' as const,

  // Translucent white literals strictly itemized per report 409
  whiteWashBg: 'rgba(255, 255, 255, 0.78)',
  whiteWashGradient: ['rgba(255, 255, 255, 0.70)', 'rgba(255, 255, 255, 0.45)'] as const,
  borderColor: 'rgba(255, 255, 255, 0.60)',
  borderFallbackColor: Colors.border,
  borderWidth: 1,
  rippleColor: 'rgba(255, 255, 255, 0.20)',

  // ── Outer Elevation Shadow ──
  shadow: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
    },
    android: {
      elevation: 6,
    },
  }),

  // ── Active Pill & Tab Item ──
  activePillWidth: 40,
  activePillHeight: 28,
  activePillRadius: 14,
  activePillBg: Colors.paleMint,
  activeIconColor: Colors.primary,
  inactiveIconColor: Colors.textMuted,

  // ── Animation Timings & Thresholds ──
  animation: {
    /** Labels fade out completely during the first 20% of progress (~60ms in 300ms transition) */
    labelFadeProgress: 0.2,
    /** Collapsed icon fades in during the final 20% of progress (0.8 -> 1.0) */
    iconFadeProgress: 0.8,
    /** Spring configuration for smooth natural motion on expand/collapse */
    springConfig: {
      damping: 20,
      stiffness: 180,
      mass: 0.8,
    },
  },

  // ── Accessibility & Labels ──
  accessibility: {
    collapsedRole: 'button' as const,
    collapsedLabelArabic: 'توسيع شريط التنقل',
  },
} as const

/**
 * Returns the positioning style key ('left' or 'right') to anchor the collapsed
 * bottom bar circle at the PHYSICAL BOTTOM-LEFT of the screen.
 *
 * Fabric RTL Mirroring Fact:
 * - When I18nManager.isRTL is true, Fabric automatically mirrors `left` to physical Right,
 *   and mirrors `right` to physical Left.
 * - When I18nManager.isRTL is false, standard `left` is on physical Left.
 *
 * Therefore:
 * - In RTL mode (true): style key 'right' lands on the PHYSICAL LEFT edge.
 * - In LTR mode (false): style key 'left' lands on the PHYSICAL LEFT edge.
 *
 * @param isRTL Override for testing; defaults to I18nManager.isRTL
 */
export function getCollapsedCircleAnchorKey(isRTL: boolean = I18nManager.isRTL): 'left' | 'right' {
  return isRTL ? 'right' : 'left'
}

/**
 * Returns a style object anchoring the collapsed circle to the physical bottom-left edge,
 * correctly taking Fabric RTL coordinate mirroring into account.
 *
 * @param margin Distance from physical left edge in pixels (defaults to BottomBarTokens.marginHorizontal)
 * @param isRTL Override for testing; defaults to I18nManager.isRTL
 */
export function getCollapsedCircleAnchorStyle(
  margin: number = BottomBarTokens.marginHorizontal,
  isRTL: boolean = I18nManager.isRTL
): { left?: number; right?: number } {
  const key = getCollapsedCircleAnchorKey(isRTL)
  return { [key]: margin }
}

/**
 * Computed bottom bar geometry at any progress point between 0 (expanded) and 1 (collapsed).
 */
export interface BottomBarGeometry {
  width: number
  height: number
  borderRadius: number
  labelOpacity: number
  collapsedIconOpacity: number
  isCollapsed: boolean
}

/**
 * Pure geometry helper computing width, height, radius, label opacity, and collapsed icon opacity
 * for any given progress value (0..1) across screen widths (e.g. 360, 390, 430).
 *
 * @param progress Value from 0 (fully expanded) to 1 (fully collapsed)
 * @param screenWidth Screen width in points (e.g. 360, 390, 430)
 * @param reducedMotion If true, switches instantly at progress 0.5 without continuous interpolation
 */
export function computeBottomBarGeometry(
  progress: number,
  screenWidth: number,
  reducedMotion: boolean = false
): BottomBarGeometry {
  const clampedProgress = Math.max(0, Math.min(1, progress))
  const expandedWidth = Math.min(
    screenWidth - 2 * BottomBarTokens.marginHorizontal,
    BottomBarTokens.maxWidth
  )
  const collapsedSize = BottomBarTokens.collapsedSize
  const expandedHeight = BottomBarTokens.expandedHeight
  const expandedRadius = BottomBarTokens.expandedRadius
  const collapsedRadius = BottomBarTokens.collapsedRadius

  if (reducedMotion) {
    const isCollapsed = clampedProgress >= 0.5
    return {
      width: isCollapsed ? collapsedSize : expandedWidth,
      height: isCollapsed ? collapsedSize : expandedHeight,
      borderRadius: isCollapsed ? collapsedRadius : expandedRadius,
      labelOpacity: isCollapsed ? 0 : 1,
      collapsedIconOpacity: isCollapsed ? 1 : 0,
      isCollapsed,
    }
  }

  // Continuous interpolation
  const width = expandedWidth + (collapsedSize - expandedWidth) * clampedProgress
  const height = expandedHeight + (collapsedSize - expandedHeight) * clampedProgress
  const borderRadius = expandedRadius + (collapsedRadius - expandedRadius) * clampedProgress

  // Label opacity: fades out over the first 20% (progress 0 -> 0.2)
  let labelOpacity = 0
  if (clampedProgress <= 0) {
    labelOpacity = 1
  } else if (clampedProgress >= BottomBarTokens.animation.labelFadeProgress) {
    labelOpacity = 0
  } else {
    labelOpacity = 1 - clampedProgress / BottomBarTokens.animation.labelFadeProgress
  }

  // Collapsed icon opacity: fades in over the last 20% (progress 0.8 -> 1.0)
  let collapsedIconOpacity = 0
  if (clampedProgress >= 1) {
    collapsedIconOpacity = 1
  } else if (clampedProgress <= BottomBarTokens.animation.iconFadeProgress) {
    collapsedIconOpacity = 0
  } else {
    collapsedIconOpacity =
      (clampedProgress - BottomBarTokens.animation.iconFadeProgress) /
      (1 - BottomBarTokens.animation.iconFadeProgress)
  }

  return {
    width: Math.round(width * 100) / 100,
    height: Math.round(height * 100) / 100,
    borderRadius: Math.round(borderRadius * 100) / 100,
    labelOpacity: Math.round(labelOpacity * 1000) / 1000,
    collapsedIconOpacity: Math.round(collapsedIconOpacity * 1000) / 1000,
    isCollapsed: clampedProgress === 1,
  }
}
