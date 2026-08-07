import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBrands, useCarModels } from '../../hooks/useCars';
import { getBrandLogo } from '../../constants/brandLogos';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Radius } from '../../constants/radius';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── STATIC DATA ───
const TABS = [
  { id: 'brands', label: 'أفضل الماركات', icon: 'ribbon-outline' },
  { id: 'models', label: 'أفضل الموديلات', icon: 'car-sport-outline' },
  { id: 'cities', label: 'أهم المدن', icon: 'location-outline' },
  { id: 'prices', label: 'نطاقات الأسعار', icon: 'wallet-outline' },
  { id: 'types', label: 'الهيكل', icon: 'options-outline' },
];

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
  { id: 'sedan', name: 'سيدان', icon: 'car-outline' },
  { id: 'suv', name: 'دفع رباعي', icon: 'car-sport-outline' },
  { id: 'hatchback', name: 'هاتشباك', icon: 'car-outline' },
  { id: 'pickup', name: 'بيك أب', icon: 'bus-outline' },
  { id: 'coupe', name: 'كوبيه', icon: 'speedometer-outline' },
  { id: 'minivan', name: 'عائلية', icon: 'people-outline' },
  { id: 'convertible', name: 'كشف', icon: 'sunny-outline' },
  { id: 'wagon', name: 'واجون', icon: 'car-sport-outline' },
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

export interface CarsVisualFiltersProps {
  onSelectFilter: (
    type: 'make' | 'model' | 'city' | 'price' | 'type',
    valueId: string,
    valueName?: string,
    min?: number,
    max?: number
  ) => void;
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

