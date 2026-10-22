import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { EquipmentHeaderBlock } from './EquipmentHeaderBlock'
import type { PriceView } from '../../../types/listingDetail.types'

describe('EquipmentHeaderBlock', () => {
  const defaultPrice: PriceView = {
    amount: 15000,
    formattedAmount: '15,000',
    currency: 'ر.ع',
    fullPriceLabel: '15,000 ر.ع',
    isNegotiable: true,
    listingType: 'SALE',
    caption: 'للبيع',
  }

  it('renders SALE listing with price, negotiable badge and metadata', async () => {
    await render(
      <EquipmentHeaderBlock
        title="حفار كوماتسو PC200"
        kindLabel="للبيع"
        conditionLabel="مستعمل"
        price={defaultPrice}
        isWanted={false}
        isRental={false}
        operatorBadge={null}
        locationText="مسقط، السيب"
        postedAtLabel="منذ يومين"
      />
    )

    expect(screen.getByText('حفار كوماتسو PC200')).toBeTruthy()
    expect(screen.getByText('للبيع')).toBeTruthy()
    expect(screen.getByText('مستعمل')).toBeTruthy()
    expect(screen.getByText('قابل للتفاوض')).toBeTruthy()
    expect(screen.getByText('15,000')).toBeTruthy()
    expect(screen.getByText('مسقط، السيب')).toBeTruthy()
    expect(screen.getByText('منذ يومين')).toBeTruthy()
  })

  it('renders RENT listing with rates and operator badge under price', async () => {
    const rentPrice: PriceView = {
      amount: 100,
      formattedAmount: '100',
      currency: 'ر.ع',
      fullPriceLabel: '100 ر.ع / يوم',
      dailyRate: { amount: 100, formatted: '100', label: '100 ر.ع / يوم' },
      monthlyRate: { amount: 2000, formatted: '2,000', label: '2,000 ر.ع / شهر' },
      isNegotiable: false,
      listingType: 'RENTAL',
      caption: 'للإيجار',
    }

    await render(
      <EquipmentHeaderBlock
        title="بوبكات للإيجار"
        kindLabel="للإيجار"
        conditionLabel="ممتازة"
        price={rentPrice}
        isWanted={false}
        isRental={true}
        operatorBadge={{ kind: 'with', label: 'مع مشغّل' }}
        locationText="صحار"
        postedAtLabel="منذ ساعة"
      />
    )

    expect(screen.getByText('100 ر.ع / يوم')).toBeTruthy()
    expect(screen.getByText('2,000 ر.ع / شهر')).toBeTruthy()
    expect(screen.getByText('مع مشغّل')).toBeTruthy()
  })

  it('strictly hides price section for WANTED listings and never renders "0 ر.ع"', async () => {
    const wantedPrice: PriceView = {
      amount: 0,
      formattedAmount: '0',
      currency: 'ر.ع',
      fullPriceLabel: '0 ر.ع',
      isNegotiable: false,
      listingType: 'WANTED',
    }

    await render(
      <EquipmentHeaderBlock
        title="مطلوب شيول كتربلر 966"
        kindLabel="مطلوب معدة"
        price={wantedPrice}
        isWanted={true}
        isRental={false}
        operatorBadge={null}
        locationText="الداخلية، نزوى"
        postedAtLabel="الآن"
      />
    )

    expect(screen.getByText('مطلوب شيول كتربلر 966')).toBeTruthy()
    expect(screen.getByText('مطلوب معدة')).toBeTruthy()
    expect(screen.queryByTestId('equipment-price-section')).toBeNull()
    expect(screen.queryByText('0')).toBeNull()
    expect(screen.queryByText(/0 ر\.ع/)).toBeNull()
  })
})
