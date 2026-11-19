import React from 'react'
import { StyleSheet } from 'react-native'
import fs from 'fs'
import path from 'path'
import { act, cleanup, fireEvent, render } from '@testing-library/react-native'
import { CarStep3Details } from '../components/cars/wizard/CarStep3Details'
import { PartStep4Compatibility } from '../components/parts/wizard/PartStep4Compatibility'
import { EquipmentStep3Details } from '../components/equipment/wizard/EquipmentStep3Details'
import { BusStep3Details } from '../components/buses/wizard/BusStep3Details'
import { ServiceStep4Schedule } from '../components/services/wizard/ServiceStep4Schedule'
import { defaultPartFormData } from '../store/partWizardStore'
import { defaultServiceFormData } from '../store/serviceWizardStore'
import { Colors } from '../constants/colors'

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}))

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}))

jest.mock('../api/cars', () => ({
  carsApi: {
    getBrands: jest.fn().mockResolvedValue([{ id: 'b1', name: 'Toyota', nameAr: 'تويوتا' }]),
    getModels: jest.fn().mockResolvedValue([{ id: 'm1', name: 'Camry', nameAr: 'كامري' }]),
    getTrims: jest.fn().mockResolvedValue([]),
  },
}))

jest.mock('../api/buses', () => ({
  busesApi: {
    getManufacturers: jest.fn().mockResolvedValue([{ id: 'man-1', name: 'Toyota', nameAr: 'تويوتا' }]),
    getModels: jest.fn().mockResolvedValue([{ id: 'mod-1', name: 'Coaster', nameAr: 'كوستر' }]),
  },
}))

jest.mock('react-native-modal-datetime-picker', () => {
  const React = require('react')
  const { View } = require('react-native')
  return function MockDateTimePickerModal(props: any) {
    return props.isVisible ? <View testID="mock-time-picker-modal" /> : null
  }
})

