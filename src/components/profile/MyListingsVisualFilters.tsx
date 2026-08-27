import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

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
  const currentCategory = MAIN_CATEGORY_TABS.find((c) => c.id === activeCategory) || MAIN_CATEGORY_TABS[0]
  const subItems = currentCategory.items || []

  const handleCategoryPress = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    onSelectCategory(id)
  }

  const content = (
    <>
      {/* ── TABS (Segmented Bar) ── */}
      <View style={s.segmentedWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.segmentedContainer}
        >
          {MAIN_CATEGORY_TABS.map((tab) => {
            const isActive = activeCategory === tab.id
            return (
              <TouchableOpacity
                key={tab.id}
                activeOpacity={0.8}
                style={[s.segmentTab, isActive && s.segmentTabActive]}
                onPress={() => handleCategoryPress(tab.id)}
              >
                <Ionicons
                  name={tab.icon}
                  size={14}
                  color={isActive ? Colors.primary : '#475569'}
                  style={s.tabIcon}
                />
                <Text style={[s.segmentTabText, isActive && s.segmentTabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* ── 1-Row Subcategories Grid with Glassmorphic Profile Style Icon Boxes ── */}
      <View style={s.contentArea}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.scrollContainer}
        >
          {subItems.map((item) => {
            const isSelected = activeSubFilter === item.id
            const isAllDefault =
              item.id.startsWith('all_') && (activeSubFilter === 'all' || activeSubFilter === item.id)

            const highlighted = isSelected || isAllDefault

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                style={[s.itemCard, highlighted && s.itemCardSelected]}
                onPress={() => {
                  if (item.id.startsWith('all_')) {
                    onSelectSubFilter('all')
                  } else if (activeSubFilter === item.id) {
                    onSelectSubFilter('all')
                  } else {
                    onSelectSubFilter(item.id)
                  }
                }}
              >
                {/* Glassmorphic Icon Box matching Profile Icons */}
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
                <Text
                  style={[s.itemLabel, highlighted && s.itemLabelSelected]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>
    </>
  )

  return <View style={s.container}>{content}</View>
}

const s = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: Spacing.space1,
    overflow: 'hidden',
  },
  filterWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    opacity: 0.08,
  },
  filterTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primary,
    opacity: 0.04,
  },
  segmentedWrapper: {
    marginHorizontal: Spacing.space5,
    marginBottom: 6,
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
    marginTop: 1,
  },
  segmentTabText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 15.5,
    color: '#64748b',
  },
  segmentTabTextActive: {
    color: Colors.primary,
  },
  contentArea: {
    paddingBottom: 4,
  },
  scrollContainer: {
    paddingHorizontal: Spacing.space5,
    gap: 8,
  },
  column: {
    gap: 6,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 75,
    gap: 5,
  },
  itemCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  // Profile style glassmorphic icon box
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
  itemLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: '#334155',
    textAlign: 'left',
    writingDirection: 'rtl',
    flexShrink: 1,
  },
  itemLabelSelected: {
    color: Colors.primary,
    fontFamily: 'Almarai_800ExtraBold',
  },
})
