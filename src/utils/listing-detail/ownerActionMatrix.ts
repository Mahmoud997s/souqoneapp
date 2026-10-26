import type {
  OwnerAction,
  OwnerActionId,
} from '../../components/listing-detail/OwnerManageBar'
import type { BaseDetailViewModel } from '../../types/listingDetail.types'
import type { BusListingType } from '../../types/bus.types'
import type { EquipmentListingType } from '../../types/equipment.types'
import type { CarListingStatusAction } from '../../hooks/listing-detail/useChangeCarListingStatus'

export type { OwnerAction, OwnerActionId }
export type ListingStatus = BaseDetailViewModel['status']
export type CarListingType = BaseDetailViewModel['listingType']

const GENERIC_STATUS_CONFIRM = 'هل أنت متأكد من تغيير حالة الإعلان؟'
const GENERIC_CONFIRM_TITLE = 'تأكيد الإجراء'
const GENERIC_CONFIRM_LABEL = 'تأكيد'

export const OWNER_STATUS_TARGET: Partial<
  Record<OwnerActionId, 'SOLD' | 'RENTED' | 'ARCHIVED' | 'ACTIVE'>
> = {
  markSold: 'SOLD',
  markRented: 'RENTED',
  archive: 'ARCHIVED',
  pause: 'ARCHIVED',
  stopSearch: 'ARCHIVED',
  restore: 'ACTIVE',
  submit: 'ACTIVE',
}

export const OWNER_ACTION_SUCCESS_MESSAGE: Partial<Record<OwnerActionId, string>> = {
  restore: 'تمت استعادة الإعلان بنجاح',
  archive: 'تمت أرشفة الإعلان بنجاح',
  pause: 'تم إيقاف الإعلان مؤقتاً بنجاح',
  stopSearch: 'تم إيقاف البحث بنجاح',
  markSold: 'تم تحديد الإعلان كمباع بنجاح',
  markRented: 'تم تحديد الإعلان كمؤجر بنجاح',
  submit: 'تم إرسال الإعلان بنجاح',
}

export const CAR_STATUS_ACTION: Partial<
  Record<OwnerActionId, CarListingStatusAction>
> = {
  markSold: 'mark-sold',
  archive: 'archive',
  pause: 'archive',
  stopSearch: 'archive',
  restore: 'restore',
  submit: 'submit',
}

const EDIT_ACTION: OwnerAction = {
  id: 'edit',
  label: 'تعديل',
  tone: 'neutral',
  icon: 'create-outline',
  requiresConfirm: false,
}

const MARK_SOLD_ACTION: OwnerAction = {
  id: 'markSold',
  label: 'تعليم كمباع',
  tone: 'primary',
  icon: 'checkmark-circle-outline',
  requiresConfirm: true,
  confirmTitle: 'تأكيد البيع',
  confirmMessage:
    'هل أنت متأكد من تعليم هذا الإعلان كمباع؟ لا يمكن التراجع عن هذا الإجراء لاحقاً.',
  confirmLabel: GENERIC_CONFIRM_LABEL,
}

const ARCHIVE_ACTION: OwnerAction = {
  id: 'archive',
  label: 'أرشفة',
  tone: 'neutral',
  icon: 'archive-outline',
  requiresConfirm: true,
  confirmTitle: GENERIC_CONFIRM_TITLE,
  confirmMessage: GENERIC_STATUS_CONFIRM,
  confirmLabel: GENERIC_CONFIRM_LABEL,
}

const PAUSE_ACTION: OwnerAction = {
  id: 'pause',
  label: 'إيقاف مؤقت',
  tone: 'neutral',
  icon: 'pause-circle-outline',
  requiresConfirm: true,
  confirmTitle: GENERIC_CONFIRM_TITLE,
  confirmMessage: GENERIC_STATUS_CONFIRM,
  confirmLabel: GENERIC_CONFIRM_LABEL,
}

const STOP_SEARCH_ACTION: OwnerAction = {
  id: 'stopSearch',
  label: 'إيقاف البحث',
  tone: 'neutral',
  icon: 'stop-circle-outline',
  requiresConfirm: true,
  confirmTitle: GENERIC_CONFIRM_TITLE,
  confirmMessage: GENERIC_STATUS_CONFIRM,
  confirmLabel: GENERIC_CONFIRM_LABEL,
}

const RESTORE_ARCHIVED_ACTION: OwnerAction = {
  id: 'restore',
  label: 'استعادة',
  tone: 'primary',
  icon: 'refresh-outline',
  requiresConfirm: true,
  confirmTitle: GENERIC_CONFIRM_TITLE,
  confirmMessage: GENERIC_STATUS_CONFIRM,
  confirmLabel: GENERIC_CONFIRM_LABEL,
}

const SUBMIT_DRAFT_ACTION: OwnerAction = {
  id: 'submit',
  label: 'نشر',
  tone: 'primary',
  icon: 'send-outline',
  requiresConfirm: true,
  confirmTitle: GENERIC_CONFIRM_TITLE,
  confirmMessage: 'هل أنت متأكد من نشر هذا الإعلان؟',
  confirmLabel: 'نشر',
}

const DELETE_ACTION: OwnerAction = {
  id: 'delete',
  label: 'حذف',
  tone: 'danger',
  icon: 'trash-outline',
  requiresConfirm: true,
  confirmTitle: 'حذف الإعلان',
  confirmMessage: 'هل أنت متأكد من رغبتك في حذف هذا الإعلان نهائياً؟',
  confirmLabel: 'حذف',
}

