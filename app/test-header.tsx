import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { BrowseHeader } from '../src/components/ui/BrowseHeader';
import { ListingTabs, TabItem } from '../src/components/ui/ListingTabs';
import { QuickFilters, QuickFilterItem } from '../src/components/ui/QuickFilters';
import { useBrowseSearch } from '../src/hooks/useBrowseSearch';
import { useNavVisibility } from '../src/context/NavVisibilityContext';
import { useScrollAwareNav } from '../src/hooks/useScrollAwareNav';
import { Colors } from '../src/constants/colors';
import { Spacing } from '../src/constants/spacing';

export default function TestHeaderScreen() {
  const insets = useSafeAreaInsets();
  const { searchQuery, setSearchQuery, isFilterVisible, setIsFilterVisible } = useBrowseSearch();
  const { navHidden } = useNavVisibility();
  const { scrollHandler } = useScrollAwareNav();

  const [activeTab, setActiveTab] = useState<string | undefined>('rent');
  const [activeFilter, setActiveFilter] = useState<string | undefined>();

  const TABS: TabItem[] = [
    { id: 'sale', label: 'للبيع' },
    { id: 'rent', label: 'تأجير' },
    { id: 'wanted', label: 'مطلوب' },
    { id: 'transfer', label: 'للتنازل' },
  ];

  const FILTERS: QuickFilterItem[] = [
    { id: 'make', label: 'الماركة', icon: 'car-outline', isActive: activeFilter === 'make' },
    { id: 'city', label: 'المدينة', icon: 'location-outline', isActive: activeFilter === 'city' },
    { id: 'year', label: 'سنة الصنع', icon: 'calendar-outline', isActive: activeFilter === 'year' },
    { id: 'price', label: 'السعر', icon: 'cash-outline', isActive: activeFilter === 'price' },
  ];

  const collapsibleStyle = useAnimatedStyle(() => {
    // 85 is roughly the combined height of the tabs and filters
    const height = interpolate(navHidden.value, [0, 1], [85, 0], Extrapolation.CLAMP);
    const opacity = interpolate(navHidden.value, [0, 0.5, 1], [1, 0, 0], Extrapolation.CLAMP);
    return {
      height,
      opacity,
      overflow: 'hidden'
    };
  });

  const dummyData = Array.from({ length: 20 }).map((_, i) => `عنصر تجريبي رقم ${i + 1}`);

  return (
    <View style={s.root}>
      {/* 1. استخدام الهيدر الموحد الجديد (ثابت) */}
      <BrowseHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="ابحث في شاشة المعاينة..."
        activeFiltersCount={isFilterVisible ? 3 : 0}
        onFilterPress={() => setIsFilterVisible(!isFilterVisible)}
      />

      {/* الجزء الثاني التفاعلي (متحرك يختفي مع النزول) */}
      <Animated.View style={[collapsibleStyle, { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }]}>
        <ListingTabs 
          tabs={TABS}
          activeTabId={activeTab}
          onChangeTab={setActiveTab}
          onClearTab={() => setActiveTab(undefined)}
        />
        <QuickFilters 
          filters={FILTERS}
          onFilterPress={(id) => setActiveFilter(id === activeFilter ? undefined : id)}
          onClearFilter={() => setActiveFilter(undefined)}
        />
      </Animated.View>

      {/* محتوى الشاشة باستخدام قائمة متحركة لتجربة التمرير */}
      <Animated.FlatList
        data={dummyData}
        keyExtractor={(item) => item}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListHeaderComponent={
          <View style={s.dataBox}>
            <Text style={s.title}>اسحب الشاشة للأسفل وللأعلى 👆👇</Text>
            <Text style={s.subtitle}>سترى الجزء الثاني يختفي ويظهر ديناميكياً.</Text>
            <Text style={s.dataText}>نص البحث الحالي: {searchQuery || 'لا يوجد'}</Text>
            <Text style={s.dataText}>التاب النشط: {activeTab || 'لا يوجد'}</Text>
            <Text style={s.dataText}>الفلتر المفتوح: {activeFilter || 'لا يوجد'}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.dummyCard}>
            <Text style={s.dummyText}>{item}</Text>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  title: { fontFamily: 'Almarai_700Bold', fontSize: 18, color: Colors.primary, marginBottom: 8, textAlign: 'right' },
  subtitle: { fontFamily: 'Almarai_400Regular', fontSize: 13, color: Colors.textMuted, marginBottom: 16, textAlign: 'right' },
  dataBox: { backgroundColor: Colors.white, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  dataText: { fontFamily: 'Almarai_700Bold', fontSize: 14, color: Colors.text, marginBottom: 8, textAlign: 'right' },
  dummyCard: { backgroundColor: '#fff', padding: 24, marginBottom: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  dummyText: { fontFamily: 'Almarai_700Bold', fontSize: 16, color: '#333', textAlign: 'right' }
});
