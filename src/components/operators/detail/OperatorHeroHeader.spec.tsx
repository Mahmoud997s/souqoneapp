import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { OperatorHeroHeader } from './OperatorHeroHeader'
import type { OperatorDetailViewModel } from '../../../types/operatorDetailViewModel.types'

const baseMockVm: OperatorDetailViewModel = {
  id: 'op-1',
  title: 'مشغل كرين محترف',
  description: 'وصف المشغل',
  operatorType: 'OPERATOR',
  operatorTypeLabel: 'مشغل معدات',
  specializations: [],
  equipmentTypes: [],
  certifications: [],
  experienceYears: 7,
  experienceYearsLabel: '7 سنوات خبرة',
  rates: {
    dailyRate: 35,
    dailyRateFormatted: '35 ر.ع',
    hourlyRate: 5,
    hourlyRateFormatted: '5 ر.ع',
    currency: 'ر.ع',
    isNegotiable: true,
    primaryLabel: '35 ر.ع / يوم',
    hasAnyRate: true,
  },
  location: {
    fullLocationText: 'مسقط، السيب',
    hasCoordinates: false,
  },
  seller: {
    id: 'user-1',
    name: 'أحمد البلوشي',
    username: 'ahmed_op',
    isVerified: true,
    memberSinceLabel: 'عضو منذ يناير 2024',
    avatarUrl: 'https://example.com/avatar.jpg',
  },
  postedAtLabel: 'منذ ساعتين',
  viewCount: 120,
  whatsappEnabled: true,
  status: 'ACTIVE',
  hiddenByOwnerStatus: false,
  pendingDeletion: null,
  profileImageUrl: 'https://example.com/profile.jpg',
}

describe('OperatorHeroHeader', () => {
  it('renders all fields including avatar image, verified badge, experience pill and negotiable badge', async () => {
    await render(<OperatorHeroHeader vm={baseMockVm} />)

    expect(screen.getByTestId('operator-hero-header')).toBeTruthy()
    expect(screen.getByTestId('operator-avatar-image')).toBeTruthy()
    expect(screen.getByTestId('operator-verified-badge')).toBeTruthy()
    expect(screen.getByText('مشغل كرين محترف')).toBeTruthy()
    expect(screen.getByText('مشغل معدات')).toBeTruthy()
    expect(screen.getByText('7 سنوات خبرة')).toBeTruthy()
    expect(screen.getByText('مسقط، السيب')).toBeTruthy()
    expect(screen.getByText('منذ ساعتين')).toBeTruthy()
    expect(screen.getByText('35 ر.ع / يوم')).toBeTruthy()
    expect(screen.getByTestId('operator-negotiable-badge')).toBeTruthy()
  })

  it('renders fallback avatar when profileImageUrl and seller avatar are missing', async () => {
    const vmNoAvatar: OperatorDetailViewModel = {
      ...baseMockVm,
      profileImageUrl: undefined,
      seller: { ...baseMockVm.seller, avatarUrl: undefined, isVerified: false },
    }
    await render(<OperatorHeroHeader vm={vmNoAvatar} />)

    expect(screen.getByTestId('operator-avatar-fallback')).toBeTruthy()
    expect(screen.queryByTestId('operator-avatar-image')).toBeNull()
    expect(screen.queryByTestId('operator-verified-badge')).toBeNull()
  })

  it('hides experience pill when experienceYearsLabel is missing or empty', async () => {
    const vmNoExp: OperatorDetailViewModel = {
      ...baseMockVm,
      experienceYears: undefined,
      experienceYearsLabel: '',
    }
    await render(<OperatorHeroHeader vm={vmNoExp} />)

    expect(screen.queryByTestId('operator-experience-pill')).toBeNull()
  })

  it('hides negotiable badge when isNegotiable is false and shows primary rate', async () => {
    const vmNonNeg: OperatorDetailViewModel = {
      ...baseMockVm,
      rates: {
        ...baseMockVm.rates,
        isNegotiable: false,
        primaryLabel: 'السعر عند التواصل',
      },
    }
    await render(<OperatorHeroHeader vm={vmNonNeg} />)

    expect(screen.queryByTestId('operator-negotiable-badge')).toBeNull()
    expect(screen.getByText('السعر عند التواصل')).toBeTruthy()
  })
})
