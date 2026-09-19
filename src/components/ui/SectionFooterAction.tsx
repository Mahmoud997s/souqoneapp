import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActionBanner } from './ActionBanner';
import { SupportHelpButton } from './SupportHelpButton';
import { Spacing } from '../../constants/spacing';

export interface SectionFooterActionProps {
  title: string;
  subtitle: string;
  buttonText: string;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  gradientColors?: [string, string, string];
  isLanding?: boolean;
  supportTitle?: string;
  onSupportPress?: () => void;
  style?: StyleProp<ViewStyle>;
  bannerStyle?: StyleProp<ViewStyle>;
  supportStyle?: StyleProp<ViewStyle>;
}

export function SectionFooterAction({
  title,
  subtitle,
  buttonText,
  iconName,
  onPress,
  gradientColors,
  isLanding = false,
  supportTitle = 'تحتاج للمساعدة؟ تواصل مع الدعم الفني',
  onSupportPress,
  style,
  bannerStyle,
  supportStyle,
}: SectionFooterActionProps) {
  return (
    <View style={[styles.wrapper, isLanding && styles.wrapperLanding, style]}>
      <ActionBanner
        title={title}
        subtitle={subtitle}
        buttonText={buttonText}
        iconName={iconName}
        onPress={onPress}
        gradientColors={gradientColors}
        style={isLanding ? [styles.bannerLanding, bannerStyle] : bannerStyle}
      />
      <SupportHelpButton
        title={supportTitle}
        variant="outline"
        onPress={onSupportPress}
        style={[
          isLanding ? styles.supportLanding : styles.supportBrowse,
          supportStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  wrapperLanding: {
    marginTop: Spacing.space1,
  },
  bannerLanding: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: Spacing.space3,
  },
  supportBrowse: {
    marginHorizontal: Spacing.space4,
    marginTop: 0,
    marginBottom: Spacing.space4,
  },
  supportLanding: {
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: Spacing.space2,
  },
});
