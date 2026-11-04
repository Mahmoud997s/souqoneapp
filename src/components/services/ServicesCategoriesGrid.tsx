import React, { memo, useMemo } from 'react'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { type GlassSupport } from '../navigation/glassSupport'
import {
  GlassCategoriesGrid,
  GlassCategoryTabItem,
} from '../ui/GlassCategoriesGrid'

export interface ServicesLandingCategoryItem {
  id: string
  label: string
  icon: string
  iconType: 'material'
  color?: string
  bg?: string
}

export const SERVICES_LANDING_CATEGORIES: ServicesLandingCategoryItem[] = [
  { id: 'MAINTENANCE', label: 'صيانة', icon: 'wrench', iconType: 'material', color: Colors.primary, bg: Colors.paleMint },
  { id: 'CLEANING', label: 'غسيل وتلميع', icon: 'water', iconType: 'material', color: Colors.primary, bg: Colors.paleMint },
  { id: 'INSPECTION', label: 'فحص', icon: 'magnify', iconType: 'material', color: Colors.primary, bg: Colors.paleMint },
  { id: 'BODYWORK', label: 'سمكرة وصبغ', icon: 'spray', iconType: 'material', color: Colors.primary, bg: Colors.paleMint },
  { id: 'MODIFICATION', label: 'تعديل', icon: 'tune', iconType: 'material', color: Colors.primary, bg: Colors.paleMint },
  { id: 'TOWING', label: 'ونش وإنقاذ', icon: 'tow-truck', iconType: 'material', color: Colors.primary, bg: Colors.paleMint },
  { id: 'KEYS_LOCKS', label: 'مفاتيح', icon: 'key', iconType: 'material', color: Colors.primary, bg: Colors.paleMint },
  { id: 'ACCESSORIES_INSTALL', label: 'إكسسوارات', icon: 'car-shift-pattern', iconType: 'material', color: Colors.primary, bg: Colors.paleMint },
  { id: 'all', label: 'عرض الكل', icon: 'view-grid', iconType: 'material', color: Colors.primary, bg: Colors.paleMint },
]

export const ServicesCategoriesGrid = memo(function ServicesCategoriesGrid({
  support,
}: {
  support?: GlassSupport
} = {}) {
  const router = useRouter()

  const tabs: GlassCategoryTabItem[] = useMemo(
    () =>
      SERVICES_LANDING_CATEGORIES.map((cat) => ({
        id: cat.id,
        label: cat.label,
        icon: cat.icon,
        iconType: cat.iconType,
        iconColor: cat.color,
        iconBg: cat.bg,
        onPress: () => {
          if (cat.id === 'all') {
            router.push('/services/browse' as never)
          } else {
            router.push(`/services/browse?serviceType=${cat.id}` as never)
          }
        },
      })),
    [router]
  )

  return <GlassCategoriesGrid items={tabs} scrollable support={support} />
})
