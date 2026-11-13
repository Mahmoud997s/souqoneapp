import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  FlatList,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Hooks & Navigation
import { useInfiniteServices } from '../../src/hooks/useInfiniteServices';
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav';
import { useDebounce } from '../../src/hooks/useDebounce';
import { navigateToServiceForm } from '../../src/components/ui/DraftResumePrompt';

// UI Components
import { BrowseHeader } from '../../src/components/ui/BrowseHeader';
import { BrowseResultsBar } from '../../src/components/ui/BrowseResultsBar';
import { CollapsibleSubHeader } from '../../src/components/ui/CollapsibleSubHeader';
import { ListingTabs, TabItem } from '../../src/components/ui/ListingTabs';
import { QuickFilters, QuickFilterItem } from '../../src/components/ui/QuickFilters';
import { QuickFilterModal } from '../../src/components/filters/LegacyQuickFilterModal';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { StaleDataBanner } from '../../src/components/listing-detail/StaleDataBanner';
import { getListErrorProps } from '../../src/utils/getListErrorProps';
import { SectionFooterAction } from '../../src/components/ui/SectionFooterAction';
import { CATEGORY_ICONS } from '../../src/constants/categoryIcons';
import { BROWSE_LIST_VIRTUALIZATION_PROPS } from '../../src/constants/listVirtualization';

// Services Components
import { ServiceCard } from '../../src/components/services/ServiceCard';
import { ServiceSkeletonCard } from '../../src/components/services/ServiceSkeletonCard';
import { ServicesVisualFilters } from '../../src/components/services/ServicesVisualFilters';
import { ServicesFilterBottomSheet } from '../../src/components/services/ServicesFilterBottomSheet';
import { ServicesBottomBar } from '../../src/components/services/ServicesBottomBar';
import { UNIFIED_BOTTOM_BAR_HEIGHT } from '../../src/components/navigation/UnifiedBottomBar';
import { useGlassSupport } from '../../src/components/navigation/glassSupport';
import { UnifiedCardItem } from '../../src/types/unified-card.types';

// Pure Filter Helpers & Contract
import {
  ServicesFilterState,
  parseServicesFiltersFromParams,
  mergeServicesRouteParams,
  clearServicesQuickFilter,
  buildServicesQueryParams,
  countServicesActiveFilters,
} from '../../src/utils/browse-filters/servicesBrowseFilters';

// Constants
import { Colors } from '../../src/constants/colors';
import { Spacing } from '../../src/constants/spacing';
import { Radius } from '../../src/constants/radius';
import { SERVICE_TYPES, PROVIDER_TYPES } from '../../src/constants/services';

const PROVIDER_TABS: TabItem[] = [
  { id: 'WORKSHOP', label: 'مراكز وورش' },
  { id: 'INDIVIDUAL', label: 'فنيين مستقلين' },
  { id: 'MOBILE', label: 'خدمة متنقلة' },
];

