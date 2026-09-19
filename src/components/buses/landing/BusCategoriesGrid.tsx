import React from 'react'
import { useRouter } from 'expo-router'
import {
  GlassCategoriesGrid,
  GlassCategoryTabItem,
} from '../../ui/GlassCategoriesGrid'

export function BusCategoriesGrid() {
  const router = useRouter()

  const tabs: GlassCategoryTabItem[] = [
    {
      id: 'used',
      label: 'مستعملة',
      icon: 'bus-outline',
      iconBg: '#e0f2fe',
      iconColor: '#0ea5e9',
      onPress: () => router.push('/buses/browse?condition=USED' as any),
    },
    {
      id: 'new',
      label: 'جديدة',
      icon: 'sparkles',
      iconBg: '#d1fae5',
      iconColor: '#10b981',
      onPress: () => router.push('/buses/browse?condition=NEW' as any),
    },
    {
      id: 'contract',
      label: 'بيع بعقد',
      icon: 'document-text-outline',
      iconBg: '#ffedd5',
      iconColor: '#ea580c',
      onPress: () =>
        router.push(
          '/buses/browse?busListingType=BUS_SALE_WITH_CONTRACT' as any
        ),
    },
    {
      id: 'rental',
      label: 'تأجير',
      icon: 'key',
      iconBg: '#fef3c7',
      iconColor: '#f59e0b',
      onPress: () =>
        router.push('/buses/browse?busListingType=BUS_RENT' as any),
    },
    {
      id: 'wanted',
      label: 'مطلوب',
      icon: 'megaphone',
      iconBg: '#ede9fe',
      iconColor: '#8b5cf6',
      onPress: () => router.push('/buses/browse?type=wanted' as any),
    },
  ]

  return <GlassCategoriesGrid items={tabs} />
}
