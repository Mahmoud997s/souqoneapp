import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Platform,
  ActivityIndicator,
  ScrollView,
  Modal,
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
import { LinearGradient } from 'expo-linear-gradient';

import { useInfiniteCarListings } from '../../src/hooks/useCarListings';
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav';
import { useDebounce } from '../../src/hooks/useDebounce';
import { ActionBanner } from '../../src/components/ui/ActionBanner';
import {
  DROPDOWN_FILTERS,
  SORT_OPTIONS,
  PRICE_RANGES,
  YEARS,
  LISTING_TYPES,
  CAR_TYPES,
} from '../../src/constants/browseFilters';
import { QuickFilterModal } from '../../src/components/filters/QuickFilterModal';
import { BrowseEmptyState } from '../../src/components/cars/BrowseEmptyState';
import { useNavVisibility } from '../../src/context/NavVisibilityContext';
import { BrowseHeader } from '../../src/components/ui/BrowseHeader';
import { ListingTabs } from '../../src/components/ui/ListingTabs';
import { QuickFilters, QuickFilterItem } from '../../src/components/ui/QuickFilters';
import { CollapsibleSubHeader } from '../../src/components/ui/CollapsibleSubHeader';
import { useBrands } from '../../src/hooks/useCars';
import { GOVERNORATE_OPTIONS } from '../../src/constants/filters';

// Components
import { CarCard } from '../../src/components/cars/CarCard';
import { CarsVisualFilters } from '../../src/components/cars/CarsVisualFilters';
import { FilterBottomSheet } from '../../src/components/filters/FilterBottomSheet';
import { SkeletonCard } from '../../src/components/ui/SkeletonCard';

// Constants
import { Colors } from '../../src/constants/colors';
import { Spacing } from '../../src/constants/spacing';
import { Radius } from '../../src/constants/radius';

interface FilterState {
  listingType?: string;
  governorate?: string;
  city?: string;
  governorateId?: number;
  wilayaId?: number;
  priceMin?: string;
  priceMax?: string;
  bodyType?: string;
  transmission?: string;
  condition?: string;
  fuelType?: string;
  yearMin?: string;
  yearMax?: string;
  sortBy?: string;
  sortOrder?: string;
  makeId?: string;
  make?: string;
  modelId?: string;
  model?: string;
  isPremium?: boolean;
  trim?: string;
}

