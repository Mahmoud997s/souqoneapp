import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
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
import { SectionFooterAction } from '../../src/components/ui/SectionFooterAction';
import { CATEGORY_ICONS } from '../../src/constants/categoryIcons';
import { BROWSE_LIST_VIRTUALIZATION_PROPS } from '../../src/constants/listVirtualization';
import {
  DROPDOWN_FILTERS,
  SORT_OPTIONS,
  PRICE_RANGES,
  YEARS,
  LISTING_TYPES,
  CAR_TYPES,
} from '../../src/constants/browseFilters';
import { QuickFilterModal } from '../../src/components/filters/LegacyQuickFilterModal';
import { BrowseEmptyState } from '../../src/components/cars/BrowseEmptyState';
import { StaleDataBanner } from '../../src/components/listing-detail/StaleDataBanner';
import { BrowseHeader } from '../../src/components/ui/BrowseHeader';
import { BrowseResultsBar } from '../../src/components/ui/BrowseResultsBar';
import { ListingTabs } from '../../src/components/ui/ListingTabs';
import { navigateToCarForm } from '../../src/components/ui/DraftResumePrompt';
import { QuickFilters, QuickFilterItem } from '../../src/components/ui/QuickFilters';
import { CollapsibleSubHeader } from '../../src/components/ui/CollapsibleSubHeader';
import { useBrands } from '../../src/hooks/useCars';
import { GOVERNORATE_OPTIONS } from '../../src/constants/filters';

// Components
import { CarCard } from '../../src/components/cars/CarCard';
import { CarsVisualFilters } from '../../src/components/cars/CarsVisualFilters';
import { FilterBottomSheet } from '../../src/components/filters/FilterBottomSheet';
import { SkeletonCard } from '../../src/components/ui/SkeletonCard';
import { CarsBottomBar } from '../../src/components/cars/CarsBottomBar';
import { UNIFIED_BOTTOM_BAR_HEIGHT } from '../../src/components/navigation/UnifiedBottomBar';
import { useGlassSupport } from '../../src/components/navigation/glassSupport';
import { Listing } from '../../src/types/listing.types';

// Constants
import { Colors } from '../../src/constants/colors';
import { Spacing } from '../../src/constants/spacing';

// Pure Filter Helpers & Contract
import {
  CarsFilterState as FilterState,
  decodeSearchParam,
  parseCarsFiltersFromParams,
  mergeCarsRouteParams,
  clearCarsMake,
  clearCarsQuickFilter,
  applyCarsQuickFilter,
  buildCarsQueryParams,
  countCarsActiveFilters,
} from '../../src/utils/browse-filters/carsBrowseFilters';

