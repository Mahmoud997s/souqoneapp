import React from 'react'
import { render, fireEvent, cleanup, screen, act } from '@testing-library/react-native'
import { CarStep2Images } from '../../components/cars/wizard/CarStep2Images'
import { BusStep2Images } from '../../components/buses/wizard/BusStep2Images'
import { PartStep2Images } from '../../components/parts/wizard/PartStep2Images'
import { ServiceStep2Images } from '../../components/services/wizard/ServiceStep2Images'
import { EquipmentStep2Images } from '../../components/equipment/wizard/EquipmentStep2Images'

jest.mock('expo-image', () => ({
  Image: 'Image',
}))

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}))

jest.mock('../../components/navigation/glassSupport', () => ({
  GlassSurface: ({ children }: any) => children ?? null,
  useGlassSupport: () => ({
    canUseLiquidGlass: false,
    canUseBlur: false,
    tier: 'fallback',
    reduceTransparency: false,
  }),
}))

describe('D-330 Commit 1: Shared WizardImagesStep & Set-as-Main across all 5 verticals', () => {
  afterEach(async () => {
    await cleanup()
  })
  it('renders Set-as-Main button in EquipmentStep2Images and triggers callbacks', async () => {
    const onMakePrimaryNew = jest.fn()
    const onMakePrimaryExisting = jest.fn()

    const { getByTestId, getAllByText } = await render(
      <EquipmentStep2Images
        images={[{ uri: 'file://new-eq-1.jpg' }, { uri: 'file://new-eq-2.jpg' }]}
        existingImages={[
          { id: 'eq-ex-1', url: 'https://example.com/1.jpg' },
          { id: 'eq-ex-2', url: 'https://example.com/2.jpg' },
        ]}
        errors={{}}
        isUploading={false}
        onPickImages={jest.fn()}
        onRemoveNewImage={jest.fn()}
        onRemoveExistingImage={jest.fn()}
        onMakePrimaryNew={onMakePrimaryNew}
        onMakePrimaryExisting={onMakePrimaryExisting}
      />
    )

    expect(getAllByText('تعيين كرئيسية').length).toBe(3)
    await act(async () => {
      fireEvent.press(getByTestId('make-primary-existing-1'))
    })
    expect(onMakePrimaryExisting).toHaveBeenCalledWith(1)

    await act(async () => {
      fireEvent.press(getByTestId('make-primary-new-0'))
    })
    expect(onMakePrimaryNew).toHaveBeenCalledWith(0)
  })

  const assertMaxLimit = async (Comp: React.ComponentType<any>, limit: number) => {
    const imgs = Array.from({ length: limit }, (_, i) => ({ uri: `file://img-${i}.jpg` }))
    const { getByText, toJSON } = await render(
      <Comp
        images={imgs}
        existingImages={[]}
        errors={{}}
        isUploading={false}
        onPickImages={jest.fn()}
        onRemoveNewImage={jest.fn()}
        onRemoveExistingImage={jest.fn()}
        onMakePrimaryNew={jest.fn()}
        onMakePrimaryExisting={jest.fn()}
      />
    )
    if (!toJSON()) throw new Error('Empty render tree')
    expect(getByText(`تم اختيار ${limit} من ${limit} صور مسموحة`)).toBeTruthy()
  }

  it('enforces max 10 limit for BusStep2Images', () => assertMaxLimit(BusStep2Images, 10))
  it('enforces max 10 limit for PartStep2Images', () => assertMaxLimit(PartStep2Images, 10))
  it('enforces max 10 limit for ServiceStep2Images', () => assertMaxLimit(ServiceStep2Images, 10))
  it('enforces max 10 limit for EquipmentStep2Images', () => assertMaxLimit(EquipmentStep2Images, 10))
  it('enforces max 20 limit for CarStep2Images', () => assertMaxLimit(CarStep2Images, 20))
})
