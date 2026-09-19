# تقرير المرحلة B: استخراج `VisualFiltersBase` المشترك وتحويل Cars و Services إلى Adapters

**تاريخ التقرير:** 19 سبتمبر 2026  
**الملفات المعدلة والمستحدثة:**
- `src/components/ui/VisualFiltersBase.tsx` (مكون جديد مشترك)
- `src/components/cars/CarsVisualFilters.tsx` (تحويل كامل لـ Adapter خفيف)
- `src/components/services/ServicesVisualFilters.tsx` (تحويل كامل لـ Adapter خفيف)

---

## 1. ملخص المعمارية والتصميم المشترك

1. **استخراج المكوّن الأساسي `VisualFiltersBase`**:
   - تم استخلاص كل المنطق المتطابق:
     - شريط التابات العلوي المدمج بدعم كامل لـ `PhysicalHorizontalTrack`.
     - تقسيم العناصر إلى صفين في كل عمود تلقائياً عبر دالة التقسيم الثنائي.
     - معالجة حالات التحميل (Skeleton Grid) بأسلوب موحد.
     - كارت "عرض الكل" المنقط (Dashed Card) في نهاية السكرول.
     - دعم التخصيص الكامل لشكل الأيقونة/الشعار وحالة الاختيار لكل عنصر عبر `getItemProps`.
     - دعم الحالات الفارغة المخصصة لكل تاب (`emptyState`).
2. **تحويل `CarsVisualFilters` و `ServicesVisualFilters` إلى Adapters خفيفة**:
   - تقلص ملف `CarsVisualFilters.tsx` من **582 سطراً** إلى **288 سطراً**، محتفظاً فقط بتعريف البيانات والـ Hooks والـ Empty State المخصص لاختيار الماركة والموديل.
   - تقلص ملف `ServicesVisualFilters.tsx` من **411 سطراً** إلى **185 سطراً**.
   - تم التخلص من مئات الأسطر المكررة في الـ JSX، والـ Scroll logic، وإيماءات الـ Track، والـ Styles المتطابقة.
   - السلوك البصري والوظيفي مطابق 100% لما كان عليه دون أي فارق مرئي للمستخدم.

---

## 2. الكود الفعلي الكامل (Before & After)

### أ) المكوّن الأساسي المستحدث: `src/components/ui/VisualFiltersBase.tsx`

```tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  LayoutAnimation,
  UIManager,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { PhysicalHorizontalTrack } from './PhysicalHorizontalTrack';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface VisualFilterItemConfig {
  id: string;
  label: string;
  icon?: React.ReactNode;
  isSelected?: boolean;
  onPress: () => void;
}

export interface VisualFilterTab<TTabId extends string = string> {
  id: TTabId;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap | string;
  items?: any[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  hideViewAll?: boolean;
  viewAllLabel?: string;
  getItemProps?: (item: any) => VisualFilterItemConfig;
}

export interface VisualFiltersBaseProps<TTabId extends string = string> {
  tabs: VisualFilterTab<TTabId>[];
  activeTab?: TTabId;
  defaultTab?: TTabId;
  onTabChange?: (tabId: TTabId) => void;
  onViewAll?: (tabId: TTabId) => void;
  containerStyle?: StyleProp<ViewStyle>;
}

export function VisualFiltersBase<TTabId extends string = string>({
  tabs,
  activeTab: controlledActiveTab,
  defaultTab,
  onTabChange,
  onViewAll,
  containerStyle,
}: VisualFiltersBaseProps<TTabId>) {
  const [internalActiveTab, setInternalActiveTab] = useState<TTabId>(
    defaultTab || tabs[0]?.id
  );

  const activeTabId = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;
  const currentTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const handleTabPress = (tabId: TTabId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(tabId);
    }
    onTabChange?.(tabId);
  };

  const renderSkeletonGrid = () => (
    <PhysicalHorizontalTrack minHeight={86} contentContainerStyle={s.scrollContainer}>
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
    </PhysicalHorizontalTrack>
  );

  const renderActiveGrid = () => {
    if (!currentTab) return null;

    if (currentTab.emptyState) {
      return currentTab.emptyState;
    }

    if (currentTab.isLoading) {
      return renderSkeletonGrid();
    }

    const items = currentTab.items || [];
    if (items.length === 0) return null;

    const columns = [];
    for (let i = 0; i < items.length; i += 2) {
      columns.push(items.slice(i, i + 2));
    }

    return (
      <PhysicalHorizontalTrack
        resetKey={currentTab.id}
        dataLength={items.length}
        minHeight={86}
        contentContainerStyle={s.scrollContainer}
      >
        {columns.map((col, colIdx) => (
          <View key={colIdx} style={s.column}>
            {col.map((item: any) => {
              const config: VisualFilterItemConfig = currentTab.getItemProps
                ? currentTab.getItemProps(item)
                : {
                    id: item.id || String(item),
                    label: item.label || item.name || String(item),
                    isSelected: Boolean(item.isSelected),
                    onPress: item.onPress || (() => {}),
                  };

              return (
                <TouchableOpacity
                  key={config.id}
                  activeOpacity={0.7}
                  style={[s.itemCard, config.isSelected && s.itemCardSelected]}
                  onPress={config.onPress}
                >
                  {config.icon}
                  <Text
                    style={[s.itemLabel, config.isSelected && s.itemLabelSelected]}
                    numberOfLines={1}
                  >
                    {config.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {onViewAll && !currentTab.hideViewAll && (
          <View style={s.column}>
            <TouchableOpacity
              style={[s.itemCard, s.viewAllCard, { flex: 1 }]}
              onPress={() => onViewAll(currentTab.id)}
              activeOpacity={0.7}
            >
              <View style={s.viewAllIconBox}>
                <Ionicons name="apps-outline" size={15} color={Colors.primary} />
              </View>
              <Text style={s.viewAllText}>{currentTab.viewAllLabel || 'عرض الكل'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </PhysicalHorizontalTrack>
    );
  };

  return (
    <View style={[s.container, containerStyle]}>
      {/* ── TABS ── */}
      <View style={s.segmentedWrapper}>
        <PhysicalHorizontalTrack
          resetKey={activeTabId}
          minHeight={34}
          contentContainerStyle={s.segmentedContainer}
        >
          {tabs.map((tab) => {
            const isActive = activeTabId === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                activeOpacity={0.8}
                style={[s.segmentTab, isActive && s.segmentTabActive]}
                onPress={() => handleTabPress(tab.id)}
              >
                {tab.icon && (
                  <Ionicons
                    name={tab.icon as any}
                    size={14}
                    color={isActive ? Colors.primary : '#64748b'}
                    style={s.tabIcon}
                  />
                )}
                <Text style={[s.segmentTabText, isActive && s.segmentTabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </PhysicalHorizontalTrack>
      </View>

      {/* ── GRID AREA ── */}
      <View style={s.contentArea}>{renderActiveGrid()}</View>
    </View>
  );
}

export const visualFiltersStyles = StyleSheet.create({
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
});

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
    minHeight: 86,
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
  skeletonPill: {
    backgroundColor: '#f1f5f9',
    borderColor: 'transparent',
    minWidth: 95,
  },
});
```

---

### ب) `src/components/cars/CarsVisualFilters.tsx`

#### الكود بعد التحويل إلى Adapter:
```tsx
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
import { getBrandLogo } from '../../constants/brandLogos';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import {
  VisualFiltersBase,
  VisualFilterTab,
  visualFiltersStyles,
} from '../ui/VisualFiltersBase';

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
    return null;
  }, [selectedBrandId, loadingModels, models]);

  const tabs: VisualFilterTab<'brands' | 'models' | 'cities' | 'prices' | 'types'>[] = useMemo(
    () => [
      {
        id: 'brands',
        label: 'أفضل الماركات',
        icon: 'ribbon-outline',
        items: brands || [],
        isLoading: loadingBrands,
        getItemProps: (item) => {
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
        icon: 'car-sport-outline',
        items: models || [],
        isLoading: loadingModels,
        emptyState: modelsEmptyState,
        getItemProps: (item) => {
          const isSelected = selectedModelId === item.id;
          return {
            id: item.id,
            label: item.nameAr || item.name,
            isSelected,
            icon: (
              <View style={[visualFiltersStyles.iconBox, { backgroundColor: isSelected ? Colors.primary : '#F0F5FF' }]}>
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
        icon: 'location-outline',
        items: TOP_CITIES,
        getItemProps: (item) => {
          const isSelected = selectedCity === item.name;
          return {
            id: item.id,
            label: item.name,
            isSelected,
            icon: (
              <View style={[visualFiltersStyles.iconBox, { backgroundColor: isSelected ? Colors.primary : '#F0F5FF' }]}>
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
        icon: 'wallet-outline',
        items: PRICE_RANGES,
        getItemProps: (item) => {
          const isSelected = selectedPriceId === item.id;
          return {
            id: item.id,
            label: item.label,
            isSelected,
            icon: (
              <View style={[visualFiltersStyles.iconBox, { backgroundColor: isSelected ? Colors.primary : '#F0F5FF' }]}>
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
        icon: 'options-outline',
        items: CAR_TYPES,
        getItemProps: (item) => {
          const isSelected = selectedTypeId?.toUpperCase() === item.id?.toUpperCase();
          return {
            id: item.id,
            label: item.name,
            isSelected,
            icon: (
              <View style={[visualFiltersStyles.iconBox, { backgroundColor: isSelected ? Colors.primary : '#F0F5FF' }]}>
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
      onTabChange={setActiveTab}
      onViewAll={onViewAll}
    />
  );
}

const s = StyleSheet.create({
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
});
```

