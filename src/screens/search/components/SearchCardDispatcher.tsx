import React from 'react'
import { View, useWindowDimensions } from 'react-native'
import { router } from 'expo-router'
import { CarCard } from '../../../components/cars/CarCard'
import { BusCard } from '../../../components/buses/BusCard'
import { EquipCard } from '../../../components/cards/EquipCard'
import { PartCard } from '../../../components/parts/PartCard'
import { ServiceCard } from '../../../components/services/ServiceCard'
import { OperatorCard } from '../../../components/cards/OperatorCard'
import { type GlassSupport } from '../../../components/navigation/glassSupport'
import { getListingDetailRoute } from '../../../utils/navigationHelper'

export const SEARCH_OPERATOR_WIDTH_RATIO = 0.65

interface SearchCardDispatcherProps {
  item: any
  glassSupport?: GlassSupport
}

export const SearchCardDispatcher = React.memo(function SearchCardDispatcher({
  item,
  glassSupport,
}: SearchCardDispatcherProps) {
  const { width: windowWidth } = useWindowDimensions()

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
          glassSupport={glassSupport}
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
          glassSupport={glassSupport}
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
          glassSupport={glassSupport}
        />
      )

    case 'service':
    case 'services':
      return (
        <ServiceCard
          item={normalizedItem}
          onPress={handlePress}
          fullWidth
          glassSupport={glassSupport}
        />
      )

    case 'job':
    case 'jobs':
      return null

    case 'operator':
    case 'operators': {
      const operatorCardWidth = Math.round(windowWidth * SEARCH_OPERATOR_WIDTH_RATIO)
      return (
        <View
          style={{ width: operatorCardWidth }}
          testID="search-operator-card-wrapper"
        >
          <OperatorCard
            item={normalizedItem}
            onPress={handlePress}
          />
        </View>
      )
    }

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
          glassSupport={glassSupport}
        />
      )
  }
})
