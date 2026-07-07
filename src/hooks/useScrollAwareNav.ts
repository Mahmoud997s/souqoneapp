/**
 * useScrollAwareNav
 * ─────────────────────────────────────────────────────────
 * Returns a Reanimated scroll handler that drives the
 * tab bar hide/show animation entirely on the UI thread.
 *
 * Usage:
 *   const { scrollHandler } = useScrollAwareNav()
 *   <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16} />
 */
import { useSharedValue, useAnimatedScrollHandler, withSpring, withTiming } from 'react-native-reanimated'
import { useNavVisibility, TAB_BAR_H } from '../context/NavVisibilityContext'

// ─── Tuning ──────────────────────────────────────────────
const SCROLL_THRESHOLD  = 12   // px delta before triggering hide/show
const TOP_RESTORE_Y     = 60   // always restore nav when within 60px of top
const HIDE_OFFSET       = TAB_BAR_H + 40  // total translateY to push bar off screen

const SPRING_SHOW  = { damping: 20, stiffness: 280, mass: 0.8 }
const TIMING_HIDE  = { duration: 220 }

export function useScrollAwareNav() {
  const { navHidden } = useNavVisibility()

  // Track last scroll position on UI thread (no React state)
  const scrollY  = useSharedValue(0)
  const lastY    = useSharedValue(0)
  const velocity = useSharedValue(0)

  const scrollHandler = useAnimatedScrollHandler({
    onScroll(event) {
      const y  = event.contentOffset.y
      scrollY.value = y
      const dy = y - lastY.value

      // ── Always restore at top ──────────────────────────
      if (y <= TOP_RESTORE_Y) {
        if (navHidden.value !== 0) {
          navHidden.value = withSpring(0, SPRING_SHOW)
        }
        lastY.value = y
        return
      }

      // ── Ignore micro-jitter ────────────────────────────
      if (Math.abs(dy) < SCROLL_THRESHOLD) {
        lastY.value = y
        return
      }

      velocity.value = dy

      if (dy > 0) {
        // ── Scrolling DOWN → hide ──────────────────────
        if (navHidden.value !== 1) {
          navHidden.value = withTiming(1, TIMING_HIDE)
        }
      } else {
        // ── Scrolling UP → show ────────────────────────
        if (navHidden.value !== 0) {
          navHidden.value = withSpring(0, SPRING_SHOW)
        }
      }

      lastY.value = y
    },

    onBeginDrag(event) {
      lastY.value = event.contentOffset.y
    },

    onMomentumEnd(event) {
      // Restore if momentum scrolled back to top
      if (event.contentOffset.y <= TOP_RESTORE_Y) {
        navHidden.value = withSpring(0, SPRING_SHOW)
      }
    },
  })

  return { scrollHandler, HIDE_OFFSET, scrollY }
}