export default function CarsBrowseScreen() {
  const insets = useSafeAreaInsets();
  const { scrollHandler } = useScrollAwareNav();
  const { navHidden } = useNavVisibility();

  const searchParams = useLocalSearchParams<{ type?: string; featured?: string }>();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [selectedBrandId, setSelectedBrandId] = useState<string | undefined>(undefined);
  const [selectedBrandName, setSelectedBrandName] = useState<string | undefined>(undefined);
  
  const [filters, setFilters] = useState<FilterState>(() => {
    const initialFilters: FilterState = {};
    const t = searchParams.type?.toLowerCase();
    
    if (t === 'used') {
      initialFilters.condition = 'USED';
      initialFilters.listingType = 'SALE';
    } else if (t === 'new') {
      initialFilters.condition = 'NEW';
      initialFilters.listingType = 'SALE';
    } else if (t === 'wanted') {
      initialFilters.listingType = 'WANTED';
    } else if (t === 'rental' || t === 'rent') {
      initialFilters.listingType = 'RENTAL';
    } else if (t === 'sale') {
      initialFilters.listingType = 'SALE';
    }
    
    if (searchParams.featured === 'true') {
      initialFilters.isPremium = true;
    }
    
    return initialFilters;
  });
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  
  // Dropdown Modal State
  const [activeDropdown, setActiveDropdown] = useState<'make' | 'city' | 'year' | 'price' | 'type' | 'sort' | null>(null);
  const { data: brands } = useBrands();

  const handleAddCar = () => {
    router.push('/add-listing' as any);
  };

  // Combine query parameters
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      limit: 30,
    };

    if (debouncedSearchQuery.trim()) {
      params.search = debouncedSearchQuery;
    }

    // BrandCarousel selection takes priority
    if (selectedBrandName) {
      params.make = selectedBrandName;
    }

    // Internal/UI-only keys not sent to API
    const skipKeys = new Set(['makeId', 'modelId', 'trim', 'priceId', 'governorate', 'city']);

    // Apply all custom filters
    Object.entries(filters).forEach(([key, val]) => {
      if (skipKeys.has(key)) return;
      if (val !== undefined && val !== '') {
        if (key === 'priceMin' || key === 'priceMax' || key === 'yearMin' || key === 'yearMax') {
          const parsed = parseFloat(val as string);
          if (!isNaN(parsed)) {
            params[key] = parsed;
          }
        } else if (key === 'governorateId' || key === 'wilayaId') {
          const parsed = parseInt(String(val), 10);
          if (!isNaN(parsed) && parsed > 0) {
            params[key] = parsed;
          }
        } else {
          params[key] = val;
        }
      }
    });

    return params;
  }, [debouncedSearchQuery, selectedBrandName, filters]);

  // Fetch Listings
  const { data: infiniteData, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteCarListings(queryParams);
  const listings = useMemo(() => infiniteData?.pages.flatMap(page => page.items) ?? [], [infiniteData]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedBrandId) count++;
    const skipKeys = new Set(['makeId', 'modelId']);
    Object.entries(filters).forEach(([key, val]) => {
      if (skipKeys.has(key)) return;
      if (val !== undefined && val !== '') count++;
    });
    return count;
  }, [selectedBrandId, filters]);

  const quickFilterItems: QuickFilterItem[] = DROPDOWN_FILTERS.map(qf => {
    let isActive = false;
    let displayLabel = qf.label;

    if (qf.id === 'make') {
      isActive = !!filters.make;
      if (isActive) displayLabel = filters.make as string;
    } else if (qf.id === 'city') {
      isActive = !!filters.city;
      if (isActive) displayLabel = filters.city as string;
    } else if (qf.id === 'year') {
      isActive = !!filters.yearMin || !!filters.yearMax;
      if (isActive) displayLabel = filters.yearMin ? String(filters.yearMin) : 'سنة الصنع';
    } else if (qf.id === 'price') {
      isActive = !!filters.priceMax;
      if (isActive) displayLabel = PRICE_RANGES.find(p => p.max === Number(filters.priceMax))?.label || 'السعر';
    } else if (qf.id === 'type') {
      isActive = !!filters.bodyType;
      if (isActive) {
        const foundType = CAR_TYPES.find(t => t.id === filters.bodyType);
        displayLabel = foundType ? foundType.name : (filters.bodyType as string);
      }
    } else if (qf.id === 'sort') {
      isActive = !!filters.sortBy;
      if (isActive) {
        const foundSort = SORT_OPTIONS.find(s => s.sortBy === filters.sortBy && s.sortOrder === filters.sortOrder);
        displayLabel = foundSort ? foundSort.label : 'الترتيب';
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
    if (id === 'make') { delete newFilters.make; delete newFilters.makeId; }
    if (id === 'city') { delete newFilters.city; delete newFilters.wilayaId; delete newFilters.governorateId; delete newFilters.governorate; }
    if (id === 'year') { delete newFilters.yearMin; delete newFilters.yearMax; }
    if (id === 'price') { delete newFilters.priceMin; delete newFilters.priceMax; }
    if (id === 'type') { delete newFilters.bodyType; }
    if (id === 'sort') { delete newFilters.sortBy; delete newFilters.sortOrder; }
    setFilters(newFilters);
  };

  const handleSelectFilter = (
    type: 'make' | 'model' | 'city' | 'price' | 'type',
    valueId: string,
    valueName?: string,
    min?: number,
    max?: number,
    extraId?: number
  ) => {
    if (type === 'make') {
      if (!valueId || valueId === selectedBrandId) {
        setSelectedBrandId(undefined);
        setSelectedBrandName(undefined);
        setFilters(prev => {
          const next = { ...prev };
          delete next.makeId;
          delete next.make;
          delete next.modelId;
          delete next.model;
          delete next.trim;
          return next;
        });
        return;
      }
      setSelectedBrandId(valueId);
      setSelectedBrandName(valueName);
      setFilters(prev => {
        const next = { ...prev };
        next.makeId = valueId;
        next.make = valueName;
        // reset model if make changes
        if (valueId !== prev.makeId) {
          delete next.modelId;
          delete next.model;
          delete next.trim;
        }
        return next;
      });
    } else if (type === 'model') {
      if (!valueId || valueId === filters.modelId) {
        setFilters(prev => {
          const next = { ...prev };
          delete next.modelId;
          delete next.model;
          return next;
        });
        return;
      }
      setFilters(prev => ({ ...prev, modelId: valueId, model: valueName }));
    } else if (type === 'city') {
      if (!valueId || valueId === String(filters.wilayaId)) {
        setFilters(prev => {
          const next = { ...prev };
          delete next.wilayaId;
          delete next.governorateId;
          delete next.city;
          delete next.governorate;
          return next;
        });
        return;
      }
      setFilters(prev => ({ ...prev, wilayaId: Number(valueId), governorateId: extraId, city: valueName }));
    } else if (type === 'price') {
      if (!valueId || valueId === (filters as any).priceId) {
        setFilters(prev => {
          const next = { ...prev };
          delete next.priceMin;
          delete next.priceMax;
          delete (next as any).priceId;
          return next;
        });
        return;
      }
      setFilters(prev => ({
        ...prev,
        priceMin: min !== undefined ? min.toString() : undefined,
        priceMax: max !== undefined ? max.toString() : undefined,
        priceId: valueId,
      }));
    } else if (type === 'type') {
      const upper = valueId.toUpperCase();
      if (!valueId || upper === filters.bodyType) {
        setFilters(prev => {
          const next = { ...prev };
          delete next.bodyType;
          return next;
        });
        return;
      }
      setFilters(prev => ({ ...prev, bodyType: upper }));
    }
  };

  // Keep Carousel synced if user changes brand from FilterSheet
  useEffect(() => {
    if (filters.makeId !== selectedBrandId) {
      setSelectedBrandId(filters.makeId);
      setSelectedBrandName(filters.make);
    }
  }, [filters.makeId, filters.make]);

  const handleApplyFilters = (appliedFilters: FilterState) => {
    setFilters(appliedFilters);
  };

  const handleClearAll = () => {
    setSelectedBrandId(undefined);
    setSelectedBrandName(undefined);
    setFilters({});
    setSearchQuery('');
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
          <Text style={s.errorTxt}>حدث خطأ أثناء تحميل إعلانات السيارات</Text>
          <TouchableOpacity onPress={() => refetch()} style={s.retryBtn}>
            <Text style={s.retryTxt}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={s.emptyState}>
        <Ionicons name="car-outline" size={64} color={Colors.borderStrong} />
        <Text style={s.emptyTitle}>لا توجد سيارات مطابقة</Text>
        <Text style={s.emptySubtitle}>جرب تغيير الفلاتر أو كلمة البحث للعثور على نتائج أخرى</Text>
        {activeFiltersCount > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={s.clearAllBtn}>
            <Text style={s.clearAllBtnText}>إعادة تعيين الكل</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={s.root}>
      <BrowseHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="ابحث في سوق السيارات..."
        activeFiltersCount={activeFiltersCount}
        onFilterPress={() => setIsFilterVisible(!isFilterVisible)}
      />

      <CollapsibleSubHeader>
        <ListingTabs 
          tabs={LISTING_TYPES}
          activeTabId={filters.listingType}
          onChangeTab={(id) => {
            if (id === filters.listingType) {
              const newFilters = { ...filters };
              delete newFilters.listingType;
              setFilters(newFilters);
            } else {
              setFilters({ ...filters, listingType: id });
            }
          }}
          onClearTab={() => {
            const newFilters = { ...filters };
            delete newFilters.listingType;
            setFilters(newFilters);
          }}
        />
        <QuickFilters 
          filters={quickFilterItems}
          onFilterPress={(id) => setActiveDropdown(id as any)}
          onClearFilter={handleClearQuickFilter}
        />
      </CollapsibleSubHeader>

      <Animated.FlatList
        key="list-1-column"
        data={listings ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          s.listContent,
          { paddingTop: Spacing.space2, paddingBottom: Math.max(insets.bottom, 16) + 8 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={[Colors.primary]}
          />
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
              <ActivityIndicator size="small" color={Colors.primary} style={s.loader} />
            )}
            {listings && listings.length > 0 && (
              <ActionBanner
                title="لديك سيارة للبيع؟"
                subtitle="انشر إعلانك الآن ووصل لآلاف المشترين"
                buttonText="أضف إعلانك"
                iconName="car-sport-outline"
                onPress={handleAddCar}
              />
            )}
          </>
        )}
        ListHeaderComponent={
          <View style={s.listHeader}>
            <CarsVisualFilters
              selectedBrandId={selectedBrandId}
              selectedCity={filters.city}
              selectedModelId={filters.modelId}
              selectedPriceId={(filters as any).priceId}
              selectedTypeId={filters.bodyType}
              onSelectFilter={handleSelectFilter}
              onViewAll={(tabId) => setIsFilterVisible(true)}
            />
            {listings && listings.length > 0 && (
              <View style={{ paddingHorizontal: Spacing.space4, marginTop: Spacing.space2, marginBottom: Spacing.space1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                {activeFiltersCount > 0 ? (
                  <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3.5, paddingHorizontal: 8, borderRadius: 6, backgroundColor: '#FEF2F2' }}
                    onPress={handleClearAll}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={12.5} color={Colors.error} />
                    <Text style={{ fontFamily: 'Almarai_700Bold', fontSize: 11, lineHeight: 15, color: Colors.error, textAlign: 'left', writingDirection: 'rtl' }}>
                      مسح الفلاتر
                    </Text>
                  </TouchableOpacity>
                ) : <View />}

                <View style={s.resultsCountBadge}>
                  <Ionicons name="car-sport-outline" size={14} color="#64748b" />
                  <Text style={s.resultsCountTxt}>
                    {listings.length} سيارة متاحة
                  </Text>
                </View>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={() => (
          <BrowseEmptyState
            isLoading={isLoading}
            isError={isError}
            activeFiltersCount={activeFiltersCount}
            onRetry={refetch}
            onClearAll={handleClearAll}
          />
        )}
        renderItem={({ item }) => (
          <View style={s.cardWrapper}>
            <CarCard item={item as any} onPress={() => router.push(`/listings/${item.id}` as any)} fullWidth showChips />
          </View>
        )}
      />

      <FilterBottomSheet
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        initialFilters={filters}
        onApplyFilters={(appliedFilters) => setFilters(appliedFilters)}
      />

      <QuickFilterModal
        visible={!!activeDropdown}
        activeDropdown={activeDropdown}
        onClose={() => setActiveDropdown(null)}
        filters={filters}
        setFilters={setFilters}
        brands={brands || []}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  compactSearch: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.space2,
    backgroundColor: 'rgba(255,255,255,0.15)', height: 40, borderRadius: 20,
    paddingHorizontal: Spacing.space3, marginHorizontal: Spacing.space3
  },
  compactInput: {
    flex: 1, fontFamily: 'Almarai_400Regular',  fontSize: 13, color: Colors.white, textAlign: 'right'
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center'
  },
  filterBadge: {
    position: 'absolute', top: -2, right: -2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: Colors.accent || '#e67e22', alignItems: 'center', justifyContent: 'center'
  },
  filterBadgeText: {
    fontFamily: 'Almarai_700Bold',  fontSize: 10,
    color: Colors.white,
  },
  listingTypeTabs: {
    flexDirection: 'row',
    marginHorizontal: Spacing.space4,
    marginTop: Spacing.space3,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
  },
  typeTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  typeTabActive: {
    backgroundColor: Colors.primary,
  },
  typeTabTxt: {
    fontFamily: 'Almarai_700Bold', fontSize: 13,
    color: '#64748B',
  },
  typeTabTxtActive: {
    color: Colors.white,
  },
  quickFiltersContainer: {
    marginTop: Spacing.space2,
    marginBottom: Spacing.space1,
  },
  quickFiltersContent: {
    paddingHorizontal: Spacing.space4,
    paddingVertical: 8,
    gap: Spacing.space2,
  },
  quickFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  squareChip: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  quickFilterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  quickFilterTxt: {
    fontFamily: 'Almarai_700Bold',  fontSize: 13,
    color: Colors.text,
  },
  quickFilterTxtActive: {
    color: Colors.white,
  },
  listContent: {
    paddingBottom: Spacing.space6,
  },

  loader: { margin: 20 },
  resultsCountWrapper: { paddingHorizontal: Spacing.space4, marginTop: Spacing.space2, marginBottom: Spacing.space1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  resultsCountBadge: { backgroundColor: '#f8fafc', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: '#f1f5f9' },
  resultsCountTxt: { fontFamily: 'Almarai_700Bold', fontSize: 11, lineHeight: 15, color: '#64748b', textAlign: 'left', writingDirection: 'rtl' },

  listHeader: {
    marginBottom: Spacing.space2,
  },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.space4,
    marginTop: Spacing.space1,
    marginBottom: Spacing.space2,
  },
  resultsCount: {
    fontFamily: 'Almarai_700Bold',  fontSize: 15,
    color: Colors.text,
  },
  clearAllText: {
    fontFamily: 'Almarai_700Bold',  fontSize: 13,
    color: Colors.primary,
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
    fontFamily: 'Almarai_700Bold',  fontSize: 18,
    color: Colors.text,
    marginTop: Spacing.space3,
    marginBottom: Spacing.space2,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'Almarai_400Regular',  fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.space4,
  },
  clearAllBtn: {
    paddingHorizontal: Spacing.space4,
    paddingVertical: Spacing.space2,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  clearAllBtnText: {
    fontFamily: 'Almarai_700Bold',  fontSize: 14,
    color: Colors.primary,
  },

});
