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
export function useGlassSupport(enabled: boolean = true): GlassSupport {
  const isLiquidCapable = enabled && resolveNativeGlassSupport().kind === 'liquid'
  const [reduceTransparency, setReduceTransparency] = useState<boolean>(() => {
    return cachedReduceTransparency ?? true
  })

  useEffect(() => {
    if (!isLiquidCapable) {
      return
    }
    let isMounted = true
    AccessibilityInfo.isReduceTransparencyEnabled()
      .then((enabledSetting) => {
        cachedReduceTransparency = enabledSetting
        if (isMounted) setReduceTransparency(enabledSetting)
      })
      .catch(() => {
        // Setting unreadable: keep blur (safe default).
        if (isMounted) setReduceTransparency(true)
      })
    const subscription = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      (enabledSetting) => {
        cachedReduceTransparency = enabledSetting
        setReduceTransparency(enabledSetting)
      }
    )
    return () => {
      isMounted = false
      subscription.remove()
    }
  }, [isLiquidCapable])

  if (!enabled) {
    return BLUR_SUPPORT
  }

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
  variant?: 'surface' | 'capsule'
  tintOverlayColor?: string
  support?: GlassSupport
}

interface GlassSurfaceViewProps extends Omit<GlassSurfaceProps, 'support'> {
  support: GlassSupport
}

function GlassSurfaceView({
  testID = 'glass-surface',
  radiusStyle,
  style,
  borderRadius,
  glassEffectStyle,
  intensity = BottomBarTokens.blurIntensity,
  tint = BottomBarTokens.blurTint,
  noBorder = false,
  variant = 'surface',
  tintOverlayColor,
  support: glass,
}: GlassSurfaceViewProps) {
  const isCapsule = variant === 'capsule'
  const effectiveGlassStyle = glassEffectStyle ?? 'regular'
  const effectiveCapsuleOverlay =
    tintOverlayColor ?? (isCapsule ? 'rgba(238, 242, 245, 0.55)' : undefined)
  const borderStyle = noBorder ? s.noBorder : null
  const radiusOverride = borderRadius !== undefined ? { borderRadius } : null

  if (glass.kind === 'liquid') {
    const { GlassView } = glass
    return (
      <Animated.View
        testID={`${testID}-glass-liquid`}
        pointerEvents="none"
        style={[
          isCapsule ? s.capsuleLiquidWrapper : s.liquidWrapper,
          borderStyle,
          radiusOverride,
          radiusStyle,
          style,
        ]}
      >
        <GlassView
          glassEffectStyle={effectiveGlassStyle}
          style={StyleSheet.absoluteFill}
        />
        {effectiveCapsuleOverlay ? (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: effectiveCapsuleOverlay },
            ]}
          />
        ) : null}
      </Animated.View>
    )
  }

  if (isCapsule) {
    return (
      <Animated.View
        testID={`${testID}-glass-blur`}
        pointerEvents="none"
        style={[
          s.capsuleBlurWrapper,
          borderStyle,
          radiusOverride,
          radiusStyle,
          style,
        ]}
      >
        <View
          style={[
            s.capsuleWashOverlay,
            tintOverlayColor ? { backgroundColor: tintOverlayColor } : null,
          ]}
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
        blurMethod={BottomBarTokens.blurMethod}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          s.whiteWashOverlay,
          tintOverlayColor ? { backgroundColor: tintOverlayColor } : null,
        ]}
      />
    </Animated.View>
  )
}

function GlassSurfaceWithHook(props: Omit<GlassSurfaceProps, 'support'>) {
  const support = useGlassSupport()
  return <GlassSurfaceView {...props} support={support} />
}

/**
 * GlassSurface
 * The shared glass background surface for bottom bars, category tiles, and listing cards/capsules.
 * - When `support` is passed, renders `GlassSurfaceView` directly WITHOUT calling `useGlassSupport()`.
 * - Liquid branch (iOS 26 binary with expo-glass-effect, transparency not reduced): native GlassView.
 * - Blur branch (Android, older iOS, or reduce-transparency on): BlurView + white wash overlay (for 'surface'),
 *   or lightweight frosted translucent wash (for 'capsule' inside an already-blurred card).
 */
export function GlassSurface({ support, ...rest }: GlassSurfaceProps) {
  if (support) {
    return <GlassSurfaceView {...rest} support={support} />
  }
  return <GlassSurfaceWithHook {...rest} />
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
  capsuleLiquidWrapper: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.90)',
  },
  capsuleBlurWrapper: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.90)',
  },
  whiteWashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: BottomBarTokens.whiteWashBg,
  },
  capsuleWashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(238, 242, 245, 0.82)',
  },
  noBorder: {
    borderWidth: 0,
  },
})
