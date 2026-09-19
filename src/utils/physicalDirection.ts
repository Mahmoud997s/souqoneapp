import { I18nManager } from 'react-native'

/**
 * Fabric (New Architecture) has a known regression where I18nManager.isRTL
 * causes React Native to swap the meaning of absolute `left`/`right` positioning styles.
 *
 * This utility serves as the SINGLE SOURCE OF TRUTH in the codebase to compensate
 * for physical vs logical coordinate mapping.
 *
 * - When I18nManager.isRTL is true, Fabric mirrors `left` to the physical RIGHT.
 * - When I18nManager.isRTL is false, standard `right` is on the physical RIGHT.
 *
 * If a future React Native / Expo release fixes this regression, this is the
 * ONLY file that needs to change.
 */

/**
 * Returns the property name ('left' or 'right') that anchors an element
 * to the PHYSICAL RIGHT edge of the screen.
 */
export function getPhysicalSide(): 'left' | 'right' {
  return I18nManager.isRTL ? 'left' : 'right'
}

/**
 * Returns a style object anchoring an element to the physical right edge,
 * regardless of I18nManager.isRTL state or system locale.
 *
 * @param offset Number of pixels from the physical right edge
 */
export function physicalRightStyle(offset: number): { left?: number; right?: number } {
  const side = getPhysicalSide()
  return { [side]: offset }
}

/**
 * Returns the flexDirection ('row' or 'row-reverse') needed to make flex items
 * flow physically from RIGHT to LEFT (element 0 on the physical right).
 *
 * - In RTL mode: 'row' flows naturally from Right to Left.
 * - In LTR mode: 'row-reverse' flows from Right to Left.
 */
export function physicalRowDirection(): 'row' | 'row-reverse' {
  return I18nManager.isRTL ? 'row' : 'row-reverse'
}

/**
 * Returns the sign multiplier (1 or -1) to apply to gesture translationX/velocityX
 * so drag direction stays physically correct regardless of I18nManager.isRTL state,
 * ensuring touching right moves right and touching left moves left (1:1 direct manipulation).
 */
export function getGestureDirectionMultiplier(): 1 | -1 {
  return I18nManager.isRTL ? 1 : -1
}

