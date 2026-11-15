import React, { useCallback } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { Colors } from '../../constants/colors'
import { BottomBarTokens } from '../../constants/bottomBarTokens'
import { Spacing } from '../../constants/spacing'
import { TopBarTokens } from '../../constants/topBarTokens'
import { useAppReducedMotion } from '../../utils/listing-detail/useAppReducedMotion'
import { GlassSurface } from '../navigation/glassSupport'
import { PostCategoryTokens } from './postCategoryTokens'
import type { PostCategoryOption } from '../../constants/postCategories'

export interface PostCategoryCardProps {
  category: PostCategoryOption
  index: number
  onPress: () => void
}

export function PostCategoryCard({ category, index, onPress }: PostCategoryCardProps) {
  const pressed = useSharedValue(false)
  const reducedMotion = useAppReducedMotion()
  const pressStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: reducedMotion
          ? 1
          : withSpring(pressed.value ? PostCategoryTokens.pressScale : 1, {
              damping: PostCategoryTokens.pressSpringDamping,
              stiffness: PostCategoryTokens.pressSpringStiffness,
            }),
      },
    ],
  }))

  const handlePressIn = useCallback(() => {
    pressed.value = true
  }, [pressed])
  const handlePressOut = useCallback(() => {
    pressed.value = false
  }, [pressed])
  const entering = reducedMotion
    ? undefined
    : FadeInDown.delay(index * PostCategoryTokens.entranceStaggerMs)
        .duration(PostCategoryTokens.entranceDurationMs)

  return (
    <Pressable
      testID={`post-category-card-${category.id}`}
      style={styles.pressable}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={category.title}
    >
      <Animated.View style={[styles.rowCard, pressStyle]}>
        <View pointerEvents="none" style={styles.iceBacking} />
        <GlassSurface
          testID={`post-category-glass-${category.id}`}
          borderRadius={PostCategoryTokens.cardRadius}
          noBorder
          washColor={TopBarTokens.iceGlass}
          washOpacity={BottomBarTokens.lightWashOpacity}
        />
        <Animated.View
          pointerEvents="none"
          entering={entering}
          style={styles.content}
        >
          <View style={styles.iconBox} testID={`post-category-icon-box-${category.id}`}>
            <MaterialCommunityIcons
              testID={`post-category-icon-${category.id}`}
              name={category.icon}
              size={PostCategoryTokens.iconSize}
              color={Colors.primary}
            />
          </View>

          <View style={styles.textColumn}>
            <Text style={styles.title} numberOfLines={1}>
              {category.title}
            </Text>
            <Text style={styles.description} numberOfLines={1}>
              {category.description}
            </Text>
          </View>

          <Ionicons
            testID={`post-category-chevron-${category.id}`}
            name="chevron-back"
            size={PostCategoryTokens.chevronSize}
            color={Colors.textMuted}
          />
        </Animated.View>
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
    height: PostCategoryTokens.rowHeight,
  },
  rowCard: {
    flex: 1,
    height: PostCategoryTokens.rowHeight,
    paddingHorizontal: Spacing.space3,
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: PostCategoryTokens.cardRadius,
    borderWidth: TopBarTokens.buttonBorderWidth,
    borderColor: TopBarTokens.buttonBorderColor,
    backgroundColor: TopBarTokens.iceGlass,
    ...TopBarTokens.buttonShadow,
  },
  iceBacking: {
    ...StyleSheet.absoluteFill,
    backgroundColor: TopBarTokens.iceGlass,
    borderRadius: PostCategoryTokens.cardRadius,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space3,
    width: '100%',
  },
  iconBox: {
    width: PostCategoryTokens.iconBoxSize,
    height: PostCategoryTokens.iconBoxSize,
    borderRadius: PostCategoryTokens.iconBoxRadius,
    backgroundColor: Colors.paleMint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  title: {
    fontFamily: 'Almarai_700Bold',
    fontSize: PostCategoryTokens.cardTitleFontSize,
    lineHeight: PostCategoryTokens.cardTitleLineHeight,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  description: {
    fontFamily: 'Almarai_400Regular',
    fontSize: PostCategoryTokens.descriptionFontSize,
    lineHeight: PostCategoryTokens.descriptionLineHeight,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
})
