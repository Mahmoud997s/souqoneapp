import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { StyleSheet, Text, View } from 'react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OperatorCard } from './OperatorCard'
import { useAuthStore } from '../../store/authStore'

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

jest.setTimeout(15000)

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

describe('OperatorCard', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    jest.clearAllMocks()
    queryClient = createQueryClient()
    useAuthStore.setState({
      isLoggedIn: true,
      user: { id: 'usr-1', phone: '+96891234567' } as any,
    })
  })

  const baseItem = {
    id: 'op-101',
    title: 'أحمد الحارثي',
    operatorType: 'OPERATOR',
    experienceYears: 6,
    equipmentTypes: ['EXCAVATOR', 'BULLDOZER', 'CRANE', 'LOADER'],
    certifications: ['CERT_1'],
    dailyRate: 40,
    hourlyRate: 6,
    currency: 'OMR',
    governorate: 'مسقط',
    isVerified: true,
    whatsappEnabled: true,
    avatar: 'https://example.com/avatar.jpg',
  }

  describe('Public Mode', () => {
    it('always fills container width with width: 100% on the card root', async () => {
      const { getByTestId } = await render(
        <QueryClientProvider client={queryClient}>
          <OperatorCard item={baseItem} />
        </QueryClientProvider>
      )

      const card = getByTestId('operator-card')
      const flatStyle = StyleSheet.flatten(card.props.style)
      expect(flatStyle.width).toBe('100%')
    })

    it('teeth check 1: triggers onPress callback when the card is pressed', async () => {
      const onPressMock = jest.fn()
      const { getByTestId } = await render(
        <QueryClientProvider client={queryClient}>
          <OperatorCard item={baseItem} onPress={onPressMock} />
        </QueryClientProvider>
      )

      const card = getByTestId('operator-card')
      fireEvent.press(card)
      expect(onPressMock).toHaveBeenCalledTimes(1)
    })

    it('limits chips to maxChips and displays extra count badge', async () => {
      const { getByText } = await render(
        <QueryClientProvider client={queryClient}>
          <OperatorCard item={baseItem} maxChips={3} />
        </QueryClientProvider>
      )

      expect(getByText('مشغل معدات')).toBeTruthy()
      expect(getByText('6 سنوات خبرة')).toBeTruthy()
      expect(getByText('حفار')).toBeTruthy()
      expect(getByText('شهادة معتمدة')).toBeTruthy()
      expect(getByText('+3')).toBeTruthy()
    })

    it('teeth check 2: falls back to "السعر عند التواصل" when price is 0 or missing, and never shows "0 ر.ع."', async () => {
      const zeroRateItem = {
        ...baseItem,
        dailyRate: 0,
        hourlyRate: 0,
        price: 0,
        priceText: null,
      }

      const { getByText, queryByText } = await render(
        <QueryClientProvider client={queryClient}>
          <OperatorCard item={zeroRateItem} />
        </QueryClientProvider>
      )

      expect(getByText('السعر عند التواصل')).toBeTruthy()
      expect(queryByText(/0\s*ر\.ع\./)).toBeNull()
    })

    it('displays formatted daily rate when dailyRate is positive', async () => {
      const { getByText } = await render(
        <QueryClientProvider client={queryClient}>
          <OperatorCard item={baseItem} />
        </QueryClientProvider>
      )

      expect(getByText('40 ر.ع. / يوم')).toBeTruthy()
    })

    it('renders verified badge with accessibility label when isVerified is true', async () => {
      const { getByTestId } = await render(
        <QueryClientProvider client={queryClient}>
          <OperatorCard item={baseItem} />
        </QueryClientProvider>
      )

      const badge = getByTestId('operator-verified-badge')
      expect(badge).toBeTruthy()
      expect(badge.props.accessible).toBe(true)
      expect(badge.props.accessibilityLabel).toBe('حساب موثق')
    })

    it('renders fallback icon without crashing when avatar is missing', async () => {
      const noAvatarItem = {
        ...baseItem,
        avatar: null,
        user: { avatarUrl: null },
      }

      const { getByTestId, queryByTestId } = await render(
        <QueryClientProvider client={queryClient}>
          <OperatorCard item={noAvatarItem} />
        </QueryClientProvider>
      )

      expect(getByTestId('operator-avatar-fallback')).toBeTruthy()
      expect(queryByTestId('operator-avatar')).toBeNull()
    })

    it('renders call and whatsapp buttons with proper accessibility labels in public mode', async () => {
      const { getByLabelText } = await render(
        <QueryClientProvider client={queryClient}>
          <OperatorCard item={baseItem} />
        </QueryClientProvider>
      )

      const callBtn = getByLabelText('اتصال بالمشغل')
      expect(callBtn).toBeTruthy()

      const waBtn = getByLabelText('تواصل عبر واتساب')
      expect(waBtn).toBeTruthy()
    })
  })

  describe('Owner Mode', () => {
    it('teeth check 3: renders actionMenu slot when provided and suppresses public contact actions', async () => {
      const actionMenuNode = (
        <View testID="owner-action-menu-slot">
          <Text>قائمة الإجراءات</Text>
        </View>
      )

      const { getByTestId, getByText, queryByLabelText } = await render(
        <QueryClientProvider client={queryClient}>
          <OperatorCard item={baseItem} actionMenu={actionMenuNode} />
        </QueryClientProvider>
      )

      expect(getByTestId('owner-action-menu-slot')).toBeTruthy()
      expect(getByText('قائمة الإجراءات')).toBeTruthy()

      // In owner mode, public call & whatsapp buttons must NOT be rendered
      expect(queryByLabelText('اتصال بالمشغل')).toBeNull()
      expect(queryByLabelText('تواصل عبر واتساب')).toBeNull()
    })

    it('does not render any fake availability status dot in owner mode', async () => {
      const { queryByTestId } = await render(
        <QueryClientProvider client={queryClient}>
          <OperatorCard item={baseItem} actionMenu={<View />} />
        </QueryClientProvider>
      )

      expect(queryByTestId('operator-status-dot')).toBeNull()
    })
  })
})
