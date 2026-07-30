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
  const COMPACT_HEIGHT = insets.top + 56;
  const HERO_HEIGHT = insets.top + 185;

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
        style={[s.stickyHeader, { paddingTop: insets.top + 8 }, headerAnimStyle]}
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

        {/* TOP BAR */}
        <View style={s.heroTop}>
          <TouchableOpacity
            style={s.iconBtn}
            onPress={onBackPress}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-forward-outline" size={22} color={Colors.white} />
          </TouchableOpacity>

          {/* NAVBAR SEARCH */}
          <Animated.View style={[s.navSearch, navSearchAnimStyle]}>
            <TouchableOpacity
              style={s.navSearchInner}
              onPress={onNavSearchPress}
              activeOpacity={0.9}
            >
              <Ionicons name="search" size={16} color={Colors.white} style={{ opacity: 0.8 }} />
              <Text style={s.navSearchTxt} numberOfLines={1}>{navSearchPlaceholder}</Text>
            </TouchableOpacity>
          </Animated.View>

          {onHeaderIconPress ? (
            <TouchableOpacity style={s.iconBtn} onPress={onHeaderIconPress} activeOpacity={0.7}>
              <Ionicons name={headerIcon as any} size={22} color={Colors.white} />
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
        </View>

        {/* HERO EXPANDABLE CONTENT */}
        <Animated.View style={[s.heroCenter, heroContentAnimStyle]} pointerEvents="box-none">
          <View style={{ alignItems: 'center', marginBottom: Spacing.space2 }}>
            <Text style={s.heroTitle}>
              {title.split(/(ون)/).map((part, index) => (
                part === 'ون' ? (
                  <Text key={index} style={{ color: primaryCta.bgColor || Colors.accent }}>{part}</Text>
                ) : (
                  <Text key={index}>{part}</Text>
                )
              ))}
            </Text>
            {titleAccent && <Text style={s.heroTitleAccent}>{titleAccent}</Text>}
          </View>

          {/* HERO SEARCH BAR */}
          <Animated.View style={[{ alignSelf: 'stretch' }, heroSearchAnimStyle]}>
            <TouchableOpacity style={s.searchBar} onPress={onHeroSearchPress} activeOpacity={0.9}>
              <View style={s.searchInnerWrapper}>
                <Ionicons name="search" size={18} color={Colors.white} style={{ opacity: 0.8 }} />
                <Text style={s.searchPlaceholder} numberOfLines={1}>{heroSearchPlaceholder}</Text>
              </View>
              <View style={s.searchFilterBtn}>
                <Ionicons name="options-outline" size={18} color={Colors.white} />
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* CTA BUTTONS */}
          <View style={s.ctaRow}>
            <TouchableOpacity
              style={[s.ctaBtn, { backgroundColor: primaryCta.bgColor || Colors.accent }]}
              onPress={primaryCta.onPress}
              activeOpacity={0.8}
            >
              <Ionicons name={primaryCta.icon as any} size={16} color={primaryCta.textColor || "#FFFFFF"} />
              <Text style={[s.ctaBtnPrimaryTxt, primaryCta.textColor ? { color: primaryCta.textColor } : null]}>{primaryCta.label}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.ctaBtn, s.ctaBtnOutline]}
              onPress={outlineCta.onPress}
              activeOpacity={0.8}
            >
              {outlineCta.iconFamily === 'MaterialCommunityIcons' ? (
                <MaterialCommunityIcons name={outlineCta.icon as any} size={18} color={outlineCta.textColor || "#FFFFFF"} />
              ) : (
                <Ionicons name={outlineCta.icon as any} size={18} color={outlineCta.textColor || "#FFFFFF"} />
              )}
              <Text style={[s.ctaBtnOutlineTxt, outlineCta.textColor ? { color: outlineCta.textColor } : null]}>{outlineCta.label}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

      </AnimatedLinearGradient>
    </>
  );
}

const s = StyleSheet.create({
  stickyHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    paddingHorizontal: Spacing.space5,
    paddingBottom: Spacing.space1,
    overflow: 'hidden',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  heroTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 44, zIndex: 10,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: -2, right: -4,
    backgroundColor: '#EF4444', minWidth: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4, borderWidth: 1.5, borderColor: '#0B2447',
  },
  badgeText: {
    fontFamily: 'Almarai_700Bold', fontSize: 9, color: '#FFFFFF', textAlign: 'center',
  },
  navSearch: {
    flex: 1, marginHorizontal: Spacing.space3,
  },
  navSearchInner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)',
    height: 40, borderRadius: 20, paddingHorizontal: Spacing.space3, gap: Spacing.space2,
  },
  navSearchTxt: {
    fontFamily: 'Almarai_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'left', flex: 1, writingDirection: 'rtl'
  },
  heroCenter: {
    alignItems: 'center',
    paddingVertical: 0,
    marginTop: -40,
  },
  heroTitle: {
    fontFamily: 'Almarai_700Bold', fontSize: 22,
    color: Colors.white, textAlign: 'center', paddingVertical: 2,
  },
  heroTitleAccent: {
    fontFamily: 'Almarai_400Regular', fontSize: 16,
    color: Colors.accent, paddingVertical: 2,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)', height: 44, borderRadius: Radius.xl,
    marginBottom: Spacing.space3, alignSelf: 'stretch',
    paddingStart: Spacing.space3, paddingEnd: 4, gap: Spacing.space2,
  },
  searchInnerWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  searchPlaceholder: { fontFamily: 'Almarai_400Regular', color: 'rgba(255,255,255,0.85)', fontSize: 12.5, flex: 1, writingDirection: 'rtl', textAlign: 'left' },
  searchFilterBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  ctaRow: {
    flexDirection: 'row', gap: Spacing.space3, paddingHorizontal: 4, marginTop: 0, alignSelf: 'stretch', marginBottom: Spacing.space1,
  },
  ctaBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 40, borderRadius: Radius.xl, gap: Spacing.space1,
  },
  ctaBtnPrimaryTxt: { fontFamily: 'Almarai_700Bold', fontSize: 12.5, color: '#FFFFFF' },
  ctaBtnOutline: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'transparent' },
  ctaBtnOutlineTxt: { fontFamily: 'Almarai_700Bold', fontSize: 12.5, color: Colors.white },
});
