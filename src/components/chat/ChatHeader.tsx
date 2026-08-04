import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  TextInput,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Defs, Pattern, Rect, Path } from 'react-native-svg'
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Gradients } from '../../constants/gradients'

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient)

const THRESHOLD = 15
const ANIM_RANGE = 75
const ANIM_END = THRESHOLD + ANIM_RANGE

export interface ChatHeaderProps {
  scrollY: SharedValue<number>
  searchText: string
  onSearchChange: (text: string) => void
  unreadCount?: number
  totalCount?: number
  onNotificationsPress?: () => void
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  scrollY,
  searchText,
  onSearchChange,
  unreadCount = 0,
  totalCount = 0,
  onNotificationsPress,
}) => {
  const insets = useSafeAreaInsets()
  const COMPACT_HEIGHT = insets.top + 54
  const HERO_HEIGHT = insets.top + 120

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onSearchChange('')
  }

  const subtitleText =
    unreadCount > 0
      ? `لديك ${unreadCount} ${
          unreadCount === 1 ? 'رسالة جديدة' : 'رسائل جديدة'
        }`
      : totalCount > 0
      ? `${totalCount} ${totalCount === 1 ? 'محادثة' : 'محادثات نشطة'}`
      : 'لا توجد رسائل جديدة'

  // ─── Header Height & Radius Animation (Hero with radius -> Compact flat 0 radius) ───
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
      [24, 24, 0],
      Extrapolation.CLAMP
    ),
    borderBottomRightRadius: interpolate(
      scrollY.value,
      [0, THRESHOLD, ANIM_END],
      [24, 24, 0],
      Extrapolation.CLAMP
    ),
  }))

  // ─── Title & Subtitle Fade Out on Scroll ───
  const titleSectionAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, THRESHOLD, THRESHOLD + ANIM_RANGE * 0.45],
      [1, 1, 0],
      Extrapolation.CLAMP
    ),
  }))

  // ─── Compact Search Bar Fades In on Scroll (Home style) ───
  const navSearchAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, THRESHOLD + ANIM_RANGE * 0.35, ANIM_END],
      [0, 0, 1],
      Extrapolation.CLAMP
    ),
  }))

  // ─── Bottom Search Bar Fades Out on Scroll ───
  const heroSearchAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, THRESHOLD, THRESHOLD + ANIM_RANGE * 0.55],
      [1, 1, 0],
      Extrapolation.CLAMP
    ),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, THRESHOLD, THRESHOLD + ANIM_RANGE * 0.55],
          [0, 0, -8],
          Extrapolation.CLAMP
        ),
      },
    ],
  }))

  return (
    <AnimatedLinearGradient
      colors={Gradients.hero as any}
      locations={[0, 0.6, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.stickyHeader,
        headerAnimStyle,
        { paddingTop: insets.top },
      ]}
    >
      {/* Svg Geometric Background Grid */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern
              id="chatGrid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <Path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
              />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#chatGrid)" />
        </Svg>
      </View>

      {/* Ambient Top Glow */}
      <View style={styles.ambientGlow} />

      {/* ── Top Bar (Height 54px, perfectly vertically centers search & button in compact state) ── */}
      <View style={styles.topRow}>
        <View style={styles.topRowLeftArea}>
          {/* 1. Title + Subtitle (Visible at top, fades out on scroll) */}
          <Animated.View
            style={[styles.titleContainer, titleSectionAnimStyle]}
          >
            <View style={styles.titleWithBadge}>
              <Text style={styles.title}>الرسائل</Text>
              {unreadCount > 0 && (
                <View style={styles.headerUnreadBadge}>
                  <Text style={styles.headerUnreadText}>{unreadCount}</Text>
                </View>
              )}
            </View>

            <View style={styles.statusCapsule}>
              <View style={[styles.statusDot, unreadCount > 0 && styles.statusDotActive]} />
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitleText}
              </Text>
            </View>
          </Animated.View>

          {/* 2. Compact Search Bar (Fades in on scroll, perfectly centered) */}
          <Animated.View
            style={[styles.navSearchWrapper, navSearchAnimStyle]}
          >
            <View style={styles.navSearchInner}>
              <Ionicons name="search" size={16} color={Colors.white} style={{ opacity: 0.85 }} />
              <TextInput
                style={styles.navSearchInput}
                placeholder="بحث في الرسائل..."
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={searchText}
                onChangeText={onSearchChange}
                textAlign="right"
                returnKeyType="search"
                clearButtonMode="never"
              />
              {searchText.length > 0 && (
                <TouchableOpacity
                  onPress={handleClear}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </View>

        {/* Notification Bell Button (Always Visible & centered) */}
        {onNotificationsPress && (
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              onNotificationsPress()
            }}
            accessibilityLabel="الإشعارات"
          >
            <Ionicons name="notifications-outline" size={20} color={Colors.white} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Bottom Large Search Bar (Visible at top, fades out on scroll) ── */}
      <Animated.View style={[styles.heroSearchContainer, heroSearchAnimStyle]}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={18}
            color={Colors.white}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث بالاسم، الإعلان أو محتوى الرسالة..."
            placeholderTextColor="rgba(255, 255, 255, 0.7)"
            value={searchText}
            onChangeText={onSearchChange}
            textAlign="right"
            returnKeyType="search"
            clearButtonMode="never"
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={handleClear}
              style={styles.clearBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={18} color="rgba(255, 255, 255, 0.8)" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </AnimatedLinearGradient>
  )
}

const styles = StyleSheet.create({
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: Spacing.space4,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.14,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  ambientGlow: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 54,
  },
  topRowLeftArea: {
    flex: 1,
    height: 54,
    justifyContent: 'center',
    marginEnd: Spacing.space3,
    position: 'relative',
  },
  titleContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 19.5,
    lineHeight: 24,
    color: Colors.white,
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  headerUnreadBadge: {
    backgroundColor: Colors.brandOrange,
    paddingHorizontal: 6.5,
    paddingVertical: 1,
    borderRadius: 9,
    minWidth: 19,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerUnreadText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10.5,
    lineHeight: 13,
    color: Colors.white,
    includeFontPadding: false,
  },
  statusCapsule: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5.5,
    marginTop: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 8.5,
    paddingVertical: 2,
    borderRadius: 11,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  statusDot: {
    width: 5.5,
    height: 5.5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  statusDotActive: {
    backgroundColor: '#34D399',
  },
  subtitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10.5,
    lineHeight: 14,
    color: 'rgba(255, 255, 255, 0.92)',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  navSearchWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  navSearchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  navSearchInput: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 17,
    color: Colors.white,
    textAlign: 'right',
    writingDirection: 'rtl',
    height: '100%',
    paddingVertical: 0,
    paddingHorizontal: 4,
    includeFontPadding: false,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSearchContainer: {
    marginTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    height: 42,
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  searchIcon: {
    marginEnd: Spacing.space2,
    opacity: 0.85,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 17,
    color: Colors.white,
    textAlign: 'right',
    writingDirection: 'rtl',
    height: '100%',
    paddingVertical: 0,
    paddingHorizontal: 4,
    includeFontPadding: false,
  },
  clearBtn: {
    padding: 4,
    marginStart: Spacing.space1,
  },
})
