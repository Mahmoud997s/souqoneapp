import React from 'react'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import {
  GlassCategoriesGrid,
  GlassCategoryTabItem,
} from '../ui/GlassCategoriesGrid'

const CATEGORIES = [
  { id: 'ENGINE', label: 'المحرك', icon: 'engine', color: Colors.primary, bg: Colors.paleMint },
  { id: 'BODY', label: 'الهيكل', icon: 'car-side', color: Colors.primary, bg: Colors.paleMint },
  { id: 'ELECTRICAL', label: 'الكهرباء', icon: 'car-electric', color: Colors.primary, bg: Colors.paleMint },
  { id: 'SUSPENSION', label: 'المساعدات والتعليق', icon: 'car-esp', color: Colors.primary, bg: Colors.paleMint },
  { id: 'BRAKES', label: 'الفرامل', icon: 'car-brake-alert', color: Colors.primary, bg: Colors.paleMint },
  { id: 'INTERIOR', label: 'الداخلية', icon: 'car-seat', color: Colors.primary, bg: Colors.paleMint },
  { id: 'TIRES', label: 'الإطارات', icon: 'tire', color: Colors.primary, bg: Colors.paleMint },
  { id: 'BATTERIES', label: 'البطاريات', icon: 'car-battery', color: Colors.primary, bg: Colors.paleMint },
  { id: 'OILS', label: 'الزيوت', icon: 'oil', color: Colors.primary, bg: Colors.paleMint },
  { id: 'all', label: 'عرض الكل', icon: 'view-grid', color: Colors.primary, bg: Colors.paleMint },
]

export const PartsCategoriesGrid = () => {
  const router = useRouter()

  const handlePress = (id: string) => {
    if (id === 'all') {
      router.push('/parts/browse' as any)
    } else {
      router.push(`/parts/browse?category=${id}` as any)
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
