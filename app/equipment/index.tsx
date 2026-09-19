import React, { useState } from 'react'
import { View, StyleSheet, StatusBar, InteractionManager } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated from 'react-native-reanimated'

import { Colors } from '../../src/constants/colors'
import { Gradients } from '../../src/constants/gradients'
import { Spacing } from '../../src/constants/spacing'
import { useEquipment, useOperatorsInfinite } from '../../src/hooks/useEquipment'
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav'
import { navigateToEquipmentForm } from '../../src/components/ui/DraftResumePrompt'
import { AnimatedHeroHeader } from '../../src/components/ui/AnimatedHeroHeader'
import { UNIFIED_BOTTOM_BAR_HEIGHT } from '../../src/components/navigation/UnifiedBottomBar'

// Feature Components
import { EquipmentCategoriesGrid } from '../../src/components/equipment/landing/EquipmentCategoriesGrid'
import { EquipmentHorizontalList } from '../../src/components/equipment/landing/EquipmentHorizontalList'
import { OperatorHorizontalList } from '../../src/components/equipment/landing/OperatorHorizontalList'
import { EquipmentHowItWorks } from '../../src/components/equipment/landing/EquipmentHowItWorks'
import { EquipmentBottomBar } from '../../src/components/equipment/EquipmentBottomBar'
import { SectionFooterAction } from '../../src/components/ui/SectionFooterAction'

const MOCK_OPERATORS = [
  {
    id: 'op1',
    title: 'مشغل بلدوزر وجرافة',
    price: 30,
    priceLabel: 'يوم',
    currency: 'ر.ع.',
    governorate: 'الباطنة شمال',
    isVerified: true,
    raw: { operatorType: 'مشغل', experienceYears: 15, equipmentTypes: ['بلدوزر', 'جرافة'] },
  },
  {
    id: 'op2',
    title: 'فني صيانة مولدات كهربائية',
    price: 20,
    priceLabel: 'يوم',
    currency: 'ر.ع.',
    governorate: 'الداخلية',
    raw: { operatorType: 'صيانة', experienceYears: 6, equipmentTypes: ['مولدات', 'كهرباء صناعية'] },
  },
  {
    id: 'op3',
    title: 'فني صيانة معدات هيدروليك',
    price: 8,
    priceLabel: 'ساعة',
    currency: 'ر.ع.',
    governorate: 'مسقط',
    raw: { operatorType: 'فني', experienceYears: 12, equipmentTypes: ['هيدروليك', 'محركات ديزل'] },
  },
  {
    id: 'op4',
    title: 'مشغل رافعة برجية معتمد',
    price: 35,
    priceLabel: 'يوم',
    currency: 'ر.ع.',
    governorate: 'ظفار',
    raw: { operatorType: 'مشغل', experienceYears: 8, equipmentTypes: ['رافعات برجية', 'رافعات متحركة'] },
  },
]

