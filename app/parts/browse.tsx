import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';

// Hooks & Navigation
import { useInfiniteParts } from '../../src/hooks/useInfiniteParts';
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav';
import { useBrands } from '../../src/hooks/useCars';
import { useDebounce } from '../../src/hooks/useDebounce';
import { navigateToPartForm } from '../../src/components/ui/DraftResumePrompt';
import { locationsApi } from '../../src/api/locations';
import { GovernorateRef } from '../../src/types/location.types';

// UI Components
import { BrowseHeader } from '../../src/components/ui/BrowseHeader';
import { ListingTabs } from '../../src/components/ui/ListingTabs';
import { BrowseResultsBar } from '../../src/components/ui/BrowseResultsBar';
import { FilterGlassTokens } from '../../src/constants/filterGlassTokens';
import { QuickFilters, QuickFilterItem } from '../../src/components/ui/QuickFilters';
import { CollapsibleSubHeader } from '../../src/components/ui/CollapsibleSubHeader';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { SectionFooterAction } from '../../src/components/ui/SectionFooterAction';
import { CATEGORY_ICONS } from '../../src/constants/categoryIcons';
import { UnifiedCardItem } from '../../src/types/unified-card.types';

// Parts Components
import { PartCard } from '../../src/components/parts/PartCard';
import { PartSkeletonCard } from '../../src/components/parts/PartSkeletonCard';
import { PartsVisualFilters } from '../../src/components/parts/PartsVisualFilters';
import { PartsFilterBottomSheet } from '../../src/components/parts/PartsFilterBottomSheet';
import { QuickFilterModal } from '../../src/components/filters/QuickFilterModal';
import { PartsFilterState } from '../../src/types/filters.types';
import {
  buildPartsQueryParams,
  clearPartsFilter,
  mergePartsRouteParams,
  parsePartsInitialFilters,
  applyPartsFilter,
  normalizePartBrands,
  NormalizedPartBrand,
  PartsDropdownKind,
  ApplyPartsFilterExtra,
} from '../../src/utils/browse-filters/partsBrowseFilters';
import { PartsBottomBar } from '../../src/components/parts/PartsBottomBar';
import { UNIFIED_BOTTOM_BAR_HEIGHT } from '../../src/components/navigation/UnifiedBottomBar';

// Constants
import { Colors } from '../../src/constants/colors';
import { Spacing } from '../../src/constants/spacing';
import {
  PART_CATEGORIES,
  PART_CONDITIONS,
  POPULAR_PART_MAKES,
  PARTS_PRICE_RANGES,
  PARTS_SORT_OPTIONS,
  PARTS_LISTING_TABS,
} from '../../src/constants/parts';

const DROPDOWN_FILTERS = [
  { id: 'category', label: 'القسم', icon: 'grid-outline' },
  { id: 'make', label: 'الماركة', icon: 'car-sport-outline' },
  { id: 'condition', label: 'الحالة', icon: 'shield-checkmark-outline' },
  { id: 'price', label: 'السعر', icon: 'wallet-outline' },
  { id: 'city', label: 'المدينة', icon: 'location-outline' },
  { id: 'sort', label: 'الترتيب', icon: 'swap-vertical-outline' },
];

