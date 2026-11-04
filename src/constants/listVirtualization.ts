/**
 * Tuned FlatList virtualization parameters for glass-bearing listing card lists.
 *
 * Viewport & row math (iPhone 13 Pro / 14 Pro Max / 17 Pro, 844-956pt height):
 * - Full-width ListingCardBase row pitch is ~307pt (172pt image + ~119pt body + 2pt border + 14pt gap);
 *   OperatorCard row pitch is ~210pt.
 * - Visible scroll viewport between header and bottom bar is ~650-760pt (2-3 full cards, up to 4 operator cards).
 * - Each ListingCardBase mounts up to 7 GlassSurface instances (card surface + up to 6 pills).
 * - React Native's default windowSize=21 and initialNumToRender=10 keep ~50 cards (~350 glass views) mounted.
 * - windowSize=5 (2 viewports above + 1 visible + 2 below = ~10-12 cards) cuts live glass views by ~75%
 *   while maintaining a 2-screen buffer above and below to prevent blank areas on normal scroll.
 * - removeClippedSubviews is intentionally NOT enabled because on iOS it clips outer card drop shadows
 *   and can cause 1-frame transparent flashes when re-attaching native UIVisualEffectView / GlassView subviews.
 */
export const BROWSE_LIST_VIRTUALIZATION_PROPS = {
  initialNumToRender: 4,
  maxToRenderPerBatch: 4,
  windowSize: 5,
  updateCellsBatchingPeriod: 50,
} as const
