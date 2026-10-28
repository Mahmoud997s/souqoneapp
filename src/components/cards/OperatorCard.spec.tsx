import React from 'react'
import * as fs from 'fs'
import * as path from 'path'
import { render, fireEvent, act } from '@testing-library/react-native'
import {
  Dimensions,
  EmitterSubscription,
  ScaledSize,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from 'react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OperatorCard } from './OperatorCard'
import { OperatorHorizontalList } from '../equipment/landing/OperatorHorizontalList'
import { SearchCardDispatcher } from '../../screens/search/components/SearchCardDispatcher'
import { Colors } from '../../constants/colors'
import { lineHeightFor } from '../../constants/typography'
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

interface RenderedJsonNode {
  type?: string
  props?: {
    style?: StyleProp<TextStyle>
    [key: string]: unknown
  }
  children?: unknown[]
}

function collectTextNodes(node: unknown, out: RenderedJsonNode[] = []): RenderedJsonNode[] {
  if (!node || typeof node !== 'object') return out
  if (Array.isArray(node)) {
    for (const child of node) collectTextNodes(child, out)
    return out
  }
  const typedNode = node as RenderedJsonNode
  if (typedNode.type === 'Text') {
    out.push(typedNode)
  }
  if (Array.isArray(typedNode.children)) {
    for (const child of typedNode.children) collectTextNodes(child, out)
  }
  return out
}

describe('OperatorCard', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    jest.clearAllMocks()
    queryClient = createQueryClient()
    useAuthStore.setState({
      isLoggedIn: true,
      user: { id: 'usr-1', phone: '+96891234567' } as never,
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

    it('teeth check Part A: no Text inside the rendered OperatorCard has textAlign === "right"', async () => {
      const { toJSON } = await render(
        <QueryClientProvider client={queryClient}>
          <OperatorCard item={baseItem} />
        </QueryClientProvider>
      )

      const textNodes = collectTextNodes(toJSON())
      expect(textNodes.length).toBeGreaterThan(0)
      for (const node of textNodes) {
        const flatStyle = StyleSheet.flatten(node.props?.style) || {}
        expect(flatStyle.textAlign).not.toBe('right')
      }
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
      const { getByText, queryByText } = await render(
        <QueryClientProvider client={queryClient}>
          <OperatorCard item={baseItem} maxChips={3} />
        </QueryClientProvider>
      )

      expect(getByText('مشغل معدات')).toBeTruthy()
      expect(getByText('6 سنوات خبرة')).toBeTruthy()
      expect(getByText('شهادة معتمدة')).toBeTruthy()
      expect(getByText('+4')).toBeTruthy()
      expect(queryByText('حفار')).toBeNull()
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

  describe('Width Truth Table (Part B)', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('teeth check Part B1: landing swiper item wrapper width is 65% of mocked window width', async () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({
        width: 400,
        height: 800,
        scale: 2,
        fontScale: 1,
      })

      const { getByTestId } = await render(
        <QueryClientProvider client={queryClient}>
          <OperatorHorizontalList
            title="مشغلو المعدات"
            data={[baseItem]}
            isLoading={false}
            emptyText="لا يوجد مشغلون"
            onSeeAll={jest.fn()}
            onPressItem={jest.fn()}
          />
        </QueryClientProvider>
      )

      const itemWrapper = getByTestId('operator-swiper-item-wrapper')
      const flatWrapper = StyleSheet.flatten(itemWrapper.props.style)
      expect(flatWrapper.width).toBe(Math.round(400 * 0.65))
    })

    it('teeth check Part B2: search operator card wrapper width is 65% and follows a changed mocked window width', async () => {
      type ChangeHandler = (dims: { window: ScaledSize; screen: ScaledSize }) => void
      let changeListener: ChangeHandler | null = null
      const dimsSpy = jest.spyOn(Dimensions, 'get').mockReturnValue({
        width: 400,
        height: 800,
        scale: 2,
        fontScale: 1,
      })
      jest.spyOn(Dimensions, 'addEventListener').mockImplementation((type: string, handler: ChangeHandler) => {
        if (type === 'change') changeListener = handler
        return { remove: jest.fn() } as unknown as EmitterSubscription
      })

      const searchItem = {
        ...baseItem,
        _entityType: 'operator',
      }

      const { getByTestId } = await render(
        <QueryClientProvider client={queryClient}>
          <SearchCardDispatcher item={searchItem} />
        </QueryClientProvider>
      )

      const wrapper1 = getByTestId('search-operator-card-wrapper')
      expect(StyleSheet.flatten(wrapper1.props.style).width).toBe(Math.round(400 * 0.65))

      const nextWindow: ScaledSize = {
        width: 600,
        height: 400,
        scale: 2,
        fontScale: 1,
      }
      dimsSpy.mockReturnValue(nextWindow)
      await act(async () => {
        changeListener?.({ window: nextWindow, screen: nextWindow })
      })

      const wrapper2 = getByTestId('search-operator-card-wrapper')
      expect(StyleSheet.flatten(wrapper2.props.style).width).toBe(Math.round(600 * 0.65))
    })

    it('browse page renders OperatorCard directly in renderItem with no width wrapper so the card fills 100% of the list row', async () => {
      const browsePath = path.resolve(__dirname, '../../../app/equipment/operators/browse.tsx')
      const browseSource = fs.readFileSync(browsePath, 'utf8')
      expect(browseSource).toMatch(
        /renderItem=\{\(\{\s*item\s*\}\)\s*=>\s*\(\s*<OperatorCard[\s\S]*?\/>\s*\)\}/
      )

      const { getByTestId } = await render(
        <QueryClientProvider client={queryClient}>
          <OperatorCard item={baseItem} />
        </QueryClientProvider>
      )
      const card = getByTestId('operator-card')
      expect(StyleSheet.flatten(card.props.style).width).toBe('100%')
    })
  })

  describe('Impeccable Polish (Part C)', () => {
    it('enforces 11pt minimum font size floor and Arabic line heights on all styled Text nodes', async () => {
      const { toJSON } = await render(
        <QueryClientProvider client={queryClient}>
          <OperatorCard item={baseItem} />
        </QueryClientProvider>
      )

      const textNodes = collectTextNodes(toJSON())
      expect(textNodes.length).toBeGreaterThan(0)
      let almaraiNodesCount = 0
      for (const node of textNodes) {
        const flatStyle = StyleSheet.flatten(node.props?.style) || {}
        if (typeof flatStyle.fontSize === 'number') {
          expect(flatStyle.fontSize).toBeGreaterThanOrEqual(11)
        }
        if (
          typeof flatStyle.fontFamily === 'string' &&
          flatStyle.fontFamily.startsWith('Almarai') &&
          typeof flatStyle.fontSize === 'number'
        ) {
          almaraiNodesCount += 1
          expect(flatStyle.lineHeight).toBeGreaterThanOrEqual(lineHeightFor(flatStyle.fontSize))
        }
      }
      expect(almaraiNodesCount).toBeGreaterThan(0)
    })

    it('applies clear visual hierarchy (ExtraBold name > Bold type & price > Regular secondary chips) and high-contrast tokens', async () => {
      const { getByText } = await render(
        <QueryClientProvider client={queryClient}>
          <OperatorCard item={baseItem} />
        </QueryClientProvider>
      )

      const nameNode = getByText('أحمد الحارثي')
      const typeNode = getByText('مشغل معدات')
      const expNode = getByText('6 سنوات خبرة')
      const certNode = getByText('شهادة معتمدة')
      const priceNode = getByText('40 ر.ع. / يوم')
      const callTextNode = getByText('اتصال')

      expect(StyleSheet.flatten(nameNode.props.style).fontFamily).toBe('Almarai_800ExtraBold')
      expect(StyleSheet.flatten(typeNode.props.style).fontFamily).toBe('Almarai_700Bold')
      expect(StyleSheet.flatten(typeNode.props.style).color).toBe(Colors.primaryDark)
      expect(StyleSheet.flatten(expNode.props.style).fontFamily).toBe('Almarai_400Regular')
      expect(StyleSheet.flatten(certNode.props.style).color).toBe(Colors.primaryDark)
      expect(StyleSheet.flatten(priceNode.props.style).fontFamily).toBe('Almarai_700Bold')
      expect(StyleSheet.flatten(callTextNode.props.style).color).toBe(Colors.primaryDark)
    })

    it('enforces single-line tail truncation on header texts, >= 44pt touch targets, and Arabic accessibility labels', async () => {
      const { getByTestId, getByLabelText, getByText } = await render(
        <QueryClientProvider client={queryClient}>
          <OperatorCard item={baseItem} />
        </QueryClientProvider>
      )

      const card = getByTestId('operator-card')
      expect(card.props.accessibilityRole).toBe('button')
      expect(card.props.accessibilityLabel).toBe('أحمد الحارثي، مسقط، 40 ر.ع. / يوم')

      const priceBadge = getByTestId('operator-price-badge')
      expect(priceBadge.props.accessible).toBe(true)
      expect(priceBadge.props.accessibilityLabel).toBe('الأجر: 40 ر.ع. / يوم')
      expect(StyleSheet.flatten(priceBadge.props.style).maxWidth).toBe('45%')

      const extraChip = getByTestId('operator-chip-extra')
      expect(extraChip.props.accessible).toBe(true)
      expect(extraChip.props.accessibilityLabel).toBe('4 مهارات إضافية')

      const nameNode = getByText('أحمد الحارثي')
      const locNode = getByText('مسقط')
      const priceNode = getByText('40 ر.ع. / يوم')
      expect(nameNode.props.numberOfLines).toBe(1)
      expect(nameNode.props.ellipsizeMode).toBe('tail')
      expect(locNode.props.numberOfLines).toBe(1)
      expect(locNode.props.ellipsizeMode).toBe('tail')
      expect(priceNode.props.numberOfLines).toBe(1)
      expect(priceNode.props.ellipsizeMode).toBe('tail')

      const callBtn = getByLabelText('اتصال بالمشغل')
      const waBtn = getByLabelText('تواصل عبر واتساب')
      expect(StyleSheet.flatten(callBtn.props.style).minHeight).toBeGreaterThanOrEqual(44)
      expect(StyleSheet.flatten(waBtn.props.style).minHeight).toBeGreaterThanOrEqual(44)
    })

    it('enforces >= 44pt touch target container for owner actionMenu in owner mode', async () => {
      const { getByTestId } = await render(
        <QueryClientProvider client={queryClient}>
          <OperatorCard item={baseItem} actionMenu={<View />} />
        </QueryClientProvider>
      )

      const menuContainer = getByTestId('operator-action-menu-container')
      const flat = StyleSheet.flatten(menuContainer.props.style)
      expect(flat.minWidth).toBeGreaterThanOrEqual(44)
      expect(flat.minHeight).toBeGreaterThanOrEqual(44)
    })

    it('supports fullWidth prop (defaults to true with 100% width, false gives 60% fixed width)', async () => {
      // 1. Default (omitted) -> 100%
      const { getByTestId, rerender } = await render(
        <QueryClientProvider client={queryClient}>
          <OperatorCard item={baseItem} />
        </QueryClientProvider>
      )
      const cardDefault = getByTestId('operator-card')
      expect(StyleSheet.flatten(cardDefault.props.style).width).toBe('100%')

      // 2. Explicit fullWidth={true} -> 100%
      await rerender(
        <QueryClientProvider client={queryClient}>
          <OperatorCard item={baseItem} fullWidth={true} />
        </QueryClientProvider>
      )
      const cardFull = getByTestId('operator-card')
      expect(StyleSheet.flatten(cardFull.props.style).width).toBe('100%')

      // 3. Explicit fullWidth={false} -> 60% window width
      await rerender(
        <QueryClientProvider client={queryClient}>
          <OperatorCard item={baseItem} fullWidth={false} />
        </QueryClientProvider>
      )
      const cardFixed = getByTestId('operator-card')
      const flatFixed = StyleSheet.flatten(cardFixed.props.style)
      expect(flatFixed.width).toBe(Dimensions.get('window').width * 0.6)
      expect(flatFixed.alignSelf).toBe('flex-start')
    })
  })
})
