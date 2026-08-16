import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Platform,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated from 'react-native-reanimated';

import { useInfiniteBuses } from '../../src/hooks/useBuses';
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav';
import { OMAN_LOCATIONS } from '../../src/constants/locations';
import { BUS_LISTING_TYPES, BUS_TYPES, BUS_MAKES } from '../../src/constants/buses';

// Components
import { BrowseHeader } from '../../src/components/ui/BrowseHeader';
import { ListingTabs } from '../../src/components/ui/ListingTabs';
import { CollapsibleSubHeader } from '../../src/components/ui/CollapsibleSubHeader';
import { QuickFilters } from '../../src/components/ui/QuickFilters';
import { BusCard } from '../../src/components/buses/BusCard';
import { BusFilterBottomSheet, BusFilters } from '../../src/components/filters/BusFilterBottomSheet';
import { SkeletonCard } from '../../src/components/ui/SkeletonCard';
import { SupportHelpButton } from '../../src/components/ui/SupportHelpButton';

import { Colors } from '../../src/constants/colors';
import { Spacing } from '../../src/constants/spacing';
import { Radius } from '../../src/constants/radius';

const CAPACITIES = [10, 15, 30, 45, 50];
const CAPACITY_OPTIONS = CAPACITIES.map(c => ({ label: `+ ${c} مقعد`, value: c }));

const GOVERNORATE_OPTIONS = OMAN_LOCATIONS.map(g => ({
  labelAr: g.labelAr,
  value: g.labelAr
}));

const DROPDOWN_FILTERS = [
  { id: 'governorate', label: 'المدينة', icon: 'location-outline' },
  { id: 'make', label: 'الماركة', icon: 'bus-outline' },
  { id: 'capacity', label: 'السعة', icon: 'people-outline' },
  { id: 'busType', label: 'الفئة', icon: 'list-outline' },
  { id: 'sort', label: 'الترتيب', icon: 'swap-vertical-outline' },
];

const SORT_OPTIONS = [
  { id: 'newest', label: 'الأحدث أولاً' },
  { id: 'popular', label: 'الأكثر شيوعاً' },
  { id: 'price_asc', label: 'السعر: الأقل للأعلى' },
  { id: 'price_desc', label: 'السعر: الأعلى للأقل' }
];

