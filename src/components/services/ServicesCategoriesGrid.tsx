import React, { memo, useMemo } from 'react'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { SERVICE_TYPES } from '../../constants/services'
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
  ...SERVICE_TYPES.map((st) => ({
    id: st.id,
    label: st.label,
    icon: st.materialIcon ?? 'dots-horizontal',
    iconType: 'material' as const,
    color: Colors.primary,
    bg: Colors.paleMint,
  })),
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
