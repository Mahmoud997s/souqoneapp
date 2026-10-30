import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  Keyboard,
  useWindowDimensions,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated'
import { BlurView } from 'expo-blur'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { useNavVisibility } from '../../context/NavVisibilityContext'
import {
  BottomBarTokens,
  getCollapsedCircleAnchorKey,
} from '../../constants/bottomBarTokens'
import { useAppReducedMotion } from '../../utils/listing-detail/useAppReducedMotion'

/**
 * Hook to detect if the software keyboard is currently visible.
 * Used by GlassBottomBarShell to hide the bottom bar completely while typing.
 */
export function useBottomBarKeyboardHide(): boolean {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false)

  useEffect(() => {
    const onShow = () => setKeyboardVisible(true)
    const onHide = () => setKeyboardVisible(false)

    const sub1 = Keyboard.addListener('keyboardDidShow', onShow)
    const sub2 = Keyboard.addListener('keyboardWillShow', onShow)
    const sub3 = Keyboard.addListener('keyboardDidHide', onHide)
    const sub4 = Keyboard.addListener('keyboardWillHide', onHide)

    return () => {
      sub1.remove()
      sub2.remove()
      sub3.remove()
      sub4.remove()
    }
  }, [])

  return isKeyboardVisible
}

export interface GlassBottomBarShellProps {
  children?: React.ReactNode
  collapsedIcon?: React.ReactNode
  badge?: React.ReactNode
  onExpand?: () => void
  reducedMotion?: boolean
  bottomPad?: number
  testID?: string
}

/**
 * GlassBottomBarShell
 * Unified glassmorphic bottom navigation container with morphing collapse behavior.
 *
 * Driven by `navHidden` (0 = expanded, 1 = collapsed) from `NavVisibilityContext`.
 * - Expanded: full-width glass pill displaying children.
 * - Collapsing: labels fade out first (~60ms / progress 0..0.2), then width morphs.
 * - Collapsed: 56x56 glass circle anchored at physical bottom-left showing collapsedIcon.
 * - Tapping collapsed circle calls `onExpand` or smoothly resets `navHidden.value` to 0.
 * - Hides completely while the software keyboard is visible.
 * - Conforms to Apple HIG (>= 44pt touch target) and full accessibility semantics.
 */
