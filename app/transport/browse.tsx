import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Platform,
  ActivityIndicator,
  FlatList,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useInfiniteQuery } from '@tanstack/react-query';

import { transportApi } from '../../src/api/transport';
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav';
import { useNavVisibility } from '../../src/context/NavVisibilityContext';
import { OMAN_LOCATIONS } from '../../src/constants/locations';

import { BrowseHeader } from '../../src/components/ui/BrowseHeader';
import { ListingTabs } from '../../src/components/ui/ListingTabs';
import { CollapsibleSubHeader } from '../../src/components/ui/CollapsibleSubHeader';
import { QuickFilters } from '../../src/components/ui/QuickFilters';
import { ActionBanner } from '../../src/components/ui/ActionBanner';
import { SupportHelpButton } from '../../src/components/ui/SupportHelpButton';

// Components
import { TransportRequestCard } from '../../src/components/transport/TransportRequestCard';
import { TransportFiltersModal } from '../../src/components/transport/TransportFiltersModal';
import { TransportSkeletonCard } from '../../src/components/transport/TransportSkeletonCard';
import { TransportVisualFilters } from '../../src/components/transport/TransportVisualFilters';

// Constants
import { Colors } from '../../src/constants/colors';
import { Spacing } from '../../src/constants/spacing';
import { Radius } from '../../src/constants/radius';

interface FilterState {
  serviceType?: string;
  status?: string;
  fromGovernorate?: string;
  fromCity?: string;
  toGovernorate?: string;
  toCity?: string;
  budgetMin?: string;
  budgetMax?: string;
  timingType?: 'asap' | 'scheduled' | '';
  isFlexible?: boolean | null;
  requiresHelper?: boolean | null;
}

const LISTING_TYPES = [
  { id: 'ALL', label: 'الكل' },
  { id: 'GOODS', label: 'بضائع' },
  { id: 'FURNITURE', label: 'أثاث' },
  { id: 'EQUIPMENT', label: 'معدات' },
];

const DROPDOWN_FILTERS = [
  { id: 'fromGovernorate', label: 'من', icon: 'location-outline' },
  { id: 'toGovernorate', label: 'إلى', icon: 'flag-outline' },
  { id: 'status', label: 'الحالة', icon: 'options-outline' },
  { id: 'timingType', label: 'الموعد', icon: 'calendar-outline' },
  { id: 'budget', label: 'الميزانية', icon: 'cash-outline' },
  { id: 'requiresHelper', label: 'عمال تحميل', icon: 'people-outline' },
];

const GOVERNORATE_OPTIONS = OMAN_LOCATIONS.map(g => ({
  labelAr: g.labelAr,
  value: g.labelAr
}));

const STATUS_OPTIONS = [
  { label: 'الكل', value: '' },
  { label: 'جديد', value: 'PENDING' },
  { label: 'قيد التنفيذ', value: 'ACCEPTED' },
  { label: 'مكتمل', value: 'COMPLETED' },
];

const TIMING_OPTIONS = [
  { label: 'الكل', value: '' },
  { label: 'فوري (أسرع وقت)', value: 'asap' },
  { label: 'مجدول (تاريخ محدد)', value: 'scheduled' },
];

const BUDGET_RANGES = [
  { id: 'all', label: 'الكل', min: '', max: '' },
  { id: 'b1', label: 'أقل من 50 ر.ع', min: '0', max: '50' },
  { id: 'b2', label: '50 - 100 ر.ع', min: '50', max: '100' },
  { id: 'b3', label: '100 - 300 ر.ع', min: '100', max: '300' },
  { id: 'b4', label: '300 - 500 ر.ع', min: '300', max: '500' },
  { id: 'b5', label: 'أكثر من 500 ر.ع', min: '500', max: '999999' },
];

const HELPER_OPTIONS = [
  { label: 'الكل', value: null },
  { label: 'يحتاج عمال تحميل', value: true },
  { label: 'لا يحتاج عمال', value: false },
];

