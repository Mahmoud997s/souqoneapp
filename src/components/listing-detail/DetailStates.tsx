import React from 'react'
import { View, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { EmptyState } from '../ui/EmptyState'
import { DetailSkeleton } from './DetailSkeleton'

export type DetailStateKind =
  | 'loading'
  | 'error'
  | 'notFound'
  | 'offline'
  | 'timeout'
  | 'serverError'

export interface DetailStatesProps {
  kind: DetailStateKind
  onRetry?: () => void
  onBack?: () => void
  title?: string
  subtitle?: string
  actionLabel?: string
  secondaryActionLabel?: string
  fallbackReducedMotion?: boolean
}

/**
 * DetailStates
 * Full-page presentational states for loading, error, notFound, offline, timeout, and serverError scenarios.
 * Loading renders DetailSkeleton with accessible label and busy state.
 * Error scenarios reuse EmptyState design primitive with accessible min 44x44 retry controls.
 */
export function DetailStates({
  kind,
  onRetry,
  onBack,
  title,
  subtitle,
  actionLabel,
  secondaryActionLabel,
  fallbackReducedMotion,
}: DetailStatesProps) {
  const handleBack = onBack ?? (() => router.back())

  if (kind === 'loading') {
    return (
      <View
        style={s.loadingRoot}
        testID="detail-state-loading"
        accessibilityLabel="جاري التحميل"
        accessibilityState={{ busy: true }}
      >
        <DetailSkeleton onBack={handleBack} fallbackReducedMotion={fallbackReducedMotion} />
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
          title={title ?? 'الإعلان غير موجود'}
          subtitle={subtitle ?? 'قد يكون تم حذف الإعلان أو أن الرابط غير صحيح أو انتهت صلاحيته.'}
          actionLabel={actionLabel ?? 'الرجوع للرئيسية'}
          onAction={handleBack}
          secondaryActionLabel={onRetry ? (secondaryActionLabel ?? 'إعادة المحاولة') : undefined}
          onSecondaryAction={onRetry}
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
          title={title ?? 'لا يوجد اتصال بالإنترنت'}
          subtitle={subtitle ?? 'يرجى التأكد من اتصال هاتفك بالإنترنت ثم إعادة المحاولة.'}
          actionLabel={onRetry ? (actionLabel ?? 'إعادة المحاولة') : undefined}
          onAction={onRetry}
          secondaryActionLabel={secondaryActionLabel ?? 'الرجوع'}
          onSecondaryAction={handleBack}
        />
      </View>
    )
  }

  if (kind === 'timeout') {
    return (
      <View style={s.centerContainer} testID="detail-state-timeout">
        <EmptyState
          icon="time-outline"
          iconType="ionicons"
          iconColor={Colors.warning}
          title={title ?? 'انتهت مهلة الاتصال'}
          subtitle={subtitle ?? 'استغرق الخادم وقتاً أطول من المعتاد للاستجابة. يرجى إعادة المحاولة.'}
          actionLabel={onRetry ? (actionLabel ?? 'إعادة المحاولة') : undefined}
          onAction={onRetry}
          secondaryActionLabel={secondaryActionLabel ?? 'الرجوع'}
          onSecondaryAction={handleBack}
        />
      </View>
    )
  }

  if (kind === 'serverError') {
    return (
      <View style={s.centerContainer} testID="detail-state-server-error">
        <EmptyState
          icon="server-outline"
          iconType="ionicons"
          iconColor={Colors.error}
          title={title ?? 'خطأ في الخادم'}
          subtitle={subtitle ?? 'حدث خطأ غير متوقع في استجابة الخادم. نعمل على حل المشكلة، يرجى المحاولة مرة أخرى.'}
          actionLabel={onRetry ? (actionLabel ?? 'إعادة المحاولة') : undefined}
          onAction={onRetry}
          secondaryActionLabel={secondaryActionLabel ?? 'الرجوع'}
          onSecondaryAction={handleBack}
        />
      </View>
    )
  }

  return (
    <View style={s.centerContainer} testID="detail-state-error">
      <EmptyState
        icon="alert-circle-outline"
        iconType="ionicons"
        iconColor={Colors.error}
        title={title ?? 'تعذر تحميل الإعلان'}
        subtitle={subtitle ?? 'حدث خطأ غير متوقع أثناء جلب بيانات الإعلان. يرجى المحاولة مرة أخرى.'}
        actionLabel={onRetry ? (actionLabel ?? 'إعادة المحاولة') : undefined}
        onAction={onRetry}
        secondaryActionLabel={secondaryActionLabel ?? 'الرجوع'}
        onSecondaryAction={handleBack}
      />
    </View>
  )
}

const s = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  centerContainer: {
    flex: 1,
    minHeight: 400,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.space6,
    backgroundColor: Colors.surface,
  },
})
