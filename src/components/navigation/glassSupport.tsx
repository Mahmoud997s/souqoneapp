import React, { useEffect, useState, type ComponentType } from 'react'
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import Animated, { type useAnimatedStyle } from 'react-native-reanimated'
import { BlurView } from 'expo-blur'
import type { GlassViewProps } from 'expo-glass-effect'
import { BottomBarTokens } from '../../constants/bottomBarTokens'

/**
 * glassSupport
 * The ONLY file allowed to load `expo-glass-effect`.
 *
 * The package is native. An OTA update can reach a binary that was built before the package
 * was added, so it is NEVER imported at top level: it is required lazily, once, inside try/catch.
 * Any failure (module missing, API missing, API throwing) falls back to the blur surface.
 */

type GlassEffectModule = typeof import('expo-glass-effect')

export type LiquidGlassSupport = {
  kind: 'liquid'
  GlassView: ComponentType<GlassViewProps>
}

export type BlurGlassSupport = { kind: 'blur' }

export type GlassSupport = LiquidGlassSupport | BlurGlassSupport

const BLUR_SUPPORT: BlurGlassSupport = { kind: 'blur' }

let cachedNativeSupport: GlassSupport | null = null
let cachedReduceTransparency: boolean | null = null

function loadGlassModule(): GlassEffectModule | null {
  try {
    return require('expo-glass-effect') as GlassEffectModule
  } catch {
    // Native module not compiled into this binary: blur fallback is the intended behavior.
    return null
  }
}

function areGlassApisAvailable(glassModule: GlassEffectModule): boolean {
  try {
    return glassModule.isLiquidGlassAvailable() && glassModule.isGlassEffectAPIAvailable()
  } catch {
    // `requireNativeModule('ExpoGlassEffect')` throws when the native side is missing.
    return false
  }
}

function detectNativeGlassSupport(): GlassSupport {
  if (Platform.OS !== 'ios') {
    return BLUR_SUPPORT
  }
  const glassModule = loadGlassModule()
  if (!glassModule || !areGlassApisAvailable(glassModule)) {
    return BLUR_SUPPORT
  }
  return {
    kind: 'liquid',
    GlassView: glassModule.GlassView,
  }
}

/**
 * Native capability of the compiled app, computed once and cached for the app lifetime.
 * Android never loads the package.
 */
export function resolveNativeGlassSupport(): GlassSupport {
  if (!cachedNativeSupport) {
    cachedNativeSupport = detectNativeGlassSupport()
  }
  return cachedNativeSupport
}

/**
 * Final surface decision: liquid only when the native capability is liquid
 * AND the user has not enabled "Reduce Transparency".
 */
export function getGlassSupport(reduceTransparencyEnabled: boolean): GlassSupport {
  if (reduceTransparencyEnabled) {
    return BLUR_SUPPORT
  }
  return resolveNativeGlassSupport()
}

/**
 * Reactive glass decision for components.
 * Starts from the last known Reduce Transparency setting (blur only on very first read
 * if setting has not yet resolved, then liquid on subsequent mounts if disabled),
 * then follows the setting live. Subscribes only when the binary supports liquid glass.
 */
export function useGlassSupport(): GlassSupport {
  const isLiquidCapable = resolveNativeGlassSupport().kind === 'liquid'
  const [reduceTransparency, setReduceTransparency] = useState<boolean>(() => {
    return cachedReduceTransparency ?? true
  })

  useEffect(() => {
    if (!isLiquidCapable) {
      return
    }
    let isMounted = true
    AccessibilityInfo.isReduceTransparencyEnabled()
      .then((enabled) => {
        cachedReduceTransparency = enabled
        if (isMounted) setReduceTransparency(enabled)
      })
      .catch(() => {
        // Setting unreadable: keep blur (safe default).
        if (isMounted) setReduceTransparency(true)
      })
    const subscription = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      (enabled) => {
        cachedReduceTransparency = enabled
        setReduceTransparency(enabled)
      }
    )
    return () => {
      isMounted = false
      subscription.remove()
    }
  }, [isLiquidCapable])

  return getGlassSupport(reduceTransparency)
}

export type AnimatedRadiusStyle = ReturnType<typeof useAnimatedStyle<ViewStyle>>

export interface GlassSurfaceProps {
  testID?: string
  radiusStyle?: AnimatedRadiusStyle | StyleProp<ViewStyle>
  style?: StyleProp<ViewStyle>
  borderRadius?: number
  glassEffectStyle?: 'regular' | 'clear'
  intensity?: number
  tint?: 'light' | 'default' | 'dark'
  noBorder?: boolean
  support?: GlassSupport
}

/**
 * GlassSurface
 * The shared glass background surface for bottom bars and category tiles.
 * - Liquid branch (iOS 26 binary with expo-glass-effect, transparency not reduced): native GlassView.
 * - Blur branch (Android, older iOS, or reduce-transparency on): BlurView + white wash overlay.
 * The surface itself never fades: it always stays at opacity 1 and only its radius/bounds morph.
 */
export function GlassSurface({
  testID = 'glass-surface',
  radiusStyle,
  style,
  borderRadius,
  glassEffectStyle = 'regular',
  intensity = BottomBarTokens.blurIntensity,
  tint = BottomBarTokens.blurTint,
  noBorder = false,
  support,
}: GlassSurfaceProps) {
  const hookSupport = useGlassSupport()
  const glass = support ?? hookSupport

  const borderStyle = noBorder ? s.noBorder : null
  const radiusOverride = borderRadius !== undefined ? { borderRadius } : null

  if (glass.kind === 'liquid') {
    const { GlassView } = glass
    return (
      <Animated.View
        testID={`${testID}-glass-liquid`}
        pointerEvents="none"
        style={[s.liquidWrapper, borderStyle, radiusOverride, radiusStyle, style]}
      >
        <GlassView
          glassEffectStyle={glassEffectStyle}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    )
  }

  return (
    <Animated.View
      testID={`${testID}-glass-blur`}
      pointerEvents="none"
      style={[s.blurWrapper, borderStyle, radiusOverride, radiusStyle, style]}
    >
      <BlurView
        intensity={intensity}
        tint={tint}
        experimentalBlurMethod={BottomBarTokens.blurMethod}
        style={StyleSheet.absoluteFill}
      />
      <View style={s.whiteWashOverlay} />
    </Animated.View>
  )
}

const s = StyleSheet.create({
  blurWrapper: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    borderWidth: BottomBarTokens.borderWidth,
    borderColor: BottomBarTokens.borderColor,
  },
  liquidWrapper: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    borderWidth: BottomBarTokens.borderWidth,
    borderColor: BottomBarTokens.borderColor,
  },
  whiteWashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: BottomBarTokens.whiteWashBg,
  },
  noBorder: {
    borderWidth: 0,
  },
})
