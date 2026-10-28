import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { lineHeightFor } from '../../constants/typography'

export interface StaleDataBannerProps {
  onRetry: () => void | Promise<unknown>
  isRefetching?: boolean
  message?: string
}

/**
 * StaleDataBanner
 *
 * Pinned banner directly below DetailTopBar indicating that cached data
 * is being displayed because the latest background refetch failed.
 * Fixed height container guarantees zero layout jump.
 */
export function StaleDataBanner({
  onRetry,
  isRefetching = false,
  message = 'تعذر تحديث البيانات، قد تكون المعلومات المعروضة قديمة',
}: StaleDataBannerProps) {
  return (
    <View style={s.container} testID="stale-data-banner">
      <View style={s.contentRow}>
        <Ionicons
          name="cloud-offline-outline"
          size={18}
          color={Colors.warning}
          style={s.icon}
        />
        <Text style={s.messageText} numberOfLines={1}>
          {message}
        </Text>
      </View>

      <TouchableOpacity
        style={s.retryButton}
        onPress={onRetry}
        disabled={isRefetching}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="إعادة المحاولة"
        testID="stale-data-retry-button"
      >
        {isRefetching ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <Text style={s.retryText}>إعادة المحاولة</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    height: 48,
    minHeight: 48,
    maxHeight: 48,
    backgroundColor: Colors.surfaceAlt,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space3,
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    marginEnd: Spacing.space2,
  },
  icon: {
    flexShrink: 0,
  },
  messageText: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  retryButton: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: Spacing.space2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    color: Colors.primary,
    writingDirection: 'rtl',
  },
})
