import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
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

  // Right Icon (Left in RTL)
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
}

const SCROLL_THRESHOLD = 5;
const SCROLL_RANGE = 30;
const SCROLL_END = SCROLL_THRESHOLD + SCROLL_RANGE; // 35px - Snappy & imperceptible

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
  headerIcon = 'notifications-outline',
  onHeaderIconPress,
  headerIconBadgeCount = 0,
  primaryCta,
}: AnimatedHeroHeaderProps) {
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : 12;

  const HERO_HEIGHT = topPad + 114;
  const COMPACT_HEIGHT = topPad + 58;

  const searchPlaceholder = heroSearchPlaceholder || navSearchPlaceholder || 'عن ماذا تبحث اليوم؟';
  const handleSearchPress = onHeroSearchPress || onNavSearchPress;

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
    if (!scrollY) return { opacity: 1 };
    const opacity = interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD, SCROLL_THRESHOLD + 10],
      [1, 1, 0],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      pointerEvents: scrollY.value > SCROLL_THRESHOLD + 10 ? 'none' : 'auto',
    };
  });

  const compactSearchStyle = useAnimatedStyle(() => {
    if (!scrollY) return { opacity: 0 };
    const opacity = interpolate(
      scrollY.value,
      [SCROLL_THRESHOLD + 8, SCROLL_END],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      pointerEvents: scrollY.value < SCROLL_THRESHOLD + 8 ? 'none' : 'auto',
    };
  });

  const addBtnAnimStyle = useAnimatedStyle(() => {
    if (!scrollY) return { opacity: 1, width: 38, marginEnd: 6 };
    const opacity = interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD, SCROLL_THRESHOLD + 8],
      [1, 1, 0],
      Extrapolation.CLAMP
    );
    const width = interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD, SCROLL_THRESHOLD + 14],
      [38, 38, 0],
      Extrapolation.CLAMP
    );
    const marginEnd = interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD, SCROLL_THRESHOLD + 14],
      [6, 6, 0],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      width,
      marginEnd,
      pointerEvents: scrollY.value > SCROLL_THRESHOLD + 8 ? 'none' : 'auto',
    };
  });

  const row2AnimStyle = useAnimatedStyle(() => {
    if (!scrollY) return { opacity: 1 };
    const opacity = interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD, SCROLL_THRESHOLD + 12],
      [1, 1, 0],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      pointerEvents: scrollY.value > SCROLL_THRESHOLD + 12 ? 'none' : 'auto',
    };
  });

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <Animated.View style={[s.stickyHeader, { paddingTop: topPad + 6 }, headerAnimStyle]}>
        
        {/* ── GLASSMORPHISM BLUR BACKGROUND (Matches Profile GlassNavBar) ── */}
        <BlurView
          intensity={65}
          tint="light"
          blurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
        <View style={s.whiteWash} pointerEvents="none" />
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
              style={s.circularBtn}
              onPress={onBackPress}
              activeOpacity={0.7}
              accessibilityLabel="رجوع"
            >
              <Ionicons name="arrow-forward-outline" size={19} color={Colors.primary} />
            </TouchableOpacity>
          ) : rightElement ? (
            rightElement
          ) : null}

          {/* 2. Center Container (flex: 1) — Holds Title in expanded state & Search Bar in compact state */}
          <View style={s.centerContainer}>
            {/* Expanded Layer: Title & Subtitle */}
            <Animated.View style={[StyleSheet.absoluteFill, s.titleTextCol, expandedTitleStyle]}>
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
            <Animated.View style={[StyleSheet.absoluteFill, s.compactSearchWrapper, compactSearchStyle]}>
              <TouchableOpacity
                style={s.compactSearchBar}
                onPress={handleSearchPress}
                activeOpacity={0.88}
              >
                <Ionicons name="search" size={16} color={Colors.primary} style={{ opacity: 0.8 }} />
                <Text style={s.compactSearchTxt} numberOfLines={1}>
                  {searchPlaceholder}
                </Text>
                <View style={s.compactFilterBtn}>
                  <Ionicons name="options-outline" size={15} color={Colors.primary} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* 3. Left Action Buttons Group in RTL */}
          <View style={s.leftButtonsGroup}>
            {/* Add Listing Button (Visible in expanded state, smoothly collapses on scroll) */}
            {primaryCta && (
              <Animated.View style={[s.addBtnWrapper, addBtnAnimStyle]}>
                <TouchableOpacity
                  style={[s.circularBtn, s.addBtn]}
                  onPress={primaryCta.onPress}
                  activeOpacity={0.7}
                  accessibilityLabel={primaryCta.label || 'إضافة إعلان'}
                >
                  <Ionicons name="add" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Notification Bell (Always visible in both states!) */}
            <TouchableOpacity
              style={s.circularBtn}
              onPress={onHeaderIconPress}
              activeOpacity={0.7}
              accessibilityLabel="الإشعارات"
            >
              <Ionicons name={headerIcon as any} size={19} color={Colors.primary} />
              <View style={s.greenDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── ROW 2: LARGE SEARCH BAR (Fades out and translates up on scroll) ── */}
        <Animated.View style={[s.row2, row2AnimStyle]}>
          <TouchableOpacity
            style={s.searchBar}
            onPress={handleSearchPress}
            activeOpacity={0.88}
          >
            <Ionicons name="search" size={18} color={Colors.primary} style={{ opacity: 0.8 }} />
            <Text style={s.searchPlaceholder} numberOfLines={1}>
              {searchPlaceholder}
            </Text>
            <View style={s.filterBtnInner}>
              <Ionicons name="options-outline" size={17} color={Colors.primary} />
            </View>
          </TouchableOpacity>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  whiteWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
  },
  tintOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
    opacity: 0.03,
  },
  row1: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.space3,
    height: 44,
    gap: 6,
  },
  centerContainer: {
    flex: 1,
    height: 38,
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: 0,
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
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 16,
    lineHeight: 22,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  chevronIcon: {
    marginTop: 2,
  },
  subTitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  compactSearchWrapper: {
    justifyContent: 'center',
  },
  compactSearchBar: {
    height: 38,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(238, 242, 245, 0.95)',
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 6,
  },
  compactSearchTxt: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
    paddingTop: 1,
  },
  compactFilterBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.paleMint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addBtnWrapper: {
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  circularBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
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
    borderColor: '#FFFFFF',
  },
  row2: {
    paddingHorizontal: Spacing.space4,
    paddingTop: 8,
    paddingBottom: 12,
  },
  searchBar: {
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(238, 242, 245, 0.85)',
    borderWidth: 1,
    borderColor: Colors.border,
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
    borderRadius: 6,
    backgroundColor: Colors.paleMint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
