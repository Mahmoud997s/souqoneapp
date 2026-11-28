import { useEffect, useState } from 'react'
import { Keyboard, Platform } from 'react-native'
import { CHAT_INPUT_MARGIN_BOTTOM } from '../constants/bottomBarTokens'

export const CHAT_INPUT_BASE_BOTTOM_PAD = CHAT_INPUT_MARGIN_BOTTOM

/**
 * Computes the bottom padding for the chat composer wrapper.
 * While the keyboard is visible, omit the safe-area bottom inset so no gap
 * appears between the composer and the keyboard; when hidden, respect safe-area.
 */
export function computeChatInputBottomPadding(
  insetsBottom: number,
  isKeyboardVisible: boolean
): number {
  if (isKeyboardVisible) {
    return CHAT_INPUT_BASE_BOTTOM_PAD
  }
  return Math.max(insetsBottom, CHAT_INPUT_BASE_BOTTOM_PAD)
}

export interface ScrollMetrics {
  contentOffset: { y: number }
  contentSize: { height: number }
  layoutMeasurement: { height: number }
}

/**
 * Returns true when the scroll position is within `thresholdRatio` (default 0.2)
 * of the bottom of the list, matching FlashList's `autoscrollToBottomThreshold`.
 */
export function isScrollNearBottom(
  metrics: ScrollMetrics,
  thresholdRatio = 0.2
): boolean {
  const distanceFromBottom = Math.max(
    0,
    metrics.contentSize.height - (metrics.contentOffset.y + metrics.layoutMeasurement.height)
  )
  return distanceFromBottom <= metrics.layoutMeasurement.height * thresholdRatio
}

/**
 * Tracks software keyboard visibility using platform-appropriate events
 * (`keyboardWillShow/Hide` on iOS, `keyboardDidShow/Hide` on Android).
 */
export function useKeyboardVisible(): boolean {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'

    const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true))
    const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false))

    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  return isKeyboardVisible
}
