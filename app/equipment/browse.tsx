import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Platform,
  ActivityIndicator,
  FlatList,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

import { useEquipment } from '../../src/hooks/useEquipment';
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav';
import { OMAN_LOCATIONS } from '../../src/constants/locations';
import { locationsApi } from '../../src/api/locations';
import { GovernorateRef } from '../../src/types/location.types';
import { EQUIPMENT_TYPES } from '../../src/utils/equipment-mappers';

// Components
import { BrowseHeader } from '../../src/components/ui/BrowseHeader';
import { ListingTabs } from '../../src/components/ui/ListingTabs';
import { CollapsibleSubHeader } from '../../src/components/ui/CollapsibleSubHeader';
import { QuickFilters } from '../../src/components/ui/QuickFilters';
import { CarCard } from '../../src/components/cars/CarCard';
import { EquipmentFilterBottomSheet } from '../../src/components/filters/EquipmentFilterBottomSheet';
import { SkeletonCard } from '../../src/components/ui/SkeletonCard';
import { SupportHelpButton } from '../../src/components/ui/SupportHelpButton';

// Constants
import { Colors } from '../../src/constants/colors';
import { Spacing } from '../../src/constants/spacing';
import { Radius } from '../../src/constants/radius';

interface FilterState {
  listingType?: string;
  governorateId?: number;
  city?: string;
  priceMin?: string;
  priceMax?: string;
  priceId?: string;
  condition?: string;
  conditionId?: string;
  equipmentType?: string;
  categoryId?: string;
  sortBy?: string;
  sortOrder?: string;
}

const LISTING_TYPES = [
  { id: 'EQUIPMENT_SALE', label: 'للبيع' },
  { id: 'EQUIPMENT_RENT', label: 'للإيجار' },
  { id: 'EQUIPMENT_WANTED', label: 'مطلوب' },
];

const DROPDOWN_FILTERS = [
  { id: 'governorate', label: 'المدينة', icon: 'location-outline' },
  { id: 'category', label: 'نوع المعدة', icon: 'hardware-chip-outline' },
  { id: 'condition', label: 'الحالة', icon: 'construct-outline' },
  { id: 'price', label: 'السعر', icon: 'wallet-outline' },
  { id: 'year', label: 'سنة الصنع', icon: 'calendar-outline' },
  { id: 'hours', label: 'ساعات العمل', icon: 'time-outline' },
];



const CATEGORIES_ARRAY = Object.entries(EQUIPMENT_TYPES).map(([key, value]) => ({
  id: key,
  name: value.label,
}));

const CONDITIONS = [
  { id: 'NEW', name: 'جديدة' },
  { id: 'USED', name: 'مستعملة' },
  { id: 'LIKE_NEW', name: 'شبه جديدة' },
  { id: 'REFURBISHED', name: 'مجددة' },
];

const PRICE_RANGES = [
  { id: 'all', label: 'الكل', min: '', max: '' },
  { id: 'p1', label: 'أقل من 50 ر.ع', min: '0', max: '50' },
  { id: 'p2', label: '50 - 100 ر.ع', min: '50', max: '100' },
  { id: 'p3', label: '100 - 500 ر.ع', min: '100', max: '500' },
  { id: 'p4', label: '500 - 1,000 ر.ع', min: '500', max: '1000' },
  { id: 'p5', label: '1,000 - 5,000 ر.ع', min: '1000', max: '5000' },
  { id: 'p6', label: '5,000 - 10,000 ر.ع', min: '5000', max: '10000' },
  { id: 'p7', label: 'أكثر من 10,000 ر.ع', min: '10000', max: '9999999' },
];

const YEAR_RANGES = [
  { id: 'all', label: 'الكل', min: '', max: '' },
  { id: 'y1', label: '2022 - 2024', min: '2022', max: '2024' },
  { id: 'y2', label: '2019 - 2021', min: '2019', max: '2021' },
  { id: 'y3', label: '2015 - 2018', min: '2015', max: '2018' },
  { id: 'y4', label: 'أقدم من 2015', min: '1900', max: '2014' },
];

