import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  InteractionManager,
} from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated from 'react-native-reanimated'

import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { useEquipment, useOperatorsInfinite } from '../../src/hooks/useEquipment'
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav'

import { EquipmentCategoriesGrid } from '../../src/components/equipment/EquipmentCategoriesGrid'
import { EquipmentPromoBanners } from '../../src/components/equipment/EquipmentPromoBanners'
import { EquipmentHorizontalList } from '../../src/components/equipment/EquipmentHorizontalList'
import { EquipmentHowItWorks } from '../../src/components/equipment/EquipmentHowItWorks'
import { EquipmentBottomBar } from '../../src/components/equipment/EquipmentBottomBar'
import { SupportHelpButton } from '../../src/components/ui/SupportHelpButton'
import { UnifiedCard } from '../../src/components/cards/UnifiedCard'
import { EquipCard } from '../../src/components/cards/EquipCard'
import { OperatorCard } from '../../src/components/cards/OperatorCard'

import { AnimatedHeroHeader } from '../../src/components/ui/AnimatedHeroHeader'

const MOCK_OPERATORS = [
  {
    id: 'op1',
    title: 'مشغل بلدوزر وجرافة',
    price: 30, priceLabel: 'يوم', currency: 'ر.ع.',
    governorate: 'الباطنة شمال',
    isVerified: true,
    raw: { operatorType: 'مشغل', experienceYears: 15, equipmentTypes: ['بلدوزر', 'جرافة'] }
  },
  {
    id: 'op2',
    title: 'فني صيانة مولدات كهربائية',
    price: 20, priceLabel: 'يوم', currency: 'ر.ع.',
    governorate: 'الداخلية',
    raw: { operatorType: 'صيانة', experienceYears: 6, equipmentTypes: ['مولدات', 'كهرباء صناعية'] }
  },
  {
    id: 'op3',
    title: 'فني صيانة معدات هيدروليك',
    price: 8, priceLabel: 'ساعة', currency: 'ر.ع.',
    governorate: 'مسقط',
    raw: { operatorType: 'فني', experienceYears: 12, equipmentTypes: ['هيدروليك', 'محركات ديزل'] }
  },
  {
    id: 'op4',
    title: 'مشغل رافعة برجية معتمد',
    price: 35, priceLabel: 'يوم', currency: 'ر.ع.',
    governorate: 'ظفار',
    raw: { operatorType: 'مشغل', experienceYears: 8, equipmentTypes: ['رافعات برجية', 'رافعات متحركة'] }
  },
]

const EQUIPMENT_TYPES = [
  { id: 'excavator', title: 'حفارة', icon: 'excavator', family: 'MCI', color: '#f59e0b' },
  { id: 'crane', title: 'رافعة', icon: 'crane', family: 'MCI', color: '#3b82f6' },
  { id: 'loader', title: 'لودر', icon: 'tractor', family: 'MCI', color: '#22c55e' },
  { id: 'bulldozer', title: 'بلدوزر', icon: 'bulldozer', family: 'MCI', color: '#14b8a6' },
  { id: 'forklift', title: 'رافعة شوكية', icon: 'forklift', family: 'MCI', color: '#8b5cf6' },
  { id: 'mixer', title: 'خلاطة', icon: 'cement', family: 'MCI', color: '#f43f5e' },
  { id: 'generator', title: 'مولد', icon: 'flash', family: 'Ionicons', color: '#f59e0b' },
  { id: 'compressor', title: 'ضاغط', icon: 'air-filter', family: 'MCI', color: '#3b82f6' },
  { id: 'truck', title: 'شاحنة', icon: 'truck-outline', family: 'MCI', color: '#8b5cf6' },
  { id: 'dump_truck', title: 'قلاب', icon: 'dump-truck', family: 'MCI', color: '#14b8a6' },
  { id: 'water_tanker', title: 'تنكر مياه', icon: 'water-pump', family: 'MCI', color: '#f43f5e' },
]


