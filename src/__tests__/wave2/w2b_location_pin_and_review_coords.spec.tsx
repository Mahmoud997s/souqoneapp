import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import * as Location from 'expo-location'
import { MapLocationPicker } from '../../components/ui/MapLocationPicker'
import { CarStep5Review } from '../../components/cars/wizard/CarStep5Review'
import { BusStep6Review } from '../../components/buses/wizard/BusStep6Review'
import { EquipmentStep5Review } from '../../components/equipment/wizard/EquipmentStep5Review'
import { PartStep6Review } from '../../components/parts/wizard/PartStep6Review'
import { ServiceStep6Review } from '../../components/services/wizard/ServiceStep6Review'

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(async () => ({
    coords: { latitude: 29.9884, longitude: 31.3086 },
  })),
  Accuracy: { Balanced: 3 },
}))

jest.mock('../../components/ui/Map', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    __esModule: true,
    default: (props: any) => <View testID="mock-map-view" {...props} />,
  }
})

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: any) => children,
}))

jest.mock('@expo/vector-icons', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    Ionicons: (props: any) => <View {...props} />,
    MaterialCommunityIcons: (props: any) => <View {...props} />,
  }
})

jest.mock('../../components/ui/WizardReviewCard', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    WizardReviewCard: ({ children }: any) => <View>{children}</View>,
    WizardReviewContactRow: () => null,
    ReviewMediaGallery: () => null,
    ReviewHeroBanner: () => null,
  }
})

describe('Wave 2b (1.10 / P1-07): Location Pin Center & Hide Raw Coords', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('MapLocationPicker starts on chosen governorate/wilaya (شمال الباطنة - صحار), does NOT auto-fetch GPS, allows drag/confirm, and hides raw toFixed(4)', async () => {
    const onConfirm = jest.fn()
    const pickerProps: any = {
      isVisible: true,
      onClose: jest.fn(),
      onConfirm,
      governorate: 'شمال الباطنة',
      wilaya: 'صحار',
    }
    const { getByTestId, getByText, queryByText } = await render(
      <MapLocationPicker {...pickerProps} />
    )

    expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled()

    const mapView = getByTestId('mock-map-view')
    expect(mapView.props.region.latitude).toBeCloseTo(24.3461, 1)
    expect(mapView.props.region.longitude).toBeCloseTo(56.7075, 1)

    expect(queryByText(/24\.3461|56\.7075|29\.9884|31\.3086/)).toBeNull()

    await fireEvent(mapView, 'onRegionChangeComplete', {
      latitude: 24.3612,
      longitude: 56.7299,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    })

    expect(queryByText(/24\.3612|56\.7299/)).toBeNull()

    await fireEvent.press(getByText('تأكيد وتثبيت الموقع'))
    expect(onConfirm).toHaveBeenCalledWith(24.3612, 56.7299)
  })

  it('Review screens do NOT display raw lat/lng toFixed(4) coordinates', async () => {
    const sampleCoords = { latitude: 29.9884, longitude: 31.3086 }

    const { queryByText: qCar } = await render(
      <CarStep5Review
        formData={{
          listingType: 'SALE',
          brand: 'تويوتا',
          model: 'كامري',
          year: '2022',
          price: '5000',
          isPriceNegotiable: false,
          mileage: '50000',
          fuelType: 'PETROL',
          transmission: 'AUTOMATIC',
          bodyType: 'SEDAN',
          exteriorColor: 'أبيض',
          condition: 'USED',
          governorateName: 'شمال الباطنة',
          wilayaName: 'صحار',
          features: [],
          images: [],
          ...sampleCoords,
        } as any}
        onEditStep={jest.fn()}
      />
    )
    expect(qCar(/29\.9884|31\.3086/)).toBeNull()

    const { queryByText: qBus } = await render(
      <BusStep6Review
        data={{
          listingType: 'SALE',
          manufacturer: 'تويوتا',
          model: 'كوستر',
          year: 2022,
          price: 12000,
          isPriceNegotiable: false,
          governorateNameAr: 'شمال الباطنة',
          wilayaNameAr: 'صحار',
          amenities: [],
          features: [],
          images: [],
          ...sampleCoords,
        } as any}
        onEditStep={jest.fn()}
      />
    )
    expect(qBus(/29\.9884|31\.3086/)).toBeNull()

    const { queryByText: qEquip } = await render(
      <EquipmentStep5Review
        formData={{
          listingType: 'SALE',
          equipmentType: 'حفار',
          brand: 'كاتربيلر',
          year: '2021',
          price: '15000',
          isPriceNegotiable: false,
          governorateName: 'شمال الباطنة',
          wilayaName: 'صحار',
          features: [],
          images: [],
          ...sampleCoords,
        } as any}
        onEditStep={jest.fn()}
      />
    )
    expect(qEquip(/29\.9884|31\.3086/)).toBeNull()

    const { queryByText: qPart } = await render(
      <PartStep6Review
        formData={{
          listingType: 'SALE',
          title: 'بطارية',
          price: 45,
          isPriceNegotiable: false,
          governorateNameAr: 'شمال الباطنة',
          wilayaNameAr: 'صحار',
          compatibleVehicleTypes: [],
          compatibleMakes: [],
          compatibleModels: [],
          images: [],
          ...sampleCoords,
        } as any}
        onEditStep={jest.fn()}
        brands={[]}
      />
    )
    expect(qPart(/29\.9884|31\.3086/)).toBeNull()

    const { queryByText: qService } = await render(
      <ServiceStep6Review
        formData={{
          title: 'صيانة',
          price: '20',
          governorateNameAr: 'شمال الباطنة',
          wilayaNameAr: 'صحار',
          serviceTypes: [],
          workingDays: [],
          images: [],
          ...sampleCoords,
        } as any}
        onEditStep={jest.fn()}
      />
    )
    expect(qService(/29\.9884|31\.3086/)).toBeNull()
  })
})
