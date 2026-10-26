import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
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

  it('renders "السعر عند التواصل" and never "0 ر.ع" when SALE listing has price 0 or null price', async () => {
    const noPriceSale: PriceView = {
      amount: 0,
      formattedAmount: '0',
      currency: 'ر.ع',
      fullPriceLabel: 'السعر عند التواصل',
      isNegotiable: false,
      listingType: 'SALE',
    }

    await render(
      <EquipmentHeaderBlock
        title="حفار كوماتسو بدون سعر"
        kindLabel="للبيع"
        price={noPriceSale}
        isWanted={false}
        isRental={false}
        operatorBadge={null}
        locationText="مسقط"
        postedAtLabel="الآن"
      />
    )

    expect(screen.getByText('السعر عند التواصل')).toBeTruthy()
    expect(screen.queryByText('0')).toBeNull()
    expect(screen.queryByText(/0 ر\.ع/)).toBeNull()
  })

  it('renders "السعر عند التواصل" when RENT listing has no daily or monthly rates', async () => {
    const noRateRent: PriceView = {
      amount: 0,
      formattedAmount: '0',
      currency: 'ر.ع',
      fullPriceLabel: 'السعر عند التواصل',
      isNegotiable: false,
      listingType: 'RENTAL',
    }

    await render(
      <EquipmentHeaderBlock
        title="بوبكات للإيجار بدون تسعيرة"
        kindLabel="للإيجار"
        price={noRateRent}
        isWanted={false}
        isRental={true}
        operatorBadge={null}
        locationText="صلالة"
        postedAtLabel="الآن"
      />
    )

    expect(screen.getByText('السعر عند التواصل')).toBeTruthy()
    expect(screen.queryByText('0')).toBeNull()
    expect(screen.queryByText(/0 ر\.ع/)).toBeNull()
  })

  it('matches cars price block style parity (rate chip one line, card background, font family)', async () => {
    const rentPrice: PriceView = {
      amount: 100,
      formattedAmount: '100',
      currency: 'ر.ع',
      fullPriceLabel: '100 ر.ع / يوم',
      dailyRate: { amount: 100, formatted: '100', label: '100 ر.ع / يوم' },
      monthlyRate: { amount: 2000, formatted: '2,000', label: '2,000 ر.ع / شهر' },
      isNegotiable: true,
      listingType: 'RENTAL',
    }

    await render(
      <EquipmentHeaderBlock
        title="بوبكات للإيجار"
        kindLabel="للإيجار"
        price={rentPrice}
        isWanted={false}
        isRental={true}
        operatorBadge={null}
        locationText="صحار"
        postedAtLabel="منذ ساعة"
      />
    )

    const dailyText = screen.getByText('100 ر.ع / يوم')
    expect(dailyText.props.numberOfLines).toBe(1)
    expect(dailyText.props.adjustsFontSizeToFit).toBe(true)

    const priceSection = screen.getByTestId('equipment-price-section')
    const flatPriceSectionStyle = StyleSheet.flatten(priceSection.props.style)
    expect(flatPriceSectionStyle.backgroundColor).toBe(Colors.paleMint)
    expect(flatPriceSectionStyle.borderRadius).toBe(Radius.lg)

    const flatDailyStyle = StyleSheet.flatten(dailyText.props.style)
    expect(flatDailyStyle.fontSize).toBe(15)
    expect(flatDailyStyle.fontFamily).toBe('Almarai_800ExtraBold')
  })
})
