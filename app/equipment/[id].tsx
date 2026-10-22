import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import { EquipmentDetailScreen } from '../../src/screens/equipment/EquipmentDetailScreen'

/**
 * Route: /equipment/[id]
 * Real-data equipment detail screen route connecting to EquipmentDetailScreen.
 */
export default function EquipmentDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <EquipmentDetailScreen id={id ?? ''} />
}
