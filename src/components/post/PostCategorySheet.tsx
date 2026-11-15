import React, { useMemo } from 'react'
import { PanResponder, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native'
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg'
import { GlassSurface } from '../navigation/glassSupport'
import { Spacing } from '../../constants/spacing'
import { TopBarTokens } from '../../constants/topBarTokens'
import type { PostCategoryId, PostCategoryOption } from '../../constants/postCategories'
import { PostCategoryCard } from './PostCategoryCard'
import { PostCategoryTokens } from './postCategoryTokens'
import { PostCategorySheetStyles as styles } from './PostCategorySheet.styles'

export interface PostCategorySheetProps {
  categories: readonly PostCategoryOption[]
  topInset: number
  bottomInset: number
  onSelectCategory: (categoryId: PostCategoryId) => void
  onCancel: () => void
}

export function PostCategorySheet({
  categories,
  topInset,
  bottomInset,
  onSelectCategory,
  onCancel,
}: PostCategorySheetProps) {
  const { height: screenHeight } = useWindowDimensions()

  const sheetHeight = Math.min(
    Math.max(Math.round(screenHeight * PostCategoryTokens.sheetRatio), PostCategoryTokens.sheetMinHeight),
    screenHeight - Math.max(topInset, Spacing.space6),
  )

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_evt, gestureState) => gestureState.dy > 8,
        onPanResponderRelease: (_evt, gestureState) => {
          if (gestureState.dy > PostCategoryTokens.dragDismissThreshold) {
            onCancel()
          }
        },
      }),
    [onCancel],
  )

  return (
    <View style={styles.container}>
      <Pressable
        testID="post-category-backdrop"
        style={styles.backdrop}
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="إغلاق"
      />

      <View testID="post-category-sheet" style={[styles.sheet, { height: sheetHeight }]}>
        <GlassSurface
          testID="post-category-sheet-glass"
          borderRadius={PostCategoryTokens.sheetTopRadius}
          noBorder
          intensity={TopBarTokens.blurIntensity}
          tint={TopBarTokens.blurTint}
        />
        <View pointerEvents="none" style={styles.tintOverlay} />
        <View pointerEvents="none" style={styles.gridOverlay}>
          <Svg width="100%" height="100%">
            <Defs>
              <Pattern
                id="postCategoryGreenGrid"
                width={TopBarTokens.gridPatternSize}
                height={TopBarTokens.gridPatternSize}
                patternUnits="userSpaceOnUse"
              >
                <Path
                  d={`M ${TopBarTokens.gridPatternSize} 0 L 0 0 0 ${TopBarTokens.gridPatternSize}`}
                  fill="none"
                  stroke={TopBarTokens.gridStrokeColor}
                  strokeWidth={TopBarTokens.gridStrokeWidth}
                  strokeOpacity={TopBarTokens.gridStrokeOpacity}
                />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#postCategoryGreenGrid)" />
          </Svg>
        </View>

        <View style={styles.dragZone} {...panResponder.panHandlers}>
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>ما الذي تود نشره؟</Text>
            <Text style={styles.subtitle}>اختر القسم المناسب لإعلانك للبدء</Text>
          </View>
        </View>

        <ScrollView
          testID="post-category-list"
          style={styles.list}
          contentContainerStyle={styles.listContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {categories.map((category, index) => (
            <PostCategoryCard
              key={category.id}
              category={category}
              index={index}
              onPress={() => onSelectCategory(category.id)}
            />
          ))}
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: Math.max(bottomInset, Spacing.space4) }]}>
          <Pressable
            testID="post-category-cancel"
            style={styles.cancelButtonWrap}
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="إلغاء"
          >
            <View pointerEvents="none" style={styles.cancelBacking} />
            <GlassSurface
              testID="post-category-cancel-glass"
              variant="capsule"
              borderRadius={PostCategoryTokens.cancelRadius}
              noBorder
            />
            <Text style={styles.cancelLabel}>إلغاء</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}
