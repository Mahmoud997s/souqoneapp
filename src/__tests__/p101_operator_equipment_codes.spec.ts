import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react-native'
import {
  AVAILABLE_EQUIPMENT,
  OPERATOR_ROLES,
  normalizeOperatorEquipmentType,
  normalizeOperatorEquipmentTypes,
} from '../constants/operators'
import { EQUIPMENT_CATEGORIES } from '../constants/equipment'
import { buildOperatorPayload } from '../utils/operator-payload'
import { mapOperatorDetail } from '../utils/listing-detail/mapOperatorDetail'
import { getEquipmentTypeLabel } from '../utils/equipment-mappers'
import {
  buildOperatorQueryParams,
  refineOperatorsClientSide,
  clearOperatorFilter,
} from '../utils/browse-filters/operatorsBrowseFilters'
import { useOperatorWizardStore } from '../store/operatorWizardStore'
import { OperatorsFilterBottomSheet } from '../components/filters/OperatorsFilterBottomSheet'
import type { OperatorDetailApi } from '../types/operatorDetailApi.types'
import type { EquipmentType } from '../types/equipment.types'

jest.mock('../api/locations', () => ({
  locationsApi: {
    getGovernorates: jest.fn().mockResolvedValue([]),
    getWilayas: jest.fn().mockResolvedValue([]),
  },
}))

const ALL_15_CODES: EquipmentType[] = [
  'EXCAVATOR',
  'LOADER',
  'BULLDOZER',
  'CRANE',
  'FORKLIFT',
  'CONCRETE_MIXER',
  'GENERATOR',
  'COMPRESSOR',
  'SCAFFOLDING',
  'WELDING_MACHINE',
  'TRUCK',
  'DUMP_TRUCK',
  'WATER_TANKER',
  'LIGHT_EQUIPMENT',
  'OTHER_EQUIPMENT',
]

