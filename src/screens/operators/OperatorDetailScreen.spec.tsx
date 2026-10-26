import React from 'react'
import { Share } from 'react-native'
import { render, screen, fireEvent, act, cleanup, within } from '@testing-library/react-native'
import { OperatorDetailScreen } from './OperatorDetailScreen'
import { useOperatorDetail } from '../../hooks/listing-detail/useOperatorDetail'
import { useOperatorReviews } from '../../hooks/listing-detail/useOperatorReviews'
import { useOperatorOwnerActions } from '../../hooks/listing-detail/useOperatorOwnerActions'
import { useFavoriteToggle } from '../../hooks/listing-detail/useFavoriteToggle'
import { useListingContact } from '../../hooks/listing-detail/useListingContact'
import { useAuthStore } from '../../store/authStore'
import { assertOwnerHasPhoneForEdit } from '../../utils/assertOwnerHasPhoneForEdit'
import * as profilePhoneGuard from '../../utils/profilePhoneGuard'
import { useRouter } from 'expo-router'
import type { OperatorDetailViewModel } from '../../types/operatorDetailViewModel.types'

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('expo-image', () => {
  const { View } = require('react-native')
  return { Image: (props: any) => <View {...props} /> }
})

jest.mock('expo-blur', () => {
  const { View } = require('react-native')
  return { BlurView: (props: any) => <View {...props} /> }
})

jest.mock('../../components/listing-detail/ImageViewerModal', () => {
  const { View } = require('react-native')
  return {
    ImageViewerModal: (props: any) => (
      props.visible ? <View testID="mock-image-viewer-modal" /> : null
    ),
  }
})

jest.mock('../../hooks/listing-detail/useOperatorDetail')
jest.mock('../../hooks/listing-detail/useOperatorReviews')
jest.mock('../../hooks/listing-detail/useOperatorOwnerActions')
jest.mock('../../hooks/listing-detail/useFavoriteToggle')
jest.mock('../../hooks/listing-detail/useListingContact')
jest.mock('../../store/authStore')
jest.mock('../../utils/assertOwnerHasPhoneForEdit', () => ({
  assertOwnerHasPhoneForEdit: jest.fn().mockReturnValue(true),
}))
jest.mock('../../utils/profilePhoneGuard', () => ({
  promptProfilePhoneRequired: jest.fn(),
}))
jest.mock('../../utils/listing-detail/useAppReducedMotion', () => ({
  useAppReducedMotion: () => false,
}))

const sampleOperatorVm: OperatorDetailViewModel = {
  id: 'op-100',
  title: 'مشغل رافعة معتمد',
  description: 'خبرة طويلة في الموانئ والمشاريع',
  operatorType: 'OPERATOR',
  operatorTypeLabel: 'مشغل معدات',
  specializations: ['رافعات برجية'],
  equipmentTypes: [{ value: 'CRANE', label: 'رافعة' }],
  certifications: [
    { key: 'cert-1', label: 'شهادة تدريب', isDocument: false },
    { key: 'cert-doc-2', label: 'رخصة دولية', imageUrl: 'https://example.com/lic.jpg', isDocument: true },
  ],
  experienceYears: 8,
  experienceYearsLabel: '8 سنوات خبرة',
  rates: {
    dailyRate: 45,
    dailyRateFormatted: '45 ر.ع',
    currency: 'ر.ع',
    isNegotiable: true,
    primaryLabel: '45 ر.ع / يوم',
    hasAnyRate: true,
  },
  location: {
    fullLocationText: 'مسقط، مطرح',
    hasCoordinates: true,
    latitude: 23.6,
    longitude: 58.5,
  },
  seller: {
    id: 'user-seller-9',
    name: 'سالم الهنائي',
    username: 'salim_crane',
    isVerified: true,
    memberSinceLabel: 'عضو منذ 2023',
    avatarUrl: 'https://example.com/salim.jpg',
  },
  whatsappEnabled: true,
  postedAtLabel: 'منذ يوم',
  viewCount: 250,
  status: 'ACTIVE',
  hiddenByOwnerStatus: false,
  pendingDeletion: null,
}

