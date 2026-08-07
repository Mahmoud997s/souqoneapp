import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getBrandLogo } from '../../constants/brandLogos';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Radius } from '../../constants/radius';

// ─── STATIC DATA ───
const TABS = [
  { id: 'categories', label: 'الأقسام الرئيسية', icon: 'grid-outline' as const },
  { id: 'makes', label: 'الماركات المتوافقة', icon: 'car-sport-outline' as const },
];

const CATEGORIES_DATA = [
  { id: 'ENGINE', label: 'المحرك', icon: 'engine', color: '#ea580c', bg: '#ffedd5' },
  { id: 'BODY', label: 'الهيكل', icon: 'car-side', color: '#2563eb', bg: '#dbeafe' },
  { id: 'ELECTRICAL', label: 'الكهرباء', icon: 'car-electric', color: '#eab308', bg: '#fef9c3' },
  { id: 'SUSPENSION', label: 'المساعدات والتعليق', icon: 'car-esp', color: '#16a34a', bg: '#dcfce7' },
  { id: 'BRAKES', label: 'الفرامل', icon: 'car-brake-alert', color: '#dc2626', bg: '#fee2e2' },
  { id: 'INTERIOR', label: 'الداخلية', icon: 'car-seat', color: '#9333ea', bg: '#f3e8ff' },
  { id: 'TIRES', label: 'الإطارات', icon: 'tire', color: '#4b5563', bg: '#f3f4f6' },
  { id: 'BATTERIES', label: 'البطاريات', icon: 'car-battery', color: '#0891b2', bg: '#cffafe' },
  { id: 'OILS', label: 'الزيوت', icon: 'oil', color: '#b45309', bg: '#fef3c7' },
  { id: 'ACCESSORIES', label: 'إكسسوارات', icon: 'car-cog', color: '#6366f1', bg: '#e0e7ff' },
];

const POPULAR_MAKES_DATA = [
  { id: 'toyota', name: 'تويوتا', slug: 'toyota' },
  { id: 'nissan', name: 'نيسان', slug: 'nissan' },
  { id: 'lexus', name: 'لكزس', slug: 'lexus' },
  { id: 'hyundai', name: 'هيونداي', slug: 'hyundai' },
  { id: 'kia', name: 'كيا', slug: 'kia' },
  { id: 'honda', name: 'هوندا', slug: 'honda' },
  { id: 'ford', name: 'فورد', slug: 'ford' },
  { id: 'chevrolet', name: 'شفروليه', slug: 'chevrolet' },
  { id: 'mercedes', name: 'مرسيدس', slug: 'mercedes' },
  { id: 'bmw', name: 'بي إم دبليو', slug: 'bmw' },
  { id: 'mitsubishi', name: 'ميتسوبيشي', slug: 'mitsubishi' },
  { id: 'isuzu', name: 'إيسوزو', slug: 'isuzu' },
];

export interface PartsVisualFiltersProps {
  onSelectFilter: (
    type: 'category' | 'make',
    valueId: string,
    valueName?: string
  ) => void;
  onViewAll: (tabId: string) => void;
  selectedCategory?: string;
  selectedMake?: string;
}

export function PartsVisualFilters({
  onSelectFilter,
  onViewAll,
  selectedCategory,
  selectedMake,
}: PartsVisualFiltersProps) {
  const [activeTab, setActiveTab] = useState<string>('categories');

  const renderHorizontalGrid = (
    items: any[],
    type: 'categories' | 'makes'
  ) => {
    if (!items || items.length === 0) return null;

    const columns = [];
    for (let i = 0; i < items.length; i += 2) {
      columns.push(items.slice(i, i + 2));
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {columns.map((col, colIdx) => (
          <View key={colIdx} style={styles.column}>
            {col.map((item: any) => {
              let isSelected = false;
              let logoSource: any = null;

              if (type === 'categories') {
                isSelected = selectedCategory?.toUpperCase() === item.id.toUpperCase();
              } else if (type === 'makes') {
                isSelected =
                  selectedMake?.toLowerCase() === item.name.toLowerCase() ||
                  selectedMake?.toLowerCase() === item.id.toLowerCase();
                logoSource = getBrandLogo(item.slug || item.id);
              }

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.itemCard,
                    isSelected && styles.itemCardSelected,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (type === 'categories') {
                      if (isSelected) {
                        onSelectFilter('category', '', undefined);
                      } else {
                        onSelectFilter('category', item.id, item.label);
                      }
                    } else if (type === 'makes') {
                      if (isSelected) {
                        onSelectFilter('make', '', undefined);
                      } else {
                        onSelectFilter('make', item.id, item.name);
                      }
                    }
                  }}
                >
                  {type === 'categories' && (
                    <View
                      style={[
                        styles.iconBox,
                        { backgroundColor: isSelected ? Colors.primary : item.bg },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={16}
                        color={isSelected ? Colors.white : item.color}
                      />
                    </View>
                  )}

                  {type === 'makes' && (
                    <View style={styles.logoBox}>
                      {logoSource ? (
                        <Image source={logoSource} style={styles.brandLogo} resizeMode="contain" />
                      ) : (
                        <Ionicons name="car-outline" size={16} color={Colors.primary} />
                      )}
                    </View>
                  )}

                  <Text
                    style={[
                      styles.itemLabel,
                      isSelected && styles.itemLabelSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {item.label || item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* View All Card */}
        <View style={styles.column}>
          <TouchableOpacity
            style={[styles.itemCard, styles.viewAllCard]}
            onPress={() => onViewAll(activeTab)}
            activeOpacity={0.7}
          >
            <View style={styles.viewAllIconBox}>
              <Ionicons name="apps-outline" size={15} color={Colors.primary} />
            </View>
            <Text style={styles.viewAllText}>عرض الكل</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* ── 2 TABS SEGMENTED SWITCHER ── */}
      <View style={styles.segmentedContainer}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.8}
              style={[styles.segmentTab, isActive && styles.segmentTabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons
                name={tab.icon}
                size={14}
                color={isActive ? Colors.primary : '#64748b'}
                style={styles.tabIcon}
              />
              <Text style={[styles.segmentTabText, isActive && styles.segmentTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── CONTENT AREA ── */}
      <View style={styles.contentArea}>
        {activeTab === 'categories' && renderHorizontalGrid(CATEGORIES_DATA, 'categories')}
        {activeTab === 'makes' && renderHorizontalGrid(POPULAR_MAKES_DATA, 'makes')}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.space2,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  segmentedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 3,
    marginHorizontal: Spacing.space4,
    marginBottom: Spacing.space2,
    gap: 4,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
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
    minHeight: 70,
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
});
