import React from 'react'
import type { ImageSourcePropType } from 'react-native'
import { useRouter } from 'expo-router'
import { PART_CATEGORY_ICONS } from '../../constants/partCategoryIcons'
import {
  GlassCategoriesGrid,
  GlassCategoryTabItem,
} from '../ui/GlassCategoriesGrid'

interface PartsLandingCategoryItem {
  id: string
  label: string
  icon: string | ImageSourcePropType
  iconType: 'image' | 'material'
  color?: string
  bg?: string
}

export const PARTS_LANDING_CATEGORIES: PartsLandingCategoryItem[] = [
  { id: 'ENGINE', label: 'المحرك', icon: PART_CATEGORY_ICONS.ENGINE, iconType: 'image' },
  { id: 'BODY', label: 'الهيكل', icon: PART_CATEGORY_ICONS.BODY, iconType: 'image' },
  { id: 'ELECTRICAL', label: 'الكهرباء', icon: PART_CATEGORY_ICONS.ELECTRICAL, iconType: 'image' },
  { id: 'SUSPENSION', label: 'المساعدات والتعليق', icon: PART_CATEGORY_ICONS.SUSPENSION, iconType: 'image' },
  { id: 'BRAKES', label: 'الفرامل', icon: PART_CATEGORY_ICONS.BRAKES, iconType: 'image' },
  { id: 'INTERIOR', label: 'الداخلية', icon: PART_CATEGORY_ICONS.INTERIOR, iconType: 'image' },
  { id: 'TIRES', label: 'الإطارات', icon: PART_CATEGORY_ICONS.TIRES, iconType: 'image' },
  { id: 'BATTERIES', label: 'البطاريات', icon: PART_CATEGORY_ICONS.BATTERIES, iconType: 'image' },
  { id: 'OILS', label: 'الزيوت', icon: PART_CATEGORY_ICONS.OILS, iconType: 'image' },
  { id: 'ACCESSORIES', label: 'إكسسوارات', icon: PART_CATEGORY_ICONS.ACCESSORIES, iconType: 'image' },
  { id: 'all', label: 'عرض الكل', icon: PART_CATEGORY_ICONS.all, iconType: 'image' },
]

export const PartsCategoriesGrid = () => {
  const router = useRouter()

  const handlePress = (id: string) => {
    if (id === 'all') {
      router.push('/parts/browse' as never)
    } else {
      router.push(`/parts/browse?category=${id}` as never)
    }
  }

  const tabs: GlassCategoryTabItem[] = PARTS_LANDING_CATEGORIES.map((cat) => ({
    id: cat.id,
    label: cat.label,
    icon: cat.icon,
    iconType: cat.iconType,
    iconColor: cat.color,
    iconBg: cat.bg,
    onPress: () => handlePress(cat.id),
  }))

  return <GlassCategoriesGrid items={tabs} scrollable />
}
