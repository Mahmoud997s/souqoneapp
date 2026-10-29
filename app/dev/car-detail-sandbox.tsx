import React from 'react'
import { Redirect } from 'expo-router'
import { CarDetailSandboxScreen } from '../../src/dev/car-detail-sandbox/CarDetailSandboxScreen'

/**
 * Dev-only route for Car Detail visual sandbox.
 * Accessible directly at /dev/car-detail-sandbox.
 * In production/release builds (!__DEV__), immediately redirects to /(tabs) via declarative <Redirect />.
 */
export default function DevCarDetailSandboxRoute() {
  const isDev = typeof (global as any).__DEV__ !== 'undefined'
    ? (global as any).__DEV__
    : (typeof __DEV__ !== 'undefined' ? __DEV__ : false)

  if (!isDev) {
    return <Redirect href="/(tabs)" />
  }

  return <CarDetailSandboxScreen />
}
