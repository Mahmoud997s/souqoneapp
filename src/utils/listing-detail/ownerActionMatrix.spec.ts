import type { EquipmentListingType } from '../../types/equipment.types'
import {
  buildCarOwnerActions,
  buildBusOwnerActions,
  buildEquipmentOwnerActions,
  OWNER_STATUS_TARGET,
  CAR_STATUS_ACTION,
  OWNER_ACTION_SUCCESS_MESSAGE,
} from './ownerActionMatrix'

const ids = (actions: { id: string }[]) => actions.map((a) => a.id)

describe('ownerActionMatrix', () => {
  describe('OWNER_STATUS_TARGET and CAR_STATUS_ACTION maps', () => {
    it('exports exact OWNER_STATUS_TARGET mappings', () => {
      expect(OWNER_STATUS_TARGET).toEqual({
        markSold: 'SOLD',
        markRented: 'RENTED',
        archive: 'ARCHIVED',
        pause: 'ARCHIVED',
        stopSearch: 'ARCHIVED',
        restore: 'ACTIVE',
        submit: 'ACTIVE',
      })
    })

    it('exports exact CAR_STATUS_ACTION mappings', () => {
      expect(CAR_STATUS_ACTION).toEqual({
        markSold: 'mark-sold',
        archive: 'archive',
        pause: 'archive',
        stopSearch: 'archive',
        restore: 'restore',
        submit: 'submit',
      })
    })

    it('exports exact OWNER_ACTION_SUCCESS_MESSAGE mappings', () => {
      expect(OWNER_ACTION_SUCCESS_MESSAGE).toEqual({
        restore: 'تمت استعادة الإعلان بنجاح',
        archive: 'تمت أرشفة الإعلان بنجاح',
        pause: 'تم إيقاف الإعلان مؤقتاً بنجاح',
        stopSearch: 'تم إيقاف البحث بنجاح',
        markSold: 'تم تحديد الإعلان كمباع بنجاح',
        markRented: 'تم تحديد الإعلان كمؤجر بنجاح',
        submit: 'تم إرسال الإعلان بنجاح',
      })
    })
  })

  describe('buildCarOwnerActions', () => {
    it('ACTIVE + SALE -> edit, markSold, archive, delete', () => {
      const actions = buildCarOwnerActions('ACTIVE', 'SALE')
      expect(ids(actions)).toEqual(['edit', 'markSold', 'archive', 'delete'])
    })

    it('ACTIVE + RENTAL -> edit, pause, delete', () => {
      const actions = buildCarOwnerActions('ACTIVE', 'RENTAL')
      expect(ids(actions)).toEqual(['edit', 'pause', 'delete'])
    })

    it('ACTIVE + WANTED -> edit, stopSearch, delete', () => {
      const actions = buildCarOwnerActions('ACTIVE', 'WANTED')
      expect(ids(actions)).toEqual(['edit', 'stopSearch', 'delete'])
    })

    it('ARCHIVED -> edit, restore (استعادة), delete', () => {
      const actions = buildCarOwnerActions('ARCHIVED', 'SALE')
      expect(ids(actions)).toEqual(['edit', 'restore', 'delete'])
      expect(actions.find((a) => a.id === 'restore')?.label).toBe('استعادة')
    })

    it('DRAFT -> edit, submit, delete', () => {
      const actions = buildCarOwnerActions('DRAFT', 'SALE')
      expect(ids(actions)).toEqual(['edit', 'submit', 'delete'])
    })

    it('RENTED -> edit, delete (no restore for cars)', () => {
      const actions = buildCarOwnerActions('RENTED', 'RENTAL')
      expect(ids(actions)).toEqual(['edit', 'delete'])
    })

    it('SOLD and SUSPENDED -> delete only', () => {
      expect(ids(buildCarOwnerActions('SOLD', 'SALE'))).toEqual(['delete'])
      expect(ids(buildCarOwnerActions('SUSPENDED', 'SALE'))).toEqual(['delete'])
    })
  })

  describe('buildBusOwnerActions', () => {
    it('ACTIVE + BUS_SALE -> edit, markSold, archive, delete', () => {
      const actions = buildBusOwnerActions('ACTIVE', 'BUS_SALE')
      expect(ids(actions)).toEqual(['edit', 'markSold', 'archive', 'delete'])
    })

    it('ACTIVE + BUS_SALE_WITH_CONTRACT -> edit, markSold, archive, delete', () => {
      const actions = buildBusOwnerActions('ACTIVE', 'BUS_SALE_WITH_CONTRACT')
      expect(ids(actions)).toEqual(['edit', 'markSold', 'archive', 'delete'])
    })

    it('ACTIVE + BUS_RENT -> edit, markRented, pause, delete with الحافلة wording', () => {
      const actions = buildBusOwnerActions('ACTIVE', 'BUS_RENT')
      expect(ids(actions)).toEqual(['edit', 'markRented', 'pause', 'delete'])
      const markRented = actions.find((a) => a.id === 'markRented')!
      expect(markRented.label).toBe('تعليم كمؤجر')
      expect(markRented.confirmTitle).toBe('تأكيد الإيجار')
      expect(markRented.confirmMessage).toBe(
        'هل أنت متأكد من تعليم هذه الحافلة كمؤجرة؟ يمكنك إعادة تفعيلها لاحقاً.'
      )
    })

    it('ARCHIVED -> edit, restore (استعادة), delete', () => {
      const actions = buildBusOwnerActions('ARCHIVED', 'BUS_SALE')
      expect(ids(actions)).toEqual(['edit', 'restore', 'delete'])
      expect(actions.find((a) => a.id === 'restore')?.label).toBe('استعادة')
    })

    it('RENTED -> edit, restore (إعادة إتاحة للإيجار), delete', () => {
      const actions = buildBusOwnerActions('RENTED', 'BUS_RENT')
      expect(ids(actions)).toEqual(['edit', 'restore', 'delete'])
      const restore = actions.find((a) => a.id === 'restore')!
      expect(restore.label).toBe('إعادة إتاحة للإيجار')
      expect(restore.confirmMessage).toBe(
        'هل أنت متأكد من إعادة إتاحة هذه الحافلة للإيجار؟'
      )
    })

    it('DRAFT -> edit, submit, delete', () => {
      const actions = buildBusOwnerActions('DRAFT', 'BUS_SALE')
      expect(ids(actions)).toEqual(['edit', 'submit', 'delete'])
    })

    it('SOLD and SUSPENDED -> delete only', () => {
      expect(ids(buildBusOwnerActions('SOLD', 'BUS_SALE'))).toEqual(['delete'])
      expect(ids(buildBusOwnerActions('SUSPENDED', 'BUS_SALE'))).toEqual(['delete'])
    })
  })

  describe('buildEquipmentOwnerActions', () => {
    it('ACTIVE + EQUIPMENT_SALE -> edit, markSold, archive, delete', () => {
      const actions = buildEquipmentOwnerActions('ACTIVE', 'EQUIPMENT_SALE')
      expect(ids(actions)).toEqual(['edit', 'markSold', 'archive', 'delete'])
    })

    it('ACTIVE + EQUIPMENT_RENT -> edit, markRented, pause, delete', () => {
      const actions = buildEquipmentOwnerActions('ACTIVE', 'EQUIPMENT_RENT')
      expect(ids(actions)).toEqual(['edit', 'markRented', 'pause', 'delete'])
      const markRented = actions.find((a) => a.id === 'markRented')!
      expect(markRented.label).toBe('تعليم كمؤجر')
      expect(markRented.confirmTitle).toBe('تأكيد الإيجار')
      expect(markRented.confirmMessage).toBe(
        'هل أنت متأكد من تعليم هذه المعدة كمؤجرة؟ يمكنك إعادة تفعيلها لاحقاً.'
      )
    })

    it('ACTIVE + EQUIPMENT_WANTED -> edit, archive, delete', () => {
      const actions = buildEquipmentOwnerActions('ACTIVE', 'EQUIPMENT_WANTED')
      expect(ids(actions)).toEqual(['edit', 'archive', 'delete'])
    })

    it('ACTIVE + undefined or unknown equipmentListingType -> safe fallback edit, archive, delete (no markSold)', () => {
      expect(ids(buildEquipmentOwnerActions('ACTIVE', undefined))).toEqual([
        'edit',
        'archive',
        'delete',
      ])
      expect(
        ids(
          buildEquipmentOwnerActions(
            'ACTIVE',
            'SOMETHING_ELSE' as unknown as EquipmentListingType
          )
        )
      ).toEqual(['edit', 'archive', 'delete'])
    })

    it('ARCHIVED -> edit, restore (استعادة), delete', () => {
      const actions = buildEquipmentOwnerActions('ARCHIVED', 'EQUIPMENT_SALE')
      expect(ids(actions)).toEqual(['edit', 'restore', 'delete'])
      expect(actions.find((a) => a.id === 'restore')?.label).toBe('استعادة')
    })

    it('RENTED -> edit, restore (إعادة إتاحة للإيجار), delete', () => {
      const actions = buildEquipmentOwnerActions('RENTED', 'EQUIPMENT_RENT')
      expect(ids(actions)).toEqual(['edit', 'restore', 'delete'])
      const restore = actions.find((a) => a.id === 'restore')!
      expect(restore.label).toBe('إعادة إتاحة للإيجار')
      expect(restore.confirmMessage).toBe(
        'هل أنت متأكد من إعادة إتاحة هذه المعدة للإيجار؟'
      )
    })

    it('DRAFT -> edit, submit, delete', () => {
      const actions = buildEquipmentOwnerActions('DRAFT', 'EQUIPMENT_SALE')
      expect(ids(actions)).toEqual(['edit', 'submit', 'delete'])
    })

    it('SOLD and SUSPENDED -> delete only', () => {
      expect(ids(buildEquipmentOwnerActions('SOLD', 'EQUIPMENT_SALE'))).toEqual(['delete'])
      expect(ids(buildEquipmentOwnerActions('SUSPENDED', 'EQUIPMENT_SALE'))).toEqual(['delete'])
    })
  })
})
