import { Colors } from './colors'
import { Radius } from './radius'
import { Spacing } from './spacing'

export const PublicProfileTokens = {
  pageTopGlowHeight: 280,
  topBarTopOffset: Spacing.space2,
  topBarSize: 44,
  topBarRadius: 22,
  topBarBackVisualSize: 38,
  heroRadius: Radius.lg,
  heroPaddingTop: Spacing.space3,
  heroPaddingHorizontal: Spacing.space3,
  heroPaddingBottom: Spacing.space3,
  heroGap: Spacing.space2,
  heroWashOpacity: 0.58,
  topBarWashOpacity: 0.58,
  tabsWashOpacity: 0.52,
  statsWashOpacity: 0.46,
  actionWashOpacity: 0.96,
  statsRadius: 14,
  statsMinHeight: 56,
  statsDividerHeight: 24,
  avatarSize: 56,
  avatarRingWidth: 2,
  avatarFallbackFontSize: 22,
  avatarFallbackLineHeight: 30,
  actionHeight: 44,
  actionRadius: 22,
  tabsMinHeight: 36,
  actionGradient: [Colors.primary, Colors.primaryDark] as const,
} as const
