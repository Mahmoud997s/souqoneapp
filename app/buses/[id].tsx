import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import { BusDetailScreen } from '../../src/screens/buses/BusDetailScreen'

/**
 * Route: /buses/[id]
 * Real-data bus detail screen route connecting to BusDetailScreen.
 */
export default function BusDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <BusDetailScreen id={id ?? ''} />
}
