import React from 'react'
import { CarDetailSandboxScreen } from '../../src/dev/car-detail-sandbox/CarDetailSandboxScreen'

/**
 * Dev-only route for Car Detail visual sandbox.
 * Accessible directly at /dev/car-detail-sandbox.
 */
export default function DevCarDetailSandboxRoute() {
  return <CarDetailSandboxScreen />
}
