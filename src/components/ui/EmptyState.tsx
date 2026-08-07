import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Radius } from '../../constants/radius';

export interface EmptyStateProps {
  icon?: string;
  iconType?: 'ionicons' | 'material-community' | 'feather';
  iconSize?: number;
  iconColor?: string;
  customIcon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

export function EmptyState({
  icon = 'search-outline',
  iconType = 'ionicons',
  iconSize = 36,
  iconColor = Colors.primary,
  customIcon,
  title,
  subtitle,
  actionLabel,
  onAction,
  actionIcon,
  secondaryActionLabel,
  onSecondaryAction,
  style,
  compact = false,
}: EmptyStateProps) {
  const renderIcon = () => {
    if (customIcon) return customIcon;

    if (iconType === 'material-community') {
      return (
        <MaterialCommunityIcons
          name={icon as any}
          size={iconSize}
          color={iconColor}
        />
      );
    }

    if (iconType === 'feather') {
      return (
        <Feather
          name={icon as any}
          size={iconSize}
          color={iconColor}
        />
      );
    }

    return (
      <Ionicons
        name={icon as any}
        size={iconSize}
        color={iconColor}
      />
    );
  };

  return (
    <View style={[styles.container, compact && styles.compactContainer, style]}>
      {/* Icon Bubble */}
      <View style={[styles.iconCircle, compact && styles.compactIconCircle]}>
        {renderIcon()}
      </View>

      {/* Title */}
      <Text style={[styles.title, compact && styles.compactTitle]}>
        {title}
      </Text>

      {/* Subtitle */}
      {subtitle ? (
        <Text style={[styles.subtitle, compact && styles.compactSubtitle]}>
          {subtitle}
        </Text>
      ) : null}

      {/* Actions */}
      {(actionLabel && onAction) || (secondaryActionLabel && onSecondaryAction) ? (
        <View style={styles.actionsRow}>
          {actionLabel && onAction && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={onAction}
              activeOpacity={0.8}
            >
              {actionIcon && (
                <Ionicons
                  name={actionIcon as any}
                  size={16}
                  color={Colors.white}
                  style={styles.btnIcon}
                />
              )}
              <Text style={styles.primaryBtnText}>{actionLabel}</Text>
            </TouchableOpacity>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={onSecondaryAction}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryBtnText}>{secondaryActionLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: Spacing.space4,
  },
  compactContainer: {
    paddingVertical: 24,
    paddingHorizontal: Spacing.space3,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space3,
  },
  compactIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: Spacing.space2,
  },
  title: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.space1,
    writingDirection: 'rtl',
  },
  compactTitle: {
    fontSize: 14,
  },
  subtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 290,
    writingDirection: 'rtl',
  },
  compactSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 240,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.space2,
    marginTop: Spacing.space4,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.space4,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    gap: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryBtnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: Colors.white,
    writingDirection: 'rtl',
  },
  btnIcon: {
    marginEnd: 2,
  },
  secondaryBtn: {
    paddingHorizontal: Spacing.space3,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  secondaryBtnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: Colors.textMuted,
    writingDirection: 'rtl',
  },
});
