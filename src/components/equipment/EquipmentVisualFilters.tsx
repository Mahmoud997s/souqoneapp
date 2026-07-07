import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Radius } from '../../constants/radius';
import { Dimensions } from 'react-native';
import { EQUIPMENT_TYPES } from '../../utils/equipment-mappers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── STATIC DATA ───
const TABS = [
  { id: 'categories', label: 'أنواع المعدات' },
  { id: 'cities', label: 'أهم المدن' },
  { id: 'prices', label: 'الأسعار' },
  { id: 'conditions', label: 'الحالة' },
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

const PRICE_RANGES = [
  { id: 'p1', label: 'أقل من 50 ر.ع', min: 0, max: 50 },
  { id: 'p2', label: '50 - 100 ر.ع', min: 50, max: 100 },
  { id: 'p3', label: '100 - 500 ر.ع', min: 100, max: 500 },
  { id: 'p4', label: '500 - 1,000 ر.ع', min: 500, max: 1000 },
  { id: 'p5', label: '1,000 - 5,000 ر.ع', min: 1000, max: 5000 },
  { id: 'p6', label: '5,000 - 10,000 ر.ع', min: 5000, max: 10000 },
  { id: 'p7', label: 'أكثر من 10,000 ر.ع', min: 10000, max: null },
];

const CONDITIONS = [
  { id: 'NEW', name: 'جديدة' },
  { id: 'USED', name: 'مستعملة' },
  { id: 'LIKE_NEW', name: 'شبه جديدة' },
  { id: 'REFURBISHED', name: 'مجددة' },
];

interface EquipmentVisualFiltersProps {
  onSelectFilter: (type: 'category' | 'city' | 'price' | 'condition', valueId: string, valueName?: string, min?: number, max?: number) => void;
  onViewAll: (tabId: string) => void;
  selectedCategoryId?: string;
  selectedCity?: string;
  selectedPriceId?: string;
  selectedConditionId?: string;
}

export function EquipmentVisualFilters({
  onSelectFilter,
  onViewAll,
  selectedCategoryId,
  selectedCity,
  selectedPriceId,
  selectedConditionId,
}: EquipmentVisualFiltersProps) {
  const [activeTab, setActiveTab] = useState<string>('categories');

  const categoriesArray = Object.entries(EQUIPMENT_TYPES).map(([key, value]) => ({
    id: key,
    name: value.label,
    icon: 'hardware-chip-outline', // Since it's equipment
  }));

  const renderHorizontalGrid = (items: any[], type: 'categories' | 'cities' | 'prices' | 'conditions') => {
    if (!items || items.length === 0) return null;

    // Chunk array into pairs (2 items per column)
    const chunks = [];
    for (let i = 0; i < items.length; i += 2) {
      chunks.push(items.slice(i, i + 2));
    }

    return (
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.horizontalGridContent}
        style={s.horizontalScroll}
      >
        {chunks.map((chunk, index) => (
          <View key={index} style={s.gridColumn}>
            {chunk.map((item) => {
              let isSelected = false;
              let icon = null;
              let text = '';
              let onPress = () => {};

              if (type === 'categories') {
                isSelected = selectedCategoryId === item.id;
                icon = <Ionicons name="hardware-chip-outline" size={24} color={isSelected ? Colors.white : Colors.equipmentPrimary} />;
                text = item.name;
                onPress = () => onSelectFilter('category', item.id, item.name);
              } else if (type === 'cities') {
                isSelected = selectedCity === item.name;
                icon = <Ionicons name="location-outline" size={24} color={isSelected ? Colors.white : Colors.equipmentPrimary} />;
                text = item.name;
                onPress = () => onSelectFilter('city', item.name, item.name);
              } else if (type === 'prices') {
                isSelected = selectedPriceId === item.id;
                icon = <Ionicons name="wallet-outline" size={24} color={isSelected ? Colors.white : Colors.equipmentPrimary} />;
                text = item.label;
                onPress = () => onSelectFilter('price', item.id, item.label, item.min, item.max || undefined);
              } else if (type === 'conditions') {
                isSelected = selectedConditionId === item.id;
                icon = <Ionicons name="construct-outline" size={24} color={isSelected ? Colors.white : Colors.equipmentPrimary} />;
                text = item.name;
                onPress = () => onSelectFilter('condition', item.id, item.name);
              }

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[s.gridItemPremium, isSelected && s.gridItemPremiumActive]}
                  onPress={onPress}
                >
                  <View style={s.iconWrapper}>
                    {icon}
                  </View>
                  <Text style={[s.itemTextPremium, isSelected && s.itemTextPremiumActive]} numberOfLines={2}>
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

  const renderActiveGrid = () => {
    switch (activeTab) {
      case 'categories': return renderHorizontalGrid(categoriesArray, 'categories');
      case 'cities': return renderHorizontalGrid(TOP_CITIES, 'cities');
      case 'prices': return renderHorizontalGrid(PRICE_RANGES, 'prices');
      case 'conditions': return renderHorizontalGrid(CONDITIONS, 'conditions');
      default: return null;
    }
  };

  const getActiveTabLabel = () => TABS.find(t => t.id === activeTab)?.label || 'العناصر';
  const getActiveTabViewAllText = () => {
    if (activeTab === 'categories') return 'عرض جميع أنواع المعدات';
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
          <Ionicons name="chevron-down" size={16} color={Colors.equipmentPrimary} />
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
    backgroundColor: Colors.equipmentPrimary + '15',
  },
  tabText: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13,
    color: Colors.textMuted,
  },
  tabTextActive: {
    fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, color: Colors.equipmentPrimary,
  },
  contentArea: {
    paddingTop: Spacing.space3,
  },
  horizontalScroll: {},
  horizontalGridContent: {
    paddingHorizontal: Spacing.space4,
    paddingTop: 4,
    paddingBottom: Spacing.space2,
    flexGrow: 1,
    justifyContent: 'center',
  },
  gridColumn: {
    width: (SCREEN_WIDTH - (Spacing.space4 * 2)) / 4.8,
    alignItems: 'center',
    paddingHorizontal: Spacing.space1,
  },
  gridItemPremium: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: Spacing.space2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.space1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16 },
      android: { elevation: 4 },
    }),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  gridItemPremiumActive: {
    backgroundColor: Colors.equipmentPrimary,
    borderColor: Colors.equipmentPrimary,
    ...Platform.select({
      ios: { shadowColor: Colors.equipmentPrimary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  iconWrapper: {
    marginBottom: 2,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTextPremium: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 11,
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
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14,
    color: Colors.equipmentPrimary,
    marginStart: Spacing.space1,
  },
});