describe('OperatorDetailScreen', () => {
  let mockRouter: any
  let mockContact: any
  let mockFavorite: any
  let mockOwnerActions: any

  beforeEach(() => {
    mockRouter = { push: jest.fn(), back: jest.fn() }
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)

    mockContact = {
      call: jest.fn(),
      whatsApp: jest.fn(),
      chat: jest.fn(),
      busy: false,
    }
    ;(useListingContact as jest.Mock).mockReturnValue(mockContact)

    mockFavorite = { isFavorite: false, isBusy: false, toggle: jest.fn() }
    ;(useFavoriteToggle as jest.Mock).mockReturnValue(mockFavorite)

    mockOwnerActions = {
      actions: [
        { id: 'edit', label: 'تعديل', tone: 'neutral', icon: 'create-outline', requiresConfirm: false },
        { id: 'delete', label: 'طلب حذف', tone: 'danger', icon: 'trash-outline', requiresConfirm: true },
      ],
      run: jest.fn(),
      busy: false,
      viewCount: 250,
    }
    ;(useOperatorOwnerActions as jest.Mock).mockReturnValue(mockOwnerActions)

    ;(useOperatorReviews as jest.Mock).mockReturnValue({
      summary: {
        averageRating: 4.9,
        reviewCount: 8,
      },
      reviews: [],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })

    ;(useOperatorDetail as jest.Mock).mockReturnValue({
      state: 'ready',
      vm: sampleOperatorVm,
      refetch: jest.fn(),
    })

    // Default guest viewer
    ;(useAuthStore as unknown as jest.Mock).mockImplementation((selector: any) =>
      selector({ user: null })
    )
    useAuthStore.getState = jest.fn().mockReturnValue({ user: { id: 'user-seller-9', phone: '+96891234567' } })
  })

  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  it('renders loading state when hook reports loading', async () => {
    ;(useOperatorDetail as jest.Mock).mockReturnValue({
      state: 'loading',
      vm: null,
      refetch: jest.fn(),
    })

    await render(<OperatorDetailScreen id="op-100" />)
    expect(screen.getByTestId('detail-state-loading')).toBeTruthy()
  })

  it('renders notFound state when operator is not found', async () => {
    ;(useOperatorDetail as jest.Mock).mockReturnValue({
      state: 'notFound',
      vm: null,
      refetch: jest.fn(),
    })

    await render(<OperatorDetailScreen id="op-100" />)
    expect(screen.getByTestId('detail-state-not-found')).toBeTruthy()
  })

  it('strictly does NOT render seller card for visitor (operator IS the profile - teeth verified)', async () => {
    await render(<OperatorDetailScreen id="op-100" />)
    expect(screen.queryByTestId('seller-card')).toBeNull()
    expect(screen.queryByTestId('seller-card-touchable')).toBeNull()
  })

  it('strictly does NOT render seller card for owner (teeth verified)', async () => {
    ;(useAuthStore as unknown as jest.Mock).mockImplementation(
      (selector: (s: { user: { id?: string; phone?: string } | null }) => unknown) =>
        selector({ user: { id: 'user-seller-9' } })
    )
    await render(<OperatorDetailScreen id="op-100" />)
    expect(screen.queryByTestId('seller-card')).toBeNull()
    expect(screen.queryByTestId('seller-card-touchable')).toBeNull()
  })

  it('renders hero with name, verified badge, and stat chips for real fields', async () => {
    await render(<OperatorDetailScreen id="op-100" />)

    expect(screen.getByTestId('operator-hero-header')).toBeTruthy()
    expect(screen.getByTestId('operator-title')).toBeTruthy()
    expect(screen.getByText('مشغل رافعة معتمد')).toBeTruthy()
    expect(screen.getByTestId('operator-verified-badge')).toBeTruthy()
    expect(screen.getByTestId('operator-experience-pill')).toBeTruthy()
    expect(screen.getByText('8 سنوات خبرة')).toBeTruthy()
    expect(screen.getByTestId('operator-stat-rate')).toBeTruthy()
    expect(within(screen.getByTestId('operator-stat-rate')).getByText('45 ر.ع / يوم')).toBeTruthy()
    expect(screen.getByTestId('operator-stat-equipment')).toBeTruthy()
    expect(within(screen.getByTestId('operator-stat-equipment')).getByText('رافعة')).toBeTruthy()
  })

  it('hides hero stat chips and verified badge when fields are absent', async () => {
    const minimalVm: OperatorDetailViewModel = {
      ...sampleOperatorVm,
      experienceYears: undefined,
      experienceYearsLabel: '',
      rates: {
        currency: 'ر.ع',
        isNegotiable: false,
        primaryLabel: 'السعر عند التواصل',
        hasAnyRate: false,
      },
      equipmentTypes: [],
      seller: { ...sampleOperatorVm.seller, isVerified: false },
    }

    ;(useOperatorDetail as jest.Mock).mockReturnValue({
      state: 'ready',
      vm: minimalVm,
      refetch: jest.fn(),
    })

    await render(<OperatorDetailScreen id="op-100" />)
    expect(screen.queryByTestId('operator-experience-pill')).toBeNull()
    expect(screen.queryByTestId('operator-stat-rate')).toBeNull()
    expect(screen.queryByTestId('operator-stat-equipment')).toBeNull()
    expect(screen.queryByTestId('operator-verified-badge')).toBeNull()
  })

  it('renders merged specializations and certifications block once under one title (teeth verified)', async () => {
    await render(<OperatorDetailScreen id="op-100" />)

    const certsCards = screen.getAllByTestId('operator-certifications-card')
    expect(certsCards).toHaveLength(1)
    expect(screen.getByText('التخصصات والشهادات')).toBeTruthy()
    expect(screen.getByTestId('operator-specializations-section')).toBeTruthy()
    expect(screen.getByTestId('operator-certs-section')).toBeTruthy()
  })

  it('hides merged specializations and certifications block when empty', async () => {
    const emptyCertsVm: OperatorDetailViewModel = {
      ...sampleOperatorVm,
      equipmentTypes: [],
      specializations: [],
      certifications: [],
    }

    ;(useOperatorDetail as jest.Mock).mockReturnValue({
      state: 'ready',
      vm: emptyCertsVm,
      refetch: jest.fn(),
    })

    await render(<OperatorDetailScreen id="op-100" />)
    expect(screen.queryByTestId('operator-certifications-card')).toBeNull()
  })

  it('strictly does NOT render similar operators section', async () => {
    await render(<OperatorDetailScreen id="op-100" />)
    expect(screen.queryByTestId('similar-listings-section')).toBeNull()
    expect(screen.queryByTestId('similar-operators-section')).toBeNull()
  })

  it('renders visitor view with contact actions and NO navbar favorite, without owner bar', async () => {
    await render(<OperatorDetailScreen id="op-100" />)

    expect(screen.getByTestId('operator-detail-screen')).toBeTruthy()
    expect(screen.getByTestId('operator-hero-header')).toBeTruthy()
    expect(screen.getByTestId('operator-rates-card')).toBeTruthy()
    expect(screen.getByTestId('operator-certifications-card')).toBeTruthy()
    expect(screen.getByTestId('operator-reviews-card')).toBeTruthy()

    // Visitor sees contact actions (both inline and sticky)
    expect(screen.getAllByTestId('btn-contact-chat').length).toBeGreaterThanOrEqual(1)

    // Owner bar is absent
    expect(screen.queryByTestId('btn-owner-edit')).toBeNull()

    // Operators have NO favorites (Part O decision)
    expect(screen.queryByTestId('nav-favorite-button')).toBeNull()
    expect(useFavoriteToggle).not.toHaveBeenCalled()
    expect(useListingContact).toHaveBeenCalledWith(
      'OPERATOR_LISTING',
      'op-100',
      '/equipment/operators/op-100',
      'مشغل رافعة معتمد'
    )
  })

  it('triggers contact actions when visitor presses inline action buttons', async () => {
    await render(<OperatorDetailScreen id="op-100" />)

    const chatButtons = screen.getAllByTestId('btn-contact-chat')
    await act(async () => {
      fireEvent.press(chatButtons[0])
    })
    expect(mockContact.chat).toHaveBeenCalled()

    const whatsappButtons = screen.getAllByTestId('btn-contact-whatsapp')
    await act(async () => {
      fireEvent.press(whatsappButtons[0])
    })
    expect(mockContact.whatsApp).toHaveBeenCalled()

    const callButtons = screen.getAllByTestId('btn-contact-call')
    await act(async () => {
      fireEvent.press(callButtons[0])
    })
    expect(mockContact.call).toHaveBeenCalled()
  })

  it('renders owner view with owner management bar and never calls contact actions', async () => {
    // Authenticate as owner
    ;(useAuthStore as unknown as jest.Mock).mockImplementation((selector: any) =>
      selector({ user: { id: 'user-seller-9' } })
    )

    await render(<OperatorDetailScreen id="op-100" />)

    expect(screen.getByTestId('btn-owner-edit')).toBeTruthy()
    expect(screen.queryByTestId('btn-contact-chat')).toBeNull()
    expect(screen.queryByTestId('operator-pending-deletion-banner')).toBeNull()
    expect(mockContact.call).not.toHaveBeenCalled()
    expect(mockContact.whatsApp).not.toHaveBeenCalled()
    expect(mockContact.chat).not.toHaveBeenCalled()
  })

  it('renders pending deletion banner when owner has pending deletion and triggers restore on cancel', async () => {
    ;(useAuthStore as unknown as jest.Mock).mockImplementation((selector: any) =>
      selector({ user: { id: 'user-seller-9' } })
    )

    const vmWithPending: OperatorDetailViewModel = {
      ...sampleOperatorVm,
      pendingDeletion: {
        id: 'del-req-99',
        requestedAt: '2026-10-22',
        requestedAtLabel: 'منذ ساعة',
        status: 'PENDING',
      },
    }

    ;(useOperatorDetail as jest.Mock).mockReturnValue({
      state: 'ready',
      vm: vmWithPending,
      refetch: jest.fn(),
    })

    await render(<OperatorDetailScreen id="op-100" />)

    expect(screen.getByTestId('operator-pending-deletion-banner')).toBeTruthy()
    const cancelBtn = screen.getByTestId('operator-cancel-deletion-button')
    fireEvent.press(cancelBtn)

    expect(mockOwnerActions.run).toHaveBeenCalledWith('restore')
  })

  it('opens certificate document image in viewer modal when pressed', async () => {
    await render(<OperatorDetailScreen id="op-100" />)

    const certDocBtn = screen.getByTestId('operator-cert-doc-cert-doc-2')
    await act(async () => {
      fireEvent.press(certDocBtn)
    })

    expect(screen.getByTestId('mock-image-viewer-modal')).toBeTruthy()
  })

  it('navigates to edit route when owner clicks edit', async () => {
    ;(useAuthStore as unknown as jest.Mock).mockImplementation((selector: any) =>
      selector({ user: { id: 'user-seller-9' } })
    )

    await render(<OperatorDetailScreen id="op-100" />)

    const editBtn = screen.getByTestId('btn-owner-edit')
    fireEvent.press(editBtn)
    expect(mockRouter.push).toHaveBeenCalledWith('/equipment/operators/edit/op-100')
  })

  it('stops navigation and prompts for phone when phone is missing on edit click', async () => {
    ;(assertOwnerHasPhoneForEdit as jest.Mock).mockReturnValue(false)
    ;(useAuthStore as unknown as jest.Mock).mockImplementation((selector: any) =>
      selector({ user: { id: 'user-seller-9', phone: '' } })
    )

    await render(<OperatorDetailScreen id="op-100" />)

    const editBtn = screen.getByTestId('btn-owner-edit')
    fireEvent.press(editBtn)

    expect(assertOwnerHasPhoneForEdit).toHaveBeenCalled()
    expect(mockRouter.push).not.toHaveBeenCalledWith('/equipment/operators/edit/op-100')
  })

  it('navigates to edit route when owner has a valid phone number', async () => {
    ;(assertOwnerHasPhoneForEdit as jest.Mock).mockReturnValue(true)
    ;(useAuthStore as unknown as jest.Mock).mockImplementation((selector: any) =>
      selector({ user: { id: 'user-seller-9', phone: '+96891234567' } })
    )

    await render(<OperatorDetailScreen id="op-100" />)

    const editBtn = screen.getByTestId('btn-owner-edit')
    fireEvent.press(editBtn)

    expect(assertOwnerHasPhoneForEdit).toHaveBeenCalled()
    expect(mockRouter.push).toHaveBeenCalledWith('/equipment/operators/edit/op-100')
  })

  it('does NOT render a search bar in the navbar (dead control removed)', async () => {
    await render(<OperatorDetailScreen id="op-100" />)

    expect(screen.queryByTestId('nav-search-input')).toBeNull()
    expect(screen.queryByTestId('nav-search-container')).toBeNull()
  })

  it('renders share button in top bar and triggers share on press (D-095 Item 30)', async () => {
    const shareSpy = jest.spyOn(Share, 'share').mockImplementation(async () => ({ action: 'sharedAction' as const }))

    await render(<OperatorDetailScreen id="op-100" />)

    const shareBtn = screen.getByTestId('btn-detail-share')
    expect(shareBtn).toBeTruthy()
    await act(async () => {
      fireEvent.press(shareBtn)
    })

    expect(shareSpy).toHaveBeenCalledWith({
      message: 'مشغل رافعة معتمد - سوق ون',
    })
    shareSpy.mockRestore()
  })

  it('renders fixed top bar before scroll view and strictly omits favorite heart (D-095)', async () => {
    await render(<OperatorDetailScreen id="op-100" />)

    const topBar = screen.getByTestId('detail-top-bar')
    const backBtn = screen.getByTestId('nav-back-button')
    const shareBtn = screen.getByTestId('btn-detail-share')

    expect(topBar).toBeTruthy()
    expect(backBtn).toBeTruthy()
    expect(shareBtn).toBeTruthy()
    expect(screen.queryByTestId('nav-favorite-button')).toBeNull()
  })
})
