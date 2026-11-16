import React from 'react'
import { MyListingItem, MyListingEntityType } from '../../../types/my-listings.types'
import { OwnerCardActions, OwnerCardBusyAction } from './OwnerCardActions'
import { getMyListingStatusBadgeForItem } from './myListingStatusBadge'
import { CarCard } from '../../cars/CarCard'
import { BusCard } from '../../buses/BusCard'
import { EquipCard } from '../../cards/EquipCard'
import { PartCard } from '../../parts/PartCard'
import { ServiceCard } from '../../services/ServiceCard'
import { OperatorCard } from '../../cards/OperatorCard'
import { type GlassSupport } from '../../navigation/glassSupport'

const STATUS_CHANGE_ENTITIES: readonly MyListingEntityType[] = ['car', 'bus', 'equipment']

export interface MyListingOwnerCardProps {
  item: MyListingItem
  onView: (item: MyListingItem) => void
  onEdit: (item: MyListingItem) => void
  onDelete: (item: MyListingItem) => void
  onStatusChange?: (item: MyListingItem) => void
  onCancelDeletionRequest?: (item: MyListingItem) => void
  isEditSupported: boolean
  busyAction?: OwnerCardBusyAction
  fullWidth?: boolean
  imageHeight?: number
  compactBody?: boolean
  glassSupport?: GlassSupport
}

export function MyListingOwnerCard({
  item,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onCancelDeletionRequest,
  isEditSupported,
  busyAction = null,
  fullWidth = false,
  imageHeight,
  compactBody = false,
  glassSupport,
}: MyListingOwnerCardProps) {
  const canChangeStatus = STATUS_CHANGE_ENTITIES.includes(item.entityType)
  const statusBadge = getMyListingStatusBadgeForItem(item)

  const ownerActions = (
    <OwnerCardActions
      isEditSupported={isEditSupported}
      canChangeStatus={canChangeStatus}
      statusBadge={statusBadge}
      pendingDeletionRequest={item.pendingDeletionRequest}
      busyAction={busyAction}
      onEdit={() => onEdit(item)}
      onDelete={() => onDelete(item)}
      onStatusChange={onStatusChange ? () => onStatusChange(item) : undefined}
      onCancelDeletionRequest={
        onCancelDeletionRequest ? () => onCancelDeletionRequest(item) : undefined
      }
    />
  )

  switch (item.entityType) {
    case 'car':
      return (
        <CarCard
          item={item.mapped as any}
          onPress={() => onView(item)}
          fullWidth={fullWidth}
          imageHeight={imageHeight}
          compactBody={compactBody}
          showChips
          maxChips={3}
          ownerActions={ownerActions}
          disableImageSwipe
          glassSupport={glassSupport}
        />
      )
    case 'bus':
      return (
        <BusCard
          item={item.mapped as any}
          onPress={() => onView(item)}
          fullWidth={fullWidth}
          imageHeight={imageHeight}
          compactBody={compactBody}
          showChips
          maxChips={3}
          ownerActions={ownerActions}
          disableImageSwipe
          glassSupport={glassSupport}
        />
      )
    case 'equipment':
      return (
        <EquipCard
          item={item.mapped as any}
          onPress={() => onView(item)}
          fullWidth={fullWidth}
          imageHeight={imageHeight}
          compactBody={compactBody}
          showChips
          maxChips={3}
          ownerActions={ownerActions}
          disableImageSwipe
          glassSupport={glassSupport}
        />
      )
    case 'part':
      return (
        <PartCard
          item={item.raw as any}
          onPress={() => onView(item)}
          fullWidth={fullWidth}
          imageHeight={imageHeight}
          compactBody={compactBody}
          showChips
          maxChips={3}
          ownerActions={ownerActions}
          disableImageSwipe
          glassSupport={glassSupport}
        />
      )
    case 'service':
      return (
        <ServiceCard
          item={item.mapped as any}
          onPress={() => onView(item)}
          fullWidth={fullWidth}
          imageHeight={imageHeight}
          compactBody={compactBody}
          ownerActions={ownerActions}
          disableImageSwipe
          glassSupport={glassSupport}
        />
      )
    case 'operator':
      return (
        <OperatorCard
          item={item.mapped as any}
          onPress={() => onView(item)}
          fullWidth={fullWidth}
          ownerActions={ownerActions}
        />
      )
    case 'job':
    default:
      return null
  }
}
