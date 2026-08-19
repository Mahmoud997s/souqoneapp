import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import Animated from 'react-native-reanimated'

import { Colors } from '../../../src/constants/colors'
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
import { OperatorSmartBanner } from '../../../src/components/operators/OperatorSmartBanner'
import { OperatorFAQ } from '../../../src/components/operators/OperatorFAQ'
import {
  OPERATOR_ROLE_TABS,
  AVAILABLE_EQUIPMENT,
  OPERATOR_EXPERIENCE_RANGES,
} from '../../../src/constants/operators'
import { OperatorFilterState } from '../../../src/types/filters.types'
import { OperatorListing } from '../../../src/types/equipment.types'
import { OMAN_LOCATIONS } from '../../../src/constants/locations'

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

  const { data, isLoading, isError, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
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
    if (filters.experienceLevel) count++
    if (filters.dailyRateMin !== undefined || filters.dailyRateMax !== undefined) count++
    if (filters.isPriceNegotiable) count++
    if (filters.certification) count++
    if (filters.sortBy && filters.sortBy !== 'newest') count++
    return count
  }, [filters])

  const handleClearAll = () => {
    setSearchQuery('')
    setFilters({})
  }

  // Complete Set of Quick Filter Pills (Always visible & interactive)
  const quickFilterItems: QuickFilterItem[] = useMemo(() => {
    // 1. Equipment Category
    const selectedEquipment = AVAILABLE_EQUIPMENT.find((e) => e.id === filters.equipmentType)
    const equipmentLabel = selectedEquipment ? selectedEquipment.label : (filters.equipmentType || 'نوع المعدة')

    // 2. Location
    let locationLabel = 'المحافظة'
    if (filters.governorateId) {
      const govObj = OMAN_LOCATIONS.find((g) => g.id === String(filters.governorateId))
      locationLabel = govObj ? govObj.labelAr : `محافظة #${filters.governorateId}`
    }

    // 3. Experience
    const selectedExp = OPERATOR_EXPERIENCE_RANGES.find((e) => e.id === filters.experienceLevel)
    const experienceLabel = selectedExp ? selectedExp.label : 'الخبرة'

    // 4. Rate
    let rateLabel = 'الأجر'
    if (filters.dailyRateMax && filters.dailyRateMax < 150) {
      rateLabel = `حتى ${filters.dailyRateMax} ر.ع`
    } else if (filters.dailyRateMin) {
      rateLabel = `من ${filters.dailyRateMin} ر.ع`
    }

    // 5. Certification
    const certLabel = filters.certification || 'الشهادات والرخص'

    // 6. Negotiable Price
    const negotiableLabel = filters.isPriceNegotiable ? 'قابل للتفاوض' : 'التفاوض'

    // 7. Sort
    let sortLabel = 'الترتيب'
    if (filters.sortBy) {
      if (filters.sortBy === 'experienceYears_desc') sortLabel = 'الأعلى خبرة'
      else if (filters.sortBy === 'dailyRate_asc') sortLabel = 'الأقل سعراً'
      else if (filters.sortBy === 'dailyRate_desc') sortLabel = 'الأعلى سعراً'
      else if (filters.sortBy === 'createdAt_desc') sortLabel = 'الأحدث'
    }

    return [
      {
        id: 'category',
        label: equipmentLabel,
        icon: 'construct-outline',
        isActive: !!filters.equipmentType,
      },
      {
        id: 'city',
        label: locationLabel,
        icon: 'location-outline',
        isActive: !!filters.governorateId || !!filters.wilayaId,
      },
      {
        id: 'experience',
        label: experienceLabel,
        icon: 'shield-checkmark-outline',
        isActive: !!filters.experienceLevel,
      },
      {
        id: 'rate',
        label: rateLabel,
        icon: 'wallet-outline',
        isActive: !!filters.dailyRateMin || (!!filters.dailyRateMax && filters.dailyRateMax < 150),
      },
      {
        id: 'certification',
        label: certLabel,
        icon: 'ribbon-outline',
        isActive: !!filters.certification,
      },
      {
        id: 'negotiable',
        label: negotiableLabel,
        icon: 'pricetag-outline',
        isActive: !!filters.isPriceNegotiable,
      },
      {
        id: 'sort',
        label: sortLabel,
        icon: 'swap-vertical-outline',
        isActive: !!filters.sortBy && filters.sortBy !== 'createdAt_desc',
      },
    ]
  }, [filters])

  const handleClearQuickFilter = (id: string) => {
    setFilters((prev) => {
      const next = { ...prev }
      if (id === 'category') delete next.equipmentType
      if (id === 'city') {
        delete next.governorateId
        delete next.wilayaId
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
      if (id === 'certification') {
        delete next.certification
      }
      if (id === 'negotiable') {
        delete next.isPriceNegotiable
      }
      if (id === 'sort') {
        delete next.sortBy
      }
      return next
    })
  }

  return (
    <View style={s.root}>
      {/* ═══════════════ 1. COMPACT BROWSE HEADER ═══════════════ */}
      <BrowseHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="ابحث باسم المشغل، التخصص، أو المعدة..."
        activeFiltersCount={activeFiltersCount}
        onFilterPress={() => setIsFilterVisible(true)}
      />

      {/* ═══════════════ 2. SUB-HEADER: TABS & QUICK FILTERS ═══════════════ */}
      <CollapsibleSubHeader>
        <ListingTabs
          tabs={OPERATOR_ROLE_TABS}
          activeTabId={filters.operatorType || 'all'}
          onChangeTab={(tabId: string) => {
            setFilters((prev) => ({
              ...prev,
              operatorType: tabId === 'all' ? undefined : (tabId as any),
            }))
          }}
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

      {/* ═══════════════ 3. MAIN LIST ═══════════════ */}
      <Animated.FlatList
        data={operators}
        keyExtractor={(item) => item.id}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[
          s.listContent,
          {
            paddingTop: 10,
            paddingBottom: insets.bottom + 80,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage()
        }}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <>
            {/* Modular Smart Banner */}
            <OperatorSmartBanner
              myOperatorProfile={myOperatorProfile}
              onJoinPress={() => router.push('/equipment/operators/add')}
              onEditPress={(profileId) => router.push(`/equipment/operators/edit/${profileId}` as any)}
            />

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
            {!isLoading && (
              <>
                <OperatorFAQ />
                <SupportHelpButton style={{ marginHorizontal: 0, marginTop: 4, marginBottom: 16 }} />
              </>
            )}
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
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space2,
    paddingHorizontal: 2,
  },
  clearFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radius.sm,
    paddingVertical: 3,
    paddingHorizontal: 8,
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
})
