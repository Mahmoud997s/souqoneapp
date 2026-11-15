import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { MyListingItem, MyListingEntityType } from '../../../types/my-listings.types'
import { ListingSectionConfig } from './sections.config'
import { MyListingOwnerCard } from './MyListingOwnerCard'
import { type OwnerCardBusyAction } from './OwnerCardActions'
import {
  getHomeStandardCardWidth,
  getHomeStandardImageHeight,
} from '../../../constants/cardSystem'
import { HorizontalScrollCard } from '../../ui/HorizontalScrollCard'
import { SkeletonCard } from '../../ui/SkeletonCard'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_WIDTH = getHomeStandardCardWidth(SCREEN_WIDTH)
const SKELETON_CARD_HEIGHT = getHomeStandardImageHeight() + 110
const GAP = Spacing.space3
const PADDING_END = Spacing.space4

export interface MyListingSectionSliderProps {
  config: ListingSectionConfig
  items: MyListingItem[]
  isLoading?: boolean
  onSelectCategory: (categoryId: string) => void
  onView: (item: MyListingItem) => void
  onEdit: (item: MyListingItem) => void
  onDelete: (item: MyListingItem) => void
  onStatusChange?: (item: MyListingItem) => void
  onCancelDeletionRequest?: (item: MyListingItem) => void
  getBusyAction?: (item: MyListingItem) => OwnerCardBusyAction
  isEditSupported: (entityType: MyListingEntityType) => boolean
}

export function MyListingSectionSlider({
  config,
  items,
  isLoading = false,
  onSelectCategory,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onCancelDeletionRequest,
  getBusyAction,
  isEditSupported,
}: MyListingSectionSliderProps) {
  if (!isLoading && (!items || items.length === 0)) return null

  return (
    <View style={s.section} testID="my-listing-section-slider">
      {/* ── Section Header ── */}
      <View style={s.sectionHeader} testID="my-listing-section-header">
        <View style={s.titleRow}>
          <View style={s.iconWrap} testID="my-listing-section-icon-box">
            <MaterialCommunityIcons name={config.icon} size={16} color={Colors.primary} />
          </View>
          <Text style={s.sectionTitle}>{config.title}</Text>
          
          {/* Count Badge */}
          <View style={s.countBadge}>
            <Text style={s.countText}>{items?.length || 0}</Text>
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
      {isLoading ? (
        <HorizontalScrollCard
          key="loading-skeleton"
          data={[1, 2, 3]}
          trackPendingIndex
          cardWidth={CARD_WIDTH}
          gap={GAP}
          paddingEnd={PADDING_END}
          keyExtractor={(item) => String(item)}
          renderItem={() => (
            <SkeletonCard style={{ width: CARD_WIDTH, height: SKELETON_CARD_HEIGHT }} />
          )}
        />
      ) : (
        <HorizontalScrollCard
          key="loaded-cards"
          data={items}
          trackPendingIndex
          cardWidth={CARD_WIDTH}
          gap={GAP}
          paddingEnd={PADDING_END}
          keyExtractor={(item) => `${item.entityType}-${item.id}`}
          onSeeAll={() => onSelectCategory(config.categoryId)}
          seeAllTitle="عرض الكل"
          seeAllSubtitle={`جميع إعلانات ${config.title}`}
          renderItem={({ item }) => (
            <MyListingOwnerCard
              item={item}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              onCancelDeletionRequest={onCancelDeletionRequest}
              busyAction={getBusyAction ? getBusyAction(item) : null}
              isEditSupported={isEditSupported(item.entityType)}
              fullWidth={false}
            />
          )}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  section: {
    marginBottom: Spacing.space5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space4,
    marginBottom: Spacing.space3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.paleMint,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 16,
    lineHeight: 22,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  countBadge: {
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  countText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 14,
    color: Colors.textMuted,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 12,
    backgroundColor: Colors.paleMint,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
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
})