const HOURS_RANGES = [
  { id: 'all', label: 'الكل', min: '', max: '' },
  { id: 'h1', label: 'أقل من 1,000 ساعة', min: '0', max: '1000' },
  { id: 'h2', label: '1,000 - 3,000 ساعة', min: '1000', max: '3000' },
  { id: 'h3', label: '3,000 - 5,000 ساعة', min: '3000', max: '5000' },
  { id: 'h4', label: 'أكثر من 5,000 ساعة', min: '5000', max: '999999' },
];

export default function EquipmentBrowseScreen() {
  const [governorates, setGovernorates] = useState<GovernorateRef[]>([]);
  useEffect(() => {
    locationsApi.getGovernorates().then(setGovernorates).catch(console.warn);
  }, []);
  
  const governorateOptions = governorates.map(g => ({
    id: g.id,
    labelAr: g.nameAr,
    value: g.nameAr
  }));
  const insets = useSafeAreaInsets();
  const { scrollHandler } = useScrollAwareNav();
  const searchParams = useLocalSearchParams<{ type?: string }>();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [filters, setFilters] = useState<FilterState>(() => {
    const initialFilters: FilterState = {};
    const t = searchParams.type?.toLowerCase();
    
    if (t === 'used') {
      initialFilters.condition = 'USED';
      initialFilters.conditionId = 'USED';
      initialFilters.listingType = 'EQUIPMENT_SALE';
    } else if (t === 'new') {
      initialFilters.condition = 'NEW';
      initialFilters.conditionId = 'NEW';
      initialFilters.listingType = 'EQUIPMENT_SALE';
    } else if (t === 'rental' || t === 'rent') {
      initialFilters.listingType = 'EQUIPMENT_RENT';
    } else if (t === 'sale') {
      initialFilters.listingType = 'EQUIPMENT_SALE';
    }
    
    return initialFilters;
  });
  
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Combine query parameters
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      limit: 30,
    };

    if (debouncedSearch.trim()) {
      params.search = debouncedSearch;
    }

    const skipKeys = new Set(['priceId', 'categoryId', 'conditionId', 'yearId', 'hoursId']);

    // Apply all custom filters
    Object.entries(filters).forEach(([key, val]) => {
      if (skipKeys.has(key)) return;
      if (val !== undefined && val !== '') {
        if (key === 'priceMin' || key === 'priceMax' || key === 'yearMin' || key === 'yearMax' || key === 'hoursMin' || key === 'hoursMax') {
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
  }, [debouncedSearch, filters]);

  // Fetch Listings
  const { data: listings, isLoading, isError, refetch } = useEquipment(queryParams);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    const skipKeys = new Set(['priceId', 'categoryId', 'conditionId', 'yearId', 'hoursId']);
    Object.entries(filters).forEach(([key, val]) => {
      if (skipKeys.has(key)) return;
      if (val !== undefined && val !== '') count++;
    });
    return count;
  }, [filters]);

  const handleApplyFilters = (appliedFilters: FilterState) => {
    setFilters(appliedFilters);
  };

  const handleClearAll = () => {
    setFilters({});
    setSearchQuery('');
  };

  const quickFilterItems = DROPDOWN_FILTERS.map(qf => {
    let isActive = false;
    let displayLabel = qf.label;

    if (qf.id === 'governorate') {
      isActive = !!filters.governorateId;
      if (isActive) displayLabel = governorates.find(g => g.id === filters.governorateId)?.nameAr || 'المدينة';
    } else if (qf.id === 'category') {
      isActive = !!filters.equipmentType;
      if (isActive) displayLabel = CATEGORIES_ARRAY.find(t => t.id === filters.equipmentType)?.name || qf.label;
    } else if (qf.id === 'condition') {
      isActive = !!filters.condition;
      if (isActive) displayLabel = CONDITIONS.find(t => t.id === filters.condition)?.name || qf.label;
    } else if (qf.id === 'price') {
      isActive = !!filters.priceMax || !!filters.priceMin;
      if (isActive) {
         const found = PRICE_RANGES.find(b => b.max === (filters.priceMax)?.toString() || b.id === (filters as any).priceId);
         if (found) displayLabel = found.label;
         else displayLabel = filters.priceMax ? `أقل من ${filters.priceMax}` : qf.label;
      }
    } else if (qf.id === 'year') {
      isActive = !!(filters as any).yearMax || !!(filters as any).yearMin;
      if (isActive) {
         const found = YEAR_RANGES.find(b => b.max === (filters as any).yearMax?.toString() || b.id === (filters as any).yearId);
         if (found) displayLabel = found.label;
      }
    } else if (qf.id === 'hours') {
      isActive = !!(filters as any).hoursMax || !!(filters as any).hoursMin;
      if (isActive) {
         const found = HOURS_RANGES.find(b => b.max === (filters as any).hoursMax?.toString() || b.id === (filters as any).hoursId);
         if (found) displayLabel = found.label;
      }
    }

    return {
      id: qf.id,
      label: displayLabel,
      icon: qf.icon as any,
      isActive
    };
  });

  const handleClearQuickFilter = (id: string) => {
    const newFilters = { ...filters };
    if (id === 'governorate') delete newFilters.governorateId;
    if (id === 'category') { delete newFilters.equipmentType; delete newFilters.categoryId; }
    if (id === 'condition') { delete newFilters.condition; delete newFilters.conditionId; }
    if (id === 'price') { delete newFilters.priceMin; delete newFilters.priceMax; delete newFilters.priceId; }
    if (id === 'year') { delete (newFilters as any).yearMin; delete (newFilters as any).yearMax; delete (newFilters as any).yearId; }
    if (id === 'hours') { delete (newFilters as any).hoursMin; delete (newFilters as any).hoursMax; delete (newFilters as any).hoursId; }
    setFilters(newFilters);
  };

  return (
    <View style={s.root}>
      {/* ── HEADER ── */}
      <BrowseHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="ابحث عن معدات..."
        activeFiltersCount={activeFiltersCount}
        onFilterPress={() => setIsFilterVisible(true)}
      />

      <CollapsibleSubHeader>
        <ListingTabs
          tabs={LISTING_TYPES}
          activeTabId={filters.listingType || ''}
          onChangeTab={(id) => {
            if (id === filters.listingType) {
               const newFilters = { ...filters };
               delete newFilters.listingType;
               setFilters(newFilters);
            } else {
               setFilters({ ...filters, listingType: id as string });
            }
          }}
        />
        <QuickFilters
          filters={quickFilterItems}
          onFilterPress={(id) => setActiveDropdown(id as string)}
          onClearFilter={handleClearQuickFilter}
        />
      </CollapsibleSubHeader>

      {/* ── LISTINGS LIST ── */}
      {isLoading ? (
        <View style={s.skeletonGrid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={s.fullCard}>
              <SkeletonCard />
            </View>
          ))}
        </View>
      ) : isError ? (
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
      ) : (
        <Animated.FlatList
          data={listings || []}
          keyExtractor={(item) => (item as any).id}
          contentContainerStyle={[s.listContent, { paddingTop: Spacing.space2 }]}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading && ((listings as any)?.length > 0)} onRefresh={refetch} tintColor={Colors.equipmentPrimary} />
          }
          ListHeaderComponent={
            <View style={{ paddingBottom: Spacing.space3, paddingHorizontal: Spacing.space4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              {activeFiltersCount > 0 ? (
                <TouchableOpacity onPress={handleClearAll}>
                  <Text style={{ fontFamily: 'Almarai_700Bold', fontSize: 13, color: Colors.error }}>
                    مسح الفلاتر
                  </Text>
                </TouchableOpacity>
              ) : <View />}

              <View style={{ backgroundColor: '#f8fafc', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#f1f5f9' }}>
                <Ionicons name="hardware-chip-outline" size={14} color="#64748b" />
                <Text style={{ fontFamily: 'Almarai_700Bold', fontSize: 12, color: '#64748b' }}>
                  {listings?.length || 0} معدة متوفرة
                </Text>
              </View>
            </View>
          }
          ListFooterComponent={() => (!isLoading && listings && listings.length > 0 ? <SupportHelpButton /> : null)}
          ListEmptyComponent={
            <View style={s.emptyContainer}>
              <View style={s.emptyIconWrap}>
                <Ionicons name="search-outline" size={48} color={Colors.equipmentPrimary} />
              </View>
              <Text style={s.emptyTitle}>لا توجد معدات مطابقة</Text>
              <Text style={s.emptySub}>لم نعثر على أي معدات تتطابق مع معايير البحث الخاصة بك.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const raw = (item as any).raw || {};
            return (
            <View style={s.cardWrapper}>
              <CarCard 
                item={{
                  ...(item as any),
                  make: raw.equipmentType || raw.make,
                  model: raw.model || '',
                  price: (item as any).price || raw.dailyPrice || raw.monthlyPrice || 0,
                  images: (item as any).images,
                  currency: 'OMR',
                  listingType: (item as any).listingType?.includes('RENT') ? 'RENTAL' : 'SALE',
                  condition: (item as any).condition,
                  year: raw.year,
                  mileage: raw.hoursUsed,
                  governorate: (item as any).governorate,
                  city: raw.city
                } as any} 
                onPress={() => router.push(`/equipment/${(item as any).id}` as any)} 
                fullWidth
                showChips
              />
            </View>
          )}}
        />
      )}

      {/* DROPDOWNS */}
      <Modal
        visible={!!activeDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveDropdown(null)}
      >
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setActiveDropdown(null)}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                {activeDropdown === 'governorate' ? 'المدينة' :
                 activeDropdown === 'category' ? 'نوع المعدة' :
                 activeDropdown === 'condition' ? 'حالة المعدة' : 
                 activeDropdown === 'price' ? 'السعر' : 
                 activeDropdown === 'year' ? 'سنة الصنع' : 
                 activeDropdown === 'hours' ? 'ساعات العمل' : ''}
              </Text>
              <TouchableOpacity onPress={() => setActiveDropdown(null)}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {activeDropdown === 'governorate' && (
              <FlatList
                data={governorateOptions}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalOptionRow}
                    onPress={() => {
                      setFilters({ ...filters, governorateId: item.id });
                      setActiveDropdown(null);
                    }}
                  >
                    <Text style={[s.modalOptionTxt, filters.governorateId === item.id && s.modalOptionTxtActive]}>
                      {item.labelAr}
                    </Text>
                    {filters.governorateId === item.id && <Ionicons name="checkmark" size={20} color={Colors.equipmentPrimary} />}
                  </TouchableOpacity>
                )}
              />
            )}

            {activeDropdown === 'category' && (
              <FlatList
                data={CATEGORIES_ARRAY}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalOptionRow}
                    onPress={() => {
                      setFilters({ ...filters, equipmentType: item.id, categoryId: item.id });
                      setActiveDropdown(null);
                    }}
                  >
                    <Text style={[s.modalOptionTxt, filters.equipmentType === item.id && s.modalOptionTxtActive]}>
                      {item.name}
                    </Text>
                    {filters.equipmentType === item.id && <Ionicons name="checkmark" size={20} color={Colors.equipmentPrimary} />}
                  </TouchableOpacity>
                )}
              />
            )}

            {activeDropdown === 'condition' && (
              <FlatList
                data={CONDITIONS}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalOptionRow}
                    onPress={() => {
                      setFilters({ ...filters, condition: item.id, conditionId: item.id });
                      setActiveDropdown(null);
                    }}
                  >
                    <Text style={[s.modalOptionTxt, filters.condition === item.id && s.modalOptionTxtActive]}>
                      {item.name}
                    </Text>
                    {filters.condition === item.id && <Ionicons name="checkmark" size={20} color={Colors.equipmentPrimary} />}
                  </TouchableOpacity>
                )}
              />
            )}

            {activeDropdown === 'price' && (
              <FlatList
                data={PRICE_RANGES}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalOptionRow}
                    onPress={() => {
                      if (item.id === 'all') {
                        const newFilters = { ...filters };
                        delete newFilters.priceMin;
                        delete newFilters.priceMax;
                        delete newFilters.priceId;
                        setFilters(newFilters);
                      } else {
                        setFilters({ ...filters, priceMin: item.min, priceMax: item.max, priceId: item.id });
                      }
                      setActiveDropdown(null);
                    }}
                  >
                    <Text style={[s.modalOptionTxt, (filters.priceMax === item.max || (!filters.priceMax && item.id === 'all')) && s.modalOptionTxtActive]}>
                      {item.label}
                    </Text>
                    {(filters.priceMax === item.max || (!filters.priceMax && item.id === 'all')) && <Ionicons name="checkmark" size={20} color={Colors.equipmentPrimary} />}
                  </TouchableOpacity>
                )}
              />
            )}

            {activeDropdown === 'year' && (
              <FlatList
                data={YEAR_RANGES}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalOptionRow}
                    onPress={() => {
                      if (item.id === 'all') {
                        const newFilters = { ...filters };
                        delete (newFilters as any).yearMin;
                        delete (newFilters as any).yearMax;
                        delete (newFilters as any).yearId;
                        setFilters(newFilters);
                      } else {
                        setFilters({ ...filters, yearMin: item.min, yearMax: item.max, yearId: item.id } as any);
                      }
                      setActiveDropdown(null);
                    }}
                  >
                    <Text style={[s.modalOptionTxt, ((filters as any).yearMax === item.max || (!(filters as any).yearMax && item.id === 'all')) && s.modalOptionTxtActive]}>
                      {item.label}
                    </Text>
                    {((filters as any).yearMax === item.max || (!(filters as any).yearMax && item.id === 'all')) && <Ionicons name="checkmark" size={20} color={Colors.equipmentPrimary} />}
                  </TouchableOpacity>
                )}
              />
            )}

            {activeDropdown === 'hours' && (
              <FlatList
                data={HOURS_RANGES}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.modalOptionRow}
                    onPress={() => {
                      if (item.id === 'all') {
                        const newFilters = { ...filters };
                        delete (newFilters as any).hoursMin;
                        delete (newFilters as any).hoursMax;
                        delete (newFilters as any).hoursId;
                        setFilters(newFilters);
                      } else {
                        setFilters({ ...filters, hoursMin: item.min, hoursMax: item.max, hoursId: item.id } as any);
                      }
                      setActiveDropdown(null);
                    }}
                  >
                    <Text style={[s.modalOptionTxt, ((filters as any).hoursMax === item.max || (!(filters as any).hoursMax && item.id === 'all')) && s.modalOptionTxtActive]}>
                      {item.label}
                    </Text>
                    {((filters as any).hoursMax === item.max || (!(filters as any).hoursMax && item.id === 'all')) && <Ionicons name="checkmark" size={20} color={Colors.equipmentPrimary} />}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>

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
  listContent: {
    paddingBottom: 100,
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
  retryBtn: {
    backgroundColor: Colors.equipmentPrimary,
    paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 12,
  },
  retryBtnTxt: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 15, color: '#fff',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxHeight: '65%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.space4,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
      android: { elevation: 10 },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.space3,
    paddingBottom: Spacing.space3,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontFamily: 'Almarai_800ExtraBold', 
    fontSize: 16, color: Colors.text,
  },
  modalOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  modalOptionTxt: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 15, color: Colors.text2,
  },
  modalOptionTxtActive: {
    color: Colors.equipmentPrimary,
  },
});
