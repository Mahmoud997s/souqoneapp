import type { OwnerActionId } from '../../components/listing-detail/OwnerManageBar'

/**
 * Maps owner listing action IDs to short D-366 Section 4 Arabic success toast titles.
 */
export function resolveOwnerActionSuccessToastTitle(
  actionId: OwnerActionId
): string {
  switch (actionId) {
    case 'delete':
      return 'تم حذف الإعلان'
    case 'pause':
    case 'archive':
    case 'stopSearch':
      return 'تم إيقاف الإعلان'
    case 'restore':
      return 'تم تفعيل الإعلان'
    case 'submit':
      return 'تم تجديد الإعلان'
    case 'markSold':
      return 'تم تحديد الإعلان كمباع'
    case 'markRented':
      return 'تم تحديد الإعلان كمؤجر'
    default:
      return 'تم حفظ التعديلات'
  }
}
