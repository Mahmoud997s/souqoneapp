import React from 'react'
import * as fs from 'fs'
import * as path from 'path'
import { Linking, StyleSheet } from 'react-native'
import { render, fireEvent } from '@testing-library/react-native'
import { DetailLocationMap } from '../components/listing-detail/DetailLocationMap'
import { OwnerManageBar, type OwnerActionId } from '../components/listing-detail/OwnerManageBar'
import { ListingHeaderBlock } from '../components/listing-detail/ListingHeaderBlock'
import { EquipmentHeaderBlock } from '../components/equipment/detail/EquipmentHeaderBlock'
import { ServicePriceHeader } from '../screens/services/components/ServicePriceHeader'
import { ServiceSpecializations } from '../screens/services/components/ServiceSpecializations'
import { normalizeArabicIndicDigits } from '../utils/numberFormat'
import { Spacing } from '../constants/spacing'
import type { PriceView } from '../types/listingDetail.types'

jest.mock('../components/ui/Map', () => {
  const ReactLib = require('react')
  const { View } = require('react-native')
  const MockMapView = ({ children, ...props }: any) =>
    ReactLib.createElement(View, { testID: 'mock-map-view', ...props }, children)
  const MockMarker = (props: any) =>
    ReactLib.createElement(View, { testID: 'mock-map-marker', ...props })
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
  }
})

jest.mock('@expo/vector-icons', () => {
  const ReactLib = require('react')
  const { Text } = require('react-native')
  return {
    Ionicons: ({ name }: { name: string }) => ReactLib.createElement(Text, null, name),
  }
})

jest.mock('../utils/scheduleIdleTask', () => ({
  scheduleIdleTask: (cb: () => void) => {
    cb()
    return { cancel: jest.fn() }
  },
}))

const ROOT = path.resolve(__dirname, '../..')

const samplePrice: PriceView = {
  amount: 4500,
  formattedAmount: '4,500',
  currency: 'ر.ع.',
  fullPriceLabel: '4,500 ر.ع.',
  isNegotiable: false,
  listingType: 'SALE',
}

const sampleOwnerActions: Array<{
  id: OwnerActionId
  label: string
  tone: 'neutral' | 'danger' | 'primary'
  icon: string
}> = [
  { id: 'edit', label: 'تعديل', tone: 'neutral', icon: 'create-outline' },
  { id: 'markSold', label: 'تم البيع', tone: 'primary', icon: 'checkmark-circle-outline' },
]

