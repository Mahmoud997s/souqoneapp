import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Platform,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

import { useEquipment } from '../../src/hooks/useEquipment';
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav';
import { OMAN_LOCATIONS } from '../../src/constants/locations';
import { locationsApi } from '../../src/api/locations';
import { GovernorateRef } from '../../src/types/location.types';
import { EQUIPMENT_TYPES } from '../../src/utils/equipment-mappers';
import { EQUIPMENT_CONDITIONS } from '../../src/constants/equipment';
import {
  buildEquipmentQueryParams,
  clearEquipmentFilter,
  mergeEquipmentRouteParams,
  applyEquipmentFilter,
  EquipmentDropdownKind,
  EQUIPMENT_PRICE_RANGES,
  EQUIPMENT_YEAR_RANGES,
  EQUIPMENT_HOURS_RANGES,
} from '../../src/utils/browse-filters/equipmentBrowseFilters';

// Components
import { BrowseHeader } from '../../src/components/ui/BrowseHeader';
import { ListingTabs } from '../../src/components/ui/ListingTabs';
import { CollapsibleSubHeader } from '../../src/components/ui/CollapsibleSubHeader';
import { QuickFilters } from '../../src/components/ui/QuickFilters';
import { EquipmentVisualFilters } from '../../src/components/equipment/EquipmentVisualFilters';
import { EquipCard } from '../../src/components/cards/EquipCard';
import { EquipmentFilterBottomSheet, EquipmentFilterState } from '../../src/components/filters/EquipmentFilterBottomSheet';
import { QuickFilterModal } from '../../src/components/filters/QuickFilterModal';
import { SkeletonCard } from '../../src/components/ui/SkeletonCard';
import { EquipmentBottomBar } from '../../src/components/equipment/EquipmentBottomBar';
import { UNIFIED_BOTTOM_BAR_HEIGHT } from '../../src/components/navigation/UnifiedBottomBar';
import { SectionFooterAction } from '../../src/components/ui/SectionFooterAction';
import { CATEGORY_ICONS } from '../../src/constants/categoryIcons';
import { UnifiedCardItem } from '../../src/types/unified-card.types';
import { navigateToEquipmentForm } from '../../src/components/ui/DraftResumePrompt';

// Constants
import { Colors } from '../../src/constants/colors';
import { Spacing } from '../../src/constants/spacing';
import { Radius } from '../../src/constants/radius';

type FilterState = EquipmentFilterState;

const LISTING_TYPES = [
  { id: 'EQUIPMENT_SALE', label: 'للبيع' },
  { id: 'EQUIPMENT_RENT', label: 'للإيجار' },
  { id: 'EQUIPMENT_WANTED', label: 'مطلوب' },
];

const DROPDOWN_FILTERS = [
  { id: 'governorate', label: 'المدينة', icon: 'location-outline' },
  { id: 'category', label: 'نوع المعدة', icon: 'hardware-chip-outline' },
  { id: 'condition', label: 'الحالة', icon: 'construct-outline' },
  { id: 'price', label: 'السعر', icon: 'wallet-outline' },
  { id: 'year', label: 'سنة الصنع', icon: 'calendar-outline' },
  { id: 'hours', label: 'ساعات العمل', icon: 'time-outline' },
];



const CATEGORIES_ARRAY = Object.entries(EQUIPMENT_TYPES).map(([key, value]) => ({
  id: key,
  name: value.label,
}));

const CONDITIONS = EQUIPMENT_CONDITIONS.map((c) => ({
  id: c.id,
  name: c.label,
}));

const PRICE_RANGES = EQUIPMENT_PRICE_RANGES;
const YEAR_RANGES = EQUIPMENT_YEAR_RANGES;
const HOURS_RANGES = EQUIPMENT_HOURS_RANGES;

