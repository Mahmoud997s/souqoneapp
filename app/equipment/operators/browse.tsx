import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import Animated from 'react-native-reanimated'

import { Colors } from '../../../src/constants/colors'
import { Gradients } from '../../../src/constants/gradients'
import { Radius } from '../../../src/constants/radius'
import { Spacing } from '../../../src/constants/spacing'
import { OperatorCard } from '../../../src/components/cards/OperatorCard'
import { useOperatorsInfinite, useMyOperators } from '../../../src/hooks/useEquipment'
import { useAuthStore } from '../../../src/store/authStore'
import { useScrollAwareNav } from '../../../src/hooks/useScrollAwareNav'
import { SkeletonCard } from '../../../src/components/ui/SkeletonCard'
import { SupportHelpButton } from '../../../src/components/ui/SupportHelpButton'
import { BrowseHeader } from '../../../src/components/ui/BrowseHeader'
import { ListingTabs } from '../../../src/components/ui/ListingTabs'
import { QuickFilters, QuickFilterItem } from '../../../src/components/ui/QuickFilters'
import { CollapsibleSubHeader } from '../../../src/components/ui/CollapsibleSubHeader'
import { OperatorsFilterBottomSheet } from '../../../src/components/filters/OperatorsFilterBottomSheet'
import { OperatorFilterState } from '../../../src/types/filters.types'
import { OperatorListing } from '../../../src/types/equipment.types'
import { OMAN_LOCATIONS } from '../../../src/constants/locations'

const ROLE_TABS = [
  { id: 'all', label: 'الكل' },
  { id: 'OPERATOR', label: 'مشغلو معدات' },
  { id: 'DRIVER', label: 'سائقون' },
  { id: 'TECHNICIAN', label: 'فنيون' },
  { id: 'MAINTENANCE', label: 'صيانة' },
]

const DROPDOWN_FILTERS = [
  { id: 'category', label: 'نوع المعدة', icon: 'construct-outline' as const },
  { id: 'city', label: 'المدينة', icon: 'location-outline' as const },
  { id: 'experience', label: 'الخبرة', icon: 'shield-checkmark-outline' as const },
  { id: 'rate', label: 'الأجر', icon: 'wallet-outline' as const },
]

const EQUIPMENT_TYPE_OPTIONS = [
  { id: 'EXCAVATOR', label: 'حفار' },
  { id: 'CRANE', label: 'رافعة / كرين' },
  { id: 'LOADER', label: 'شيول / لودر' },
  { id: 'BULLDOZER', label: 'بلدوزر' },
  { id: 'FORKLIFT', label: 'رافعة شوكية' },
  { id: 'DUMP_TRUCK', label: 'قلاب' },
  { id: 'TRUCK', label: 'شاحنة' },
  { id: 'CONCRETE_MIXER', label: 'خلاطة' },
  { id: 'GENERATOR', label: 'مولد كهربائي' },
  { id: 'COMPRESSOR', label: 'كمبروسر' },
]

const EXPERIENCE_RANGES = [
  { id: 'all', label: 'الكل' },
  { id: 'exp1', label: '1 - 3 سنوات', min: 1, max: 3 },
  { id: 'exp2', label: '3 - 5 سنوات', min: 3, max: 5 },
  { id: 'exp3', label: '5 - 10 سنوات', min: 5, max: 10 },
  { id: 'exp4', label: 'أكثر من 10 سنوات', min: 10, max: 50 },
]

const RATE_RANGES = [
  { id: 'all', label: 'الكل' },
  { id: 'r1', label: 'أقل من 20 ر.ع / يوم', max: 20 },
  { id: 'r2', label: '20 - 35 ر.ع / يوم', min: 20, max: 35 },
  { id: 'r3', label: '35 - 50 ر.ع / يوم', min: 35, max: 50 },
  { id: 'r4', label: 'أكثر من 50 ر.ع / يوم', min: 50 },
]

const FAQ_DATA = [
  {
    q: 'كيف أضمن كفاءة وخبرة المشغل؟',
    a: 'يمكنك مراجعة الرخص والشهادات المرفقة في الملف المهني للمشغل، وسنوات خبرته، والتقييمات المباشرة.',
  },
  {
    q: 'هل يمكن الاتفاق على أجر بالساعة أو بالمشروع؟',
    a: 'نعم، يعرض المشغلون أسعارهم الاسترشادية، ويمكنك التفاوض المباشر مع المشغل عبر الاتصال أو الواتساب.',
  },
]

