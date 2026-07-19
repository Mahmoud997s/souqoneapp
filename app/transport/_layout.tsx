import { Tabs, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../../src/store/authStore';
import { Colors } from '../../src/constants/colors';
import { Shadows } from '../../src/constants/shadows';
import { Typography } from '../../src/constants/typography';

// ─── Design Tokens ──────────────────────────────────────────────────────────
const T = {
  primary:    Colors.primary,
  primaryBg:  '#EEF3FF',
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
} as const;

const BAR_H      = 60;
const FAB_SIZE   = 52;
const ICON_SIZE  = 24;
const FONT_ACT   = Typography.labelMd.fontFamily;
const FONT_INACT = Typography.caption.fontFamily;

const TABS = [
  { name: 'index',             label: 'الرئيسية', icon: 'home'       as const, iconO: 'home-outline'       as const },
  { name: 'browse',            label: 'الطلبات',   icon: 'cube'       as const, iconO: 'cube-outline'       as const },
  { name: 'new',               label: 'أضف',      icon: 'add-circle' as const, iconO: 'add-circle'         as const },
  { name: 'carriers/index',    label: 'الناقلين',  icon: 'car'        as const, iconO: 'car-outline'        as const },
  { name: 'carrier-dashboard', label: 'لوحتي',     icon: 'grid'       as const, iconO: 'grid-outline'       as const },
] as const;

// ─── Regular Tab Item ─────────────────────────────────────────────────────────
interface TabItemProps {
  meta: typeof TABS[number];
  focused: boolean;
  onPress: () => void;
  showBadge?: boolean;
}

function TabItem({ meta, focused, onPress, showBadge = false }: TabItemProps) {
  const scale   = useSharedValue(1);
  const dotW    = useSharedValue(focused ? 1 : 0);
  const bgAlpha = useSharedValue(focused ? 1 : 0);

  if (focused && dotW.value < 1) {
    dotW.value    = withSpring(1, { damping: 18, stiffness: 200 });
    bgAlpha.value = withTiming(1, { duration: 180 });
  } else if (!focused && dotW.value > 0) {
    dotW.value    = withTiming(0, { duration: 150 });
    bgAlpha.value = withTiming(0, { duration: 150 });
  }

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgAlpha.value,
    transform: [
      { scale: interpolate(bgAlpha.value, [0, 1], [0.7, 1], Extrapolation.CLAMP) },
    ],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    width: interpolate(dotW.value, [0, 1], [0, 16], Extrapolation.CLAMP),
    opacity: dotW.value,
  }));

  const handlePress = useCallback(() => {
    scale.value = withSpring(0.78, { damping: 8, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 250 });
    });
    onPress();
  }, [onPress]);

  return (
    <Pressable
      onPress={handlePress}
      style={s.tabItem}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={meta.label}
    >
      <View style={s.iconContainer}>
        <Animated.View style={[s.iconBg, bgStyle]} />
        <Animated.View style={iconAnimStyle}>
          <Ionicons
            name={focused ? meta.icon : meta.iconO}
            size={ICON_SIZE}
            color={focused ? T.primary : T.inactive}
          />
        </Animated.View>
        {showBadge && <View style={s.badge} />}
      </View>
      <Text style={[s.label, focused && s.labelActive]} numberOfLines={1}>
        {meta.label}
      </Text>
      <Animated.View style={[s.dot, dotStyle]} />
    </Pressable>
  );
}

// ─── FAB (Center Post Button) ─────────────────────────────────────────────────
function FABItem({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);

  const fabAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    scale.value = withSpring(0.85, { damping: 8, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 250 });
    });
    onPress();
  }, [onPress]);

  return (
    <Pressable onPress={handlePress} style={s.fabItem} accessibilityRole="button">
      <Animated.View style={[s.fabCircle, fabAnimStyle]}>
        <Ionicons name="add" size={30} color={T.fabIcon} />
      </Animated.View>
    </Pressable>
  );
}

// ─── Custom Tab Bar ───────────────────────────────────────────────────────────
function CustomTabBar({ state, navigation, descriptors }: BottomTabBarProps) {
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { isLoggedIn } = useAuthStore();

  const handlePost = useCallback(() => {
    if (!isLoggedIn) { router.push('/(auth)/login'); return; }
    router.push('/transport/new');
  }, [isLoggedIn, router]);

  const bottomPad = insets.bottom > 0 ? insets.bottom : 16;

  // Find the focused route name
  const currentRoute = state.routes[state.index];
  const currentRouteName = currentRoute.name;

  // Only show the bottom bar on the landing page (index)
  if (currentRouteName !== 'index') {
    return null;
  }

  // Also check dynamic display: none
  const currentDescriptor = descriptors[currentRoute.key];
  const tabBarStyle = currentDescriptor.options.tabBarStyle as any;
  if (tabBarStyle?.display === 'none') {
    return null;
  }

  return (
    <Animated.View style={[s.wrapper, { bottom: bottomPad }]}>
      <BlurView intensity={80} tint="light" style={s.blurBackground} />
      <View style={s.bar}>
        {TABS.map((meta) => {
          // Find if this tab is currently active
          const isFocused = currentRouteName === meta.name;

          if (meta.name === 'new') {
            return <FABItem key={meta.name} onPress={handlePost} />;
          }

          const onPress = () => {
            if (meta.name === 'carrier-dashboard' && !isLoggedIn) {
              router.push('/(auth)/login'); return;
            }
            
            // Navigate via Expo Router
            if (meta.name === 'carriers/index') {
               router.push('/transport/carriers');
            } else if (meta.name === 'index') {
               router.push('/transport');
            } else {
               router.push(`/transport/${meta.name}` as any);
            }
          };

          return (
            <TabItem
              key={meta.name}
              meta={meta}
              focused={isFocused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </Animated.View>
  );
}

// ─── Root Layout ──────────────────────────────────────────────────────────────
export default function TransportLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="browse" />
      <Tabs.Screen name="new" />
      <Tabs.Screen name="carriers/index" />
      <Tabs.Screen name="carrier-dashboard" />
    </Tabs>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16, right: 16,
    borderRadius: 32,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16 },
      android: { elevation: 12 },
    }),
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  bar: {
    flexDirection: 'row',
    height: BAR_H,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: BAR_H,
    gap: 2,
    paddingTop: 4,
    paddingBottom: 6,
  },
  iconContainer: {
    width: 44, height: 34,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  iconBg: {
    position: 'absolute', width: 44, height: 30, borderRadius: 15, backgroundColor: T.primaryBg,
  },
  label: {
    fontFamily: FONT_INACT, fontSize: 10, color: T.inactive,
    letterSpacing: 0.1, lineHeight: 16, paddingBottom: 2,
  },
  labelActive: {
    fontFamily: FONT_ACT, color: T.primary,
  },
  dot: {
    height: 3, borderRadius: 2, backgroundColor: T.primary,
  },
  badge: {
    position: 'absolute', top: 4, right: 6, width: 7, height: 7,
    borderRadius: 4, backgroundColor: T.badgeBg, borderWidth: 1.5, borderColor: T.badgeBorder,
  },
  fabItem: {
    flex: 1, alignItems: 'center', justifyContent: 'center', height: BAR_H,
  },
  fabCircle: {
    width: FAB_SIZE, height: FAB_SIZE, borderRadius: FAB_SIZE / 2,
    backgroundColor: T.fabBg, alignItems: 'center', justifyContent: 'center',
    ...Platform.select({ ios: Shadows.floating, android: { elevation: 10 } }),
  },
});
