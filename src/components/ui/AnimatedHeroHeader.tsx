import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { GlassSurface, type GlassSupport } from '../navigation/glassSupport';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Radius } from '../../constants/radius';
import { TopBarTokens } from '../../constants/topBarTokens';

export interface AnimatedHeroHeaderProps {
  scrollY?: SharedValue<number>;
  
  // Customization
  gradientColors?: string[];
  title: string;
  titleAccent?: string;
  departmentIcon?: keyof typeof Ionicons.glyphMap;
  
  // Top Bar Search
  navSearchPlaceholder?: string;
  onNavSearchPress?: () => void;
  
  // Hero Search
  heroSearchPlaceholder?: string;
  onHeroSearchPress?: () => void;
  
  // Back Action / Right Element
  onBackPress?: () => void;
  hideBackButton?: boolean;
  rightElement?: React.ReactNode;

  // Header Actions (Chat & Notifications)
  onChatPress?: () => void;
  chatIcon?: keyof typeof Ionicons.glyphMap;
  hideChatButton?: boolean;
  headerIcon?: keyof typeof Ionicons.glyphMap;
  onHeaderIconPress?: () => void;
  headerIconBadgeCount?: number;
  
  // CTA Buttons (Preserved for compatibility)
  primaryCta?: { 
    label: string; 
    icon: string; 
    onPress: () => void;
    bgColor?: string;
    textColor?: string;
    iconFamily?: any;
  };
  outlineCta?: { 
    label: string; 
    icon: string; 
    iconFamily?: any; 
    onPress: () => void;
    textColor?: string;
  };
  glassSupport?: GlassSupport;
}

export const SCROLL_THRESHOLD = 5;
export const SCROLL_MID = SCROLL_THRESHOLD + 6; // 11px - Row 2 & Expanded Title finish exiting before Compact Search enters
export const SCROLL_TRANSITION_END = SCROLL_THRESHOLD + 12; // 17px - Compact Search finishes entering
export const SCROLL_RANGE = 30;
export const SCROLL_END = SCROLL_THRESHOLD + SCROLL_RANGE; // 35px - Snappy & imperceptible
export const ROW2_CLIP_HEIGHT = 64; // paddingTop (8) + searchBar (44) + paddingBottom (12)
export const COMPACT_HIDDEN_TRANSLATE_Y = TopBarTokens.rowHeight; // 44px (>= 38px centerContainer clip height)

/**
 * LandingHeader (formerly AnimatedHeroHeader)
 * Pixel-Perfect Morphing Glassmorphic Header for landing pages.
 * - Background: Pure glassmorphism blur (BlurView with subtle wash & tint) matching Profile screen.
 * - State 1 (Top / Unscrolled):
 *     Row 1: [ Back Button 38px ] ... Title & Subtitle ... [ Add Button 38px ] [ Notification Bell 38px ]
 *     Row 2: Full-width modern Search Bar with search icon and filter options button
 * - State 2 (Scrolled down / Collapsed Single Row):
 *     Row 1: [ Back Button 38px ] [ Compact Search Bar 38px ] [ Notification Bell 38px ]
 *     Row 2: Fades out and clips away, height shrinks smoothly from 114px to 58px.
 */
