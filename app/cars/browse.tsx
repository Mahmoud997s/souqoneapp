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

const DROPDOWN_FILTERS = [
  { id: 'make', label: 'الماركة', icon: 'car-sport-outline' },
  { id: 'price', label: 'السعر', icon: 'wallet-outline' },
  { id: 'year', label: 'سنة الصنع', icon: 'calendar-outline' },
  { id: 'city', label: 'المدينة', icon: 'location-outline' },
  { id: 'type', label: 'الشكل', icon: 'car-outline' },
  { id: 'sort', label: 'الترتيب', icon: 'swap-vertical-outline' },
];

const SORT_OPTIONS = [
  { id: 'createdAt_desc', label: 'الأحدث أولاً', sortBy: 'createdAt', sortOrder: 'DESC' },
  { id: 'price_asc', label: 'الأقل سعراً', sortBy: 'price', sortOrder: 'ASC' },
  { id: 'price_desc', label: 'الأعلى سعراً', sortBy: 'price', sortOrder: 'DESC' },
  { id: 'year_desc', label: 'سنة الصنع الأحدث', sortBy: 'year', sortOrder: 'DESC' },
];

const PRICE_RANGES = [
  { id: 'p1', label: 'أقل من 1,000 ر.ع', min: 0, max: 1000 },
  { id: 'p2', label: '1,000 - 3,000 ر.ع', min: 1000, max: 3000 },
  { id: 'p3', label: '3,000 - 6,000 ر.ع', min: 3000, max: 6000 },
  { id: 'p4', label: '6,000 - 10,000 ر.ع', min: 6000, max: 10000 },
  { id: 'p5', label: '10,000 - 15,000 ر.ع', min: 10000, max: 15000 },
  { id: 'p6', label: 'أكثر من 15,000 ر.ع', min: 15000, max: null },
];

const YEARS = Array.from({ length: 35 }, (_, i) => new Date().getFullYear() - i);

const LISTING_TYPES = [
  { id: 'SALE', label: 'للبيع' },
  { id: 'RENTAL', label: 'للإيجار' },
  { id: 'WANTED', label: 'مطلوب' },
];

const CAR_TYPES = [
  { id: 'sedan', name: 'سيدان' },
  { id: 'suv', name: 'دفع رباعي' },
  { id: 'hatchback', name: 'هاتشباك' },
  { id: 'pickup', name: 'بيك أب' },
  { id: 'coupe', name: 'كوبيه' },
];

