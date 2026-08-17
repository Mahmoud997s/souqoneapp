import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { MyListingItem, MyListingEntityType } from '../../../types/my-listings.types'
import { ListingSectionConfig } from './sections.config'
import { MyListingCardDispatcher } from './MyListingCardDispatcher'

export interface MyListingSectionSliderProps {
  config: ListingSectionConfig
  items: MyListingItem[]
  onSelectCategory: (categoryId: string) => void
  onView: (item: MyListingItem) => void
  onEdit: (item: MyListingItem) => void
  onDelete: (item: MyListingItem) => void
  isEditSupported: (entityType: MyListingEntityType) => boolean
}

export function MyListingSectionSlider({
  config,
  items,
  onSelectCategory,
  onView,
  onEdit,
  onDelete,
  isEditSupported,
}: MyListingSectionSliderProps) {
  if (!items || items.length === 0) return null

  return (
    <View style={s.section}>
      {/* ── Section Header ── */}
      <View style={s.sectionHeader}>
        <View style={s.titleRow}>
          <LinearGradient
            colors={config.gradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.iconWrap}
          >
            <Ionicons name={config.icon} size={15} color={Colors.white} />
          </LinearGradient>
          <Text style={s.sectionTitle}>{config.title}</Text>
          
          {/* Count Badge */}
          <View style={s.countBadge}>
            <Text style={s.countText}>{items.length}</Text>
          </View>
        </View>

        {/* See All Button -> Switches to this category tab */}
        <TouchableOpacity
          style={s.seeAllBtn}
          onPress={() => onSelectCategory(config.categoryId)}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={s.seeAllText}>عرض الكل</Text>
          <Ionicons name="arrow-back-outline" size={13} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Horizontal List ── */}
      <FlatList
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => `${item.entityType}-${item.id}`}
        contentContainerStyle={s.sliderContent}
        renderItem={({ item }) => (
          <MyListingCardDispatcher
            item={item}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            isEditSupported={isEditSupported(item.entityType)}
            fullWidth={false}
          />
        )}
      />
    </View>
  )
}

const s = StyleSheet.create({
  section: {
    marginBottom: Spacing.space6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space5,
    marginBottom: Spacing.space3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 16,
    lineHeight: 22,
    color: '#1E293B',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  countBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  countText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 14,
    color: '#64748b',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: Colors.primary + '0A',
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.primary + '1A',
  },
  seeAllText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.primary,
    textAlign: 'center',
    writingDirection: 'rtl',
    paddingTop: 1,
  },
  sliderContent: {
    paddingHorizontal: Spacing.space5,
    paddingVertical: 4,
    gap: Spacing.space3,
    alignItems: 'flex-start',
  },
})
