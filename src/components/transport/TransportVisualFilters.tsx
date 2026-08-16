import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

// ─── STATIC DATA ───
const TABS = [
  { id: 'services', label: 'نوع الشحن', icon: 'cube-outline' as const },
  { id: 'governorates', label: 'أهم المحافظات', icon: 'location-outline' as const },
  { id: 'timing', label: 'الموعد والتوقيت', icon: 'calendar-outline' as const },
  { id: 'budget', label: 'نطاقات الميزانية', icon: 'wallet-outline' as const },
  { id: 'helper', label: 'عمال التحميل', icon: 'people-outline' as const },
];

const SERVICE_TYPES_DATA = [
  { id: 'GOODS', label: 'بضائع عامة', icon: 'cube-send', color: '#2563eb', bg: '#dbeafe' },
  { id: 'FURNITURE', label: 'عفش وأثاث', icon: 'truck-cargo-container', color: '#0891b2', bg: '#cffafe' },
  { id: 'VEHICLES', label: 'سيارات ومركبات', icon: 'car-multiple', color: '#ea580c', bg: '#ffedd5' },
  { id: 'HEAVY', label: 'معدات وثقيل', icon: 'excavator', color: '#d97706', bg: '#fef3c7' },
  { id: 'CONSTRUCTION', label: 'مواد بناء', icon: 'hammer-wrench', color: '#dc2626', bg: '#fee2e2' },
  { id: 'FOOD_COLD', label: 'شحن مبرد', icon: 'snowflake', color: '#0284c7', bg: '#e0f2fe' },
  { id: 'LIVESTOCK', label: 'مواشي وحيوانات', icon: 'cow', color: '#16a34a', bg: '#dcfce7' },
  { id: 'EXPRESS', label: 'شحن مستعجل', icon: 'flash', color: '#eab308', bg: '#fef9c3' },
  { id: 'BACKLOAD', label: 'نقل راجع', icon: 'swap-horizontal', color: '#9333ea', bg: '#f3e8ff' },
];

const GOVERNORATES_DATA = [
  { id: 'مسقط', name: 'مسقط' },
  { id: 'ظفار', name: 'ظفار' },
  { id: 'شمال الباطنة', name: 'شمال الباطنة' },
  { id: 'جنوب الباطنة', name: 'جنوب الباطنة' },
  { id: 'الداخلية', name: 'الداخلية' },
  { id: 'شمال الشرقية', name: 'شمال الشرقية' },
  { id: 'جنوب الشرقية', name: 'جنوب الشرقية' },
  { id: 'البريمي', name: 'البريمي' },
  { id: 'الظاهرة', name: 'الظاهرة' },
  { id: 'مسندم', name: 'مسندم' },
  { id: 'الوسطى', name: 'الوسطى' },
];

const TIMING_DATA = [
  { id: 'asap', label: 'فوري (أسرع وقت)', icon: 'timer-sand-full', color: '#ef4444', bg: '#fee2e2' },
  { id: 'scheduled', label: 'مجدول بموعد', icon: 'calendar-clock', color: '#2563eb', bg: '#dbeafe' },
  { id: 'flexible', label: 'مرن في التوقيت', icon: 'check-decagram-outline', color: '#16a34a', bg: '#dcfce7' },
];

const BUDGET_DATA = [
  { id: 'b1', label: 'أقل من 50 ر.ع', min: 0, max: 50 },
  { id: 'b2', label: '50 - 100 ر.ع', min: 50, max: 100 },
  { id: 'b3', label: '100 - 300 ر.ع', min: 100, max: 300 },
  { id: 'b4', label: '300 - 500 ر.ع', min: 300, max: 500 },
  { id: 'b5', label: 'أكثر من 500 ر.ع', min: 500, max: null },
];

const HELPER_DATA = [
  { id: 'helper_yes', label: 'يحتاج عمال تحميل', value: true, icon: 'account-multiple-plus', color: '#2563eb', bg: '#dbeafe' },
  { id: 'helper_no', label: 'بدون عمال تحميل', value: false, icon: 'account-off-outline', color: '#64748b', bg: '#f1f5f9' },
];

export interface TransportVisualFiltersProps {
  onSelectFilter: (
    type: 'serviceType' | 'governorate' | 'timingType' | 'budget' | 'requiresHelper',
    valueId: any,
    valueName?: string,
    min?: number,
    max?: number
  ) => void;
  onViewAll: (tabId: string) => void;
  selectedServiceType?: string;
  selectedGovernorate?: string;
  selectedTimingType?: string;
  selectedBudgetMin?: string | number;
  selectedBudgetMax?: string | number;
  selectedRequiresHelper?: boolean | null;
}

