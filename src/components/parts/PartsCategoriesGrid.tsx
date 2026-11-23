import React, { memo, useMemo } from 'react'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { PART_CATEGORIES } from '../../constants/parts'
import { type GlassSupport } from '../navigation/glassSupport'
import {
  GlassCategoriesGrid,
  GlassCategoryTabItem,
} from '../ui/GlassCategoriesGrid'

export interface PartsLandingCategoryItem {
  id: string
  label: string
  icon: string
  iconType: 'material'
  color?: string
  bg?: string
}

export const PARTS_LANDING_CATEGORIES: PartsLandingCategoryItem[] = [
  ...PART_CATEGORIES.map((cat) => ({
    id: cat.id,
    label: cat.label,
    icon: cat.icon ?? 'dots-horizontal',
    iconType: 'material' as const,
    color: Colors.primary,
    bg: Colors.paleMint,
  })),
  { id: 'all', label: 'عرض الكل', icon: 'view-grid', iconType: 'material', color: Colors.primary, bg: Colors.paleMint },
]

export const PartsCategoriesGrid = memo(function PartsCategoriesGrid({
  support,
}: {
  support?: GlassSupport
} = {}) {
  const router = useRouter()

  const tabs: GlassCategoryTabItem[] = useMemo(
    () =>
      PARTS_LANDING_CATEGORIES.map((cat) => ({
        id: cat.id,
        label: cat.label,
        icon: cat.icon,
        iconType: cat.iconType,
        iconColor: cat.color,
        iconBg: cat.bg,
        onPress: () => {
          if (cat.id === 'all') {
            router.push('/parts/browse' as never)
          } else {
            router.push(`/parts/browse?category=${cat.id}` as never)
          }
        },
      })),
    [router]
  )

  return <GlassCategoriesGrid items={tabs} scrollable support={support} />
})
