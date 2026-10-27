import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import { PartDetailScreen } from '../../src/screens/parts/PartDetailScreen'

/**
 * Route: /parts/[id]
 * Real-data spare part detail screen route connecting to PartDetailScreen.
 */
export default function PartDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <PartDetailScreen id={id ?? ''} />
}
