import React from 'react'
import { router } from 'expo-router'
import { CarCard } from '../../../components/cars/CarCard'
import { BusCard } from '../../../components/buses/BusCard'
import { EquipCard } from '../../../components/cards/EquipCard'
import { PartCard } from '../../../components/parts/PartCard'
import { ServiceCard } from '../../../components/services/ServiceCard'
import { JobCard } from '../../../components/cards/JobCard'
import { OperatorCard } from '../../../components/cards/OperatorCard'
import { getListingDetailRoute } from '../../../utils/navigationHelper'

interface SearchCardDispatcherProps {
  item: any
}

export const SearchCardDispatcher = React.memo(function SearchCardDispatcher({
  item,
}: SearchCardDispatcherProps) {
  if (!item) return null

  // Normalize item images and properties from Meilisearch flat document
  const normalizedItem = React.useMemo(() => {
    const copy = { ...item }
    const singleUrl = copy.imageUrl || copy.image || copy.raw?.imageUrl || copy.raw?.image
    if ((!copy.images || copy.images.length === 0) && singleUrl) {
      copy.images = [{ url: singleUrl }]
    }
    if (copy.raw) {
      copy.raw = { ...copy.raw }
      if ((!copy.raw.images || copy.raw.images.length === 0) && singleUrl) {
        copy.raw.images = [{ url: singleUrl }]
      }
    }
    return copy
  }, [item])

  const handlePress = () => {
    const route = getListingDetailRoute(normalizedItem)
    router.push(route as any)
  }

  const rawEntity = String(
    normalizedItem._entityType ||
    normalizedItem.entityType ||
    normalizedItem.type ||
    normalizedItem.category ||
    normalizedItem.raw?._entityType ||
    normalizedItem.raw?.entityType ||
    normalizedItem.raw?.category ||
    ''
  ).toLowerCase()

  switch (rawEntity) {
    case 'bus':
    case 'buses':
      return (
        <BusCard
          item={normalizedItem}
          onPress={handlePress}
          fullWidth
          showChips
          maxChips={3}
        />
      )

    case 'equipment':
      return (
        <EquipCard
          item={normalizedItem}
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
          item={normalizedItem}
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
          item={normalizedItem}
          onPress={handlePress}
          fullWidth
        />
      )

    case 'job':
    case 'jobs':
      return (
        <JobCard
          job={normalizedItem}
          onPress={handlePress}
          fullWidth
        />
      )

    case 'operator':
    case 'operators':
      return (
        <OperatorCard
          item={normalizedItem}
          onPress={handlePress}
        />
      )

    case 'car':
    case 'cars':
    case 'listing':
    case 'listings':
    default:
      return (
        <CarCard
          item={normalizedItem}
          onPress={handlePress}
          fullWidth
          showChips
          maxChips={3}
        />
      )
  }
})
