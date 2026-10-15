import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react-native'
import { View, ScrollView } from 'react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OperatorCard } from '../../components/cards/OperatorCard'
import { UnifiedCard, UnifiedCardItem } from '../../components/cards/UnifiedCard'
import { contactApi } from '../../api/contact'
import { OperatorListing } from '../../types/equipment.types'
import { mapOperatorToCard } from '../../utils/mappers'

jest.mock('../../api/contact', () => ({
  contactApi: {
    getContact: jest.fn(),
  },
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  router: { push: jest.fn() },
}))

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn().mockResolvedValue(true),
  canOpenURL: jest.fn().mockResolvedValue(true),
}))

import { useAuthStore } from '../../store/authStore'

describe('Load Proof (Spec 5): 20 OperatorCards + 20 UnifiedCards', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    jest.clearAllMocks()
    useAuthStore.setState({
      isLoggedIn: true,
      user: { id: 'usr-1', phone: '+96891234567' } as any,
    })
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    ;(contactApi.getContact as jest.Mock).mockResolvedValue({
      phone: '+96891234567',
      whatsapp: '+96891234567',
    })
  })

  it('mounts 40 cards with 0 calls to contactApi.getContact, and calls contactApi.getContact exactly once upon pressing Call on 1 card', async () => {
    // Generate 20 OperatorCard items
    const operators: any[] = Array.from({ length: 20 }, (_, i) => ({
      id: `op-${i + 1}`,
      title: `مشغل معدات ${i + 1}`,
      operatorType: 'OPERATOR',
      experienceYears: 5,
      equipmentTypes: ['EXCAVATOR'],
      specializations: ['DIGGING'],
      certifications: [],
      dailyRate: 35,
      hourlyRate: 5,
      currency: 'OMR',
      isPriceNegotiable: true,
      governorateId: 1,
      wilayaId: 1,
      governorateName: 'مسقط',
      wilayaName: 'السيب',
      whatsappEnabled: i % 2 === 0, // 10 enabled, 10 disabled
      rating: 4.8,
      reviewsCount: 12,
      createdAt: new Date().toISOString(),
    }))

    // Generate 20 UnifiedCard items across different categories
    const categories: Array<UnifiedCardItem['category']> = [
      'cars',
      'buses',
      'equipment',
      'operators',
      'parts',
      'services',
      'jobs',
      'transport',
    ]

    const unifiedItems: UnifiedCardItem[] = Array.from({ length: 20 }, (_, i) => ({
      id: `unified-${i + 1}`,
      title: `إعلان موحد ${i + 1}`,
      category: categories[i % categories.length],
      images: [],
      price: (i + 1) * 100,
      currency: 'OMR',
      whatsappEnabled: i % 2 === 0,
      location: 'مسقط، السيب',
      timeAgo: 'منذ ساعتين',
    }))

    const operatorCardItems = operators.map(op => mapOperatorToCard(op))

    // Render list containing all 40 cards simultaneously
    await render(
      <QueryClientProvider client={queryClient}>
        <ScrollView>
          <View testID="operators-container">
            {operatorCardItems.map((opItem) => (
              <OperatorCard key={opItem.id} item={opItem} onPress={jest.fn()} />
            ))}
          </View>
          <View testID="unified-container">
            {unifiedItems.map((item) => (
              <UnifiedCard key={item.id} item={item} />
            ))}
          </View>
        </ScrollView>
      </QueryClientProvider>
    )

    // 1. VERIFY: Zero calls at render/mount
    expect(contactApi.getContact).not.toHaveBeenCalled()
    expect(contactApi.getContact).toHaveBeenCalledTimes(0)

    // Verify all 40 cards rendered Call buttons
    const allCallButtons = screen.getAllByText('اتصال')
    expect(allCallButtons.length).toBe(40)

    // 2. Press call button on EXACTLY 1 card
    await act(async () => {
      fireEvent.press(allCallButtons[0])
    })

    // 3. VERIFY: contactApi.getContact was called EXACTLY ONCE
    expect(contactApi.getContact).toHaveBeenCalledTimes(1)
    expect(contactApi.getContact).toHaveBeenCalledWith('OPERATOR_LISTING', 'op-1')

    // 4. Press call button on a UnifiedCard (index 20)
    await act(async () => {
      fireEvent.press(allCallButtons[20])
    })

    // 5. VERIFY: contactApi.getContact was called second time (total 2)
    expect(contactApi.getContact).toHaveBeenCalledTimes(2)
  })
})
