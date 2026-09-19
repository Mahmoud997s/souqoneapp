import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated from 'react-native-reanimated';

import { useInfiniteBuses, useBusManufacturers } from '../../src/hooks/useBuses';
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav';
import { useDebounce } from '../../src/hooks/useDebounce';
import { locationsApi } from '../../src/api/locations';
import { GovernorateRef } from '../../src/types/location.types';
import { BUS_LISTING_TYPES, BUS_TYPES, BUS_MAKES } from '../../src/constants/buses';

// Components
import { BrowseHeader } from '../../src/components/ui/BrowseHeader';
import { ListingTabs } from '../../src/components/ui/ListingTabs';
import { CollapsibleSubHeader } from '../../src/components/ui/CollapsibleSubHeader';
import { QuickFilters, QuickFilterItem } from '../../src/components/ui/QuickFilters';
import { BusCard } from '../../src/components/buses/BusCard';
import { BusesVisualFilters } from '../../src/components/buses/BusesVisualFilters';
import { BusFilterBottomSheet, BusFilters } from '../../src/components/filters/BusFilterBottomSheet';
import { QuickFilterModal } from '../../src/components/filters/QuickFilterModal';
import { BrowseResultsBar } from '../../src/components/ui/BrowseResultsBar';
import { BrowseEmptyState } from '../../src/components/ui/BrowseEmptyState';
import { SectionFooterAction } from '../../src/components/ui/SectionFooterAction';
import { navigateToBusForm } from '../../src/components/ui/DraftResumePrompt';

import { Colors } from '../../src/constants/colors';
import { Spacing } from '../../src/constants/spacing';

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
  { id: 'price_desc', label: 'السعر: الأعلى للأقل' },
];

