import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Platform,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Hooks & Navigation
import { useInfiniteServices } from '../../src/hooks/useInfiniteServices';
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav';
import { useDebounce } from '../../src/hooks/useDebounce';
import { usePostStore } from '../../src/store/postStore';
import { useAuthStore } from '../../src/store/authStore';

// UI Components
import { BrowseHeader } from '../../src/components/ui/BrowseHeader';
import { QuickFilters, QuickFilterItem } from '../../src/components/ui/QuickFilters';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ActionBanner } from '../../src/components/ui/ActionBanner';

// Services Components
import { ServiceCard } from '../../src/components/services/ServiceCard';
import { ServiceSkeletonCard } from '../../src/components/services/ServiceSkeletonCard';
import { ServicesVisualFilters } from '../../src/components/services/ServicesVisualFilters';
import { ServicesFilterBottomSheet } from '../../src/components/services/ServicesFilterBottomSheet';
import { ServicesFilterState } from '../../src/types/filters.types';

// Constants
import { Colors } from '../../src/constants/colors';
import { Spacing } from '../../src/constants/spacing';
import { GOVERNORATE_OPTIONS } from '../../src/constants/filters';
import { SERVICE_TYPES, PROVIDER_TYPES } from '../../src/constants/services';

const DROPDOWN_FILTERS = [
  { id: 'serviceType', label: 'نوع الخدمة', icon: 'build-outline' },
  { id: 'providerType', label: 'المزود', icon: 'person-outline' },
  { id: 'gov', label: 'الموقع', icon: 'location-outline' },
];

