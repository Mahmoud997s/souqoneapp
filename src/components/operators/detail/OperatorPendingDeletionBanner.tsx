import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { Shadows } from '../../../constants/shadows'
import { RTLText } from '../../../constants/rtl'
import { lineHeightFor } from '../../../constants/typography'
import type { OperatorPendingDeletionView } from '../../../types/operatorDetailViewModel.types'

export interface OperatorPendingDeletionBannerProps {
  pendingDeletion?: OperatorPendingDeletionView | null
  onCancel?: () => void
  busy?: boolean
}

/**
 * OperatorPendingDeletionBanner
 * Banner displayed strictly when the operator listing has a pending deletion request:
 * - Headline: 'طلب حذف قيد المراجعة'
 * - Request timestamp/relative date label
 * - Button: 'إلغاء الطلب' (with loading indicator when busy)
 * - Returns null when pendingDeletion is absent or null
 */
export function OperatorPendingDeletionBanner({
  pendingDeletion,
  onCancel,
  busy = false,
}: OperatorPendingDeletionBannerProps) {
  if (!pendingDeletion) {
    return null
  }

  return (
    <View style={s.banner} testID="operator-pending-deletion-banner">
      <View style={s.infoRow}>
        <Ionicons name="warning-outline" size={22} color={Colors.warning} />
        <View style={s.textCol}>
          <Text style={s.headline} maxFontSizeMultiplier={1.3}>
            طلب حذف قيد المراجعة
          </Text>
          <Text style={s.dateLabel} maxFontSizeMultiplier={1.3} testID="operator-pending-deletion-date">
            تم تقديم الطلب {pendingDeletion.requestedAtLabel}
          </Text>
        </View>
      </View>

      {onCancel && (
        <TouchableOpacity
          style={[s.cancelBtn, busy && s.btnDisabled]}
          onPress={onCancel}
          disabled={busy}
          activeOpacity={0.8}
          testID="operator-cancel-deletion-button"
          accessibilityRole="button"
          accessibilityLabel="إلغاء طلب الحذف"
        >
          {busy ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={s.cancelBtnText} maxFontSizeMultiplier={1.3}>
              إلغاء الطلب
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  banner: {
    marginHorizontal: Spacing.space4,
    marginVertical: Spacing.space2,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.space4,
    borderWidth: 1,
    borderColor: Colors.warning,
    ...Shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space3,
    marginBottom: Spacing.space3,
  },
  textCol: {
    flex: 1,
  },
  headline: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    writingDirection: RTLText.writingDirection,
    lineHeight: lineHeightFor(15),
  },
  dateLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    writingDirection: RTLText.writingDirection,
    lineHeight: lineHeightFor(12),
  },
  cancelBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.space2,
    paddingHorizontal: Spacing.space4,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 44,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    lineHeight: lineHeightFor(13),
  },
})