export default function TransportBrowseScreen() {
  const insets = useSafeAreaInsets();
  const { scrollHandler } = useScrollAwareNav();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>({});
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Combine query parameters
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      limit: 30,
    };

    if (debouncedSearch.trim()) {
      params.search = debouncedSearch;
    }

    if (filters.serviceType && filters.serviceType !== 'ALL') params.serviceType = filters.serviceType;
    if (filters.status) params.status = filters.status;
    if (filters.fromGovernorate) params.fromGovernorate = filters.fromGovernorate;
    if (filters.fromCity) params.fromCity = filters.fromCity;
    if (filters.toGovernorate) params.toGovernorate = filters.toGovernorate;
    if (filters.toCity) params.toCity = filters.toCity;
    if (filters.budgetMin) params.budgetMin = Number(filters.budgetMin);
    if (filters.budgetMax) params.budgetMax = Number(filters.budgetMax);
    if (filters.timingType) params.timingType = filters.timingType;
    if (filters.isFlexible === true) params.isFlexible = true;
    if (filters.requiresHelper === true) params.requiresHelper = true;

    return params;
  }, [debouncedSearch, filters]);

  // Fetch Listings with Infinite Scrolling
  const { 
    data: infiniteData, 
    isLoading, 
    isError, 
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['transport-requests', queryParams],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await transportApi.getAll({ ...queryParams, page: pageParam });
      const d = res.data as any;
      return { items: d?.items ?? d?.data ?? (Array.isArray(d) ? d : []), meta: d?.meta };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta) return undefined;
      return lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined;
    }
  });

  const listings = infiniteData?.pages.flatMap(p => p.items) ?? [];
  const rawMeta = infiniteData?.pages[0]?.meta;

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.serviceType && filters.serviceType !== 'ALL') count++;
    if (filters.status) count++;
    if (filters.fromGovernorate) count++;
    if (filters.fromCity) count++;
    if (filters.toGovernorate) count++;
    if (filters.toCity) count++;
    if (filters.budgetMin) count++;
    if (filters.budgetMax) count++;
    if (filters.timingType) count++;
    if (filters.isFlexible === true) count++;
    if (filters.requiresHelper === true) count++;
    return count;
  }, [filters]);

  const handleApplyAdvancedFilters = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
  };

  const handleClearAll = () => {
    setFilters({});
    setSearchQuery('');
  };

  const handleSelectVisualFilter = (
    type: 'serviceType' | 'governorate' | 'timingType' | 'budget' | 'requiresHelper',
    valueId: any,
    valueName?: string,
    min?: number,
    max?: number
  ) => {
    setFilters((prev) => {
      const updated = { ...prev };
      if (type === 'serviceType') {
        if (!valueId) delete updated.serviceType;
        else updated.serviceType = valueId;
      } else if (type === 'governorate') {
        if (!valueId) {
          delete updated.fromGovernorate;
          delete updated.toGovernorate;
        } else {
          updated.fromGovernorate = valueId;
        }
      } else if (type === 'timingType') {
        if (!valueId) delete updated.timingType;
        else updated.timingType = valueId;
      } else if (type === 'budget') {
        if (!valueId) {
          delete updated.budgetMin;
          delete updated.budgetMax;
        } else {
          updated.budgetMin = min !== undefined ? String(min) : undefined;
          updated.budgetMax = max !== undefined ? String(max) : undefined;
        }
      } else if (type === 'requiresHelper') {
        if (valueId === null || valueId === undefined) {
          delete updated.requiresHelper;
        } else {
          updated.requiresHelper = valueId;
        }
      }
      return updated;
    });
  };

  const quickFilterItems = DROPDOWN_FILTERS.map(qf => {
    let isActive = false;
    let displayLabel = qf.label;

    if (qf.id === 'fromGovernorate') {
      isActive = !!filters.fromGovernorate;
      if (isActive) displayLabel = filters.fromGovernorate as string;
    } else if (qf.id === 'toGovernorate') {
      isActive = !!filters.toGovernorate;
      if (isActive) displayLabel = filters.toGovernorate as string;
    } else if (qf.id === 'status') {
      isActive = !!filters.status;
      if (isActive) displayLabel = STATUS_OPTIONS.find(t => t.value === filters.status)?.label || qf.label;
    } else if (qf.id === 'timingType') {
      isActive = !!filters.timingType;
      if (isActive) displayLabel = TIMING_OPTIONS.find(t => t.value === filters.timingType)?.label || qf.label;
    } else if (qf.id === 'budget') {
      isActive = !!filters.budgetMax || !!filters.budgetMin;
      if (isActive) {
         const found = BUDGET_RANGES.find(b => b.max === (filters.budgetMax)?.toString());
         if (found) displayLabel = found.label;
      }
    } else if (qf.id === 'requiresHelper') {
      isActive = filters.requiresHelper === true || filters.requiresHelper === false;
      if (isActive) displayLabel = filters.requiresHelper ? 'يحتاج عمال' : 'لا يحتاج';
    }

    return {
      id: qf.id,
      label: displayLabel,
      icon: qf.icon as any,
      isActive
    };
  });

  const handleClearQuickFilter = (id: string) => {
    const newFilters = { ...filters };
    if (id === 'fromGovernorate') delete newFilters.fromGovernorate;
    if (id === 'toGovernorate') delete newFilters.toGovernorate;
    if (id === 'status') delete newFilters.status;
    if (id === 'timingType') delete newFilters.timingType;
    if (id === 'budget') { delete newFilters.budgetMin; delete newFilters.budgetMax; }
    if (id === 'requiresHelper') delete newFilters.requiresHelper;
    setFilters(newFilters);
  };

  return (
    <View style={s.root}>
      <BrowseHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="ابحث عن حمولة..."
        activeFiltersCount={activeFiltersCount}
        onFilterPress={() => setFilterModalVisible(true)}
      />

      <CollapsibleSubHeader>
        <ListingTabs
          tabs={LISTING_TYPES}
          activeTabId={filters.serviceType || 'ALL'}
          onChangeTab={(id) => {
            if (id === 'ALL') {
              const newFilters = { ...filters };
              delete newFilters.serviceType;
              setFilters(newFilters);
            } else {
              setFilters({ ...filters, serviceType: id as string });
            }
          }}
        />
        <QuickFilters
          filters={quickFilterItems}
          onFilterPress={(id) => setActiveDropdown(id as string)}
          onClearFilter={handleClearQuickFilter}
        />
      </CollapsibleSubHeader>

      {/* ── LISTINGS LIST ── */}
      {isLoading ? (
        <View style={s.skeletonGrid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={s.fullCard}>
              <TransportSkeletonCard />
            </View>
          ))}
        </View>
      ) : isError ? (
        <View style={s.emptyContainer}>
          <View style={s.emptyIconWrapError}>
            <Ionicons name="cloud-offline" size={56} color="#ef4444" />
          </View>
          <Text style={s.emptyTitle}>عذراً، فقدنا الاتصال!</Text>
          <Text style={s.emptySub}>تعذر جلب البيانات من الخادم، يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => refetch()}>
            <Text style={s.retryBtnTxt}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.FlatList
          data={listings || []}
          keyExtractor={(item, index) => (item as any).id ?? (item as any)._id ?? `transport-${index}`}
          contentContainerStyle={[s.listContent, { paddingTop: Spacing.space2 }]}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading && listings?.length > 0} onRefresh={refetch} tintColor={Colors.primary} />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => (
            <>
              {isFetchingNextPage && (
                <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 24 }} />
              )}
              {listings && listings.length > 0 && (
                <>
                  <ActionBanner
                    title="لديك شحنة أو بضاعة للنقل؟"
                    subtitle="أضف طلبك الآن وتلق عروض أسعار مباشرة من الناقلين"
                    buttonText="أضف طلبك"
                    iconName="cube-outline"
                    onPress={() => router.push('/transport/new' as any)}
                  />
                  <SupportHelpButton />
                </>
              )}
            </>
          )}
          ListHeaderComponent={
            <View style={s.listHeader}>
              <TransportVisualFilters
                selectedServiceType={filters.serviceType}
                selectedGovernorate={filters.fromGovernorate || filters.toGovernorate}
                selectedTimingType={filters.timingType}
                selectedBudgetMin={filters.budgetMin ? Number(filters.budgetMin) : undefined}
                selectedBudgetMax={filters.budgetMax ? Number(filters.budgetMax) : undefined}
                selectedRequiresHelper={filters.requiresHelper}
                onSelectFilter={handleSelectVisualFilter}
                onViewAll={() => setFilterModalVisible(true)}
              />

              <View style={s.resultsCountBar}>
                {activeFiltersCount > 0 ? (
                  <TouchableOpacity
                    onPress={handleClearAll}
                    style={s.clearFiltersBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={12.5} color={Colors.error} />
                    <Text style={s.clearFiltersText}>
                      مسح الفلاتر
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View />
                )}

                <View style={s.countBadge}>
                  <Ionicons name="cube-outline" size={13.5} color="#64748b" />
                  <Text style={s.countBadgeText}>
                    {rawMeta?.total ?? (listings?.length || 0)} طلب متاح
                  </Text>
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={s.emptyContainer}>
              <View style={s.emptyIconWrap}>
                <Ionicons name="cube-outline" size={56} color={Colors.primary} />
              </View>
              <Text style={s.emptyTitle}>لا توجد طلبات نقل مطابقة</Text>
              <Text style={s.emptySub}>لم نتمكن من العثور على أي شحنات أو طلبات تتطابق مع معايير البحث الحالية الخاصة بك. جرب تغيير الفلاتر لتوسيع نطاق البحث.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={s.cardWrapper}>
              <TransportRequestCard 
                request={item as any} 
                maxPills={5}
                onPress={() => router.push(`/transport/${(item as any).id}` as any)} 
              />
            </View>
          )}
        />
      )}

      {/* DROPDOWNS */}
      <Modal
        visible={!!activeDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveDropdown(null)}
      >
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setActiveDropdown(null)}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                {activeDropdown === 'fromGovernorate' ? 'مدينة الانطلاق' :
                 activeDropdown === 'toGovernorate' ? 'مدينة الوصول' :
                 activeDropdown === 'status' ? 'حالة الطلب' : 
                 activeDropdown === 'timingType' ? 'الموعد' : 
                 activeDropdown === 'budget' ? 'الميزانية' : 
                 activeDropdown === 'requiresHelper' ? 'عمال تحميل وتنزيل' : ''}
              </Text>
              <TouchableOpacity onPress={() => setActiveDropdown(null)}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {(activeDropdown === 'fromGovernorate' || activeDropdown === 'toGovernorate') && (
              <FlatList
                data={GOVERNORATE_OPTIONS}
                keyExtractor={(item) => item.value}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalOptionRow}
                    onPress={() => {
                      if (activeDropdown === 'fromGovernorate') {
                        setFilters({ ...filters, fromGovernorate: item.labelAr });
                      } else {
                        setFilters({ ...filters, toGovernorate: item.labelAr });
                      }
                      setActiveDropdown(null);
                    }}
                  >
                    <Text style={[
                      s.modalOptionTxt, 
                      ((activeDropdown === 'fromGovernorate' && filters.fromGovernorate === item.labelAr) || 
                       (activeDropdown === 'toGovernorate' && filters.toGovernorate === item.labelAr)) 
                       && s.modalOptionTxtActive
                    ]}>
                      {item.labelAr}
                    </Text>
                    {((activeDropdown === 'fromGovernorate' && filters.fromGovernorate === item.labelAr) || 
                      (activeDropdown === 'toGovernorate' && filters.toGovernorate === item.labelAr)) 
                      && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                )}
              />
            )}

            {activeDropdown === 'status' && (
              <FlatList
                data={STATUS_OPTIONS}
                keyExtractor={(item) => item.value}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalOptionRow}
                    onPress={() => {
                      if (!item.value) {
                        const newFilters = { ...filters };
                        delete newFilters.status;
                        setFilters(newFilters);
                      } else {
                        setFilters({ ...filters, status: item.value });
                      }
                      setActiveDropdown(null);
                    }}
                  >
                    <Text style={[s.modalOptionTxt, (filters.status === item.value || (!filters.status && !item.value)) && s.modalOptionTxtActive]}>
                      {item.label}
                    </Text>
                    {(filters.status === item.value || (!filters.status && !item.value)) && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                )}
              />
            )}

            {activeDropdown === 'timingType' && (
              <FlatList
                data={TIMING_OPTIONS}
                keyExtractor={(item) => item.value}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalOptionRow}
                    onPress={() => {
                      if (!item.value) {
                        const newFilters = { ...filters };
                        delete newFilters.timingType;
                        setFilters(newFilters);
                      } else {
                        setFilters({ ...filters, timingType: item.value as any });
                      }
                      setActiveDropdown(null);
                    }}
                  >
                    <Text style={[s.modalOptionTxt, (filters.timingType === item.value || (!filters.timingType && !item.value)) && s.modalOptionTxtActive]}>
                      {item.label}
                    </Text>
                    {(filters.timingType === item.value || (!filters.timingType && !item.value)) && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                )}
              />
            )}

            {activeDropdown === 'budget' && (
              <FlatList
                data={BUDGET_RANGES}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalOptionRow}
                    onPress={() => {
                      if (item.id === 'all') {
                        const newFilters = { ...filters };
                        delete newFilters.budgetMin;
                        delete newFilters.budgetMax;
                        setFilters(newFilters);
                      } else {
                        setFilters({ ...filters, budgetMin: item.min, budgetMax: item.max });
                      }
                      setActiveDropdown(null);
                    }}
                  >
                    <Text style={[s.modalOptionTxt, (filters.budgetMax === item.max || (!filters.budgetMax && item.id === 'all')) && s.modalOptionTxtActive]}>
                      {item.label}
                    </Text>
                    {(filters.budgetMax === item.max || (!filters.budgetMax && item.id === 'all')) && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                )}
              />
            )}

            {activeDropdown === 'requiresHelper' && (
              <FlatList
                data={HELPER_OPTIONS}
                keyExtractor={(item) => String(item.value)}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalOptionRow}
                    onPress={() => {
                      if (item.value === null) {
                        const newFilters = { ...filters };
                        delete newFilters.requiresHelper;
                        setFilters(newFilters);
                      } else {
                        setFilters({ ...filters, requiresHelper: item.value });
                      }
                      setActiveDropdown(null);
                    }}
                  >
                    <Text style={[s.modalOptionTxt, (filters.requiresHelper === item.value || (filters.requiresHelper === undefined && item.value === null)) && s.modalOptionTxtActive]}>
                      {item.label}
                    </Text>
                    {(filters.requiresHelper === item.value || (filters.requiresHelper === undefined && item.value === null)) && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <TransportFiltersModal
        visible={isFilterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        currentFilters={filters}
        onApply={handleApplyAdvancedFilters}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  listHeader: {
    backgroundColor: '#ffffff',
    marginBottom: Spacing.space2,
  },
  resultsCountBar: {
    paddingHorizontal: Spacing.space4,
    marginTop: Spacing.space2,
    marginBottom: Spacing.space1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },
  clearFiltersText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.error,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  countBadge: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  countBadgeText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: '#64748b',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  listContent: {
    paddingBottom: 120, // increased for safe area
  },
  cardWrapper: {
    paddingHorizontal: 16,
    marginBottom: 16,
    width: '100%',
  },
  skeletonGrid: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  fullCard: { width: '100%' },

  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyIconWrap: {
    width: 100, height: 100,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  emptyIconWrapError: {
    width: 100, height: 100,
    borderRadius: 50,
    backgroundColor: '#fef2f2',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontFamily: 'Almarai_800ExtraBold', 
    fontSize: 22, color: '#0f172a',
    marginBottom: 12,
  },
  emptySub: {
    fontFamily: 'Almarai_400Regular', 
    fontSize: 15, color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 100,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryBtnTxt: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 15, color: '#fff',
    lineHeight: 20,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxHeight: '65%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.space4,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
      android: { elevation: 10 },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.space3,
    paddingBottom: Spacing.space3,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontFamily: 'Almarai_800ExtraBold', 
    fontSize: 16, color: Colors.text,
  },
  modalOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  modalOptionTxt: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 15, color: Colors.text2,
  },
  modalOptionTxtActive: {
    color: Colors.primary,
  },
});