export default function CarsBrowseScreen() {
  const insets = useSafeAreaInsets();
  const { scrollHandler } = useScrollAwareNav();
  const { navHidden } = useNavVisibility();

  const searchParams = useLocalSearchParams<{ type?: string; featured?: string }>();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
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

  // Combine query parameters
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      limit: 30,
    };

    if (searchQuery.trim()) {
      params.search = searchQuery;
    }

    // BrandCarousel selection takes priority
    if (selectedBrandName) {
      params.make = selectedBrandName;
    }

    // Internal keys not sent to API
    const skipKeys = new Set(['makeId', 'modelId', 'trim', 'priceId']);

    // Apply all custom filters
    Object.entries(filters).forEach(([key, val]) => {
      if (skipKeys.has(key)) return;
      if (val !== undefined && val !== '') {
        if (key === 'priceMin' || key === 'priceMax' || key === 'yearMin' || key === 'yearMax') {
          const parsed = parseFloat(val as string);
          if (!isNaN(parsed)) {
            params[key] = parsed;
          }
        } else {
          params[key] = val;
        }
      }
    });

    return params;
  }, [searchQuery, selectedBrandName, filters]);

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
    if (id === 'city') delete newFilters.city;
    if (id === 'year') { delete newFilters.yearMin; delete newFilters.yearMax; }
    if (id === 'price') { delete newFilters.priceMin; delete newFilters.priceMax; }
    if (id === 'type') { delete newFilters.bodyType; }
    if (id === 'sort') { delete newFilters.sortBy; delete newFilters.sortOrder; }
    setFilters(newFilters);
  };

  const handleSelectFilter = (type: 'make' | 'model' | 'city' | 'price' | 'type', valueId: string, valueName?: string, min?: number, max?: number) => {
    if (type === 'make') {
      setSelectedBrandId(valueId);
      setSelectedBrandName(valueName);
      setFilters(prev => {
        const next = { ...prev };
        next.makeId = valueId;
        next.make = valueName;
        // reset model if make changes
        if (valueId !== prev.makeId) {
          next.modelId = undefined;
          next.model = undefined;
          next.trim = undefined;
        }
        return next;
      });
    } else if (type === 'model') {
      setFilters(prev => ({ ...prev, modelId: valueId, model: valueName }));
    } else if (type === 'city') {
      setFilters(prev => ({ ...prev, city: valueId }));
    } else if (type === 'price') {
      setFilters(prev => ({ ...prev, priceMin: min?.toString(), priceMax: max?.toString(), priceId: valueId }));
    } else if (type === 'type') {
      setFilters(prev => ({ ...prev, bodyType: valueId.toUpperCase() }));
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
          { paddingTop: Spacing.space2 },
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
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator size="small" color={Colors.primary} style={{ margin: 20 }} /> : null}
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
              <View style={{ paddingHorizontal: Spacing.space4, marginTop: Spacing.space3, marginBottom: Spacing.space2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                {activeFiltersCount > 0 ? (
                  <TouchableOpacity onPress={handleClearAll}>
                    <Text style={{ fontFamily: 'Almarai_700Bold', fontSize: 13, color: Colors.error }}>
                      مسح الفلاتر
                    </Text>
                  </TouchableOpacity>
                ) : <View />}

                <View style={{ backgroundColor: '#f8fafc', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#f1f5f9' }}>
                  <Ionicons name="car-sport-outline" size={14} color="#64748b" />
                  <Text style={{ fontFamily: 'Almarai_700Bold', fontSize: 12, color: '#64748b' }}>
                    {listings.length} سيارة متاحة
                  </Text>
                </View>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={renderEmptyState}
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
                {activeDropdown === 'make' ? 'اختر الماركة' :
                 activeDropdown === 'city' ? 'اختر المدينة' :
                 activeDropdown === 'year' ? 'سنة الصنع' : 
                 activeDropdown === 'type' ? 'الهيكل' : 
                 activeDropdown === 'sort' ? 'الترتيب' : 'نطاق السعر'}
              </Text>
              <TouchableOpacity onPress={() => setActiveDropdown(null)}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {activeDropdown === 'make' && (
              <FlatList
                data={brands || []}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalOptionRow}
                    onPress={() => {
                      setFilters({ ...filters, makeId: item.id, make: item.name });
                      setActiveDropdown(null);
                    }}
                  >
                    <Text style={[s.modalOptionTxt, filters.makeId === item.id && s.modalOptionTxtActive]}>
                      {item.nameAr || item.name}
                    </Text>
                    {filters.makeId === item.id && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                )}
              />
            )}

            {activeDropdown === 'city' && (
              <FlatList
                data={GOVERNORATE_OPTIONS}
                keyExtractor={(item) => item.value}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalOptionRow}
                    onPress={() => {
                      setFilters({ ...filters, city: item.labelAr });
                      setActiveDropdown(null);
                    }}
                  >
                    <Text style={[s.modalOptionTxt, filters.city === item.labelAr && s.modalOptionTxtActive]}>
                      {item.labelAr}
                    </Text>
                    {filters.city === item.labelAr && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                )}
              />
            )}

            {activeDropdown === 'year' && (
              <FlatList
                data={YEARS}
                keyExtractor={(item) => item.toString()}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalOptionRow}
                    onPress={() => {
                      setFilters({ ...filters, yearMin: item.toString(), yearMax: item.toString() });
                      setActiveDropdown(null);
                    }}
                  >
                    <Text style={[s.modalOptionTxt, filters.yearMin === item.toString() && s.modalOptionTxtActive]}>
                      {item}
                    </Text>
                    {filters.yearMin === item.toString() && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                )}
              />
            )}

            {activeDropdown === 'price' && (
              <FlatList
                data={PRICE_RANGES}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalOptionRow}
                    onPress={() => {
                      setFilters({ ...filters, priceMin: item.min.toString(), priceMax: item.max ? item.max.toString() : '9999999' });
                      setActiveDropdown(null);
                    }}
                  >
                    <Text style={[s.modalOptionTxt, filters.priceMax === (item.max ? item.max.toString() : '9999999') && s.modalOptionTxtActive]}>
                      {item.label}
                    </Text>
                    {filters.priceMax === (item.max ? item.max.toString() : '9999999') && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                )}
              />
            )}

            {activeDropdown === 'type' && (
              <FlatList
                data={CAR_TYPES}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalOptionRow}
                    onPress={() => {
                      setFilters({ ...filters, bodyType: item.id });
                      setActiveDropdown(null);
                    }}
                  >
                    <Text style={[s.modalOptionTxt, filters.bodyType === item.id && s.modalOptionTxtActive]}>
                      {item.name}
                    </Text>
                    {filters.bodyType === item.id && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                )}
              />
            )}

            {activeDropdown === 'sort' && (
              <FlatList
                data={SORT_OPTIONS}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isSelected = filters.sortBy === item.sortBy && filters.sortOrder === item.sortOrder;
                  return (
                    <TouchableOpacity
                      style={s.modalOptionRow}
                      onPress={() => {
                        setFilters({ ...filters, sortBy: item.sortBy, sortOrder: item.sortOrder });
                        setActiveDropdown(null);
                      }}
                    >
                      <Text style={[s.modalOptionTxt, isSelected && s.modalOptionTxtActive]}>
                        {item.label}
                      </Text>
                      {isSelected && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
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
