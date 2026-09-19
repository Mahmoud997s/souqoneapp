import React from 'react'
import {
  BrowseEmptyState as UIBrowseEmptyState,
  BrowseEmptyStateProps,
} from '../ui/BrowseEmptyState'

export function BrowseEmptyState(props: BrowseEmptyStateProps) {
  return (
    <UIBrowseEmptyState
      iconName="car-outline"
      emptyTitle="لا توجد سيارات مطابقة"
      emptySubtitle="جرب تغيير الفلاتر أو كلمة البحث للعثور على نتائج أخرى"
      errorText="حدث خطأ أثناء تحميل إعلانات السيارات"
      {...props}
    />
  )
}
