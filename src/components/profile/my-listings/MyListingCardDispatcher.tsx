import React from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import { MyListingItem } from '../../../types/my-listings.types'
import { MyListingActionButtons } from './MyListingActionButtons'
import { CarCard } from '../../cars/CarCard'
import { BusCard } from '../../buses/BusCard'
import { EquipCard } from '../../cards/EquipCard'
import { ModernOperatorCard } from '../../cards/ModernOperatorCard'
import { PartCard } from '../../parts/PartCard'
import { ServiceCard } from '../../services/ServiceCard'
import { JobCard } from '../../cards/JobCard'

const CARD_SCALE_WIDTH = Dimensions.get('window').width * 0.6

export interface MyListingCardDispatcherProps {
  item: MyListingItem
  onView: (item: MyListingItem) => void
  onEdit: (item: MyListingItem) => void
  onDelete: (item: MyListingItem) => void
  onStatusChange?: (item: MyListingItem) => void
  isEditSupported: boolean
  fullWidth?: boolean
}

export function MyListingCardDispatcher({
  item,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  isEditSupported,
  fullWidth = false,
}: MyListingCardDispatcherProps) {
  const menu = (
    <MyListingActionButtons
      item={item}
      onDelete={onDelete}
      onEdit={onEdit}
      onStatusChange={onStatusChange}
      isEditSupported={isEditSupported}
    />
  )

  switch (item.entityType) {
    case 'car':
      return (
        <CarCard
          item={item.mapped as any}
          onPress={() => onView(item)}
          fullWidth={fullWidth}
          showChips
          maxChips={3}
          actionMenu={menu}
        />
      )
    case 'bus':
      return (
        <BusCard
          item={item.mapped as any}
          onPress={() => onView(item)}
          fullWidth={fullWidth}
          showChips
          maxChips={3}
          actionMenu={menu}
        />
      )
    case 'equipment':
      return (
        <EquipCard
          item={item.mapped as any}
          onPress={() => onView(item)}
          fullWidth={fullWidth}
          showChips
          maxChips={3}
          actionMenu={menu}
        />
      )
    case 'part':
      return (
        <PartCard
          item={item.raw as any}
          onPress={() => onView(item)}
          fullWidth={fullWidth}
          showChips
          maxChips={3}
          actionMenu={menu}
        />
      )
    case 'service':
      return (
        <View style={[s.overlayContainer, !fullWidth && { width: CARD_SCALE_WIDTH, alignSelf: 'flex-start' }]}>
          <ServiceCard
            item={item.mapped as any}
            onPress={() => onView(item)}
            fullWidth={true}
          />
          <View style={s.cardTopActionOverlay}>
            {menu}
          </View>
        </View>
      )
    case 'operator':
      return (
        <ModernOperatorCard
          item={item.mapped as any}
          onPress={() => onView(item)}
          fullWidth={fullWidth}
          maxChips={3}
          actionMenu={menu}
        />
      )
    case 'job':
      return (
        <JobCard
          job={item.raw as any}
          onPress={() => onView(item)}
          fullWidth={fullWidth}
          maxChips={3}
          actionMenu={menu}
        />
      )
    default:
      return null
  }
}

const s = StyleSheet.create({
  overlayContainer: {
    position: 'relative',
    width: '100%',
  },
  cardTopActionOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
  },
})
