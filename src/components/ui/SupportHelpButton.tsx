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
import { SUPPORT_MAILTO } from '../../constants/support';
import { toastService } from '../../store/toastStore';

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
      Linking.openURL(SUPPORT_MAILTO).catch(() => {
        toastService.show({ kind: 'error', title: 'تعذر فتح تطبيق البريد' });
      });
    }
  };

  const isOutline = variant === 'outline';
  const isSubtle = variant === 'subtle';

  let iconColor: string = Colors.white;
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
      accessibilityRole="button"
      accessibilityLabel={title}
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
    backgroundColor: Colors.slateHeading,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: Radius.lg || 14,
    marginHorizontal: Spacing.space4,
    marginTop: Spacing.space2,
    marginBottom: Spacing.space3,
    gap: 8,
    shadowColor: Colors.slateHeading,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonOutline: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.slateBorder,
    shadowColor: Colors.slateHeading,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  buttonSubtle: {
    backgroundColor: Colors.slateSubtleBg,
    borderWidth: 1,
    borderColor: Colors.slateBorder,
    elevation: 0,
    shadowOpacity: 0,
  },
  text: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.white,
    textAlign: 'center',
    writingDirection: 'rtl',
    paddingTop: Platform.OS === 'android' ? 2 : 1,
    includeFontPadding: false,
  },
  textOutline: {
    color: Colors.slateDark,
  },
  textSubtle: {
    color: Colors.text2,
  },
});