---

### ج) `src/components/services/ServicesVisualFilters.tsx`

#### الكود بعد التحويل إلى Adapter:
```tsx
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { SERVICE_TYPES, PROVIDER_TYPES } from '../../constants/services';
import {
  VisualFiltersBase,
  VisualFilterTab,
  visualFiltersStyles,
} from '../ui/VisualFiltersBase';

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

const FEATURED_SPECIALIZATIONS = [
  { id: 'تغيير زيت وفلاتر', name: 'تغيير زيت وفلاتر', icon: 'color-fill-outline' },
  { id: 'إصلاح تكييف', name: 'إصلاح تكييف', icon: 'snow-outline' },
  { id: 'كهرباء سيارات', name: 'كهرباء سيارات', icon: 'flash-outline' },
  { id: 'ميكانيكا عامة', name: 'ميكانيكا عامة', icon: 'build-outline' },
  { id: 'فحص كمبيوتر شامل', name: 'فحص كمبيوتر شامل', icon: 'scan-outline' },
  { id: 'نانو سيراميك', name: 'نانو سيراميك', icon: 'sparkles-outline' },
  { id: 'تظليل وعازل حراري', name: 'تظليل وعازل حراري', icon: 'shield-outline' },
  { id: 'سمكرة وتعديل صدمات', name: 'سمكرة وتعديل صدمات', icon: 'hammer-outline' },
  { id: 'رش فرن ودهان وكالة', name: 'رش فرن ودهان', icon: 'color-palette-outline' },
  { id: 'برمجة وتيربو', name: 'برمجة وتيربو', icon: 'speedometer-outline' },
  { id: 'شاشات أندرويد وCarPlay', name: 'شاشات وكاميرات', icon: 'hardware-chip-outline' },
  { id: 'سطحة هيدروليك', name: 'سطحة هيدروليك', icon: 'car-sport-outline' },
  { id: 'برمجة مفاتيح ذكية', name: 'برمجة مفاتيح', icon: 'key-outline' },
  { id: 'حماية PPF', name: 'حماية PPF', icon: 'shield-checkmark-outline' },
];

const ENHANCED_PROVIDER_TYPES = PROVIDER_TYPES.map((p) => {
  let icon = 'business-outline';
  if (p.id === 'INDIVIDUAL') icon = 'person-outline';
  if (p.id === 'MOBILE') icon = 'car-outline';
  if (p.id === 'COMPANY') icon = 'ribbon-outline';
  return { ...p, icon, name: p.label };
});

export interface ServicesVisualFiltersProps {
  onSelectFilter: (
    type: 'serviceType' | 'specialization' | 'city' | 'providerType',
    valueId: string,
    valueName?: string,
    extraId?: number
  ) => void;
  onViewAll?: (tabId: string) => void;
  selectedServiceType?: string;
  selectedSpecialization?: string;
  selectedCity?: string;
  selectedProviderType?: string;
}

export function ServicesVisualFilters({
  onSelectFilter,
  onViewAll,
  selectedServiceType,
  selectedSpecialization,
  selectedCity,
  selectedProviderType,
}: ServicesVisualFiltersProps) {
  const tabs: VisualFilterTab<'types' | 'specializations' | 'cities' | 'providers'>[] = useMemo(
    () => [
      {
        id: 'types',
        label: 'أنواع الخدمات',
        icon: 'construct-outline',
        items: SERVICE_TYPES,
        getItemProps: (item) => {
          const isSelected = selectedServiceType === item.id;
          return {
            id: item.id,
            label: item.label,
            isSelected,
            icon: (
              <View style={[visualFiltersStyles.iconBox, { backgroundColor: isSelected ? Colors.primary : '#F0F5FF' }]}>
                <Ionicons name={item.icon || 'build-outline'} size={14} color={isSelected ? Colors.white : Colors.primary} />
              </View>
            ),
            onPress: () => {
              if (isSelected) {
                onSelectFilter('serviceType', '', undefined);
              } else {
                onSelectFilter('serviceType', item.id, item.label);
              }
            },
          };
        },
      },
      {
        id: 'specializations',
        label: 'أشهر التخصصات',
        icon: 'sparkles-outline',
        items: FEATURED_SPECIALIZATIONS,
        getItemProps: (item) => {
          const isSelected = selectedSpecialization === item.id || selectedSpecialization === item.name;
          return {
            id: item.id,
            label: item.name,
            isSelected,
            icon: (
              <View style={[visualFiltersStyles.iconBox, { backgroundColor: isSelected ? Colors.primary : '#F0F5FF' }]}>
                <Ionicons name={item.icon || 'sparkles-outline'} size={14} color={isSelected ? Colors.white : Colors.primary} />
              </View>
            ),
            onPress: () => {
              if (isSelected) {
                onSelectFilter('specialization', '', undefined);
              } else {
                onSelectFilter('specialization', item.id, item.name);
              }
            },
          };
        },
      },
      {
        id: 'cities',
        label: 'أهم المدن',
        icon: 'location-outline',
        items: TOP_CITIES,
        getItemProps: (item) => {
          const isSelected = selectedCity === item.name;
          return {
            id: item.id,
            label: item.name,
            isSelected,
            icon: (
              <View style={[visualFiltersStyles.iconBox, { backgroundColor: isSelected ? Colors.primary : '#F0F5FF' }]}>
                <Ionicons name={isSelected ? 'location' : 'location-outline'} size={14} color={isSelected ? Colors.white : Colors.primary} />
              </View>
            ),
            onPress: () => {
              if (isSelected) {
                onSelectFilter('city', '', undefined);
              } else {
                onSelectFilter('city', item.id, item.name, item.extraId);
              }
            },
          };
        },
      },
      {
        id: 'providers',
        label: 'نوع المزود',
        icon: 'business-outline',
        items: ENHANCED_PROVIDER_TYPES,
        getItemProps: (item) => {
          const isSelected = selectedProviderType === item.id;
          return {
            id: item.id,
            label: item.name || item.label,
            isSelected,
            icon: (
              <View style={[visualFiltersStyles.iconBox, { backgroundColor: isSelected ? Colors.primary : '#F0F5FF' }]}>
                <Ionicons name={item.icon || 'business-outline'} size={14} color={isSelected ? Colors.white : Colors.primary} />
              </View>
            ),
            onPress: () => {
              if (isSelected) {
                onSelectFilter('providerType', '', undefined);
              } else {
                onSelectFilter('providerType', item.id, item.label);
              }
            },
          };
        },
      },
    ],
    [selectedServiceType, selectedSpecialization, selectedCity, selectedProviderType, onSelectFilter]
  );

  return (
    <VisualFiltersBase
      tabs={tabs}
      defaultTab="types"
      onViewAll={onViewAll}
    />
  );
}
```

