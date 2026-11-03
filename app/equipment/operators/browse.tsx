import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  FlatList,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import Animated from 'react-native-reanimated'

import { Colors } from '../../../src/constants/colors'
import { Radius } from '../../../src/constants/radius'
import { Spacing } from '../../../src/constants/spacing'
import { OperatorCard } from '../../../src/components/cards/OperatorCard'
import { useOperatorsInfinite, useMyOperators } from '../../../src/hooks/useEquipment'
import { useAuthStore } from '../../../src/store/authStore'
import { useScrollAwareNav } from '../../../src/hooks/useScrollAwareNav'
import { useOperatorNavigation } from '../../../src/hooks/useOperatorNavigation'
import { SkeletonCard } from '../../../src/components/ui/SkeletonCard'
import { SectionFooterAction } from '../../../src/components/ui/SectionFooterAction'
import { CATEGORY_ICONS } from '../../../src/constants/categoryIcons'
import { BrowseHeader } from '../../../src/components/ui/BrowseHeader'
import { BrowseResultsBar } from '../../../src/components/ui/BrowseResultsBar'
import { FilterGlassTokens } from '../../../src/constants/filterGlassTokens'
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
import { EquipmentBottomBar } from '../../../src/components/equipment/EquipmentBottomBar'
import { UNIFIED_BOTTOM_BAR_HEIGHT } from '../../../src/components/navigation/UnifiedBottomBar'
import {
  buildOperatorQueryParams,
  refineOperatorsClientSide,
  clearOperatorFilter,
  mergeOperatorRouteParams,
} from '../../../src/utils/browse-filters/operatorsBrowseFilters'
import { UnifiedCardItem } from '../../../src/types/unified-card.types'

export { buildOperatorQueryParams } from '../../../src/utils/browse-filters/operatorsBrowseFilters'

