import React from 'react'
import { View, TouchableOpacity, Text, Share } from 'react-native'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react-native'
import { useShareListing, buildShareMessage } from './useShareListing'
import { APP_NAME, SHARE_LINK_ENABLED, buildListingShareUrl } from '../../constants/listing-detail/shareConfig'
import { BaseDetailViewModel } from '../../types/carDetailViewModel.types'

const mockVm: BaseDetailViewModel = {
  id: 'car-789',
  version: 1,
  status: 'ACTIVE',
  title: 'لكزس LX600 VIP 2023',
  description: 'سيارة ممتازة بحالة الوكالة',
  listingType: 'SALE',
  price: {
    amount: 48000,
    formattedAmount: '48,000',
    currency: 'OMR',
    fullPriceLabel: '48,000 ر.ع',
    isNegotiable: true,
    listingType: 'SALE',
  },
  images: [],
  location: {
    governorateName: 'مسقط',
    wilayaName: 'بوشر',
    fullLocationText: 'مسقط، بوشر',
    hasCoordinates: false,
  },
  seller: {
    id: 'seller-1',
    name: 'مستخدم سوق ون',
    username: 'vip_user',
    isVerified: true,
    memberSinceLabel: 'عضو في سوق ون',
  },
  whatsappEnabled: true,
  postedAtLabel: 'منذ يومين',
  viewCount: 150,
}

function TestShareHarness({
  vm = mockVm,
  shareTitle = 'لكزس LX600 VIP 2023',
}: {
  vm?: BaseDetailViewModel
  shareTitle?: string
}) {
  const { share } = useShareListing(vm, { shareTitle })

  return React.createElement(
    View,
    null,
    React.createElement(
      TouchableOpacity,
      {
        testID: 'share-btn',
        onPress: share,
      },
      React.createElement(Text, null, 'Share Listing')
    )
  )
}

describe('useShareListing & shareConfig', () => {
  let shareSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as any)
  })

  afterEach(() => {
    cleanup()
    shareSpy.mockRestore()
  })

  it('verifies shareConfig constants and url builder', () => {
    expect(APP_NAME).toBe('سوق ون')
    expect(SHARE_LINK_ENABLED).toBe(false)
    expect(buildListingShareUrl('car-789')).toBe('https://souqone.app/listings/car-789')
  })

  it('buildShareMessage excludes the URL when link inclusion is false (default)', () => {
    const message = buildShareMessage('تويوتا لاندكروزر 2024', 'car-789')
    expect(message).toBe('تويوتا لاندكروزر 2024 - سوق ون')
    expect(message).not.toContain('https://')
  })

  it('buildShareMessage includes the URL when includeLink is true', () => {
    const message = buildShareMessage('تويوتا لاندكروزر 2024', 'car-789', true)
    expect(message).toBe('تويوتا لاندكروزر 2024 - سوق ون\nhttps://souqone.app/listings/car-789')
  })

  it('calls native Share.share with the expected title and app name without link by default', async () => {
    await render(React.createElement(TestShareHarness, { shareTitle: 'لكزس LX600 VIP 2023' }))

    await act(async () => {
      fireEvent.press(screen.getByTestId('share-btn'))
    })

    expect(shareSpy).toHaveBeenCalledTimes(1)
    expect(shareSpy).toHaveBeenCalledWith({
      message: 'لكزس LX600 VIP 2023 - سوق ون',
    })
  })

  it('catches and handles native Share.share error gracefully without throwing', async () => {
    shareSpy.mockRejectedValueOnce(new Error('User cancelled or Share dismissed'))

    await render(React.createElement(TestShareHarness))

    await act(async () => {
      fireEvent.press(screen.getByTestId('share-btn'))
    })

    expect(shareSpy).toHaveBeenCalledTimes(1)
  })
})
