import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import { CarDetailScreen } from '../../src/screens/cars/CarDetailScreen'

/**
 * Route: /cars/[id]
 * Dedicated test route for the real-data car detail screen.
 */
export default function CarDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <CarDetailScreen id={id ?? ''} />
}
