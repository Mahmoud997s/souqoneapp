import { Colors } from './colors'

/**
 * Per-category soft pastel tint colors for category card background gradients.
 * Each card renders a subtle LinearGradient from pure white (`Colors.surface` #FFFFFF)
 * to its designated pastel tint color (top-left to bottom-right), keeping the 3D icon
 * as the hero visual element while providing harmonic section-specific color cues.
 */
export const CATEGORY_TINTS: Record<string, string> = {
  cars: Colors.paleMint,     // Pale turquoise (#ECF8FA): cars brand color
  services: '#EDF4FC',       // Pale blue: soft tech / services tint
  parts: '#FFF2EA',          // Pale orange / peach: soft mechanical tint from brand orange family
  equipment: '#EBF5EC',      // Pale green / sage: heavy machinery & equipment tint
  buses: '#F3EEF9',          // Pale lilac: passenger transit tint
  browse: Colors.surfaceAlt, // Pale grey (#F7F8FA): neutral catch-all browse tint
} as const
