import { Tabs, useRouter } from 'expo-router'
import React, { useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Pattern, Defs, Rect } from 'react-native-svg'
import { Gradients } from '../../src/constants/gradients'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useAuthStore } from '../../src/store/authStore'
import { useNavVisibility } from '../../src/context/NavVisibilityContext'
import { Colors } from '../../src/constants/colors'
import { Shadows } from '../../src/constants/shadows'
import { Typography } from '../../src/constants/typography'

// ─── Design Tokens ──────────────────────────────────────────────────────────
const T = {
  primary:    Colors.primary,
  primaryBg:  '#EEF3FF', // custom light bg for active icon
  accent:     Colors.accent,
  inactive:   Colors.textMuted,
  label:      Colors.text,
  white:      Colors.white,
  border:     Colors.border,
  barBg:      Colors.white,
  fabBg:      Colors.primary,
  fabIcon:    Colors.white,
  badgeBg:    Colors.accent,
  badgeBorder:Colors.white,
} as const

const BAR_H      = 52
const FAB_SIZE   = 38
const ICON_SIZE  = 20
const FONT_ACT   = Typography.labelMd.fontFamily
const FONT_INACT = Typography.caption.fontFamily

const TABS = [
  { name: 'index',   label: 'الرئيسية', icon: 'home'       as const, iconO: 'home-outline'       as const },
  { name: 'search',  label: 'البحث',    icon: 'search'     as const, iconO: 'search-outline'     as const },
  { name: 'post',    label: 'أضف',      icon: 'add-circle' as const, iconO: 'add-circle'         as const },
  { name: 'chat',    label: 'رسائل',    icon: 'chatbubble' as const, iconO: 'chatbubble-outline' as const },
  { name: 'profile', label: 'حسابي',    icon: 'person'     as const, iconO: 'person-outline'     as const },
] as const

// ─── Regular Tab Item ─────────────────────────────────────────────────────────
interface TabItemProps {
  meta: typeof TABS[number]
  focused: boolean
  onPress: () => void
  showBadge?: boolean
}

function TabItem({ meta, focused, onPress, showBadge = false }: TabItemProps) {
  const scale   = useSharedValue(1)
  const dotW    = useSharedValue(focused ? 1 : 0)
  const bgAlpha = useSharedValue(focused ? 1 : 0)

  // Sync animations with focus state
  if (focused && dotW.value < 1) {
    dotW.value    = withSpring(1, { damping: 18, stiffness: 200 })
    bgAlpha.value = withTiming(1, { duration: 180 })
  } else if (!focused && dotW.value > 0) {
    dotW.value    = withTiming(0, { duration: 150 })
    bgAlpha.value = withTiming(0, { duration: 150 })
  }

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgAlpha.value,
    transform: [
      { scale: interpolate(bgAlpha.value, [0, 1], [0.7, 1], Extrapolation.CLAMP) },
    ],
  }))

  const dotStyle = useAnimatedStyle(() => ({
    width: interpolate(dotW.value, [0, 1], [0, 16], Extrapolation.CLAMP),
    opacity: dotW.value,
  }))

  const handlePress = useCallback(() => {
    scale.value = withSpring(0.78, { damping: 8, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 250 })
    })
    onPress()
  }, [onPress])

  return (
    <Pressable
      onPress={handlePress}
      style={s.tabItem}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={meta.label}
    >
      {/* Icon + badge */}
      <View style={s.iconContainer}>
        {/* Active bg bubble */}
        <Animated.View style={[s.iconBg, bgStyle]} />

        <Animated.View style={iconAnimStyle}>
          <Ionicons
            name={focused ? meta.icon : meta.iconO}
            size={ICON_SIZE}
            color={focused ? T.primary : T.inactive}
          />
        </Animated.View>

        {showBadge && (
          <View style={s.badge} />
        )}
      </View>

      {/* Label */}
      <Text
        style={[s.label, focused && s.labelActive]}
        numberOfLines={1}
      >
        {meta.label}
      </Text>

      {/* Active dot indicator */}
      <Animated.View style={[s.dot, dotStyle]} />
    </Pressable>
  )
}

// ─── FAB (Center Post Button) ─────────────────────────────────────────────────
function FABItem({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1)

  const fabAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePress = useCallback(() => {
    scale.value = withSpring(0.85, { damping: 8, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 250 })
    })
    onPress()
  }, [onPress])

  return (
    <Pressable
      onPress={handlePress}
      style={s.fabItem}
      accessibilityRole="button"
      accessibilityLabel="إضافة إعلان"
    >
      <Animated.View style={[s.fabCircle, fabAnimStyle]}>
        <Ionicons name="add" size={22} color={T.fabIcon} />
      </Animated.View>
    </Pressable>
  )
}

