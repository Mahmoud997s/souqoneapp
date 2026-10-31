import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Polygon, Path } from 'react-native-svg';
import { Colors } from '../../constants/colors';

export const VERIFIED_BADGE_3D = require('../../../assets/images/verified-badge-3d.png');

export interface VerifiedBadgeProps {
  /** حجم رمز الختم بالبكسل (الافتراضي: 16) */
  size?: number;
  /** إظهار النص المرفق «موثق» بجوار الختم (الافتراضي: false) */
  showText?: boolean;
  /** نص مخصص للتوثيق (الافتراضي: "موثق") */
  text?: string;
  /** نمط المظهر: 'dark' للمظهر الملكي الداكن الفاخر، أو 'mint' للخلفية النعناعية الهادئة، أو 'pure' بدون إطار/خلفية */
  variant?: 'dark' | 'mint' | 'pure';
  /** ستايل إضافي للحاوية */
  style?: StyleProp<ViewStyle>;
  /** تفعيل الأيقونة ثلاثية الأبعاد الفاخرة (الافتراضي: true) */
  use3d?: boolean;
  /** testID لاختبارات Jest والـ accessibility */
  testID?: string;
}

/**
 * شارة التوثيق الملكية الفاخرة (3D Royal Octagram Badge)
 * تصميم مجسم ثلاثي الأبعاد حصري (Royal Octagram Seal) بنمط معدني زجاجي فيروزي مع علامة توثيق فضية ناصعة.
 * يدعم وضع 3D عالي الدقة مع إمكانية التبديل إلى رسم SVG الهندسي كـ fallback.
 */
export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 16,
  showText = false,
  text = 'موثق',
  variant = 'dark',
  style,
  use3d = true,
  testID,
}) => {
  const isDark = variant === 'dark';
  const isPure = variant === 'pure';

  const starFill = Colors.primary;
  const checkStroke = '#FFFFFF';
  const textColor = isDark ? Colors.paleMint : Colors.primary;

  const renderIcon = (emblemSize: number) => {
    if (use3d) {
      return (
        <Image
          source={VERIFIED_BADGE_3D}
          style={{ width: emblemSize, height: emblemSize }}
          contentFit="contain"
          accessibilityRole="image"
          accessibilityLabel={text}
          testID="verified-badge-3d-image"
        />
      );
    }

    return (
      <Svg
        width={emblemSize}
        height={emblemSize}
        viewBox="0 0 24 24"
        fill="none"
        accessibilityRole="image"
        accessibilityLabel={text}
        testID="verified-badge-svg"
      >
        <Polygon
          points="12,1 14.9,5.1 19.8,4.2 18.9,9.1 23,12 18.9,14.9 19.8,19.8 14.9,18.9 12,23 9.1,18.9 4.2,19.8 5.1,14.9 1,12 5.1,9.1 4.2,4.2 9.1,5.1"
          fill={starFill}
        />
        <Path
          d="M7.8 12.2L10.6 15.0L16.5 8.5"
          stroke={checkStroke}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  };

  if (!showText) {
    return (
      <View style={[s.emblemOnly, style]} testID={testID}>
        {renderIcon(size)}
      </View>
    );
  }

  return (
    <View
      style={[
        s.container,
        !isPure && (isDark ? s.containerDark : s.containerMint),
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={text}
      testID={testID}
    >
      {renderIcon(size)}
      <Text style={[s.text, { color: textColor }]}>
        {text}
      </Text>
    </View>
  );
};

const s = StyleSheet.create({
  emblemOnly: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    paddingHorizontal: 6.5,
    paddingVertical: 2.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  containerDark: {
    backgroundColor: Colors.primaryDark,
    borderColor: 'rgba(0, 156, 181, 0.35)',
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  containerMint: {
    backgroundColor: Colors.paleMint,
    borderColor: Colors.border,
  },
  text: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 9.5,
    lineHeight: 13.5,
    writingDirection: 'rtl',
    includeFontPadding: false,
    letterSpacing: 0.2,
  },
});

export default VerifiedBadge;
