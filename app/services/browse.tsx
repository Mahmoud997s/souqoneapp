import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import { CollapsibleSubHeader } from '../../src/components/ui/CollapsibleSubHeader';
import { ListingTabs, TabItem } from '../../src/components/ui/ListingTabs';
import { QuickFilters, QuickFilterItem } from '../../src/components/ui/QuickFilters';
import { QuickFilterModal } from '../../src/components/filters/QuickFilterModal';
import { BrowseEmptyState } from '../../src/components/ui/BrowseEmptyState';
import { SectionFooterAction } from '../../src/components/ui/SectionFooterAction';

// Services Components
import { ServiceCard } from '../../src/components/services/ServiceCard';
import { ServiceSkeletonCard } from '../../src/components/services/ServiceSkeletonCard';
import { ServicesVisualFilters } from '../../src/components/services/ServicesVisualFilters';
import { ServicesFilterBottomSheet } from '../../src/components/services/ServicesFilterBottomSheet';
import { ServicesFilterState } from '../../src/types/filters.types';

// Constants
import { Colors } from '../../src/constants/colors';
import { Spacing } from '../../src/constants/spacing';
import { SERVICE_TYPES, PROVIDER_TYPES } from '../../src/constants/services';

const PROVIDER_TABS: TabItem[] = [
  { id: 'WORKSHOP', label: 'مراكز وورش' },
  { id: 'INDIVIDUAL', label: 'فنيين مستقلين' },
  { id: 'MOBILE', label: 'خدمة متنقلة' },
];

function parseServicesFiltersFromParams(params: {
  q?: string;
  serviceType?: string;
  providerType?: string;
  governorate?: string;
  governorateId?: string;
  wilayaId?: string;
  isHomeService?: string;
}): ServicesFilterState {
  const initial: ServicesFilterState = {};
  if (params.serviceType) initial.serviceType = params.serviceType;
  if (params.providerType) {
    initial.providerType = params.providerType === 'CENTER' ? 'WORKSHOP' : params.providerType;
  }
  if (params.governorate) initial.governorate = params.governorate;
  if (params.governorateId) {
    const parsed = parseInt(String(params.governorateId), 10);
    if (!isNaN(parsed) && parsed > 0) initial.governorateId = parsed;
  }
  if (params.wilayaId) {
    const parsed = parseInt(String(params.wilayaId), 10);
    if (!isNaN(parsed) && parsed > 0) initial.wilayaId = parsed;
  }
  if (params.isHomeService === 'true') initial.isHomeService = true;
  return initial;
}

