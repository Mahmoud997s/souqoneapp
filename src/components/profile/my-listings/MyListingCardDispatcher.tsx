import React from 'react'
import { View, StyleSheet, Text } from 'react-native'
import { Colors } from '../../../constants/colors'
import { MyListingItem } from '../../../types/my-listings.types'
import { MyListingActionButtons } from './MyListingActionButtons'
import { CarCard } from '../../cars/CarCard'
import { BusCard } from '../../buses/BusCard'
import { EquipCard } from '../../cards/EquipCard'
import { OperatorCard } from '../../cards/OperatorCard'
import { PartCard } from '../../parts/PartCard'
import { ServiceCard } from '../../services/ServiceCard'

export interface MyListingCardDispatcherProps {
  item: MyListingItem
  onView: (item: MyListingItem) => void
  onEdit: (item: MyListingItem) => void
  onDelete: (item: MyListingItem) => void
  onStatusChange?: (item: MyListingItem) => void
  onCancelDeletionRequest?: (item: MyListingItem) => void
  isEditSupported: boolean
  fullWidth?: boolean
}

export function MyListingCardDispatcher({
  item,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onCancelDeletionRequest,
  isEditSupported,
  fullWidth = false,
}: MyListingCardDispatcherProps) {
  const menu = (
    <MyListingActionButtons
      item={item}
      onDelete={onDelete}
      onEdit={onEdit}
      onStatusChange={onStatusChange}
      onCancelDeletionRequest={onCancelDeletionRequest}
      isEditSupported={isEditSupported}
    />
  )

  const renderPendingBanner = () => {
    if (item.pendingDeletionRequest && item.pendingDeletionRequest.status === 'PENDING') {
      return (
        <View style={s.pendingBanner}>
          <Text style={s.pendingBannerText}>طلب حذف قيد المراجعة</Text>
        </View>
      )
    }
    return null
  }

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
        <ServiceCard
          item={item.mapped as any}
          onPress={() => onView(item)}
          fullWidth={fullWidth}
          actionMenu={menu}
        />
      )
    case 'operator': {
      const banner = renderPendingBanner()
      if (banner) {
        return (
          <View style={[s.pendingBannerWrap, !fullWidth && s.operatorFixed]}>
            <OperatorCard
              item={item.mapped as any}
              onPress={() => onView(item)}
              maxChips={3}
              actionMenu={menu}
              fullWidth={fullWidth}
            />
            {banner}
          </View>
        )
      }
      return (
        <OperatorCard
          item={item.mapped as any}
          onPress={() => onView(item)}
          maxChips={3}
          actionMenu={menu}
          fullWidth={fullWidth}
        />
      )
    }
    case 'job':
      return null
    default:
      return null
  }
}

const s = StyleSheet.create({
  pendingBannerWrap: {
    position: 'relative',
    width: '100%',
  },
  operatorFixed: {
    alignSelf: 'flex-start',
  },
  pendingBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.error,
    paddingVertical: 6,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  pendingBannerText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: Colors.white,
  },
})
