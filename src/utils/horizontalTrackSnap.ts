/**
 * Pure RTL-aware horizontal scroll stop calculator for PhysicalHorizontalTrack (D-377).
 *
 * PhysicalHorizontalTrack is physical-right anchored:
 * - translateX = 0 shows the physical-right start (first items).
 * - translateX = maxScroll shows the physical-left end (last items).
 *
 * Given measured child widths, horizontal gap, start/end padding, and container width,
 * this helper computes valid boundary stop offsets in [0, maxScroll] so that when a
 * horizontal flick settles, edge chips/cards are shown whole rather than cut in half.
 */

export interface HorizontalSnapInput {
  itemWidths: readonly number[]
  gap: number
  paddingStart: number
  paddingEnd: number
  containerWidth: number
}

const STOP_DEDUPE_EPSILON = 0.5

/**
 * Computes sorted, deduplicated boundary stop offsets in [0, maxScroll].
 * When content fits without overflowing (maxScroll <= 0), returns [0].
 */
export function computeHorizontalSnapStops({
  itemWidths,
  gap,
  paddingStart,
  paddingEnd,
  containerWidth,
}: HorizontalSnapInput): number[] {
  if (containerWidth <= 0 || itemWidths.length === 0) {
    return [0]
  }

  const safeGap = Math.max(0, gap)
  const safePadStart = Math.max(0, paddingStart)
  const safePadEnd = Math.max(0, paddingEnd)

  let cursor = safePadStart
  const starts: number[] = []
  const ends: number[] = []

  for (let i = 0; i < itemWidths.length; i += 1) {
    const w = Math.max(0, itemWidths[i])
    starts.push(cursor)
    const itemEnd = cursor + w
    ends.push(itemEnd)
    cursor = itemEnd + (i < itemWidths.length - 1 ? safeGap : 0)
  }

  const totalContentWidth = cursor + safePadEnd
  const maxScroll = Math.max(0, totalContentWidth - containerWidth)

  if (maxScroll <= 0) {
    return [0]
  }

  const candidates: number[] = [0, maxScroll]

  for (let i = 0; i < starts.length; i += 1) {
    // Align item i flush to the physical-right start edge (respecting paddingStart)
    const rightEdgeStop = starts[i] - safePadStart
    if (rightEdgeStop > 0 && rightEdgeStop < maxScroll) {
      candidates.push(rightEdgeStop)
    }

    // Align item i flush to the physical-left end edge (respecting paddingEnd)
    const leftEdgeStop = ends[i] + safePadEnd - containerWidth
    if (leftEdgeStop > 0 && leftEdgeStop < maxScroll) {
      candidates.push(leftEdgeStop)
    }
  }

  candidates.sort((a, b) => a - b)

  const uniqueStops: number[] = []
  for (let i = 0; i < candidates.length; i += 1) {
    const val = candidates[i]
    if (
      uniqueStops.length === 0 ||
      Math.abs(val - uniqueStops[uniqueStops.length - 1]) > STOP_DEDUPE_EPSILON
    ) {
      uniqueStops.push(val)
    }
  }

  // Guarantee exact 0 and exact maxScroll endpoints
  if (uniqueStops[0] !== 0) {
    uniqueStops[0] = 0
  }
  if (uniqueStops[uniqueStops.length - 1] !== maxScroll) {
    uniqueStops[uniqueStops.length - 1] = maxScroll
  }

  return uniqueStops
}

/**
 * Worklet-safe nearest stop lookup.
 * Clamps projectedX into [0, maxScroll] and snaps to the closest boundary stop.
 * When maxScroll <= 0 or no valid stops exist, returns 0 (or clamped projectedX).
 */
export function findNearestScrollStop(
  projectedX: number,
  stops: readonly number[],
  maxScroll: number
): number {
  'worklet'
  if (maxScroll <= 0) {
    return 0
  }

  const clamped = Math.max(0, Math.min(maxScroll, projectedX))
  if (!stops || stops.length <= 1) {
    return clamped
  }

  let best = stops[0]
  let bestDist = Math.abs(clamped - best)

  for (let i = 1; i < stops.length; i += 1) {
    const candidate = stops[i]
    const dist = Math.abs(clamped - candidate)
    if (dist < bestDist) {
      best = candidate
      bestDist = dist
    }
  }

  return Math.max(0, Math.min(maxScroll, best))
}
