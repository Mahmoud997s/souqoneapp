import React from 'react'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
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
      iconBg: Colors.paleMint,
      iconColor: Colors.primary,
      onPress: () => router.push('/cars/browse?type=used' as any),
    },
    {
      id: 'new',
      label: 'جديدة',
      icon: 'sparkles',
      iconBg: Colors.paleMint,
      iconColor: Colors.primary,
      onPress: () => router.push('/cars/browse?type=new' as any),
    },
    {
      id: 'wanted',
      label: 'مطلوب',
      icon: 'megaphone',
      iconBg: Colors.paleMint,
      iconColor: Colors.primary,
      onPress: () => router.push('/cars/browse?type=wanted' as any),
    },
    {
      id: 'rental',
      label: 'تأجير',
      icon: 'key',
      iconBg: Colors.paleMint,
      iconColor: Colors.primary,
      onPress: () => router.push('/cars/browse?type=rental' as any),
    },
  ]

  return <GlassCategoriesGrid items={tabs} />
}