export default function ServicesBrowseScreen() {
  const insets = useSafeAreaInsets();
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

  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<
    'serviceType' | 'specialization' | 'providerType' | 'city' | 'sort' | null
  >(null);

  // Sync state whenever navigation params change (prevents stale filters when navigating)
  useEffect(() => {
    const nextFilters = parseServicesFiltersFromParams(searchParams);
    setFilters(nextFilters);
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

  const handleAddService = useCallback(() => {
    navigateToServiceForm();
  }, []);

  // Combine query parameters for API call
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      limit: 30,
    };

    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }

    if (filters.serviceType) params.serviceType = filters.serviceType;
    if (filters.providerType) params.providerType = filters.providerType;
    if (filters.governorateId) params.governorateId = filters.governorateId;
    if (filters.wilayaId) params.wilayaId = filters.wilayaId;
    if (filters.isHomeService) params.isHomeService = true;
    if (filters.isOpenNow) params.isOpenNow = true;
    if (filters.specializations && filters.specializations.length > 0) {
      params.specializations = filters.specializations;
    }
    if (filters.sortBy) {
      params.sortBy = filters.sortBy;
      params.sortOrder = filters.sortOrder || 'desc';
    }
    if (filters.latitude && filters.longitude) {
      params.latitude = filters.latitude;
      params.longitude = filters.longitude;
      if (filters.radiusKm) params.radiusKm = filters.radiusKm;
    }

    return params;
  }, [debouncedSearch, filters]);

  // Fetch infinite services
  const {
    data: infiniteData,
    isLoading,
    isFetching,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteServices(queryParams);

  const listings = useMemo(
    () => infiniteData?.pages.flatMap((page) => page.items) ?? [],
    [infiniteData]
  );

  // Active filters count calculation
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    Object.entries(filters).forEach(([_, val]) => {
      if (val !== undefined && val !== '' && val !== false) count++;
    });
    return count;
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
      icon: 'build-outline' as any,
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
      icon: 'sparkles-outline' as any,
      isActive: hasSpec,
    });

    // Location / City
    const hasLocation = !!(filters.governorateId || filters.city || filters.governorate);
    const locationLabel = filters.city || filters.governorate || 'الموقع';
    items.push({
      id: 'city',
      label: hasLocation ? locationLabel : 'الموقع',
      icon: 'location-outline' as any,
      isActive: hasLocation,
    });

    // Provider Type
    const foundProvider = PROVIDER_TYPES.find((p) => p.id === filters.providerType);
    items.push({
      id: 'providerType',
      label: foundProvider ? foundProvider.label : 'نوع المزود',
      icon: 'business-outline' as any,
      isActive: !!filters.providerType,
    });

    // Sort
    let sortLabel = 'الترتيب';
    if (filters.sortBy === 'rating') sortLabel = 'الأعلى تقييماً';
    else if (filters.sortBy === 'views') sortLabel = 'الأكثر طلباً';
    else if (filters.sortBy) sortLabel = 'الأحدث أولاً';
    items.push({
      id: 'sort',
      label: sortLabel,
      icon: 'swap-vertical-outline' as any,
      isActive: !!filters.sortBy,
    });

    // Open Now (Toggle)
    items.push({
      id: 'isOpenNow',
      label: 'مفتوح الآن',
      icon: 'time-outline' as any,
      isActive: !!filters.isOpenNow,
    });

    // Home Service (Toggle)
    items.push({
      id: 'isHomeService',
      label: 'خدمة منزلية',
      icon: 'home-outline' as any,
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
    } else {
      setActiveDropdown(id as any);
    }
  }, []);

  const handleClearQuickFilter = useCallback((filterId: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (filterId === 'serviceType') delete next.serviceType;
      if (filterId === 'providerType') delete next.providerType;
      if (filterId === 'specialization' || filterId === 'specializations') delete next.specializations;
      if (filterId === 'isOpenNow') delete next.isOpenNow;
      if (filterId === 'isHomeService') delete next.isHomeService;
      if (filterId === 'sort') {
        delete next.sortBy;
        delete next.sortOrder;
      }
      if (filterId === 'city' || filterId === 'gov') {
        delete next.governorateId;
        delete next.wilayaId;
        delete next.governorate;
        delete next.city;
      }
      return next;
    });
  }, []);

  const handleVisualFilterSelect = (
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
  };

  const handleClearAll = useCallback(() => {
    setFilters({});
    setSearchQuery('');
  }, []);

  return (
    <View style={styles.container}>
      <BrowseHeader
        searchPlaceholder="ابحث عن خدمة، ورشة، أو مركز..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onFilterPress={() => setIsFilterVisible(true)}
        activeFiltersCount={activeFiltersCount}
      />

      <CollapsibleSubHeader>
        <ListingTabs
          tabs={PROVIDER_TABS}
          activeTabId={currentTabId}
          onChangeTab={handleChangeTab}
          onClearTab={handleClearTab}
        />
        <QuickFilters
          filters={quickFilterItems}
          onFilterPress={handleFilterPress}
          onClearFilter={handleClearQuickFilter}
        />
      </CollapsibleSubHeader>

      {/* Main Content List */}
      <Animated.FlatList
        data={isLoading ? Array(6).fill({}) : listings}
        keyExtractor={(item: any, index: number) => item.id || `skeleton-${index}`}
        renderItem={({ item }: { item: any; index: number }) => {
          if (isLoading) {
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
                onPress={() => router.push(`/services/${item.id}` as any)}
              />
            </View>
          );
        }}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: Spacing.space2,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
          },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isFetchingNextPage}
            onRefresh={refetch}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
            progressViewOffset={Spacing.space4}
          />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <ServicesVisualFilters
              selectedServiceType={filters.serviceType}
              selectedSpecialization={filters.specializations?.[0]}
              selectedCity={filters.city}
              selectedProviderType={filters.providerType}
              onSelectFilter={handleVisualFilterSelect}
              onViewAll={(tabId) => setIsFilterVisible(true)}
            />

            {!isLoading && listings && listings.length > 0 && (
              <View style={styles.resultsRow}>
                {activeFiltersCount > 0 ? (
                  <TouchableOpacity
                    style={styles.clearFiltersBtn}
                    onPress={handleClearAll}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={12.5} color={Colors.error} />
                    <Text style={styles.clearFiltersText}>مسح الفلاتر</Text>
                  </TouchableOpacity>
                ) : (
                  <View />
                )}

                <View style={styles.resultsCountBadge}>
                  <Ionicons name="construct-outline" size={14} color="#64748b" />
                  <Text style={styles.resultsCountTxt}>
                    {listings.length} خدمة متاحة
                  </Text>
                </View>
              </View>
            )}
          </View>
        }
        ListFooterComponent={() => (
          <>
            {isFetchingNextPage && (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            )}
            {!isLoading && listings && listings.length > 0 && (
              <SectionFooterAction
                title="لديك مركز صيانة أو تقدم خدمات؟"
                subtitle="انشر خدماتك الآن ووصل لآلاف العملاء في منطقتك"
                buttonText="أضف خدمتك"
                iconName="construct-outline"
                onPress={handleAddService}
              />
            )}
          </>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <BrowseEmptyState
              isLoading={isLoading}
              isError={isError}
              activeFiltersCount={activeFiltersCount}
              onRetry={refetch}
              onClearAll={handleClearAll}
              iconName="construct-outline"
              emptyTitle="لم يتم العثور على خدمات مطابقة"
              emptySubtitle="جرب تغيير معايير البحث أو إزالة بعض الفلاتر"
              errorText="حدث خطأ أثناء تحميل الخدمات"
            />
          ) : null
        }
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
  resultsRow: {
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
  resultsCountBadge: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  resultsCountTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: '#64748b',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  cardWrapper: {
    paddingHorizontal: Spacing.space4,
    marginBottom: Spacing.space4,
  },
  footerLoader: {
    paddingVertical: Spacing.space4,
    alignItems: 'center',
  },
});
