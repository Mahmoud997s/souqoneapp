import React, { memo, useMemo } from 'react'
import { useRouter } from 'expo-router'
import { Colors } from '../../../constants/colors'
import { type GlassSupport } from '../../navigation/glassSupport'
import {
  GlassCategoriesGrid,
  GlassCategoryTabItem,
} from '../../ui/GlassCategoriesGrid'

export const BusCategoriesGrid = memo(function BusCategoriesGrid({
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
        onPress: () => router.push('/buses/browse?condition=NEW' as any),
      },
      {
        id: 'used',
        label: 'مستعملة',
        icon: 'bus-outline',
        iconBg: Colors.paleMint,
        iconColor: Colors.primary,
        onPress: () => router.push('/buses/browse?condition=USED' as any),
      },
      {
        id: 'contract',
        label: 'بيع بعقد',
        icon: 'document-text-outline',
        iconBg: Colors.paleMint,
        iconColor: Colors.primary,
        onPress: () =>
          router.push(
            '/buses/browse?busListingType=BUS_SALE_WITH_CONTRACT' as any
          ),
      },
      {
        id: 'rental',
        label: 'تأجير',
        icon: 'key',
        iconBg: Colors.paleMint,
        iconColor: Colors.primary,
        onPress: () =>
          router.push('/buses/browse?busListingType=BUS_RENT' as any),
      },
      {
        id: 'wanted',
        label: 'مطلوب',
        icon: 'megaphone',
        iconBg: Colors.paleMint,
        iconColor: Colors.primary,
        onPress: () => router.push('/buses/browse?type=wanted' as any),
      },
    ],
    [router]
  )

  return <GlassCategoriesGrid items={tabs} support={support} />
})

