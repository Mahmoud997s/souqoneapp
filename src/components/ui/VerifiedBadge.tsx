import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Svg, { Polygon, Path } from 'react-native-svg';
import { Colors } from '../../constants/colors';

export interface VerifiedBadgeProps {
  /** حجم رمز الختم الثماني بالبكسل (الافتراضي: 13) */
  size?: number;
  /** إظهار النص المرفق «موثق» بجوار الختم (الافتراضي: false) */
  showText?: boolean;
  /** نص مخصص للتوثيق (الافتراضي: "موثق") */
  text?: string;
  /** نمط المظهر: 'dark' للمظهر الملكي الداكن الفاخر، أو 'mint' للخلفية النعناعية الهادئة */
  variant?: 'dark' | 'mint';
  /** ستايل إضافي للحاوية */
  style?: StyleProp<ViewStyle>;
}

/**
 * شارة التوثيق الملكية الحصرية (Royal Octagram Seal)
 * تصميم هندسي مستوحى من التراث العماني والإسلامي (نجمة ثمانية الأضلاع)
 * بديل احترافي فاخر لشكل الكبسولة والدائرة التقليديتين، يتبع باليتة Minimal Green بنسبة 100%.
 */
export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 13,
  showText = false,
  text = 'موثق',
  variant = 'dark',
  style,
}) => {
  const isDark = variant === 'dark';

  // ألوان الختم والنص حسب النمط المختار من باليتة الفيروزي والكحلي الرسمية
  const starFill = Colors.primary;
  const checkStroke = '#FFFFFF';
  const textColor = isDark ? Colors.paleMint : Colors.primary;

  // رسم الختم الثماني الهندسي (8-Pointed Star) مع علامة توثيق حادة بالداخل
  const renderOctagramSeal = (emblemSize: number) => (
    <Svg
      width={emblemSize}
      height={emblemSize}
      viewBox="0 0 24 24"
      fill="none"
      accessibilityRole="image"
      accessibilityLabel={text}
    >
      {/* مضلع النجمة الثمانية المتناظرة هندسياً */}
      <Polygon
        points="12,1 14.9,5.1 19.8,4.2 18.9,9.1 23,12 18.9,14.9 19.8,19.8 14.9,18.9 12,23 9.1,18.9 4.2,19.8 5.1,14.9 1,12 5.1,9.1 4.2,4.2 9.1,5.1"
        fill={starFill}
      />
      {/* علامة الصح الحادة في منتصف الختم */}
      <Path
        d="M7.8 12.2L10.6 15.0L16.5 8.5"
        stroke={checkStroke}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  if (!showText) {
    return (
      <View style={[s.emblemOnly, style]}>
        {renderOctagramSeal(size)}
      </View>
    );
  }

  return (
    <View
      style={[
        s.container,
        isDark ? s.containerDark : s.containerMint,
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={text}
    >
      {renderOctagramSeal(size)}
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
    // زوايا هندسية مستقيمة معمارية راقية بدون أي شكل كبسولي أو بيضاوي
    borderRadius: 4,
    borderWidth: 1,
  },
  containerDark: {
    backgroundColor: Colors.primaryDark, // #192435
    borderColor: 'rgba(0, 156, 181, 0.35)', // لمسة فيروزية ناعمة
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  containerMint: {
    backgroundColor: Colors.paleMint, // #ECF8FA
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