export default function CarsBrowseScreen() {
  const insets = useSafeAreaInsets();
  const glassSupport = useGlassSupport();
  const { scrollHandler } = useScrollAwareNav();

  const searchParams = useLocalSearchParams<{
    type?: string;
    condition?: string;
    featured?: string;
    isPremium?: string;
    make?: string;
    brandId?: string;
    search?: string;
  }>();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState(() => decodeSearchParam(searchParams.search));
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const [filters, setFilters] = useState<FilterState>(() => parseCarsFiltersFromParams(searchParams));

  // G-05: Single state owner - derive selectedBrandId and selectedBrandName from filters
  const selectedBrandId = filters.makeId;
  const selectedBrandName = typeof filters.make === 'string' ? filters.make : undefined;

  // G-06: FlatList ref to scroll to top when filters change
  const flatListRef = useRef<FlatList<Listing>>(null);

  // Sync state whenever navigation params change (G-07: MERGE incoming route params into existing state)
  useEffect(() => {
    setFilters(prev => mergeCarsRouteParams(prev, searchParams));
    if (searchParams.search !== undefined) {
      setSearchQuery(decodeSearchParam(searchParams.search));
    }
  }, [
    searchParams.type,
    searchParams.condition,
    searchParams.featured,
    searchParams.isPremium,
    searchParams.make,
    searchParams.brandId,
    searchParams.search,
  ]);

  // G-06: Scroll list to top when filters or search change
  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [filters, debouncedSearchQuery]);

  const [isFilterVisible, setIsFilterVisible] = useState(false);
  
  // Dropdown Modal State
  const [activeDropdown, setActiveDropdown] = useState<'make' | 'city' | 'year' | 'price' | 'type' | 'sort' | null>(null);
  const { data: brands } = useBrands();

  const handleAddCar = useCallback(() => {
    navigateToCarForm();
  }, []);

  // Combine query parameters via pure module
  const queryParams = useMemo(() => {
    return buildCarsQueryParams(filters, debouncedSearchQuery, selectedBrandName, 30);
  }, [debouncedSearchQuery, selectedBrandName, filters]);

  // Fetch Listings
  const {
    data: infiniteData,
    isLoading,
    isError,
    error,
    isFetching,
    isRefetchError,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteCarListings(queryParams);
  const listings = useMemo(() => infiniteData?.pages.flatMap(page => page.items) ?? [], [infiniteData]);

  // Active filters count via pure module
  const activeFiltersCount = useMemo(() => {
    return countCarsActiveFilters(filters, selectedBrandId);
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
        const foundType = CAR_TYPES.find(
          (t) => t.id.toUpperCase() === (typeof filters.bodyType === 'string' ? filters.bodyType.toUpperCase() : filters.bodyType)
        );
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

  const handleClearQuickFilter = useCallback((id: string) => {
    setFilters(prev => clearCarsQuickFilter(prev, id));
  }, []);

  const handleSelectFilter = useCallback((
    type: 'make' | 'model' | 'city' | 'price' | 'type',
    valueId: string,
    valueName?: string,
    min?: number,
    max?: number,
    extraId?: number
  ) => {
    setFilters(prev => applyCarsQuickFilter(prev, type, valueId, valueName, min, max, extraId));
  }, []);

  const handleApplyFilters = useCallback((appliedFilters: FilterState) => {
    setFilters(appliedFilters);
  }, []);

  const handleClearAll = useCallback(() => {
    setFilters({});
    setSearchQuery('');
  }, []);

  const handleViewAllVisualFilters = useCallback(() => {
    setIsFilterVisible(true);
  }, []);

  const itemPressHandlersRef = useRef<Map<string, () => void>>(new Map());
  const getItemPressHandler = useCallback((id: string) => {
    let handler = itemPressHandlersRef.current.get(id);
    if (!handler) {
      handler = () => router.push(`/cars/${id}`);
      itemPressHandlersRef.current.set(id, handler);
    }
    return handler;
  }, []);

  const keyExtractor = useCallback((item: Listing) => item.id, []);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: Listing }) => (
      <View style={s.cardWrapper}>
        <CarCard
          item={item}
          onPress={getItemPressHandler(item.id)}
          fullWidth
          showChips
          glassSupport={glassSupport}
        />
      </View>
    ),
    [getItemPressHandler, glassSupport]
  );

  const selectedPriceId = (filters as FilterState & { priceId?: string }).priceId;

  const listHeaderComponent = useMemo(
    () => (
      <View style={s.listHeader}>
        <CarsVisualFilters
          selectedBrandId={selectedBrandId}
          selectedCity={filters.city}
          selectedModelId={filters.modelId}
          selectedPriceId={selectedPriceId}
          selectedTypeId={filters.bodyType}
          onSelectFilter={handleSelectFilter}
          onViewAll={handleViewAllVisualFilters}
          glassSupport={glassSupport}
        />
        {listings && listings.length > 0 && (
          <BrowseResultsBar
            resultsCount={listings.length}
            entityName="سيارة"
            iconName="car-sport-outline"
            activeFiltersCount={activeFiltersCount}
            onClearAll={handleClearAll}
            glassSupport={glassSupport}
          />
        )}
      </View>
    ),
    [
      selectedBrandId,
      filters.city,
      filters.modelId,
      selectedPriceId,
      filters.bodyType,
      handleSelectFilter,
      handleViewAllVisualFilters,
      glassSupport,
      listings,
      activeFiltersCount,
      handleClearAll,
    ]
  );

  const listFooterComponent = useMemo(
    () => (
      <>
        {isFetchingNextPage && (
          <ActivityIndicator size="small" color={Colors.primary} style={s.loader} />
        )}
        {listings && listings.length > 0 && (
          <SectionFooterAction
            title="لديك سيارة للبيع؟"
            subtitle="انشر إعلانك الآن ووصل لآلاف المشترين"
            buttonText="أضف إعلانك"
            iconName="car-sport-outline"
            iconImage={CATEGORY_ICONS.cars}
            onPress={handleAddCar}
          />
        )}
      </>
    ),
    [isFetchingNextPage, listings, handleAddCar]
  );

  const listEmptyComponent = useMemo(
    () => (
      <BrowseEmptyState
        isLoading={isLoading}
        isError={isError}
        error={error}
        errorTitle="تعذر تحميل إعلانات السيارات"
        activeFiltersCount={activeFiltersCount}
        onRetry={refetch}
        onClearAll={handleClearAll}
      />
    ),
    [isLoading, isError, error, activeFiltersCount, refetch, handleClearAll]
  );

  return (
    <View style={s.root}>
      <BrowseHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="ابحث في سوق السيارات..."
        activeFiltersCount={activeFiltersCount}
        onFilterPress={() => setIsFilterVisible(!isFilterVisible)}
        glassSupport={glassSupport}
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
          glassSupport={glassSupport}
        />
        <QuickFilters 
          filters={quickFilterItems}
          onFilterPress={(id) => setActiveDropdown(id as any)}
          onClearFilter={handleClearQuickFilter}
          glassSupport={glassSupport}
        />
      </CollapsibleSubHeader>

      {(isRefetchError || isError) && listings.length > 0 && (
        <StaleDataBanner
          onRetry={() => refetch()}
          isRefetching={isRefetching || (isFetching && !isFetchingNextPage)}
        />
      )}

      <Animated.FlatList
        ref={flatListRef}
        key="list-1-column"
        {...BROWSE_LIST_VIRTUALIZATION_PROPS}
        data={listings}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          s.listContent,
          {
            paddingTop: Spacing.space2,
            paddingBottom: UNIFIED_BOTTOM_BAR_HEIGHT + Math.max(insets.bottom, 12) + 8,
          },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[Colors.primary]}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={listFooterComponent}
        ListHeaderComponent={listHeaderComponent}
        ListEmptyComponent={listEmptyComponent}
        renderItem={renderItem}
      />

      <FilterBottomSheet
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        initialFilters={filters}
        onApplyFilters={handleApplyFilters}
      />

      <QuickFilterModal
        visible={!!activeDropdown}
        activeDropdown={activeDropdown}
        onClose={() => setActiveDropdown(null)}
        filters={filters}
        setFilters={setFilters}
        brands={brands || []}
      />

      <CarsBottomBar glassSupport={glassSupport} />
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
  loader: { margin: 20 },
  listHeader: {
    marginBottom: Spacing.space2,
  },
  cardWrapper: {
    paddingHorizontal: Spacing.space4,
    marginBottom: Spacing.space4,
  },
});
