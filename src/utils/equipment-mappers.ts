import { EquipmentType, OperatorType, EquipmentListingType } from '../types/equipment.types'

export const EQUIPMENT_TYPES: Record<EquipmentType, { label: string; icon: string }> = {
  EXCAVATOR: { label: 'حفار', icon: 'excavator' },
  CRANE: { label: 'رافعة', icon: 'crane' },
  LOADER: { label: 'لودر', icon: 'loader' },
  BULLDOZER: { label: 'جرافة', icon: 'bulldozer' },
  FORKLIFT: { label: 'رافعة شوكية', icon: 'forklift' },
  CONCRETE_MIXER: { label: 'خلاطة خرسانة', icon: 'concrete-mixer' },
  GENERATOR: { label: 'مولد كهرباء', icon: 'generator' },
  COMPRESSOR: { label: 'ضاغط هواء', icon: 'compressor' },
  SCAFFOLDING: { label: 'سقالات', icon: 'scaffolding' },
  WELDING_MACHINE: { label: 'ماكينة لحام', icon: 'welding' },
  TRUCK: { label: 'شاحنة', icon: 'truck' },
  DUMP_TRUCK: { label: 'شاحنة تفريغ', icon: 'dump-truck' },
  WATER_TANKER: { label: 'صهريج مياه', icon: 'water-tanker' },
  LIGHT_EQUIPMENT: { label: 'معدات خفيفة', icon: 'light-equipment' },
  OTHER_EQUIPMENT: { label: 'معدات أخرى', icon: 'other' },
}

export const OPERATOR_TYPES: Record<OperatorType, { label: string }> = {
  DRIVER: { label: 'سائق' },
  OPERATOR: { label: 'مشغل معدات' },
  TECHNICIAN: { label: 'فني' },
  MAINTENANCE: { label: 'صيانة' },
}

export const EQUIPMENT_LISTING_TYPES: Record<EquipmentListingType, { label: string }> = {
  EQUIPMENT_SALE: { label: 'للبيع' },
  EQUIPMENT_RENT: { label: 'للإيجار' },
  EQUIPMENT_WANTED: { label: 'مطلوب' },
}

export const EQUIPMENT_CONDITIONS: Record<string, { label: string }> = {
  NEW: { label: 'جديدة' },
  USED: { label: 'مستعملة' },
  LIKE_NEW: { label: 'شبه جديدة' },
  REFURBISHED: { label: 'مجددة' },
}

export const getEquipmentTypeLabel = (type?: string | null): string => {
  if (!type) return 'غير محدد'
  return EQUIPMENT_TYPES[type as EquipmentType]?.label || type
}

export const getOperatorTypeLabel = (type?: string | null): string => {
  if (!type) return 'غير محدد'
  return OPERATOR_TYPES[type as OperatorType]?.label || type
}

export const getEquipmentListingTypeLabel = (type?: string | null): string => {
  if (!type) return 'غير محدد'
  return EQUIPMENT_LISTING_TYPES[type as EquipmentListingType]?.label || type
}

export const getEquipmentConditionLabel = (condition?: string | null): string => {
  if (!condition) return 'غير محدد'
  return EQUIPMENT_CONDITIONS[condition]?.label || condition
}
