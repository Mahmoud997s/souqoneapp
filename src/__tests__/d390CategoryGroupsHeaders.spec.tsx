import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import {
  PART_CATEGORIES,
  PART_CATEGORY_GROUPS,
  PART_CATEGORY_LABELS,
} from '../constants/parts'
import {
  SERVICE_TYPES,
  SERVICE_TYPE_GROUPS,
  SERVICE_TYPE_LABELS,
} from '../constants/services'
import { EQUIPMENT_CATEGORIES, EQUIPMENT_CATEGORY_GROUPS } from '../constants/equipment'
import { AVAILABLE_EQUIPMENT } from '../constants/operators'
import { PartStep1Category } from '../components/parts/wizard/PartStep1Category'
import { ServiceStep1Type } from '../components/services/wizard/ServiceStep1Type'
import { OperatorEquipCertsStep } from '../components/operators/OperatorEquipCertsStep'
import { PartFormData, defaultPartFormData } from '../store/partWizardStore'
import { ServiceFormData, defaultServiceFormData } from '../store/serviceWizardStore'
import { DEFAULT_OPERATOR_WIZARD_DATA } from '../store/operatorWizardStore'

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}))

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}))

describe('D-390 (F4 PR-B): Category Group Headers in Parts, Services, and Operator Wizards', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('1. Group completeness & canonical derivation', () => {
    it('PART_CATEGORY_GROUPS matches the 5 approved groups and covers every PART_CATEGORIES enum id exactly once', () => {
      expect(
        PART_CATEGORY_GROUPS.map((g) => ({
          title: g.title,
          ids: g.items.map((i) => i.id),
        }))
      ).toEqual([
        { title: 'الميكانيكا', ids: ['ENGINE', 'SUSPENSION', 'BRAKES'] },
        { title: 'الكهرباء والطاقة', ids: ['ELECTRICAL', 'BATTERIES'] },
        { title: 'الهيكل والداخل', ids: ['BODY', 'INTERIOR'] },
        { title: 'الاستهلاكيات', ids: ['TIRES', 'OILS'] },
        { title: 'إكسسوارات وأخرى', ids: ['ACCESSORIES', 'OTHER'] },
      ])

      const flattened = PART_CATEGORY_GROUPS.flatMap((g) => g.items)
      const ids = flattened.map((i) => i.id)
      expect(ids).toHaveLength(PART_CATEGORIES.length)
      expect(new Set(ids).size).toBe(PART_CATEGORIES.length)
      for (const cat of PART_CATEGORIES) {
        expect(ids.filter((id) => id === cat.id)).toHaveLength(1)
      }
      for (const item of flattened) {
        expect(item.label).toBe(PART_CATEGORY_LABELS[item.id])
      }
    })

    it('SERVICE_TYPE_GROUPS matches the 4 approved groups and covers every SERVICE_TYPES enum id exactly once', () => {
      expect(
        SERVICE_TYPE_GROUPS.map((g) => ({
          title: g.title,
          ids: g.items.map((i) => i.id),
        }))
      ).toEqual([
        { title: 'الصيانة والفحص', ids: ['MAINTENANCE', 'INSPECTION'] },
        { title: 'الشكل والتجميل', ids: ['CLEANING', 'BODYWORK', 'MODIFICATION'] },
        { title: 'التركيبات والمفاتيح', ids: ['ACCESSORIES_INSTALL', 'KEYS_LOCKS'] },
        { title: 'السطحات وأخرى', ids: ['TOWING', 'OTHER_SERVICE'] },
      ])

      const flattened = SERVICE_TYPE_GROUPS.flatMap((g) => g.items)
      const ids = flattened.map((i) => i.id)
      expect(ids).toHaveLength(SERVICE_TYPES.length)
      expect(new Set(ids).size).toBe(SERVICE_TYPES.length)
      for (const st of SERVICE_TYPES) {
        expect(ids.filter((id) => id === st.id)).toHaveLength(1)
      }
      for (const item of flattened) {
        expect(item.label).toBe(SERVICE_TYPE_LABELS[item.id])
      }
    })

    it('EQUIPMENT_CATEGORY_GROUPS covers every AVAILABLE_EQUIPMENT / EQUIPMENT_CATEGORIES enum id exactly once', () => {
      const flattened = EQUIPMENT_CATEGORY_GROUPS.flatMap((g) => g.items)
      const keys = flattened.map((i) => i.key)
      expect(keys).toHaveLength(AVAILABLE_EQUIPMENT.length)
      expect(keys).toHaveLength(EQUIPMENT_CATEGORIES.length)
      expect(new Set(keys).size).toBe(AVAILABLE_EQUIPMENT.length)
      for (const eq of AVAILABLE_EQUIPMENT) {
        expect(keys.filter((k) => k === eq.id)).toHaveLength(1)
      }
    })
  })

  describe('2. PartStep1Category renders grouped headers, selects enum id, and restores draft/edit value', () => {
    it('renders all 5 group headers and all 11 rows, and sets exact enum id on select', async () => {
      const onUpdateField = jest.fn()
      const { getByTestId, getByText } = await render(
        <PartStep1Category
          formData={{ ...defaultPartFormData, partCategory: null }}
          errors={{}}
          onUpdateField={onUpdateField}
        />
      )

      await fireEvent.press(getByTestId('part-category-select'))

      for (const group of PART_CATEGORY_GROUPS) {
        expect(getByText(group.title)).toBeTruthy()
        for (const item of group.items) {
          expect(getByTestId(`category-${item.id}`)).toBeTruthy()
          expect(getByText(item.label)).toBeTruthy()
        }
      }

      await fireEvent.press(getByTestId('category-BRAKES'))
      expect(onUpdateField).toHaveBeenCalledWith('partCategory', 'BRAKES')
    })

    it('shows pre-selected category in edit/draft mode and marks it selected inside its group', async () => {
      const formData: PartFormData = { ...defaultPartFormData, partCategory: 'OILS' }
      const { getByTestId, getByText } = await render(
        <PartStep1Category
          formData={formData}
          errors={{}}
          onUpdateField={jest.fn()}
        />
      )

      expect(getByText(PART_CATEGORY_LABELS.OILS)).toBeTruthy()
      await fireEvent.press(getByTestId('part-category-select'))
      expect(getByText('الاستهلاكيات')).toBeTruthy()
      expect(getByTestId('category-OILS').props.accessibilityState).toEqual(
        expect.objectContaining({ selected: true })
      )
    })
  })

  describe('3. ServiceStep1Type renders grouped headers, selects enum id, and restores draft/edit value', () => {
    it('renders all 4 group headers and all 9 rows, and sets exact enum id on select', async () => {
      const onUpdateField = jest.fn()
      const { getByTestId, getByText } = await render(
        <ServiceStep1Type
          formData={defaultServiceFormData}
          errors={{}}
          onUpdateField={onUpdateField}
        />
      )

      await fireEvent.press(getByTestId('service-type-select'))

      for (const group of SERVICE_TYPE_GROUPS) {
        expect(getByText(group.title)).toBeTruthy()
        for (const item of group.items) {
          expect(getByTestId(`service-type-${item.id}`)).toBeTruthy()
          expect(getByText(item.label)).toBeTruthy()
        }
      }

      await fireEvent.press(getByTestId('service-type-KEYS_LOCKS'))
      expect(onUpdateField).toHaveBeenCalledWith('serviceType', 'KEYS_LOCKS')
    })

    it('shows pre-selected serviceType in edit/draft mode and marks it selected inside its group', async () => {
      const formData: ServiceFormData = { ...defaultServiceFormData, serviceType: 'TOWING' }
      const { getByTestId, getByText } = await render(
        <ServiceStep1Type
          formData={formData}
          errors={{}}
          onUpdateField={jest.fn()}
        />
      )

      expect(getByText(SERVICE_TYPE_LABELS.TOWING)).toBeTruthy()
      await fireEvent.press(getByTestId('service-type-select'))
      expect(getByText('السطحات وأخرى')).toBeTruthy()
      expect(getByTestId('service-type-TOWING').props.accessibilityState).toEqual(
        expect.objectContaining({ selected: true })
      )
    })
  })

  describe('4. OperatorEquipCertsStep renders grouped multi-select headers, toggles enum id, and restores draft/edit values', () => {
    it('renders all 5 EQUIPMENT_CATEGORY_GROUPS headers and all 15 rows, toggles enum id, and keeps multi-select open', async () => {
      const onToggleEquipment = jest.fn()
      const { getByTestId, getByText } = await render(
        <OperatorEquipCertsStep
          formData={DEFAULT_OPERATOR_WIZARD_DATA}
          errors={{}}
          isUploading={false}
          onToggleEquipment={onToggleEquipment}
          onPickCertificateImages={jest.fn()}
          onRemoveCertificate={jest.fn()}
          onAddTextCertificate={jest.fn()}
        />
      )

      await fireEvent.press(getByTestId('operator-equipment-select'))

      for (const group of EQUIPMENT_CATEGORY_GROUPS) {
        expect(getByText(group.title)).toBeTruthy()
        for (const item of group.items) {
          expect(getByTestId(`operator-equipment-${item.key}`)).toBeTruthy()
          expect(getByText(item.label)).toBeTruthy()
        }
      }

      await fireEvent.press(getByTestId('operator-equipment-DUMP_TRUCK'))
      expect(onToggleEquipment).toHaveBeenCalledWith('DUMP_TRUCK')
      expect(getByTestId('operator-equipment-select').props.accessibilityState).toEqual(
        expect.objectContaining({ expanded: true })
      )
    })

    it('restores saved equipmentTypes in edit/draft mode with checked checkboxes inside their groups', async () => {
      const { getByTestId, getByText } = await render(
        <OperatorEquipCertsStep
          formData={{ ...DEFAULT_OPERATOR_WIZARD_DATA, equipmentTypes: ['EXCAVATOR', 'GENERATOR'] }}
          errors={{}}
          isUploading={false}
          onToggleEquipment={jest.fn()}
          onPickCertificateImages={jest.fn()}
          onRemoveCertificate={jest.fn()}
          onAddTextCertificate={jest.fn()}
        />
      )

      expect(getByText('معدتان محددتان')).toBeTruthy()
      await fireEvent.press(getByTestId('operator-equipment-select'))
      expect(getByText('الحفر والتحميل')).toBeTruthy()
      expect(getByText('الخرسانة والطاقة والورش')).toBeTruthy()
      expect(getByTestId('operator-equipment-EXCAVATOR').props.accessibilityState).toEqual(
        expect.objectContaining({ checked: true })
      )
      expect(getByTestId('operator-equipment-GENERATOR').props.accessibilityState).toEqual(
        expect.objectContaining({ checked: true })
      )
      expect(getByTestId('operator-equipment-CRANE').props.accessibilityState).toEqual(
        expect.objectContaining({ checked: false })
      )
    })
  })
})
