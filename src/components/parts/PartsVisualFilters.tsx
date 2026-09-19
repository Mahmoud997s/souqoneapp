import React, { useMemo } from 'react';
import { View, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getBrandLogo } from '../../constants/brandLogos';
import { Colors } from '../../constants/colors';
import {
  VisualFiltersBase,
  VisualFilterTab,
  visualFiltersStyles,
} from '../ui/VisualFiltersBase';

// ─── STATIC DATA ───
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
  const tabs: VisualFilterTab<'categories' | 'makes'>[] = useMemo(
    () => [
      {
        id: 'categories',
        label: 'الأقسام الرئيسية',
        icon: 'grid-outline',
        items: CATEGORIES_DATA,
        getItemProps: (item) => {
          const isSelected = selectedCategory?.toUpperCase() === item.id.toUpperCase();
          return {
            id: item.id,
            label: item.label,
            isSelected,
            icon: (
              <View
                style={[
                  visualFiltersStyles.iconBox,
                  { backgroundColor: isSelected ? Colors.primary : item.bg },
                ]}
              >
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={16}
                  color={isSelected ? Colors.white : item.color}
                />
              </View>
            ),
            onPress: () => {
              if (isSelected) {
                onSelectFilter('category', '', undefined);
              } else {
                onSelectFilter('category', item.id, item.label);
              }
            },
          };
        },
      },
      {
        id: 'makes',
        label: 'الماركات المتوافقة',
        icon: 'car-sport-outline',
        items: POPULAR_MAKES_DATA,
        getItemProps: (item) => {
          const isSelected =
            selectedMake?.toLowerCase() === item.name.toLowerCase() ||
            selectedMake?.toLowerCase() === item.id.toLowerCase();
          const logoSource = getBrandLogo(item.slug || item.id);
          return {
            id: item.id,
            label: item.name,
            isSelected,
            icon: (
              <View style={visualFiltersStyles.logoBox}>
                {logoSource ? (
                  <Image source={logoSource} style={visualFiltersStyles.brandLogo} resizeMode="contain" />
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
              }
            },
          };
        },
      },
    ],
    [selectedCategory, selectedMake, onSelectFilter]
  );

  return (
    <VisualFiltersBase
      tabs={tabs}
      defaultTab="categories"
      onViewAll={onViewAll}
    />
  );
}
