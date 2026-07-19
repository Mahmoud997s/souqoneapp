import React, { useState, useMemo } from 'react';
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
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useInfiniteQuery } from '@tanstack/react-query';

import { transportApi } from '../../src/api/transport';
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav';
import { useNavVisibility } from '../../src/context/NavVisibilityContext';
import { AppHeader } from '../../src/components/ui/AppHeader';

// Components
import { TransportRequestCard } from '../../src/components/transport/TransportRequestCard';
import { TransportFiltersModal } from '../../src/components/transport/TransportFiltersModal';
import { TransportSkeletonCard } from '../../src/components/transport/TransportSkeletonCard';

// Constants
import { Colors } from '../../src/constants/colors';
import { Spacing } from '../../src/constants/spacing';
import { Radius } from '../../src/constants/radius';
import { Gradients } from '../../src/constants/gradients';

interface FilterState {
  serviceType?: string;
  status?: string;
  fromGovernorate?: string;
  fromCity?: string;
  toGovernorate?: string;
  toCity?: string;
  budgetMin?: string;
  budgetMax?: string;
  timingType?: 'asap' | 'scheduled' | '';
  isFlexible?: boolean | null;
  requiresHelper?: boolean | null;
}

const LISTING_TYPES = [
  { id: 'ALL', label: 'الكل' },
  { id: 'GOODS', label: 'بضائع' },
  { id: 'FURNITURE', label: 'أثاث' },
  { id: 'EQUIPMENT', label: 'معدات' },
];