export function AnimatedHeroHeader({
  scrollY,
  title,
  titleAccent,
  departmentIcon,
  navSearchPlaceholder,
  onNavSearchPress,
  heroSearchPlaceholder,
  onHeroSearchPress,
  onBackPress,
  hideBackButton = false,
  rightElement,
  onChatPress,
  chatIcon,
  hideChatButton = false,
  headerIcon = 'notifications-outline',
  onHeaderIconPress,
  headerIconBadgeCount = 0,
  primaryCta,
  glassSupport,
}: AnimatedHeroHeaderProps) {
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : 12;

  const HERO_HEIGHT = topPad + 114;
  const COMPACT_HEIGHT = topPad + 58;

  const searchPlaceholder = heroSearchPlaceholder || navSearchPlaceholder || 'عن ماذا تبحث اليوم؟';
  const handleSearchPress = onHeroSearchPress || onNavSearchPress;

  const handleChatPress = () => {
    if (onChatPress) {
      onChatPress();
    } else {
      router.push('/(tabs)/chat');
    }
  };

  // ── ANIMATED STYLES ──
  const headerAnimStyle = useAnimatedStyle(() => {
    if (!scrollY) return { height: HERO_HEIGHT };
    const height = interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD, SCROLL_END],
      [HERO_HEIGHT, HERO_HEIGHT, COMPACT_HEIGHT],
      Extrapolation.CLAMP
    );
    return { height };
  });

  const expandedTitleStyle = useAnimatedStyle(() => {
    if (!scrollY) {
      return {
        opacity: 1,
        transform: [{ translateY: 0 }],
        pointerEvents: 'auto',
      };
    }
    const opacity = interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD, SCROLL_MID],
      [1, 1, 0],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD, SCROLL_MID],
      [0, 0, -TopBarTokens.searchHeight],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ translateY }],
      pointerEvents: scrollY.value >= SCROLL_MID ? 'none' : 'auto',
    };
  });

  const compactSearchStyle = useAnimatedStyle(() => {
    if (!scrollY) {
      return {
        transform: [{ translateY: COMPACT_HIDDEN_TRANSLATE_Y }],
        pointerEvents: 'none',
      };
    }
    const translateY = interpolate(
      scrollY.value,
      [0, SCROLL_MID, SCROLL_TRANSITION_END],
      [COMPACT_HIDDEN_TRANSLATE_Y, COMPACT_HIDDEN_TRANSLATE_Y, 0],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateY }],
      pointerEvents: scrollY.value <= SCROLL_MID ? 'none' : 'auto',
    };
  });

  const chatBtnAnimStyle = useAnimatedStyle(() => {
    if (!scrollY) {
      return {
        width: TopBarTokens.buttonSize,
        marginEnd: 6,
        transform: [{ translateY: 0 }],
        pointerEvents: 'auto',
      };
    }
    const width = interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD, SCROLL_TRANSITION_END],
      [TopBarTokens.buttonSize, TopBarTokens.buttonSize, 0],
      Extrapolation.CLAMP
    );
    const marginEnd = interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD, SCROLL_TRANSITION_END],
      [6, 6, 0],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD, SCROLL_TRANSITION_END],
      [0, 0, COMPACT_HIDDEN_TRANSLATE_Y],
      Extrapolation.CLAMP
    );
    return {
      width,
      marginEnd,
      transform: [{ translateY }],
      pointerEvents: scrollY.value >= SCROLL_MID ? 'none' : 'auto',
    };
  });

  const row2ClipAnimStyle = useAnimatedStyle(() => {
    if (!scrollY) {
      return { height: ROW2_CLIP_HEIGHT };
    }
    const height = interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD, SCROLL_MID],
      [ROW2_CLIP_HEIGHT, ROW2_CLIP_HEIGHT, 0],
      Extrapolation.CLAMP
    );
    return { height };
  });

  const row2AnimStyle = useAnimatedStyle(() => {
    if (!scrollY) {
      return {
        transform: [{ translateY: 0 }],
        pointerEvents: 'auto',
      };
    }
    const translateY = interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD, SCROLL_MID],
      [0, 0, ROW2_CLIP_HEIGHT],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateY }],
      pointerEvents: scrollY.value >= SCROLL_MID ? 'none' : 'auto',
    };
  });

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <Animated.View style={[s.stickyHeader, { paddingTop: topPad + 6 }, headerAnimStyle]}>
        
        {/* ── SHARED GLASS SURFACE (Liquid on iOS 26, Blur fallback on other) ── */}
        <GlassSurface
          testID="animated-hero-header-glass"
          variant="surface"
          noBorder
          intensity={65}
          support={glassSupport}
        />
        <View style={s.tintOverlay} pointerEvents="none" />

        {/* ── ARCHITECTURAL GREEN GRID PATTERN OVERLAY (5% Opacity) ── */}
        <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
          <Svg width="100%" height="100%">
            <Defs>
              <Pattern id="headerGreenGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                <Path d="M 30 0 L 0 0 0 30" fill="none" stroke={Colors.forestGreen} strokeWidth="1" strokeOpacity="0.05" />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#headerGreenGrid)" />
          </Svg>
        </View>

        {/* ── ROW 1: BACK BUTTON / RIGHT ELEMENT, CENTER (TITLE/SEARCH), ACTION BUTTONS (100% RTL Compliant) ── */}
        <View style={s.row1}>
          {/* 1. Back Button or Custom Right Element (Physical Right in RTL — Fixed 38px circle) */}
          {!hideBackButton && onBackPress ? (
            <TouchableOpacity
              testID="hero-header-back-btn"
              style={s.circularBtn}
              onPress={onBackPress}
              activeOpacity={0.7}
              hitSlop={TopBarTokens.buttonHitSlop}
              accessibilityLabel="رجوع"
            >
              <View
                pointerEvents="none"
                testID="hero-header-back-btn-backing"
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: TopBarTokens.iceGlass, borderRadius: TopBarTokens.buttonRadius },
                ]}
              />
              <GlassSurface
                testID="hero-header-back-btn"
                borderRadius={TopBarTokens.buttonRadius}
                washColor={TopBarTokens.iceGlass}
                support={glassSupport}
              />
              <Ionicons name="arrow-forward-outline" size={19} color={Colors.primary} />
            </TouchableOpacity>
          ) : rightElement ? (
            rightElement
          ) : null}

          {/* 2. Center Container (flex: 1) — Holds Title in expanded state & Search Bar in compact state */}
          <View style={s.centerContainer} testID="hero-header-center-clip">
            {/* Expanded Layer: Title & Subtitle */}
            <Animated.View
              testID="hero-header-expanded-title"
              style={[StyleSheet.absoluteFill, s.titleTextCol, expandedTitleStyle]}
            >
              <View style={s.titleRow}>
                <Text style={s.mainTitle} numberOfLines={1}>
                  {title}
                </Text>
                {departmentIcon ? (
                  <Ionicons name={departmentIcon} size={15} color={Colors.accent} style={s.chevronIcon} />
                ) : !hideBackButton ? (
                  <Ionicons name="chevron-down" size={13} color={Colors.accent} style={s.chevronIcon} />
                ) : null}
              </View>
              <Text style={s.subTitle} numberOfLines={1}>
                {titleAccent || 'تصفح كافة العروض والإعلانات المتاحة'}
              </Text>
            </Animated.View>

            {/* Compact Layer: Compact Search Bar (Height 38px, matches circular buttons!) */}
            <Animated.View
              testID="hero-header-compact-search-wrapper"
              style={[StyleSheet.absoluteFill, s.compactSearchWrapper, compactSearchStyle]}
            >
              <TouchableOpacity
                testID="hero-header-compact-search"
                style={s.compactSearchBar}
                onPress={handleSearchPress}
                activeOpacity={0.88}
              >
                <View
                  pointerEvents="none"
                  testID="hero-header-compact-search-backing"
                  style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: TopBarTokens.iceGlass, borderRadius: TopBarTokens.searchRadius },
                  ]}
                />
                <GlassSurface
                  testID="hero-header-compact-search"
                  borderRadius={TopBarTokens.searchRadius}
                  washColor={TopBarTokens.iceGlass}
                  support={glassSupport}
                />
                <Ionicons name="search" size={16} color={Colors.primary} style={{ opacity: 0.8 }} />
                <Text style={s.compactSearchTxt} numberOfLines={1}>
                  {searchPlaceholder}
                </Text>
                <View style={s.compactFilterBtn} testID="hero-header-compact-filter-btn">
                  <View
                    pointerEvents="none"
                    testID="hero-header-compact-filter-btn-backing"
                    style={[
                      StyleSheet.absoluteFill,
                      { backgroundColor: TopBarTokens.iceGlass, borderRadius: 14 },
                    ]}
                  />
                  <GlassSurface
                    testID="hero-header-compact-filter-btn"
                    borderRadius={14}
                    washColor={TopBarTokens.iceGlass}
                    support={glassSupport}
                  />
                  <Ionicons name="options-outline" size={14} color={Colors.primary} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* 3. Left Action Buttons Group in RTL */}
          <View style={s.leftButtonsGroup}>
            {/* Chat / Messages Button (Replaces Add Listing button in navbar per user instruction) */}
            {!hideChatButton && (
              <Animated.View
                testID="hero-header-chat-btn-clip"
                style={[s.chatBtnWrapper, chatBtnAnimStyle]}
              >
                <TouchableOpacity
                  testID="hero-header-chat-btn"
                  style={s.circularBtn}
                  onPress={handleChatPress}
                  activeOpacity={0.7}
                  hitSlop={TopBarTokens.buttonHitSlop}
                  accessibilityRole="button"
                  accessibilityLabel="الرسائل والمحادثات"
                >
                  <View
                    pointerEvents="none"
                    testID="hero-header-chat-btn-backing"
                    style={[
                      StyleSheet.absoluteFill,
                      { backgroundColor: TopBarTokens.iceGlass, borderRadius: TopBarTokens.buttonRadius },
                    ]}
                  />
                  <GlassSurface
                    testID="hero-header-chat-btn"
                    borderRadius={TopBarTokens.buttonRadius}
                    washColor={TopBarTokens.iceGlass}
                    support={glassSupport}
                  />
                  <Ionicons name={chatIcon || 'chatbubble-ellipses-outline'} size={19} color={Colors.primary} />
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Notification Bell (Always visible in both states!) */}
            <TouchableOpacity
              testID="hero-header-notification-btn"
              style={s.circularBtn}
              onPress={onHeaderIconPress}
              activeOpacity={0.7}
              hitSlop={TopBarTokens.buttonHitSlop}
              accessibilityRole="button"
              accessibilityLabel="الإشعارات"
            >
              <View
                pointerEvents="none"
                testID="hero-header-notification-btn-backing"
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: TopBarTokens.iceGlass, borderRadius: TopBarTokens.buttonRadius },
                ]}
              />
              <GlassSurface
                testID="hero-header-notification-btn"
                borderRadius={TopBarTokens.buttonRadius}
                washColor={TopBarTokens.iceGlass}
                support={glassSupport}
              />
              <Ionicons name={headerIcon} size={19} color={Colors.primary} />
              <View style={s.greenDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── ROW 2: LARGE SEARCH BAR (Clipped by row2Clip and translates out by full height on scroll) ── */}
        <Animated.View style={[s.row2Clip, row2ClipAnimStyle]} testID="hero-header-row2-clip">
          <Animated.View testID="hero-header-row2" style={[s.row2, row2AnimStyle]}>
            <TouchableOpacity
              testID="hero-header-large-search"
              style={s.searchBar}
              onPress={handleSearchPress}
              activeOpacity={0.88}
            >
              <View
                pointerEvents="none"
                testID="hero-header-large-search-backing"
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: TopBarTokens.iceGlass, borderRadius: Radius.md },
                ]}
              />
              <GlassSurface
                testID="hero-header-large-search"
                borderRadius={Radius.md}
                washColor={TopBarTokens.iceGlass}
                support={glassSupport}
              />
              <Ionicons name="search" size={18} color={Colors.primary} style={{ opacity: 0.8 }} />
              <Text style={s.searchPlaceholder} numberOfLines={1}>
                {searchPlaceholder}
              </Text>
              <View style={s.filterBtnInner} testID="hero-header-large-filter-btn">
                <View
                  pointerEvents="none"
                  testID="hero-header-large-filter-btn-backing"
                  style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: TopBarTokens.iceGlass, borderRadius: Radius.sm },
                  ]}
                />
                <GlassSurface
                  testID="hero-header-large-filter-btn"
                  borderRadius={Radius.sm}
                  washColor={TopBarTokens.iceGlass}
                  support={glassSupport}
                />
                <Ionicons name="options-outline" size={16} color={Colors.primary} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

      </Animated.View>
    </>
  );
}

