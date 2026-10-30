import { useEffect, useState, type ComponentType } from 'react'
import { AccessibilityInfo, Platform } from 'react-native'
import type { GlassViewProps } from 'expo-glass-effect'

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
 * Starts on blur until the Reduce Transparency setting is known (safest first frame),
 * then follows the setting live. Subscribes only when the binary supports liquid glass.
 */
export function useGlassSupport(): GlassSupport {
  const isLiquidCapable = resolveNativeGlassSupport().kind === 'liquid'
  const [reduceTransparency, setReduceTransparency] = useState(true)

  useEffect(() => {
    if (!isLiquidCapable) {
      return
    }
    let isMounted = true
    AccessibilityInfo.isReduceTransparencyEnabled()
      .then((enabled) => {
        if (isMounted) setReduceTransparency(enabled)
      })
      .catch(() => {
        // Setting unreadable: keep blur (safe default).
        if (isMounted) setReduceTransparency(true)
      })
    const subscription = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setReduceTransparency
    )
    return () => {
      isMounted = false
      subscription.remove()
    }
  }, [isLiquidCapable])

  return getGlassSupport(reduceTransparency)
}

/** Test-only cache reset to verify capability detection under different platforms/mocks. */
export function __resetGlassSupportCacheForTests(): void {
  cachedNativeSupport = null
}