describe('D-385: DetailLocationMap unification & detail-page fixes', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('1. Shared DetailLocationMap (Cars design)', () => {
    it('renders map title, container, MapView + Marker, and opens Google Maps directions URL when valid coordinates exist', async () => {
      const openUrlSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any)
      const view = await render(
        <DetailLocationMap latitude={23.588} longitude={58.3829} isMapMounted />,
      )

      expect(view.getByText('الموقع والعنوان')).toBeTruthy()
      expect(view.getByTestId('detail-location-map')).toBeTruthy()
      expect(view.getByTestId('detail-location-map-container')).toBeTruthy()
      expect(view.getByTestId('mock-map-view')).toBeTruthy()
      expect(view.getByTestId('mock-map-marker')).toBeTruthy()

      const dirBtn = view.getByTestId('detail-location-map-directions-btn')
      expect(view.getByText('الحصول على الاتجاهات')).toBeTruthy()
      fireEvent.press(dirBtn)
      expect(openUrlSpy).toHaveBeenCalledWith(
        'https://www.google.com/maps/dir/?api=1&destination=23.588,58.3829',
      )
    })

    it('renders nothing when coordinates are missing', async () => {
      const view = await render(<DetailLocationMap />)
      expect(view.queryByTestId('detail-location-map')).toBeNull()
    })

    it('renders nothing when coordinates are (0, 0)', async () => {
      const view = await render(<DetailLocationMap latitude={0} longitude={0} />)
      expect(view.queryByTestId('detail-location-map')).toBeNull()
    })

    it('renders nothing when coordinates are non-finite', async () => {
      const view = await render(<DetailLocationMap latitude={NaN} longitude={58.3} />)
      expect(view.queryByTestId('detail-location-map')).toBeNull()
    })

    it('wires DetailLocationMap into all 5 main detail screens, removes BusLocationMapSection, and leaves Operators untouched', () => {
      const mainScreens = [
        'src/screens/cars/CarDetailScreen.tsx',
        'src/screens/buses/BusDetailScreen.tsx',
        'src/screens/equipment/EquipmentDetailScreen.tsx',
        'src/screens/parts/PartDetailScreen.tsx',
        'src/screens/services/ServiceDetailScreen.tsx',
      ]

      for (const rel of mainScreens) {
        const src = fs.readFileSync(path.join(ROOT, rel), 'utf8')
        expect(src).toContain('DetailLocationMap')
        expect(src).not.toMatch(/import\s+.*LocationCard/)
        expect(src).not.toMatch(/import\s+.*BusLocationMapSection/)
      }

      // Dead component deleted
      expect(
        fs.existsSync(path.join(ROOT, 'src/components/buses/detail/BusLocationMapSection.tsx')),
      ).toBe(false)

      // Operators untouched (still uses LocationCard)
      const operatorSrc = fs.readFileSync(
        path.join(ROOT, 'src/screens/operators/OperatorDetailScreen.tsx'),
        'utf8',
      )
      expect(operatorSrc).toContain('LocationCard')
      expect(operatorSrc).not.toContain('DetailLocationMap')
    })
  })

  describe('2. OwnerManageBar: duplicate view-count badge removed', () => {
    it('never renders view count badge in inline variant even when viewCount is passed', async () => {
      const view = await render(
        <OwnerManageBar
          variant="inline"
          viewCount={420}
          busy={false}
          actions={sampleOwnerActions}
          onAction={jest.fn()}
        />,
      )
      expect(view.queryByText(/مشاهدة/)).toBeNull()
      expect(view.queryByText('420')).toBeNull()
      expect(view.getByText('أنت مالك هذا الإعلان')).toBeTruthy()
    })

    it('never renders view count badge in sticky variant even when viewCount is passed', async () => {
      const view = await render(
        <OwnerManageBar
          variant="sticky"
          viewCount={420}
          busy={false}
          actions={sampleOwnerActions}
          onAction={jest.fn()}
        />,
      )
      expect(view.queryByText(/مشاهدة/)).toBeNull()
      expect(view.queryByText('420')).toBeNull()
    })
  })

  describe('3. Services detail fixes (mobile chip dedupe & specializations spacing)', () => {
    it('renders "خدمة متنقلة" chip exactly once when providerTypeLabel is "خدمة متنقلة" and isHomeService is true', async () => {
      const view = await render(
        <ServicePriceHeader
          title="صيانة متنقلة"
          price={{ amountLabel: '25 ر.ع.', isRange: false }}
          serviceTypeLabel="صيانة"
          providerTypeLabel="خدمة متنقلة"
          isHomeService={true}
          postedAtLabel="منذ ساعة"
          viewCount={12}
        />,
      )
      expect(view.getAllByText('خدمة متنقلة')).toHaveLength(1)
    })

    it('renders "خدمة متنقلة" chip exactly once when providerTypeLabel is "MOBILE" and isHomeService is true', async () => {
      const view = await render(
        <ServicePriceHeader
          title="صيانة متنقلة"
          price={{ amountLabel: '25 ر.ع.', isRange: false }}
          serviceTypeLabel="صيانة"
          providerTypeLabel="MOBILE"
          isHomeService={true}
          postedAtLabel="منذ ساعة"
          viewCount={12}
        />,
      )
      expect(view.getAllByText('خدمة متنقلة')).toHaveLength(1)
    })

    it('applies Spacing.space4 gap between title and specializations chips row', async () => {
      const view = await render(
        <ServiceSpecializations specializations={['ميكانيكا', 'كهرباء']} />,
      )
      const card = view.getByTestId('service-specializations-card')
      const flat = StyleSheet.flatten(card.props.style)
      expect(flat.gap).toBe(Spacing.space4)
    })
  })

  describe('4. Address Arabic-Indic digit normalization -> Latin digits', () => {
    it('converts Arabic-Indic (٠-٩) and Extended Arabic-Indic (۰-۹) digits to ASCII 0-9', () => {
      expect(normalizeArabicIndicDigits('شارع ٨، المعبيلة ١٢')).toBe('شارع 8، المعبيلة 12')
      expect(normalizeArabicIndicDigits('مبنى ۴۵، طابق ۲')).toBe('مبنى 45، طابق 2')
      expect(normalizeArabicIndicDigits('مسقط، السيب')).toBe('مسقط، السيب')
    })

    it('normalizes location text in ListingHeaderBlock', async () => {
      const view = await render(
        <ListingHeaderBlock
          title="تويوتا كامري"
          kindLabel="للبيع"
          price={samplePrice}
          locationText="شارع ٨، المعبيلة ١٢"
          postedAtLabel="اليوم"
        />,
      )
      expect(view.getByText('شارع 8، المعبيلة 12')).toBeTruthy()
    })

    it('normalizes location text in EquipmentHeaderBlock', async () => {
      const view = await render(
        <EquipmentHeaderBlock
          title="حفارة كاتربيلر"
          kindLabel="للبيع"
          price={samplePrice}
          isWanted={false}
          isRental={false}
          operatorBadge={null}
          locationText="المنطقة الصناعية ٣، صحار ٩"
          postedAtLabel="اليوم"
        />,
      )
      expect(view.getByText('المنطقة الصناعية 3، صحار 9')).toBeTruthy()
    })

    it('normalizes location text in ServicePriceHeader', async () => {
      const view = await render(
        <ServicePriceHeader
          title="كراج النخبة"
          price={{ amountLabel: '15 ر.ع.', isRange: false }}
          serviceTypeLabel="صيانة"
          postedAtLabel="منذ يومين"
          viewCount={10}
          locationLabel="المعبيلة الصناعية، شارع ٧"
        />,
      )
      expect(view.getByText('المعبيلة الصناعية، شارع 7')).toBeTruthy()
    })
  })
})
