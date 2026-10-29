import { getDetailErrorKind, DetailErrorKind } from './listing-detail/getDetailErrorKind'
import { Colors } from '../constants/colors'

export interface ListErrorProps {
  kind: DetailErrorKind
  icon: string
  iconColor: string
  title: string
  subtitle: string
  actionLabel: string
}

/**
 * Maps any error thrown during list screen fetching (Favorites, My Listings)
 * into unified, user-friendly copy and icons matching the DetailStates design tokens.
 */
export function getListErrorProps(
  error: unknown,
  fallbackTitle: string = 'تعذر تحميل البيانات'
): ListErrorProps {
  const kind = getDetailErrorKind(error)

  if (kind === 'offline') {
    return {
      kind,
      icon: 'cloud-offline-outline',
      iconColor: Colors.warning,
      title: 'لا يوجد اتصال بالإنترنت',
      subtitle: 'يرجى التأكد من اتصال هاتفك بالإنترنت ثم إعادة المحاولة.',
      actionLabel: 'إعادة المحاولة',
    }
  }

  if (kind === 'timeout') {
    return {
      kind,
      icon: 'time-outline',
      iconColor: Colors.warning,
      title: 'انتهت مهلة الاتصال',
      subtitle: 'استغرق الخادم وقتاً أطول من المعتاد للاستجابة. يرجى إعادة المحاولة.',
      actionLabel: 'إعادة المحاولة',
    }
  }

  if (kind === 'serverError') {
    return {
      kind,
      icon: 'server-outline',
      iconColor: Colors.error,
      title: 'خطأ في الخادم',
      subtitle: 'حدث خطأ غير متوقع في استجابة الخادم. نعمل على حل المشكلة، يرجى المحاولة مرة أخرى.',
      actionLabel: 'إعادة المحاولة',
    }
  }

  return {
    kind,
    icon: 'alert-circle-outline',
    iconColor: Colors.error,
    title: fallbackTitle,
    subtitle: 'حدث خطأ غير متوقع أثناء جلب البيانات. يرجى المحاولة مرة أخرى.',
    actionLabel: 'إعادة المحاولة',
  }
}
