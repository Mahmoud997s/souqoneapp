import React, { memo, useMemo } from 'react'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
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
  { id: 'ENGINE', label: 'المحرك', icon: 'engine', iconType: 'material', color: Colors.primary, bg: Colors.paleMint },
  { id: 'BODY', label: 'الهيكل', icon: 'car-side', iconType: 'material', color: Colors.primary, bg: Colors.paleMint },
  { id: 'ELECTRICAL', label: 'الكهرباء', icon: 'car-electric', iconType: 'material', color: Colors.primary, bg: Colors.paleMint },
  { id: 'SUSPENSION', label: 'المساعدات والتعليق', icon: 'car-esp', iconType: 'material', color: Colors.primary, bg: Colors.paleMint },
  { id: 'BRAKES', label: 'الفرامل', icon: 'car-brake-alert', iconType: 'material', color: Colors.primary, bg: Colors.paleMint },
  { id: 'INTERIOR', label: 'الداخلية', icon: 'car-seat', iconType: 'material', color: Colors.primary, bg: Colors.paleMint },
  { id: 'TIRES', label: 'الإطارات', icon: 'tire', iconType: 'material', color: Colors.primary, bg: Colors.paleMint },
  { id: 'BATTERIES', label: 'البطاريات', icon: 'car-battery', iconType: 'material', color: Colors.primary, bg: Colors.paleMint },
  { id: 'OILS', label: 'الزيوت', icon: 'oil', iconType: 'material', color: Colors.primary, bg: Colors.paleMint },
  { id: 'ACCESSORIES', label: 'إكسسوارات', icon: 'car-cog', iconType: 'material', color: Colors.primary, bg: Colors.paleMint },
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
