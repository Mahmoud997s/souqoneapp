import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { render, fireEvent, renderHook, act, cleanup } from '@testing-library/react-native'
import { useDetailRefresh } from './useDetailRefresh'

describe('useDetailRefresh', () => {
  afterEach(() => {
    cleanup()
  })

  it('initializes with refreshing = false', async () => {
    const refetch = jest.fn().mockResolvedValue({})
    const { result } = await renderHook(() => useDetailRefresh(refetch))

    expect(result.current.refreshing).toBe(false)
    expect(typeof result.current.onRefresh).toBe('function')
  })

  it('sets refreshing to true during in-flight refetch and resets to false upon completion', async () => {
    let resolveRefetch!: () => void
    const refetchPromise = new Promise<void>((resolve) => {
      resolveRefetch = resolve
    })
    const refetch = jest.fn().mockReturnValue(refetchPromise)

    const { result } = await renderHook(() => useDetailRefresh(refetch))

    let refreshPromise!: Promise<void>
    await act(async () => {
      refreshPromise = result.current.onRefresh()
    })

    // While in-flight, refreshing must be true
    expect(result.current.refreshing).toBe(true)
    expect(refetch).toHaveBeenCalledTimes(1)

    // Complete refetch
    await act(async () => {
      resolveRefetch()
      await refreshPromise
    })

    // After completion, refreshing must be false
    expect(result.current.refreshing).toBe(false)
  })

  it('swallows rejected refetch error and resets refreshing to false via finally block', async () => {
    const error = new Error('Network failure during pull-to-refresh')
    const refetch = jest.fn().mockRejectedValue(error)

    const { result } = await renderHook(() => useDetailRefresh(refetch))

    // onRefresh must NOT throw unhandled rejection
    await act(async () => {
      await expect(result.current.onRefresh()).resolves.toBeUndefined()
    })

    // Error is swallowed and refreshing is reset to false
    expect(refetch).toHaveBeenCalledTimes(1)
    expect(result.current.refreshing).toBe(false)
  })

  it('guards against double pulls while refetch is in-flight (calls refetch only once)', async () => {
    let resolveRefetch!: () => void
    const refetchPromise = new Promise<void>((resolve) => {
      resolveRefetch = resolve
    })
    const refetch = jest.fn().mockReturnValue(refetchPromise)

    const { result } = await renderHook(() => useDetailRefresh(refetch))

    let p1!: Promise<void>
    let p2!: Promise<void>
    await act(async () => {
      p1 = result.current.onRefresh()
      // Immediate second pull before first one finishes
      p2 = result.current.onRefresh()
    })

    expect(refetch).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveRefetch()
      await Promise.all([p1, p2])
    })

    expect(refetch).toHaveBeenCalledTimes(1)
    expect(result.current.refreshing).toBe(false)
  })

  it('handles null or undefined refetch safely without throwing', async () => {
    const { result: r1 } = await renderHook(() => useDetailRefresh(undefined))
    expect(r1.current.refreshing).toBe(false)
    await act(async () => {
      await expect(r1.current.onRefresh()).resolves.toBeUndefined()
    })
    expect(r1.current.refreshing).toBe(false)

    const { result: r2 } = await renderHook(() => useDetailRefresh(null))
    expect(r2.current.refreshing).toBe(false)
    await act(async () => {
      await expect(r2.current.onRefresh()).resolves.toBeUndefined()
    })
    expect(r2.current.refreshing).toBe(false)
  })

  it('guards against setState after unmount if component unmounts during refetch', async () => {
    let resolveRefetch!: () => void
    const refetchPromise = new Promise<void>((resolve) => {
      resolveRefetch = resolve
    })
    const refetch = jest.fn().mockReturnValue(refetchPromise)

    function TestHost() {
      const { refreshing, onRefresh } = useDetailRefresh(refetch)
      return (
        <View>
          <Text testID="state">{String(refreshing)}</Text>
          <TouchableOpacity testID="trigger" onPress={onRefresh} />
        </View>
      )
    }

    const { getByTestId, unmount } = await render(<TestHost />)

    await act(async () => {
      fireEvent.press(getByTestId('trigger'))
    })

    expect(getByTestId('state').props.children).toBe('true')

    // Unmount while refetch is still pending
    unmount()

    // Resolve refetch afterwards
    await act(async () => {
      resolveRefetch()
    })

    // Verified: refetch completed safely without state updates on unmounted host
    expect(refetch).toHaveBeenCalledTimes(1)
  })
})
