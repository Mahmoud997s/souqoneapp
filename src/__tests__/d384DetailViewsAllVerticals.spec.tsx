import React from 'react'
import { StyleSheet } from 'react-native'
import { render, screen, cleanup } from '@testing-library/react-native'
import fs from 'fs'
import path from 'path'

import { DetailViewCountItem } from '../components/listing-detail/DetailViewCountItem'
import { ListingHeaderBlock } from '../components/listing-detail/ListingHeaderBlock'
import { EquipmentHeaderBlock } from '../components/equipment/detail/EquipmentHeaderBlock'
import { OperatorHeroHeader } from '../components/operators/detail/OperatorHeroHeader'
import { ServicePriceHeader } from '../screens/services/components/ServicePriceHeader'
import { Colors } from '../constants/colors'
import type { OperatorDetailViewModel } from '../types/operatorDetailViewModel.types'

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}))

jest.mock('expo-image', () => {
  const ReactLib = require('react')
  const { View } = require('react-native')
  return {
    Image: () => <View testID="mock-expo-image" />,
  }
})

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}))

const ROOT = path.resolve(__dirname, '../..')
const readRepoFile = (relPath: string) =>
  fs.readFileSync(path.join(ROOT, relPath), 'utf8')

const mockPrice = {
  amount: 5500,
  currency: 'ر.ع',
  formattedAmount: '5,500',
  fullPriceLabel: '5,500 ر.ع',
  isNegotiable: false,
  listingType: 'SALE' as const,
}

const mockOperatorVm: OperatorDetailViewModel = {
  id: 'op-1',
  title: 'سالم العامري',
  description: 'مشغل حفار بخبرة 8 سنوات',
  operatorType: 'OPERATOR',
  operatorTypeLabel: 'مشغل معدات ثقيلة',
  specializations: [],
  experienceYears: 8,
  experienceYearsLabel: '8 سنوات خبرة',
  equipmentTypes: [{ value: 'EXCAVATOR', label: 'حفار' }],
  certifications: [],
  rates: {
    dailyRate: 45,
    dailyRateFormatted: '45',
    currency: 'ر.ع',
    isNegotiable: false,
    primaryLabel: '45 ر.ع / يوم',
    hasAnyRate: true,
  },
  profileImageUrl: null,
  seller: {
    id: 'user-1',
    name: 'سالم العامري',
    username: 'salem',
    memberSinceLabel: '2024',
    isVerified: true,
  },
  location: {
    fullLocationText: 'مسقط - السيب',
    hasCoordinates: false,
  },
  whatsappEnabled: true,
  viewCount: 250,
  postedAtLabel: 'منذ يومين',
  status: 'ACTIVE',
  hiddenByOwnerStatus: false,
  pendingDeletion: null,
}

describe('D-384: Public view count on all 6 detail pages via shared DetailViewCountItem', () => {
  afterEach(() => {
    cleanup()
  })

  it('DetailViewCountItem renders eye-outline (14, textMuted) and Western-formatted count including 0', async () => {
    await render(<DetailViewCountItem viewCount={1250} />)
    const textNode = screen.getByText('1,250 مشاهدة')
    expect(textNode).toBeTruthy()
    const flat = StyleSheet.flatten(textNode.props.style)
    expect(flat.color).toBe(Colors.textMuted)
    expect(flat.fontFamily).toBe('Almarai_400Regular')
    expect(flat.textAlign).toBe('left')
    expect(flat.writingDirection).toBe('rtl')

    await cleanup()
    await render(<DetailViewCountItem viewCount={0} />)
    expect(screen.getByText('0 مشاهدة')).toBeTruthy()
  })

  it('ServicePriceHeader reuses DetailViewCountItem and preserves Services output', async () => {
    await render(
      <ServicePriceHeader
        title="ورشة الخليج"
        serviceTypeLabel="صيانة وميكانيكا"
        providerTypeLabel="ورشة"
        isHomeService={false}
        price={{
          typeLabel: 'السعر',
          amountLabel: '25 ر.ع',
          isRange: false,
        }}
        postedAtLabel="منذ ساعة"
        viewCount={1540}
        locationLabel="مسقط"
      />
    )
    expect(screen.getByTestId('detail-view-count')).toBeTruthy()
    expect(screen.getByText('1,540 مشاهدة')).toBeTruthy()
  })

  it('ListingHeaderBlock (Cars, Buses, Parts) displays view count for non-owners including 0', async () => {
    await render(
      <ListingHeaderBlock
        title="تويوتا كامري 2022"
        kindLabel="للبيع"
        price={mockPrice}
        locationText="مسقط - السيب"
        postedAtLabel="منذ يومين"
        viewCount={342}
      />
    )
    expect(screen.getByTestId('detail-view-count')).toBeTruthy()
    expect(screen.getByText('342 مشاهدة')).toBeTruthy()

    await cleanup()
    await render(
      <ListingHeaderBlock
        title="قطعة غيار"
        kindLabel="قطعة غيار"
        price={mockPrice}
        postedAtLabel="اليوم"
        viewCount={0}
      />
    )
    expect(screen.getByText('0 مشاهدة')).toBeTruthy()
  })

  it('EquipmentHeaderBlock (Equipment) displays view count for non-owners including 0', async () => {
    await render(
      <EquipmentHeaderBlock
        title="حفار كاتربيلر"
        kindLabel="للبيع"
        price={mockPrice}
        isWanted={false}
        isRental={false}
        operatorBadge={null}
        locationText="صحار"
        postedAtLabel="منذ 3 أيام"
        viewCount={180}
      />
    )
    expect(screen.getByTestId('detail-view-count')).toBeTruthy()
    expect(screen.getByText('180 مشاهدة')).toBeTruthy()

    await cleanup()
    await render(
      <EquipmentHeaderBlock
        title="حفار كاتربيلر"
        kindLabel="للبيع"
        price={mockPrice}
        isWanted={false}
        isRental={false}
        operatorBadge={null}
        locationText="صحار"
        postedAtLabel="منذ 3 أيام"
        viewCount={0}
      />
    )
    expect(screen.getByText('0 مشاهدة')).toBeTruthy()
  })

  it('OperatorHeroHeader (Operators) displays view count for non-owners including 0', async () => {
    await render(<OperatorHeroHeader vm={mockOperatorVm} />)
    expect(screen.getByTestId('detail-view-count')).toBeTruthy()
    expect(screen.getByText('250 مشاهدة')).toBeTruthy()

    await cleanup()
    await render(<OperatorHeroHeader vm={{ ...mockOperatorVm, viewCount: 0 }} />)
    expect(screen.getByText('0 مشاهدة')).toBeTruthy()
  })

  it('all 5 non-service detail screens wire vm.viewCount into their public header', () => {
    const screenFiles = [
      'src/screens/cars/CarDetailScreen.tsx',
      'src/screens/buses/BusDetailScreen.tsx',
      'src/screens/parts/PartDetailScreen.tsx',
      'src/screens/equipment/EquipmentDetailScreen.tsx',
    ]
    for (const file of screenFiles) {
      expect(readRepoFile(file)).toMatch(/viewCount=\{vm\.viewCount\}/)
    }
    expect(readRepoFile('src/components/operators/detail/OperatorHeroHeader.tsx')).toContain(
      'DetailViewCountItem'
    )
  })
})
