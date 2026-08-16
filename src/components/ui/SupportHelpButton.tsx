import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '../../constants/spacing';

export interface SupportHelpButtonProps {
  title?: string;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  iconName?: keyof typeof Ionicons.glyphMap;
}

export function SupportHelpButton({
  title = 'تحتاج للمساعدة؟ تواصل مع الدعم الفني',
  onPress,
  style,
  textStyle,
  iconName = 'headset-outline',
}: SupportHelpButtonProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      Linking.openURL('mailto:support@souqone.com').catch(() => {});
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      activeOpacity={0.85}
      onPress={handlePress}
    >
      <Ionicons name={iconName} size={18} color="#ffffff" />
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginHorizontal: Spacing.space4,
    marginTop: Spacing.space2,
    marginBottom: Spacing.space3,
    gap: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 19,
    color: '#ffffff',
    textAlign: 'center',
    writingDirection: 'rtl',
    paddingTop: Platform.OS === 'android' ? 2 : 1,
    includeFontPadding: false,
  },
});