export function buildCarOwnerActions(
  status: ListingStatus,
  listingType: CarListingType
): OwnerAction[] {
  const actions: OwnerAction[] = []

  if (status !== 'SOLD' && status !== 'SUSPENDED') {
    actions.push({ ...EDIT_ACTION })
  }

  if (status === 'ACTIVE') {
    if (listingType === 'RENTAL') {
      actions.push({ ...PAUSE_ACTION })
    } else if (listingType === 'WANTED') {
      actions.push({ ...STOP_SEARCH_ACTION })
    } else {
      actions.push({ ...MARK_SOLD_ACTION })
      actions.push({ ...ARCHIVE_ACTION })
    }
  } else if (status === 'ARCHIVED') {
    actions.push({ ...RESTORE_ARCHIVED_ACTION })
  } else if (status === 'DRAFT') {
    actions.push({ ...SUBMIT_DRAFT_ACTION })
  }

  actions.push({ ...DELETE_ACTION })

  return actions
}

export function buildBusOwnerActions(
  status: ListingStatus,
  busListingType: BusListingType
): OwnerAction[] {
  const actions: OwnerAction[] = []

  if (status !== 'SOLD' && status !== 'SUSPENDED') {
    actions.push({ ...EDIT_ACTION })
  }

  if (status === 'ACTIVE') {
    if (busListingType === 'BUS_RENT') {
      actions.push({
        id: 'markRented',
        label: 'تعليم كمؤجر',
        tone: 'primary',
        icon: 'checkmark-circle-outline',
        requiresConfirm: true,
        confirmTitle: 'تأكيد الإيجار',
        confirmMessage:
          'هل أنت متأكد من تعليم هذه الحافلة كمؤجرة؟ يمكنك إعادة تفعيلها لاحقاً.',
        confirmLabel: GENERIC_CONFIRM_LABEL,
      })
      actions.push({ ...PAUSE_ACTION })
    } else {
      actions.push({ ...MARK_SOLD_ACTION })
      actions.push({ ...ARCHIVE_ACTION })
    }
  } else if (status === 'ARCHIVED') {
    actions.push({ ...RESTORE_ARCHIVED_ACTION })
  } else if (status === 'RENTED') {
    actions.push({
      id: 'restore',
      label: 'إعادة إتاحة للإيجار',
      tone: 'primary',
      icon: 'refresh-outline',
      requiresConfirm: true,
      confirmTitle: GENERIC_CONFIRM_TITLE,
      confirmMessage: 'هل أنت متأكد من إعادة إتاحة هذه الحافلة للإيجار؟',
      confirmLabel: GENERIC_CONFIRM_LABEL,
    })
  } else if (status === 'DRAFT') {
    actions.push({ ...SUBMIT_DRAFT_ACTION })
  }

  actions.push({ ...DELETE_ACTION })

  return actions
}

export function buildEquipmentOwnerActions(
  status: ListingStatus,
  equipmentListingType?: EquipmentListingType
): OwnerAction[] {
  const actions: OwnerAction[] = []

  if (status !== 'SOLD' && status !== 'SUSPENDED') {
    actions.push({ ...EDIT_ACTION })
  }

  if (status === 'ACTIVE') {
    if (equipmentListingType === 'EQUIPMENT_RENT') {
      actions.push({
        id: 'markRented',
        label: 'تعليم كمؤجر',
        tone: 'primary',
        icon: 'checkmark-circle-outline',
        requiresConfirm: true,
        confirmTitle: 'تأكيد الإيجار',
        confirmMessage:
          'هل أنت متأكد من تعليم هذه المعدة كمؤجرة؟ يمكنك إعادة تفعيلها لاحقاً.',
        confirmLabel: GENERIC_CONFIRM_LABEL,
      })
      actions.push({ ...PAUSE_ACTION })
    } else if (equipmentListingType === 'EQUIPMENT_WANTED') {
      actions.push({ ...ARCHIVE_ACTION })
    } else if (equipmentListingType === 'EQUIPMENT_SALE') {
      actions.push({ ...MARK_SOLD_ACTION })
      actions.push({ ...ARCHIVE_ACTION })
    } else {
      // Safe fallback for undefined / unrecognized equipment listing types:
      // backend only allows SOLD for EQUIPMENT_SALE and RENTED for EQUIPMENT_RENT,
      // while ARCHIVED is valid for all ACTIVE equipment listings.
      actions.push({ ...ARCHIVE_ACTION })
    }
  } else if (status === 'ARCHIVED') {
    actions.push({ ...RESTORE_ARCHIVED_ACTION })
  } else if (status === 'RENTED') {
    actions.push({
      id: 'restore',
      label: 'إعادة إتاحة للإيجار',
      tone: 'primary',
      icon: 'refresh-outline',
      requiresConfirm: true,
      confirmTitle: GENERIC_CONFIRM_TITLE,
      confirmMessage: 'هل أنت متأكد من إعادة إتاحة هذه المعدة للإيجار؟',
      confirmLabel: GENERIC_CONFIRM_LABEL,
    })
  } else if (status === 'DRAFT') {
    actions.push({ ...SUBMIT_DRAFT_ACTION })
  }

  actions.push({ ...DELETE_ACTION })

  return actions
}
