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

import { useEquipment } from '../../src/hooks/useEquipment';
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav';
import { useNavVisibility } from '../../src/context/NavVisibilityContext';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { GOVERNORATE_OPTIONS } from '../../src/constants/filters';

// Components
import { CarCard } from '../../src/components/cars/CarCard';
import { EquipmentVisualFilters } from '../../src/components/equipment/EquipmentVisualFilters';
import { EquipmentFilterBottomSheet } from '../../src/components/filters/EquipmentFilterBottomSheet';
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
  condition?: string;
  equipmentType?: string;
  sortBy?: string;
  sortOrder?: string;
}

const LISTING_TYPES = [
  { id: 'EQUIPMENT_SALE', label: 'للبيع' },
  { id: 'EQUIPMENT_RENT', label: 'للإيجار' },
];

export default function EquipmentBrowseScreen() {
  const insets = useSafeAreaInsets();
  const { scrollHandler } = useScrollAwareNav();
  const { navHidden } = useNavVisibility();

  const searchParams = useLocalSearchParams<{ type?: string }>();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  
  const [filters, setFilters] = useState<FilterState>(() => {
    const initialFilters: FilterState = {};
    const t = searchParams.type?.toLowerCase();
    
    if (t === 'used') {
      initialFilters.condition = 'USED';
      initialFilters.listingType = 'EQUIPMENT_SALE';
    } else if (t === 'new') {
      initialFilters.condition = 'NEW';
      initialFilters.listingType = 'EQUIPMENT_SALE';
    } else if (t === 'rental' || t === 'rent') {
      initialFilters.listingType = 'EQUIPMENT_RENT';
    } else if (t === 'sale') {
      initialFilters.listingType = 'EQUIPMENT_SALE';
    }
    
    return initialFilters;
  });
  
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  // Combine query parameters
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      limit: 30,
    };

    if (searchQuery.trim()) {
      params.search = searchQuery;
    }

    const skipKeys = new Set(['priceId', 'categoryId', 'conditionId']);

    // Apply all custom filters
    Object.entries(filters).forEach(([key, val]) => {
      if (skipKeys.has(key)) return;
      if (val !== undefined && val !== '') {
        if (key === 'priceMin' || key === 'priceMax') {
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
  }, [searchQuery, filters]);

  // Fetch Listings
  const { data: listings, isLoading, isError, refetch } = useEquipment(queryParams);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    const skipKeys = new Set(['priceId', 'categoryId', 'conditionId']);
    Object.entries(filters).forEach(([key, val]) => {
      if (skipKeys.has(key)) return;
      if (val !== undefined && val !== '') count++;
    });
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

  const handleSelectFilter = (type: 'category' | 'city' | 'price' | 'condition', valueId: string, valueName?: string, min?: number, max?: number) => {
    if (type === 'category') {
      setFilters(prev => ({ ...prev, equipmentType: valueId, categoryId: valueId }));
    } else if (type === 'city') {
      setFilters(prev => ({ ...prev, city: valueId }));
    } else if (type === 'price') {
      setFilters(prev => ({ ...prev, priceMin: min?.toString(), priceMax: max?.toString(), priceId: valueId }));
    } else if (type === 'condition') {
      setFilters(prev => ({ ...prev, condition: valueId, conditionId: valueId }));
    }
  };

  const handleApplyFilters = (appliedFilters: FilterState) => {
    setFilters(appliedFilters);
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
          <Ionicons name="search-outline" size={48} color={Colors.equipmentPrimary} />
        </View>
        <Text style={s.emptyTitle}>لا توجد معدات مطابقة</Text>
        <Text style={s.emptySub}>لم نعثر على أي معدات تتطابق مع معايير البحث الخاصة بك.</Text>
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
      <AppHeader
        showBack
        centerSlot={
          <View style={s.compactSearch}>
            <Ionicons name="search" size={16} color="rgba(255,255,255,0.7)" />
            <TextInput
              style={s.compactInput}
              placeholder="ابحث عن معدات..."
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}
          </View>
        }
        rightSlot={
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => setIsFilterVisible(!isFilterVisible)}
          >
            <Ionicons name="options-outline" size={20} color={Colors.white} />
            {activeFiltersCount > 0 && (
              <View style={s.filterBadge}>
                <Text style={s.filterBadgeTxt}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        }
      />

      {/* Listing Type Tabs */}
      <View style={s.listingTypeTabs}>
        {LISTING_TYPES.map(type => {
          const isActive = filters.listingType === type.id;
          return (
            <TouchableOpacity
              key={type.id}
              style={[s.typeTab, isActive && s.typeTabActive]}
              activeOpacity={0.8}
              onPress={() => setFilters(prev => ({ 
                ...prev, 
                listingType: isActive ? undefined : type.id 
              }))}
            >
              <Text style={[s.typeTabTxt, isActive && s.typeTabTxtActive]}>{type.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── LISTINGS LIST ── */}
      <Animated.FlatList
        data={listings || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.listContent}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={isLoading && ((listings as any)?.length > 0)} onRefresh={refetch} tintColor={Colors.equipmentPrimary} />
        }
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
            {/* Visual Grid Filters */}
            <EquipmentVisualFilters
              onSelectFilter={handleSelectFilter}
              onViewAll={() => {}} // Could open advanced bottom sheet
              selectedCategoryId={(filters as any).categoryId}
              selectedCity={filters.city}
              selectedPriceId={(filters as any).priceId}
              selectedConditionId={(filters as any).conditionId}
            />
            
            <View style={s.resultsHeader}>
              <Text style={s.resultsCount}>
                {isLoading ? 'جاري البحث...' : `${listings?.length || 0} معدة متوفرة`}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const raw = item.raw || {};
          return (
          <View style={s.cardWrapper}>
            {/* Re-use CarCard with adapted props since it works perfectly for UI */}
            <CarCard 
              item={{
                ...item,
                make: raw.equipmentType || raw.make,
                model: raw.model || '',
                price: item.price || raw.dailyPrice || raw.monthlyPrice || 0,
                images: item.images,
                currency: 'OMR',
                listingType: item.listingType?.includes('RENT') ? 'RENTAL' : 'SALE',
                condition: item.condition,
                year: raw.year,
                mileage: raw.hoursUsed,
                governorate: item.governorate,
                city: raw.city
              } as any} 
              onPress={() => router.push(`/equipment/${item.id}` as any)} 
              fullWidth
              showChips
            />
          </View>
        )}}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Filter Bottom Sheet */}
      <EquipmentFilterBottomSheet
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        initialFilters={filters}
        onApplyFilters={handleApplyFilters}
      />

    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  filterBadgeTxt: {
    fontFamily: 'Almarai_700Bold',  fontSize: 10,
    color: Colors.white,
  },
  listingTypeTabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.space4,
    marginTop: Spacing.space3,
    gap: Spacing.space2,
  },
  typeTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  typeTabActive: {
    backgroundColor: Colors.primary,
  },
  typeTabTxt: {
    fontFamily: 'Almarai_700Bold',  fontSize: 14,
    color: Colors.textMuted,
  },
  typeTabTxtActive: {
    color: Colors.white,
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
    backgroundColor: Colors.equipmentPrimary,
    paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 12,
  },
  clearAllBtnInlineTxt: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 15, color: '#fff',
  },
  retryBtn: {
    backgroundColor: Colors.equipmentPrimary,
    paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 12,
  },
  retryBtnTxt: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 15, color: '#fff',
  },
});
