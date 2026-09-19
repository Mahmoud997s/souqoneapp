import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Linking,
  Platform,
  StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Radius } from '../../constants/radius';

export interface SupportHelpButtonProps {
  title?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  iconName?: keyof typeof Ionicons.glyphMap;
  variant?: 'dark' | 'outline' | 'subtle';
}

export function SupportHelpButton({
  title = 'تحتاج للمساعدة؟ تواصل مع الدعم الفني',
  onPress,
  style,
  textStyle,
  iconName = 'headset-outline',
  variant = 'dark',
}: SupportHelpButtonProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      Linking.openURL('mailto:support@souqone.com').catch(() => {});
    }
  };

  const isOutline = variant === 'outline';
  const isSubtle = variant === 'subtle';

  let iconColor = '#ffffff';
  if (isOutline || isSubtle) {
    iconColor = Colors.primary;
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isOutline && styles.buttonOutline,
        isSubtle && styles.buttonSubtle,
        style,
      ]}
      activeOpacity={0.85}
      onPress={handlePress}
    >
      <Ionicons name={iconName} size={18} color={iconColor} />
      <Text
        style={[
          styles.text,
          isOutline && styles.textOutline,
          isSubtle && styles.textSubtle,
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: Radius.lg || 14,
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
  buttonOutline: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  buttonSubtle: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 0,
    shadowOpacity: 0,
  },
  text: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 18,
    color: '#ffffff',
    textAlign: 'center',
    writingDirection: 'rtl',
    paddingTop: Platform.OS === 'android' ? 2 : 1,
    includeFontPadding: false,
  },
  textOutline: {
    color: '#1e293b',
  },
  textSubtle: {
    color: Colors.text2,
  },
});