export function TransportVisualFilters({
  onSelectFilter,
  onViewAll,
  selectedServiceType,
  selectedGovernorate,
  selectedTimingType,
  selectedBudgetMin,
  selectedBudgetMax,
  selectedRequiresHelper,
}: TransportVisualFiltersProps) {
  const [activeTab, setActiveTab] = useState<string>('services');

  const renderHorizontalGrid = (
    items: any[],
    type: 'services' | 'governorates' | 'timing' | 'budget' | 'helper',
    rows: 1 | 2 = 2
  ) => {
    if (!items || items.length === 0) return null;

    const columns: any[][] = [];
    const chunkSize = rows === 1 ? 1 : 2;
    for (let i = 0; i < items.length; i += chunkSize) {
      columns.push(items.slice(i, i + chunkSize));
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scrollContainer}
      >
        {columns.map((col, colIdx) => (
          <View key={colIdx} style={rows === 2 ? s.column : undefined}>
            {col.map((item: any) => {
              let isSelected = false;
              let icon: React.ReactNode = null;
              let text = '';
              let onPress = () => {};

              if (type === 'services') {
                isSelected = selectedServiceType?.toUpperCase() === item.id.toUpperCase();
                icon = (
                  <View style={[s.iconBox, { backgroundColor: isSelected ? Colors.primary : item.bg }]}>
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={14}
                      color={isSelected ? Colors.white : item.color}
                    />
                  </View>
                );
                text = item.label;
                onPress = () => {
                  if (isSelected) {
                    onSelectFilter('serviceType', '', undefined);
                  } else {
                    onSelectFilter('serviceType', item.id, item.label);
                  }
                };
              } else if (type === 'governorates') {
                isSelected = selectedGovernorate === item.name || selectedGovernorate === item.id;
                icon = (
                  <View style={[s.iconBox, { backgroundColor: isSelected ? Colors.primary : '#F0F5FF' }]}>
                    <Ionicons
                      name={isSelected ? 'location' : 'location-outline'}
                      size={14}
                      color={isSelected ? Colors.white : Colors.primary}
                    />
                  </View>
                );
                text = item.name;
                onPress = () => {
                  if (isSelected) {
                    onSelectFilter('governorate', '', undefined);
                  } else {
                    onSelectFilter('governorate', item.name, item.name);
                  }
                };
              } else if (type === 'timing') {
                isSelected = selectedTimingType === item.id;
                icon = (
                  <View style={[s.iconBox, { backgroundColor: isSelected ? Colors.primary : item.bg }]}>
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={14}
                      color={isSelected ? Colors.white : item.color}
                    />
                  </View>
                );
                text = item.label;
                onPress = () => {
                  if (isSelected) {
                    onSelectFilter('timingType', '', undefined);
                  } else {
                    onSelectFilter('timingType', item.id, item.label);
                  }
                };
              } else if (type === 'budget') {
                isSelected =
                  Number(selectedBudgetMin) === item.min &&
                  (item.max === null ? !selectedBudgetMax : Number(selectedBudgetMax) === item.max);
                icon = (
                  <View style={[s.iconBox, { backgroundColor: isSelected ? Colors.primary : '#F0F5FF' }]}>
                    <Ionicons
                      name={isSelected ? 'wallet' : 'wallet-outline'}
                      size={14}
                      color={isSelected ? Colors.white : Colors.primary}
                    />
                  </View>
                );
                text = item.label;
                onPress = () => {
                  if (isSelected) {
                    onSelectFilter('budget', '', undefined);
                  } else {
                    onSelectFilter('budget', item.id, item.label, item.min, item.max);
                  }
                };
              } else if (type === 'helper') {
                isSelected = selectedRequiresHelper === item.value;
                icon = (
                  <View style={[s.iconBox, { backgroundColor: isSelected ? Colors.primary : item.bg }]}>
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={14}
                      color={isSelected ? Colors.white : item.color}
                    />
                  </View>
                );
                text = item.label;
                onPress = () => {
                  if (isSelected) {
                    onSelectFilter('requiresHelper', null, undefined);
                  } else {
                    onSelectFilter('requiresHelper', item.value, item.label);
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
                  <Text
                    style={[s.itemLabel, isSelected && s.itemLabelSelected]}
                    numberOfLines={1}
                  >
                    {text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* View All Card */}
        <View style={rows === 2 ? s.column : undefined}>
          <TouchableOpacity
            style={[s.itemCard, s.viewAllCard, rows === 1 && { height: 38 }]}
            onPress={() => onViewAll(activeTab)}
            activeOpacity={0.7}
          >
            <View style={s.viewAllIconBox}>
              <Ionicons name="apps-outline" size={14} color={Colors.primary} />
            </View>
            <Text style={s.viewAllText}>عرض الكل</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderActiveGrid = () => {
    switch (activeTab) {
      case 'services':
        return renderHorizontalGrid(SERVICE_TYPES_DATA, 'services', 2);
      case 'governorates':
        return renderHorizontalGrid(GOVERNORATES_DATA, 'governorates', 2);
      case 'timing':
        return renderHorizontalGrid(TIMING_DATA, 'timing', 1);
      case 'budget':
        return renderHorizontalGrid(BUDGET_DATA, 'budget', 2);
      case 'helper':
        return renderHorizontalGrid(HELPER_DATA, 'helper', 1);
      default:
        return null;
    }
  };

  return (
    <View style={s.container}>
      {/* ── SEGMENTED TABS ── */}
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
                  size={13.5}
                  color={isActive ? Colors.primary : '#64748b'}
                  style={s.tabIcon}
                />
                <Text
                  style={[s.segmentTabText, isActive && s.segmentTabTextActive]}
                >
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
    marginTop: Spacing.space1,
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
    paddingVertical: 5.5,
    paddingHorizontal: 11,
    borderRadius: 6,
    gap: 4.5,
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
    fontSize: 11,
    lineHeight: 15,
    color: '#64748b',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  segmentTabTextActive: {
    color: Colors.primary,
    fontFamily: 'Almarai_800ExtraBold',
  },
  contentArea: {
    paddingTop: 4,
    paddingBottom: 2,
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
    paddingHorizontal: 8.5,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 92,
    height: 38,
    gap: 6,
  },
  itemCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  iconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
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
    minWidth: 72,
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
});