export default function EquipmentBrowseScreen() {
  const [governorates, setGovernorates] = useState<GovernorateRef[]>([]);
  useEffect(() => {
    locationsApi.getGovernorates().then(setGovernorates).catch(() => setGovernorates([]));
  }, []);
  const insets = useSafeAreaInsets();
  const { scrollHandler } = useScrollAwareNav();
  const searchParams = useLocalSearchParams<{ type?: string; equipmentType?: string }>();

  const listRef = useRef<FlatList<UnifiedCardItem>>(null);
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [filters, setFilters] = useState<FilterState>(() => {
    const initialFilters: FilterState = {};
    const t = searchParams.type?.toLowerCase();
    
    if (t === 'used') {
      initialFilters.condition = 'USED';
      initialFilters.conditionId = 'USED';
      initialFilters.listingType = 'EQUIPMENT_SALE';
    } else if (t === 'new') {
      initialFilters.condition = 'NEW';
      initialFilters.conditionId = 'NEW';
      initialFilters.listingType = 'EQUIPMENT_SALE';
    } else if (t === 'rental' || t === 'rent') {
      initialFilters.listingType = 'EQUIPMENT_RENT';
    } else if (t === 'sale') {
      initialFilters.listingType = 'EQUIPMENT_SALE';
    }
    
    return initialFilters;
  });

  // G-07: Merge incoming route params into existing filter state without wiping selections
  useEffect(() => {
    setFilters((prev) => mergeEquipmentRouteParams(prev, searchParams as Record<string, string | undefined>));
  }, [searchParams.type, searchParams.equipmentType]);
  
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<EquipmentDropdownKind | null>(null);

  const activeDropdownData = useMemo(() => {
    if (!activeDropdown) return null;

    switch (activeDropdown) {
      case 'governorate':
        return {
          title: 'المدينة',
          options: governorates.map((item) => ({
            // Ensures governorateId: item.id is used for location filters
            id: String(item.id),
            label: item.nameAr,
          })),
          selectedId: filters.governorateId ? String(filters.governorateId) : undefined,
        };
      case 'category':
        return {
          title: 'نوع المعدة',
          options: CATEGORIES_ARRAY.map((c) => ({ id: c.id, label: c.name })),
          selectedId: filters.equipmentType || filters.categoryId,
        };
      case 'condition':
        return {
          title: 'حالة المعدة',
          options: CONDITIONS.map((c) => ({ id: c.id, label: c.name })),
          selectedId: filters.condition || filters.conditionId,
        };
      case 'price':
        return {
          title: 'السعر',
          options: PRICE_RANGES.map((p) => ({ id: p.id, label: p.label })),
          selectedId: filters.priceId || (!filters.priceMax ? 'all' : undefined),
        };
      case 'year':
        return {
          title: 'سنة الصنع',
          options: YEAR_RANGES.map((y) => ({ id: y.id, label: y.label })),
          selectedId: filters.yearId || (!filters.yearMax ? 'all' : undefined),
        };
      case 'hours':
        return {
          title: 'ساعات العمل',
          options: HOURS_RANGES.map((h) => ({ id: h.id, label: h.label })),
          selectedId: filters.hoursId || (!filters.hoursMax ? 'all' : undefined),
        };
      default:
        return null;
    }
  }, [activeDropdown, governorates, filters]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Combine query parameters - maps ONLY backend QueryEquipmentListingsDto fields using pure module
  const queryParams = useMemo(() => {
    return buildEquipmentQueryParams(filters, debouncedSearch);
  }, [debouncedSearch, filters]);

  // G-06: Scroll to top on filter / query change
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [queryParams]);

  // Fetch Listings
  const { data: listings, isLoading, isError, refetch } = useEquipment(queryParams);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    const skipKeys = new Set(['priceId', 'categoryId', 'conditionId', 'yearId', 'hoursId']);
    Object.entries(filters).forEach(([key, val]) => {
      if (skipKeys.has(key)) return;
      if (val !== undefined && val !== '') count++;
    });
    return count;
  }, [filters]);

  const handleApplyFilters = (appliedFilters: FilterState) => {
    setFilters(appliedFilters);
  };

  const handleClearAll = () => {
    setFilters({});
    setSearchQuery('');
  };

  const quickFilterItems = DROPDOWN_FILTERS.map(qf => {
    let isActive = false;
    let displayLabel = qf.label;

    if (qf.id === 'governorate') {
      isActive = !!filters.governorateId;
      if (isActive) displayLabel = governorates.find(g => g.id === filters.governorateId)?.nameAr || 'المدينة';
    } else if (qf.id === 'category') {
      isActive = !!filters.equipmentType;
      if (isActive) displayLabel = CATEGORIES_ARRAY.find(t => t.id === filters.equipmentType)?.name || qf.label;
    } else if (qf.id === 'condition') {
      isActive = !!filters.condition;
      if (isActive) displayLabel = CONDITIONS.find(t => t.id === filters.condition)?.name || qf.label;
    } else if (qf.id === 'price') {
      isActive = !!filters.priceMax || !!filters.priceMin;
      if (isActive) {
         const found = PRICE_RANGES.find(b => b.max === (filters.priceMax)?.toString() || b.id === (filters as any).priceId);
         if (found) displayLabel = found.label;
         else displayLabel = filters.priceMax ? `أقل من ${filters.priceMax}` : qf.label;
      }
    } else if (qf.id === 'year') {
      isActive = !!(filters as any).yearMax || !!(filters as any).yearMin;
      if (isActive) {
         const found = YEAR_RANGES.find(b => b.max === (filters as any).yearMax?.toString() || b.id === (filters as any).yearId);
         if (found) displayLabel = found.label;
      }
    } else if (qf.id === 'hours') {
      isActive = !!(filters as any).hoursMax || !!(filters as any).hoursMin;
      if (isActive) {
         const found = HOURS_RANGES.find(b => b.max === (filters as any).hoursMax?.toString() || b.id === (filters as any).hoursId);
         if (found) displayLabel = found.label;
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
    setFilters((prev) => clearEquipmentFilter(prev, id));
  };

  const handleSelectVisualFilter = (
    type: 'category' | 'make' | 'city' | 'price' | 'condition',
    valueId: string,
    valueName?: string,
    min?: number,
    max?: number,
    extraId?: number
  ) => {
    const newFilters = { ...filters };
    if (type === 'category') {
      if (newFilters.equipmentType === valueId || !valueId) {
        delete newFilters.equipmentType;
        delete newFilters.categoryId;
      } else {
        newFilters.equipmentType = valueId;
        newFilters.categoryId = valueId;
      }
    } else if (type === 'make') {
      if (newFilters.make === valueId || !valueId) {
        delete newFilters.make;
      } else {
        newFilters.make = valueId;
      }
    } else if (type === 'city') {
      if (newFilters.city === valueName || newFilters.city === valueId || !valueId) {
        delete newFilters.city;
        delete newFilters.governorateId;
      } else {
        newFilters.city = valueName || valueId;
        if (extraId) newFilters.governorateId = extraId;
      }
    } else if (type === 'price') {
      if (newFilters.priceId === valueId || !valueId) {
        delete newFilters.priceId;
        delete newFilters.priceMin;
        delete newFilters.priceMax;
      } else {
        newFilters.priceId = valueId;
        newFilters.priceMin = min !== undefined ? String(min) : undefined;
        newFilters.priceMax = max !== undefined ? String(max) : undefined;
      }
    } else if (type === 'condition') {
      if (newFilters.condition === valueId || !valueId) {
        delete newFilters.condition;
        delete newFilters.conditionId;
      } else {
        newFilters.condition = valueId;
        newFilters.conditionId = valueId;
      }
    }
    setFilters(newFilters);
  };

  return (
    <View style={s.root}>
      {/* ── HEADER ── */}
      <BrowseHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="ابحث عن معدات..."
        activeFiltersCount={activeFiltersCount}
        onFilterPress={() => setIsFilterVisible(true)}
      />

      <CollapsibleSubHeader>
        <ListingTabs
          tabs={LISTING_TYPES}
          activeTabId={filters.listingType || ''}
          onChangeTab={(id) => {
            if (id === filters.listingType) {
               const newFilters = { ...filters };
               delete newFilters.listingType;
               setFilters(newFilters);
            } else {
               setFilters({ ...filters, listingType: id as string });
            }
          }}
        />
        <QuickFilters
          filters={quickFilterItems}
          onFilterPress={(id) => setActiveDropdown(id as EquipmentDropdownKind)}
          onClearFilter={handleClearQuickFilter}
        />
      </CollapsibleSubHeader>

      {/* ── LISTINGS LIST ── */}
      {isLoading ? (
        <View style={s.skeletonGrid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={s.fullCard}>
              <SkeletonCard />
            </View>
          ))}
        </View>
      ) : isError ? (
        <View style={s.emptyContainer}>
          <View style={s.emptyIconWrapError}>
            <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          </View>
          <Text style={s.emptyTitle}>حدث خطأ!</Text>
          <Text style={s.emptySub}>تعذر جلب البيانات، يرجى المحاولة لاحقاً.</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => refetch()}>
            <Text style={s.retryBtnTxt}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.FlatList
          ref={listRef}
          data={listings || []}
          keyExtractor={(item) => (item as any).id}
          contentContainerStyle={[
            s.listContent,
            {
              paddingTop: Spacing.space2,
              paddingBottom: UNIFIED_BOTTOM_BAR_HEIGHT + Math.max(insets.bottom, 12) + 8,
            },
          ]}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading && ((listings as any)?.length > 0)} onRefresh={refetch} tintColor={Colors.equipmentPrimary} />
          }
          ListHeaderComponent={
            <View style={s.listHeader}>
              <EquipmentVisualFilters
                selectedCategoryId={filters.equipmentType || filters.categoryId}
                selectedMake={filters.make}
                selectedCity={filters.city}
                selectedPriceId={filters.priceId}
                selectedConditionId={filters.condition || filters.conditionId}
                onSelectFilter={handleSelectVisualFilter}
                onViewAll={() => setIsFilterVisible(true)}
              />

              <View style={{ paddingBottom: Spacing.space3, paddingHorizontal: Spacing.space4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.space2 }}>
                {activeFiltersCount > 0 ? (
                  <TouchableOpacity onPress={handleClearAll}>
                    <Text style={{ fontFamily: 'Almarai_700Bold', fontSize: 13, color: Colors.error }}>
                      مسح الفلاتر
                    </Text>
                  </TouchableOpacity>
                ) : <View />}

                <View style={{ backgroundColor: '#f8fafc', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#f1f5f9' }}>
                  <Ionicons name="construct-outline" size={14} color="#64748b" />
                  <Text style={{ fontFamily: 'Almarai_700Bold', fontSize: 12, color: '#64748b' }}>
                    {listings?.length || 0} معدة متوفرة
                  </Text>
                </View>
              </View>
            </View>
          }
          ListFooterComponent={() => (
            !isLoading && listings && listings.length > 0 ? (
              <SectionFooterAction
                title="لديك معدة ثقيلة للبيع أو للإيجار؟"
                subtitle="انشر إعلانك الآن ووصل لآلاف المقاولين والشركات"
                buttonText="أضف معدتك"
                iconName="construct-outline"
                iconImage={CATEGORY_ICONS.equipment}
                onPress={() => navigateToEquipmentForm('push')}
              />
            ) : null
          )}
          ListEmptyComponent={
            <View style={s.emptyContainer}>
              <View style={s.emptyIconWrap}>
                <Ionicons name="search-outline" size={48} color={Colors.equipmentPrimary} />
              </View>
              <Text style={s.emptyTitle}>لا توجد معدات مطابقة</Text>
              <Text style={s.emptySub}>لم نعثر على أي معدات تتطابق مع معايير البحث الخاصة بك.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={s.cardWrapper}>
              <EquipCard
                item={item as any}
                onPress={() => router.push(`/equipment/${item.id}` as any)}
                fullWidth
                showChips
                maxChips={3}
              />
            </View>
          )}
        />
      )}

      <QuickFilterModal
        visible={activeDropdown !== null}
        title={activeDropdownData?.title || ''}
        options={activeDropdownData?.options || []}
        selectedId={activeDropdownData?.selectedId}
        onSelect={(id) => {
          if (activeDropdown) {
            setFilters((prev) => applyEquipmentFilter(prev, activeDropdown, id));
          }
        }}
        onClose={() => setActiveDropdown(null)}
        accentColor={Colors.equipmentPrimary}
      />

      {/* Filter Bottom Sheet */}
      <EquipmentFilterBottomSheet
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        initialFilters={filters}
        onApplyFilters={handleApplyFilters}
      />

      <EquipmentBottomBar />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listHeader: {
    paddingBottom: Spacing.space1,
  },
  listContent: {},
  cardWrapper: {
    paddingHorizontal: 16,
    marginBottom: 16,
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
    width: 96, height: 96,
    borderRadius: 48,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  emptyIconWrapError: {
    width: 96, height: 96,
    borderRadius: 48,
    backgroundColor: '#fef2f2',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: 'Almarai_800ExtraBold', 
    fontSize: 20, color: '#0f172a',
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: 'Almarai_400Regular', 
    fontSize: 15, color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: Colors.equipmentPrimary,
    paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 12,
  },
  retryBtnTxt: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 15, color: '#fff',
  },
});
