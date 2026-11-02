import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { DetailStaleBanner } from './DetailStaleBanner'
import { TopBarTokens } from '../../constants/topBarTokens'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

describe('DetailStaleBanner', () => {
  it('does not render when visible is false', async () => {
    await render(<DetailStaleBanner visible={false} onRetry={jest.fn()} />)
    expect(screen.queryByTestId('detail-stale-banner-wrapper')).toBeNull()
    expect(screen.queryByTestId('stale-data-banner')).toBeNull()
  })

  it('renders positioned absolutely directly below overlaid top bar with default insets', async () => {
    await render(<DetailStaleBanner visible onRetry={jest.fn()} />)

    const wrapper = screen.getByTestId('detail-stale-banner-wrapper')
    const flat = StyleSheet.flatten(wrapper.props.style)

    expect(flat.position).toBe('absolute')
    expect(flat.left).toBe(0)
    expect(flat.right).toBe(0)
    expect(flat.top).toBe(44 + TopBarTokens.detailTopBarBodyHeight)
    expect(flat.zIndex).toBe(49)

    expect(screen.getByTestId('stale-data-banner')).toBeTruthy()
  })

  it('accepts custom top override when provided', async () => {
    await render(<DetailStaleBanner visible top={120} onRetry={jest.fn()} />)

    const wrapper = screen.getByTestId('detail-stale-banner-wrapper')
    const flat = StyleSheet.flatten(wrapper.props.style)

    expect(flat.top).toBe(120)
  })

  it('forwards retry callback and refetching state to StaleDataBanner', async () => {
    const handleRetry = jest.fn()
    const { rerender } = await render(
      <DetailStaleBanner visible onRetry={handleRetry} isRefetching={false} />
    )

    fireEvent.press(screen.getByTestId('stale-data-retry-button'))
    expect(handleRetry).toHaveBeenCalledTimes(1)

    await rerender(
      <DetailStaleBanner visible onRetry={handleRetry} isRefetching={true} />
    )
    expect(screen.queryByText('إعادة المحاولة')).toBeNull()
  })
})
