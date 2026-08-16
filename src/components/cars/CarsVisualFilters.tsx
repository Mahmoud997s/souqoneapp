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
  LayoutAnimation,
  UIManager,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
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
  { id: '1', extraId: 1, name: 'مسقط' },
  { id: '33', extraId: 6, name: 'صحار' },
  { id: '45', extraId: 8, name: 'صور' },
  { id: '24', extraId: 5, name: 'نزوى' },
  { id: '7', extraId: 2, name: 'صلالة' },
  { id: '57', extraId: 10, name: 'عبري' },
  { id: '21', extraId: 4, name: 'البريمي' },
  { id: '39', extraId: 7, name: 'الرستاق' },
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
    max?: number,
    extraId?: number
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

    let columns = [];
    for (let i = 0; i < items.length; i += 2) {
      columns.push(items.slice(i, i + 2));
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scrollContainer}
      >
        {columns.map((col, colIdx) => (
          <View key={colIdx} style={s.column}>
            {col.map((item: any) => {
              let isSelected = false;
              let icon: React.ReactNode = null;
              let text = '';
              let onPress = () => {};

              if (type === 'brands') {
                isSelected = selectedBrandId === item.id;
                const logo = getBrandLogo(item.slug || item.id);
                icon = (
                  <View style={s.logoBox}>
                    {logo ? (
                      <Image source={logo} style={s.brandLogo} resizeMode="contain" />
                    ) : (
                      <Ionicons name="car-outline" size={16} color={Colors.primary} />
                    )}
                  </View>
                );
                text = item.nameAr || item.name;
                onPress = () => {
                  if (isSelected) {
                    onSelectFilter('make', '', undefined);
                  } else {
                    onSelectFilter('make', item.id, item.name);
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setActiveTab('models');
                  }
                };
              } else if (type === 'models') {
                isSelected = selectedModelId === item.id;
                icon = (
                  <View style={[s.iconBox, { backgroundColor: isSelected ? Colors.primary : '#F0F5FF' }]}>
                    <Ionicons name="car-sport-outline" size={14} color={isSelected ? Colors.white : Colors.primary} />
                  </View>
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
                  <View style={[s.iconBox, { backgroundColor: isSelected ? Colors.primary : '#F0F5FF' }]}>
                    <Ionicons name={isSelected ? 'location' : 'location-outline'} size={14} color={isSelected ? Colors.white : Colors.primary} />
                  </View>
                );
                text = item.name;
                onPress = () => {
                  if (isSelected) {
                    onSelectFilter('city', '', undefined);
                  } else {
                    onSelectFilter('city', item.id, item.name, undefined, undefined, item.extraId);
                  }
                };
              } else if (type === 'prices') {
                isSelected = selectedPriceId === item.id;
                icon = (
                  <View style={[s.iconBox, { backgroundColor: isSelected ? Colors.primary : '#F0F5FF' }]}>
                    <Ionicons name={isSelected ? 'wallet' : 'wallet-outline'} size={14} color={isSelected ? Colors.white : Colors.primary} />
                  </View>
                );
                text = item.label;
                onPress = () => {
                  if (isSelected) {
                    onSelectFilter('price', '', undefined);
                  } else {
                    onSelectFilter('price', item.id, item.label, item.min, item.max || undefined);
                  }
                };
              } else if (type === 'types') {
                isSelected = selectedTypeId?.toUpperCase() === item.id?.toUpperCase();
                icon = (
                  <View style={[s.iconBox, { backgroundColor: isSelected ? Colors.primary : '#F0F5FF' }]}>
                    <Ionicons name={item.icon || 'car-sport-outline'} size={14} color={isSelected ? Colors.white : Colors.primary} />
                  </View>
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
                  style={[s.itemCard, isSelected && s.itemCardSelected]}
                  onPress={onPress}
                >
                  {icon}
                  <Text style={[s.itemLabel, isSelected && s.itemLabelSelected]} numberOfLines={1}>
                    {text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
        {/* View All Card */}
        <View style={s.column}>
          <TouchableOpacity
            style={[s.itemCard, s.viewAllCard]}
            onPress={() => onViewAll(activeTab)}
            activeOpacity={0.7}
          >
            <View style={s.viewAllIconBox}>
              <Ionicons name="apps-outline" size={15} color={Colors.primary} />
            </View>
            <Text style={s.viewAllText}>عرض الكل</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderSkeletonGrid = () => {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scrollContainer}>
        <View style={s.column}>
          <View style={[s.itemCard, s.skeletonPill, { width: 110 }]} />
          <View style={[s.itemCard, s.skeletonPill, { width: 130 }]} />
        </View>
        <View style={s.column}>
          <View style={[s.itemCard, s.skeletonPill, { width: 120 }]} />
          <View style={[s.itemCard, s.skeletonPill, { width: 95 }]} />
        </View>
        <View style={s.column}>
          <View style={[s.itemCard, s.skeletonPill, { width: 105 }]} />
          <View style={[s.itemCard, s.skeletonPill, { width: 115 }]} />
        </View>
        <View style={s.column}>
          <View style={[s.itemCard, s.skeletonPill, { width: 100 }]} />
          <View style={[s.itemCard, s.skeletonPill, { width: 125 }]} />
        </View>
      </ScrollView>
    );
  };

  const renderBrandsGrid = () => {
    if (loadingBrands) {
      return renderSkeletonGrid();
    }
    return renderHorizontalGrid(brands || [], 'brands');
  };

  const renderModelsGrid = () => {
    if (!selectedBrandId) {
      return (
        <View style={s.inlineEmptyBox}>
          <View style={s.inlineEmptyIcon}>
            <Ionicons name="car-sport-outline" size={20} color={Colors.primary} />
          </View>
          <View style={s.inlineEmptyTextContainer}>
            <Text style={s.inlineEmptyTitle}>لم تقم باختيار ماركة</Text>
            <Text style={s.inlineEmptySub}>اختر الماركة أولاً لتتمكن من تصفح الموديلات الخاصة بها</Text>
          </View>
          <TouchableOpacity
            style={s.inlineEmptyBtn}
            onPress={() => setActiveTab('brands')}
            activeOpacity={0.7}
          >
            <Text style={s.inlineEmptyBtnText}>الماركات</Text>
            <Ionicons name="arrow-back-outline" size={14} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      );
    }
    if (loadingModels) {
      return renderSkeletonGrid();
    }
    if (!models || models.length === 0) {
      return (
        <View style={s.inlineEmptyBox}>
          <View style={[s.inlineEmptyIcon, { backgroundColor: '#fef2f2' }]}>
            <Ionicons name="alert-circle-outline" size={20} color="#ef4444" />
          </View>
          <View style={s.inlineEmptyTextContainer}>
            <Text style={s.inlineEmptyTitle}>لا توجد موديلات</Text>
            <Text style={s.inlineEmptySub}>عذراً، لا تتوفر موديلات مسجلة لهذه الماركة حالياً</Text>
          </View>
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
      <View style={s.segmentedWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.segmentedContainer}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                activeOpacity={0.8}
                style={[s.segmentTab, isActive && s.segmentTabActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={14}
                  color={isActive ? Colors.primary : '#64748b'}
                  style={s.tabIcon}
                />
                <Text style={[s.segmentTabText, isActive && s.segmentTabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── GRID AREA ── */}
      <View style={s.contentArea}>
        {renderActiveGrid()}

        {/* Button removed since we now use View All Card in the ScrollView */}
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
  segmentedWrapper: {
    marginHorizontal: Spacing.space4,
    marginBottom: Spacing.space2,
    marginTop: Spacing.space2,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 3,
  },
  segmentedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  segmentTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 5,
  },
  segmentTabActive: {
    backgroundColor: '#ffffff',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  tabIcon: {
    marginEnd: 2,
  },
  segmentTabText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 15.5,
    color: '#64748b',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  segmentTabTextActive: {
    color: Colors.primary,
    fontFamily: 'Almarai_800ExtraBold',
  },
  contentArea: {
    paddingTop: Spacing.space2,
  },
  scrollContainer: {
    paddingHorizontal: Spacing.space4,
    gap: 6,
  },
  column: {
    gap: 6,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5.5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 95,
    gap: 6,
  },
  itemCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogo: {
    width: 20,
    height: 20,
  },
  itemLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: '#334155',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  itemLabelSelected: {
    color: Colors.primary,
  },
  viewAllCard: {
    backgroundColor: '#f8fafc',
    borderStyle: 'dashed',
    justifyContent: 'center',
    minWidth: 75,
  },
  viewAllIconBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.primary,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  inlineEmptyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: Spacing.space4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 12,
  },
  inlineEmptyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineEmptyTextContainer: {
    flex: 1,
  },
  inlineEmptyTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: '#334155',
    writingDirection: 'rtl',
    marginBottom: 4,
    textAlign: 'left',
  },
  inlineEmptySub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10.5,
    color: '#64748b',
    writingDirection: 'rtl',
    textAlign: 'left',
    lineHeight: 14,
  },
  inlineEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
    gap: 4,
  },
  inlineEmptyBtnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    color: Colors.primary,
    writingDirection: 'rtl',
  },
  skeletonPill: {
    backgroundColor: '#f1f5f9',
    borderColor: 'transparent',
    minWidth: 95,
  },
});
