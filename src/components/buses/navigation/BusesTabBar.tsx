import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
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
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { Colors } from '../../../constants/colors';
import { Shadows } from '../../../constants/shadows';
import { Typography } from '../../../constants/typography';

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

const BAR_H      = 56;
const FAB_SIZE   = 44;
const ICON_SIZE  = 21;
const FONT_ACT   = 'Almarai_700Bold';
const FONT_INACT = 'Almarai_400Regular';

const TABS = [
  { name: 'index',     label: 'الرئيسية', icon: 'home'       as const, iconO: 'home-outline'       as const },
  { name: 'search',    label: 'البحث',    icon: 'search'     as const, iconO: 'search-outline'     as const },
  { name: 'new',       label: 'أضف',      icon: 'add-circle' as const, iconO: 'add-circle'         as const },
  { name: 'browse',    label: 'تصفح',      icon: 'bus'        as const, iconO: 'bus-outline'        as const },
  { name: 'favorites', label: 'المفضلة', icon: 'heart'      as const, iconO: 'heart-outline'      as const },
] as const;

// Tabs that navigate directly to an existing route (not a sub-route)
const DIRECT_NAV: Partial<Record<string, string>> = {
  search:    '/buses/browse',
  favorites: '/profile/favorites?tab=buses',
};

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

// ─── Custom Tab Bar Component ─────────────────────────────────────────────────
export function BusesTabBar({ state, navigation, descriptors }: BottomTabBarProps) {
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { isLoggedIn } = useAuthStore();

  const handlePost = useCallback(() => {
    if (!isLoggedIn) { router.push('/(auth)/login'); return; }
    router.push('/buses/new');
  }, [isLoggedIn, router]);

  const bottomPad = insets.bottom > 0 ? insets.bottom : 16;
  const currentRoute = state.routes[state.index];
  const currentRouteName = currentRoute.name;

  // Only show the bottom bar on the landing page (index)
  if (currentRouteName !== 'index') {
    return null;
  }

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
          const isFocused = currentRouteName === meta.name;

          if (meta.name === 'new') {
            return <FABItem key={meta.name} onPress={handlePost} />;
          }

          const onPress = () => {
            if (meta.name === 'favorites' && !isLoggedIn) {
              router.push('/(auth)/login'); return;
            }
            // If the tab has a direct nav target, use it
            const directTarget = DIRECT_NAV[meta.name];
            if (directTarget) {
              router.push(directTarget as any); return;
            }
            if (meta.name === 'index') {
               router.push('/buses');
            } else {
               router.push(`/buses/${meta.name}` as any);
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    maxWidth: 480,
    alignSelf: 'center',
    borderRadius: 28,
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 14,
      },
      android: { elevation: 8 },
    }),
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  bar: {
    flexDirection: 'row',
    height: BAR_H,
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: BAR_H,
    gap: 1,
    paddingTop: 3,
    paddingBottom: 4,
  },
  iconContainer: {
    width: 36,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconBg: {
    position: 'absolute',
    width: 36,
    height: 24,
    borderRadius: 12,
    backgroundColor: T.primaryBg,
  },
  label: {
    fontFamily: FONT_INACT,
    fontSize: 10,
    lineHeight: 14,
    color: T.inactive,
    textAlign: 'center',
    writingDirection: 'rtl',
    paddingTop: 1,
  },
  labelActive: {
    fontFamily: FONT_ACT,
    color: T.primary,
  },
  dot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: T.primary,
    marginTop: 1,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: T.badgeBg,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: T.badgeBorder,
  },
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
      ios: {
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
});