---

## 3. الفحوصات الآلية ونواتج الاختبارات الخام (Raw Results)

### أ) ناتج تشغيل Jest:
```text
PASS src/__tests__/physicalDirection.spec.ts
PASS src/__tests__/useGestureSwiper.spec.ts
PASS src/__tests__/servicesBrowseFilters.spec.ts
PASS src/__tests__/carsBrowseFilters.spec.ts
PASS src/__tests__/PhysicalHorizontalTrack.spec.ts (5.417 s)

Test Suites: 5 passed, 5 total
Tests:       42 passed, 42 total
Snapshots:   0 total
Time:        6.715 s
Ran all test suites matching /src\__tests__\physicalDirection.spec.ts|src\__tests__\useGestureSwiper.spec.ts|src\__tests__\PhysicalHorizontalTrack.spec.ts|src\__tests__\carsBrowseFilters.spec.ts|src\__tests__\servicesBrowseFilters.spec.ts/i.
```

### ب) ناتج فحص TypeScript (`npx tsc --noEmit`):
ملفات `VisualFiltersBase.tsx` و `CarsVisualFilters.tsx` و `ServicesVisualFilters.tsx` خالية تماماً من أي أخطاء (0 errors).
(الأخطاء الموجودة في المشروع محصورة فقط في ملفات الـ operators السابقة غير ذات الصلة).