export default function EquipmentLandingScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { scrollHandler, scrollY } = useScrollAwareNav()

  // Fetch Data
  const { data: latestEquipment = [], isLoading: loadingEq } = useEquipment({ limit: 10 })
  
  const [loadRest, setLoadRest] = useState(false)
  React.useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setTimeout(() => setLoadRest(true), 150)
    })
    return () => task.cancel()
  }, [])

  const { data: saleData = [] } = useEquipment({ listingType: 'EQUIPMENT_SALE', limit: 10 }, { enabled: loadRest })
  const { data: rentData = [] } = useEquipment({ listingType: 'EQUIPMENT_RENT', limit: 10 }, { enabled: loadRest })
  const saleEquipment = saleData
  const rentEquipment = rentData

  const { data: opData, isLoading: loadingOp } = useOperatorsInfinite()
  const fetchedOperators = opData?.pages.flatMap(p => p.items)?.slice(0, 10) || []
  const operators = fetchedOperators.length > 0 ? fetchedOperators : MOCK_OPERATORS



  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* ═══════════════ ANIMATED STICKY HEADER ═══════════════ */}
      <AnimatedHeroHeader
        scrollY={scrollY}
        gradientColors={['#0B2447', '#1a3a6b', '#0d3060']}
        title="ســوق ون للمعدات الثقيلة"
        titleAccent=" الثقيلة والمشغلين"
        navSearchPlaceholder="ابحث عن معدة..."
        onNavSearchPress={() => router.push('/equipment/browse' as any)}
        heroSearchPlaceholder="حفار، رافعة شوكية، لودر..."
        onHeroSearchPress={() => router.push('/equipment/browse' as any)}
        onBackPress={() => {
          if (router.canGoBack()) router.back();
          else router.push('/');
        }}
        headerIcon="notifications-outline"
        onHeaderIconPress={() => router.push('/profile/notifications' as any)}
        primaryCta={{
          label: 'أضف إعلانك',
          icon: 'add',
          onPress: () => router.push('/equipment/new' as any),
          bgColor: Colors.accent,
          textColor: Colors.white
        }}
        outlineCta={{
          label: 'سجل كمشغل',
          icon: 'person-add-outline',
          onPress: () => router.push('/equipment/operators/add' as any)
        }}
      />

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 106 + Spacing.space5, paddingBottom: 100 }}
      >
        <View style={s.content}>

          <View style={s.sectionsGrid}>
            <TouchableOpacity style={s.sectionItem} onPress={() => router.push('/equipment/browse?type=sale')}>
              <View style={[s.sectionItemIconBox, { backgroundColor: '#fffbeb' }]}>
                <Ionicons name="cube-outline" size={20} color="#f59e0b" />
              </View>
              <Text style={s.sectionItemTitle}>للبيع</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.sectionItem} onPress={() => router.push('/equipment/browse?type=rental')}>
              <View style={[s.sectionItemIconBox, { backgroundColor: '#ecfdf5' }]}>
                <Ionicons name="construct-outline" size={20} color="#10b981" />
              </View>
              <Text style={s.sectionItemTitle}>للإيجار</Text>
            </TouchableOpacity>



            <TouchableOpacity style={s.sectionItem} onPress={() => router.push('/equipment/operators/browse')}>
              <View style={[s.sectionItemIconBox, { backgroundColor: '#f5f3ff' }]}>
                <Ionicons name="people-outline" size={20} color="#8b5cf6" />
              </View>
              <Text style={s.sectionItemTitle}>المشغلين</Text>
            </TouchableOpacity>
          </View>

          <View style={s.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.sectionTitleHeader}>تصفّح حسب نوع المعدة</Text>
              <Text style={s.sectionSubHeader}>اختر نوع المعدة المناسب لمشروعك</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.space5, marginBottom: Spacing.space6 }} contentContainerStyle={{ paddingHorizontal: Spacing.space5, gap: Spacing.space3, flexDirection: 'row' }}>
            {EQUIPMENT_TYPES.map((item) => (
              <TouchableOpacity key={item.id} style={s.eqTypeItem} onPress={() => router.push(`/equipment/browse?type=${item.id}` as any)} activeOpacity={0.8}>
                <View style={[s.eqTypeIconBox, { backgroundColor: item.color + '10' }]}>
                  {item.family === 'MCI' ? (
                    <MaterialCommunityIcons name={item.icon as any} size={24} color={item.color} />
                  ) : (
                    <Ionicons name={item.icon as any} size={22} color={item.color} />
                  )}
                </View>
                <Text style={s.eqTypeTxt}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.sectionTitleHeader}>أحدث المعدات المضافة</Text>
                <Text style={s.sectionSubHeader}>تصفح أحدث المعدات المتوفرة للبيع أو للإيجار</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/equipment/browse')} style={s.seeAllBtn}>
                <Text style={s.seeAllTxt}>الكل</Text>
                <Ionicons name="chevron-back" size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.space5 }} contentContainerStyle={s.hList}>
              {latestEquipment.map((item, i) => (
                <EquipCard key={i} item={item as any} onPress={() => router.push(`/equipment/${item.id}`)} />
              ))}
            </ScrollView>
          </View>

          {loadRest && (
            <>
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.sectionTitleHeader}>معدات للبيع</Text>
                    <Text style={s.sectionSubHeader}>تصفح أفضل المعدات المعروضة للبيع</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push('/equipment/browse?type=sale')} style={s.seeAllBtn}>
                    <Text style={s.seeAllTxt}>الكل</Text>
                    <Ionicons name="chevron-back" size={14} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.space5 }} contentContainerStyle={[s.hList, saleEquipment.length === 0 && { paddingHorizontal: Spacing.space5 }]}>
                  {saleEquipment.length > 0 ? (
                    saleEquipment.map((item, i) => (
                      <EquipCard key={i} item={item as any} onPress={() => router.push(`/equipment/${item.id}`)} />
                    ))
                  ) : (
                    <Text style={s.emptyTxt}>لا يوجد معدات للبيع حالياً</Text>
                  )}
                </ScrollView>
              </View>

              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.sectionTitleHeader}>معدات للإيجار</Text>
                    <Text style={s.sectionSubHeader}>اكتشف المعدات المتاحة للإيجار اليومي أو الشهري</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push('/equipment/browse?type=rental')} style={s.seeAllBtn}>
                    <Text style={s.seeAllTxt}>الكل</Text>
                    <Ionicons name="chevron-back" size={14} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.space5 }} contentContainerStyle={[s.hList, rentEquipment.length === 0 && { paddingHorizontal: Spacing.space5 }]}>
                  {rentEquipment.length > 0 ? (
                    rentEquipment.map((item, i) => (
                      <EquipCard key={i} item={item as any} onPress={() => router.push(`/equipment/${item.id}`)} />
                    ))
                  ) : (
                    <Text style={s.emptyTxt}>لا توجد معدات للإيجار حالياً</Text>
                  )}
                </ScrollView>
              </View>



              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.sectionTitleHeader}>أمهر المشغلين</Text>
                    <Text style={s.sectionSubHeader}>أفضل السائقين والمشغلين الخبراء</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push('/equipment/operators/browse')} style={s.seeAllBtn}>
                    <Text style={s.seeAllTxt}>الكل</Text>
                    <Ionicons name="chevron-back" size={14} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.space5 }} contentContainerStyle={s.hList}>
                  {operators.map((item, i) => (
                    <View key={i} style={{ width: 280 }}>
                      <OperatorCard item={item as any} onPress={() => router.push(`/equipment/operators/${item.id}`)} />
                    </View>
                  ))}
                </ScrollView>
              </View>
            </>
          )}

          <EquipmentHowItWorks />

          {/* Need Help / Support Button */}
          <SupportHelpButton style={{ marginHorizontal: 0, marginTop: 4, marginBottom: 12 }} />
        </View>
      </Animated.ScrollView>

      <EquipmentBottomBar />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FB' },
  

  // ─── Eq Type Item ───
  eqTypeItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 70,
  },
  eqTypeIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eqTypeTxt: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 11,
    color: '#334155',
    textAlign: 'center',
  },
  emptyTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    width: '100%',
    paddingVertical: Spacing.space4,
  },


  // ─── Content ───
  content: {
    paddingHorizontal: Spacing.space5,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.space3, marginTop: 0,
  },
  sectionTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 18,
    color: Colors.text,
  },
  sectionTitleHeader: { 
    fontFamily: 'Almarai_800ExtraBold', 
    fontSize: 16, 
    color: Colors.text, 
    textAlign: 'left',
    lineHeight: 23,
    writingDirection: 'rtl',
    marginBottom: 2,
  },
  sectionSubHeader: { 
    fontFamily: 'Almarai_400Regular', 
    fontSize: 12, 
    color: Colors.textMuted, 
    textAlign: 'left',
    lineHeight: 18,
    writingDirection: 'rtl',
  },
  seeAllBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4,
    backgroundColor: '#EFF6FF', 
    paddingHorizontal: 12, 
    paddingVertical: 5, 
    borderRadius: 20,
  },
  seeAllTxt: { 
    fontFamily: 'Almarai_700Bold', 
    fontSize: 12, 
    color: Colors.primary,
    lineHeight: 16,
    paddingTop: 1,
  },
  sectionsGrid: {
    flexDirection: 'row', gap: 10,
    marginBottom: Spacing.space6,
  },
  sectionItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.45)', // Glass transparency
    paddingVertical: 10, borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#FFFFFF', // 3D edge light reflection
    shadowColor: '#94A3B8', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 3, // 3D floating shadow
  },
  sectionItemIconBox: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  sectionItemTitle: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 12, color: Colors.text, textAlign: 'center',
    lineHeight: 18, paddingTop: 2, writingDirection: 'rtl'
  },
  hList: {
    paddingHorizontal: Spacing.space5,
    gap: Spacing.space3,
    paddingBottom: Spacing.space2,
  },
  cardWrapper: {
    width: 260,
  }
})
