import React, { useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  BackHandler,
  StyleProp,
  ViewStyle,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { AppButton } from '../ui/AppButton'

export interface PublishSuccessAction {
  label: string
  onPress: () => void
  testID?: string
}

export interface PublishSuccessViewProps {
  title?: string
  subtitle?: string
  primaryAction: PublishSuccessAction
  secondaryAction?: PublishSuccessAction
  tertiaryAction?: PublishSuccessAction
  onHardwareBack?: () => boolean | void
  style?: StyleProp<ViewStyle>
  testID?: string
}

/**
 * Standardized Publish Success View (D-216 F07).
 * Reusable full-screen success presentation for post creation and edit wizards.
 */
export function PublishSuccessView({
  title = 'تم نشر إعلانك بنجاح!',
  subtitle = 'إعلانك متاح الآن للمشترين في سوق ون بسلطنة عُمان. يمكنك متابعة المشاهدات والرسائل من لوحة تحكمك.',
  primaryAction,
  secondaryAction,
  tertiaryAction,
  onHardwareBack,
  style,
  testID = 'publish-success-view',
}: PublishSuccessViewProps) {
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (onHardwareBack) {
          const handled = onHardwareBack()
          if (handled) return true
        }
        if (secondaryAction?.onPress) {
          secondaryAction.onPress()
          return true
        }
        if (primaryAction.onPress) {
          primaryAction.onPress()
          return true
        }
        return false
      }
    )

    return () => subscription.remove()
  }, [onHardwareBack, primaryAction, secondaryAction])

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.content}>
        <View style={styles.iconCircle} testID="publish-success-icon">
          <Ionicons name="checkmark-sharp" size={48} color={Colors.primary} />
        </View>

        <Text style={styles.title} testID="publish-success-title">
          {title}
        </Text>

        {Boolean(subtitle) && (
          <Text style={styles.subtitle} testID="publish-success-subtitle">
            {subtitle}
          </Text>
        )}

        <View style={styles.actionsWrapper}>
          <AppButton
            variant="primary"
            title={primaryAction.label}
            onPress={primaryAction.onPress}
            testID={primaryAction.testID ?? 'publish-success-primary-btn'}
            style={styles.actionBtn}
          />

          {secondaryAction && (
            <AppButton
              variant="outline"
              title={secondaryAction.label}
              onPress={secondaryAction.onPress}
              testID={secondaryAction.testID ?? 'publish-success-secondary-btn'}
              style={styles.actionBtn}
            />
          )}

          {tertiaryAction && (
            <AppButton
              variant="ghost"
              title={tertiaryAction.label}
              onPress={tertiaryAction.onPress}
              testID={tertiaryAction.testID ?? 'publish-success-tertiary-btn'}
              style={styles.actionBtn}
            />
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.space4,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.space6,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: Radius.pill,
    backgroundColor: '#E0F2FE',
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: Spacing.space2,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
    maxWidth: 320,
    marginBottom: Spacing.space6,
  },
  actionsWrapper: {
    width: '100%',
    flexDirection: 'column',
    gap: Spacing.space3,
    paddingHorizontal: Spacing.space2,
  },
  actionBtn: {
    width: '100%',
    minHeight: 48,
  },
})
