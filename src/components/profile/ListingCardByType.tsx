import React from 'react'
import { CarCard } from '../cars/CarCard'
import { BusCard } from '../buses/BusCard'
import { EquipCard } from '../cards/EquipCard'
import { PartCard } from '../parts/PartCard'
import { ServiceCard } from '../services/ServiceCard'
import { Listing } from '../../types/listing.types'
import { UnifiedCardItem } from '../../types/unified-card.types'

export type ProfileListingVertical = 'car' | 'bus' | 'equipment' | 'part' | 'service'

export interface ListingCardByTypeProps {
  vertical: ProfileListingVertical
  item: UnifiedCardItem
  onPress: () => void
  fullWidth?: boolean
}

function toListingCardItem(item: UnifiedCardItem): Listing {
  return item as unknown as Listing
}

export function ListingCardByType({ vertical, item, onPress, fullWidth = true }: ListingCardByTypeProps) {
  switch (vertical) {
    case 'car':
      return <CarCard item={toListingCardItem(item)} onPress={onPress} fullWidth={fullWidth} showChips />
    case 'bus':
      return <BusCard item={toListingCardItem(item)} onPress={onPress} fullWidth={fullWidth} showChips />
    case 'equipment':
      return <EquipCard item={toListingCardItem(item)} onPress={onPress} fullWidth={fullWidth} showChips />
    case 'part':
      return <PartCard item={item} onPress={onPress} fullWidth={fullWidth} showChips />
    case 'service':
      return <ServiceCard item={item} onPress={onPress} fullWidth={fullWidth} />
  }
}
