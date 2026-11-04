import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  LayoutAnimation,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBrands, useCarModels } from '../../hooks/useCars';
import { CarBrand, CarModelItem } from '../../api/cars';
import { getBrandLogo } from '../../constants/brandLogos';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { FilterGlassTokens } from '../../constants/filterGlassTokens';
import {
  VisualFiltersBase,
  VisualFilterTab,
  visualFiltersStyles,
} from '../ui/VisualFiltersBase';
import { type GlassSupport } from '../navigation/glassSupport';

// ─── STATIC DATA ───
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

const CAR_TYPES: { id: string; name: string; icon: keyof typeof Ionicons.glyphMap }[] = [
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
  glassSupport?: GlassSupport;
}

export function CarsVisualFilters({
  onSelectFilter,
  onViewAll,
  selectedBrandId,
  selectedCity,
  selectedModelId,
  selectedPriceId,
  selectedTypeId,
  glassSupport,
}: CarsVisualFiltersProps) {
  const [activeTab, setActiveTab] = useState<'brands' | 'models' | 'cities' | 'prices' | 'types'>('brands');
  const { data: brands, isLoading: loadingBrands } = useBrands();
  const { data: models, isLoading: loadingModels } = useCarModels(selectedBrandId || '');

  const modelsEmptyState = useMemo(() => {
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
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setActiveTab('brands');
            }}
            activeOpacity={0.7}
          >
            <Text style={s.inlineEmptyBtnText}>الماركات</Text>
            <Ionicons name="arrow-back-outline" size={14} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      );
    }
    if (!loadingModels && (!models || models.length === 0)) {
      return (
        <View style={s.inlineEmptyBox}>
          <View style={[s.inlineEmptyIcon, { backgroundColor: FilterGlassTokens.card.emptyErrorIconBg }]}>
            <Ionicons name="alert-circle-outline" size={20} color={Colors.error} />
          </View>
          <View style={s.inlineEmptyTextContainer}>
            <Text style={s.inlineEmptyTitle}>لا توجد موديلات</Text>
            <Text style={s.inlineEmptySub}>عذراً، لا تتوفر موديلات مسجلة لهذه الماركة حالياً</Text>
          </View>
        </View>
      );
    }
    return null;
  }, [selectedBrandId, loadingModels, models]);

  const tabs = useMemo(
    () => [
      {
        id: 'brands',
        label: 'أفضل الماركات',
        icon: 'ribbon-outline' as const,
        items: brands || [],
        isLoading: loadingBrands,
        getItemProps: (item: CarBrand) => {
          const isSelected = selectedBrandId === item.id;
          const logo = getBrandLogo(item.slug || item.id);
          return {
            id: item.id,
            label: item.nameAr || item.name,
            isSelected,
            icon: (
              <View style={visualFiltersStyles.logoBox}>
                {logo ? (
                  <Image source={logo} style={visualFiltersStyles.brandLogo} resizeMode="contain" />
                ) : (
                  <Ionicons name="car-outline" size={16} color={Colors.primary} />
                )}
              </View>
            ),
            onPress: () => {
              if (isSelected) {
                onSelectFilter('make', '', undefined);
              } else {
                onSelectFilter('make', item.id, item.name);
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setActiveTab('models');
              }
            },
          };
        },
      },
      {
        id: 'models',
        label: 'أفضل الموديلات',
        icon: 'car-sport-outline' as const,
        items: models || [],
        isLoading: loadingModels,
        emptyState: modelsEmptyState,
        getItemProps: (item: CarModelItem) => {
          const isSelected = selectedModelId === item.id;
          return {
            id: item.id,
            label: item.nameAr || item.name,
            isSelected,
            icon: (
              <View style={[visualFiltersStyles.iconBox, { backgroundColor: isSelected ? Colors.primary : FilterGlassTokens.card.iconTileBg }]}>
                <Ionicons name="car-sport-outline" size={14} color={isSelected ? Colors.white : Colors.primary} />
              </View>
            ),
            onPress: () => {
              if (isSelected) {
                onSelectFilter('model', '', undefined);
              } else {
                onSelectFilter('model', item.id, item.name);
              }
            },
          };
        },
      },
      {
        id: 'cities',
        label: 'أهم المدن',
        icon: 'location-outline' as const,
        items: TOP_CITIES,
        getItemProps: (item: typeof TOP_CITIES[number]) => {
          const isSelected = selectedCity === item.name;
          return {
            id: item.id,
            label: item.name,
            isSelected,
            icon: (
              <View style={[visualFiltersStyles.iconBox, { backgroundColor: isSelected ? Colors.primary : FilterGlassTokens.card.iconTileBg }]}>
                <Ionicons name={isSelected ? 'location' : 'location-outline'} size={14} color={isSelected ? Colors.white : Colors.primary} />
              </View>
            ),
            onPress: () => {
              if (isSelected) {
                onSelectFilter('city', '', undefined);
              } else {
                onSelectFilter('city', item.id, item.name, undefined, undefined, item.extraId);
              }
            },
          };
        },
      },
      {
        id: 'prices',
        label: 'نطاقات الأسعار',
        icon: 'wallet-outline' as const,
        items: PRICE_RANGES,
        getItemProps: (item: typeof PRICE_RANGES[number]) => {
          const isSelected = selectedPriceId === item.id;
          return {
            id: item.id,
            label: item.label,
            isSelected,
            icon: (
              <View style={[visualFiltersStyles.iconBox, { backgroundColor: isSelected ? Colors.primary : FilterGlassTokens.card.iconTileBg }]}>
                <Ionicons name={isSelected ? 'wallet' : 'wallet-outline'} size={14} color={isSelected ? Colors.white : Colors.primary} />
              </View>
            ),
            onPress: () => {
              if (isSelected) {
                onSelectFilter('price', '', undefined);
              } else {
                onSelectFilter('price', item.id, item.label, item.min, item.max || undefined);
              }
            },
          };
        },
      },
      {
        id: 'types',
        label: 'الهيكل',
        icon: 'options-outline' as const,
        items: CAR_TYPES,
        getItemProps: (item: typeof CAR_TYPES[number]) => {
          const isSelected = selectedTypeId?.toUpperCase() === item.id?.toUpperCase();
          return {
            id: item.id,
            label: item.name,
            isSelected,
            icon: (
              <View style={[visualFiltersStyles.iconBox, { backgroundColor: isSelected ? Colors.primary : FilterGlassTokens.card.iconTileBg }]}>
                <Ionicons name={item.icon || 'car-sport-outline'} size={14} color={isSelected ? Colors.white : Colors.primary} />
              </View>
            ),
            onPress: () => {
              if (isSelected) {
                onSelectFilter('type', '', undefined);
              } else {
                onSelectFilter('type', item.id, item.name);
              }
            },
          };
        },
      },
    ],
    [
      brands,
      loadingBrands,
      selectedBrandId,
      models,
      loadingModels,
      selectedModelId,
      modelsEmptyState,
      selectedCity,
      selectedPriceId,
      selectedTypeId,
      onSelectFilter,
    ]
  );

  return (
    <VisualFiltersBase
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as typeof activeTab)}
      onViewAll={onViewAll}
      glassSupport={glassSupport}
    />
  );
}

const s = StyleSheet.create({
  inlineEmptyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FilterGlassTokens.iceGlassBg,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: Spacing.space4,
    borderWidth: 1,
    borderColor: FilterGlassTokens.borderColor,
    gap: 12,
  },
  inlineEmptyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: FilterGlassTokens.card.iconTileBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineEmptyTextContainer: {
    flex: 1,
  },
  inlineEmptyTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: Colors.text,
    writingDirection: 'rtl',
    marginBottom: 4,
    textAlign: 'left',
  },
  inlineEmptySub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10.5,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'left',
    lineHeight: 14,
  },
  inlineEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  inlineEmptyBtnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    color: Colors.primary,
    writingDirection: 'rtl',
  },
});
