import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { BottomBarTokens } from '../../constants/bottomBarTokens';

export interface BottomBarAddButtonProps {
  onPress: () => void;
  testID: string;
  accessibilityLabel: string;
  isHovered?: boolean;
}

/**
 * Shared centre add-listing squircle button used by BOTH the Home tab bar
 * (`app/(tabs)/_layout.tsx`) and all section bars (`UnifiedBottomBar.tsx`).
 *
 * Uses two nested views so iOS renders the turquoise-tinted outer shadow cleanly:
 * - OUTER view: backgroundColor (`Colors.primary`), squircle radius, shadow, NO `overflow: 'hidden'`.
 * - INNER view: same squircle radius + `overflow: 'hidden'` clipping ONLY the sheen gradient,
 *   subtle top highlight, and instant pressed darken overlay (10% darker turquoise via scrimDark10).
 */
export function BottomBarAddButton({
  onPress,
  testID,
  accessibilityLabel,
  isHovered,
}: BottomBarAddButtonProps) {
  const pressScale = useSharedValue(1);
  const [isPressed, setIsPressed] = useState(false);

  React.useEffect(() => {
    if (isHovered) {
      pressScale.value = withSpring(1.08, { damping: 10, stiffness: 300 });
    } else {
      pressScale.value = withSpring(1, { damping: 12, stiffness: 250 });
    }
  }, [isHovered, pressScale]);

  const fabAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handlePress = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    pressScale.value = withSpring(0.85, { damping: 9, stiffness: 350 }, () => {
      pressScale.value = withSpring(1, { damping: 12, stiffness: 250 });
    });
    onPress();
  }, [onPress, pressScale]);

  return (
    <View style={s.slot}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        testID={testID}
      >
        <Animated.View style={[s.animWrap, fabAnimStyle]}>
          {/* OUTER shadow view: NO overflow: 'hidden' so iOS never clips the shadow */}
          <View
            testID={`${testID}-shadow`}
            style={[
              s.outerShadow,
              isPressed && s.outerShadowPressed,
            ]}
          >
            {/* INNER face view: clips ONLY the sheen gradient, top highlight, and pressed overlay */}
            <View testID={`${testID}-face`} style={s.innerFace}>
              <LinearGradient
                pointerEvents="none"
                colors={BottomBarTokens.addButtonFaceSheenColors}
                locations={[0, 0.55]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View pointerEvents="none" style={s.topHighlight} />
              {isPressed && (
                <View
                  testID={`${testID}-pressed-overlay`}
                  pointerEvents="none"
                  style={s.pressedOverlay}
                />
              )}
              <Ionicons name="add" size={20} color={Colors.white} />
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  slot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: BottomBarTokens.expandedHeight,
  },
  animWrap: {
    width: BottomBarTokens.addButtonSize,
    height: BottomBarTokens.addButtonSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerShadow: {
    width: BottomBarTokens.addButtonSize,
    height: BottomBarTokens.addButtonSize,
    borderRadius: BottomBarTokens.addButtonRadius,
    backgroundColor: Colors.primaryStrong,
    ...BottomBarTokens.addButtonShadow,
  },
  outerShadowPressed: {
    transform: [{ translateY: 1 }],
    ...BottomBarTokens.addButtonShadowPressed,
  },
  innerFace: {
    width: '100%',
    height: '100%',
    borderRadius: BottomBarTokens.addButtonRadius,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHighlight: {
    ...StyleSheet.absoluteFill,
    borderRadius: BottomBarTokens.addButtonRadius,
    borderTopWidth: 1,
    borderTopColor: BottomBarTokens.addButtonTopHighlightColor,
  },
  pressedOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: BottomBarTokens.addButtonPressedOverlayColor,
  },
});