export default function BusesBrowseScreen() {
  const insets = useSafeAreaInsets();
  const { scrollHandler } = useScrollAwareNav();
  const searchParams = useLocalSearchParams<{ type?: string }>();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [filters, setFilters] = useState<BusFilters & { governorate?: string }>(() => {
    const initialFilters: BusFilters & { governorate?: string } = {};
    if (searchParams.type) {
      initialFilters.busListingType = searchParams.type.toUpperCase() as any;
    }
    return initialFilters;
  });
  
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Combine params
  const queryFilters = useMemo(() => {
    const params = { ...filters };
    if (debouncedSearch.trim()) {
      (params as any).search = debouncedSearch;
    }
    return params;
  }, [debouncedSearch, filters]);

  const { 
    data, 
    isLoading, 
    isError, 
    refetch, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useInfiniteBuses(queryFilters as any);

  const listings = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  const activeFiltersCount = Object.entries(filters).filter(([k, v]) => Boolean(v) && k !== 'sort').length;

  const handleClearAll = () => setFilters(prev => ({ sort: prev.sort }));

  const quickFilterItems = DROPDOWN_FILTERS.map(qf => {
    let isActive = false;
    let displayLabel = qf.label;

    if (qf.id === 'governorate') {
      isActive = !!filters.governorate;
      if (isActive) displayLabel = filters.governorate as string;
    } else if (qf.id === 'make') {
      isActive = !!filters.make;
      if (isActive) displayLabel = BUS_MAKES.find(m => m.id === filters.make)?.label || filters.make as string;
    } else if (qf.id === 'capacity') {
      isActive = !!filters.capacityMin;
      if (isActive) displayLabel = `+ ${filters.capacityMin} مقعد`;
    } else if (qf.id === 'busType') {
      isActive = !!filters.busType;
      if (isActive) displayLabel = BUS_TYPES.find(b => b.id === filters.busType)?.label || filters.busType as string;
    } else if (qf.id === 'sort') {
      isActive = !!filters.sort && filters.sort !== 'newest';
      if (isActive) {
        displayLabel = SORT_OPTIONS.find(s => s.id === filters.sort)?.label || qf.label;
      }
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
    if (id === 'governorate') delete newFilters.governorate;
    if (id === 'make') delete newFilters.make;
    if (id === 'capacity') { delete newFilters.capacityMin; }
    if (id === 'busType') delete newFilters.busType;
    if (id === 'sort') newFilters.sort = 'newest';
    setFilters(newFilters);
  };

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={s.skeletonGrid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={s.fullCard}>
              <SkeletonCard />
            </View>
          ))}
        </View>
      );
    }
    if (isError) {
      return (
        <View style={s.center}>
          <Text style={s.errorTxt}>حدث خطأ أثناء تحميل الحافلات</Text>
          <TouchableOpacity onPress={() => refetch()} style={s.retryBtn}>
            <Text style={s.retryTxt}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={s.emptyState}>
        <Ionicons name="bus-outline" size={64} color={Colors.borderStrong || '#E2E8F0'} />
        <Text style={s.emptyTitle}>لا توجد حافلات مطابقة</Text>
        <Text style={s.emptySubtitle}>جرب تغيير الفلاتر أو كلمة البحث للعثور على نتائج أخرى</Text>
      </View>
    );
  };

  return (
    <View style={s.root}>
      {/* ── HEADER ── */}
      <BrowseHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="ابحث في الحافلات..."
        activeFiltersCount={activeFiltersCount}
        onFilterPress={() => setIsFilterVisible(true)}
      />

      <CollapsibleSubHeader>
        <ListingTabs
          tabs={BUS_LISTING_TYPES}
          activeTabId={filters.busListingType || ''}
          onChangeTab={(id) => {
            if (id === filters.busListingType) {
               const newFilters = { ...filters };
               delete newFilters.busListingType;
               setFilters(newFilters);
            } else {
               setFilters({ ...filters, busListingType: id as any });
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
      <Animated.FlatList
        key="list-1-column"
        data={listings ?? []}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={[
          s.listContent,
          { paddingTop: Spacing.space2 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && listings.length > 0}
            onRefresh={refetch}
            colors={[Colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={{ paddingBottom: Spacing.space3, paddingHorizontal: Spacing.space4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {activeFiltersCount > 0 ? (
              <TouchableOpacity onPress={handleClearAll}>
                <Text style={{ fontFamily: 'Almarai_700Bold', fontSize: 13, color: Colors.error }}>
                  مسح الفلاتر
                </Text>
              </TouchableOpacity>
            ) : <View />}

            <View style={{ backgroundColor: '#f8fafc', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#f1f5f9' }}>
              <Ionicons name="bus-outline" size={14} color="#64748b" />
              <Text style={{ fontFamily: 'Almarai_700Bold', fontSize: 12, color: '#64748b' }}>
                {listings?.length || 0} حافلة متاحة
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={renderEmptyState}
        renderItem={({ item }: any) => (
          <View style={s.cardWrapper}>
            <BusCard item={item} onPress={() => router.push(`/buses/${item.id}` as any)} fullWidth showChips maxChips={4} />
          </View>
        )}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => (
          <>
            {isFetchingNextPage && (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Almarai_700Bold', color: Colors.textMuted }}>جاري تحميل المزيد...</Text>
              </View>
            )}
            {listings && listings.length > 0 && (
              <SupportHelpButton />
            )}
          </>
        )}
      />

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
                {activeDropdown === 'governorate' ? 'المدينة' :
                 activeDropdown === 'make' ? 'الماركة' :
                 activeDropdown === 'capacity' ? 'سعة الحافلة' : 
                 activeDropdown === 'busType' ? 'فئة الحافلة' : 
                 activeDropdown === 'sort' ? 'الترتيب' : ''}
              </Text>
              <TouchableOpacity onPress={() => setActiveDropdown(null)}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {activeDropdown === 'governorate' && (
              <FlatList
                data={GOVERNORATE_OPTIONS}
                keyExtractor={(item) => item.value}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalOptionRow}
                    onPress={() => {
                      setFilters({ ...filters, governorate: item.labelAr });
                      setActiveDropdown(null);
                    }}
                  >
                    <Text style={[s.modalOptionTxt, filters.governorate === item.labelAr && s.modalOptionTxtActive]}>
                      {item.labelAr}
                    </Text>
                    {filters.governorate === item.labelAr && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                )}
              />
            )}

            {activeDropdown === 'make' && (
              <FlatList
                data={BUS_MAKES}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalOptionRow}
                    onPress={() => {
                      setFilters({ ...filters, make: item.id });
                      setActiveDropdown(null);
                    }}
                  >
                    <Text style={[s.modalOptionTxt, filters.make === item.id && s.modalOptionTxtActive]}>
                      {item.label}
                    </Text>
                    {filters.make === item.id && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                )}
              />
            )}

            {activeDropdown === 'capacity' && (
              <FlatList
                data={CAPACITY_OPTIONS}
                keyExtractor={(item) => item.value.toString()}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalOptionRow}
                    onPress={() => {
                      setFilters({ ...filters, capacityMin: item.value });
                      setActiveDropdown(null);
                    }}
                  >
                    <Text style={[s.modalOptionTxt, filters.capacityMin === item.value && s.modalOptionTxtActive]}>
                      {item.label}
                    </Text>
                    {filters.capacityMin === item.value && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                )}
              />
            )}

            {activeDropdown === 'busType' && (
              <FlatList
                data={BUS_TYPES}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalOptionRow}
                    onPress={() => {
                      setFilters({ ...filters, busType: item.id });
                      setActiveDropdown(null);
                    }}
                  >
                    <Text style={[s.modalOptionTxt, filters.busType === item.id && s.modalOptionTxtActive]}>
                      {item.label}
                    </Text>
                    {filters.busType === item.id && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                )}
              />
            )}

            {activeDropdown === 'sort' && (
              <FlatList
                data={SORT_OPTIONS}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalOptionRow}
                    onPress={() => {
                      setFilters({ ...filters, sort: item.id as any });
                      setActiveDropdown(null);
                    }}
                  >
                    <Text style={[s.modalOptionTxt, (filters.sort === item.id || (!filters.sort && item.id === 'newest')) && s.modalOptionTxtActive]}>
                      {item.label}
                    </Text>
                    {(filters.sort === item.id || (!filters.sort && item.id === 'newest')) && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <BusFilterBottomSheet
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        currentFilters={filters}
        onApply={(appliedFilters) => setFilters(appliedFilters)}
      />

    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  listContent: {
    paddingBottom: Spacing.space6,
  },
  cardWrapper: {
    paddingHorizontal: Spacing.space4,
    marginBottom: Spacing.space4,
  },
  skeletonGrid: {
    padding: Spacing.space4,
    gap: Spacing.space4,
  },
  fullCard: {
    marginBottom: Spacing.space2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  errorTxt: {
    fontFamily: 'Almarai_700Bold',  color: Colors.error || '#d9534f',
    marginBottom: Spacing.space3,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.space5,
    paddingVertical: Spacing.space2,
    borderRadius: Radius.lg,
  },
  retryTxt: {
    fontFamily: 'Almarai_700Bold',  color: Colors.white,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: Spacing.space5,
  },
  emptyTitle: {
    fontFamily: 'Almarai_800ExtraBold',  fontSize: 18,
    color: Colors.text,
    marginTop: Spacing.space4,
    marginBottom: Spacing.space2,
  },
  emptySubtitle: {
    fontFamily: 'Almarai_400Regular',  fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.space6,
    lineHeight: 22,
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
