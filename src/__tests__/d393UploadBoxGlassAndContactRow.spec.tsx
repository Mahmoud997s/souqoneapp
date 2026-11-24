import React from 'react'
import { StyleSheet } from 'react-native'
import { render, fireEvent, cleanup, screen, act } from '@testing-library/react-native'
import { Colors } from '../constants/colors'
import { TopBarTokens } from '../constants/topBarTokens'
import { CarStep2Images } from '../components/cars/wizard/CarStep2Images'
import { BusStep2Images } from '../components/buses/wizard/BusStep2Images'
import { EquipmentStep2Images } from '../components/equipment/wizard/EquipmentStep2Images'
import { PartStep2Images } from '../components/parts/wizard/PartStep2Images'
import { ServiceStep2Images } from '../components/services/wizard/ServiceStep2Images'
import { CarStep5Review } from '../components/cars/wizard/CarStep5Review'
import { BusStep6Review } from '../components/buses/wizard/BusStep6Review'
import { EquipmentStep5Review } from '../components/equipment/wizard/EquipmentStep5Review'
import { PartStep6Review } from '../components/parts/wizard/PartStep6Review'
import { ServiceStep6Review } from '../components/services/wizard/ServiceStep6Review'
import { defaultPartFormData } from '../store/partWizardStore'
import { defaultServiceFormData } from '../store/serviceWizardStore'

jest.mock('expo-image', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    Image: (props: any) => <View testID="expo-image" {...props} />,
  }
})

jest.mock('@expo/vector-icons', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return {
    Ionicons: (props: any) => <Text testID={`ionicon-${props.name}`} {...props} />,
    MaterialCommunityIcons: (props: any) => <Text testID={`mci-${props.name}`} {...props} />,
  }
})

jest.mock('../components/navigation/glassSupport', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    GlassSurface: (props: any) => (
      <View testID={props.testID ?? 'glass-surface'} {...props}>
        {props.children}
      </View>
    ),
    useGlassSupport: () => ({
      canUseLiquidGlass: false,
      canUseBlur: true,
      tier: 'blur',
      reduceTransparency: false,
    }),
  }
})

describe('D-393 — Part 1: Photo Upload Box GlassSurface Across All 5 Wizards', () => {
  afterEach(async () => {
    await cleanup()
  })

  const step2Cases = [
    { name: 'Cars (CarStep2Images)', Comp: CarStep2Images, boxTestID: 'upload-action-box' },
    { name: 'Buses (BusStep2Images)', Comp: BusStep2Images, boxTestID: 'upload-action-box' },
    { name: 'Equipment (EquipmentStep2Images)', Comp: EquipmentStep2Images, boxTestID: 'upload-action-box' },
    { name: 'Parts (PartStep2Images)', Comp: PartStep2Images, boxTestID: 'upload-action-box' },
    { name: 'Services (ServiceStep2Images)', Comp: ServiceStep2Images, boxTestID: 'upload-box' },
  ] as const

  for (const { name, Comp, boxTestID } of step2Cases) {
    it(`${name}: renders GlassSurface upload box with explicit washColor/washOpacity, dashed border, overflow hidden, >=44pt minHeight, no ancestor opacity<1, and fires onPickImages`, async () => {
      const onPickImages = jest.fn()
      const { getByTestId, toJSON } = await render(
        <Comp
          images={[]}
          existingImages={[]}
          errors={{}}
          isUploading={false}
          onPickImages={onPickImages}
          onRemoveNewImage={jest.fn()}
          onRemoveExistingImage={jest.fn()}
          onMakePrimaryNew={jest.fn()}
          onMakePrimaryExisting={jest.fn()}
        />
      )

      const box = getByTestId(boxTestID)
      const boxStyle = StyleSheet.flatten(box.props.style)
      expect(boxStyle.borderStyle).toBe('dashed')
      expect(boxStyle.overflow).toBe('hidden')
      expect(boxStyle.backgroundColor).toBe(Colors.transparent)
      expect(boxStyle.minHeight).toBeGreaterThanOrEqual(44)

      const glass = getByTestId(`${boxTestID}-glass`)
      expect(glass.props.washColor).toBe(TopBarTokens.iceGlass)
      expect(glass.props.washOpacity).toBe(0.85)
      expect(glass.props.variant).toBe('surface')
      expect(glass.props.noBorder).toBe(true)

      // Walk tree to verify no ancestor of the glass surface has opacity < 1
      const tree = toJSON()
      const findPathToGlass = (node: any, path: any[] = []): any[] | null => {
        if (!node || typeof node !== 'object') return null
        if (Array.isArray(node)) {
          for (const item of node) {
            const found = findPathToGlass(item, path)
            if (found) return found
          }
          return null
        }
        const currentPath = [...path, node]
        if (node.props?.testID === `${boxTestID}-glass`) {
          return currentPath
        }
        if (node.children) {
          return findPathToGlass(node.children, currentPath)
        }
        return null
      }

      const glassPath = findPathToGlass(tree)
      expect(glassPath).not.toBeNull()
      const ancestors = glassPath!.slice(0, -1)
      for (const ancestor of ancestors) {
        const flat = StyleSheet.flatten(ancestor.props?.style)
        if (flat && flat.opacity !== undefined) {
          expect(flat.opacity).toBe(1)
        }
      }

      await act(async () => {
        fireEvent.press(box)
      })
      expect(onPickImages).toHaveBeenCalledTimes(1)
    })
  }
})

