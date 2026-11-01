import React, { useCallback, useEffect } from 'react'
import {
  Pressable,
  StyleSheet,
  type Insets,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { Image } from 'expo-image'
import * as Haptics from 'expo-haptics'
import { BottomBarTokens } from '../../constants/bottomBarTokens'

export const ADD_BUTTON_ASSET = require('../../../assets/images/add-button.png')

export interface AddListingButtonProps {
  onPress: () => void
  isHovered?: boolean
  size?: number
  accessibilityLabel?: string
  testID?: string
  hitSlop?: Insets
}

/**
 * AddListingButton
 * Single shared glossy turquoise add-listing button used across all bottom bars
 * (both the section action bars in UnifiedBottomBar and the main tab bar in _layout.tsx).
 * Renders the 256x256 glossy asset with spring press scale and drag-across hover scale.
 */
export function AddListingButton({
  onPress,
  isHovered = false,
  size = BottomBarTokens.addButtonSize,
  accessibilityLabel = 'إضافة إعلان',
  testID = 'add-listing-button',
  hitSlop = { top: 8, bottom: 8, left: 8, right: 8 },
}: AddListingButtonProps) {
  const scale = useSharedValue(1)

  useEffect(() => {
    if (isHovered) {
      scale.value = withSpring(1.08, { damping: 10, stiffness: 300 })
    } else {
      scale.value = withSpring(1, { damping: 12, stiffness: 250 })
    }
  }, [isHovered, scale])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePress = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    } catch {}
    scale.value = withSpring(0.85, { damping: 9, stiffness: 350 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 250 })
    })
    onPress()
  }, [onPress, scale])

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={s.pressable}
    >
      <Animated.View style={[s.circle, { width: size, height: size }, animStyle]}>
        <Image
          testID={`${testID}-image`}
          source={ADD_BUTTON_ASSET}
          style={{ width: size, height: size }}
          contentFit="contain"
          cachePolicy="memory-disk"
          accessibilityIgnoresInvertColors
        />
      </Animated.View>
    </Pressable>
  )
}

const s = StyleSheet.create({
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    ...BottomBarTokens.addButtonShadow,
  },
})