function OperatorsFAQ() {
  return (
    <View style={s.faqContainer}>
      <View style={s.faqHeader}>
        <View style={s.faqIconWrap}>
          <Ionicons name="information-circle" size={20} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.faqTitle}>معلومات هامة للمقاولين والشركات</Text>
          <Text style={s.faqSubtitle}>دليل استقطاب وتوظيف أمهر مشغلي المعدات</Text>
        </View>
      </View>

      <View style={s.faqCardsWrap}>
        {FAQ_DATA.map((item, index) => (
          <View key={index} style={s.faqCard}>
            <View style={s.faqQRow}>
              <View style={s.faqQDot} />
              <Text style={s.faqQText}>{item.q}</Text>
            </View>
            <Text style={s.faqAText}>{item.a}</Text>
          </View>
        ))}
      </View>

      <SupportHelpButton style={{ marginHorizontal: 0, marginTop: 14, marginBottom: 0 }} />
    </View>
  )
}

export default function BrowseOperatorsScreen() {
  const insets = useSafeAreaInsets()
  const { scrollHandler } = useScrollAwareNav()

  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<OperatorFilterState>({})
  const [isFilterVisible, setIsFilterVisible] = useState(false)

  // API Query (Passes all server-supported filters directly)
  const queryParams = useMemo(() => {
    const p: Record<string, unknown> = {}
    if (searchQuery.trim()) p.search = searchQuery.trim()
    if (filters.operatorType && filters.operatorType !== 'all') p.operatorType = filters.operatorType
    if (filters.governorateId) p.governorateId = filters.governorateId
    if (filters.wilayaId) p.wilayaId = filters.wilayaId
    if (filters.sortBy) p.sortBy = filters.sortBy
    return p
  }, [searchQuery, filters])

  const { data, isLoading, isError, refetch, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useOperatorsInfinite(queryParams)

  const { isLoggedIn } = useAuthStore()
  const { data: myOperators } = useMyOperators(!!isLoggedIn)
  const myOperatorProfile = useMemo(() => {
    if (!myOperators || myOperators.length === 0) return null
    return myOperators[0]
  }, [myOperators])

  // Raw items from API
  const rawOperators = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) || []
  }, [data])

  // Client-side instant filter refinement for specialized operator attributes
  const operators = useMemo(() => {
    return rawOperators.filter((cardItem) => {
      const op = ((cardItem as any).raw || cardItem) as OperatorListing

      // 1. Equipment Type Filter
      if (filters.equipmentType) {
        const types = (op.equipmentTypes || []) as string[]
        if (!types.includes(filters.equipmentType)) return false
      }

      // 2. Experience Level Filter
      if (filters.minExperience !== undefined && (op.experienceYears ?? 0) < filters.minExperience) {
        return false
      }
      if (filters.maxExperience !== undefined && (op.experienceYears ?? 0) > filters.maxExperience) {
        return false
      }

      // 3. Daily Rate Range Filter
      const rate = op.dailyRate ?? cardItem.price ?? 0
      if (filters.dailyRateMin !== undefined && rate < filters.dailyRateMin) {
        return false
      }
      if (filters.dailyRateMax !== undefined && rate > filters.dailyRateMax) {
        return false
      }

      // 4. Negotiable Price Filter
      if (filters.isPriceNegotiable && !op.isPriceNegotiable && !op.isNegotiable) {
        return false
      }

      // 5. Certification Filter
      if (filters.certification) {
        const certs = (op.certifications || []) as string[]
        const hasCert = certs.some((c) => c.toLowerCase().includes(filters.certification!.toLowerCase()))
        if (!hasCert) return false
      }

      return true
    })
  }, [rawOperators, filters])

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.operatorType && filters.operatorType !== 'all') count++
    if (filters.equipmentType) count++
    if (filters.governorateId) count++
    if (filters.wilayaId) count++
    if (filters.experienceLevel && filters.experienceLevel !== 'all') count++
    if (filters.dailyRateMin || (filters.dailyRateMax && filters.dailyRateMax < 150)) count++
    if (filters.isPriceNegotiable) count++
    if (filters.certification) count++
    if (filters.sortBy && filters.sortBy !== 'createdAt_desc') count++
    return count
  }, [filters])

  const quickFilterItems: QuickFilterItem[] = useMemo(() => [
    {
      id: 'category',
      label: filters.equipmentType
        ? EQUIPMENT_TYPE_OPTIONS.find((e) => e.id === filters.equipmentType)?.label || filters.equipmentType
        : 'نوع المعدة',
      icon: 'construct-outline',
      isActive: !!filters.equipmentType,
    },
    {
      id: 'city',
      label: filters.wilayaName || filters.governorateName || 'المحافظة',
      icon: 'location-outline',
      isActive: !!filters.governorateId || !!filters.wilayaId,
    },
    {
      id: 'experience',
      label: filters.experienceLevel
        ? EXPERIENCE_RANGES.find((e) => e.id === filters.experienceLevel)?.label || 'الخبرة'
        : 'الخبرة',
      icon: 'shield-checkmark-outline',
      isActive: !!filters.experienceLevel,
    },
    {
      id: 'rate',
      label: filters.dailyRateMax ? `حتى ${filters.dailyRateMax} ر.ع` : 'الأجر',
      icon: 'wallet-outline',
      isActive: !!filters.dailyRateMin || (!!filters.dailyRateMax && filters.dailyRateMax < 150),
    },
  ], [filters])

  const handleClearQuickFilter = (id: string) => {
    setFilters((prev) => {
      const next = { ...prev }
      if (id === 'category') delete next.equipmentType
      if (id === 'city') {
        delete next.governorateId
        delete next.wilayaId
        delete next.governorateName
        delete next.wilayaName
      }
      if (id === 'experience') {
        delete next.experienceLevel
        delete next.minExperience
        delete next.maxExperience
      }
      if (id === 'rate') {
        delete next.dailyRateMin
        delete next.dailyRateMax
      }
      return next
    })
  }

  const handleClearAll = () => {
    setSearchQuery('')
    setFilters({})
    setIsFilterVisible(false)
  }

  const activeRole = filters.operatorType || 'all'

  return (
    <View style={s.root}>
      {/* ═══════════════ 1. BROWSE HEADER (MATCHING CARS & PARTS) ═══════════════ */}
      <BrowseHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="ابحث عن مشغل، فني، تخصص..."
        activeFiltersCount={activeFiltersCount}
        onFilterPress={() => setIsFilterVisible(true)}
      />

      {/* ═══════════════ 2. COLLAPSIBLE TABS & QUICK FILTERS ═══════════════ */}
      <CollapsibleSubHeader>
        <ListingTabs
          tabs={ROLE_TABS}
          activeTabId={activeRole}
          onChangeTab={(id) =>
            setFilters((prev) => ({
              ...prev,
              operatorType: id === 'all' ? undefined : id,
            }))
          }
          onClearTab={() =>
            setFilters((prev) => ({
              ...prev,
              operatorType: undefined,
            }))
          }
        />
        <QuickFilters
          filters={quickFilterItems}
          onFilterPress={() => setIsFilterVisible(true)}
          onClearFilter={handleClearQuickFilter}
        />
      </CollapsibleSubHeader>

      {/* ═══════════════ 3. LIST VIEW ═══════════════ */}
      <Animated.FlatList
        data={operators}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          s.listContent,
          { paddingTop: Spacing.space2, paddingBottom: Math.max(insets.bottom, 16) + 16 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage()
        }}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <>
            {/* Sleek Compact Smart Banner (Conditional: Active Profile vs Join Directory) */}
            {myOperatorProfile ? (
              <View style={[s.bannerContainer, s.bannerContainerActive]}>
                <View style={[s.bannerIconWrap, s.bannerIconWrapActive]}>
                  <MaterialCommunityIcons name="badge-account-horizontal-outline" size={22} color="#059669" />
                </View>
                
                <View style={s.bannerTextWrap}>
                  <View style={s.bannerBadgeRow}>
                    <Text style={s.bannerTitle} numberOfLines={1}>بطاقتك المهنية</Text>
                    <View style={s.activeStatusBadge}>
                      <View style={s.activeStatusDot} />
                      <Text style={s.activeStatusTxt}>نشطة بالدليل</Text>
                    </View>
                  </View>
                  <Text style={s.bannerSubtitle} numberOfLines={1}>
                    {myOperatorProfile.title || 'جاهز لتلقي طلبات العمل والتواصل المباشر'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={s.bannerCtaBtn}
                  onPress={() => router.push(`/equipment/operators/edit/${myOperatorProfile.id}` as any)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#059669', '#047857']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={s.bannerCtaGradient}
                  >
                    <Text style={s.bannerCtaText}>تعديل بطاقتي</Text>
                    <Ionicons name="create-outline" size={14} color="#ffffff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={s.bannerContainer}>
                <View style={s.bannerIconWrap}>
                  <MaterialCommunityIcons name="hard-hat" size={21} color={Colors.primary} />
                </View>
                
                <View style={s.bannerTextWrap}>
                  <Text style={s.bannerTitle} numberOfLines={1}>دليل مشغلي وسائقي المعدات</Text>
                  <Text style={s.bannerSubtitle} numberOfLines={1}>أبرز خبراتك ورخصك وانضم لنخبة الكفاءات</Text>
                </View>

                <TouchableOpacity
                  style={s.bannerCtaBtn}
                  onPress={() => router.push('/equipment/operators/add')}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={Gradients.primary as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={s.bannerCtaGradient}
                  >
                    <Text style={s.bannerCtaText}>انضم للدليل</Text>
                    <Ionicons name="add" size={14} color="#ffffff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Results Count Meta & Clear Filters Row */}
            <View style={s.resultsRow}>
              {(activeFiltersCount > 0 || searchQuery.length > 0) ? (
                <TouchableOpacity 
                  onPress={handleClearAll}
                  style={s.clearFiltersBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={12.5} color={Colors.error} />
                  <Text style={s.clearFiltersTxt}>
                    مسح الفلاتر
                  </Text>
                </TouchableOpacity>
              ) : <View />}

              <View style={s.resultsCountBadge}>
                <MaterialCommunityIcons name="hard-hat" size={13} color="#64748B" />
                <Text style={s.resultsCountTxt}>
                  {isLoading ? 'جاري البحث...' : `${operators.length} مشغل متاح`}
                </Text>
              </View>
            </View>

            {/* Skeleton Loading State */}
            {isLoading && (
              <View style={s.skeletonWrap}>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <OperatorCard
            item={item}
            onPress={() => router.push(`/equipment/operators/${item.id}` as any)}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={s.emptyContainer}>
              <View style={s.emptyIconWrap}>
                <Ionicons name="people-outline" size={40} color={Colors.textMuted} />
              </View>
              <Text style={s.emptyTitle}>لا توجد نتائج مطابقة</Text>
              <Text style={s.emptySubtitle}>
                جرب تغيير الفلاتر أو كلمة البحث للعثور على نتائج أخرى
              </Text>
              {(searchQuery.length > 0 || activeFiltersCount > 0) && (
                <TouchableOpacity style={s.resetBtn} onPress={handleClearAll} activeOpacity={0.8}>
                  <Ionicons name="refresh" size={14} color={Colors.primary} />
                  <Text style={s.resetBtnTxt}>إعادة تعيين الكل</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
        ListFooterComponent={
          <>
            {isFetchingNextPage && (
              <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 12 }} />
            )}
            {!isLoading && <OperatorsFAQ />}
          </>
        }
      />

      {/* ═══════════════ 4. FILTER BOTTOM SHEET (MATCHING CARS) ═══════════════ */}
      <OperatorsFilterBottomSheet
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        initialFilters={filters}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters)
        }}
        resultsCount={operators.length}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  listContent: {
    paddingHorizontal: Spacing.space3,
  },
  bannerContainer: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: Spacing.space2,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  bannerContainerActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  bannerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerIconWrapActive: {
    backgroundColor: '#DCFCE7',
  },
  bannerTextWrap: {
    flex: 1,
  },
  bannerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    gap: 4,
  },
  activeStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  activeStatusTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10,
    lineHeight: 14,
    color: '#15803D',
  },
  bannerTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 14,
    color: '#0F172A',
    textAlign: 'left',
    writingDirection: 'rtl',
    lineHeight: 20,
  },
  bannerSubtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
    lineHeight: 16,
    marginTop: 1,
  },
  bannerCtaBtn: {
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  bannerCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 13,
  },
  bannerCtaText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: '#ffffff',
    lineHeight: 17,
  },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginTop: Spacing.space1,
    marginBottom: Spacing.space2,
  },
  clearFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  clearFiltersTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.error,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  resultsCountBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  resultsCountTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: '#64748B',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  skeletonWrap: {
    gap: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: Spacing.space4,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space2,
  },
  emptyTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 14.5,
    lineHeight: 20,
    color: Colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 12,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  resetBtnTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.primary,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  faqContainer: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.space3,
    marginTop: Spacing.space3,
    marginBottom: Spacing.space3,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    marginBottom: Spacing.space2,
  },
  faqIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 13.5,
    lineHeight: 18,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  faqSubtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  faqCardsWrap: {
    gap: 8,
  },
  faqCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: Spacing.space3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  faqQRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  faqQDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
  },
  faqQText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  faqAText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
    paddingStart: 10,
  },
})
