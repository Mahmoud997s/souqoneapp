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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── STATIC DATA ───
const TABS = [
  { id: 'services', label: 'نوع الشحن' },
  { id: 'cities', label: 'أهم المحافظات' },
  { id: 'statuses', label: 'الحالة' },
];

const SERVICE_TYPES = [
  { id: 'GOODS', name: 'بضائع عامة', icon: 'cube-outline' },
  { id: 'FURNITURE', name: 'أثاث ومنزليات', icon: 'home-outline' },
  { id: 'CONSTRUCTION', name: 'مواد البناء', icon: 'hammer-outline' },
  { id: 'HEAVY', name: 'شحن ثقيل', icon: 'car-outline' },
  { id: 'BACKLOAD', name: 'عودة فارغة', icon: 'swap-horizontal-outline' },
  { id: 'EQUIPMENT', name: 'معدات وآليات', icon: 'construct-outline' },
];

const TOP_CITIES = [
  { id: 'OM_MUS', name: 'مسقط' },
  { id: 'OM_DHO', name: 'ظفار' },
  { id: 'OM_BAT', name: 'شمال الباطنة' },
  { id: 'OM_BSS', name: 'جنوب الباطنة' },
  { id: 'OM_DAK', name: 'الداخلية' },
  { id: 'OM_SHA', name: 'شمال الشرقية' },
  { id: 'OM_SHS', name: 'جنوب الشرقية' },
  { id: 'OM_BUR', name: 'البريمي' },
];

const STATUSES = [
  { id: 'OPEN', name: 'مفتوح', icon: 'radio-button-on' },
  { id: 'QUOTED', name: 'وصلت عروض', icon: 'pricetag' },
  { id: 'IN_PROGRESS', name: 'جارٍ', icon: 'sync-outline' },
];

interface TransportVisualFiltersProps {
  onSelectFilter: (type: 'service' | 'city' | 'status', valueId: string, valueName?: string) => void;
  onViewAll: (tabId: string) => void;
  selectedServiceId?: string;
  selectedCity?: string;
  selectedStatusId?: string;
}

export function TransportVisualFilters({
  onSelectFilter,
  onViewAll,
  selectedServiceId,
  selectedCity,
  selectedStatusId,
}: TransportVisualFiltersProps) {
  const [activeTab, setActiveTab] = useState<string>('services');

  const renderHorizontalGrid = (items: any[], type: 'services' | 'cities' | 'statuses') => {
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

              if (type === 'services') {
                isSelected = selectedServiceId === item.id;
                icon = <Ionicons name={item.icon as any} size={24} color={isSelected ? Colors.white : Colors.primary} />;
                text = item.name;
                onPress = () => onSelectFilter('service', item.id, item.name);
              } else if (type === 'cities') {
                isSelected = selectedCity === item.name;
                icon = <Ionicons name="location-outline" size={24} color={isSelected ? Colors.white : Colors.primary} />;
                text = item.name;
                onPress = () => onSelectFilter('city', item.name, item.name);
              } else if (type === 'statuses') {
                isSelected = selectedStatusId === item.id;
                icon = <Ionicons name={item.icon as any} size={24} color={isSelected ? Colors.white : Colors.primary} />;
                text = item.name;
                onPress = () => onSelectFilter('status', item.id, item.name);
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
      case 'services': return renderHorizontalGrid(SERVICE_TYPES, 'services');
      case 'cities': return renderHorizontalGrid(TOP_CITIES, 'cities');
      case 'statuses': return renderHorizontalGrid(STATUSES, 'statuses');
      default: return null;
    }
  };

  const getActiveTabLabel = () => TABS.find(t => t.id === activeTab)?.label || 'العناصر';
  const getActiveTabViewAllText = () => {
    if (activeTab === 'services') return 'عرض جميع أنواع الشحن';
    if (activeTab === 'cities') return 'عرض جميع المحافظات';
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
    backgroundColor: Colors.primary + '15',
  },
  tabText: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13,
    color: Colors.textMuted,
  },
  tabTextActive: {
    fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, color: Colors.primary,
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
  itemTextPremium: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 11,
    color: Colors.text,
    textAlign: 'center',
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
    color: Colors.primary,
    marginStart: Spacing.space1,
  },
});
