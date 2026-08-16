import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, PanResponder } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';

import { Colors } from '../../constants/colors';
import { Gradients } from '../../constants/gradients';
import { useNavVisibility } from '../../context/NavVisibilityContext';

export const UNIFIED_BOTTOM_BAR_HEIGHT = 56;

export type IconFamily = 'Ionicons' | 'MaterialCommunityIcons';

export interface BottomBarTabItem {
  id: string;
  label?: string;
  icon?: string;
  iconOutline?: string;
  family?: IconFamily;
  isPost?: boolean;
  onPress?: () => void;
  badgeCount?: number;
}

export interface UnifiedBottomBarProps {
  tabs: BottomBarTabItem[];
  activeTab: string;
  onTabPress: (tab: BottomBarTabItem) => void;
  onPostPress: () => void;
  activeColor?: string;
  activeBgColor?: string;
  scrollAware?: boolean;
}

function DynamicTabIcon({
  family = 'Ionicons',
  name,
  size,
  color,
}: {
  family?: IconFamily;
  name: string;
  size: number;
  color: string;
}) {
  if (family === 'MaterialCommunityIcons') {
    return <MaterialCommunityIcons name={name as any} size={size} color={color} />;
  }
  return <Ionicons name={name as any} size={size} color={color} />;
}

function FABItem({ onPress, isHovered }: { onPress: () => void; isHovered?: boolean }) {
  const pressScale = useSharedValue(1);
  const breathScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.35);

  React.useEffect(() => {
    if (isHovered) {
      pressScale.value = withSpring(1.12, { damping: 10, stiffness: 300 });
    } else {
      pressScale.value = withSpring(1, { damping: 12, stiffness: 250 });
    }
  }, [isHovered, pressScale]);

  React.useEffect(() => {
    // Subtle, elegant breathing micro-animation for "أضف إعلان"
    breathScale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.12, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [breathScale, pulseOpacity]);

  const fabAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value * breathScale.value }],
  }));

  const pulseRingStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          breathScale.value,
          [1, 1.04],
          [1, 1.18],
          Extrapolation.CLAMP
        ),
      },
    ],
    opacity: pulseOpacity.value,
  }));

  const handlePress = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    pressScale.value = withSpring(0.84, { damping: 9, stiffness: 350 }, () => {
      pressScale.value = withSpring(1, { damping: 12, stiffness: 250 });
    });
    onPress();
  }, [onPress, pressScale]);

  return (
    <View style={s.fabItem}>
      <Pressable
        onPress={handlePress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="إضافة إعلان جديد"
      >
        <View style={s.fabCenterWrapper}>
          {/* Subtle Ambient Pulse Ring */}
          <Animated.View style={[s.fabPulseRing, pulseRingStyle]} />

          {/* Modern Rounded Squircle Button with Clean Edges */}
          <Animated.View style={[s.fabSquircleWrap, fabAnimStyle]}>
            <LinearGradient
              colors={Gradients.hero}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.fabSquircle}
            >
              <Ionicons name="add" size={26} color={Colors.white} />
            </LinearGradient>
          </Animated.View>
        </View>
      </Pressable>
    </View>
  );
}