export default function BusesBrowseScreen() {
  const insets = useSafeAreaInsets();
  const { scrollHandler } = useScrollAwareNav();
  const searchParams = useLocalSearchParams<{
    type?: string;
    featured?: string;
    busListingType?: string;
    condition?: string;
    isPremium?: string;
  }>();

  const [governorates, setGovernorates] = useState<GovernorateRef[]>([]);
  useEffect(() => {
    locationsApi.getGovernorates().then(setGovernorates).catch(console.warn);
  }, []);

  const { data: manufacturers } = useBusManufacturers();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  type BusBrowseFilters = BusFilters & {
    governorateId?: number;
    wilayaId?: number;
    city?: string;
    priceId?: string;
    isPremium?: boolean | string;
  };

  const [filters, setFilters] = useState<BusBrowseFilters>(() => {
    const initialFilters: BusBrowseFilters = {};
    if (searchParams.busListingType) {
      initialFilters.busListingType = searchParams.busListingType as any;
    } else if (searchParams.type) {
      const t = searchParams.type.toUpperCase();
      if (t === 'RENT' || t === 'RENTAL') initialFilters.busListingType = 'BUS_RENT';
      else if (t === 'SALE') initialFilters.busListingType = 'BUS_SALE';
      else if (t === 'CONTRACT') initialFilters.busListingType = 'BUS_SALE_WITH_CONTRACT';
      else initialFilters.busListingType = t as any;
    }
    if (searchParams.condition) {
      initialFilters.condition = searchParams.condition as any;
    }
    if (searchParams.featured === 'true' || searchParams.isPremium === 'true') {
      (initialFilters as any).isPremium = true;
    }
    return initialFilters;
  });

  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Combine query filters for API
  const queryFilters = useMemo(() => {
    const params: Record<string, any> = {};

    // 1. Search text
    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }

    // 2. Vertical & core classifications
    if (filters.busListingType) params.busListingType = filters.busListingType;
    if (filters.busType) params.busType = filters.busType;
    if (filters.make) params.make = filters.make;
    if (filters.governorateId) params.governorateId = String(filters.governorateId);
    if (filters.wilayaId) params.wilayaId = String(filters.wilayaId);

    // 3. Pricing
    const minPrice = filters.minPrice || filters.priceMin;
    if (minPrice) params.minPrice = String(minPrice);
    const maxPrice = filters.maxPrice || filters.priceMax;
    if (maxPrice) params.maxPrice = String(maxPrice);

    // 4. Passenger capacity
    const minCap = filters.minCapacity || filters.capacityMin;
    if (minCap) params.minCapacity = String(minCap);
    const maxCap = filters.maxCapacity || filters.capacityMax;
    if (maxCap) params.maxCapacity = String(maxCap);

    // 5. Technical specs (condition, transmission, fuel, year)
    if (filters.condition) params.condition = filters.condition;
    if (filters.transmission) params.transmission = filters.transmission;
    if (filters.fuelType) params.fuelType = filters.fuelType;
    if (filters.yearMin) params.yearMin = String(filters.yearMin);
    if (filters.yearMax) params.yearMax = String(filters.yearMax);

    // 6. Sorting
    if (filters.sort && filters.sort !== 'newest') {
      params.sort = filters.sort;
    }

    // 7. Premium flag if any
    if ((filters as any).isPremium) {
      params.isPremium = 'true';
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
    isFetchingNextPage,
  } = useInfiniteBuses(queryFilters as any);

  const listings = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.busListingType) count++;
    if (filters.condition) count++;
    if (filters.governorateId) count++;
    if (filters.make) count++;
    if (filters.busType) count++;
    if (filters.minCapacity || filters.capacityMin) count++;
    if (filters.minPrice || filters.maxPrice || filters.priceMin || filters.priceMax) count++;
    if (filters.yearMin || filters.yearMax) count++;
    if (filters.transmission) count++;
    if (filters.fuelType) count++;
    return count;
  }, [filters]);

  const handleClearAll = () => setFilters((prev) => ({ sort: prev.sort }));

  const quickFilterItems: QuickFilterItem[] = DROPDOWN_FILTERS.map((qf) => {
    let isActive = false;
    let displayLabel = qf.label;

    if (qf.id === 'governorate') {
      isActive = !!filters.governorateId;
      if (isActive)
        displayLabel =
          governorates.find((g) => g.id === filters.governorateId)?.nameAr || 'المدينة';
    } else if (qf.id === 'make') {
      isActive = !!filters.make;
      if (isActive) {
        const found = manufacturers?.find((m) => m.name === filters.make || m.id === filters.make);
        displayLabel = found ? (found.nameAr || found.name) : (filters.make as string);
      }
    } else if (qf.id === 'capacity') {
      const cap = filters.minCapacity ?? filters.capacityMin;
      isActive = !!cap;
      if (isActive) displayLabel = `+ ${cap} مقعد`;
    } else if (qf.id === 'busType') {
      isActive = !!filters.busType;
      if (isActive)
        displayLabel =
          BUS_TYPES.find((b) => b.id === filters.busType)?.label || (filters.busType as string);
    } else if (qf.id === 'sort') {
      isActive = !!filters.sort && filters.sort !== 'newest';
      if (isActive) {
        displayLabel = SORT_OPTIONS.find((s) => s.id === filters.sort)?.label || qf.label;
      }
    }

    return {
      id: qf.id,
      label: displayLabel,
      icon: qf.icon as any,
      isActive,
    };
  });

  const handleClearQuickFilter = (id: string) => {
    const newFilters = { ...filters };
    if (id === 'governorate') {
      delete newFilters.governorateId;
      delete newFilters.city;
    }
    if (id === 'make') delete newFilters.make;
    if (id === 'capacity') {
      delete newFilters.capacityMin;
      delete newFilters.minCapacity;
    }
    if (id === 'busType') delete newFilters.busType;
    if (id === 'sort') newFilters.sort = 'newest';
    setFilters(newFilters);
  };

  const handleSelectFilter = (
    type: 'make' | 'busType' | 'capacity' | 'city' | 'price',
    valueId: string,
    valueName?: string,
    min?: number,
    max?: number,
    extraId?: number
  ) => {
    if (type === 'make') {
      if (!valueId || valueId === filters.make) {
        setFilters((prev) => {
          const next = { ...prev };
          delete next.make;
          return next;
        });
        return;
      }
      setFilters((prev) => ({ ...prev, make: valueId }));
    } else if (type === 'busType') {
      if (!valueId || valueId === filters.busType) {
        setFilters((prev) => {
          const next = { ...prev };
          delete next.busType;
          return next;
        });
        return;
      }
      setFilters((prev) => ({ ...prev, busType: valueId as any }));
    } else if (type === 'capacity') {
      const currentCap = filters.minCapacity ?? filters.capacityMin;
      if (!valueId || min === currentCap) {
        setFilters((prev) => {
          const next = { ...prev };
          delete next.capacityMin;
          delete next.minCapacity;
          return next;
        });
        return;
      }
      setFilters((prev) => ({ ...prev, minCapacity: min, capacityMin: min }));
    } else if (type === 'city') {
      if (!valueId || valueId === String(filters.governorateId)) {
        setFilters((prev) => {
          const next = { ...prev };
          delete next.governorateId;
          delete next.city;
          return next;
        });
        return;
      }
      setFilters((prev) => ({
        ...prev,
        governorateId: extraId || Number(valueId), // governorateId: item.id
        city: valueName,
      }));
    } else if (type === 'price') {
      if (!valueId || valueId === filters.priceId) {
        setFilters((prev) => {
          const next = { ...prev };
          delete next.priceMin;
          delete next.priceMax;
          delete next.minPrice;
          delete next.maxPrice;
          delete next.priceId;
          return next;
        });
        return;
      }
      setFilters((prev) => ({
        ...prev,
        minPrice: min !== undefined ? String(min) : undefined,
        maxPrice: max !== undefined ? String(max) : undefined,
        priceMin: min !== undefined ? String(min) : undefined,
        priceMax: max !== undefined ? String(max) : undefined,
        priceId: valueId,
      }));
    }
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
          onClearTab={() => {
            const newFilters = { ...filters };
            delete newFilters.busListingType;
            setFilters(newFilters);
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
          { paddingTop: Spacing.space2, paddingBottom: Math.max(insets.bottom, 16) + 8 },
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
              <SectionFooterAction
                title="لديك حافلة للبيع؟"
                subtitle="انشر إعلانك الآن ووصل لآلاف المشترين"
                buttonText="أضف إعلانك"
                iconName="bus-outline"
                onPress={() => navigateToBusForm()}
              />
            )}
          </>
        )}
        ListHeaderComponent={
          <View style={s.listHeader}>
            <BusesVisualFilters
              selectedBrandId={filters.make}
              selectedCity={filters.city}
              selectedTypeId={filters.busType}
              selectedCapacity={filters.minCapacity ?? filters.capacityMin}
              selectedPriceId={filters.priceId}
              onSelectFilter={handleSelectFilter}
              onViewAll={() => setIsFilterVisible(true)}
            />

            {listings && listings.length > 0 && (
              <BrowseResultsBar
                resultsCount={listings.length}
                entityName="حافلة"
                iconName="bus-outline"
                activeFiltersCount={activeFiltersCount}
                onClearAll={handleClearAll}
              />
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
            iconName="bus-outline"
            emptyTitle="لا توجد حافلات مطابقة"
            emptySubtitle="جرب تغيير الفلاتر أو كلمة البحث للعثور على نتائج أخرى"
            errorText="حدث خطأ أثناء تحميل الحافلات"
          />
        )}
        renderItem={({ item }: any) => (
          <View style={s.cardWrapper}>
            <BusCard
              item={item}
              onPress={() => router.push(`/buses/${item.id}` as any)}
              fullWidth
              showChips
            />
          </View>
        )}
      />

      <BusFilterBottomSheet
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        currentFilters={filters}
        onApply={(appliedFilters) => setFilters(appliedFilters)}
      />

      <QuickFilterModal
        visible={!!activeDropdown}
        activeDropdown={activeDropdown}
        onClose={() => setActiveDropdown(null)}
        filters={filters}
        setFilters={setFilters}
        brands={manufacturers || []}
        isBus={true}
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
  listHeader: {
    marginBottom: Spacing.space2,
  },
  cardWrapper: {
    paddingHorizontal: Spacing.space4,
    marginBottom: Spacing.space4,
  },
  loader: {
    margin: 20,
  },
});
