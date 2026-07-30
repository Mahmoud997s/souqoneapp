import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBrands, useCarModels } from '../../hooks/useCars';
import { getBrandLogo } from '../../constants/brandLogos';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Radius } from '../../constants/radius';
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── STATIC DATA ───
const TABS = [
  { id: 'brands', label: 'أفضل الماركات' },
  { id: 'models', label: 'أفضل الموديلات' },
  { id: 'cities', label: 'أهم المدن' },
  { id: 'prices', label: 'نطاقات الأسعار' },
  { id: 'types', label: 'الهيكل' },
];

// Static models removed since we fetch dynamically by brand

const TOP_CITIES = [
  { id: 'OM_MUS', name: 'مسقط' },
  { id: 'OM_BAN', name: 'صحار' },
  { id: 'OM_SHS', name: 'صور' },
  { id: 'OM_DAK', name: 'نزوى' },
  { id: 'OM_DHO', name: 'صلالة' },
  { id: 'OM_DHA', name: 'عبري' },
  { id: 'OM_BUR', name: 'البريمي' },
  { id: 'OM_BAT', name: 'الرستاق' },
];

const CAR_TYPES = [
  { id: 'sedan', name: 'سيدان' },
  { id: 'suv', name: 'دفع رباعي' },
  { id: 'hatchback', name: 'هاتشباك' },
  { id: 'pickup', name: 'بيك أب' },
  { id: 'coupe', name: 'كوبيه' },
  { id: 'minivan', name: 'عائلية' },
  { id: 'convertible', name: 'كشف' },
  { id: 'wagon', name: 'واجون' },
];

const PRICE_RANGES = [
  { id: 'p1', label: 'أقل من 1,000 ر.ع', min: 0, max: 1000 },
  { id: 'p2', label: '1,000 - 2,000 ر.ع', min: 1000, max: 2000 },
  { id: 'p3', label: '2,000 - 4,000 ر.ع', min: 2000, max: 4000 },
  { id: 'p4', label: '4,000 - 6,000 ر.ع', min: 4000, max: 6000 },
  { id: 'p5', label: '6,000 - 8,000 ر.ع', min: 6000, max: 8000 },
  { id: 'p6', label: '8,000 - 10,000 ر.ع', min: 8000, max: 10000 },
  { id: 'p7', label: '10,000 - 15,000 ر.ع', min: 10000, max: 15000 },
  { id: 'p8', label: 'أكثر من 15,000 ر.ع', min: 15000, max: null },
];

interface CarsVisualFiltersProps {
  onSelectFilter: (type: 'make' | 'model' | 'city' | 'price' | 'type', valueId: string, valueName?: string, min?: number, max?: number) => void;
  onViewAll: (tabId: string) => void;
  selectedBrandId?: string;
  selectedCity?: string;
  selectedModelId?: string;
  selectedPriceId?: string;
  selectedTypeId?: string;
}