export default function ServicesBrowseScreen() {
  const insets = useSafeAreaInsets();
  const { scrollHandler } = useScrollAwareNav();

  const searchParams = useLocalSearchParams<{
    q?: string;
    serviceType?: string;
    providerType?: string;
    governorate?: string;
    isHomeService?: string;
  }>();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState(searchParams.q || '');

  const [filters, setFilters] = useState<ServicesFilterState>(() => {
    const initial: ServicesFilterState = {};
    if (searchParams.serviceType) initial.serviceType = searchParams.serviceType;
    if (searchParams.providerType) initial.providerType = searchParams.providerType;
    if (searchParams.governorate) initial.governorate = searchParams.governorate;
    if (searchParams.isHomeService === 'true') initial.isHomeService = true;
    return initial;
  });

  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const { set: setPostStore, reset: resetPostStore } = usePostStore();
  const { isLoggedIn } = useAuthStore();

  const handleAddService = useCallback(() => {
    if (!isLoggedIn) {
      router.push('/(auth)/login' as any);
      return;
    }
    resetPostStore();
    setPostStore({ category: 'services' });
    router.push('/post/step2' as any);
  }, [isLoggedIn, resetPostStore, setPostStore]);

  // Debounce search query to prevent lag and excessive API requests
  const debouncedSearch = useDebounce(searchQuery, 400);

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
    if (filters.governorate) params.governorate = filters.governorate;
    if (filters.city) params.city = filters.city;
    if (filters.isHomeService) params.isHomeService = true;
    if (filters.isOpenNow) params.isOpenNow = true;
    if (filters.specializations && filters.specializations.length > 0) {
      params.specializations = filters.specializations;
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
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== '') count++;
    });
    return count;
  }, [filters]);

  // Quick filter chips representation
  const quickFilterItems: QuickFilterItem[] = [];

  // Service Type
  if (filters.serviceType) {
    const found = SERVICE_TYPES.find((c) => c.id === filters.serviceType);
    quickFilterItems.push({
      id: 'serviceType',
      label: found ? found.label : filters.serviceType,
      icon: 'build-outline' as any,
      isActive: true,
    });
  } else {
    quickFilterItems.push({ id: 'serviceType', label: 'نوع الخدمة', icon: 'build-outline' as any, isActive: false });
  }

  // Specializations
  if (filters.specializations && filters.specializations.length > 0) {
    quickFilterItems.push({
      id: 'specializations',
      label: filters.specializations.length === 1 ? filters.specializations[0] : `تخصصات (${filters.specializations.length})`,
      icon: 'pricetags-outline' as any,
      isActive: true,
    });
  }

  // Provider Type
  if (filters.providerType) {
    const found = PROVIDER_TYPES.find((p) => p.id === filters.providerType);
    quickFilterItems.push({
      id: 'providerType',
      label: found ? found.label : filters.providerType,
      icon: 'person-outline' as any,
      isActive: true,
    });
  } else {
    quickFilterItems.push({ id: 'providerType', label: 'المزود', icon: 'person-outline' as any, isActive: false });
  }

  // Location / Near Me
  if (filters.latitude && filters.longitude) {
    quickFilterItems.push({
      id: 'nearMe',
      label: 'الأقرب لي',
      icon: 'location' as any,
      isActive: true,
    });
  } else if (filters.governorate || filters.city) {
    const govFound = GOVERNORATE_OPTIONS.find((g) => g.value === filters.governorate);
    const displayLabel = filters.city ? filters.city : (govFound ? govFound.labelAr : filters.governorate as string);
    quickFilterItems.push({
      id: 'gov',
      label: displayLabel,
      icon: 'location-outline' as any,
      isActive: true,
    });
  } else {
    quickFilterItems.push({ id: 'gov', label: 'الموقع', icon: 'location-outline' as any, isActive: false });
  }

  // Open Now
  if (filters.isOpenNow) {
    quickFilterItems.push({
      id: 'isOpenNow',
      label: 'مفتوح الآن',
      icon: 'time' as any,
      isActive: true,
    });
  }

  const handleClearQuickFilter = useCallback((filterId: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (filterId === 'serviceType') delete next.serviceType;
      if (filterId === 'providerType') delete next.providerType;
      if (filterId === 'specializations') delete next.specializations;
      if (filterId === 'isOpenNow') delete next.isOpenNow;
      if (filterId === 'nearMe') {
        delete next.latitude;
        delete next.longitude;
        delete next.radiusKm;
      }
      if (filterId === 'gov') {
        delete next.governorate;
        delete next.city;
      }
      return next;
    });
  }, []);

  const handleVisualFilterSelect = (type: 'serviceType', valueId: string, valueName?: string) => {
    setFilters((prev) => ({
      ...prev,
      [type]: valueId || undefined,
    }));
  };

  const handleClearAll = () => setFilters({});

  return (
    <View style={styles.container}>
      <BrowseHeader
        searchPlaceholder="ابحث عن خدمة، ورشة، أو مركز..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onFilterPress={() => setIsFilterVisible(true)}
        activeFiltersCount={activeFiltersCount}
      />

      <QuickFilters
        filters={quickFilterItems}
        onFilterPress={(id) => setIsFilterVisible(true)}
        onClearFilter={handleClearQuickFilter}
      />

      {/* Main Content List */}
      <Animated.FlatList
        data={isLoading ? Array(6).fill({}) : listings}
        keyExtractor={(item: any, index: number) => item.id || `skeleton-${index}`}
        renderItem={({ item, index }: { item: any; index: number }) => {
          if (isLoading) {
            return <ServiceSkeletonCard fullWidth style={{ marginHorizontal: Spacing.space4 }} />;
          }
          return (
            <ServiceCard
              item={item}
              fullWidth
              onPress={() => router.push(`/services/${item.id}` as any)}
            />
          );
        }}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, Spacing.space4) },
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
          <>
            <ServicesVisualFilters
              selectedServiceType={filters.serviceType}
              onSelectFilter={handleVisualFilterSelect}
            />

            {isError && (
              <View style={{ paddingHorizontal: Spacing.space4, marginBottom: Spacing.space4 }}>
                <ActionBanner
                  title="حدث خطأ"
                  subtitle="حدث خطأ أثناء تحميل الخدمات. يرجى المحاولة مرة أخرى."
                  buttonText="تحديث"
                  iconName="warning"
                  onPress={() => refetch()}
                  gradientColors={['#7f1d1d', '#991b1b', '#b91c1c']}
                />
              </View>
            )}
          </>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !isLoading && !isError ? (
            <EmptyState
              icon="build-outline"
              iconType="ionicons"
              title="لم يتم العثور على خدمات"
              subtitle="جرب تغيير معايير البحث أو إزالة بعض الفلاتر"
              actionLabel={activeFiltersCount > 0 ? 'إزالة الفلاتر' : undefined}
              onAction={activeFiltersCount > 0 ? handleClearAll : undefined}
            />
          ) : null
        }
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
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    flexGrow: 1,
    paddingTop: Spacing.space2,
  },
  filtersWrapper: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.space2,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: Spacing.space4,
  },
  footerLoader: {
    paddingVertical: Spacing.space4,
    alignItems: 'center',
  },
});
