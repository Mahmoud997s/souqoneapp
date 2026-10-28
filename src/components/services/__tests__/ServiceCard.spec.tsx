import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { Text, View, StyleSheet, Dimensions } from 'react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ServiceCard } from '../ServiceCard'
import type { UnifiedCardItem } from '../../../types/unified-card.types'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const sampleServiceItem: UnifiedCardItem = {
  id: 'service-1',
  category: 'service',
  title: 'ورشة صيانة وبرمجة سيارات',
  price: 25,
  currency: 'OMR',
  governorate: 'مسقط',
  images: ['https://example.com/srv.jpg'],
  raw: {
    providerName: 'كراج النجوم',
    providerType: 'WORKSHOP',
    serviceType: 'MAINTENANCE',
    isHomeService: false,
  },
}

describe('ServiceCard - actionMenu & fullWidth parity', () => {
  it('renders actionMenu in the card when provided', async () => {
    const mockActionMenu = (
      <View testID="mock-service-action-menu">
        <Text>Menu</Text>
      </View>
    )

    await render(
      <QueryClientProvider client={queryClient}>
        <ServiceCard
          item={sampleServiceItem}
          onPress={jest.fn()}
          actionMenu={mockActionMenu}
        />
      </QueryClientProvider>
    )

    expect(screen.getByTestId('mock-service-action-menu')).toBeTruthy()
  })

  it('does not render actionMenu when omitted', async () => {
    await render(
      <QueryClientProvider client={queryClient}>
        <ServiceCard
          item={sampleServiceItem}
          onPress={jest.fn()}
        />
      </QueryClientProvider>
    )

    expect(screen.queryByTestId('mock-service-action-menu')).toBeNull()
  })

  it('honors fullWidth prop by expanding card width to 100% (defaults to 60%)', async () => {
    // 1. fullWidth={true}
    const { toJSON, rerender } = await render(
      <QueryClientProvider client={queryClient}>
        <ServiceCard
          item={sampleServiceItem}
          onPress={jest.fn()}
          fullWidth={true}
        />
      </QueryClientProvider>
    )

    const jsonFull: any = toJSON()
    const flatStyleFull = StyleSheet.flatten(jsonFull.props.style)
    expect(flatStyleFull?.width).toBe('100%')

    // 2. fullWidth={false}
    await rerender(
      <QueryClientProvider client={queryClient}>
        <ServiceCard
          item={sampleServiceItem}
          onPress={jest.fn()}
          fullWidth={false}
        />
      </QueryClientProvider>
    )

    const jsonFixed: any = toJSON()
    const flatStyleFixed = StyleSheet.flatten(jsonFixed.props.style)
    expect(flatStyleFixed?.width).toBe(Dimensions.get('window').width * 0.6)
  })
})
