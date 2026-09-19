import React from 'react'
import { useRouter } from 'expo-router'
import {
  GlassCategoriesGrid,
  GlassCategoryTabItem,
} from '../ui/GlassCategoriesGrid'

export const CategoriesGrid = () => {
  const router = useRouter()

  const tabs: GlassCategoryTabItem[] = [
    {
      id: 'used',
      label: 'مستعملة',
      icon: 'car-sport',
      iconBg: '#e0f2fe',
      iconColor: '#0ea5e9',
      onPress: () => router.push('/cars/browse?type=used' as any),
    },
    {
      id: 'new',
      label: 'جديدة',
      icon: 'sparkles',
      iconBg: '#d1fae5',
      iconColor: '#10b981',
      onPress: () => router.push('/cars/browse?type=new' as any),
    },
    {
      id: 'wanted',
      label: 'مطلوب',
      icon: 'megaphone',
      iconBg: '#ede9fe',
      iconColor: '#8b5cf6',
      onPress: () => router.push('/cars/browse?type=wanted' as any),
    },
    {
      id: 'rental',
      label: 'تأجير',
      icon: 'key',
      iconBg: '#fef3c7',
      iconColor: '#f59e0b',
      onPress: () => router.push('/cars/browse?type=rental' as any),
    },
  ]

  return <GlassCategoriesGrid items={tabs} />
}
