import React from 'react'
import { router } from 'expo-router'
import { CarDetailSandboxScreen } from '../../src/dev/car-detail-sandbox/CarDetailSandboxScreen'

/**
 * Dev-only route for Car Detail visual sandbox.
 * Accessible directly at /dev/car-detail-sandbox.
 * If not in __DEV__, immediately redirects to /(tabs) and returns null (before any render).
 */
export default function DevCarDetailSandboxRoute() {
  const isDev = typeof (global as any).__DEV__ !== 'undefined'
    ? (global as any).__DEV__
    : (typeof __DEV__ !== 'undefined' ? __DEV__ : false)

  if (!isDev) {
    router.replace('/(tabs)')
    return null
  }

  return <CarDetailSandboxScreen />
}
