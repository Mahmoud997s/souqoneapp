import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';
import { Colors } from '../../constants/colors';
import { Gradients } from '../../constants/gradients';
import { Spacing } from '../../constants/spacing';
import { Radius } from '../../constants/radius';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const THRESHOLD = 40;
const ANIM_RANGE = 140;
const ANIM_END = THRESHOLD + ANIM_RANGE;

export interface AnimatedHeroHeaderProps {
  scrollY: SharedValue<number>;
  
  // Customization
  gradientColors?: string[]; // Defaults to Gradients.hero
  title: string;
  titleAccent?: string;
  
  // Top Bar Search
  navSearchPlaceholder: string;
  onNavSearchPress: () => void;
  
  // Hero Search
  heroSearchPlaceholder: string;
  onHeroSearchPress: () => void;
  
  // Back Action
  onBackPress: () => void;

  // Right Icon (Left in RTL)
  headerIcon?: keyof typeof Ionicons.glyphMap;
  onHeaderIconPress?: () => void;
  headerIconBadgeCount?: number;
  
  // CTA Buttons
  primaryCta: { 
    label: string; 
    icon: string; 
    onPress: () => void;
    bgColor?: string;
    textColor?: string;
    iconFamily?: 'Ionicons' | 'MaterialCommunityIcons';
  };
  outlineCta: { 
    label: string; 
    icon: string; 
    iconFamily?: 'Ionicons' | 'MaterialCommunityIcons'; 
    onPress: () => void;
    textColor?: string;
  };
}

export function AnimatedHeroHeader({
  scrollY,
  gradientColors,
  title,
  titleAccent,
  navSearchPlaceholder,
  onNavSearchPress,
  heroSearchPlaceholder,
  onHeroSearchPress,
  onBackPress,
  headerIcon = 'grid-outline',
  onHeaderIconPress,
  headerIconBadgeCount = 0,
  primaryCta,
  outlineCta,
}: AnimatedHeroHeaderProps) {
  const insets = useSafeAreaInsets();
  const COMPACT_HEIGHT = insets.top + 58; // Exactly fits 50px topBar + 8px paddings
  const HERO_HEIGHT = insets.top + 106; // Adjusted for 40px search row

  const headerAnimStyle = useAnimatedStyle(() => ({
    height: interpolate(
      scrollY.value,
      [0, THRESHOLD, ANIM_END],
      [HERO_HEIGHT, HERO_HEIGHT, COMPACT_HEIGHT],
      Extrapolation.CLAMP
    ),
    borderBottomLeftRadius: interpolate(
      scrollY.value,
      [0, THRESHOLD, ANIM_END],
      [32, 32, 0],
      Extrapolation.CLAMP
    ),
    borderBottomRightRadius: interpolate(
      scrollY.value,
      [0, THRESHOLD, ANIM_END],
      [32, 32, 0],
      Extrapolation.CLAMP
    ),
  }));

  const heroContentAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, THRESHOLD, THRESHOLD + ANIM_RANGE * 0.5],
      [1, 1, 0],
      Extrapolation.CLAMP
    ),
  }));

  const heroSearchAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, THRESHOLD, THRESHOLD + ANIM_RANGE * 0.6],
      [1, 1, 0],
      Extrapolation.CLAMP
    ),
  }));

  const navSearchAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, THRESHOLD + ANIM_RANGE * 0.4, ANIM_END],
      [0, 0, 1],
      Extrapolation.CLAMP
    ),
  }));

  const colorsToUse = gradientColors || Gradients.hero;

  return (
    <>
      <StatusBar barStyle="light-content" />
      <AnimatedLinearGradient
        colors={colorsToUse as any}
        locations={[0, 0.6, 1]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[s.stickyHeader, { paddingTop: insets.top + 4 }, headerAnimStyle]}
      >
        <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
          <Svg width="100%" height="100%">
            <Defs>
              <Pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <Path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#grid)" />
          </Svg>
        </View>

        {/* SECTION 1: STATIC TOP BAR */}
        <View style={s.staticTopBar}>
          <TouchableOpacity
            style={s.iconBtn}
            onPress={onBackPress}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-forward-outline" size={24} color={Colors.white} />
          </TouchableOpacity>

          {/* NAVBAR SEARCH */}
          <Animated.View style={[s.navSearch, navSearchAnimStyle]}>
            <TouchableOpacity
              style={s.navSearchInner}
              onPress={onNavSearchPress}
              activeOpacity={0.9}
            >
              <Ionicons name="search" size={20} color={Colors.white} style={{ opacity: 0.8 }} />
              <Text style={s.navSearchTxt} numberOfLines={1}>{navSearchPlaceholder}</Text>
            </TouchableOpacity>
          </Animated.View>

          {onHeaderIconPress ? (
            <TouchableOpacity style={s.iconBtn} onPress={onHeaderIconPress} activeOpacity={0.7}>
              <Ionicons name={headerIcon as any} size={24} color={Colors.white} />
              {headerIconBadgeCount > 0 && (
                <View style={s.badge}>
                  <Text style={s.badgeText}>
                    {headerIconBadgeCount > 99 ? '+99' : headerIconBadgeCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40, height: 40 }} />
          )}

          {/* ABSOLUTE TITLE (Overlaps nav search gracefully, fades out on scroll) */}
          <Animated.View style={[s.absoluteTitleContainer, heroContentAnimStyle]} pointerEvents="none">
            <Text style={s.heroTitle} numberOfLines={1}>
              {title.split(/(ون)/).map((part, index) => (
                part === 'ون' ? (
                  <Text key={index} style={{ color: primaryCta.bgColor || Colors.accent }}>{part}</Text>
                ) : (
                  <Text key={index}>{part}</Text>
                )
              ))}
            </Text>
            {titleAccent && <Text style={s.heroTitleAccent} numberOfLines={1}>{titleAccent}</Text>}
          </Animated.View>
        </View>

        {/* SECTION 2: ANIMATED HERO CONTENT */}
        <View style={s.animatedHeroContent} pointerEvents="box-none">
          {/* HERO SEARCH BAR & ADD BUTTON */}
          <Animated.View style={[s.heroSearchRow, heroSearchAnimStyle]}>
            <TouchableOpacity style={s.searchBar} onPress={onHeroSearchPress} activeOpacity={0.9}>
              <View style={s.searchInnerWrapper}>
                <Ionicons name="search" size={20} color={Colors.white} style={{ opacity: 0.8 }} />
                <Text style={s.searchPlaceholder} numberOfLines={1}>{heroSearchPlaceholder}</Text>
              </View>
              <View style={s.searchFilterBtn}>
                <Ionicons name="options-outline" size={20} color={Colors.white} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[s.addBtnHero, { backgroundColor: primaryCta.bgColor || Colors.white }]} onPress={primaryCta.onPress} activeOpacity={0.9}>
              <Ionicons name="add" size={24} color={primaryCta.textColor || Colors.primary} />
            </TouchableOpacity>
          </Animated.View>
        </View>

      </AnimatedLinearGradient>
    </>
  );
}

