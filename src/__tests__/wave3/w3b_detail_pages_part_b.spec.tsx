import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { ServicePriceHeader } from '../../screens/services/components/ServicePriceHeader'
import { mapBusDetail } from '../../utils/listing-detail/mapBusDetail'
import { stripMarkdown } from '../../utils/listing-detail/stripMarkdown'
import type { BusDetailApi } from '../../types/busDetailApi.types'

describe('D-332 (PR-W3b): Detail Pages Part B Bug Batch', () => {
  it('1. renders "خدمة متنقلة" badge at most once when providerTypeLabel is "خدمة متنقلة" and isHomeService is true', async () => {
    await render(
      <ServicePriceHeader
        title="تغيير زيت متنقل"
        price={{
          amountLabel: '15 ر.ع',
          typeLabel: 'يبدأ من',
          isRange: false,
        }}
        serviceTypeLabel="صيانة دورية"
        providerTypeLabel="خدمة متنقلة"
        isHomeService={true}
        postedAtLabel="منذ ساعة"
        viewCount={42}
      />
    )

    expect(screen.getAllByText('خدمة متنقلة')).toHaveLength(1)
  })

  it('2. removes duplicate "الموقع" section from mapBusDetail().specsSections while keeping vm.location', () => {
    const rawBus: BusDetailApi = {
      id: 'bus-1',
      title: 'حافلة تويوتا كوستر',
      slug: 'toyota-coaster',
      busListingType: 'BUS_SALE',
      busType: 'COASTER',
      make: 'Toyota',
      model: 'Coaster',
      year: 2022,
      capacity: 30,
      price: '18500',
      currency: 'OMR',
      isPriceNegotiable: false,
      withDriver: false,
      whatsappEnabled: false,
      hiddenByOwnerStatus: false,
      isPremium: false,
      viewCount: 0,
      governorateRef: { id: 1, nameAr: 'مسقط' },
      wilayaRef: { id: 10, nameAr: 'السيب' },
      features: [],
      status: 'ACTIVE',
      userId: 'u-1',
      user: {
        id: 'u-1',
        username: 'seller',
        createdAt: '2026-11-15T00:00:00Z',
      },
      version: 1,
      createdAt: '2026-11-15T00:00:00Z',
      updatedAt: '2026-11-15T00:00:00Z',
      images: [],
    }

    const vm = mapBusDetail(rawBus, { isAuthenticated: false, now: new Date('2026-11-15T12:00:00Z') })
    expect(vm.location.fullLocationText).toContain('مسقط')
    expect(vm.specsSections.some((sec) => sec.title === 'الموقع')).toBe(false)
  })

  it('3. renders locationLabel in ServicePriceHeader metaRow when provided', async () => {
    await render(
      <ServicePriceHeader
        title="كهربائي سيارات"
        price={{
          amountLabel: '10 ر.ع',
          typeLabel: 'سعر ثابت',
          isRange: false,
        }}
        serviceTypeLabel="كهرباء"
        postedAtLabel="منذ يوم"
        viewCount={12}
        locationLabel="مسقط، السيب"
      />
    )

    expect(screen.getByText('مسقط، السيب')).toBeTruthy()
  })

  it('4. converts unordered list bullets (- item / * item / + item) to clean bullet "• item" in stripMarkdown', () => {
    const input = '- فحص المحرك\n  * تغيير الفلاتر\n+ وزن الأذرعة'
    expect(stripMarkdown(input)).toBe('• فحص المحرك\n• تغيير الفلاتر\n• وزن الأذرعة')
  })
})
