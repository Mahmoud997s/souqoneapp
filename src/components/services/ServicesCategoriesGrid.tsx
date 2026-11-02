import React from 'react'
import type { ImageSourcePropType } from 'react-native'
import { useRouter } from 'expo-router'
import { SERVICE_CATEGORY_ICONS } from '../../constants/serviceCategoryIcons'
import {
  GlassCategoriesGrid,
  GlassCategoryTabItem,
} from '../ui/GlassCategoriesGrid'

interface ServicesLandingCategoryItem {
  id: string
  label: string
  icon: string | ImageSourcePropType
  iconType: 'image' | 'material'
  color?: string
  bg?: string
}

export const SERVICES_LANDING_CATEGORIES: ServicesLandingCategoryItem[] = [
  { id: 'MAINTENANCE', label: 'صيانة', icon: SERVICE_CATEGORY_ICONS.MAINTENANCE, iconType: 'image' },
  { id: 'CLEANING', label: 'غسيل وتلميع', icon: SERVICE_CATEGORY_ICONS.CLEANING, iconType: 'image' },
  { id: 'INSPECTION', label: 'فحص', icon: SERVICE_CATEGORY_ICONS.INSPECTION, iconType: 'image' },
  { id: 'BODYWORK', label: 'سمكرة وصبغ', icon: SERVICE_CATEGORY_ICONS.BODYWORK, iconType: 'image' },
  { id: 'MODIFICATION', label: 'تعديل', icon: SERVICE_CATEGORY_ICONS.MODIFICATION, iconType: 'image' },
  { id: 'TOWING', label: 'ونش وإنقاذ', icon: SERVICE_CATEGORY_ICONS.TOWING, iconType: 'image' },
  { id: 'KEYS_LOCKS', label: 'مفاتيح', icon: SERVICE_CATEGORY_ICONS.KEYS_LOCKS, iconType: 'image' },
  { id: 'ACCESSORIES_INSTALL', label: 'إكسسوارات', icon: SERVICE_CATEGORY_ICONS.ACCESSORIES_INSTALL, iconType: 'image' },
  { id: 'all', label: 'عرض الكل', icon: SERVICE_CATEGORY_ICONS.all, iconType: 'image' },
]

export const ServicesCategoriesGrid = () => {
  const router = useRouter()

  const handlePress = (id: string) => {
    if (id === 'all') {
      router.push('/services/browse' as never)
    } else {
      router.push(`/services/browse?serviceType=${id}` as never)
    }
  }

  const tabs: GlassCategoryTabItem[] = SERVICES_LANDING_CATEGORIES.map((cat) => ({
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