describe('D-393 — Part 2: Shared "طرق التواصل" Review Row Across All 5 Wizards', () => {
  afterEach(async () => {
    await cleanup()
  })

  const renderCarReview = (whatsappEnabled: boolean) =>
    render(
      <CarStep5Review
        formData={{
          listingType: 'SALE',
          brandName: 'تويوتا',
          modelName: 'كامري',
          year: '2023',
          price: '8500',
          isPriceNegotiable: true,
          governorateName: 'مسقط',
          wilayaName: 'السيب',
          images: [],
          existingImages: [],
          features: [],
          whatsappEnabled,
        } as any}
        onEditStep={jest.fn()}
      />
    )

  const renderBusReview = (whatsappEnabled: boolean) =>
    render(
      <BusStep6Review
        data={{
          busListingType: 'BUS_SALE',
          busType: 'MINI_BUS',
          make: 'Toyota',
          model: 'Coaster',
          year: '2022',
          capacity: '30',
          condition: 'USED',
          transmission: 'MANUAL',
          fuelType: 'DIESEL',
          features: [],
          price: '15000',
          currency: 'OMR',
          isPriceNegotiable: true,
          title: 'حافلة تويوتا',
          description: 'بحالة ممتازة',
          governorateNameAr: 'مسقط',
          wilayaNameAr: 'السيب',
          images: [],
          existingImages: [],
          whatsappEnabled,
        } as any}
        onEditStep={jest.fn()}
      />
    )

  const renderEquipmentReview = (whatsappEnabled: boolean) =>
    render(
      <EquipmentStep5Review
        formData={{
          listingType: 'EQUIPMENT_SALE',
          equipmentType: 'EXCAVATOR',
          brand: 'كاتربيلر',
          year: '2021',
          price: '18000',
          isPriceNegotiable: false,
          governorate: 'مسقط',
          city: 'السيب',
          features: [],
          images: [],
          existingImages: [],
          whatsappEnabled,
        } as any}
        onEditStep={jest.fn()}
      />
    )

  const renderPartReview = (whatsappEnabled: boolean) =>
    render(
      <PartStep6Review
        formData={{
          ...defaultPartFormData,
          whatsappEnabled,
        }}
        onEditStep={jest.fn()}
        brands={[]}
      />
    )

  const renderServiceReview = (whatsappEnabled: boolean) =>
    render(
      <ServiceStep6Review
        formData={{
          ...defaultServiceFormData,
          whatsappEnabled,
        }}
        onEditStep={jest.fn()}
      />
    )

  const reviewCases = [
    { name: 'Cars (CarStep5Review)', renderFn: renderCarReview },
    { name: 'Buses (BusStep6Review)', renderFn: renderBusReview },
    { name: 'Equipment (EquipmentStep5Review)', renderFn: renderEquipmentReview },
    { name: 'Parts (PartStep6Review)', renderFn: renderPartReview },
    { name: 'Services (ServiceStep6Review)', renderFn: renderServiceReview },
  ] as const

  for (const { name, renderFn } of reviewCases) {
    it(`${name}: shows "طرق التواصل" -> "اتصال" when whatsappEnabled is false, and "اتصال + واتساب" when whatsappEnabled is true (never showing a phone number)`, async () => {
      await renderFn(false)
      expect(screen.getByText('طرق التواصل')).toBeTruthy()
      expect(screen.getByTestId('wizard-review-contact-row-value')).toHaveTextContent('اتصال')
      expect(screen.queryByText('اتصال + واتساب')).toBeNull()
      expect(screen.queryByText('رقم الهاتف')).toBeNull()
      expect(screen.queryByText('رقم الواتساب')).toBeNull()

      await cleanup()

      await renderFn(true)
      expect(screen.getByText('طرق التواصل')).toBeTruthy()
      expect(screen.getByTestId('wizard-review-contact-row-value')).toHaveTextContent('اتصال + واتساب')
      expect(screen.queryByText('رقم الهاتف')).toBeNull()
      expect(screen.queryByText('رقم الواتساب')).toBeNull()
    })
  }
})
