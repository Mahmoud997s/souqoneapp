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
import { useQuery } from '@tanstack/react-query';

import { transportApi } from '../../src/api/transport';
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav';
import { useNavVisibility } from '../../src/context/NavVisibilityContext';

// Components
import { TransportRequestCard } from '../../src/components/cards/TransportRequestCard';
import { TransportVisualFilters } from '../../src/components/transport/TransportVisualFilters';
import { SkeletonCard } from '../../src/components/ui/SkeletonCard';

// Constants
import { Colors } from '../../src/constants/colors';
import { Spacing } from '../../src/constants/spacing';
import { Radius } from '../../src/constants/radius';

interface FilterState {
  serviceType?: string;
  status?: string;
  fromGovernorate?: string;
  toGovernorate?: string;
  city?: string;
  page: number;
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
  
  const [filters, setFilters] = useState<FilterState>({ page: 1 });
  
  // Combine query parameters
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      limit: 30,
      page: filters.page,
    };

    if (searchQuery.trim()) {
      params.search = searchQuery;
    }

    if (filters.serviceType && filters.serviceType !== 'ALL') {
      params.serviceType = filters.serviceType;
    }
    if (filters.status) params.status = filters.status;
    if (filters.fromGovernorate) params.fromGovernorate = filters.fromGovernorate;
    if (filters.city) params.fromCity = filters.city; // Map city filter to fromCity for demo

    return params;
  }, [searchQuery, filters]);

  // Fetch Listings
  const { data: raw, isLoading, isError, refetch } = useQuery({
    queryKey: ['transport-requests', queryParams],
    queryFn: async () => {
      const res = await transportApi.getAll(queryParams);
      const d = res.data as any;
      return { items: d?.items ?? d?.data ?? (Array.isArray(d) ? d : []), meta: d?.meta };
    },
  });

  const listings = raw?.items ?? [];

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.serviceType && filters.serviceType !== 'ALL') count++;
    if (filters.status) count++;
    if (filters.fromGovernorate) count++;
    if (filters.city) count++;
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
      setFilters(prev => ({ ...prev, serviceType: valueId, page: 1 }));
    } else if (type === 'city') {
      setFilters(prev => ({ ...prev, city: valueId, page: 1 }));
    } else if (type === 'status') {
      setFilters(prev => ({ ...prev, status: valueId, page: 1 }));
    }
  };

  const handleClearAll = () => {
    setFilters({ page: 1 });
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
        <View style={s.emptyContainer}>
          <View style={s.emptyIconWrapError}>
            <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          </View>
          <Text style={s.emptyTitle}>حدث خطأ!</Text>
          <Text style={s.emptySub}>تعذر جلب البيانات، يرجى المحاولة لاحقاً.</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => refetch()}>
            <Text style={s.retryBtnTxt}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={s.emptyContainer}>
        <View style={s.emptyIconWrap}>
          <Ionicons name="search-outline" size={48} color={Colors.primary} />
        </View>
        <Text style={s.emptyTitle}>لا توجد طلبات مطابقة</Text>
        <Text style={s.emptySub}>لم نعثر على أي طلبات تتطابق مع معايير البحث الخاصة بك.</Text>
        {activeFiltersCount > 0 && (
          <TouchableOpacity style={s.clearAllBtnInline} onPress={handleClearAll}>
            <Ionicons name="refresh-outline" size={18} color="#fff" />
            <Text style={s.clearAllBtnInlineTxt}>مسح الفلاتر</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={s.root}>
      {/* ── HEADER ── */}
      <Animated.View style={[s.headerContainer, { paddingTop: insets.top }, headerStyle]}>
        <LinearGradient colors={[Colors.primary, '#206B70']} style={StyleSheet.absoluteFillObject} />
        
        {/* Top Header */}
        <View style={s.topHeader}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-forward" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>طلبات النقل</Text>
          <TouchableOpacity style={s.addBtn} onPress={() => router.push('/transport/new' as any)}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search & Filter Row */}
        <View style={s.searchRow}>
          <View style={s.searchBox}>
            <Ionicons name="search" size={20} color="#94a3b8" style={s.searchIcon} />
            <TextInput
              style={s.searchInput}
              placeholder="ابحث عن حمولة..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={s.clearSearch}>
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={[s.filterBtnTop, activeFiltersCount > 0 && s.filterBtnTopActive]} 
            onPress={() => {}}
          >
            <Ionicons name="options" size={20} color={activeFiltersCount > 0 ? '#fff' : Colors.primary} />
            {activeFiltersCount > 0 && (
              <View style={s.filterBadge}>
                <Text style={s.filterBadgeTxt}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Listing Type Tabs */}
        <View style={s.typeTabs}>
          {LISTING_TYPES.map(type => {
            const isActive = (filters.serviceType || 'ALL') === type.id;
            return (
              <TouchableOpacity
                key={type.id}
                style={[s.typeTab, isActive && s.typeTabActive]}
                onPress={() => setFilters(prev => ({ 
                  ...prev, 
                  serviceType: type.id,
                  page: 1
                }))}
              >
                <Text style={[s.typeTabTxt, isActive && s.typeTabTxtActive]}>{type.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
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
          <View style={{ marginBottom: 16 }}>
            {/* Visual Grid Filters */}
            <TransportVisualFilters
              onSelectFilter={handleSelectFilter}
              onViewAll={() => {}}
              selectedServiceId={filters.serviceType}
              selectedCity={filters.city}
              selectedStatusId={filters.status}
            />
            
            <View style={s.resultsHeader}>
              <Text style={s.resultsCount}>
                {isLoading ? 'جاري البحث...' : `${raw?.meta?.total ?? (listings?.length || 0)} طلب متاح`}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.cardWrapper}>
            <TransportRequestCard 
              item={item} 
              onPress={() => router.push(`/transport/${item.id}` as any)} 
            />
          </View>
        )}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerContainer: {
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 10,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 44,
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Almarai_800ExtraBold', 
    fontSize: 20,
    color: '#fff',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontFamily: 'Almarai_400Regular', 
    fontSize: 15,
    color: '#0f172a',
    writingDirection: 'rtl',
  },
  clearSearch: { padding: 4 },
  filterBtnTop: {
    width: 48, height: 48,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnTopActive: {
    backgroundColor: Colors.primary,
    borderWidth: 1, borderColor: '#fff',
  },
  filterBadge: {
    position: 'absolute',
    top: -6, right: -6,
    backgroundColor: '#ef4444',
    minWidth: 20, height: 20,
    borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  filterBadgeTxt: {
    color: '#fff', fontSize: 10, fontFamily: 'Almarai_700Bold', 
  },
  typeTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 8,
  },
  typeTab: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'transparent',
  },
  typeTabActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  typeTabTxt: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 14, color: '#fff',
  },
  typeTabTxtActive: {
    color: Colors.primary,
  },
  
  listContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  resultsCount: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 16, color: '#0f172a',
  },
  cardWrapper: {
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
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
    width: 96, height: 96,
    borderRadius: 48,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  emptyIconWrapError: {
    width: 96, height: 96,
    borderRadius: 48,
    backgroundColor: '#fef2f2',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: 'Almarai_800ExtraBold', 
    fontSize: 20, color: '#0f172a',
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: 'Almarai_400Regular', 
    fontSize: 15, color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  clearAllBtnInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 12,
  },
  clearAllBtnInlineTxt: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 15, color: '#fff',
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 12,
  },
  retryBtnTxt: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 15, color: '#fff',
  },
});