export default function EquipmentLandingScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { scrollHandler, scrollY } = useScrollAwareNav()

  const [loadRest, setLoadRest] = useState(false)
  React.useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setTimeout(() => setLoadRest(true), 150)
    })
    return () => task.cancel()
  }, [])

  // Data fetching logic (Matching Cars & Buses architecture)
  const { data: latestEquipment = [], isLoading: loadingEq } = useEquipment({ limit: 8 })
  const { data: saleEquipment = [], isLoading: loadingSale } = useEquipment(
    { listingType: 'EQUIPMENT_SALE', limit: 8 },
    { enabled: loadRest }
  )
  const { data: rentEquipment = [], isLoading: loadingRent } = useEquipment(
    { listingType: 'EQUIPMENT_RENT', limit: 8 },
    { enabled: loadRest }
  )

  const { data: opData, isLoading: loadingOp } = useOperatorsInfinite()
  const fetchedOperators = opData?.pages.flatMap((p) => p.items)?.slice(0, 8) || []
  const operators = fetchedOperators.length > 0 ? fetchedOperators : (loadingOp ? [] : MOCK_OPERATORS)

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* ═══════════════ ANIMATED STICKY HEADER ═══════════════ */}
      <AnimatedHeroHeader
        scrollY={scrollY}
        gradientColors={Gradients.hero as unknown as string[]}
        title="ســوق ون للمعدات"
        navSearchPlaceholder="ابحث عن معدة أو مشغل..."
        onNavSearchPress={() => router.push('/equipment/browse' as any)}
        heroSearchPlaceholder="عن أي معدة أو مشغل تبحث؟"
        onHeroSearchPress={() => router.push('/equipment/browse' as any)}
        onBackPress={() => {
          if (router.canGoBack()) router.back()
          else router.push('/')
        }}
        headerIcon="notifications-outline"
        onHeaderIconPress={() => router.push('/profile/notifications' as any)}
        primaryCta={{
          label: 'اعرض معدتك',
          icon: 'add',
          onPress: () => navigateToEquipmentForm('push'),
          bgColor: 'rgba(255,255,255,0.2)',
          textColor: Colors.white,
        }}
        outlineCta={{
          label: 'تصفح المعدات',
          icon: 'construct-outline',
          onPress: () => router.push('/equipment/browse' as any),
        }}
      />

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 106 + Spacing.space5,
          paddingBottom: UNIFIED_BOTTOM_BAR_HEIGHT + Math.max(insets.bottom, 12) + 8,
        }}
      >
        <View style={s.content}>
          <EquipmentCategoriesGrid />

          {/* أحدث المعدات */}
          <EquipmentHorizontalList
            title="أحدث المعدات المضافة"
            subTitle="تصفح أحدث عروض وإعلانات المعدات المضافة"
            data={latestEquipment}
            isLoading={loadingEq}
            emptyText="لا توجد معدات مضافة حالياً"
            onSeeAll={() => router.push('/equipment/browse' as any)}
            onPressItem={(item) => router.push(`/equipment/${item.id}` as any)}
          />

          {loadRest && (
            <>
              {/* معدات للبيع */}
              <EquipmentHorizontalList
                title="معدات للبيع"
                subTitle="تصفح أفضل عروض بيع المعدات الثقيلة"
                data={saleEquipment}
                isLoading={loadingSale}
                emptyText="لا توجد معدات للبيع حالياً"
                onSeeAll={() => router.push('/equipment/browse?type=sale' as any)}
                onPressItem={(item) => router.push(`/equipment/${item.id}` as any)}
              />

              {/* معدات للإيجار */}
              <EquipmentHorizontalList
                title="معدات للإيجار"
                subTitle="خيارات تأجير مرنة ومتنوعة يومية وشهرية"
                data={rentEquipment}
                isLoading={loadingRent}
                emptyText="لا توجد معدات للإيجار حالياً"
                onSeeAll={() => router.push('/equipment/browse?type=rental' as any)}
                onPressItem={(item) => router.push(`/equipment/${item.id}` as any)}
              />

              {/* أمهر المشغلين */}
              <OperatorHorizontalList
                title="أمهر المشغلين"
                subTitle="أفضل السائقين والمشغلين المعتمدين لمعداتك"
                data={operators}
                isLoading={loadingOp}
                emptyText="لا يوجد مشغلين مسجلين حالياً"
                onSeeAll={() => router.push('/equipment/operators/browse' as any)}
                onPressItem={(item) => router.push(`/equipment/operators/${item.id}` as any)}
              />
            </>
          )}

          <EquipmentHowItWorks />

          {/* Unified Action Banner & Support Help */}
          <SectionFooterAction
            isLanding
            title="لديك معدة ثقيلة للبيع أو للإيجار؟"
            subtitle="انشر إعلانك الآن ووصل لآلاف المقاولين والشركات في منطقتك"
            buttonText="أضف معدتك"
            iconName="construct-outline"
            onPress={() => navigateToEquipmentForm('push')}
          />
        </View>
      </Animated.ScrollView>

      <EquipmentBottomBar />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FB' },
  content: {
    paddingHorizontal: Spacing.space5,
    gap: 20,
    paddingBottom: 0,
  },
})