function TabItem({
  tab,
  isActive,
  onPress,
  activeColor,
  activeBgColor,
}: {
  tab: BottomBarTabItem;
  isActive: boolean;
  onPress: () => void;
  activeColor: string;
  activeBgColor: string;
}) {
  const iconScale = useSharedValue(isActive ? 1.08 : 1);
  const activeProgress = useSharedValue(isActive ? 1 : 0);

  React.useEffect(() => {
    if (isActive) {
      iconScale.value = withSpring(1.08, { damping: 12, stiffness: 250 });
      activeProgress.value = withSpring(1, { damping: 14, stiffness: 220 });
    } else {
      iconScale.value = withSpring(1, { damping: 14, stiffness: 250 });
      activeProgress.value = withTiming(0, { duration: 150 });
    }
  }, [isActive, iconScale, activeProgress]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      {
        translateY: interpolate(
          activeProgress.value,
          [0, 1],
          [0, -1],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const animatedBgStyle = useAnimatedStyle(() => ({
    opacity: activeProgress.value,
    transform: [
      {
        scale: interpolate(
          activeProgress.value,
          [0, 1],
          [0.75, 1],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const animatedDotStyle = useAnimatedStyle(() => ({
    width: interpolate(
      activeProgress.value,
      [0, 1],
      [0, 14],
      Extrapolation.CLAMP
    ),
    opacity: activeProgress.value,
  }));

  const handlePress = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    iconScale.value = withSpring(0.82, { damping: 8, stiffness: 350 }, () => {
      iconScale.value = withSpring(1.08, { damping: 12, stiffness: 250 });
    });
    onPress();
  }, [onPress, iconScale]);

  const iconName = isActive
    ? tab.icon || tab.iconOutline || 'ellipse'
    : tab.iconOutline || tab.icon || 'ellipse-outline';

  const iconSize = tab.family === 'MaterialCommunityIcons' ? 22 : 21;

  return (
    <Pressable
      style={s.tabItem}
      onPress={handlePress}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={tab.label}
    >
      <View style={s.iconContainer}>
        <Animated.View
          style={[
            s.iconBg,
            {
              backgroundColor: activeBgColor,
              borderColor: activeColor + '30',
            },
            animatedBgStyle,
          ]}
        />
        <Animated.View style={animatedIconStyle}>
          <DynamicTabIcon
            family={tab.family}
            name={iconName}
            size={iconSize}
            color={isActive ? activeColor : Colors.textMuted}
          />
        </Animated.View>
        {tab.badgeCount != null && tab.badgeCount > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeText}>
              {tab.badgeCount > 99 ? '99+' : tab.badgeCount}
            </Text>
          </View>
        )}
      </View>
      {tab.label ? (
        <Text
          style={[
            s.label,
            isActive && {
              color: activeColor,
              fontFamily: 'Almarai_700Bold',
            },
          ]}
          numberOfLines={1}
        >
          {tab.label}
        </Text>
      ) : null}
      <Animated.View
        style={[s.dot, { backgroundColor: activeColor }, animatedDotStyle]}
      />
    </Pressable>
  );
}

function ScrollAwareWrapper({
  children,
  bottomPad,
  scrollAware,
}: {
  children: React.ReactNode;
  bottomPad: number;
  scrollAware: boolean;
}) {
  let navHidden: any = null;
  try {
    const navCtx = useNavVisibility();
    navHidden = navCtx?.navHidden ?? null;
  } catch {
    // If rendered outside of NavVisibilityProvider, gracefully fallback to static position
    navHidden = null;
  }

  const totalHeight = UNIFIED_BOTTOM_BAR_HEIGHT + bottomPad + 16;

  const animatedStyle = useAnimatedStyle(() => {
    if (!scrollAware || !navHidden) {
      return { transform: [{ translateY: 0 }], opacity: 1 };
    }
    return {
      transform: [
        {
          translateY: interpolate(
            navHidden.value,
            [0, 1],
            [0, totalHeight],
            Extrapolation.CLAMP
          ),
        },
      ],
      opacity: interpolate(
        navHidden.value,
        [0, 1],
        [1, 0],
        Extrapolation.CLAMP
      ),
    };
  });

  return (
    <Animated.View style={[s.wrapper, { bottom: bottomPad }, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

export function UnifiedBottomBar({
  tabs,
  activeTab,
  onTabPress,
  onPostPress,
  activeColor = Colors.primary,
  activeBgColor = '#EFF6FF',
  scrollAware = true,
}: UnifiedBottomBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12);
  const [barWidth, setBarWidth] = useState(0);
  const [draggingTabId, setDraggingTabId] = useState<string | null>(null);

  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;

  const barWidthRef = useRef(barWidth);
  barWidthRef.current = barWidth;

  const onTabPressRef = useRef(onTabPress);
  onTabPressRef.current = onTabPress;

  const onPostPressRef = useRef(onPostPress);
  onPostPressRef.current = onPostPress;

  const currentHoverIdRef = useRef<string | null>(null);

  const getTabIndexFromX = useCallback((x: number) => {
    const w = barWidthRef.current;
    const currentTabs = tabsRef.current;
    if (w <= 0 || currentTabs.length === 0) return 0;
    const tabWidth = w / currentTabs.length;
    const index = Math.floor(x / tabWidth);
    return Math.min(Math.max(0, index), currentTabs.length - 1);
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 6,

        onPanResponderGrant: (evt) => {
          const x = evt.nativeEvent.locationX;
          const index = getTabIndexFromX(x);
          const currentTabs = tabsRef.current;
          const targetTab = currentTabs[index];
          if (targetTab) {
            currentHoverIdRef.current = targetTab.id;
            setDraggingTabId(targetTab.id);
            try {
              Haptics.selectionAsync();
            } catch {}
          }
        },

        onPanResponderMove: (evt) => {
          const x = evt.nativeEvent.locationX;
          const index = getTabIndexFromX(x);
          const currentTabs = tabsRef.current;
          const targetTab = currentTabs[index];
          if (targetTab && targetTab.id !== currentHoverIdRef.current) {
            currentHoverIdRef.current = targetTab.id;
            setDraggingTabId(targetTab.id);
            try {
              Haptics.selectionAsync();
            } catch {}
          }
        },

        onPanResponderRelease: (evt) => {
          const x = evt.nativeEvent.locationX;
          const index = getTabIndexFromX(x);
          const currentTabs = tabsRef.current;
          const targetTab = currentTabs[index];

          setDraggingTabId(null);
          currentHoverIdRef.current = null;

          if (targetTab) {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}

            if (targetTab.isPost) {
              onPostPressRef.current();
            } else {
              onTabPressRef.current(targetTab);
            }
          }
        },

        onPanResponderTerminate: () => {
          setDraggingTabId(null);
          currentHoverIdRef.current = null;
        },
      }),
    [getTabIndexFromX]
  );

  const effectiveActiveTab = draggingTabId ?? activeTab;

  return (
    <ScrollAwareWrapper bottomPad={bottomPad} scrollAware={scrollAware}>
      <BlurView
        intensity={Platform.OS === 'ios' ? 65 : 45}
        tint="default"
        style={s.blurBackground}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.42)', 'rgba(255, 255, 255, 0.16)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={s.topHighlight} />
      </BlurView>
      <View
        style={s.bar}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        {tabs.map((tab) => {
          if (tab.isPost) {
            return (
              <FABItem
                key={tab.id}
                onPress={onPostPress}
                isHovered={effectiveActiveTab === tab.id}
              />
            );
          }

          const isActive = effectiveActiveTab === tab.id;
          return (
            <TabItem
              key={tab.id}
              tab={tab}
              isActive={isActive}
              onPress={() => onTabPress(tab)}
              activeColor={activeColor}
              activeBgColor={activeBgColor}
            />
          );
        })}
      </View>
    </ScrollAwareWrapper>
  );
}

const s = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    maxWidth: 480,
    alignSelf: 'center',
    borderRadius: 26,
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
      },
      android: { elevation: 6 },
    }),
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  bar: {
    flexDirection: 'row',
    height: UNIFIED_BOTTOM_BAR_HEIGHT,
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: UNIFIED_BOTTOM_BAR_HEIGHT,
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
    width: 38,
    height: 25,
    borderRadius: 13,
    borderWidth: 1,
  },
  label: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10,
    lineHeight: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
    paddingTop: 1,
  },
  dot: {
    height: 3,
    borderRadius: 1.5,
    marginTop: 1,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: '#ef4444',
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontFamily: 'Almarai_800ExtraBold',
    lineHeight: 11,
  },
  fabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: UNIFIED_BOTTOM_BAR_HEIGHT,
  },
  fabCenterWrapper: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  fabPulseRing: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: Colors.primary,
  },
  fabSquircleWrap: {
    width: 44,
    height: 44,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#ffffff',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
    }),
  },
  fabSquircle: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