export function GlassBottomBarShell({
  children,
  collapsedIcon,
  badge,
  onExpand,
  reducedMotion: reducedMotionProp,
  bottomPad = BottomBarTokens.marginHorizontal,
  testID = 'glass-bottom-bar-shell',
}: GlassBottomBarShellProps) {
  const isKeyboardVisible = useBottomBarKeyboardHide()
  const systemReducedMotion = useAppReducedMotion()
  const isReducedMotion = reducedMotionProp ?? systemReducedMotion

  const windowDimensions = useWindowDimensions()
  const windowWidth = windowDimensions?.width > 0 ? windowDimensions.width : 390

  // Gracefully resolve navVisibility context or fallback to static expanded state
  let navCtx: { navHidden: SharedValue<number> } | null = null
  try {
    navCtx = useNavVisibility()
  } catch {
    navCtx = null
  }
  const navHidden = navCtx?.navHidden ?? null

  // Layout calculations
  const expandedWidth = Math.min(
    windowWidth - 2 * BottomBarTokens.marginHorizontal,
    BottomBarTokens.maxWidth
  )
  const isTablet = windowWidth > BottomBarTokens.maxWidth + 2 * BottomBarTokens.marginHorizontal
  const expandedOffset = isTablet
    ? (windowWidth - expandedWidth) / 2
    : BottomBarTokens.marginHorizontal
  const collapsedOffset = BottomBarTokens.marginHorizontal

  // Anchor key: In RTL mode, 'right' mirrors to physical left; in LTR, 'left' is physical left
  const anchorKey = getCollapsedCircleAnchorKey()

  const handleExpand = () => {
    if (onExpand) {
      onExpand()
    } else if (navHidden) {
      if (isReducedMotion) {
        navHidden.value = 0
      } else {
        navHidden.value = withSpring(0, BottomBarTokens.animation.springConfig)
      }
    }
  }

  // ── Animated Container Style ──
  const animatedContainerStyle = useAnimatedStyle(() => {
    if (!navHidden) {
      return {
        width: expandedWidth,
        height: BottomBarTokens.expandedHeight,
        borderRadius: BottomBarTokens.expandedRadius,
        [anchorKey]: expandedOffset,
      }
    }

    if (isReducedMotion) {
      const isCollapsed = navHidden.value >= 0.5
      return {
        width: isCollapsed ? BottomBarTokens.collapsedSize : expandedWidth,
        height: isCollapsed ? BottomBarTokens.collapsedSize : BottomBarTokens.expandedHeight,
        borderRadius: isCollapsed
          ? BottomBarTokens.collapsedRadius
          : BottomBarTokens.expandedRadius,
        [anchorKey]: isCollapsed ? collapsedOffset : expandedOffset,
      }
    }

    const width = interpolate(
      navHidden.value,
      [0, 1],
      [expandedWidth, BottomBarTokens.collapsedSize],
      Extrapolation.CLAMP
    )
    const height = interpolate(
      navHidden.value,
      [0, 1],
      [BottomBarTokens.expandedHeight, BottomBarTokens.collapsedSize],
      Extrapolation.CLAMP
    )
    const borderRadius = interpolate(
      navHidden.value,
      [0, 1],
      [BottomBarTokens.expandedRadius, BottomBarTokens.collapsedRadius],
      Extrapolation.CLAMP
    )
    const offset = interpolate(
      navHidden.value,
      [0, 1],
      [expandedOffset, collapsedOffset],
      Extrapolation.CLAMP
    )

    return {
      width,
      height,
      borderRadius,
      [anchorKey]: offset,
    }
  })

  // ── Animated Background Style ──
  const animatedBackgroundStyle = useAnimatedStyle(() => {
    if (!navHidden) {
      return { borderRadius: BottomBarTokens.expandedRadius }
    }
    if (isReducedMotion) {
      return {
        borderRadius:
          navHidden.value >= 0.5
            ? BottomBarTokens.collapsedRadius
            : BottomBarTokens.expandedRadius,
      }
    }
    const borderRadius = interpolate(
      navHidden.value,
      [0, 1],
      [BottomBarTokens.expandedRadius, BottomBarTokens.collapsedRadius],
      Extrapolation.CLAMP
    )
    return { borderRadius }
  })

  // ── Animated Content Style (labels and tabs fade out first) ──
  const animatedContentStyle = useAnimatedStyle(() => {
    if (!navHidden) {
      return { opacity: 1, transform: [{ scale: 1 }] }
    }
    if (isReducedMotion) {
      const isCollapsed = navHidden.value >= 0.5
      return {
        opacity: isCollapsed ? 0 : 1,
        transform: [{ scale: isCollapsed ? 0 : 1 }],
      }
    }
    const opacity = interpolate(
      navHidden.value,
      [0, BottomBarTokens.animation.labelFadeProgress],
      [1, 0],
      Extrapolation.CLAMP
    )
    const scale = interpolate(
      navHidden.value,
      [0, BottomBarTokens.animation.labelFadeProgress],
      [1, 0.95],
      Extrapolation.CLAMP
    )
    return {
      opacity,
      transform: [{ scale }],
    }
  })

  // ── Animated Collapsed Icon Button Style (fades in at the end) ──
  const animatedCollapsedStyle = useAnimatedStyle(() => {
    if (!navHidden) {
      return { opacity: 0, transform: [{ scale: 0 }] }
    }
    if (isReducedMotion) {
      const isCollapsed = navHidden.value >= 0.5
      return {
        opacity: isCollapsed ? 1 : 0,
        transform: [{ scale: isCollapsed ? 1 : 0 }],
      }
    }
    const opacity = interpolate(
      navHidden.value,
      [BottomBarTokens.animation.iconFadeProgress, 1],
      [0, 1],
      Extrapolation.CLAMP
    )
    const scale = interpolate(
      navHidden.value,
      [BottomBarTokens.animation.iconFadeProgress, 1],
      [0.8, 1],
      Extrapolation.CLAMP
    )
    return {
      opacity,
      transform: [{ scale }],
    }
  })

  // If software keyboard is active, hide shell completely
  if (isKeyboardVisible) {
    return null
  }

  return (
    <Animated.View
      testID={testID}
      style={[s.container, { bottom: bottomPad }, animatedContainerStyle]}
    >
      {/* ── Glass Background & Border ── */}
      <Animated.View style={[s.blurWrapper, animatedBackgroundStyle]}>
        <BlurView
          intensity={BottomBarTokens.blurIntensity}
          tint={BottomBarTokens.blurTint}
          experimentalBlurMethod={BottomBarTokens.blurMethod}
          style={StyleSheet.absoluteFill}
        />
        <View style={s.whiteWashOverlay} />
      </Animated.View>

      {/* ── Expanded Content Layer ── */}
      <Animated.View
        testID={`${testID}-content`}
        style={[s.contentLayer, animatedContentStyle]}
        pointerEvents={navHidden ? 'box-none' : 'auto'}
      >
        {children}
      </Animated.View>

      {/* ── Collapsed Circle Button Layer ── */}
      <Animated.View
        testID={`${testID}-collapsed-wrap`}
        style={[s.collapsedLayer, animatedCollapsedStyle]}
        pointerEvents="box-none"
      >
        <Pressable
          testID="bottom-bar-collapsed-button"
          accessibilityRole={BottomBarTokens.accessibility.collapsedRole}
          accessibilityLabel={BottomBarTokens.accessibility.collapsedLabelArabic}
          onPress={handleExpand}
          style={s.collapsedTouchTarget}
          android_ripple={{ color: BottomBarTokens.rippleColor, borderless: true, radius: 28 }}
        >
          {collapsedIcon ?? (
            <Ionicons
              name="apps-outline"
              size={BottomBarTokens.collapsedIconSize}
              color={Colors.primary}
            />
          )}
          {badge ? <View style={s.badgeContainer}>{badge}</View> : null}
        </Pressable>
      </Animated.View>
    </Animated.View>
  )
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 100,
    ...BottomBarTokens.shadow,
  },
  blurWrapper: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    borderWidth: BottomBarTokens.borderWidth,
    borderColor: BottomBarTokens.borderColor,
  },
  whiteWashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: BottomBarTokens.whiteWashBg,
  },
  contentLayer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
  },
  collapsedLayer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collapsedTouchTarget: {
    width: BottomBarTokens.collapsedSize,
    height: BottomBarTokens.collapsedSize,
    minWidth: BottomBarTokens.minTouchTarget,
    minHeight: BottomBarTokens.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
})
