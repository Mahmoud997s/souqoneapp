import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { PublicProfileHero } from '../../components/profile/public-profile/PublicProfileHero'
import { PublicProfileTopBar } from '../../components/profile/public-profile/PublicProfileTopBar'
import { PublicProfileTabs } from '../../components/profile/public-profile/PublicProfileTabs'
import { PublicProfileSectionList } from '../../components/profile/public-profile/PublicProfileSectionList'
import { SupportHelpButton } from '../../components/ui/SupportHelpButton'
import { PublicProfileTokens } from '../../constants/publicProfileTokens'
import { PublicProfile } from '../../types/profile.types'

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}))

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, style }: any) => <>{children}</>,
}))

const BASE_PROFILE = {
  id: 'seller-1',
  username: 'seller_one',
  displayName: 'بائع السوق',
  isVerified: true,
  governorateRef: { id: 1, nameAr: 'مسقط' },
  bio: 'منتجات مختارة بعناية',
  createdAt: '2020-04-17T00:00:00.000Z',
  _count: {
    listings: 4,
    busListings: 2,
    equipmentListings: 0,
    spareParts: 3,
    carServices: 1,
    operatorListings: 0,
    driverJobs: 0,
  },
  totalListings: 10,
} as PublicProfile

describe('D-355: Seller profile compact, contact icon row, support card, @handle bidi', () => {
  it('1-3. PublicProfileTokens & bars use compact target sizes', () => {
    expect(PublicProfileTokens.topBarSize).toBeLessThanOrEqual(44)
    expect(PublicProfileTokens.avatarSize).toBeLessThanOrEqual(60)
    expect(PublicProfileTokens.actionHeight).toBeLessThanOrEqual(44)
  })

  it('2. PublicProfileTopBar preserves 44pt accessible back target via hitSlop', async () => {
    const { getByTestId } = await render(
      <PublicProfileTopBar topInset={20} onBack={jest.fn()} support={{ kind: 'blur' }} />
    )
    const backBtn = getByTestId('public-profile-back')
    const flat = StyleSheet.flatten(backBtn.props.style)
    expect(flat.width).toBe(38)
    expect(flat.height).toBe(38)
    expect(backBtn.props.hitSlop).toBe(3)
  })

  it('4. PublicProfileSectionList renders footer support card at the end of the page', async () => {
    const { getByText } = await render(
      <PublicProfileSectionList
        vertical="car"
        items={[]}
        isLoading={false}
        isError={false}
        isRefreshing={false}
        isFetchingNextPage={false}
        hasNextPage={false}
        onRefresh={jest.fn()}
        onRetry={jest.fn()}
        onLoadMore={jest.fn()}
        onPressItem={jest.fn()}
        footer={<SupportHelpButton variant="outline" />}
      />
    )
    expect(getByText('تحتاج للمساعدة؟ تواصل مع الدعم الفني')).toBeTruthy()
  })

  it('5a. Visitor contact row shows only Chat icon+label when seller exposes no phone/whatsapp', async () => {
    const onChat = jest.fn()
    const { getByTestId, getByText, queryByTestId } = await render(
      <PublicProfileHero
        profile={BASE_PROFILE}
        action={{ kind: 'visitor', onPress: onChat }}
        support={{ kind: 'blur' }}
      />
    )

    const chatBtn = getByTestId('public-profile-chat-btn')
    expect(getByText('محادثة')).toBeTruthy()
    expect(queryByTestId('public-profile-call-btn')).toBeNull()
    expect(queryByTestId('public-profile-whatsapp-btn')).toBeNull()

    await fireEvent.press(chatBtn)
    expect(onChat).toHaveBeenCalledTimes(1)
  })

  it('5b. Visitor contact row conditionally shows Call and WhatsApp icon buttons when exposed', async () => {
    const onChat = jest.fn()
    const onCall = jest.fn()
    const onWhatsApp = jest.fn()
    const profileWithContact = {
      ...BASE_PROFILE,
      phone: '91234567',
      whatsapp: '91234567',
    } as PublicProfile & { whatsapp?: string }

    const { getByTestId, getByText } = await render(
      <PublicProfileHero
        profile={profileWithContact}
        action={{ kind: 'visitor', onPress: onChat, onCall, onWhatsApp }}
        support={{ kind: 'blur' }}
      />
    )

    expect(getByText('محادثة')).toBeTruthy()
    expect(getByText('اتصال')).toBeTruthy()
    expect(getByText('واتساب')).toBeTruthy()

    await fireEvent.press(getByTestId('public-profile-call-btn'))
    await fireEvent.press(getByTestId('public-profile-whatsapp-btn'))
    expect(onCall).toHaveBeenCalledWith('91234567')
    expect(onWhatsApp).toHaveBeenCalledWith('91234567')
  })

  it('6. @handle renders with LTR writingDirection so @ stays before username', async () => {
    const { getByTestId } = await render(
      <PublicProfileHero profile={BASE_PROFILE} support={{ kind: 'blur' }} />
    )
    const handle = getByTestId('public-profile-handle')
    const flat = StyleSheet.flatten(handle.props.style)
    expect(flat.writingDirection).toBe('ltr')
    expect(handle.props.children).toContain('@seller_one')
  })
})
