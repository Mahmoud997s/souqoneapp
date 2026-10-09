import React from 'react'
import { useRouter } from 'expo-router'
import { Colors } from '../../../constants/colors'
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
      iconBg: Colors.paleMint,
      iconColor: Colors.primary,
      onPress: () => router.push('/equipment/browse?type=sale' as any),
    },
    {
      id: 'rental',
      label: 'للإيجار',
      icon: 'key',
      iconBg: Colors.paleMint,
      iconColor: Colors.primary,
      onPress: () => router.push('/equipment/browse?type=rental' as any),
    },
    {
      id: 'used',
      label: 'مستعملة',
      icon: 'construct-outline',
      iconBg: Colors.paleMint,
      iconColor: Colors.primary,
      onPress: () => router.push('/equipment/browse?type=used' as any),
    },
    {
      id: 'new',
      label: 'جديدة',
      icon: 'sparkles',
      iconBg: Colors.paleMint,
      iconColor: Colors.primary,
      onPress: () => router.push('/equipment/browse?type=new' as any),
    },
    {
      id: 'operators',
      label: 'المشغلين',
      icon: 'people',
      iconBg: Colors.paleMint,
      iconColor: Colors.primary,
      onPress: () => router.push('/equipment/operators/browse' as any),
    },
  ]

  return <GlassCategoriesGrid items={tabs} />
}

