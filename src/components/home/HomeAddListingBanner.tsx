import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Image } from 'expo-image'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'
import { CardSystem } from '../../constants/cardSystem'
import { TopBarTokens } from '../../constants/topBarTokens'
import { GlassSurface } from '../navigation/glassSupport'
import { HOME_BOTTOM_TOKENS, HOME_LISTING_CATEGORIES } from './homeBottomContent'

export interface HomeAddListingBannerProps {
  onPress: () => void
  testID?: string
}

export function HomeAddListingBanner({ onPress, testID = 'home-add-listing-banner' }: HomeAddListingBannerProps) {
  return (
    <View testID={testID} style={styles.wrapper}>
      <View style={styles.card}>
        <GlassSurface
          testID={testID}
          borderRadius={HOME_BOTTOM_TOKENS.cardRadius}
          intensity={TopBarTokens.blurIntensity}
          tint={TopBarTokens.blurTint}
          washColor={HOME_BOTTOM_TOKENS.glassWashColor}
          washOpacity={0}
        />
        <View pointerEvents="none" style={styles.glassTint} />
        <View style={styles.content}>
          <Text testID={`${testID}-title`} style={styles.title} numberOfLines={HOME_BOTTOM_TOKENS.titleLines}>هل لديك ما تريد بيعه أو تأجيره؟</Text>
          <Text testID={`${testID}-subtitle`} style={styles.subtitle}>انشر إعلانك في أي قسم من الأقسام الخمسة</Text>
          <View testID={`${testID}-categories`} style={styles.categories}>
            {HOME_LISTING_CATEGORIES.map((category) => (
              <View key={category.id} testID={`${testID}-category-${category.id}`} style={styles.category}>
                <Image
                  testID={`${testID}-image-${category.id}`}
                  source={category.image}
                  style={styles.categoryImage}
                  contentFit="contain"
                  accessibilityLabel={category.title}
                />
                <Text style={styles.categoryLabel} numberOfLines={HOME_BOTTOM_TOKENS.categoryLabelLines}>{category.title}</Text>
              </View>
            ))}
          </View>
          <Pressable
            testID={`${testID}-button`}
            accessibilityRole="button"
            accessibilityLabel="أضف إعلانك"
            onPress={onPress}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>أضف إعلانك</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { marginHorizontal: Spacing.space5, marginTop: Spacing.space2 },
  card: {
    position: 'relative', overflow: 'hidden', borderRadius: Radius.lg,
    borderWidth: TopBarTokens.buttonBorderWidth, borderColor: TopBarTokens.buttonBorderColor,
    backgroundColor: Colors.surface, ...CardSystem.styles.softShadow,
  },
  glassTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: HOME_BOTTOM_TOKENS.glassWashColor,
    opacity: HOME_BOTTOM_TOKENS.glassWashOpacity,
  },
  content: { padding: Spacing.space4, alignItems: 'stretch' },
  title: {
    fontFamily: 'Almarai_800ExtraBold', fontSize: HOME_BOTTOM_TOKENS.bannerTitleFontSize,
    lineHeight: HOME_BOTTOM_TOKENS.bannerTitleLineHeight,
    color: Colors.text, textAlign: 'left', writingDirection: 'rtl',
  },
  subtitle: {
    marginTop: Spacing.space1, fontFamily: 'Almarai_400Regular',
    fontSize: HOME_BOTTOM_TOKENS.bannerSubtitleFontSize,
    lineHeight: HOME_BOTTOM_TOKENS.bannerSubtitleLineHeight,
    color: Colors.textMuted, textAlign: 'left', writingDirection: 'rtl',
  },
  categories: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.space3 },
  category: { flex: 1, alignItems: 'center', minWidth: 0, gap: Spacing.space1 },
  categoryImage: { width: HOME_BOTTOM_TOKENS.categoryImageSize, height: HOME_BOTTOM_TOKENS.categoryImageSize },
  categoryLabel: {
    width: '100%', fontFamily: 'Almarai_700Bold',
    fontSize: HOME_BOTTOM_TOKENS.categoryLabelFontSize,
    lineHeight: HOME_BOTTOM_TOKENS.categoryLabelLineHeight,
    color: Colors.text, textAlign: 'center', writingDirection: 'rtl',
  },
  button: {
    minHeight: Spacing.touch, marginTop: Spacing.space3, paddingHorizontal: Spacing.space4,
    borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  buttonPressed: { backgroundColor: Colors.primaryDark },
  buttonText: {
    fontFamily: 'Almarai_800ExtraBold', fontSize: HOME_BOTTOM_TOKENS.buttonFontSize,
    lineHeight: HOME_BOTTOM_TOKENS.buttonLineHeight,
    color: Colors.white, textAlign: 'center', writingDirection: 'rtl',
  },
})