export default function TransportBrowseScreen() {
  const insets = useSafeAreaInsets();
  const { scrollHandler } = useScrollAwareNav();
  const { navHidden } = useNavVisibility();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>({});
  
  // Combine query parameters
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      limit: 30,
    };

    if (searchQuery.trim()) {
      params.search = searchQuery;
    }

    if (filters.serviceType && filters.serviceType !== 'ALL') params.serviceType = filters.serviceType;
    if (filters.status) params.status = filters.status;
    if (filters.fromGovernorate) params.fromGovernorate = filters.fromGovernorate;
    if (filters.fromCity) params.fromCity = filters.fromCity;
    if (filters.toGovernorate) params.toGovernorate = filters.toGovernorate;
    if (filters.toCity) params.toCity = filters.toCity;
    if (filters.budgetMin) params.budgetMin = Number(filters.budgetMin);
    if (filters.budgetMax) params.budgetMax = Number(filters.budgetMax);
    if (filters.timingType) params.timingType = filters.timingType;
    if (filters.isFlexible === true) params.isFlexible = true;
    if (filters.requiresHelper === true) params.requiresHelper = true;

    return params;
  }, [searchQuery, filters]);

  // Fetch Listings with Infinite Scrolling
  const { 
    data: infiniteData, 
    isLoading, 
    isError, 
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['transport-requests', queryParams],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await transportApi.getAll({ ...queryParams, page: pageParam });
      const d = res.data as any;
      return { items: d?.items ?? d?.data ?? (Array.isArray(d) ? d : []), meta: d?.meta };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta) return undefined;
      return lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined;
    }
  });

  const listings = infiniteData?.pages.flatMap(p => p.items) ?? [];
  const rawMeta = infiniteData?.pages[0]?.meta;

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.serviceType && filters.serviceType !== 'ALL') count++;
    if (filters.status) count++;
    if (filters.fromGovernorate) count++;
    if (filters.fromCity) count++;
    if (filters.toGovernorate) count++;
    if (filters.toCity) count++;
    if (filters.budgetMin) count++;
    if (filters.budgetMax) count++;
    if (filters.timingType) count++;
    if (filters.isFlexible === true) count++;
    if (filters.requiresHelper === true) count++;
    return count;
  }, [filters]);

  const headerStyle = useAnimatedStyle(() => {
    const translateY = interpolate(navHidden.value, [0, 1], [0, -150], Extrapolation.CLAMP);
    const opacity = interpolate(navHidden.value, [0, 0.5, 1], [1, 0.5, 0], Extrapolation.CLAMP);
    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  const handleSelectFilter = (type: 'service' | 'city' | 'status', valueId: string, valueName?: string) => {
    if (type === 'service') {
      setFilters(prev => ({ ...prev, serviceType: valueId }));
    } else if (type === 'city') {
      setFilters(prev => ({ ...prev, city: valueId }));
    } else if (type === 'status') {
      setFilters(prev => ({ ...prev, status: valueId }));
    }
  };

  const handleApplyAdvancedFilters = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
  };

  const handleClearAll = () => {
    setFilters({});
    setSearchQuery('');
  };

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={s.skeletonGrid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={s.fullCard}>
              <TransportSkeletonCard />
            </View>
          ))}
        </View>
      );
    }

    if (isError) {
      return (
        <View style={s.emptyContainer}>
          <View style={s.emptyIconWrapError}>
            <Ionicons name="cloud-offline" size={56} color="#ef4444" />
          </View>
          <Text style={s.emptyTitle}>عذراً، فقدنا الاتصال!</Text>
          <Text style={s.emptySub}>تعذر جلب البيانات من الخادم، يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => refetch()}>
            <Text style={s.retryBtnTxt}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={s.emptyContainer}>
        <View style={s.emptyIconWrap}>
          <Ionicons name="cube-outline" size={56} color={Colors.primary} />
        </View>
        <Text style={s.emptyTitle}>لا توجد طلبات نقل مطابقة</Text>
        <Text style={s.emptySub}>لم نتمكن من العثور على أي شحنات أو طلبات تتطابق مع معايير البحث الحالية الخاصة بك. جرب تغيير الفلاتر لتوسيع نطاق البحث.</Text>
        {activeFiltersCount > 0 && (
          <TouchableOpacity style={s.clearAllBtnInline} onPress={handleClearAll}>
            <Ionicons name="options" size={20} color="#fff" />
            <Text style={s.clearAllBtnInlineTxt}>مسح جميع الفلاتر</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={s.root}>
      <AppHeader
        showBack
        centerSlot={
          <View style={s.compactSearch}>
            <Ionicons name="search" size={16} color="rgba(255,255,255,0.7)" />
            <TextInput
              style={s.compactInput}
              placeholder="ابحث عن حمولة..."
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            ) : null}
          </View>
        }
        rightSlot={
          <TouchableOpacity style={s.iconBtn} onPress={() => setFilterModalVisible(true)}>
            <Ionicons name="options-outline" size={20} color="#fff" />
            {activeFiltersCount > 0 && (
              <View style={s.filterBadge}>
                <Text style={s.filterBadgeTxt}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        }
      />

      <Animated.View style={[s.headerContainer, headerStyle]}>
        {/* Listing Type Tabs (Quick Type Chips) */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={s.typeTabsScroll}
          contentContainerStyle={s.typeTabsContent}
        >
          {LISTING_TYPES.map(type => {
            const isActive = (filters.serviceType || 'ALL') === type.id;
            return (
              <TouchableOpacity
                key={type.id}
                style={[s.typeTab, isActive && s.typeTabActive]}
                onPress={() => setFilters(prev => ({ 
                  ...prev, 
                  serviceType: type.id
                }))}
              >
                <Text style={[s.typeTabTxt, isActive && s.typeTabTxtActive]}>{type.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* ── LISTINGS LIST ── */}
      <Animated.FlatList
        data={listings || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.listContent}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={isLoading && listings?.length > 0} onRefresh={refetch} tintColor={Colors.primary} />
        }
        ListHeaderComponent={
          <View style={{ marginBottom: 8 }}>
            <View style={s.resultsHeader}>
              <Text style={s.resultsCount}>
                {isLoading ? 'جاري البحث...' : `${rawMeta?.total ?? (listings?.length || 0)} طلب متاح`}
              </Text>
              {activeFiltersCount > 0 && (
                <TouchableOpacity onPress={handleClearAll} style={s.clearAllSmallBtn}>
                  <Text style={s.clearAllSmallBtnTxt}>مسح الكل</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.cardWrapper}>
            <TransportRequestCard 
              request={item} 
              onPress={() => router.push(`/transport/${item.id}` as any)} 
            />
          </View>
        )}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 24 }} />
          ) : null
        }
      />

      <TransportFiltersModal
        visible={isFilterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        currentFilters={filters}
        onApply={handleApplyAdvancedFilters}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  headerContainer: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 10,
  },
  compactSearch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 40,
    marginHorizontal: 12,
    gap: 8,
  },
  compactInput: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    color: '#fff',
    textAlign: 'right',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -2, right: -2,
    backgroundColor: '#ef4444',
    minWidth: 14, height: 14,
    borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0,
  },
  filterBadgeTxt: {
    color: '#fff', fontSize: 10, fontFamily: 'Almarai_700Bold', 
  },
  typeTabsScroll: {
    flexGrow: 0,
  },
  typeTabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  typeTab: {
    height: 36,
    paddingHorizontal: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'transparent',
  },
  typeTabActive: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary + '30',
  },
  typeTabTxt: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 14, color: '#64748b',
    lineHeight: 20,
  },
  typeTabTxtActive: {
    color: Colors.primary,
  },
  
  listContent: {
    paddingTop: 16,
    paddingBottom: 120, // increased for safe area
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  resultsCount: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 16, color: '#0f172a',
  },
  clearAllSmallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
  },
  clearAllSmallBtnTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: '#ef4444',
    lineHeight: 18,
  },
  cardWrapper: {
    paddingHorizontal: 16,
    marginBottom: 16,
    width: '100%',
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
    width: 100, height: 100,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  emptyIconWrapError: {
    width: 100, height: 100,
    borderRadius: 50,
    backgroundColor: '#fef2f2',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontFamily: 'Almarai_800ExtraBold', 
    fontSize: 22, color: '#0f172a',
    marginBottom: 12,
  },
  emptySub: {
    fontFamily: 'Almarai_400Regular', 
    fontSize: 15, color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  clearAllBtnInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 100, // pill
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  clearAllBtnInlineTxt: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 15, color: '#fff',
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 100,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryBtnTxt: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 15, color: '#fff',
    lineHeight: 20,
  },
});
