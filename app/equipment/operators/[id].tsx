import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import { OperatorDetailScreen } from '../../../src/screens/operators/OperatorDetailScreen'

/**
 * Route: /equipment/operators/[id]
 * Real-data operator detail screen route delegating directly to OperatorDetailScreen.
 */
export default function OperatorDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <OperatorDetailScreen id={id ?? ''} />
}