const s = StyleSheet.create({
  stickyHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    paddingHorizontal: Spacing.space4,
    paddingBottom: 7,
    overflow: 'hidden',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  // -- Section 1: Static Top Bar --
  staticTopBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 50, zIndex: 10,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: '#EF4444', minWidth: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4, borderWidth: 1.5, borderColor: '#0B2447',
  },
  badgeText: {
    fontFamily: 'Almarai_700Bold', fontSize: 10, color: '#FFFFFF', textAlign: 'center',
  },
  navSearch: {
    flex: 1, marginHorizontal: Spacing.space3,
  },
  navSearchInner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)',
    height: 40, borderRadius: 20, paddingHorizontal: Spacing.space3, gap: Spacing.space2,
  },
  navSearchTxt: {
    fontFamily: 'Almarai_400Regular', fontSize: 13, lineHeight: 20, paddingTop: 2, color: 'rgba(255,255,255,0.85)', textAlign: 'left', flex: 1, writingDirection: 'rtl'
  },
  absoluteTitleContainer: {
    position: 'absolute', top: 0, left: 52, right: 52, bottom: -4, // allows it to hang slightly below top bar elegantly
    alignItems: 'center', justifyContent: 'center', zIndex: -1,
  },
  
  // -- Section 2: Animated Hero Content --
  animatedHeroContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 12, // plenty of breathing room between search and CTA
  },
  heroTitle: {
    fontFamily: 'Almarai_800ExtraBold', fontSize: 20, lineHeight: 28,
    color: Colors.white, textAlign: 'center',
  },
  heroTitleAccent: {
    fontFamily: 'Almarai_400Regular', fontSize: 14, lineHeight: 22,
    color: Colors.accent,
  },
  heroSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space3,
    alignSelf: 'stretch',
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)', height: 40, borderRadius: 20,
    paddingStart: Spacing.space3, paddingEnd: 4, gap: Spacing.space2,
  },
  searchInnerWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.space2 },
  searchPlaceholder: { 
    fontFamily: 'Almarai_400Regular', color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 20, paddingTop: 2, flex: 1, 
    textAlign: 'left', writingDirection: 'rtl' 
  },
  searchFilterBtn: { 
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', 
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  addBtnHero: {
    width: 38, height: 38, borderRadius: 19, 
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
});
