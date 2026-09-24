import React from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { EmptyState } from '../ui/EmptyState'
import { lineHeightFor } from '../../constants/typography'

export interface DetailStatesProps {
  kind: 'loading' | 'error' | 'notFound' | 'offline'
  onRetry?: () => void
  onBack: () => void
}

/**
 * DetailStates
 * Full-page presentational states for loading, error, notFound, and offline scenarios.
 * Reuses existing EmptyState design primitive.
 */
export function DetailStates({ kind, onRetry, onBack }: DetailStatesProps) {
  if (kind === 'loading') {
    return (
      <View style={s.centerContainer} testID="detail-state-loading">
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={s.loadingText}>جارٍ تحميل تفاصيل الإعلان...</Text>
      </View>
    )
  }

  if (kind === 'error') {
    return (
      <View style={s.centerContainer} testID="detail-state-error">
        <EmptyState
          icon="alert-circle-outline"
          iconType="ionicons"
          iconColor={Colors.error}
          title="تعذر تحميل الإعلان"
          subtitle="حدث خطأ غير متوقع أثناء جلب بيانات الإعلان. يرجى المحاولة مرة أخرى."
          actionLabel="إعادة المحاولة"
          onAction={onRetry}
          secondaryActionLabel="الرجوع"
          onSecondaryAction={onBack}
        />
      </View>
    )
  }

  if (kind === 'notFound') {
    return (
      <View style={s.centerContainer} testID="detail-state-not-found">
        <EmptyState
          icon="car-outline"
          iconType="ionicons"
          iconColor={Colors.textMuted}
          title="الإعلان غير موجود"
          subtitle="قد يكون تم حذف الإعلان أو أن الرابط غير صحيح أو انتهت صلاحيته."
          actionLabel="الرجوع للرئيسية"
          onAction={onBack}
        />
      </View>
    )
  }

  if (kind === 'offline') {
    return (
      <View style={s.centerContainer} testID="detail-state-offline">
        <EmptyState
          icon="cloud-offline-outline"
          iconType="ionicons"
          iconColor={Colors.warning}
          title="لا يوجد اتصال بالإنترنت"
          subtitle="يرجى التأكد من اتصال هاتفك بالإنترنت ثم إعادة المحاولة."
          actionLabel="إعادة المحاولة"
          onAction={onRetry}
          secondaryActionLabel="الرجوع"
          onSecondaryAction={onBack}
        />
      </View>
    )
  }

  return null
}

const s = StyleSheet.create({
  centerContainer: {
    flex: 1,
    minHeight: 400,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.space6,
    backgroundColor: Colors.surface,
  },
  loadingText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    color: Colors.text2,
    marginTop: Spacing.space3,
  },
})
