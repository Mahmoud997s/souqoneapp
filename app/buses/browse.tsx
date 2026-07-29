import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Platform,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated from 'react-native-reanimated';

import { useInfiniteBuses } from '../../src/hooks/useBuses';
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav';
import { AppHeader } from '../../src/components/ui/AppHeader';

import { BusCard } from '../../src/components/buses/BusCard';
import { BusFilterBottomSheet, BusFilters } from '../../src/components/filters/BusFilterBottomSheet';
import { SkeletonCard } from '../../src/components/ui/SkeletonCard';

import { Colors } from '../../src/constants/colors';
import { Spacing } from '../../src/constants/spacing';
import { Radius } from '../../src/constants/radius';

import { BUS_LISTING_TYPES, BUS_TYPES, BUS_MAKES } from '../post/_constants/bus';

const DROPDOWN_FILTERS = [
  { id: 'make', label: 'الماركة', icon: 'bus-outline' },
  { id: 'capacity', label: 'السعة', icon: 'people-outline' },
  { id: 'busType', label: 'الفئة', icon: 'list-outline' },
  { id: 'sort', label: 'الترتيب', icon: 'swap-vertical-outline' },
];

const CAPACITIES = [10, 15, 30, 45, 50];

export default function BusesBrowseScreen() {
  const insets = useSafeAreaInsets();
  const { scrollHandler } = useScrollAwareNav();
  const searchParams = useLocalSearchParams<{ type?: string }>();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  
  const [filters, setFilters] = useState<BusFilters>(() => {
    const initialFilters: BusFilters = {};
    if (searchParams.type) {
      initialFilters.busListingType = searchParams.type.toUpperCase();
    }
    return initialFilters;
  });
  
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'make' | 'capacity' | 'busType' | null>(null);

  // Combine params
  const { 
    data, 
    isLoading, 
    isError, 
    refetch, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useInfiniteBuses(filters as any);

  const listings = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  const activeFiltersCount = Object.entries(filters).filter(([k, v]) => Boolean(v) && k !== 'sort').length;

  const handleClearAll = () => setFilters(prev => ({ sort: prev.sort }));

  const handleSortPress = () => {
    setIsSortModalVisible(true);
  }

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
        <View style={s.center}>
          <Text style={s.errorTxt}>حدث خطأ أثناء تحميل الحافلات</Text>
          <TouchableOpacity onPress={() => refetch()} style={s.retryBtn}>
            <Text style={s.retryTxt}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={s.emptyState}>
        <Ionicons name="bus-outline" size={64} color={Colors.borderStrong || '#E2E8F0'} />
        <Text style={s.emptyTitle}>لا توجد حافلات مطابقة</Text>
        <Text style={s.emptySubtitle}>جرب تغيير الفلاتر أو كلمة البحث للعثور على نتائج أخرى</Text>
        {activeFiltersCount > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={s.clearAllBtn}>
            <Text style={s.clearAllBtnText}>إعادة تعيين الكل</Text>
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
              placeholder="ابحث في الحافلات..."
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
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => setIsFilterVisible(!isFilterVisible)}
          >
            <Ionicons name="options-outline" size={20} color={Colors.white} />
            {activeFiltersCount > 0 && (
              <View style={s.filterBadge}>
                <Text style={s.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        }
      />

      <Animated.FlatList
        key="list-1-column"
        data={listings ?? []}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={[
          s.listContent,
          { paddingTop: Spacing.space2 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={[Colors.primary]}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={s.listingTypeTabs}>
              {BUS_LISTING_TYPES.map((type) => {
                const isActive = filters.busListingType === type.id;
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[s.typeTab, isActive && s.typeTabActive]}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (isActive) {
                        const newFilters = { ...filters };
                        delete newFilters.busListingType;
                        setFilters(newFilters);
                      } else {
                        setFilters({ ...filters, busListingType: type.id });
                      }
                    }}
                  >
                    <Text style={[s.typeTabTxt, isActive && s.typeTabTxtActive]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={s.quickFiltersContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.quickFiltersContent}>
                {DROPDOWN_FILTERS.map((qf) => {
                  let isActive = false;
                  let displayLabel = qf.label;

                  if (qf.id === 'make') {
                    isActive = !!filters.make;
                    if (isActive) displayLabel = BUS_MAKES.find(m => m.id === filters.make)?.label || filters.make as string;
                  } else if (qf.id === 'capacity') {
                    isActive = !!filters.capacityMin;
                    if (isActive) displayLabel = `+ ${filters.capacityMin} مقعد`;
                  } else if (qf.id === 'busType') {
                    isActive = !!filters.busType;
                    if (isActive) displayLabel = BUS_TYPES.find(b => b.id === filters.busType)?.label || filters.busType as string;
                  } else if (qf.id === 'sort') {
                    isActive = !!filters.sort && filters.sort !== 'newest';
                    if (filters.sort === 'price_asc') displayLabel = 'الأقل سعراً';
                    else if (filters.sort === 'price_desc') displayLabel = 'الأعلى سعراً';
                    else if (filters.sort === 'popular') displayLabel = 'الأكثر شيوعاً';
                    else if (filters.sort === 'newest') displayLabel = 'الأحدث';
                  }

                  return (
                    <TouchableOpacity
                      key={qf.id}
                      style={[s.quickFilterCard, isActive && s.quickFilterCardActive]}
                      activeOpacity={0.8}
                      onPress={() => qf.id === 'sort' ? handleSortPress() : setIsFilterVisible(true)}
                    >
                      <View style={[s.iconWrapper, isActive && s.iconWrapperActive]}>
                        <Ionicons name={qf.icon as any} size={18} color={isActive ? Colors.primary : Colors.textMuted} />
                      </View>
                      <Text style={[s.quickFilterCardTxt, isActive && s.quickFilterCardTxtActive]} numberOfLines={1}>
                        {displayLabel}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            </View>

            <View style={s.listHeader}>
              {listings && listings.length > 0 && (
                <View style={s.resultsRow}>
                <Text style={s.resultsCount}>{listings.length} حافلة متاحة</Text>
                {activeFiltersCount > 0 && (
                  <TouchableOpacity onPress={handleClearAll}>
                    <Text style={s.clearAllText}>مسح التصفية</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
          </View>
        }
        ListEmptyComponent={renderEmptyState}
        renderItem={({ item }: any) => (
          <View style={s.cardWrapper}>
            <BusCard item={item} onPress={() => router.push(`/buses/${item.id}` as any)} fullWidth showChips maxChips={4} />
          </View>
        )}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Almarai_700Bold', color: Colors.textMuted }}>جاري تحميل المزيد...</Text>
            </View>
          ) : null
        }
      />

      <BusFilterBottomSheet
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        currentFilters={filters}
        onApply={(appliedFilters) => setFilters(appliedFilters)}
      />

      {/* Custom Sort Modal */}
      <Modal
        visible={isSortModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSortModalVisible(false)}
      >
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setIsSortModalVisible(false)}>
          <View style={s.bottomSheetContent}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>ترتيب حسب</Text>
            
            {[
              { id: 'newest', label: 'الأحدث أولاً' },
              { id: 'popular', label: 'الأكثر شيوعاً' },
              { id: 'price_asc', label: 'السعر: الأقل للأعلى' },
              { id: 'price_desc', label: 'السعر: الأعلى للأقل' }
            ].map((option) => {
              const isSelected = (filters.sort || 'newest') === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={s.sortOptionBtn}
                  onPress={() => {
                    setFilters({ ...filters, sort: option.id });
                    setIsSortModalVisible(false);
                  }}
                >
                  <Text style={[s.sortOptionTxt, isSelected && s.sortOptionTxtActive]}>
                    {option.label}
                  </Text>
                  <Ionicons 
                    name={isSelected ? "radio-button-on" : "radio-button-off"} 
                    size={24} 
                    color={isSelected ? Colors.primary : Colors.textMuted} 
                  />
                </TouchableOpacity>
              )
            })}
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
  filterBadgeText: {
    fontFamily: 'Almarai_700Bold',  fontSize: 10,
    color: Colors.white,
  },
  listingTypeTabs: {
    flexDirection: 'row',
    marginHorizontal: Spacing.space4,
    marginTop: Spacing.space3,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
  },
  typeTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  typeTabActive: {
    backgroundColor: Colors.white,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
      android: { elevation: 3 },
    }),
  },
  typeTabTxt: {
    fontFamily: 'Almarai_700Bold', fontSize: 13,
    color: '#64748B',
  },
  typeTabTxtActive: {
    color: Colors.primary,
  },
  quickFiltersContainer: {
    marginTop: Spacing.space3,
    marginBottom: Spacing.space2,
  },
  quickFiltersContent: {
    paddingHorizontal: Spacing.space4,
    paddingVertical: 4,
    gap: 12,
  },
  quickFilterCard: {
    height: 38,
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  quickFilterCardActive: {
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary + '30',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperActive: {
  },
  quickFilterCardTxt: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 12, 
    color: '#475569'
  },
  quickFilterCardTxtActive: {
    color: Colors.primary
  },
  listContent: {
    paddingBottom: Spacing.space6,
  },
  listHeader: {
    marginBottom: Spacing.space2,
  },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.space4,
    marginTop: Spacing.space1,
    marginBottom: Spacing.space2,
  },
  resultsCount: {
    fontFamily: 'Almarai_700Bold',  fontSize: 15,
    color: Colors.text,
  },
  clearAllText: {
    fontFamily: 'Almarai_700Bold',  fontSize: 13,
    color: Colors.primary,
  },
  cardWrapper: {
    paddingHorizontal: Spacing.space4,
    marginBottom: Spacing.space4,
  },
  skeletonGrid: {
    padding: Spacing.space4,
    gap: Spacing.space4,
  },
  fullCard: {
    marginBottom: Spacing.space2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  errorTxt: {
    fontFamily: 'Almarai_700Bold',  color: Colors.error || '#d9534f',
    marginBottom: Spacing.space3,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.space5,
    paddingVertical: Spacing.space2,
    borderRadius: Radius.lg,
  },
  retryTxt: {
    fontFamily: 'Almarai_700Bold',  color: Colors.white,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: Spacing.space5,
  },
  emptyTitle: {
    fontFamily: 'Almarai_800ExtraBold',  fontSize: 18,
    color: Colors.text,
    marginTop: Spacing.space4,
    marginBottom: Spacing.space2,
  },
  emptySubtitle: {
    fontFamily: 'Almarai_400Regular',  fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.space6,
    lineHeight: 22,
  },
  clearAllBtn: {
    marginTop: Spacing.space4,
    paddingVertical: 10,
    paddingHorizontal: Spacing.space6,
    borderRadius: Radius.pill,
    backgroundColor: '#0B244710',
  },
  clearAllBtnText: {
    fontFamily: 'Almarai_700Bold',  fontSize: 14,
    color: Colors.primary,
  },
  // Custom Sort Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheetContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.space4,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: Spacing.space4,
  },
  sheetTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 18,
    color: Colors.text,
    marginBottom: Spacing.space4,
    textAlign: 'left',
  },
  sortOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  sortOptionTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 15,
    color: Colors.text,
  },
  sortOptionTxtActive: {
    color: Colors.primary,
  },
});
