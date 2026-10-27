import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { ServicePriceHeader } from '../ServicePriceHeader'
import type { ServicePriceViewModel } from '../../../../types/serviceDetailViewModel.types'

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
})
