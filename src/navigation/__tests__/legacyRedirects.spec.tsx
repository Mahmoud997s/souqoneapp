import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { AxiosError, AxiosHeaders } from 'axios'

import LegacyListingDetailRedirect from '../../../app/listings/[id]'
import LegacyPostEditRedirect from '../../../app/post/edit/[id]'
import LegacyPostTabRedirect from '../../../app/(tabs)/post'
import { listingsApi } from '../../api/listings'
import { busesApi } from '../../api/buses'
import { equipmentApi } from '../../api/equipment'
import { partsApi } from '../../api/parts'
import { servicesApi } from '../../api/services'
import * as listingRoutes from '../listingRoutes'

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: jest.fn(),
}))

jest.mock('../../components/listing-detail/DetailStates', () => {
  const React = require('react')
  const { View, Text, TouchableOpacity } = require('react-native')
  return {
    DetailStates: ({
      kind,
      onRetry,
      onBack,
    }: {
      kind: string
      onRetry?: () => void
      onBack?: () => void
    }) => (
      <View testID={`detail-state-${kind === 'notFound' ? 'not-found' : kind}`}>
        <Text>{kind}</Text>
        {onRetry ? (
          <TouchableOpacity testID="retry-btn" onPress={onRetry}>
            <Text>retry</Text>
          </TouchableOpacity>
        ) : null}
        {onBack ? (
          <TouchableOpacity testID="back-btn" onPress={onBack}>
            <Text>back</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    ),
  }
})

jest.mock('../../api/listings', () => ({
  listingsApi: { getById: jest.fn() },
}))
jest.mock('../../api/buses', () => ({
  busesApi: { getById: jest.fn() },
}))
jest.mock('../../api/equipment', () => ({
  equipmentApi: { getById: jest.fn(), getOperatorById: jest.fn() },
}))
jest.mock('../../api/parts', () => ({
  partsApi: { getById: jest.fn() },
}))
jest.mock('../../api/services', () => ({
  servicesApi: { getById: jest.fn() },
}))

function makeAxios404() {
  return new AxiosError('Not Found', 'ERR_BAD_REQUEST', undefined, undefined, {
    status: 404,
    statusText: 'Not Found',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: {},
  })
}

function makeAxios500() {
  return new AxiosError('Server Error', 'ERR_BAD_RESPONSE', undefined, undefined, {
    status: 500,
    statusText: 'Internal Server Error',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: {},
  })
}

function makeAxiosOffline() {
  return new AxiosError('Network Error', 'ERR_NETWORK')
}

describe('D-346 legacy redirect screens', () => {
  const mockUseParams = useLocalSearchParams as jest.Mock
  const mockReplace = router.replace as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('app/listings/[id].tsx', () => {
    it.each([
      ['car', '/cars/abc-1'],
      ['bus', '/buses/abc-1'],
      ['equipment', '/equipment/abc-1'],
      ['operator', '/equipment/operators/abc-1'],
      ['parts', '/parts/abc-1'],
      ['services', '/services/abc-1'],
    ])('redirects immediately when type=%s -> %s', async (type, expected) => {
      mockUseParams.mockReturnValue({ id: 'abc-1', type })
      await render(<LegacyListingDetailRedirect />)
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(expected)
      })
      expect(listingsApi.getById).not.toHaveBeenCalled()
      expect(busesApi.getById).not.toHaveBeenCalled()
      expect(equipmentApi.getById).not.toHaveBeenCalled()
      expect(equipmentApi.getOperatorById).not.toHaveBeenCalled()
      expect(partsApi.getById).not.toHaveBeenCalled()
      expect(servicesApi.getById).not.toHaveBeenCalled()
    })

    it('probes APIs on missing type and redirects to matching vertical', async () => {
      mockUseParams.mockReturnValue({ id: 'bus-42' })
      ;(listingsApi.getById as jest.Mock).mockRejectedValueOnce(makeAxios404())
      ;(busesApi.getById as jest.Mock).mockResolvedValueOnce({ id: 'bus-42' })

      await render(<LegacyListingDetailRedirect />)
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/buses/bus-42')
      })
    })

    it('shows notFound when all vertical probes return 404', async () => {
      mockUseParams.mockReturnValue({ id: 'missing-1' })
      ;(listingsApi.getById as jest.Mock).mockRejectedValueOnce(makeAxios404())
      ;(busesApi.getById as jest.Mock).mockRejectedValueOnce(makeAxios404())
      ;(equipmentApi.getById as jest.Mock).mockRejectedValueOnce(makeAxios404())
      ;(equipmentApi.getOperatorById as jest.Mock).mockRejectedValueOnce(makeAxios404())
      ;(partsApi.getById as jest.Mock).mockRejectedValueOnce(makeAxios404())
      ;(servicesApi.getById as jest.Mock).mockRejectedValueOnce(makeAxios404())

      const screen = await render(<LegacyListingDetailRedirect />)
      await waitFor(() => {
        expect(screen.getByTestId('detail-state-not-found')).toBeTruthy()
      })
    })

    it('shows offline state and recovers on retry', async () => {
      mockUseParams.mockReturnValue({ id: 'car-99' })
      ;(listingsApi.getById as jest.Mock)
        .mockRejectedValueOnce(makeAxiosOffline())
        .mockResolvedValueOnce({ id: 'car-99' })

      const screen = await render(<LegacyListingDetailRedirect />)
      await waitFor(() => {
        expect(screen.getByTestId('detail-state-offline')).toBeTruthy()
      })

      await act(async () => {
        fireEvent.press(screen.getByTestId('retry-btn'))
      })
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/cars/car-99')
      })
    })
  })

  describe('app/post/edit/[id].tsx', () => {
    it.each([
      ['bus', '/buses/edit/e-1'],
      ['equipment', '/equipment/edit/e-1'],
      ['operator', '/equipment/operators/edit/e-1'],
    ])('redirects directly for type=%s -> %s with ZERO api calls', async (type, expected) => {
      mockUseParams.mockReturnValue({ id: 'e-1', type })
      await render(<LegacyPostEditRedirect />)
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(expected)
      })
      expect(listingsApi.getById).not.toHaveBeenCalled()
      expect(busesApi.getById).not.toHaveBeenCalled()
      expect(equipmentApi.getById).not.toHaveBeenCalled()
      expect(equipmentApi.getOperatorById).not.toHaveBeenCalled()
      expect(partsApi.getById).not.toHaveBeenCalled()
      expect(servicesApi.getById).not.toHaveBeenCalled()
    })

    it.each(['jobs', 'transport'])(
      'redirects parked type=%s -> /(tabs) with ZERO api calls',
      async (type) => {
        mockUseParams.mockReturnValue({ id: 'parked-1', type })
        await render(<LegacyPostEditRedirect />)
        await waitFor(() => {
          expect(mockReplace).toHaveBeenCalledWith('/(tabs)')
        })
        expect(listingsApi.getById).not.toHaveBeenCalled()
        expect(busesApi.getById).not.toHaveBeenCalled()
        expect(equipmentApi.getById).not.toHaveBeenCalled()
        expect(equipmentApi.getOperatorById).not.toHaveBeenCalled()
        expect(partsApi.getById).not.toHaveBeenCalled()
        expect(servicesApi.getById).not.toHaveBeenCalled()
      }
    )

    it('shows notFound when /post/edit/:id receives 404', async () => {
      mockUseParams.mockReturnValue({ id: 'missing-edit', type: 'parts' })
      ;(partsApi.getById as jest.Mock).mockRejectedValueOnce(makeAxios404())

      const screen = await render(<LegacyPostEditRedirect />)
      await waitFor(() => {
        expect(screen.getByTestId('detail-state-not-found')).toBeTruthy()
      })
      expect(mockReplace).not.toHaveBeenCalled()
    })

    it('shows serverError when /post/edit/:id receives 500', async () => {
      mockUseParams.mockReturnValue({ id: 'srv-500', type: 'services' })
      ;(servicesApi.getById as jest.Mock).mockRejectedValueOnce(makeAxios500())

      const screen = await render(<LegacyPostEditRedirect />)
      await waitFor(() => {
        expect(screen.getByTestId('detail-state-serverError')).toBeTruthy()
      })
      expect(mockReplace).not.toHaveBeenCalled()
    })

    it('shows offline state on /post/edit/:id and recovers on retry', async () => {
      mockUseParams.mockReturnValue({ id: 'part-retry', type: 'parts' })
      ;(partsApi.getById as jest.Mock)
        .mockRejectedValueOnce(makeAxiosOffline())
        .mockResolvedValueOnce({ id: 'part-retry', title: 'Clutch', price: 45 })

      const screen = await render(<LegacyPostEditRedirect />)
      await waitFor(() => {
        expect(screen.getByTestId('detail-state-offline')).toBeTruthy()
      })

      await act(async () => {
        fireEvent.press(screen.getByTestId('retry-btn'))
      })
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/parts/new')
      })
    })

    it('stale-request guard: ignores late resolution after unmount or id change', async () => {
      let resolveFirst!: (val: unknown) => void
      const firstPromise = new Promise((res) => {
        resolveFirst = res
      })
      mockUseParams.mockReturnValue({ id: 'part-old', type: 'parts' })
      ;(partsApi.getById as jest.Mock).mockReturnValueOnce(firstPromise)

      const screen = await render(<LegacyPostEditRedirect />)
      await screen.unmount()

      await act(async () => {
        resolveFirst({ id: 'part-old', title: 'Old Part', price: 10 })
      })
      expect(mockReplace).not.toHaveBeenCalled()

      // Id change mid-flight supersedes the stale request
      let resolveSecondOld!: (val: unknown) => void
      mockUseParams.mockReturnValue({ id: 'part-a', type: 'parts' })
      ;(partsApi.getById as jest.Mock).mockReturnValueOnce(
        new Promise((res) => {
          resolveSecondOld = res
        })
      )
      const screen2 = await render(<LegacyPostEditRedirect />)

      mockUseParams.mockReturnValue({ id: 'part-b', type: 'parts' })
      ;(partsApi.getById as jest.Mock).mockResolvedValueOnce({
        id: 'part-b',
        title: 'Part B',
        price: 20,
      })
      await screen2.rerender(<LegacyPostEditRedirect />)

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/parts/new')
      })
      expect(mockReplace).toHaveBeenCalledTimes(1)

      await act(async () => {
        resolveSecondOld({ id: 'part-a', title: 'Part A', price: 15 })
      })
      expect(mockReplace).toHaveBeenCalledTimes(1)
    })

    it('fetches and hydrates car edit state before redirecting', async () => {
      const startEditSpy = jest.spyOn(listingRoutes, 'startEdit')
      mockUseParams.mockReturnValue({ id: 'car-7', type: 'car' })
      const payload = { id: 'car-7', title: 'Camry', price: 5500 }
      ;(listingsApi.getById as jest.Mock).mockResolvedValueOnce(payload)

      await render(<LegacyPostEditRedirect />)
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/cars/new')
      })
      expect(startEditSpy).toHaveBeenCalledWith('LISTING', payload)
      startEditSpy.mockRestore()
    })

    it('fetches and hydrates part edit state before redirecting', async () => {
      const startEditSpy = jest.spyOn(listingRoutes, 'startEdit')
      mockUseParams.mockReturnValue({ id: 'part-7', type: 'parts' })
      const payload = { id: 'part-7', title: 'Brake Pad', price: 25 }
      ;(partsApi.getById as jest.Mock).mockResolvedValueOnce(payload)

      await render(<LegacyPostEditRedirect />)
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/parts/new')
      })
      expect(startEditSpy).toHaveBeenCalledWith('SPARE_PART', payload)
      startEditSpy.mockRestore()
    })

    it('fetches and hydrates service edit state before redirecting', async () => {
      const startEditSpy = jest.spyOn(listingRoutes, 'startEdit')
      mockUseParams.mockReturnValue({ id: 'svc-7', type: 'services' })
      const payload = { id: 'svc-7', title: 'Towing', price: 30 }
      ;(servicesApi.getById as jest.Mock).mockResolvedValueOnce(payload)

      await render(<LegacyPostEditRedirect />)
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/services/new')
      })
      expect(startEditSpy).toHaveBeenCalledWith('CAR_SERVICE', payload)
      startEditSpy.mockRestore()
    })
  })

  describe('app/(tabs)/post.tsx', () => {
    it('redirects immediately to /(modals)/post-category', async () => {
      const screen = await render(<LegacyPostTabRedirect />)
      expect(screen.getByTestId('legacy-post-tab-redirect')).toBeTruthy()
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/(modals)/post-category')
      })
    })
  })
})