describe('D-374: small add/switch buttons, raw text inputs & time pickers glass skin', () => {
  afterEach(async () => {
    await act(async () => {})
    cleanup()
  })

  it('CarStep3Details wraps custom feature row in GlassInputShell and triggers onAddCustomFeature', async () => {
    const onChangeCustomFeatureInput = jest.fn()
    const onAddCustomFeature = jest.fn()
    const view = await render(
      <CarStep3Details
        formData={{
          listingType: 'SALE',
          features: [],
        } as any}
        errors={{}}
        customFeatureInput="كاميرا"
        onChangeCustomFeatureInput={onChangeCustomFeatureInput}
        onToggleFeature={jest.fn()}
        onAddCustomFeature={onAddCustomFeature}
        onRemoveFeature={jest.fn()}
        onUpdateField={jest.fn()}
      />
    )

    const shellLayer = view.getByTestId('glass-input-shell-surface-layers')
    expect(shellLayer).toBeTruthy()

    const input = view.getByPlaceholderText('إضافة ميزة أخرى...')
    await fireEvent.changeText(input, 'مثبت سرعة')
    expect(onChangeCustomFeatureInput).toHaveBeenCalledWith('مثبت سرعة')

    await fireEvent(input, 'submitEditing')
    expect(onAddCustomFeature).toHaveBeenCalledTimes(1)
  })

  it('PartStep4Compatibility wraps custom model row in GlassInputShell and adds custom model', async () => {
    const onUpdateField = jest.fn()
    const view = await render(
      <PartStep4Compatibility
        formData={{
          ...defaultPartFormData,
          compatibleVehicleTypes: ['CAR'],
          compatibleMakes: ['toyota'],
          compatibleModels: [],
        }}
        errors={{}}
        onUpdateField={onUpdateField}
      />
    )

    expect(view.getByTestId('glass-input-shell-surface-layers')).toBeTruthy()
    const input = view.getByTestId('custom-model-input')
    const addBtn = view.getByTestId('add-custom-model-btn')

    await fireEvent.changeText(input, 'Corolla')
    await fireEvent.press(addBtn)
    expect(onUpdateField).toHaveBeenCalledWith('compatibleModels', ['Corolla'])
  })

  it('EquipmentStep3Details disables 46x46 GlassPickerButton addBtn and uses muted border icon when input is empty', async () => {
    const onAddEmpty = jest.fn()
    const emptyView = await render(
      <EquipmentStep3Details
        formData={{ listingType: 'EQUIPMENT_SALE', features: [] } as any}
        errors={{}}
        customFeatureInput="   "
        onChangeCustomFeatureInput={jest.fn()}
        onToggleFeature={jest.fn()}
        onAddCustomFeature={onAddEmpty}
        onRemoveFeature={jest.fn()}
        onUpdateField={jest.fn()}
      />
    )

    const emptySurface = emptyView.getByTestId('glass-picker-button-surface-layers')
    expect(emptySurface).toBeTruthy()
    const btnStyle = StyleSheet.flatten(emptySurface.parent?.props.style)
    expect(btnStyle.width).toBe(46)
    expect(btnStyle.height).toBe(46)
    expect(JSON.stringify(emptyView.toJSON())).toContain(Colors.border)

    await fireEvent.press(emptySurface)
    expect(onAddEmpty).not.toHaveBeenCalled()
  })

  it('EquipmentStep3Details enables 46x46 GlassPickerButton addBtn with turquoise primary icon when input is filled', async () => {
    const onAddFilled = jest.fn()
    const filledView = await render(
      <EquipmentStep3Details
        formData={{ listingType: 'EQUIPMENT_SALE', features: [] } as any}
        errors={{}}
        customFeatureInput="بوم طويل"
        onChangeCustomFeatureInput={jest.fn()}
        onToggleFeature={jest.fn()}
        onAddCustomFeature={onAddFilled}
        onRemoveFeature={jest.fn()}
        onUpdateField={jest.fn()}
      />
    )

    const filledSurface = filledView.getByTestId('glass-picker-button-surface-layers')
    const btnStyle = StyleSheet.flatten(filledSurface.parent?.props.style)
    expect(btnStyle.width).toBe(46)
    expect(btnStyle.height).toBe(46)
    expect(JSON.stringify(filledView.toJSON())).toContain(Colors.primary)

    await fireEvent.press(filledSurface)
    expect(onAddFilled).toHaveBeenCalledTimes(1)
  })

  it('BusStep3Details renders GlassInputShell for custom inputs and GlassPickerButton for اختيار من القائمة', async () => {
    const onUpdateField = jest.fn()
    const view = await render(
      <BusStep3Details
        data={{
          busListingType: 'BUS_SALE',
          busType: 'COASTER',
          make: '',
          model: '',
          manufacturerId: null,
          modelId: null,
          year: '',
          capacity: '',
          condition: 'USED',
          transmission: 'MANUAL',
          fuelType: 'DIESEL',
          mileage: '',
          plateNumber: '',
          features: [],
          price: '',
          currency: 'OMR',
          isPriceNegotiable: false,
          dailyPrice: '',
          monthlyPrice: '',
          withDriver: false,
          contractType: '',
          contractClient: '',
          contractMonthly: '',
          contractDuration: '',
          contractExpiry: null,
          title: '',
          description: '',
          governorateId: null,
          wilayaId: null,
          governorateNameAr: '',
          wilayaNameAr: '',
          latitude: null,
          longitude: null,
          images: [],
          existingImages: [],
          removedImageIds: [],
          whatsappEnabled: false,
        }}
        errors={{}}
        onUpdateField={onUpdateField}
      />
    )

    await fireEvent.press(view.getByTestId('enable-custom-make-btn'))

    const shellLayers = view.getAllByTestId('glass-input-shell-surface-layers')
    expect(shellLayers.length).toBe(2)

    const makeShellStyle = StyleSheet.flatten(shellLayers[0].parent?.props.style)
    expect(makeShellStyle.borderColor).toBe(Colors.primary)
    expect(makeShellStyle.borderWidth).toBe(1.5)

    expect(view.getByTestId('custom-make-input')).toBeTruthy()
    expect(view.getByTestId('custom-model-input')).toBeTruthy()

    const switchBtnLabel = view.getByText('اختيار من القائمة')
    await fireEvent.press(switchBtnLabel)
    expect(onUpdateField).toHaveBeenCalledWith('make', '')
    expect(onUpdateField).toHaveBeenCalledWith('manufacturerId', null)
    expect(view.queryByTestId('custom-make-input')).toBeNull()
  })

  it('ServiceStep4Schedule renders GlassPickerButton for open/close time buttons with justifyContent flex-start and preserves handlers', async () => {
    const onUpdateField = jest.fn()
    const view = await render(
      <ServiceStep4Schedule
        formData={{
          ...defaultServiceFormData,
          workingHoursOpen: '08:00',
          workingHoursClose: '20:00',
        }}
        errors={{}}
        onUpdateField={onUpdateField}
      />
    )

    expect(view.getByTestId('open-time-btn-glass-layers')).toBeTruthy()
    expect(view.getByTestId('close-time-btn-glass-layers')).toBeTruthy()

    const openStyle = StyleSheet.flatten(view.getByTestId('open-time-btn').props.style)
    expect(openStyle.justifyContent).toBe('flex-start')
    expect(openStyle.height).toBe(48)

    const closeStyle = StyleSheet.flatten(view.getByTestId('close-time-btn').props.style)
    expect(closeStyle.justifyContent).toBe('flex-start')
    expect(closeStyle.height).toBe(48)

    await fireEvent.press(view.getByTestId('open-time-btn'))
    expect(view.getByTestId('mock-time-picker-modal')).toBeTruthy()

    await fireEvent.press(view.getByTestId('clear-open-time'))
    expect(onUpdateField).toHaveBeenCalledWith('workingHoursOpen', null)

    await fireEvent.press(view.getByTestId('clear-close-time'))
    expect(onUpdateField).toHaveBeenCalledWith('workingHoursClose', null)
  })

  it('wires GlassInputShell / GlassPickerButton cleanly and removes dead Pressable & addBtnDisabled', () => {
    const read = (rel: string) =>
      fs.readFileSync(path.resolve(__dirname, '..', 'components', rel), 'utf8')

    expect(read('cars/wizard/CarStep3Details.tsx')).toContain('GlassInputShell')
    expect(read('parts/wizard/PartStep4Compatibility.tsx')).toContain('GlassInputShell')
    const busSrc = read('buses/wizard/BusStep3Details.tsx')
    expect(busSrc).toContain('GlassInputShell')
    expect(busSrc).toContain('GlassPickerButton')
    const eqSrc = read('equipment/wizard/EquipmentStep3Details.tsx')
    expect(eqSrc).toContain('GlassPickerButton')
    expect(eqSrc).not.toContain('addBtnDisabled')
    const svcSrc = read('services/wizard/ServiceStep4Schedule.tsx')
    expect(svcSrc).toContain('GlassPickerButton')
    expect(svcSrc).not.toContain('Pressable')
  })
})
