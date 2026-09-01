import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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

// UI Components
import { BrowseHeader } from '../../src/components/ui/BrowseHeader';
import { ListingTabs } from '../../src/components/ui/ListingTabs';
import { QuickFilters, QuickFilterItem } from '../../src/components/ui/QuickFilters';
import { CollapsibleSubHeader } from '../../src/components/ui/CollapsibleSubHeader';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ActionBanner } from '../../src/components/ui/ActionBanner';
import { SupportHelpButton } from '../../src/components/ui/SupportHelpButton';

// Parts Components
import { PartCard } from '../../src/components/parts/PartCard';
import { PartSkeletonCard } from '../../src/components/parts/PartSkeletonCard';
import { PartsVisualFilters } from '../../src/components/parts/PartsVisualFilters';
import { PartsFilterBottomSheet } from '../../src/components/parts/PartsFilterBottomSheet';
import { PartsFilterState } from '../../src/types/filters.types';

// Constants
import { Colors } from '../../src/constants/colors';
import { Spacing } from '../../src/constants/spacing';
import { Radius } from '../../src/constants/radius';
import { GOVERNORATE_OPTIONS } from '../../src/constants/filters';
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
    priceMin?: string;
    priceMax?: string;
    partNumber?: string;
  }>();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState(searchParams.q || '');
  const [selectedListingTab, setSelectedListingTab] = useState<string>('ALL');

  const [filters, setFilters] = useState<PartsFilterState>(() => {
    const initial: PartsFilterState = {};
    if (searchParams.category) initial.category = searchParams.category;
    if (searchParams.condition) initial.condition = searchParams.condition;
    if (searchParams.isOriginal === 'true') initial.isOriginal = true;
    if (searchParams.isOriginal === 'false') initial.isOriginal = false;
    if (searchParams.isScrap === 'true') initial.isScrap = true;
    if (searchParams.make) initial.make = searchParams.make;
    if (searchParams.city) initial.city = searchParams.city;
    if (searchParams.priceMin) initial.priceMin = searchParams.priceMin;
    if (searchParams.priceMax) initial.priceMax = searchParams.priceMax;
    if (searchParams.partNumber) initial.partNumber = searchParams.partNumber;
    return initial;
  });

  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const handleAddPart = () => {
    navigateToPartForm();
  };

  // Dropdown Modal State
  const [activeDropdown, setActiveDropdown] = useState<'category' | 'make' | 'condition' | 'price' | 'city' | 'sort' | null>(null);
  const { data: brands } = useBrands();

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

  // Combine query parameters for API call
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      limit: 30,
    };

    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }

    if (filters.category) {
      params.partCategory = filters.category;
    }

    if (filters.make) {
      params.make = filters.make;
    }

    if (filters.condition) {
      params.condition = filters.condition;
    }

    if (filters.isOriginal !== undefined) {
      params.isOriginal = filters.isOriginal;
    }

    if (filters.isScrap) {
      params.isScrap = true;
    }

    if (filters.governorateId) {
      params.governorateId = String(filters.governorateId);
    }

    if (filters.wilayaId) {
      params.wilayaId = String(filters.wilayaId);
    }

    if (filters.partNumber) {
      params.partNumber = filters.partNumber;
    }

    if (filters.priceMin) {
      const pMin = parseFloat(filters.priceMin);
      if (!isNaN(pMin)) params.minPrice = String(pMin);
    }

    if (filters.priceMax) {
      const pMax = parseFloat(filters.priceMax);
      if (!isNaN(pMax)) params.maxPrice = String(pMax);
    }

    if (filters.sortBy) {
      params.sortBy = filters.sortBy;
      params.sortOrder = filters.sortOrder || 'DESC';
    }

    return params;
  }, [debouncedSearch, filters]);

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
      isActive = !!filters.city;
      if (isActive) displayLabel = filters.city as string;
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
    setFilters((prev: PartsFilterState) => {
      const newFilters = { ...prev };
      if (id === 'category') delete newFilters.category;
      if (id === 'make') {
        delete newFilters.make;
        delete newFilters.makeId;
      }
      if (id === 'condition') delete newFilters.condition;
      if (id === 'price') {
        delete newFilters.priceMin;
        delete newFilters.priceMax;
        delete newFilters.priceId;
      }
      if (id === 'city') {
        delete newFilters.city;
        delete newFilters.governorate;
      }
      if (id === 'sort') {
        delete newFilters.sortBy;
        delete newFilters.sortOrder;
      }
      return newFilters;
    });
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
          onFilterPress={(id) => setActiveDropdown(id as any)}
          onClearFilter={handleClearQuickFilter}
        />
      </CollapsibleSubHeader>

      {/* Main Animated List */}
      <Animated.FlatList
        key="parts-browse-list"
        data={listings}
        keyExtractor={(item, index) => (item as any)?.id || String(index)}
        contentContainerStyle={[
          s.listContent,
          { paddingTop: Spacing.space2, paddingBottom: Math.max(insets.bottom, 16) + 8 },
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
              <View style={s.resultsCountBar}>
                {activeFiltersCount > 0 ? (
                  <TouchableOpacity 
                    style={s.clearFiltersBtn} 
                    onPress={handleClearAll}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={12.5} color={Colors.error} />
                    <Text style={s.clearFiltersText}>مسح الفلاتر</Text>
                  </TouchableOpacity>
                ) : (
                  <View />
                )}

                <View style={s.countBadge}>
                  <MaterialCommunityIcons name="car-cog" size={14} color="#64748b" />
                  <Text style={s.countBadgeText}>
                    {listings.length} قطعة غيار متاحة
                  </Text>
                </View>
              </View>
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
              <>
                <ActionBanner
                  title="لديك قطعة للبيع؟"
                  subtitle="انشر إعلانك الآن ووصل لآلاف المشترين"
                  buttonText="انشر إعلانك"
                  iconName="camera-outline"
                  onPress={handleAddPart}
                />
                <SupportHelpButton />
              </>
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
      <Modal
        visible={!!activeDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveDropdown(null)}
      >
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveDropdown(null)}
        >
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                {activeDropdown === 'category'
                  ? 'اختر القسم'
                  : activeDropdown === 'make'
                  ? 'اختر الماركة المتوافقة'
                  : activeDropdown === 'condition'
                  ? 'حالة القطعة'
                  : activeDropdown === 'city'
                  ? 'اختر المدينة'
                  : activeDropdown === 'sort'
                  ? 'ترتيب النتائج'
                  : 'نطاق السعر'}
              </Text>
              <TouchableOpacity onPress={() => setActiveDropdown(null)}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Category Options */}
            {activeDropdown === 'category' && (
              <FlatList
                data={PART_CATEGORIES}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalOptionRow}
                    onPress={() => {
                      setFilters((prev: PartsFilterState) => ({ ...prev, category: item.id }));
                      setActiveDropdown(null);
                    }}
                  >
                    <Text
                      style={[
                        s.modalOptionTxt,
                        filters.category === item.id && s.modalOptionTxtActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {filters.category === item.id && (
                      <Ionicons name="checkmark" size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}

            {/* Make Options */}
            {activeDropdown === 'make' && (
              <FlatList
                data={brands && brands.length > 0 ? brands : POPULAR_PART_MAKES}
                keyExtractor={(item: any) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }: any) => {
                  const name = item.nameAr || item.name || item.label;
                  const isSelected = filters.make === name || filters.makeId === item.id;
                  return (
                    <TouchableOpacity
                      style={s.modalOptionRow}
                      onPress={() => {
                        setFilters((prev: PartsFilterState) => ({ ...prev, makeId: item.id, make: name }));
                        setActiveDropdown(null);
                      }}
                    >
                      <Text
                        style={[s.modalOptionTxt, isSelected && s.modalOptionTxtActive]}
                      >
                        {name}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark" size={20} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            {/* Condition Options */}
            {activeDropdown === 'condition' && (
              <FlatList
                data={PART_CONDITIONS}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalOptionRow}
                    onPress={() => {
                      setFilters((prev: PartsFilterState) => ({ ...prev, condition: item.id }));
                      setActiveDropdown(null);
                    }}
                  >
                    <Text
                      style={[
                        s.modalOptionTxt,
                        filters.condition === item.id && s.modalOptionTxtActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {filters.condition === item.id && (
                      <Ionicons name="checkmark" size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}

            {/* City Options */}
            {activeDropdown === 'city' && (
              <FlatList
                data={GOVERNORATE_OPTIONS}
                keyExtractor={(item) => item.value}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalOptionRow}
                    onPress={() => {
                      setFilters((prev: PartsFilterState) => ({ ...prev, city: item.labelAr }));
                      setActiveDropdown(null);
                    }}
                  >
                    <Text
                      style={[
                        s.modalOptionTxt,
                        filters.city === item.labelAr && s.modalOptionTxtActive,
                      ]}
                    >
                      {item.labelAr}
                    </Text>
                    {filters.city === item.labelAr && (
                      <Ionicons name="checkmark" size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}

            {/* Price Options */}
            {activeDropdown === 'price' && (
              <FlatList
                data={PARTS_PRICE_RANGES}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalOptionRow}
                    onPress={() => {
                      setFilters((prev: PartsFilterState) => ({
                        ...prev,
                        priceMin: item.min.toString(),
                        priceMax: item.max ? item.max.toString() : '999999',
                        priceId: item.id,
                      }));
                      setActiveDropdown(null);
                    }}
                  >
                    <Text
                      style={[
                        s.modalOptionTxt,
                        filters.priceId === item.id && s.modalOptionTxtActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {filters.priceId === item.id && (
                      <Ionicons name="checkmark" size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}

            {/* Sort Options */}
            {activeDropdown === 'sort' && (
              <FlatList
                data={PARTS_SORT_OPTIONS}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isSelected =
                    filters.sortBy === item.sortBy && filters.sortOrder === item.sortOrder;
                  return (
                    <TouchableOpacity
                      style={s.modalOptionRow}
                      onPress={() => {
                        setFilters((prev: PartsFilterState) => ({
                          ...prev,
                          sortBy: item.sortBy,
                          sortOrder: item.sortOrder,
                        }));
                        setActiveDropdown(null);
                      }}
                    >
                      <Text
                        style={[s.modalOptionTxt, isSelected && s.modalOptionTxtActive]}
                      >
                        {item.label}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark" size={20} color={Colors.primary} />
                      )}
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
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    paddingBottom: Spacing.space4,
  },
  listHeader: {
    marginBottom: Spacing.space2,
  },
  resultsCountBar: {
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
  countBadge: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  countBadgeText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: '#64748b',
    textAlign: 'left',
    writingDirection: 'rtl',
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
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: Spacing.space4,
  },
  errorTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: Colors.error,
    marginBottom: Spacing.space3,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  retryTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: Colors.white,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: Spacing.space4,
  },
  emptyTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 15,
    color: Colors.text,
    marginTop: Spacing.space3,
    marginBottom: Spacing.space1,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  clearAllBtn: {
    marginTop: Spacing.space3,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  clearAllBtnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.space4,
  },
  modalContent: {
    width: '90%',
    maxHeight: '70%',
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: Spacing.space3,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: Spacing.space2,
    marginBottom: Spacing.space2,
  },
  modalTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    lineHeight: 18,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  modalOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  modalOptionTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12.5,
    lineHeight: 17,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  modalOptionTxtActive: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.primary,
  },

});
