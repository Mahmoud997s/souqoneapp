import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Shadows } from '../../constants/shadows'

export type OwnerActionId =
  | 'edit'
  | 'delete'
  | 'markSold'
  | 'markRented'
  | 'activate'
  | 'archive'

export interface OwnerManageBarProps {
  actions: {
    id: OwnerActionId
    label: string
    tone: 'primary' | 'danger' | 'neutral'
    icon: string
  }[]
  viewCount: number
  busy: boolean
  onAction: (id: OwnerActionId) => void
}

/**
 * OwnerManageBar
 * Management toolbar for the listing owner.
 * Displays view count statistics and actionable buttons (edit, delete, change status).
 */
export function OwnerManageBar({
  actions,
  viewCount,
  busy,
  onAction,
}: OwnerManageBarProps) {
  const getButtonStyles = (tone: 'primary' | 'danger' | 'neutral') => {
    switch (tone) {
      case 'primary':
        return {
          btn: s.primaryButton,
          text: s.primaryButtonText,
          iconColor: Colors.white,
        }
      case 'danger':
        return {
          btn: s.dangerButton,
          text: s.dangerButtonText,
          iconColor: Colors.error,
        }
      case 'neutral':
      default:
        return {
          btn: s.neutralButton,
          text: s.neutralButtonText,
          iconColor: Colors.text,
        }
    }
  }

  return (
    <View style={s.container}>
      {/* Stats Bar */}
      <View style={s.statsHeader}>
        <View style={s.viewCountBadge}>
          <Ionicons name="eye-outline" size={16} color={Colors.primary} />
          <Text style={s.viewCountText}>{viewCount.toLocaleString()} مشاهدة</Text>
        </View>
        <Text style={s.ownerNotice}>أنت مالك هذا الإعلان</Text>
      </View>

      {/* Action Buttons */}
      <View style={s.actionsRow}>
        {actions.map((action) => {
          const styles = getButtonStyles(action.tone)
          return (
            <TouchableOpacity
              key={action.id}
              style={[s.button, styles.btn, busy && s.disabledButton]}
              onPress={() => onAction(action.id)}
              disabled={busy}
              activeOpacity={0.75}
              testID={`btn-owner-${action.id}`}
            >
              {busy ? (
                <ActivityIndicator size="small" color={styles.iconColor} />
              ) : (
                <>
                  <Ionicons
                    name={action.icon as any}
                    size={16}
                    color={styles.iconColor}
                  />
                  <Text style={[s.buttonText, styles.text]}>{action.label}</Text>
                </>
              )}
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.space4,
    marginHorizontal: Spacing.space4,
    marginVertical: Spacing.space3,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space3,
    paddingBottom: Spacing.space2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  viewCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary + '12',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  viewCountText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: Colors.primary,
  },
  ownerNotice: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
  },
  button: {
    flex: 1,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    gap: 6,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    color: Colors.white,
  },
  dangerButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  dangerButtonText: {
    color: Colors.error,
  },
  neutralButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  neutralButtonText: {
    color: Colors.text,
  },
})