  const renderHorizontalGrid = (
    items: any[],
    type: 'brands' | 'models' | 'cities' | 'prices' | 'types'
  ) => {
    if (!items || items.length === 0) return null;

    const isPrice = type === 'prices';
    const isCity = type === 'cities';
    const useSingleRow = isPrice || isCity;

    let columns = [];
    if (useSingleRow) {
      columns = items.map((item) => [item]);
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
        {columns.map((col, colIdx) => (
          <View
            key={colIdx}
            style={[
              s.gridColumn,
              isPrice && { width: 160 },
              isCity && { width: 120 },
              !useSingleRow && { width: (SCREEN_WIDTH - (Spacing.space4 * 2)) / 4.2 },
            ]}
          >
            {col.map((item: any) => {
              let isSelected = false;
              let icon: React.ReactNode = null;
              let text = '';
              let onPress = () => {};

              if (type === 'brands') {
                isSelected = selectedBrandId === item.id;
                const logo = getBrandLogo(item.slug || item.id);
                icon = logo ? (
                  <Image
                    source={logo}
                    style={[s.brandLogo, isSelected && s.brandLogoActive]}
                    resizeMode="contain"
                  />
                ) : (
                  <Ionicons
                    name="car-sport"
                    size={22}
                    color={isSelected ? Colors.white : Colors.primary}
                  />
                );
                text = item.nameAr || item.name;
                onPress = () => {
                  if (isSelected) {
                    onSelectFilter('make', '', undefined);
                  } else {
                    onSelectFilter('make', item.id, item.name);
                  }
                };
              } else if (type === 'models') {
                isSelected = selectedModelId === item.id;
                icon = (
                  <Ionicons
                    name="car-outline"
                    size={22}
                    color={isSelected ? Colors.white : Colors.primary}
                  />
                );
                text = item.nameAr || item.name;
                onPress = () => {
                  if (isSelected) {
                    onSelectFilter('model', '', undefined);
                  } else {
                    onSelectFilter('model', item.id, item.name);
                  }
                };
              } else if (type === 'cities') {
                isSelected = selectedCity === item.name;
                icon = (
                  <Ionicons
                    name={isSelected ? 'location' : 'location-outline'}
                    size={18}
                    color={isSelected ? Colors.white : Colors.primary}
                  />
                );
                text = item.name;
                onPress = () => {
                  if (isSelected) {
                    onSelectFilter('city', '', undefined);
                  } else {
                    onSelectFilter('city', item.name, item.name);
                  }
                };
              } else if (type === 'prices') {
                isSelected = selectedPriceId === item.id;
                icon = (
                  <Ionicons
                    name={isSelected ? 'wallet' : 'wallet-outline'}
                    size={18}
                    color={isSelected ? Colors.white : Colors.primary}
                  />
                );
                text = item.label;
                onPress = () => {
                  if (isSelected) {
                    onSelectFilter('price', '', undefined);
                  } else {
                    onSelectFilter(
                      'price',
                      item.id,
                      item.label,
                      item.min,
                      item.max || undefined
                    );
                  }
                };
              } else if (type === 'types') {
                isSelected = selectedTypeId?.toUpperCase() === item.id?.toUpperCase();
                icon = (
                  <Ionicons
                    name={item.icon || 'car-sport-outline'}
                    size={22}
                    color={isSelected ? Colors.white : Colors.primary}
                  />
                );
                text = item.name;
                onPress = () => {
                  if (isSelected) {
                    onSelectFilter('type', '', undefined);
                  } else {
                    onSelectFilter('type', item.id, item.name);
                  }
                };
              }

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  style={[
                    s.gridItemPremium,
                    useSingleRow && s.gridItemSingleRow,
                    isSelected && s.gridItemPremiumActive,
                  ]}
                  onPress={onPress}
                >
                  <View
                    style={[
                      s.iconWrapper,
                      useSingleRow && { marginBottom: 0, marginEnd: 8, height: 'auto' },
                    ]}
                  >
                    {icon}
                  </View>
                  <Text
                    style={[
                      s.itemTextPremium,
                      isSelected && s.itemTextPremiumActive,
                      useSingleRow && s.itemTextSingleRow,
                    ]}
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
          <Ionicons
            name="information-circle-outline"
            size={32}
            color={Colors.textMuted}
            style={{ marginBottom: 10 }}
          />
          <Text style={s.placeholderText}>الرجاء اختيار الماركة أولاً لعرض الموديلات</Text>
          <TouchableOpacity
            style={s.switchTabBtn}
            onPress={() => setActiveTab('brands')}
            activeOpacity={0.7}
          >
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

  const renderActiveGrid = () => {
    switch (activeTab) {
      case 'brands':
        return renderBrandsGrid();
      case 'models':
        return renderModelsGrid();
      case 'cities':
        return renderCitiesGrid();
      case 'prices':
        return renderPricesGrid();
      case 'types':
        return renderTypesGrid();
      default:
        return null;
    }
  };

  const getActiveTabLabel = () => TABS.find((t) => t.id === activeTab)?.label || 'العناصر';
  const getActiveTabViewAllText = () => {
    if (activeTab === 'brands') return 'عرض جميع العلامات التجارية';
    if (activeTab === 'models') return 'عرض جميع الموديلات';
    if (activeTab === 'cities') return 'عرض جميع المدن';
    if (activeTab === 'prices') return 'تحديد ميزانية مخصصة';
    if (activeTab === 'types') return 'عرض جميع أنواع الهيكل';
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
              activeOpacity={0.7}
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
          activeOpacity={0.7}
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
    borderBottomColor: '#f1f5f9',
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
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabButtonActive: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary + '40',
  },
  tabText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: Colors.textMuted,
    writingDirection: 'rtl',
  },
  tabTextActive: {
    fontFamily: 'Almarai_800ExtraBold',
    color: Colors.primary,
  },
  contentArea: {
    paddingTop: Spacing.space2,
  },
  horizontalScroll: {},
  horizontalGridContent: {
    paddingHorizontal: Spacing.space4,
    paddingTop: 6,
    paddingBottom: Spacing.space2,
    flexDirection: 'row',
    gap: 8,
  },
  gridColumn: {
    alignItems: 'center',
    gap: 8,
  },
  gridItemPremium: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 6,
    minHeight: 84,
    backgroundColor: Colors.white,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  gridItemSingleRow: {
    minHeight: 48,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridItemPremiumActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  iconWrapper: {
    marginBottom: 4,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandLogo: {
    width: 32,
    height: 32,
  },
  brandLogoActive: {
    tintColor: Colors.white,
  },
  itemTextPremium: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 16,
    writingDirection: 'rtl',
  },
  itemTextSingleRow: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    writingDirection: 'rtl',
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
    borderWidth: 1,
    borderColor: '#dbeafe',
    gap: 4,
  },
  viewAllBtnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: Colors.primary,
    writingDirection: 'rtl',
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
    paddingHorizontal: 20,
  },
  placeholderText: {
    fontFamily: 'Almarai_400Regular',
    color: Colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  switchTabBtn: {
    marginTop: Spacing.space3,
    paddingVertical: Spacing.space2,
    paddingHorizontal: Spacing.space4,
    backgroundColor: '#F0F5FF',
    borderRadius: Radius.md,
  },
  switchTabTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: Colors.primary,
    writingDirection: 'rtl',
  },
});
