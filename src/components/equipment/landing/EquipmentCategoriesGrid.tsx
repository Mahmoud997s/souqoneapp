import React from 'react'
import { useRouter } from 'expo-router'
import {
  GlassCategoriesGrid,
  GlassCategoryTabItem,
} from '../../ui/GlassCategoriesGrid'

export function EquipmentCategoriesGrid() {
  const router = useRouter()

  const tabs: GlassCategoryTabItem[] = [
    {
      id: 'sale',
      label: 'للبيع',
      icon: 'cube-outline',
      iconBg: '#e0f2fe',
      iconColor: '#0ea5e9',
      onPress: () => router.push('/equipment/browse?type=sale' as any),
    },
    {
      id: 'rental',
      label: 'للإيجار',
      icon: 'key',
      iconBg: '#d1fae5',
      iconColor: '#10b981',
      onPress: () => router.push('/equipment/browse?type=rental' as any),
    },
    {
      id: 'used',
      label: 'مستعملة',
      icon: 'construct-outline',
      iconBg: '#ffedd5',
      iconColor: '#ea580c',
      onPress: () => router.push('/equipment/browse?type=used' as any),
    },
    {
      id: 'new',
      label: 'جديدة',
      icon: 'sparkles',
      iconBg: '#fef3c7',
      iconColor: '#f59e0b',
      onPress: () => router.push('/equipment/browse?type=new' as any),
    },
    {
      id: 'operators',
      label: 'المشغلين',
      icon: 'people',
      iconBg: '#ede9fe',
      iconColor: '#8b5cf6',
      onPress: () => router.push('/equipment/operators/browse' as any),
    },
  ]

  return <GlassCategoriesGrid items={tabs} />
}
