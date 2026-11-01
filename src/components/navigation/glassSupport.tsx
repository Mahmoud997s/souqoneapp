/**
 * glassSupport (Barrel)
 * Backward-compatible barrel re-exporting native capability detection and
 * the GlassSurface component.
 *
 * All implementation is split into:
 * - `glassCapability.ts`: capability types, native detection, resolveNativeGlassSupport, getGlassSupport, useGlassSupport
 * - `GlassSurface.tsx`: GlassSurface component, AnimatedRadiusStyle, GlassSurfaceProps
 */

import {
  resolveNativeGlassSupport as _resolveNativeGlassSupport,
  getGlassSupport as _getGlassSupport,
  useGlassSupport as _useGlassSupport,
} from './glassCapability'

import {
  GlassSurface as _GlassSurface,
} from './GlassSurface'

export type {
  LiquidGlassSupport,
  BlurGlassSupport,
  GlassSupport,
} from './glassCapability'

export type {
  AnimatedRadiusStyle,
  GlassSurfaceProps,
} from './GlassSurface'

export const resolveNativeGlassSupport = _resolveNativeGlassSupport
export const getGlassSupport = _getGlassSupport
export const useGlassSupport = _useGlassSupport
export const GlassSurface = _GlassSurface
