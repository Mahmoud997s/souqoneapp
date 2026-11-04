import React, { memo, useMemo } from 'react'
import { useRouter } from 'expo-router'
import { Colors } from '../../../constants/colors'
import { type GlassSupport } from '../../navigation/glassSupport'
import {
  GlassCategoriesGrid,
  GlassCategoryTabItem,
} from '../../ui/GlassCategoriesGrid'

export const EquipmentCategoriesGrid = memo(function EquipmentCategoriesGrid({
  support,
}: {
  support?: GlassSupport
} = {}) {
  const router = useRouter()

  const tabs: GlassCategoryTabItem[] = useMemo(
    () => [
      {
        id: 'new',
        label: 'جديدة',
        icon: 'sparkles',
        iconBg: Colors.paleMint,
        iconColor: Colors.primary,
        onPress: () => router.push('/equipment/browse?type=new' as any),
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
        id: 'operators',
        label: 'المشغلين',
        icon: 'people',
        iconBg: Colors.paleMint,
        iconColor: Colors.primary,
        onPress: () => router.push('/equipment/operators/browse' as any),
      },
    ],
    [router]
  )

  return <GlassCategoriesGrid items={tabs} support={support} />
})

