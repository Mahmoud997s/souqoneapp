import React, { useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import {
  VisualFiltersBase,
  VisualFilterTab,
} from '../ui/VisualFiltersBase'

export interface SubFilterItem {
  id: string
  label: string
  icon: keyof typeof Ionicons.glyphMap
}

export interface CategoryTabItem {
  id: string
  label: string
  icon: keyof typeof Ionicons.glyphMap
  items: SubFilterItem[]
}

/**
 * Main category tabs & sub-filters aligned with marketplace entities and status normalization
 */
export const MAIN_CATEGORY_TABS: CategoryTabItem[] = [
  {
    id: 'all',
    label: 'الكل',
    icon: 'grid-outline',
    items: [
      { id: 'all_items', label: 'جميع الإعلانات', icon: 'apps-outline' },
      { id: 'ACTIVE', label: 'نشط', icon: 'checkmark-circle-outline' },
      { id: 'DRAFT', label: 'مسودة', icon: 'document-outline' },
      { id: 'ARCHIVED', label: 'مؤرشف', icon: 'archive-outline' },
      { id: 'EXPIRED', label: 'منتهي', icon: 'time-outline' },
    ],
  },
  {
    id: 'cars',
    label: 'سيارات',
    icon: 'car-sport-outline',
    items: [
      { id: 'all_cars', label: 'كل السيارات', icon: 'car-sport-outline' },
      { id: 'ACTIVE', label: 'نشط', icon: 'checkmark-circle-outline' },
      { id: 'DRAFT', label: 'مسودة', icon: 'document-outline' },
      { id: 'ARCHIVED', label: 'مؤرشف', icon: 'archive-outline' },
      { id: 'EXPIRED', label: 'منتهي', icon: 'time-outline' },
      { id: 'SALE', label: 'للبيع', icon: 'pricetag-outline' },
      { id: 'RENTAL', label: 'تأجير سيارات', icon: 'key-outline' },
      { id: 'WANTED', label: 'مطلوب للشراء', icon: 'search-outline' },
    ],
  },
  {
    id: 'buses',
    label: 'حافلات',
    icon: 'bus-outline',
    items: [
      { id: 'all_buses', label: 'كل الحافلات', icon: 'bus-outline' },
      { id: 'ACTIVE', label: 'نشط', icon: 'checkmark-circle-outline' },
      { id: 'DRAFT', label: 'مسودة', icon: 'document-outline' },
      { id: 'ARCHIVED', label: 'مؤرشف', icon: 'archive-outline' },
      { id: 'EXPIRED', label: 'منتهي', icon: 'time-outline' },
      { id: 'BUS_SALE', label: 'بيع حافلات', icon: 'pricetag-outline' },
      { id: 'BUS_RENT', label: 'تأجير حافلات', icon: 'key-outline' },
      { id: 'BUS_SALE_WITH_CONTRACT', label: 'عقد تشغيل', icon: 'document-text-outline' },
    ],
  },
  {
    id: 'equipment',
    label: 'معدات ثقيلة',
    icon: 'construct-outline',
    items: [
      { id: 'all_equipment', label: 'كل المعدات', icon: 'construct-outline' },
      { id: 'ACTIVE', label: 'نشط', icon: 'checkmark-circle-outline' },
      { id: 'DRAFT', label: 'مسودة', icon: 'document-outline' },
      { id: 'ARCHIVED', label: 'مؤرشف', icon: 'archive-outline' },
      { id: 'EXPIRED', label: 'منتهي', icon: 'time-outline' },
      { id: 'EQUIPMENT_SALE', label: 'بيع معدات', icon: 'pricetag-outline' },
      { id: 'EQUIPMENT_RENT', label: 'تأجير معدات', icon: 'key-outline' },
      { id: 'EQUIPMENT_WANTED', label: 'مطلوب معدات', icon: 'search-outline' },
    ],
  },
  {
    id: 'operators',
    label: 'مشغلو معدات',
    icon: 'person-outline',
    items: [
      { id: 'all_operators', label: 'كل المشغلين', icon: 'person-outline' },
      { id: 'ACTIVE', label: 'نشط', icon: 'checkmark-circle-outline' },
      { id: 'DRAFT', label: 'مسودة', icon: 'document-outline' },
      { id: 'ARCHIVED', label: 'مؤرشف', icon: 'archive-outline' },
      { id: 'EXPIRED', label: 'منتهي', icon: 'time-outline' },
      { id: 'DRIVER', label: 'سائق معدات', icon: 'car-outline' },
      { id: 'OPERATOR', label: 'مشغل فني', icon: 'construct-outline' },
      { id: 'TECHNICIAN', label: 'فني صيانة', icon: 'build-outline' },
    ],
  },
  {
    id: 'parts',
    label: 'قطع غيار',
    icon: 'settings-outline',
    items: [
      { id: 'all_parts', label: 'كل قطع الغيار', icon: 'settings-outline' },
      { id: 'ACTIVE', label: 'نشط', icon: 'checkmark-circle-outline' },
      { id: 'ARCHIVED', label: 'مؤرشف', icon: 'archive-outline' },
      { id: 'EXPIRED', label: 'منتهي', icon: 'time-outline' },
      { id: 'ENGINE', label: 'المحرك وملحقاته', icon: 'hardware-chip-outline' },
      { id: 'BODY', label: 'الهيكل والبودي', icon: 'car-outline' },
      { id: 'ELECTRICAL', label: 'كهرباء وإلكترونيات', icon: 'flash-outline' },
      { id: 'SUSPENSION', label: 'مساعدات وتعليق', icon: 'git-commit-outline' },
      { id: 'BRAKES', label: 'فرامل ومكابح', icon: 'disc-outline' },
      { id: 'TIRES', label: 'إطارات وجنوط', icon: 'ellipse-outline' },
      { id: 'BATTERIES', label: 'بطاريات', icon: 'battery-charging-outline' },
      { id: 'OILS', label: 'زيوت وفلاتر', icon: 'water-outline' },
      { id: 'ACCESSORIES', label: 'إكسسوارات', icon: 'sparkles-outline' },
    ],
  },
  {
    id: 'services',
    label: 'خدمات',
    icon: 'build-outline',
    items: [
      { id: 'all_services', label: 'كل الخدمات', icon: 'build-outline' },
      { id: 'ACTIVE', label: 'نشط', icon: 'checkmark-circle-outline' },
      { id: 'ARCHIVED', label: 'مؤرشف', icon: 'archive-outline' },
      { id: 'EXPIRED', label: 'منتهي', icon: 'time-outline' },
      { id: 'MAINTENANCE', label: 'صيانة وميكانيكا', icon: 'construct-outline' },
      { id: 'CLEANING', label: 'غسيل وتلميع', icon: 'water-outline' },
      { id: 'INSPECTION', label: 'فحص وبرمجة', icon: 'search-outline' },
      { id: 'BODYWORK', label: 'سمكرة ودهان', icon: 'color-palette-outline' },
      { id: 'TOWING', label: 'ونش وسطحة', icon: 'car-outline' },
      { id: 'ACCESSORIES_INSTALL', label: 'تركيب إكسسوارات', icon: 'hardware-chip-outline' },
      { id: 'MODIFICATION', label: 'تعديل وتزويد', icon: 'speedometer-outline' },
    ],
  },
  {
    id: 'jobs',
    label: 'وظائف وسائقين',
    icon: 'briefcase-outline',
    items: [
      { id: 'all_jobs', label: 'كل الوظائف', icon: 'briefcase-outline' },
      { id: 'ACTIVE', label: 'نشط', icon: 'checkmark-circle-outline' },
      { id: 'ARCHIVED', label: 'مؤرشف', icon: 'archive-outline' },
      { id: 'EXPIRED', label: 'منتهي', icon: 'time-outline' },
      { id: 'HIRING', label: 'طلب سائق', icon: 'briefcase-outline' },
      { id: 'OFFERING', label: 'سائق يبحث عن عمل', icon: 'person-outline' },
      { id: 'FULL_TIME', label: 'دوام كامل', icon: 'time-outline' },
      { id: 'PART_TIME', label: 'دوام جزئي', icon: 'hourglass-outline' },
      { id: 'CONTRACT', label: 'عقد تشغيل', icon: 'document-text-outline' },
    ],
  },
]

export interface MyListingsVisualFiltersProps {
  activeCategory: string
  activeSubFilter: string
  onSelectCategory: (id: string) => void
  onSelectSubFilter: (id: string) => void
  isTransparent?: boolean
}

export function MyListingsVisualFilters({
  activeCategory,
  activeSubFilter,
  onSelectCategory,
  onSelectSubFilter,
  isTransparent = false,
}: MyListingsVisualFiltersProps) {
  const tabs: VisualFilterTab[] = useMemo(
    () =>
      MAIN_CATEGORY_TABS.map((cat) => ({
        id: cat.id,
        label: cat.label,
        icon: cat.icon,
        items: cat.items,
        rows: 1,
        hideViewAll: true,
        getItemProps: (item: SubFilterItem) => {
          const isSelected = activeSubFilter === item.id
          const isAllDefault =
            item.id.startsWith('all_') && (activeSubFilter === 'all' || activeSubFilter === item.id)
          const highlighted = isSelected || isAllDefault

          return {
            id: item.id,
            label: item.label,
            isSelected: highlighted,
            icon: (
              <View
                style={[
                  s.glassmorphicIconBox,
                  highlighted && s.glassmorphicIconBoxSelected,
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={11}
                  color={highlighted ? Colors.white : '#475569'}
                />
              </View>
            ),
            onPress: () => {
              if (item.id.startsWith('all_')) {
                onSelectSubFilter('all')
              } else if (activeSubFilter === item.id) {
                onSelectSubFilter('all')
              } else {
                onSelectSubFilter(item.id)
              }
            },
          }
        },
      })),
    [activeSubFilter, onSelectSubFilter]
  )

  return (
    <VisualFiltersBase
      tabs={tabs}
      activeTab={activeCategory}
      onTabChange={onSelectCategory}
      isTransparent={isTransparent}
    />
  )
}

const s = StyleSheet.create({
  glassmorphicIconBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassmorphicIconBoxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
})
