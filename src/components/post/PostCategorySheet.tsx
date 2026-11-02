import React, { useMemo } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
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
  const rows = useMemo(() => {
    const result: PostCategoryOption[][] = []
    for (let index = 0; index < categories.length; index += PostCategoryTokens.columns) {
      result.push(categories.slice(index, index + PostCategoryTokens.columns))
    }
    return result
  }, [categories])

  return (
    <View style={[styles.container, { paddingTop: Math.max(topInset, Spacing.space6) }]}>
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

      <View style={styles.handleWrap}>
        <View style={styles.handle} />
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>ما الذي تود نشره؟</Text>
        <Text style={styles.subtitle}>اختر القسم المناسب لإعلانك للبدء</Text>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {rows.map((row, rowIndex) => {
          const isCentered = row.length === 1
          return (
            <View
              key={row.map((category) => category.id).join('-')}
              testID={isCentered ? 'post-category-parts-row' : undefined}
              style={isCentered ? styles.centeredRow : styles.row}
            >
              {row.map((category, categoryIndex) => (
                <PostCategoryCard
                  key={category.id}
                  category={category}
                  index={rowIndex * PostCategoryTokens.columns + categoryIndex}
                  onPress={() => onSelectCategory(category.id)}
                />
              ))}
            </View>
          )
        })}
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
  )
}
