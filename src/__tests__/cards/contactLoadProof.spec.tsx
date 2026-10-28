import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react-native'
import { View, ScrollView } from 'react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OperatorCard } from '../../components/cards/OperatorCard'
import { contactApi } from '../../api/contact'
import { OperatorListing } from '../../types/equipment.types'
import { mapOperatorToCard } from '../../utils/mappers'

jest.mock('../../api/contact', () => ({
  contactApi: {
    getContact: jest.fn(),
  },
}))

jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
  },
}))

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn().mockResolvedValue(true),
  canOpenURL: jest.fn().mockResolvedValue(true),
}))

jest.mock('../../store/authStore', () => ({
  useAuthStore: jest.fn(() => ({
    isLoggedIn: true,
    user: { id: 'u1' },
  })),
}))

import { useAuthStore } from '../../store/authStore'

describe('Load Proof (Spec 5): 40 OperatorCards (On-Demand Contact)', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    jest.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    })
    ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
      isLoggedIn: true,
      user: { id: 'u1' },
    })
    ;(contactApi.getContact as jest.Mock).mockResolvedValue({
      data: {
        phone: '+96891234567',
        whatsapp: '+96891234567',
        whatsappEnabled: true,
      },
    })
  })

  it('mounts 40 cards with 0 calls to contactApi.getContact, and calls contactApi.getContact exactly once upon pressing Call on 1 card', async () => {
    // Generate 40 OperatorCard items
    const operators: any[] = Array.from({ length: 40 }, (_, i) => ({
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
      whatsappEnabled: i % 2 === 0, // 20 enabled, 20 disabled
      rating: 4.8,
      reviewsCount: 12,
      createdAt: new Date().toISOString(),
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

    // 4. Press call button on another card (index 20)
    await act(async () => {
      fireEvent.press(allCallButtons[20])
    })

    // 5. VERIFY: contactApi.getContact was called second time (total 2)
    expect(contactApi.getContact).toHaveBeenCalledTimes(2)
    expect(contactApi.getContact).toHaveBeenLastCalledWith('OPERATOR_LISTING', 'op-21')
  })
})