export default function ServicesBrowseScreen() {
  const insets = useSafeAreaInsets();
  const glassSupport = useGlassSupport();
  const { scrollHandler } = useScrollAwareNav();

  const searchParams = useLocalSearchParams<{
    q?: string;
    serviceType?: string;
    providerType?: string;
    governorate?: string;
    governorateId?: string;
    wilayaId?: string;
    isHomeService?: string;
  }>();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState(searchParams.q || '');
  const debouncedSearch = useDebounce(searchQuery, 400);

  const [filters, setFilters] = useState<ServicesFilterState>(() =>
    parseServicesFiltersFromParams(searchParams)
  );

  const flatListRef = useRef<FlatList<UnifiedCardItem>>(null);

  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<
    'serviceType' | 'specialization' | 'providerType' | 'city' | null
  >(null);

  // Sync state whenever navigation params change (G-07: MERGE incoming route params)
  useEffect(() => {
    setFilters((prev) => mergeServicesRouteParams(prev, searchParams));
    if (searchParams.q !== undefined) {
      setSearchQuery(searchParams.q);
    }
  }, [
    searchParams.q,
    searchParams.serviceType,
    searchParams.providerType,
    searchParams.governorate,
    searchParams.governorateId,
    searchParams.wilayaId,
    searchParams.isHomeService,
  ]);

  // G-06: Scroll list to top when filters change
  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [filters, debouncedSearch]);

  const handleAddService = useCallback(() => {
    navigateToServiceForm();
  }, []);

  // Combine query parameters for API call via pure module
  const queryParams = useMemo(() => {
    return buildServicesQueryParams(filters, debouncedSearch, 30);
  }, [debouncedSearch, filters]);

  // Fetch infinite services
  const {
    data: infiniteData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    isRefetchError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useInfiniteServices(queryParams);

  const listings = useMemo(
    () => infiniteData?.pages.flatMap((page) => page.items) ?? [],
    [infiniteData]
  );

  const showSkeleton = isLoading && listings.length === 0;

  // Active filters count calculation via pure module
  const activeFiltersCount = useMemo(() => {
    return countServicesActiveFilters(filters);
  }, [filters]);

  // Current selected tab for ListingTabs
  const currentTabId = useMemo(() => {
    if (filters.providerType === 'WORKSHOP') return 'WORKSHOP';
    if (filters.providerType === 'INDIVIDUAL') return 'INDIVIDUAL';
    if (filters.providerType === 'MOBILE') return 'MOBILE';
    return undefined;
  }, [filters.providerType]);

  const handleChangeTab = useCallback((id: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (next.providerType === id) {
        delete next.providerType;
      } else {
        next.providerType = id;
      }
      return next;
    });
  }, []);

  const handleClearTab = useCallback(() => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next.providerType;
      return next;
    });
  }, []);

  // Quick filter chips representation
  const quickFilterItems: QuickFilterItem[] = useMemo(() => {
    const items: QuickFilterItem[] = [];

    // Service Type
    const foundType = SERVICE_TYPES.find((c) => c.id === filters.serviceType);
    items.push({
      id: 'serviceType',
      label: foundType ? foundType.label : 'نوع الخدمة',
      icon: 'build-outline',
      isActive: !!filters.serviceType,
    });

    // Specialization
    const hasSpec = !!(filters.specializations && filters.specializations.length > 0);
    items.push({
      id: 'specialization',
      label: hasSpec
        ? filters.specializations!.length === 1
          ? filters.specializations![0]
          : `تخصصات (${filters.specializations!.length})`
        : 'التخصص',
      icon: 'sparkles-outline',
      isActive: hasSpec,
    });

    // Location / City
    const hasLocation = !!(filters.governorateId || filters.city || filters.governorate);
    const locationLabel = filters.city || filters.governorate || 'الموقع';
    items.push({
      id: 'city',
      label: hasLocation ? locationLabel : 'الموقع',
      icon: 'location-outline',
      isActive: hasLocation,
    });

    // Provider Type
    const foundProvider = PROVIDER_TYPES.find((p) => p.id === filters.providerType);
    items.push({
      id: 'providerType',
      label: foundProvider ? foundProvider.label : 'نوع المزود',
      icon: 'business-outline',
      isActive: !!filters.providerType,
    });

    // Open Now (Toggle)
    items.push({
      id: 'isOpenNow',
      label: 'مفتوح الآن',
      icon: 'time-outline',
      isActive: !!filters.isOpenNow,
    });

    // Home Service (Toggle)
    items.push({
      id: 'isHomeService',
      label: 'خدمة منزلية',
      icon: 'home-outline',
      isActive: !!filters.isHomeService,
    });

    return items;
  }, [filters]);

  const handleFilterPress = useCallback((id: string) => {
    if (id === 'isOpenNow') {
      setFilters((prev) => {
        const next = { ...prev };
        if (next.isOpenNow) {
          delete next.isOpenNow;
        } else {
          next.isOpenNow = true;
        }
        return next;
      });
    } else if (id === 'isHomeService') {
      setFilters((prev) => {
        const next = { ...prev };
        if (next.isHomeService) {
          delete next.isHomeService;
        } else {
          next.isHomeService = true;
        }
        return next;
      });
    } else if (
      id === 'serviceType' ||
      id === 'specialization' ||
      id === 'providerType' ||
      id === 'city'
    ) {
      setActiveDropdown(id);
    }
  }, []);

  const handleClearQuickFilter = useCallback((filterId: string) => {
    setFilters((prev) => clearServicesQuickFilter(prev, filterId));
  }, []);

  const handleVisualFilterSelect = useCallback((
    type: 'serviceType' | 'specialization' | 'city' | 'providerType',
    valueId: string,
    valueName?: string,
    extraId?: number
  ) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (type === 'serviceType') {
        if (!valueId || prev.serviceType === valueId) {
          delete next.serviceType;
        } else {
          next.serviceType = valueId;
        }
      } else if (type === 'specialization') {
        if (!valueId || prev.specializations?.includes(valueId)) {
          delete next.specializations;
        } else {
          next.specializations = [valueId];
        }
      } else if (type === 'city') {
        if (!valueId || prev.city === valueName) {
          delete next.city;
          delete next.governorate;
          delete next.wilayaId;
          delete next.governorateId;
        } else {
          next.city = valueName;
          next.wilayaId = Number(valueId);
          next.governorateId = extraId;
        }
      } else if (type === 'providerType') {
        if (!valueId || prev.providerType === valueId) {
          delete next.providerType;
        } else {
          next.providerType = valueId;
        }
      }
      return next;
    });
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
      handler = () => router.push({ pathname: '/services/[id]', params: { id } });
      itemPressHandlersRef.current.set(id, handler);
    }
    return handler;
  }, []);

  const listData = useMemo(
    () => (showSkeleton ? (Array(6).fill({}) as UnifiedCardItem[]) : listings),
    [showSkeleton, listings]
  );

  const keyExtractor = useCallback(
    (item: UnifiedCardItem, index: number) => item.id || `skeleton-${index}`,
    []
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: UnifiedCardItem }) => {
      if (showSkeleton) {
        return (
          <View style={styles.cardWrapper}>
            <ServiceSkeletonCard fullWidth />
          </View>
        );
      }
      return (
        <View style={styles.cardWrapper}>
          <ServiceCard
            item={item}
            fullWidth
            onPress={getItemPressHandler(item.id)}
            glassSupport={glassSupport}
          />
        </View>
      );
    },
    [showSkeleton, getItemPressHandler, glassSupport]
  );

  const listHeaderComponent = useMemo(
    () => (
      <View style={styles.listHeader}>
        <ServicesVisualFilters
          selectedServiceType={filters.serviceType}
          selectedSpecialization={filters.specializations?.[0]}
          selectedCity={filters.city}
          selectedProviderType={filters.providerType}
          onSelectFilter={handleVisualFilterSelect}
          onViewAll={handleViewAllVisualFilters}
          glassSupport={glassSupport}
        />

        {!showSkeleton && listings && listings.length > 0 && (
          <BrowseResultsBar
            resultsCount={listings.length}
            entityName="خدمة"
            iconName="construct-outline"
            activeFiltersCount={activeFiltersCount}
            onClearAll={handleClearAll}
            glassSupport={glassSupport}
          />
        )}
      </View>
    ),
    [
      filters.serviceType,
      filters.specializations,
      filters.city,
      filters.providerType,
      handleVisualFilterSelect,
      handleViewAllVisualFilters,
      glassSupport,
      showSkeleton,
      listings,
      activeFiltersCount,
      handleClearAll,
    ]
  );

  const listFooterComponent = useMemo(
    () => (
      <>
        {isFetchingNextPage && (
          <View style={styles.footerLoader}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        )}
        {isFetchNextPageError && (
          <View style={styles.paginationErrorRow} testID="services-pagination-error">
            <Text style={styles.paginationErrorText}>تعذر تحميل المزيد من الخدمات</Text>
            <TouchableOpacity
              style={styles.paginationRetryButton}
              onPress={() => fetchNextPage()}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="إعادة المحاولة"
              testID="services-pagination-retry-button"
            >
              <Text style={styles.paginationRetryText}>إعادة المحاولة</Text>
            </TouchableOpacity>
          </View>
        )}
        {!showSkeleton && listings && listings.length > 0 && (
          <SectionFooterAction
            title="لديك مركز صيانة أو تقدم خدمات؟"
            subtitle="انشر خدماتك الآن ووصل لآلاف العملاء في منطقتك"
            buttonText="أضف خدمتك"
            iconName="construct-outline"
            iconImage={CATEGORY_ICONS.services}
            onPress={handleAddService}
          />
        )}
      </>
    ),
    [isFetchingNextPage, isFetchNextPageError, fetchNextPage, showSkeleton, listings, handleAddService]
  );

  const listEmptyComponent = useMemo(() => {
    if (showSkeleton) {
      return null;
    }

    if (isError && listings.length === 0) {
      const errorProps = getListErrorProps(error, 'تعذر تحميل الخدمات');
      return (
        <EmptyState
          testID="services-browse-error-state"
          icon={errorProps.icon}
          iconColor={errorProps.iconColor}
          title={errorProps.title}
          subtitle={errorProps.subtitle}
          actionLabel={errorProps.actionLabel}
          actionIcon="refresh-outline"
          onAction={() => refetch()}
        />
      );
    }

    const hasActiveFiltersOrSearch = activeFiltersCount > 0 || debouncedSearch.trim().length > 0;

    return (
      <EmptyState
        testID="services-browse-empty-state"
        icon="construct-outline"
        iconSize={40}
        iconColor={Colors.primary}
        title="لم يتم العثور على خدمات مطابقة"
        subtitle={
          hasActiveFiltersOrSearch
            ? 'جرب تغيير معايير البحث أو إزالة بعض الفلاتر.'
            : 'لا توجد خدمات متاحة في هذا القسم حالياً.'
        }
        actionLabel={hasActiveFiltersOrSearch ? 'إعادة تعيين الكل' : 'تحديث الصفحة'}
        actionIcon={hasActiveFiltersOrSearch ? 'close-circle-outline' : 'refresh-outline'}
        onAction={hasActiveFiltersOrSearch ? handleClearAll : () => refetch()}
      />
    );
  }, [showSkeleton, isError, error, listings.length, activeFiltersCount, debouncedSearch, refetch, handleClearAll]);

  return (
    <View style={styles.container}>
      <BrowseHeader
        searchPlaceholder="ابحث عن خدمة، ورشة، أو مركز..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onFilterPress={() => setIsFilterVisible(true)}
        activeFiltersCount={activeFiltersCount}
        glassSupport={glassSupport}
      />

      <CollapsibleSubHeader>
        <ListingTabs
          tabs={PROVIDER_TABS}
          activeTabId={currentTabId}
          onChangeTab={handleChangeTab}
          onClearTab={handleClearTab}
          glassSupport={glassSupport}
        />
        <QuickFilters
          filters={quickFilterItems}
          onFilterPress={handleFilterPress}
          onClearFilter={handleClearQuickFilter}
          glassSupport={glassSupport}
        />
      </CollapsibleSubHeader>

      {(isRefetchError || (isError && !isFetchNextPageError)) && listings.length > 0 && (
        <StaleDataBanner
          onRetry={() => refetch()}
          isRefetching={isFetching && !isFetchingNextPage}
        />
      )}

      {/* Main Content List */}
      <Animated.FlatList
        ref={flatListRef}
        {...BROWSE_LIST_VIRTUALIZATION_PROPS}
        data={listData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
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
            refreshing={isFetching && !showSkeleton && !isFetchingNextPage}
            onRefresh={refetch}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
            progressViewOffset={Spacing.space4}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={listHeaderComponent}
        ListFooterComponent={listFooterComponent}
        ListEmptyComponent={listEmptyComponent}
      />

      <QuickFilterModal
        visible={activeDropdown !== null}
        activeDropdown={activeDropdown}
        onClose={() => setActiveDropdown(null)}
        filters={filters}
        setFilters={setFilters}
        isService={true}
      />

      <ServicesFilterBottomSheet
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        initialFilters={filters}
        onApplyFilters={setFilters}
        resultsCount={infiniteData?.pages[0]?.rawItems?.length}
      />

      <ServicesBottomBar glassSupport={glassSupport} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  footerLoader: {
    paddingVertical: Spacing.space4,
    alignItems: 'center',
  },
  paginationErrorRow: {
    paddingVertical: Spacing.space4,
    paddingHorizontal: Spacing.space4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.space2,
  },
  paginationErrorText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 19,
    color: Colors.error,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  paginationRetryButton: {
    paddingHorizontal: Spacing.space4,
    paddingVertical: Spacing.space2,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationRetryText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.primary,
    writingDirection: 'rtl',
  },
});
