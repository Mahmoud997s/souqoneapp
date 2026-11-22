import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Shadows } from '../../constants/shadows'
import { lineHeightFor } from '../../constants/typography'
import { toastService } from '../../store/toastStore'
import { BottomBarTokens } from '../../constants/bottomBarTokens'
import { GlassSurface } from '../navigation/GlassSurface'
import type { GlassSupport } from '../navigation/glassCapability'

export const OWNER_MANAGE_BAR_HEIGHT = 60.4

const STATUS_OPTION_CONFIRM_DELAY_MS = 400

// Canonical owner action IDs across Cars, Buses, Equipment, and Operators
export type OwnerActionId =
  | 'edit'
  | 'delete'
  | 'markSold'
  | 'markRented'
  | 'archive'
  | 'pause'       // RENTAL "إيقاف مؤقت"
  | 'stopSearch'  // WANTED "إيقاف البحث"
  | 'restore'
  | 'submit'

export interface OwnerAction {
  id: OwnerActionId
  label: string
  tone: 'primary' | 'danger' | 'neutral'
  icon: string
  requiresConfirm: boolean
  confirmTitle?: string
  confirmMessage?: string
  confirmLabel?: string
}

export type OwnerBusyAction = OwnerActionId | 'manageStatus' | null

export interface OwnerManageBarProps {
  variant?: 'inline' | 'sticky'
  actions: {
    id: OwnerActionId
    label: string
    tone: 'primary' | 'danger' | 'neutral'
    icon: string
  }[]
  /** @deprecated D-385: view count is now shown publicly in the detail header (D-384); kept optional for untouched callers. */
  viewCount?: number
  busy?: boolean
  busyAction?: OwnerBusyAction
  onAction: (id: OwnerActionId) => void
  support?: GlassSupport
}

/**
 * OwnerManageBar
 * Management toolbar for the listing owner.
 * Displays view count statistics and actionable buttons (edit, delete, change status).
 */