export default function BrowseOperatorsScreen() {
  const insets = useSafeAreaInsets()
  const { scrollHandler } = useScrollAwareNav()
  const { navigateToAddOperator } = useOperatorNavigation()
  const listRef = useRef<FlatList<UnifiedCardItem>>(null)
  const searchParams = useLocalSearchParams<{
    operatorType?: string;
    governorateId?: string;
    wilayaId?: string;
  }>()

  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<OperatorFilterState>({})
  const [isFilterVisible, setIsFilterVisible] = useState(false)

  // G-07: Merge incoming route params into existing filter state without wiping selections
  useEffect(() => {
    setFilters((prev) => mergeOperatorRouteParams(prev, searchParams as Record<string, string | undefined>))
  }, [searchParams.operatorType, searchParams.governorateId, searchParams.wilayaId])

  // API Query (Passes all server-supported filters directly via pure module)
  const queryParams = useMemo(() => {
    return buildOperatorQueryParams(searchQuery, filters)
  }, [searchQuery, filters])

  // G-06: Scroll to top on filter / query change
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false })
  }, [queryParams])

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

  // Client-side instant filter refinement for specialized operator attributes (not yet supported on server)
  const operators = useMemo(() => {
    return refineOperatorsClientSide(rawOperators, filters)
  }, [rawOperators, filters])

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.operatorType && filters.operatorType !== 'all') count++
    if (filters.equipmentType) count++
    if (filters.governorateId) count++
    if (filters.wilayaId) count++
    if (filters.experienceLevel || filters.minExperience !== undefined || filters.maxExperience !== undefined) count++
    if (filters.dailyRateMin !== undefined || filters.dailyRateMax !== undefined) count++
    if (filters.isPriceNegotiable) count++
    if (filters.certification) count++
    if (filters.sortBy && filters.sortBy !== 'newest' && filters.sortBy !== 'createdAt_desc') count++
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
    let experienceLabel = 'الخبرة'
    const selectedExp = OPERATOR_EXPERIENCE_RANGES.find((e) => e.id === filters.experienceLevel)
    if (selectedExp) {
      experienceLabel = selectedExp.label
    } else if (filters.minExperience !== undefined && filters.maxExperience !== undefined) {
      experienceLabel = `${filters.minExperience}-${filters.maxExperience} سنوات`
    } else if (filters.minExperience !== undefined) {
      experienceLabel = `+${filters.minExperience} سنوات`
    }

    // 4. Rate
    let rateLabel = 'الأجر'
    if (filters.dailyRateMin !== undefined && filters.dailyRateMax !== undefined && filters.dailyRateMax < 150) {
      rateLabel = `${filters.dailyRateMin} - ${filters.dailyRateMax} ر.ع`
    } else if (filters.dailyRateMax !== undefined && filters.dailyRateMax < 150) {
      rateLabel = `حتى ${filters.dailyRateMax} ر.ع`
    } else if (filters.dailyRateMin !== undefined) {
      rateLabel = `من ${filters.dailyRateMin} ر.ع`
    }

    // 5. Certification
    const certLabel = filters.certification || 'الشهادات والرخص'

    // 6. Negotiable Price
    const negotiableLabel = filters.isPriceNegotiable ? 'قابل للتفاوض' : 'التفاوض'

    // 7. Sort
    let sortLabel = 'الترتيب'
    if (filters.sortBy) {
      if (filters.sortBy === 'experienceYears_desc' || filters.sortBy === 'experienceYears') sortLabel = 'الأعلى خبرة'
      else if (filters.sortBy === 'dailyRate_asc') sortLabel = 'الأقل سعراً'
      else if (filters.sortBy === 'dailyRate_desc') sortLabel = 'الأعلى سعراً'
      else if (filters.sortBy === 'createdAt_desc' || filters.sortBy === 'newest') sortLabel = 'الأحدث'
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
        isActive: !!filters.experienceLevel || filters.minExperience !== undefined || filters.maxExperience !== undefined,
      },
      {
        id: 'rate',
        label: rateLabel,
        icon: 'wallet-outline',
        isActive: filters.dailyRateMin !== undefined || (filters.dailyRateMax !== undefined && filters.dailyRateMax < 150),
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
        isActive: !!filters.sortBy && filters.sortBy !== 'createdAt_desc' && filters.sortBy !== 'newest',
      },
    ]
  }, [filters])

  const handleClearQuickFilter = (id: string) => {
    setFilters((prev) => clearOperatorFilter(prev, id))
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
        ref={listRef}
        data={operators}
        keyExtractor={(item) => item.id}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[
          s.listContent,
          {
            paddingTop: Spacing.space2,
            paddingBottom: UNIFIED_BOTTOM_BAR_HEIGHT + Math.max(insets.bottom, 12) + 8,
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
              onJoinPress={navigateToAddOperator}
              onEditPress={(profileId) => router.push(`/equipment/operators/edit/${profileId}` as any)}
            />

            {/* Results Count Meta & Clear Filters Row */}
            <BrowseResultsBar
              resultsCount={operators.length}
              entityName="مشغل"
              availabilitySuffix="متاح"
              customIcon={
                <MaterialCommunityIcons
                  name="hard-hat"
                  size={14}
                  color={FilterGlassTokens.resultsBar.countIconColor}
                />
              }
              activeFiltersCount={activeFiltersCount > 0 || searchQuery.length > 0 ? 1 : 0}
              onClearAll={handleClearAll}
            />

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
                <SectionFooterAction
                  isLanding
                  title="هل أنت مشغل معدات محترف؟"
                  subtitle="سجل بروفايلك المهني الآن وتلق عروض عمل ومشاريع مجزية"
                  buttonText="سجل كمشغل"
                  iconName="construct-outline"
                  iconImage={CATEGORY_ICONS.equipment}
                  onPress={navigateToAddOperator}
                />
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

      <EquipmentBottomBar />
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  listContent: {
    paddingHorizontal: Spacing.space4,
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
