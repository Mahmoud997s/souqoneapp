import React from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'

export type OwnerCardBusyAction = 'delete' | 'edit' | 'status' | 'cancelDeletion' | null

export interface OwnerCardActionsProps {
  isEditSupported: boolean
  canChangeStatus?: boolean
  pendingDeletionRequest?: {
    id: string
    createdAt: string
    status: string
  }
  busyAction?: OwnerCardBusyAction
  onEdit: () => void
  onDelete: () => void
  onStatusChange?: () => void
  onCancelDeletionRequest?: () => void
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

/**
 * Pure owner action footer rendered inside the unified card's `ownerActions` slot
 * (below the price pill, off the image).
 */
export function OwnerCardActions({
  isEditSupported,
  canChangeStatus = false,
  pendingDeletionRequest,
  busyAction = null,
  onEdit,
  onDelete,
  onStatusChange,
  onCancelDeletionRequest,
}: OwnerCardActionsProps) {
  const isBusy = busyAction !== null

  if (pendingDeletionRequest && pendingDeletionRequest.status === 'PENDING') {
    const createdAtMs = new Date(pendingDeletionRequest.createdAt).getTime()
    const isUnder24Hours = Number.isFinite(createdAtMs)
      ? Date.now() - createdAtMs < TWENTY_FOUR_HOURS_MS
      : false

    return (
      <View style={s.pendingWrap} testID="owner-card-pending-deletion">
        <View style={s.pendingBanner} testID="owner-card-pending-deletion-banner">
          <Ionicons name="time-outline" size={14} color={Colors.white} />
          <Text style={s.pendingBannerText}>طلب حذف قيد المراجعة</Text>
        </View>

        {isUnder24Hours ? (
          <TouchableOpacity
            testID="owner-card-cancel-deletion-btn"
            style={[s.pendingActionBtn, s.cancelDeletionBtn, isBusy && s.btnDisabled]}
            activeOpacity={0.8}
            disabled={isBusy}
            onPress={onCancelDeletionRequest}
            accessibilityRole="button"
            accessibilityLabel="إلغاء طلب الحذف"
          >
            {busyAction === 'cancelDeletion' ? (
              <ActivityIndicator size="small" color={Colors.error} />
            ) : (
              <Text style={s.cancelDeletionTxt}>إلغاء طلب الحذف</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={[s.pendingActionBtn, s.lockedReviewBtn]} testID="owner-card-locked-review">
            <Text style={s.lockedReviewTxt}>قيد مراجعة الإدارة</Text>
          </View>
        )}
      </View>
    )
  }

  return (
    <View style={s.row} testID="owner-card-actions">
      {isEditSupported && (
        <TouchableOpacity
          testID="owner-card-edit-btn"
          style={[s.btn, s.neutralBtn, isBusy && s.btnDisabled]}
          activeOpacity={0.8}
          disabled={isBusy}
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel="تعديل الإعلان"
        >
          {busyAction === 'edit' ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <>
              <Ionicons name="pencil" size={15} color={Colors.primary} />
              <Text style={[s.btnText, s.neutralText]}>تعديل</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {canChangeStatus && onStatusChange && (
        <TouchableOpacity
          testID="owner-card-status-btn"
          style={[s.btn, s.neutralBtn, isBusy && s.btnDisabled]}
          activeOpacity={0.8}
          disabled={isBusy}
          onPress={onStatusChange}
          accessibilityRole="button"
          accessibilityLabel="خيارات الإعلان"
        >
          {busyAction === 'status' ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <>
              <Ionicons name="ellipsis-vertical" size={15} color={Colors.primary} />
              <Text style={[s.btnText, s.neutralText]}>الحالة</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        testID="owner-card-delete-btn"
        style={[s.btn, s.dangerBtn, isBusy && s.btnDisabled]}
        activeOpacity={0.8}
        disabled={isBusy}
        onPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel="حذف الإعلان"
      >
        {busyAction === 'delete' ? (
          <ActivityIndicator size="small" color={Colors.error} />
        ) : (
          <>
            <Ionicons name="trash" size={15} color={Colors.error} />
            <Text style={[s.btnText, s.dangerText]}>حذف</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    width: '100%',
  },
  btn: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: Spacing.space2,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  neutralBtn: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  dangerBtn: {
    backgroundColor: Colors.errorSoftBg,
    borderColor: Colors.error,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  neutralText: {
    color: Colors.primary,
  },
  dangerText: {
    color: Colors.error,
  },
  pendingWrap: {
    width: '100%',
    gap: Spacing.space2,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.error,
    paddingVertical: 6,
    paddingHorizontal: Spacing.space3,
    borderRadius: Radius.md,
  },
  pendingBannerText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 17,
    color: Colors.white,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  pendingActionBtn: {
    minHeight: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.space3,
  },
  cancelDeletionBtn: {
    backgroundColor: Colors.white,
    borderColor: Colors.error,
  },
  cancelDeletionTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 17,
    color: Colors.error,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  lockedReviewBtn: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
  },
  lockedReviewTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
})