export default function PartsBrowseScreen() {
  const insets = useSafeAreaInsets();
  const { scrollHandler } = useScrollAwareNav();

  const searchParams = useLocalSearchParams<{
    q?: string;
    category?: string;
    condition?: string;
    isOriginal?: string;
    isScrap?: string;
    make?: string;
    city?: string;
    governorateId?: string;
    wilayaId?: string;
    priceMin?: string;
    priceMax?: string;
    partNumber?: string;
  }>();

  const listRef = useRef<FlatList<UnifiedCardItem>>(null);
  const [governorates, setGovernorates] = useState<GovernorateRef[]>([]);

  useEffect(() => {
    let isMounted = true;
    locationsApi
      .getGovernorates()
      .then((data) => {
        if (isMounted) setGovernorates(data);
      })
      .catch(() => {
        if (isMounted) setGovernorates([]);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState(searchParams.q || '');
  const [selectedListingTab, setSelectedListingTab] = useState<string>('ALL');

  const [filters, setFilters] = useState<PartsFilterState>(() => {
    return parsePartsInitialFilters(searchParams as Record<string, string | undefined>);
  });

  // G-07: Merge incoming route params into existing filter state without wiping selections
  useEffect(() => {
    setFilters((prev) => mergePartsRouteParams(prev, searchParams as Record<string, string | undefined>));
  }, [searchParams.category, searchParams.condition, searchParams.isOriginal, searchParams.isScrap, searchParams.make, searchParams.city, searchParams.governorateId, searchParams.wilayaId, searchParams.priceMin, searchParams.priceMax, searchParams.partNumber]);

  // Sync search query parameter independently to prevent resetting user typing on filter changes
  useEffect(() => {
    if (searchParams.q !== undefined) {
      setSearchQuery(searchParams.q);
    }
  }, [searchParams.q]);

  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const handleAddPart = () => {
    navigateToPartForm();
  };

  // Dropdown Modal State
  const [activeDropdown, setActiveDropdown] = useState<PartsDropdownKind | null>(null);
  const { data: brands } = useBrands();

  const availableBrands: NormalizedPartBrand[] = useMemo(() => {
    return normalizePartBrands(brands && brands.length > 0 ? brands : POPULAR_PART_MAKES);
  }, [brands]);

  const activeDropdownData = useMemo(() => {
    if (!activeDropdown) return null;

    switch (activeDropdown) {
      case 'category':
        return {
          title: 'اختر القسم',
          options: PART_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
          selectedId: filters.category,
        };
      case 'make':
        return {
          title: 'اختر الماركة المتوافقة',
          options: availableBrands.map((b) => ({ id: b.id, label: b.label })),
          selectedId: filters.makeId || filters.make,
        };
      case 'condition':
        return {
          title: 'حالة القطعة',
          options: PART_CONDITIONS.map((c) => ({ id: c.id, label: c.label })),
          selectedId: filters.condition,
        };
      case 'city':
        return {
          title: 'اختر المدينة',
          options: governorates.map((g) => ({
            id: String(g.id),
            label: g.nameAr,
          })),
          selectedId: filters.governorateId ? String(filters.governorateId) : undefined,
        };
      case 'price':
        return {
          title: 'نطاق السعر',
          options: PARTS_PRICE_RANGES.map((p) => ({ id: p.id, label: p.label })),
          selectedId: filters.priceId,
        };
      case 'sort':
        return {
          title: 'ترتيب النتائج',
          options: PARTS_SORT_OPTIONS.map((s) => ({ id: s.id, label: s.label })),
          selectedId:
            PARTS_SORT_OPTIONS.find(
              (s) => s.sortBy === filters.sortBy && s.sortOrder === filters.sortOrder
            )?.id || undefined,
        };
      default:
        return null;
    }
  }, [activeDropdown, availableBrands, governorates, filters]);

  // Synchronize listing tabs with filter state
  const handleTabChange = (tabId: string) => {
    setSelectedListingTab(tabId);
    setFilters((prev: PartsFilterState) => {
      const next = { ...prev };
      if (tabId === 'ALL') {
        delete next.isOriginal;
        delete next.isScrap;
      } else if (tabId === 'ORIGINAL') {
        next.isOriginal = true;
        delete next.isScrap;
      } else if (tabId === 'AFTERMARKET') {
        next.isOriginal = false;
        delete next.isScrap;
      } else if (tabId === 'SCRAP') {
        next.isScrap = true;
        delete next.isOriginal;
      }
      return next;
    });
  };

  // Debounce search query to prevent lag and excessive API requests
  const debouncedSearch = useDebounce(searchQuery, 400);

  // Combine query parameters for API call using pure module
  const queryParams = useMemo(() => {
    return buildPartsQueryParams(filters, debouncedSearch);
  }, [debouncedSearch, filters]);

  // G-06: Scroll to top on filter / query change
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [queryParams]);

  // Fetch infinite parts
  const {
    data: infiniteData,
    isLoading,
    isFetching,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteParts(queryParams);

  const listings = useMemo(
    () => infiniteData?.pages.flatMap((page) => page.items) ?? [],
    [infiniteData]
  );

  // Active filters count calculation
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    const skipKeys = new Set(['makeId', 'priceId']);
    Object.entries(filters).forEach(([key, val]) => {
      if (skipKeys.has(key)) return;
      if (val !== undefined && val !== '') count++;
    });
    return count;
  }, [filters]);

  // Quick filter chips representation
  const quickFilterItems: QuickFilterItem[] = DROPDOWN_FILTERS.map((qf) => {
    let isActive = false;
    let displayLabel = qf.label;

    if (qf.id === 'category') {
      isActive = !!filters.category;
      if (isActive) {
        const found = PART_CATEGORIES.find((c) => c.id === filters.category);
        displayLabel = found ? found.label : (filters.category as string);
      }
    } else if (qf.id === 'make') {
      isActive = !!filters.make;
      if (isActive) displayLabel = filters.make as string;
    } else if (qf.id === 'condition') {
      isActive = !!filters.condition;
      if (isActive) {
        const found = PART_CONDITIONS.find((c) => c.id === filters.condition);
        displayLabel = found ? found.label : (filters.condition as string);
      }
    } else if (qf.id === 'price') {
      isActive = !!filters.priceMax || !!filters.priceMin;
      if (isActive) {
        const found = PARTS_PRICE_RANGES.find((p) => p.max === Number(filters.priceMax));
        displayLabel = found ? found.label : (filters.priceMax ? `حتى ${filters.priceMax} ر.ع` : 'السعر');
      }
    } else if (qf.id === 'city') {
      isActive = !!filters.city || !!filters.governorate || !!filters.governorateId;
      if (isActive) displayLabel = (filters.governorate || filters.city) as string;
    } else if (qf.id === 'sort') {
      isActive = !!filters.sortBy;
      if (isActive) {
        const found = PARTS_SORT_OPTIONS.find(
          (s) => s.sortBy === filters.sortBy && s.sortOrder === filters.sortOrder
        );
        displayLabel = found ? found.label : 'الترتيب';
      }
    }

    return {
      id: qf.id,
      label: displayLabel,
      icon: qf.icon as any,
      isActive,
    };
  });

  const handleClearQuickFilter = useCallback((id: string) => {
    setFilters((prev: PartsFilterState) => clearPartsFilter(prev, id));
  }, []);

  const handleSelectVisualFilter = useCallback((
    type: 'category' | 'make' | 'city' | 'price' | 'condition' | 'isOriginal',
    valueId: string,
    valueName?: string,
    min?: number,
    max?: number
  ) => {
    setFilters((prev: PartsFilterState) => {
      const next = { ...prev };
      if (type === 'category') {
        next.category = next.category === valueId ? undefined : valueId;
      } else if (type === 'make') {
        if (next.make === valueName || next.makeId === valueId) {
          next.make = undefined;
          next.makeId = undefined;
        } else {
          next.makeId = valueId;
          next.make = valueName;
        }
      } else if (type === 'city') {
        next.city = next.city === valueId ? undefined : valueId;
      } else if (type === 'price') {
        if (next.priceId === valueId) {
          next.priceMin = undefined;
          next.priceMax = undefined;
          next.priceId = undefined;
        } else {
          next.priceMin = min?.toString();
          next.priceMax = max ? max.toString() : '999999';
          next.priceId = valueId;
        }
      } else if (type === 'condition') {
        next.condition = next.condition === valueId ? undefined : valueId;
      } else if (type === 'isOriginal') {
        if (valueId === 'true') {
          next.isOriginal = next.isOriginal === true ? undefined : true;
        } else {
          next.isOriginal = next.isOriginal === false ? undefined : false;
        }
      }
      return next;
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setFilters({});
    setSearchQuery('');
    setSelectedListingTab('ALL');
  }, []);

  const showSkeleton = isLoading || (isFetching && listings.length === 0);

  const renderEmptyState = () => {
    if (showSkeleton) {
      return (
        <View style={s.skeletonGrid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={s.fullCard}>
              <PartSkeletonCard fullWidth />
            </View>
          ))}
        </View>
      );
    }

    if (isError) {
      return (
        <EmptyState
          icon="alert-circle-outline"
          iconColor={Colors.error}
          title="حدث خطأ أثناء تحميل قطع الغيار"
          subtitle="تعذر الاتصال بالخادم لجلب البيانات، يرجى المحاولة مرة أخرى."
          actionLabel="إعادة المحاولة"
          actionIcon="refresh-outline"
          onAction={() => refetch()}
        />
      );
    }

    const hasActiveFiltersOrSearch = activeFiltersCount > 0 || debouncedSearch.trim().length > 0;

    return (
      <EmptyState
        icon="car-cog"
        iconType="material-community"
        iconSize={40}
        iconColor={Colors.primary}
        title="لا توجد قطع غيار مطابقة"
        subtitle={
          hasActiveFiltersOrSearch
            ? "لم نعثر على أي نتائج تطابق خيارات التصفية أو البحث الحالية. جرب مسح بعض الفلاتر."
            : "لا توجد قطع غيار متاحة في هذا القسم حالياً."
        }
        actionLabel={hasActiveFiltersOrSearch ? "إعادة تعيين الكل" : "تحديث الصفحة"}
        actionIcon={hasActiveFiltersOrSearch ? "close-circle-outline" : "refresh-outline"}
        onAction={hasActiveFiltersOrSearch ? handleClearAll : () => refetch()}
      />
    );
  };

  return (
    <View style={s.root}>
      {/* Browse Header */}
      <BrowseHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="ابحث عن قطعة غيار، رقم القطعة، أو الماركة..."
        activeFiltersCount={activeFiltersCount}
        onFilterPress={() => setIsFilterVisible(true)}
      />

      {/* Collapsible SubHeader with Listing Tabs & Quick Filter Chips */}
      <CollapsibleSubHeader>
        <ListingTabs
          tabs={PARTS_LISTING_TABS}
          activeTabId={selectedListingTab}
          onChangeTab={handleTabChange}
          onClearTab={() => handleTabChange('ALL')}
        />
        <QuickFilters
          filters={quickFilterItems}
          onFilterPress={(id) => setActiveDropdown(id as PartsDropdownKind)}
          onClearFilter={handleClearQuickFilter}
        />
      </CollapsibleSubHeader>

      {/* Main Animated List */}
      <Animated.FlatList
        ref={listRef}
        key="parts-browse-list"
        data={listings}
        keyExtractor={(item, index) => (item as any)?.id || String(index)}
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
            refreshing={isFetching && !showSkeleton}
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
        ListHeaderComponent={
          <View style={s.listHeader}>
            <PartsVisualFilters
              selectedCategory={filters.category}
              selectedMake={filters.make}
              onSelectFilter={handleSelectVisualFilter}
              onViewAll={() => setIsFilterVisible(true)}
            />

            {listings && listings.length > 0 && (
              <BrowseResultsBar
                resultsCount={listings.length}
                entityName="قطعة غيار"
                customIcon={
                  <MaterialCommunityIcons
                    name="car-cog"
                    size={14}
                    color={FilterGlassTokens.resultsBar.countIconColor}
                  />
                }
                activeFiltersCount={activeFiltersCount}
                onClearAll={handleClearAll}
              />
            )}
          </View>
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={() => (
          <>
            {isFetchingNextPage && (
              <ActivityIndicator size="small" color={Colors.primary} style={{ margin: 20 }} />
            )}
            {listings && listings.length > 0 && (
              <SectionFooterAction
                title="لديك قطعة للبيع؟"
                subtitle="انشر إعلانك الآن ووصل لآلاف المشترين"
                buttonText="انشر إعلانك"
                iconName="construct-outline"
                iconImage={CATEGORY_ICONS.parts}
                onPress={handleAddPart}
              />
            )}
          </>
        )}
        renderItem={({ item }) => (
          <View style={s.cardWrapper}>
            <PartCard
              item={item}
              onPress={() => router.push(`/parts/${item.id}` as any)}
              fullWidth
              showChips
              maxChips={5}
            />
          </View>
        )}
      />

      {/* Comprehensive Filter Bottom Sheet */}
      <PartsFilterBottomSheet
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        initialFilters={filters}
        onApplyFilters={(appliedFilters) => setFilters(appliedFilters)}
      />

      {/* Quick Dropdown Modal */}
      <QuickFilterModal
        visible={activeDropdown !== null}
        title={activeDropdownData?.title || ''}
        options={activeDropdownData?.options || []}
        selectedId={activeDropdownData?.selectedId}
        onSelect={(id) => {
          if (activeDropdown) {
            const extra: ApplyPartsFilterExtra = {};
            if (activeDropdown === 'make') {
              const foundBrand = availableBrands.find((b) => b.id === id);
              if (foundBrand) {
                extra.brandName = foundBrand.value;
              }
            } else if (activeDropdown === 'city') {
              const foundGov = governorates.find((g) => String(g.id) === id);
              if (foundGov) {
                extra.governorateName = foundGov.nameAr;
              }
            }
            setFilters((prev) => applyPartsFilter(prev, activeDropdown, id, extra));
          }
        }}
        onClose={() => setActiveDropdown(null)}
        accentColor={Colors.primary}
      />

      <PartsBottomBar />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    paddingBottom: Spacing.space4,
  },
  listHeader: {
    marginBottom: Spacing.space2,
  },
  cardWrapper: {
    paddingHorizontal: Spacing.space4,
    marginBottom: Spacing.space3,
  },
  skeletonGrid: {
    paddingHorizontal: Spacing.space4,
    gap: Spacing.space3,
    paddingTop: Spacing.space2,
  },
  fullCard: {
    width: '100%',
  },
});