export function CarsVisualFilters({
  onSelectFilter,
  onViewAll,
  selectedBrandId,
  selectedCity,
  selectedModelId,
  selectedPriceId,
  selectedTypeId,
}: CarsVisualFiltersProps) {
  const [activeTab, setActiveTab] = useState<string>('brands');
  const { data: brands, isLoading: loadingBrands } = useBrands();
  const { data: models, isLoading: loadingModels } = useCarModels(selectedBrandId || '');

  const renderHorizontalGrid = (items: any[], type: 'brands' | 'models' | 'cities' | 'prices' | 'types') => {
    if (!items || items.length === 0) return null;

    const isPrice = type === 'prices';
    const isCity = type === 'cities';
    const isBrand = type === 'brands';
    const isType = type === 'types';
    
    // 1 row for prices and cities to look cleaner and give text more space
    const useSingleRow = isPrice || isCity;

    let columns = [];
    if (useSingleRow) {
      columns = items.map(item => [item]); // Each column has 1 item
    } else {
      for (let i = 0; i < items.length; i += 2) {
        columns.push(items.slice(i, i + 2));
      }
    }

    return (
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.horizontalGridContent}
        style={s.horizontalScroll}
      >
        {columns.map((col, index) => (
          <View 
            key={index} 
            style={[
              s.gridColumn, 
              isPrice && { width: 140 },
              isCity && { width: 110 },
              (!useSingleRow) && { width: (SCREEN_WIDTH - 48) / 4.2 }
            ]}
          >
            {col.map((item: any) => {
              let isSelected = false;
              let icon = null;
              let text = '';
              let onPress = () => {};

              if (type === 'brands') {
                isSelected = selectedBrandId === item.id;
                const logo = getBrandLogo(item.slug);
                icon = logo ? (
                  <Image 
                    source={logo} 
                    style={[s.brandLogo, isSelected && s.brandLogoActive]} 
                    resizeMode="contain" 
                  />
                ) : (
                  <Ionicons name="car-sport" size={24} color={isSelected ? Colors.white : Colors.primary} />
                );
                text = item.nameAr || item.name;
                onPress = () => onSelectFilter('make', item.id, item.name);
              } else if (type === 'models') {
                isSelected = selectedModelId === item.id;
                icon = <Ionicons name="car-outline" size={24} color={isSelected ? Colors.white : Colors.primary} />;
                text = item.nameAr || item.name;
                onPress = () => onSelectFilter('model', item.id, item.name);
              } else if (type === 'cities') {
                isSelected = selectedCity === item.name;
                icon = <Ionicons name="location-outline" size={20} color={isSelected ? Colors.white : Colors.primary} />;
                text = item.name;
                onPress = () => onSelectFilter('city', item.name, item.name);
              } else if (type === 'prices') {
                isSelected = selectedPriceId === item.id;
                icon = <Ionicons name="wallet-outline" size={20} color={isSelected ? Colors.white : Colors.primary} />;
                text = item.label;
                onPress = () => onSelectFilter('price', item.id, item.label, item.min, item.max || undefined);
              } else if (type === 'types') {
                isSelected = selectedTypeId === item.id;
                icon = <Ionicons name="car-sport-outline" size={24} color={isSelected ? Colors.white : Colors.primary} />;
                text = item.name;
                onPress = () => onSelectFilter('type', item.id, item.name);
              }

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    s.gridItemPremium, 
                    useSingleRow && s.gridItemSingleRow,
                    isSelected && s.gridItemPremiumActive
                  ]}
                  onPress={onPress}
                >
                  <View style={[s.iconWrapper, useSingleRow && { marginBottom: 0, marginLeft: 8, height: 'auto' }]}>
                    {icon}
                  </View>
                  <Text 
                    style={[s.itemTextPremium, isSelected && s.itemTextPremiumActive, useSingleRow && { textAlign: 'left', flex: 1, fontSize: 12 }]} 
                    numberOfLines={useSingleRow ? 1 : 2}
                  >
                    {text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderBrandsGrid = () => {
    if (loadingBrands) {
      return (
        <View style={s.loader}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      );
    }
    return renderHorizontalGrid(brands || [], 'brands');
  };

  const renderModelsGrid = () => {
    if (!selectedBrandId) {
      return (
        <View style={s.placeholderContainer}>
          <Ionicons name="information-circle-outline" size={32} color={Colors.textMuted} style={{ marginBottom: 10 }} />
          <Text style={s.placeholderText}>الرجاء اختيار الماركة أولاً لعرض الموديلات</Text>
          <TouchableOpacity style={s.switchTabBtn} onPress={() => setActiveTab('brands')}>
            <Text style={s.switchTabTxt}>العودة للماركات</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (loadingModels) {
      return (
        <View style={s.loader}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      );
    }
    if (!models || models.length === 0) {
      return (
        <View style={s.placeholderContainer}>
          <Text style={s.placeholderText}>لا توجد موديلات لهذه الماركة</Text>
        </View>
      );
    }
    return renderHorizontalGrid(models || [], 'models');
  };

  const renderCitiesGrid = () => renderHorizontalGrid(TOP_CITIES, 'cities');
  const renderPricesGrid = () => renderHorizontalGrid(PRICE_RANGES, 'prices');
  const renderTypesGrid = () => renderHorizontalGrid(CAR_TYPES, 'types');

  const renderPlaceholder = (title: string) => (
    <View style={s.placeholderContainer}>
      <Text style={s.placeholderText}>قريباً: عرض {title}</Text>
    </View>
  );

  const renderActiveGrid = () => {
    switch (activeTab) {
      case 'brands': return renderBrandsGrid();
      case 'models': return renderModelsGrid();
      case 'cities': return renderCitiesGrid();
      case 'prices': return renderPricesGrid();
      case 'types': return renderTypesGrid();
      default: return null;
    }
  };

  const getActiveTabLabel = () => TABS.find(t => t.id === activeTab)?.label || 'العناصر';
  const getActiveTabViewAllText = () => {
    if (activeTab === 'brands') return 'عرض جميع العلامات التجارية';
    if (activeTab === 'models') return 'عرض جميع الموديلات';
    if (activeTab === 'cities') return 'عرض جميع المدن';
    return `عرض جميع ${getActiveTabLabel()}`;
  };

  return (
    <View style={s.container}>
      {/* ── TABS ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.tabsContent}
        style={s.tabsScroll}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[s.tabButton, isActive && s.tabButtonActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[s.tabText, isActive && s.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── GRID AREA ── */}
      <View style={s.contentArea}>
        {renderActiveGrid()}

        {/* View All Button */}
        <TouchableOpacity
          style={s.viewAllBtn}
          onPress={() => onViewAll(activeTab)}
        >
          <Text style={s.viewAllBtnText}>{getActiveTabViewAllText()}</Text>
          <Ionicons name="chevron-down" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.space2,
  },
  tabsScroll: {
    paddingVertical: Spacing.space2,
  },
  tabsContent: {
    paddingHorizontal: Spacing.space3,
    flexDirection: 'row', 
    gap: Spacing.space2,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
    backgroundColor: '#F8F9FA',
  },
  tabButtonActive: {
    backgroundColor: Colors.primary + '15', // light primary tint
  },
  tabText: {
    fontFamily: 'Almarai_700Bold',  fontSize: 13,
    color: Colors.textMuted,
  },
  tabTextActive: {
    fontFamily: 'Almarai_800ExtraBold',  color: Colors.primary,
  },
  contentArea: {
    paddingTop: Spacing.space3,
  },
  horizontalScroll: {
    // No margin offset needed since contentArea has no horizontal padding
  },
  horizontalGridContent: {
    paddingHorizontal: Spacing.space4,
    paddingTop: 8,
    paddingBottom: Spacing.space3,
    flexGrow: 1,
    justifyContent: 'center', // Centers items when there are fewer than 4 columns
  },
  gridColumn: {
    width: (SCREEN_WIDTH - (Spacing.space4 * 2)) / 4.5,
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  gridItemPremium: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 4,
    minHeight: 82,
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: Spacing.space2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16 },
      android: { elevation: 4 },
    }),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  gridItemSingleRow: {
    minHeight: 50,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  gridItemPremiumActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  iconWrapper: {
    marginBottom: 2,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandLogo: {
    width: 34,
    height: 34,
  },
  brandLogoActive: {
    tintColor: Colors.white, // assuming brand logos are somewhat transparent or we can just apply a brightness filter (tint might ruin some colorful logos, but for premium a unified color is good)
  },
  itemTextPremium: {
    fontFamily: 'Almarai_700Bold',  fontSize: 11,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 16,
  },
  itemTextPremiumActive: {
    color: Colors.white,
  },

  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 8,
    borderRadius: 100,
    marginHorizontal: Spacing.space4,
    marginTop: Spacing.space1,
  },
  viewAllBtnText: {
    fontFamily: 'Almarai_700Bold',  fontSize: 14,
    color: Colors.primary,
    marginStart: Spacing.space1,
  },
  loader: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontFamily: 'Almarai_400Regular',  color: Colors.textMuted,
  },
  switchTabBtn: {
    marginTop: Spacing.space3,
    paddingVertical: Spacing.space2,
    paddingHorizontal: Spacing.space4,
    backgroundColor: '#F0F5FF',
    borderRadius: Radius.md,
  },
  switchTabTxt: {
    fontFamily: 'Almarai_700Bold',  fontSize: 14,
    color: Colors.primary,
  }
});
