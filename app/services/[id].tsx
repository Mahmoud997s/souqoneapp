import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import { ServiceDetailScreen } from '../../src/screens/services'

export default function ServiceRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <ServiceDetailScreen id={typeof id === 'string' ? id : ''} />
}
