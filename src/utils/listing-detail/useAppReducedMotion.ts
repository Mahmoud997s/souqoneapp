import { useReducedMotion } from 'react-native-reanimated'

/**
 * useAppReducedMotion
 * Safe wrapper around Reanimated's useReducedMotion hook.
 * Gracefully defaults to false in Jest test environments where
 * react-native-reanimated/mock does not provide the hook.
 */
export function useAppReducedMotion(
  fallbackOrGetter?: () => boolean
): boolean {
  if (fallbackOrGetter) {
    return fallbackOrGetter()
  }

  if (typeof useReducedMotion === 'function') {
    try {
      return Boolean(useReducedMotion())
    } catch {
      return false
    }
  }
  return false
}
