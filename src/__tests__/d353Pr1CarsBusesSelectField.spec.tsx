import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { CarStep1Type } from '../components/cars/wizard/CarStep1Type'
import { BusStep1TypeCategory } from '../components/buses/wizard/BusStep1TypeCategory'
import { BusStep3Details } from '../components/buses/wizard/BusStep3Details'
import { BusStep4Pricing } from '../components/buses/wizard/BusStep4Pricing'

jest.setTimeout(20000)

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}))

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}))

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}))

jest.mock('../api/buses', () => ({
  busesApi: {
    getManufacturers: jest.fn().mockResolvedValue([]),
    getModels: jest.fn().mockResolvedValue([]),
  },
}))

jest.mock('../components/ui/GovernorateWilayaSelect', () => ({
  GovernorateWilayaSelect: () => null,
}))

describe('D-353 PR 1: Cars & Buses WizardSelectField adoption', () => {
  it('CarStep1Type uses inline WizardSelectField for listingType without group headers', async () => {
    const onUpdateField = jest.fn()
    const { getByTestId, getByText } = await render(
      <CarStep1Type
        formData={{ listingType: 'SALE', title: '', description: '' } as any}
        errors={{}}
        onUpdateField={onUpdateField}
      />
    )

    const select = getByTestId('car-listing-type-select')
    expect(select.props.accessibilityState).toEqual(expect.objectContaining({ expanded: false }))
    expect(getByText('للبيع')).toBeTruthy()

    await fireEvent.press(select)
    await fireEvent.press(getByTestId('listing-type-RENTAL'))
    expect(onUpdateField).toHaveBeenCalledWith('listingType', 'RENTAL')
  })

  it('BusStep1TypeCategory uses inline WizardSelectField for busListingType and busType', async () => {
    const onUpdateField = jest.fn()
    const { getByTestId, getByText } = await render(
      <BusStep1TypeCategory
        data={{ busListingType: 'BUS_SALE', busType: 'LARGE_BUS' } as any}
        errors={{}}
        onUpdateField={onUpdateField}
      />
    )

    expect(getByText('للبيع')).toBeTruthy()
    expect(getByText('حافلة كبيرة')).toBeTruthy()

    await fireEvent.press(getByTestId('bus-listing-type-select'))
    await fireEvent.press(getByTestId('listing-type-BUS_RENT'))
    expect(onUpdateField).toHaveBeenCalledWith('busListingType', 'BUS_RENT')

    await fireEvent.press(getByTestId('bus-type-select'))
    await fireEvent.press(getByTestId('bus-type-COASTER'))
    expect(onUpdateField).toHaveBeenCalledWith('busType', 'COASTER')
  })

  it('BusStep3Details uses inline WizardSelectField for fuelType (4 options)', async () => {
    const onUpdateField = jest.fn()
    const { getByTestId, getByText } = await render(
      <BusStep3Details
        data={{
          make: '',
          model: '',
          manufacturerId: null,
          modelId: null,
          year: '2022',
          capacity: '50',
          transmission: 'MANUAL',
          fuelType: 'DIESEL',
          condition: 'USED',
          features: [],
        } as any}
        errors={{}}
        onUpdateField={onUpdateField}
      />
    )

    expect(getByText('ديزل')).toBeTruthy()
    await fireEvent.press(getByTestId('bus-fuel-type-select'))
    await fireEvent.press(getByTestId('fuel-ELECTRIC'))
    expect(onUpdateField).toHaveBeenCalledWith('fuelType', 'ELECTRIC')
  })

  it('BusStep4Pricing uses inline WizardSelectField for contractType (5 options)', async () => {
    const onUpdateField = jest.fn()
    const { getByTestId, getByText } = await render(
      <BusStep4Pricing
        data={{
          busListingType: 'BUS_SALE_WITH_CONTRACT',
          price: '12000',
          isPriceNegotiable: false,
          condition: 'USED',
          contractType: 'COMPANY',
          contractClient: '',
          contractMonthly: '',
          contractDuration: '',
          title: '',
          description: '',
          governorateId: null,
          wilayaId: null,
        } as any}
        errors={{}}
        onUpdateField={onUpdateField}
      />
    )

    expect(getByText('نقل موظفين')).toBeTruthy()
    await fireEvent.press(getByTestId('bus-contract-type-select'))
    await fireEvent.press(getByTestId('contract-type-chip-GOVERNMENT'))
    expect(onUpdateField).toHaveBeenCalledWith('contractType', 'GOVERNMENT')
  })
})