export function OwnerManageBar({
  variant = 'inline',
  actions,
  busy = false,
  busyAction,
  onAction,
  support,
}: OwnerManageBarProps) {
  const insets = useSafeAreaInsets()
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current)
        statusTimeoutRef.current = null
      }
    }
  }, [])

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

  const editAction = actions.find((a) => a.id === 'edit')
  const deleteAction = actions.find((a) => a.id === 'delete')
  const statusActions = actions.filter(
    (a) => a.id !== 'edit' && a.id !== 'delete'
  )

  const isAnyBusy = busyAction !== undefined ? busyAction !== null : busy
  const isActionBusy = (id: OwnerActionId): boolean =>
    busyAction !== undefined ? busyAction === id : busy
  const isManageStatusBusy =
    busyAction !== undefined
      ? busyAction === 'manageStatus' || statusActions.some((a) => a.id === busyAction)
      : busy

  const handleManageStatusPress = () => {
    if (isAnyBusy || statusActions.length === 0) return
    toastService.showActionSheet({
      title: 'إدارة حالة الإعلان',
      options: statusActions.map((a) => ({
        text: a.label,
        icon: a.icon,
        onPress: () => {
          if (!isMountedRef.current) return
          if (statusTimeoutRef.current) {
            clearTimeout(statusTimeoutRef.current)
          }
          statusTimeoutRef.current = setTimeout(() => {
            statusTimeoutRef.current = null
            if (!isMountedRef.current) return
            onAction(a.id)
          }, STATUS_OPTION_CONFIRM_DELAY_MS)
        },
      })),
    })
  }

  const renderStickyActionButton = (action: {
    id: OwnerActionId
    label: string
    tone: 'primary' | 'danger' | 'neutral'
    icon: string
  }) => {
    const styles = getButtonStyles(action.tone)
    const buttonBusy = isActionBusy(action.id)
    return (
      <TouchableOpacity
        key={action.id}
        style={[s.button, styles.btn, isAnyBusy && s.disabledButton]}
        onPress={() => {
          if (!isAnyBusy) onAction(action.id)
        }}
        disabled={isAnyBusy}
        activeOpacity={0.75}
        testID={`btn-owner-${action.id}`}
      >
        {buttonBusy ? (
          <ActivityIndicator
            size="small"
            color={styles.iconColor}
            testID={`btn-owner-${action.id}-spinner`}
          />
        ) : (
          <>
            <Ionicons
              name={action.icon as keyof typeof Ionicons.glyphMap}
              size={15}
              color={styles.iconColor}
            />
            <Text style={[s.buttonText, styles.text]} numberOfLines={1}>
              {action.label}
            </Text>
          </>
        )}
      </TouchableOpacity>
    )
  }

  // ── STICKY VARIANT ──────────────────────────────────────────────────────────
  if (variant === 'sticky') {
    const neutralStyles = getButtonStyles('neutral')
    return (
      <View
        style={[
          s.stickyWrapper,
          { bottom: Math.max(insets.bottom, 12) },
        ]}
        pointerEvents="box-none"
      >
        <View style={s.stickyCard}>
          <GlassSurface
            testID="owner-manage-bar"
            variant="surface"
            borderRadius={Radius.xl}
            noBorder
            intensity={70}
            washColor={BottomBarTokens.stickyCardWashBg}
            support={support}
          />
          {/* Owner badge */}
          <View style={s.stickyOwnerBadge}>
            <Ionicons name="shield-checkmark-outline" size={13} color={Colors.primary} />
            <Text style={s.stickyOwnerText}>إعلانك</Text>
          </View>

          {/* Quick action buttons: edit · manage-status · delete */}
          <View style={s.stickyActionsRow}>
            {editAction ? renderStickyActionButton(editAction) : null}
            {statusActions.length > 0 ? (
              <TouchableOpacity
                style={[s.button, neutralStyles.btn, isAnyBusy && s.disabledButton]}
                onPress={handleManageStatusPress}
                disabled={isAnyBusy}
                activeOpacity={0.75}
                testID="btn-owner-manage-status"
              >
                {isManageStatusBusy ? (
                  <ActivityIndicator
                    size="small"
                    color={neutralStyles.iconColor}
                    testID="btn-owner-manage-status-spinner"
                  />
                ) : (
                  <>
                    <Ionicons
                      name="options-outline"
                      size={15}
                      color={neutralStyles.iconColor}
                    />
                    <Text
                      style={[s.buttonText, neutralStyles.text]}
                      numberOfLines={1}
                    >
                      إدارة الحالة
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}
            {deleteAction ? renderStickyActionButton(deleteAction) : null}
          </View>
        </View>
      </View>
    )
  }

  // ── INLINE VARIANT (default) ────────────────────────────────────────────────
  return (
    <View style={s.container}>
      {/* Owner Notice Header (view count badge removed in D-385; shown publicly in detail header) */}
      <View style={s.statsHeader}>
        <Text style={s.ownerNotice}>أنت مالك هذا الإعلان</Text>
      </View>

      {/* Action Buttons */}
      <View style={s.actionsRow}>
        {actions.map((action) => {
          const styles = getButtonStyles(action.tone)
          const buttonBusy = isActionBusy(action.id)
          return (
            <TouchableOpacity
              key={action.id}
              style={[s.button, styles.btn, isAnyBusy && s.disabledButton]}
              onPress={() => {
                if (!isAnyBusy) onAction(action.id)
              }}
              disabled={isAnyBusy}
              activeOpacity={0.75}
              testID={`btn-owner-${action.id}`}
            >
              {buttonBusy ? (
                <ActivityIndicator
                  size="small"
                  color={styles.iconColor}
                  testID={`btn-owner-${action.id}-spinner`}
                />
              ) : (
                <>
                  <Ionicons
                    name={action.icon as keyof typeof Ionicons.glyphMap}
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
  // ── INLINE styles ──────────────────────────────────────────────────────────
  container: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.space3,
    marginHorizontal: Spacing.space4,
    marginVertical: Spacing.space2,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space2,
    paddingBottom: Spacing.space2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  ownerNotice: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
    color: Colors.textMuted,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
  },
  button: {
    flex: 1,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    gap: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    color: Colors.white,
  },
  dangerButton: {
    backgroundColor: Colors.errorSoftBg,
    borderWidth: 1,
    borderColor: Colors.errorHex40,
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

  // ── STICKY variant styles ──────────────────────────────────────────────────
  stickyWrapper: {
    position: 'absolute',
    left: Spacing.space4,
    right: Spacing.space4,
    zIndex: 90,
  },
  stickyCard: {
    backgroundColor: 'transparent',
    paddingHorizontal: Spacing.space3,
    paddingVertical: Spacing.space2 + 2,
    borderRadius: Radius.xl,
    borderWidth: 1.2,
    borderColor: Colors.whiteAlpha75,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    ...Shadows.floating,
  },
  stickyOwnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryHex14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    flexShrink: 0,
  },
  stickyOwnerText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
    color: Colors.primary,
  },
  stickyActionsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
  },
})
