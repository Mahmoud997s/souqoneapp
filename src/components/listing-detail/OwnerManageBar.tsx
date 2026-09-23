import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { BlurView } from 'expo-blur'
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
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
  variant?: 'inline' | 'sticky'
  actions: {
    id: OwnerActionId
    label: string
    tone: 'primary' | 'danger' | 'neutral'
    icon: string
  }[]
  viewCount: number
  busy: boolean
  onAction: (id: OwnerActionId) => void
  /** Required when variant='sticky' — Reanimated shared scroll value */
  scrollY?: SharedValue<number>
  /** Scroll position (px) at which the sticky bar fully appears */
  threshold?: number
}

/**
 * OwnerManageBar
 * Management toolbar for the listing owner.
 * Displays view count statistics and actionable buttons (edit, delete, change status).
 */
export function OwnerManageBar({
  variant = 'inline',
  actions,
  viewCount,
  busy,
  onAction,
  scrollY,
  threshold = 300,
}: OwnerManageBarProps) {
  const insets = useSafeAreaInsets()

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

  // Scroll-aware animation for sticky variant
  const animatedStickyStyle = useAnimatedStyle(() => {
    if (!scrollY) {
      return { opacity: 1, transform: [{ translateY: 0 }] }
    }
    const opacity = interpolate(
      scrollY.value,
      [threshold - 50, threshold],
      [0, 1],
      Extrapolation.CLAMP
    )
    const translateY = interpolate(
      scrollY.value,
      [threshold - 50, threshold],
      [24, 0],
      Extrapolation.CLAMP
    )
    return {
      opacity,
      transform: [{ translateY }],
      pointerEvents: scrollY.value >= threshold - 30 ? 'auto' : 'none',
    }
  })

  // For sticky variant: show only the primary/most essential actions (max 3)
  const stickyActions = actions.filter((a) =>
    ['edit', 'markSold', 'markRented', 'activate', 'delete'].includes(a.id)
  )

  // ── STICKY VARIANT ──────────────────────────────────────────────────────────
  if (variant === 'sticky') {
    return (
      <Animated.View
        style={[
          s.stickyWrapper,
          { bottom: Math.max(insets.bottom, 12) },
          animatedStickyStyle,
        ]}
        pointerEvents="box-none"
      >
        <BlurView
          intensity={70}
          tint="light"
          blurMethod="dimezisBlurView"
          style={s.stickyCard}
        >
          {/* Owner badge */}
          <View style={s.stickyOwnerBadge}>
            <Ionicons name="shield-checkmark-outline" size={13} color={Colors.primary} />
            <Text style={s.stickyOwnerText}>إعلانك</Text>
          </View>

          {/* Quick action buttons */}
          <View style={s.stickyActionsRow}>
            {stickyActions.map((action) => {
              const styles = getButtonStyles(action.tone)
              return (
                <TouchableOpacity
                  key={action.id}
                  style={[s.button, styles.btn, busy && s.disabledButton]}
                  onPress={() => onAction(action.id)}
                  disabled={busy}
                  activeOpacity={0.75}
                  testID={`btn-owner-sticky-${action.id}`}
                >
                  {busy ? (
                    <ActivityIndicator size="small" color={styles.iconColor} />
                  ) : (
                    <>
                      <Ionicons
                        name={action.icon as any}
                        size={15}
                        color={styles.iconColor}
                      />
                      <Text style={[s.buttonText, styles.text]}>{action.label}</Text>
                    </>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        </BlurView>
      </Animated.View>
    )
  }

  // ── INLINE VARIANT (default) ────────────────────────────────────────────────
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
  viewCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primary + '12',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  viewCountText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    color: Colors.primary,
  },
  ownerNotice: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
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
    lineHeight: 16,
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

  // ── STICKY variant styles ──────────────────────────────────────────────────
  stickyWrapper: {
    position: 'absolute',
    left: Spacing.space4,
    right: Spacing.space4,
    zIndex: 90,
  },
  stickyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.80)',
    paddingHorizontal: Spacing.space3,
    paddingVertical: Spacing.space2 + 2,
    borderRadius: Radius.xl,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.75)',
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
    backgroundColor: Colors.primary + '14',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    flexShrink: 0,
  },
  stickyOwnerText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.primary,
  },
  stickyActionsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
  },
})
