import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Radius } from '../../constants/radius';

export interface ActionBannerProps {
  title: string;
  subtitle: string;
  buttonText: string;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  style?: ViewStyle;
  gradientColors?: [string, string, string];
}

export function ActionBanner({
  title,
  subtitle,
  buttonText,
  iconName,
  onPress,
  style,
  gradientColors = ['#0B2447', '#1a3a6b', '#0d3060'],
}: ActionBannerProps) {
  return (
    <View style={[styles.wrapper, style]}>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={onPress}
      >
        <LinearGradient
          colors={gradientColors}
          locations={[0, 0.6, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Grid overlay */}
        <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', pointerEvents: 'none' } as any]}>
          <Svg width="100%" height="100%">
            <Defs>
              <Pattern id="pgrid" width="36" height="36" patternUnits="userSpaceOnUse">
                <Path d="M 36 0 L 0 0 0 36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#pgrid)" />
          </Svg>
        </View>

        {/* Icon */}
        <View style={styles.iconBox}>
          <Ionicons name={iconName} size={22} color="rgba(255,255,255,0.75)" />
        </View>

        {/* Text */}
        <View style={styles.textBlock}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={onPress}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaTxt}>{buttonText}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space2,
    paddingBottom: Spacing.space3,
  },
  card: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 13,
    color: Colors.white,
    marginBottom: 2,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  ctaBtn: {
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginStart: 12,
  },
  ctaTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    color: '#0B2447',
  },
});
