import { useEffect, useState, type ComponentType } from 'react'
import { AccessibilityInfo, Platform } from 'react-native'
import type { GlassViewProps } from 'expo-glass-effect'

/**
 * glassCapability
 * The capability detection and reactive hook for liquid glass support.
 * The ONLY place where `expo-glass-effect` is loaded.
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