// ─── Custom Tab Bar ───────────────────────────────────────────────────────────
function CustomTabBar({ state, navigation, descriptors }: BottomTabBarProps) {
  const insets  = useSafeAreaInsets()
  const router  = useRouter()
  const { isLoggedIn } = useAuthStore()
  const { navHidden } = useNavVisibility()

  const handlePost = useCallback(() => {
    if (!isLoggedIn) { router.push('/(auth)/login'); return }
    router.push('/buses/new')
  }, [isLoggedIn, router])

  const bottomPad = insets.bottom > 0 ? insets.bottom : 16
  const totalHeight = BAR_H + bottomPad + 20

  // Animate tab bar down based on navHidden shared value (0 to 1)
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(navHidden.value, [0, 1], [0, totalHeight], Extrapolation.CLAMP) }],
    opacity: interpolate(navHidden.value, [0, 1], [1, 0], Extrapolation.CLAMP),
  }))

  // Animate the floating capsule up when navHidden is 1
  const capsuleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(navHidden.value, [0, 1], [totalHeight + 20, 0], Extrapolation.CLAMP) }],
    opacity: interpolate(navHidden.value, [0.5, 1], [0, 1], Extrapolation.CLAMP),
  }))

  // Dynamically hide tab bar if the focused route explicitly disables it
  const currentDescriptor = descriptors[state.routes[state.index].key]
  const tabBarStyle = currentDescriptor.options.tabBarStyle as any
  if (tabBarStyle?.display === 'none') {
    return null
  }

  return (
    <>
      <Animated.View style={[s.wrapper, { bottom: bottomPad }, containerStyle]}>
        <BlurView intensity={80} tint="light" style={s.blurBackground} />
        <View style={s.bar}>
          {state.routes.map((route, index) => {
            const meta    = TABS[index]
            const focused = state.index === index

            if (route.name === 'post') {
              return <FABItem key={route.key} onPress={handlePost} />
            }

            const onPress = () => {
              if ((route.name === 'chat' || route.name === 'profile') && !isLoggedIn) {
                router.push('/(auth)/login'); return
              }
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              })
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name)
              }
            }

            return (
              <TabItem
                key={route.key}
                meta={meta}
                focused={focused}
                onPress={onPress}
                showBadge={route.name === 'chat'}
              />
            )
          })}
        </View>
      </Animated.View>

      {/* ── Floating Capsule (Replaces Tab Bar when hidden) ── */}
      <Animated.View style={[s.floatingFabWrap, { bottom: bottomPad + 4 }, capsuleStyle]} pointerEvents="box-none">
        <Pressable onPress={handlePost} android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: true, radius: 26 }}>
          <LinearGradient
            colors={Gradients.hero as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.floatingFab}
          >
            <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
              <Svg width="100%" height="100%">
                <Defs>
                  <Pattern id="fabGridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                    <Path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                  </Pattern>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#fabGridPattern)" />
              </Svg>
            </View>
            <Ionicons name="add" size={30} color={T.white} />
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </>
  )
}

// ─── Root Layout ──────────────────────────────────────────────────────────────
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index"   options={{ title: 'الرئيسية' }} />
      <Tabs.Screen name="search"  options={{ title: 'البحث'    }} />
      <Tabs.Screen name="post"    options={{ title: 'أضف'      }} />
      <Tabs.Screen name="chat"    options={{ title: 'رسائل'    }} />
      <Tabs.Screen name="profile" options={{ title: 'حسابي', tabBarStyle: { display: 'none' } }} />
    </Tabs>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // ── Container ──
  wrapper: {
    position: 'absolute',
    left: 16, right: 16,
    maxWidth: 480,
    alignSelf: 'center',
    borderRadius: 28,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 14,
      },
      android: { elevation: 10 },
    }),
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.82)', // fallback
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },

  // ── Main row ──
  bar: {
    flexDirection: 'row',
    height: BAR_H,
    alignItems: 'center',
    paddingHorizontal: 6,
  },

  // ── Regular tab item ──
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: BAR_H,
    gap: 1,
    paddingTop: 3,
    paddingBottom: 4,
  },

  // Icon container holds the bg bubble + icon + badge
  iconContainer: {
    width: 38,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  // Soft bg pill behind active icon
  iconBg: {
    position: 'absolute',
    width: 38,
    height: 26,
    borderRadius: 13,
    backgroundColor: T.primaryBg,
  },

  label: {
    fontFamily: FONT_INACT,
    fontSize: 9.5,
    color: T.inactive,
    letterSpacing: 0.1,
    lineHeight: 14,
    paddingBottom: 1,
  },
  labelActive: {
    fontFamily: FONT_ACT,
    color: T.primary,
  },

  // Small pill dot at the bottom
  dot: {
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: T.primary,
  },

  // Unread badge
  badge: {
    position: 'absolute',
    top: 2,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.badgeBg,
    borderWidth: 1,
    borderColor: T.badgeBorder,
  },

  // ── FAB slot ──
  fabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: BAR_H,
  },

  fabCircle: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: T.fabBg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: Shadows.floating,
      android: { elevation: 8 },
    }),
  },

  // ── Floating Capsule ──
  floatingFabWrap: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: T.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: { elevation: 10 },
    }),
  },
  floatingFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
})
