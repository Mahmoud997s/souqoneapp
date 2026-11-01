import { Colors } from './colors'
import { Radius } from './radius'
import { Spacing } from './spacing'

export const PublicProfileTokens = {
  pageTopGlowHeight: 360,
  topBarTopOffset: Spacing.space3,
  topBarSize: 52,
  topBarRadius: 26,
  heroRadius: Radius.xl,
  heroPaddingTop: Spacing.space5,
  heroPaddingHorizontal: Spacing.space4,
  heroPaddingBottom: Spacing.space4,
  heroWashOpacity: 0.58,
  topBarWashOpacity: 0.58,
  tabsWashOpacity: 0.52,
  statsWashOpacity: 0.46,
  actionWashOpacity: 0.96,
  statsRadius: 18,
  avatarSize: 84,
  avatarRingWidth: 3,
  avatarFallbackFontSize: 30,
  avatarFallbackLineHeight: 40,
  actionHeight: 52,
  actionRadius: 26,
  actionGradient: [Colors.primary, Colors.primaryDark] as const,
} as const
