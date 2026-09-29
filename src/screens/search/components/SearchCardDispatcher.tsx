import React from 'react'
import { router } from 'expo-router'
import { CarCard } from '../../../components/cars/CarCard'
import { BusCard } from '../../../components/buses/BusCard'
import { EquipCard } from '../../../components/cards/EquipCard'
import { PartCard } from '../../../components/parts/PartCard'
import { ServiceCard } from '../../../components/services/ServiceCard'
import { JobCard } from '../../../components/cards/JobCard'
import { getListingDetailRoute } from '../../../utils/navigationHelper'

interface SearchCardDispatcherProps {
  item: any
}

export const SearchCardDispatcher = React.memo(function SearchCardDispatcher({
  item,
}: SearchCardDispatcherProps) {
  if (!item) return null

  const handlePress = () => {
    const route = getListingDetailRoute(item)
    router.push(route as any)
  }

  const rawEntity = String(
    item.entityType ||
    item.type ||
    item.category ||
    item.raw?.entityType ||
    item.raw?.category ||
    ''
  ).toLowerCase()

  switch (rawEntity) {
    case 'bus':
    case 'buses':
      return (
        <BusCard
          item={item}
          onPress={handlePress}
          fullWidth
          showChips
          maxChips={3}
        />
      )

    case 'equipment':
      return (
        <EquipCard
          item={item}
          onPress={handlePress}
          fullWidth
          showChips
          maxChips={3}
        />
      )

    case 'part':
    case 'parts':
      return (
        <PartCard
          item={item}
          onPress={handlePress}
          fullWidth
          showChips
          maxChips={3}
        />
      )

    case 'service':
    case 'services':
      return (
        <ServiceCard
          item={item}
          onPress={handlePress}
          fullWidth
        />
      )

    case 'job':
    case 'jobs':
      return (
        <JobCard
          job={item}
          onPress={handlePress}
          fullWidth
        />
      )

    case 'car':
    case 'cars':
    case 'listing':
    case 'listings':
    default:
      return (
        <CarCard
          item={item}
          onPress={handlePress}
          fullWidth
          showChips
          maxChips={3}
        />
      )
  }
})