// Export LandingHeader alias for future-proof imports
export { AnimatedHeroHeader as LandingHeader };

const s = StyleSheet.create({
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    overflow: 'hidden',
    borderBottomWidth: TopBarTokens.borderBottomWidth,
    borderBottomColor: TopBarTokens.borderBottomColor,
    ...TopBarTokens.shadow,
  },
    tintOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: TopBarTokens.tintOverlayColor,
    opacity: TopBarTokens.tintOverlayOpacity,
  },
  row1: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: TopBarTokens.rowPaddingHorizontal,
    height: TopBarTokens.rowHeight,
    gap: TopBarTokens.rowGap,
  },
  centerContainer: {
    flex: 1,
    height: TopBarTokens.searchHeight,
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: 0,
    overflow: 'hidden',
  },
  titleTextCol: {
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  mainTitle: {
    fontFamily: TopBarTokens.titleFontFamily,
    fontSize: TopBarTokens.titleFontSize,
    lineHeight: TopBarTokens.titleLineHeight,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  chevronIcon: {
    marginTop: 2,
  },
  subTitle: {
    fontFamily: TopBarTokens.subTitleFontFamily,
    fontSize: TopBarTokens.subTitleFontSize,
    lineHeight: TopBarTokens.subTitleLineHeight,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  compactSearchWrapper: {
    justifyContent: 'center',
  },
  compactSearchBar: {
    height: TopBarTokens.searchHeight,
    borderRadius: TopBarTokens.searchRadius,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: TopBarTokens.searchPaddingHorizontal,
    gap: TopBarTokens.searchGap,
  },
  compactSearchTxt: {
    flex: 1,
    fontFamily: TopBarTokens.searchFontFamily,
    fontSize: TopBarTokens.searchFontSize,
    lineHeight: TopBarTokens.searchLineHeight,
    color: TopBarTokens.searchTextColor,
    textAlign: 'left',
    writingDirection: 'rtl',
    paddingTop: 1,
  },
  compactFilterBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatBtnWrapper: {
    height: TopBarTokens.buttonSize,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  circularBtn: {
    width: TopBarTokens.buttonSize,
    height: TopBarTokens.buttonSize,
    borderRadius: TopBarTokens.buttonRadius,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...TopBarTokens.buttonShadow,
  },
  greenDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  row2Clip: {
    height: ROW2_CLIP_HEIGHT,
    overflow: 'hidden',
  },
  row2: {
    paddingHorizontal: Spacing.space4,
    paddingTop: 8,
    paddingBottom: 12,
  },
  searchBar: {
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchPlaceholder: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
    paddingTop: 1,
  },
  filterBtnInner: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
