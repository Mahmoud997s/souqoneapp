import React from 'react'
import fs from 'fs'
import path from 'path'
import { act, fireEvent, render } from '@testing-library/react-native'
import { CarStep4Location } from '../components/cars/wizard/CarStep4Location'
import { BusStep5Location } from '../components/buses/wizard/BusStep5Location'
import { EquipmentStep4Location } from '../components/equipment/wizard/EquipmentStep4Location'
import { PartStep5Pricing } from '../components/parts/wizard/PartStep5Pricing'
import { ServiceStep5Pricing } from '../components/services/wizard/ServiceStep5Pricing'

jest.mock('../components/ui/GovernorateWilayaSelect', () => ({
  GovernorateWilayaSelect: () => null,
}))

jest.mock('../components/ui/WhatsappToggle', () => ({
  WhatsappToggle: () => null,
}))

jest.mock('../components/ui/MapLocationPicker', () => {
  const { View } = require('react-native')
  return {
    MapLocationPicker: ({ isVisible }: { isVisible: boolean }) =>
      isVisible ? <View testID="mock-map-location-picker" /> : null,
  }
})

type StepEntry = {
  name: string
  file: string
  hasBusProps?: boolean
  renderStep: (hasCoords: boolean, onUpdateField: jest.Mock) => React.ReactElement
}

const BASE_CAR_DATA = {
  governorateId: 1,
  wilayaId: 10,
  whatsappEnabled: false,
  cancellationPolicy: 'FLEXIBLE',
} as any

const BASE_BUS_DATA = {
  governorateId: 1,
  wilayaId: 10,
  whatsappEnabled: false,
} as any

const BASE_EQUIP_DATA = {
  governorateId: 1,
  wilayaId: 10,
  whatsappEnabled: false,
} as any

const BASE_PART_DATA = {
  price: '25',
  governorateId: 1,
  wilayaId: 10,
  whatsappEnabled: false,
} as any

const BASE_SERVICE_DATA = {
  price: '30',
  governorateId: 1,
  wilayaId: 10,
  whatsappEnabled: false,
} as any

const STEPS: StepEntry[] = [
  {
    name: 'CarStep4Location',
    file: 'cars/wizard/CarStep4Location.tsx',
    renderStep: (hasCoords, onUpdateField) => (
      <CarStep4Location
        formData={{
          ...BASE_CAR_DATA,
          latitude: hasCoords ? 23.588 : null,
          longitude: hasCoords ? 58.382 : null,
        }}
        errors={{}}
        onUpdateField={onUpdateField}
        onLocationChange={jest.fn()}
      />
    ),
  },
  {
    name: 'BusStep5Location',
    file: 'buses/wizard/BusStep5Location.tsx',
    renderStep: (hasCoords, onUpdateField) => (
      <BusStep5Location
        data={{
          ...BASE_BUS_DATA,
          latitude: hasCoords ? 23.588 : null,
          longitude: hasCoords ? 58.382 : null,
        }}
        errors={{}}
        onUpdateField={onUpdateField}
        onLocationChange={jest.fn()}
      />
    ),
  },
  {
    name: 'EquipmentStep4Location',
    file: 'equipment/wizard/EquipmentStep4Location.tsx',
    renderStep: (hasCoords, onUpdateField) => (
      <EquipmentStep4Location
        formData={{
          ...BASE_EQUIP_DATA,
          latitude: hasCoords ? 23.588 : null,
          longitude: hasCoords ? 58.382 : null,
        }}
        errors={{}}
        onUpdateField={onUpdateField}
        onLocationChange={jest.fn()}
      />
    ),
  },
  {
    name: 'PartStep5Pricing',
    file: 'parts/wizard/PartStep5Pricing.tsx',
    renderStep: (hasCoords, onUpdateField) => (
      <PartStep5Pricing
        formData={{
          ...BASE_PART_DATA,
          latitude: hasCoords ? 23.588 : null,
          longitude: hasCoords ? 58.382 : null,
        }}
        errors={{}}
        onUpdateField={onUpdateField}
        onLocationChange={jest.fn()}
      />
    ),
  },
  {
    name: 'ServiceStep5Pricing',
    file: 'services/wizard/ServiceStep5Pricing.tsx',
    renderStep: (hasCoords, onUpdateField) => (
      <ServiceStep5Pricing
        formData={{
          ...BASE_SERVICE_DATA,
          latitude: hasCoords ? 23.588 : null,
          longitude: hasCoords ? 58.382 : null,
        }}
        errors={{}}
        onUpdateField={onUpdateField}
        onLocationChange={jest.fn()}
      />
    ),
  },
]

describe('D-373: map buttons in all 5 location steps use GlassPickerButton', () => {
  it.each(STEPS)(
    '$name: trigger button renders glass surface and opens map modal',
    async ({ renderStep }) => {
      const onUpdateField = jest.fn()
      const view = await render(renderStep(false, onUpdateField))

      const glassLayers = view.getAllByTestId(/-layers$/)
      expect(glassLayers.length).toBeGreaterThanOrEqual(1)

      const triggerLabel = view.getByText(/تحديد موقع.*على الخريطة|تحديد الموقع بدقة على الخريطة/)
      await act(async () => {
        fireEvent.press(triggerLabel)
      })
      expect(view.getByTestId('mock-map-location-picker')).toBeTruthy()
    }
  )

  it.each(STEPS)(
    '$name: edit and clear buttons render glass surfaces and preserve handlers',
    async ({ renderStep }) => {
      const onUpdateField = jest.fn()
      const view = await render(renderStep(true, onUpdateField))

      const glassLayers = view.getAllByTestId(/-layers$/)
      expect(glassLayers.length).toBeGreaterThanOrEqual(2)

      await act(async () => {
        fireEvent.press(view.getByText('تعديل على الخريطة'))
      })
      expect(view.getByTestId('mock-map-location-picker')).toBeTruthy()

      await act(async () => {
        fireEvent.press(view.getByText('إلغاء الإحداثيات'))
      })
      expect(onUpdateField).toHaveBeenCalledWith('latitude', null)
      expect(onUpdateField).toHaveBeenCalledWith('longitude', null)
    }
  )

  it('removes TouchableOpacity from all 5 location step files', () => {
    for (const step of STEPS) {
      const src = fs.readFileSync(
        path.resolve(__dirname, '..', 'components', step.file),
        'utf8'
      )
      expect(src).toContain('GlassPickerButton')
      expect(src).not.toContain('TouchableOpacity')
    }
  })
})