describe('P1-01 Operator Equipment Types Standardization (D-318)', () => {
  beforeEach(() => {
    useOperatorWizardStore.getState().resetDraft()
  })

  describe('1. Constants & Catalog (src/constants/operators.ts)', () => {
    it('AVAILABLE_EQUIPMENT exposes exclusively the 15 EquipmentType enum codes from EQUIPMENT_CATEGORIES', () => {
      const ids = AVAILABLE_EQUIPMENT.map((item) => item.id)
      const categoryKeys = EQUIPMENT_CATEGORIES.map((c) => c.key)

      expect(AVAILABLE_EQUIPMENT).toHaveLength(15)
      expect(new Set(ids)).toEqual(new Set(ALL_15_CODES))
      expect(new Set(ids)).toEqual(new Set(categoryKeys))

      for (const item of AVAILABLE_EQUIPMENT) {
        expect(item.id).toMatch(/^[A-Z_]+$/)
        expect(item.label.trim().length).toBeGreaterThan(0)
      }
    })

    it('removes grader, roller compactor, and bobcat from AVAILABLE_EQUIPMENT and OPERATOR_ROLES[0].desc', () => {
      const ids = AVAILABLE_EQUIPMENT.map((item) => item.id)
      const labelsJoined = AVAILABLE_EQUIPMENT.map((item) => item.label).join(' ')

      for (const removed of ['جريدر', 'مدحلة', 'بوبكات']) {
        expect(ids).not.toContain(removed)
        expect(labelsJoined).not.toContain(removed)
      }
      expect(OPERATOR_ROLES[0].desc).not.toContain('مداحل')
    })

    it('normalizes all 15 enum codes and legacy Arabic labels while returning null for removed/unknown items', () => {
      for (const code of ALL_15_CODES) {
        expect(normalizeOperatorEquipmentType(code)).toBe(code)
        expect(normalizeOperatorEquipmentType(` ${code.toLowerCase()} `)).toBe(code)
      }

      const legacySamples: Array<[string, EquipmentType]> = [
        ['حفار', 'EXCAVATOR'],
        ['لودر', 'LOADER'],
        ['لودر / شيول', 'LOADER'],
        ['بلدوزر', 'BULLDOZER'],
        ['جرافة', 'BULLDOZER'],
        ['بلدوزر / جرافة', 'BULLDOZER'],
        ['كرين', 'CRANE'],
        ['كرين / رافعة', 'CRANE'],
        ['رافعة', 'CRANE'],
        ['رافعة شوكية', 'FORKLIFT'],
        ['قلاب', 'DUMP_TRUCK'],
        ['شاحنة تفريغ', 'DUMP_TRUCK'],
        ['شاحنة تفريغ (قلاب)', 'DUMP_TRUCK'],
        ['شاحنة ثقيلة', 'TRUCK'],
        ['شاحنة', 'TRUCK'],
        ['شاحنة نقل', 'TRUCK'],
        ['خلاطة خرسانة', 'CONCRETE_MIXER'],
        ['صهريج مياه', 'WATER_TANKER'],
        ['مولد كهرباء', 'GENERATOR'],
        ['ضاغط هواء', 'COMPRESSOR'],
        ['كمبروسر', 'COMPRESSOR'],
        ['سقالات', 'SCAFFOLDING'],
        ['ماكينة لحام', 'WELDING_MACHINE'],
        ['معدات خفيفة', 'LIGHT_EQUIPMENT'],
        ['معدات أخرى', 'OTHER_EQUIPMENT'],
      ]

      for (const [legacy, expected] of legacySamples) {
        expect(normalizeOperatorEquipmentType(legacy)).toBe(expected)
      }

      for (const removed of ['جريدر', 'مدحلة', 'بوبكات', 'SUBMARINE', '', null, undefined, 42]) {
        expect(normalizeOperatorEquipmentType(removed)).toBeNull()
      }

      expect(
        normalizeOperatorEquipmentTypes(['حفار', 'EXCAVATOR', 'جريدر', 'قلاب', 'مدحلة', 'شاحنة ثقيلة'])
      ).toEqual(['EXCAVATOR', 'DUMP_TRUCK', 'TRUCK'])
    })
  })

  describe('2. Payload Builder & Wizard Store (src/utils/operator-payload.ts, operatorWizardStore.ts)', () => {
    it('buildOperatorPayload normalizes Arabic/legacy equipmentTypes to enum codes and never emits Arabic', () => {
      const payload = buildOperatorPayload({
        title: 'مشغل معدات ثقيلة معتمد',
        description: 'خبرة 8 سنوات في تشغيل الحفارات واللوادر',
        operatorType: 'OPERATOR',
        experienceYears: '8',
        equipmentTypes: ['حفار', 'لودر / شيول', 'جريدر', 'بوبكات', 'EXCAVATOR', 'WELDING_MACHINE'],
        specializations: ['حفر'],
        certifications: ['رخصة ثقيلة'],
        dailyRate: '40',
        hourlyRate: '',
        currency: 'OMR',
        isPriceNegotiable: true,
        governorateId: 1,
        wilayaId: 101,
        whatsappEnabled: true,
      })

      expect(payload.equipmentTypes).toEqual(['EXCAVATOR', 'LOADER', 'WELDING_MACHINE'])
      for (const code of payload.equipmentTypes as string[]) {
        expect(/[\u0600-\u06FF]/.test(code)).toBe(false)
      }
    })

    it('operatorWizardStore normalizes equipmentTypes on setFormData, setFormField, and AsyncStorage draft merge', async () => {
      const store = useOperatorWizardStore.getState()

      store.setFormData({
        equipmentTypes: ['حفار', 'جريدر', 'FORKLIFT'],
      })
      expect(useOperatorWizardStore.getState().formData.equipmentTypes).toEqual([
        'EXCAVATOR',
        'FORKLIFT',
      ])

      store.setFormField('equipmentTypes', ['قلاب', 'شاحنة ثقيلة', 'مدحلة'])
      expect(useOperatorWizardStore.getState().formData.equipmentTypes).toEqual([
        'DUMP_TRUCK',
        'TRUCK',
      ])

      const persistOptions = useOperatorWizardStore.persist.getOptions()
      const currentState = useOperatorWizardStore.getState()
      const rehydrated = persistOptions.merge?.(
        {
          currentStep: 2,
          formData: {
            ...currentState.formData,
            equipmentTypes: ['بلدوزر', 'مدحلة', 'CRANE'],
          },
        },
        currentState
      )
      expect(rehydrated?.formData.equipmentTypes).toEqual(['BULLDOZER', 'CRANE'])
    })
  })

  describe('3. Detail Mapper (src/utils/listing-detail/mapOperatorDetail.ts)', () => {
    const baseApi: OperatorDetailApi = {
      id: 'op-p101',
      slug: 'op-p101',
      title: 'مشغل معتمد',
      description: 'وصف تفصيلي للخبرة المهنية',
      operatorType: 'OPERATOR',
      equipmentTypes: [],
      certifications: [],
      specializations: [],
      status: 'ACTIVE',
      isPriceNegotiable: true,
      whatsappEnabled: false,
      viewCount: 10,
      userId: 'user-1',
      user: { id: 'user-1', username: 'op1', createdAt: '2025-01-01T00:00:00Z' },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }

    it('maps all 15 enum codes and normalizes legacy Arabic strings without silently dropping unknown non-empty values', () => {
      const vmAll15 = mapOperatorDetail({
        ...baseApi,
        equipmentTypes: ALL_15_CODES,
      })
      expect(vmAll15.equipmentTypes).toHaveLength(15)
      for (const code of ALL_15_CODES) {
        expect(vmAll15.equipmentTypes).toContainEqual({
          value: code,
          label: getEquipmentTypeLabel(code),
        })
      }

      const vmMixed = mapOperatorDetail({
        ...baseApi,
        equipmentTypes: ['CRANE', 'حفار', 'جريدر', 'SUBMARINE', '   '] as unknown as EquipmentType[],
      })

      expect(vmMixed.equipmentTypes).toEqual([
        { value: 'CRANE', label: getEquipmentTypeLabel('CRANE') },
        { value: 'EXCAVATOR', label: getEquipmentTypeLabel('EXCAVATOR') },
        { value: 'OTHER_EQUIPMENT', label: 'جريدر' },
        { value: 'OTHER_EQUIPMENT', label: 'SUBMARINE' },
      ])
    })
  })

  describe('4. Browse Filters & Bottom Sheet (operatorsBrowseFilters.ts, OperatorsFilterBottomSheet.tsx)', () => {
    it('buildOperatorQueryParams never emits Arabic or client-only equipmentType in queryParams', () => {
      const params = buildOperatorQueryParams('سائق', {
        operatorType: 'OPERATOR',
        equipmentType: 'حفار',
      })

      expect(params.operatorType).toBe('OPERATOR')
      expect('equipmentType' in params).toBe(false)
      expect(Object.values(params).filter((v) => v === 'حفار')).toHaveLength(0)
    })

    it('refineOperatorsClientSide matches across enum and legacy formats and clearOperatorFilter handles category pill', () => {
      const items = [
        { id: 'modern', equipmentTypes: ['EXCAVATOR'] },
        { id: 'legacy', equipmentTypes: ['حفار'] },
        { id: 'other', equipmentTypes: ['CRANE'] },
      ]

      expect(
        refineOperatorsClientSide(items, { equipmentType: 'EXCAVATOR' }).map((i) => i.id)
      ).toEqual(['modern', 'legacy'])

      expect(
        refineOperatorsClientSide(items, { equipmentType: 'حفار' }).map((i) => i.id)
      ).toEqual(['modern', 'legacy'])

      const cleared = clearOperatorFilter({ equipmentType: 'EXCAVATOR', dailyRateMin: 20 }, 'category')
      expect(cleared.equipmentType).toBeUndefined()
      expect(cleared.dailyRateMin).toBe(20)
    })

    it('OperatorsFilterBottomSheet lists all 15 enum options (including SCAFFOLDING & WELDING_MACHINE) and outputs enum code', async () => {
      const onApplyFilters = jest.fn()
      const onClose = jest.fn()

      await render(
        React.createElement(OperatorsFilterBottomSheet, {
          visible: true,
          onClose,
          initialFilters: {},
          onApplyFilters,
        })
      )

      const trigger = screen.getByText('اختر نوع المعدة (حفار، كرين، لودر...)')
      await act(async () => {
        fireEvent.press(trigger)
      })

      const scaffoldingLabel = EQUIPMENT_CATEGORIES.find((c) => c.key === 'SCAFFOLDING')!.label
      const weldingLabel = EQUIPMENT_CATEGORIES.find((c) => c.key === 'WELDING_MACHINE')!.label

      expect(screen.getByText(scaffoldingLabel)).toBeTruthy()
      expect(screen.getByText(weldingLabel)).toBeTruthy()

      await act(async () => {
        fireEvent.press(screen.getByText(scaffoldingLabel))
      })

      const applyBtn = screen.getByText('تطبيق الفلاتر')
      await act(async () => {
        fireEvent.press(applyBtn)
      })

      expect(onApplyFilters).toHaveBeenCalledWith({ equipmentType: 'SCAFFOLDING' })
    })
  })
})
