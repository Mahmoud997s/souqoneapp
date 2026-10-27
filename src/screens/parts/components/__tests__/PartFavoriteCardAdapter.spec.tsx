import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { PartFavoriteCardAdapter } from '../PartFavoriteCardAdapter'
import type { UnifiedCardItem } from '../../../../components/cards/UnifiedCard'

const mockCall = jest.fn()
const mockWhatsApp = jest.fn()
const mockChat = jest.fn()

jest.mock('../../../../features/favorites/useFavoriteToggle', () => ({
  useFavoriteToggle: () => ({
    isFavorite: false,
    toggle: jest.fn(),
  }),
}))

jest.mock('../../../../hooks/listing-detail/useListingContact', () => ({
  useListingContact: () => ({
    call: mockCall,
    whatsApp: mockWhatsApp,
    chat: mockChat,
    busy: false,
  }),
}))

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}))

describe('PartFavoriteCardAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const samplePartItem: UnifiedCardItem = {
    id: 'fav-part-1',
    title: 'مساعدات هايلوكس أمامية أصلية',
    price: 35,
    currency: 'OMR',
    category: 'parts',
    condition: 'NEW',
    governorate: 'مسقط',
    images: ['https://images.souqone.app/parts/1.jpg'],
    whatsappEnabled: true,
    isPremium: true,
  }

  it('renders part favorite card with title, price, badges, and contact actions', async () => {
    await render(<PartFavoriteCardAdapter item={samplePartItem} />)

    expect(screen.getByText('مساعدات هايلوكس أمامية أصلية')).toBeTruthy()
    expect(screen.getByText('35 ر.ع.')).toBeTruthy()
    expect(screen.getByText('مسقط')).toBeTruthy()
    expect(screen.getByText('مميز')).toBeTruthy()
    expect(screen.getByText('جديد')).toBeTruthy()

    // Action buttons rendered
    expect(screen.getByTestId('part-favorite-call-btn')).toBeTruthy()
    expect(screen.getByTestId('part-favorite-whatsapp-btn')).toBeTruthy()
    expect(screen.getByTestId('part-favorite-chat-btn')).toBeTruthy()
  })

  it('invokes contact actions when user taps call, whatsapp, or chat', async () => {
    await render(<PartFavoriteCardAdapter item={samplePartItem} />)

    const callBtn = screen.getByTestId('part-favorite-call-btn')
    const whatsappBtn = screen.getByTestId('part-favorite-whatsapp-btn')
    const chatBtn = screen.getByTestId('part-favorite-chat-btn')

    await fireEvent.press(callBtn)
    expect(mockCall).toHaveBeenCalledTimes(1)

    await fireEvent.press(whatsappBtn)
    expect(mockWhatsApp).toHaveBeenCalledTimes(1)

    await fireEvent.press(chatBtn)
    expect(mockChat).toHaveBeenCalledTimes(1)
  })

  it('renders for services category with contact actions and price text', async () => {
    const sampleServiceItem: UnifiedCardItem = {
      id: 'fav-service-1',
      title: 'صيانة مكيفات وكمبروسر سيارات',
      priceText: 'تبدأ من 15 ر.ع',
      category: 'services',
      governorate: 'صحار',
      images: ['https://images.souqone.app/services/1.jpg'],
      whatsappEnabled: false,
    }

    await render(<PartFavoriteCardAdapter item={sampleServiceItem} />)

    expect(screen.getByText('صيانة مكيفات وكمبروسر سيارات')).toBeTruthy()
    expect(screen.getByText('تبدأ من 15 ر.ع')).toBeTruthy()
    expect(screen.getByText('صحار')).toBeTruthy()

    // WhatsApp is disabled
    expect(screen.queryByTestId('part-favorite-whatsapp-btn')).toBeNull()
    // Call and chat are present
    expect(screen.getByTestId('part-favorite-call-btn')).toBeTruthy()
    expect(screen.getByTestId('part-favorite-chat-btn')).toBeTruthy()
  })
})
