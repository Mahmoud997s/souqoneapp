import React from 'react'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import {
  GlassCategoriesGrid,
  GlassCategoryTabItem,
} from '../ui/GlassCategoriesGrid'

const CATEGORIES = [
  { id: 'MAINTENANCE', label: 'صيانة', icon: 'wrench', color: '#16a34a', bg: '#dcfce7' },
  { id: 'CLEANING', label: 'غسيل وتلميع', icon: 'water', color: '#2563eb', bg: '#dbeafe' },
  { id: 'INSPECTION', label: 'فحص', icon: 'magnify', color: '#9333ea', bg: '#f3e8ff' },
  { id: 'BODYWORK', label: 'سمكرة وصبغ', icon: 'spray', color: '#ea580c', bg: '#ffedd5' },
  { id: 'MODIFICATION', label: 'تعديل', icon: 'tune', color: '#eab308', bg: '#fef9c3' },
  { id: 'TOWING', label: 'ونش وإنقاذ', icon: 'tow-truck', color: '#dc2626', bg: '#fee2e2' },
  { id: 'KEYS_LOCKS', label: 'مفاتيح', icon: 'key', color: '#0891b2', bg: '#cffafe' },
  { id: 'ACCESSORIES_INSTALL', label: 'إكسسوارات', icon: 'car-shift-pattern', color: '#b45309', bg: '#fef3c7' },
  { id: 'all', label: 'عرض الكل', icon: 'view-grid', color: Colors.primary, bg: '#EFF6FF' },
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
