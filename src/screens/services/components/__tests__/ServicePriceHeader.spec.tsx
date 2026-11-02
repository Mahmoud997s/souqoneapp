import React from 'react'
import { StyleSheet } from 'react-native'
import { render, screen } from '@testing-library/react-native'
import { ServicePriceHeader } from '../ServicePriceHeader'
import type { ServicePriceViewModel } from '../../../../types/serviceDetailViewModel.types'
import { Colors } from '../../../../constants/colors'

jest.setTimeout(15000)

describe('ServicePriceHeader', () => {
  const samplePrice: ServicePriceViewModel = {
    amountLabel: '15 - 45 ر.ع.',
    typeLabel: 'نطاق الأسعار المتوقع',
    isRange: true,
    formattedRange: '15 - 45 ر.ع.',
  }

  it('renders full header with all badges, provider name, and price range', async () => {
    await render(
      <ServicePriceHeader
        title="كراج النخبة لصيانة وتعديل السيارات"
        price={samplePrice}
        serviceTypeLabel="صيانة ميكانيكية"
        providerTypeLabel="كراج / ورشة معتمدة"
        providerName="كراج النخبة ش.م.م"
        isHomeService={true}
        postedAtLabel="منذ يومين"
        viewCount={1250}
      />,
    )

    expect(screen.getByTestId('service-price-header')).toBeTruthy()
    expect(screen.getByText('كراج النخبة لصيانة وتعديل السيارات')).toBeTruthy()
    expect(screen.getByText('صيانة ميكانيكية')).toBeTruthy()
    expect(screen.getByText('كراج / ورشة معتمدة')).toBeTruthy()
    expect(screen.getByText('خدمة متنقلة')).toBeTruthy()

    expect(screen.getByText('كراج النخبة ش.م.م')).toBeTruthy()
    expect(screen.getByText('مقدم الخدمة:')).toBeTruthy()

    expect(screen.getByText('نطاق الأسعار المتوقع')).toBeTruthy()
    expect(screen.getByText('15 - 45 ر.ع.')).toBeTruthy()

    expect(screen.getByText('منذ يومين')).toBeTruthy()
    expect(screen.getByText('1,250 مشاهدة')).toBeTruthy()
  })

  it('renders minimal header without optional badges and provider name', async () => {
    const minimalPrice: ServicePriceViewModel = {
      amountLabel: 'السعر يبدأ من 20 ر.ع.',
      typeLabel: 'السعر يبدأ من',
      isRange: false,
    }

    await render(
      <ServicePriceHeader
        title="خدمة تلميع سيارات"
        price={minimalPrice}
        serviceTypeLabel="تلميع وتنظيف"
        isHomeService={false}
        postedAtLabel="اليوم"
        viewCount={42}
      />,
    )

    expect(screen.getByText('خدمة تلميع سيارات')).toBeTruthy()
    expect(screen.getByText('تلميع وتنظيف')).toBeTruthy()
    expect(screen.queryByText('كراج / ورشة معتمدة')).toBeNull()
    expect(screen.queryByText('خدمة متنقلة')).toBeNull()
    expect(screen.queryByText('مقدم الخدمة:')).toBeNull()

    expect(screen.getByText('السعر يبدأ من 20 ر.ع.')).toBeTruthy()
    expect(screen.getByText('42 مشاهدة')).toBeTruthy()
  })

  describe('Visual Alignment with ListingHeaderBlock (D-170b)', () => {
    it('uses Colors.white container background and paleMint price box (Req c)', async () => {
      await render(
        <ServicePriceHeader
          title="كراج النخبة"
          price={samplePrice}
          serviceTypeLabel="صيانة"
          providerName="كراج النخبة"
          postedAtLabel="اليوم"
          viewCount={10}
        />,
      )

      const header = screen.getByTestId('service-price-header')
      const headerStyle = StyleSheet.flatten(header.props.style)
      expect(headerStyle.backgroundColor).toBe(Colors.white)

      const priceBox = screen.getByTestId('service-price-box')
      const priceBoxStyle = StyleSheet.flatten(priceBox.props.style)
      expect(priceBoxStyle.backgroundColor).toBe(Colors.paleMint)
      expect(priceBoxStyle.borderWidth).toBe(1)

      const providerBox = screen.getByTestId('service-provider-box')
      const providerBoxStyle = StyleSheet.flatten(providerBox.props.style)
      expect(providerBoxStyle.borderWidth).toBe(1)
      expect(providerBoxStyle.borderColor).toBe(Colors.border)
    })
  })
})
