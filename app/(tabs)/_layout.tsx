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
import { Colors } from '../../src/constants/colors'
import { Shadows } from '../../src/constants/shadows'
import { Typography } from '../../src/constants/typography'
import { BottomBarTokens } from '../../src/constants/bottomBarTokens'
import { GlassBottomBarShell } from '../../src/components/navigation/GlassBottomBarShell'
import { AddListingButton } from '../../src/components/navigation/AddListingButton'

// ─── Design Tokens ──────────────────────────────────────────────────────────
const T = {
  primary:    Colors.primary,
  primaryBg:  BottomBarTokens.activePillBg, // minimal green pale mint for active icon bubble
  accent:     Colors.accent,
  inactive:   Colors.textMuted,
  label:      Colors.text,
  white:      Colors.white,
  border:     Colors.border,
  barBg:      Colors.white,
  badgeBg:    Colors.accent,
  badgeBorder:Colors.white,
} as const

const BAR_H      = BottomBarTokens.expandedHeight
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
  React.useEffect(() => {
    if (focused && dotW.value < 1) {
      dotW.value    = withSpring(1, { damping: 18, stiffness: 200 })
      bgAlpha.value = withTiming(1, { duration: 180 })
    } else if (!focused && dotW.value > 0) {
      dotW.value    = withTiming(0, { duration: 150 })
      bgAlpha.value = withTiming(0, { duration: 150 })
    }
  }, [focused, dotW, bgAlpha])

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
      style={({ pressed, hovered }: any) => [
        s.tabItem,
        hovered && s.tabItemHovered,
        pressed && s.tabItemPressed,
      ]}
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
          <View style={s.badge} testID="chat-tab-badge" />
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

// ─── Custom Tab Bar ───────────────────────────────────────────────────────────
export function CustomTabBar({ state, navigation, descriptors }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { isLoggedIn } = useAuthStore()

  const handlePost = useCallback(() => {
    if (!isLoggedIn) { router.push('/(auth)/login'); return }
    router.push('/(modals)/post-category' as any)
  }, [isLoggedIn, router])

  // Dynamically hide tab bar if the focused route explicitly disables it
  const currentDescriptor = descriptors[state.routes[state.index]?.key]
  const tabBarStyle = currentDescriptor?.options?.tabBarStyle as any
  if (tabBarStyle?.display === 'none') {
    return null
  }

  const bottomPad = insets.bottom > 0 ? insets.bottom : 16

  const activeRoute = state.routes[state.index]
  const currentMeta = TABS[state.index] ?? TABS[0]

  const collapsedIcon = (
    <Ionicons
      name={currentMeta.icon}
      size={BottomBarTokens.collapsedIconSize}
      color={BottomBarTokens.activeIconColor}
    />
  )

  const collapsedBadge = activeRoute?.name === 'chat' ? (
    <View style={s.collapsedBadge} testID="collapsed-chat-badge" />
  ) : undefined

  return (
    <GlassBottomBarShell
      bottomPad={bottomPad}
      collapsedIcon={collapsedIcon}
      badge={collapsedBadge}
      testID="custom-tab-bar"
    >
      <View style={s.bar}>
        {state.routes.map((route: any, index: number) => {
          const meta    = TABS[index]
          const focused = state.index === index

          if (route.name === 'post') {
            return (
              <View key={route.key} style={s.fabItem}>
                <AddListingButton
                  onPress={handlePost}
                  accessibilityLabel="إضافة إعلان"
                  testID="tab-post-fab"
                />
              </View>
            )
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
    </GlassBottomBarShell>
  )
}

// ─── Root Layout ──────────────────────────────────────────────────────────────
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props: any) => <CustomTabBar {...props} />}
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
    borderRadius: 14,
  },
  tabItemHovered: {
    backgroundColor: T.primaryBg,
  },
  tabItemPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
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

  // ── Collapsed Circle Badge ──
  collapsedBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: T.badgeBg,
    borderWidth: 1.5,
    borderColor: T.badgeBorder,
  },
})
