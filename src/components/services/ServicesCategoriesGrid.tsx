import React from 'react'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import {
  GlassCategoriesGrid,
  GlassCategoryTabItem,
} from '../ui/GlassCategoriesGrid'

const CATEGORIES = [
  { id: 'MAINTENANCE', label: 'صيانة', icon: 'wrench', color: Colors.primary, bg: Colors.paleMint },
  { id: 'CLEANING', label: 'غسيل وتلميع', icon: 'water', color: Colors.primary, bg: Colors.paleMint },
  { id: 'INSPECTION', label: 'فحص', icon: 'magnify', color: Colors.primary, bg: Colors.paleMint },
  { id: 'BODYWORK', label: 'سمكرة وصبغ', icon: 'spray', color: Colors.primary, bg: Colors.paleMint },
  { id: 'MODIFICATION', label: 'تعديل', icon: 'tune', color: Colors.primary, bg: Colors.paleMint },
  { id: 'TOWING', label: 'ونش وإنقاذ', icon: 'tow-truck', color: Colors.primary, bg: Colors.paleMint },
  { id: 'KEYS_LOCKS', label: 'مفاتيح', icon: 'key', color: Colors.primary, bg: Colors.paleMint },
  { id: 'ACCESSORIES_INSTALL', label: 'إكسسوارات', icon: 'car-shift-pattern', color: Colors.primary, bg: Colors.paleMint },
  { id: 'all', label: 'عرض الكل', icon: 'view-grid', color: Colors.primary, bg: Colors.paleMint },
]

export const ServicesCategoriesGrid = () => {
  const router = useRouter()

  const handlePress = (id: string) => {
    if (id === 'all') {
      router.push('/services/browse' as any)
    } else {
      router.push(`/services/browse?serviceType=${id}` as any)
    }
  }

  const tabs: GlassCategoryTabItem[] = CATEGORIES.map((cat) => ({
    id: cat.id,
    label: cat.label,
    icon: cat.icon,
    iconType: 'material',
    iconColor: cat.color,
    iconBg: cat.bg,
    onPress: () => handlePress(cat.id),
  }))

  return <GlassCategoriesGrid items={tabs} scrollable />
}
