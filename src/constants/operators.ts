/**
 * Unified Operators Directory Constants (Single Source of Truth)
 */

import type { EquipmentType } from '../types/equipment.types'
import { EQUIPMENT_CATEGORIES } from './equipment'

export interface OperatorRoleOption {
  id: 'OPERATOR' | 'DRIVER' | 'TECHNICIAN' | 'MAINTENANCE'
  title: string
  desc: string
  icon: string
}

export const OPERATOR_ROLES: OperatorRoleOption[] = [
  {
    id: 'OPERATOR',
    title: 'مشغل معدات ثقيلة',
    desc: 'حفارات، لوادر، بلدوزرات، كرينات، رافعات شوكية',
    icon: 'construct-outline',
  },
  {
    id: 'DRIVER',
    title: 'سائق مهني / شاحنات',
    desc: 'تريلات، قلابات، صهاريج، شاحنات ثقيلة',
    icon: 'car-outline',
  },
  {
    id: 'TECHNICIAN',
    title: 'فني معدات وآليات',
    desc: 'فحص ميكانيكي، تشخيص أعطال، كهرباء معدات',
    icon: 'hammer-outline',
  },
  {
    id: 'MAINTENANCE',
    title: 'فني صيانة وهيدروليك',
    desc: 'صيانة دورية، إصلاح طلمبات، دوائر هيدروليكية',
    icon: 'settings-outline',
  },
]

export const OPERATOR_ROLE_TABS = [
  { id: 'all', label: 'الكل' },
  { id: 'OPERATOR', label: 'مشغلو معدات' },
  { id: 'DRIVER', label: 'سائقون' },
  { id: 'TECHNICIAN', label: 'فنيون' },
  { id: 'MAINTENANCE', label: 'صيانة' },
]

export interface EquipmentCatalogItem {
  id: EquipmentType
  label: string
}

export const AVAILABLE_EQUIPMENT: EquipmentCatalogItem[] = EQUIPMENT_CATEGORIES.map(
  ({ key, label }) => ({
    id: key,
    label,
  })
)

const VALID_OPERATOR_EQUIPMENT_CODES = new Set<EquipmentType>(
  EQUIPMENT_CATEGORIES.map((item) => item.key)
)

const LEGACY_OPERATOR_EQUIPMENT_MAP: Record<string, EquipmentType> = {
  'حفار': 'EXCAVATOR',
  'حفارات': 'EXCAVATOR',
  'حفار (Excavator)': 'EXCAVATOR',
  'لودر': 'LOADER',
  'شيول': 'LOADER',
  'لودر / شيول': 'LOADER',
  'لودر / جرافة': 'LOADER',
  'لودر (Wheel Loader)': 'LOADER',
  'بلدوزر': 'BULLDOZER',
  'جرافة': 'BULLDOZER',
  'بلدوزر / جرافة': 'BULLDOZER',
  'بلدوزر (Bulldozer)': 'BULLDOZER',
  'كرين': 'CRANE',
  'كرين / رافعة': 'CRANE',
  'رافعة': 'CRANE',
  'رافعة / كرين': 'CRANE',
  'كرين / رافعة (Crane)': 'CRANE',
  'رافعة شوكية': 'FORKLIFT',
  'رافعة شوكية (Forklift)': 'FORKLIFT',
  'خلاطة خرسانة': 'CONCRETE_MIXER',
  'خلاطة خرسانة (Concrete Mixer)': 'CONCRETE_MIXER',
  'مولد كهرباء': 'GENERATOR',
  'مولد ومضخة': 'GENERATOR',
  'ضاغط هواء': 'COMPRESSOR',
  'كمبروسر': 'COMPRESSOR',
  'كمبروسر / ضاغط': 'COMPRESSOR',
  'سقالات': 'SCAFFOLDING',
  'سقالات ومعدات موقع': 'SCAFFOLDING',
  'ماكينة لحام': 'WELDING_MACHINE',
  'شاحنة ثقيلة': 'TRUCK',
  'شاحنة ثقيلة (Heavy Truck)': 'TRUCK',
  'شاحنة': 'TRUCK',
  'شاحنة نقل': 'TRUCK',
  'قلاب': 'DUMP_TRUCK',
  'قلاب (Dump Truck)': 'DUMP_TRUCK',
  'شاحنة تفريغ': 'DUMP_TRUCK',
  'شاحنة تفريغ (قلاب)': 'DUMP_TRUCK',
  'صهريج مياه': 'WATER_TANKER',
  'صهريج مياه / وقود (Tanker)': 'WATER_TANKER',
  'معدات خفيفة': 'LIGHT_EQUIPMENT',
  'معدات أخرى': 'OTHER_EQUIPMENT',
}

/**
 * Normalizes a single equipment type code or legacy Arabic label to a canonical EquipmentType enum code.
 * Returns null for removed legacy items (e.g. grader/roller/bobcat) or unrecognized strings.
 */
export function normalizeOperatorEquipmentType(raw: unknown): EquipmentType | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null

  const upper = trimmed.toUpperCase() as EquipmentType
  if (VALID_OPERATOR_EQUIPMENT_CODES.has(upper)) {
    return upper
  }

  if (Object.prototype.hasOwnProperty.call(LEGACY_OPERATOR_EQUIPMENT_MAP, trimmed)) {
    return LEGACY_OPERATOR_EQUIPMENT_MAP[trimmed]
  }

  return null
}

/**
 * Normalizes and deduplicates an array of equipment types to canonical EquipmentType enum codes.
 */
export function normalizeOperatorEquipmentTypes(rawList: unknown): EquipmentType[] {
  if (!Array.isArray(rawList)) return []

  const seen = new Set<EquipmentType>()
  const result: EquipmentType[] = []
  for (const item of rawList) {
    const normalized = normalizeOperatorEquipmentType(item)
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized)
      result.push(normalized)
    }
  }
  return result
}

export const CERTIFICATION_PRESETS: string[] = [
  'رخصة قيادة معدات ثقيلة سارية (ROP)',
  'شهادة سلامة وصحة مهنية (OPAL / PDO)',
  'شهادة فحص فني معتمدة',
  'رخصة نقل مواد خطرة',
  'شهادة إسعافات أولية موقعية',
]

export const OPERATOR_EXPERIENCE_RANGES = [
  { id: 'less_2', label: 'أقل من سنتين', min: 0, max: 2 },
  { id: '2_5', label: '2 - 5 سنوات', min: 2, max: 5 },
  { id: '5_10', label: '5 - 10 سنوات', min: 5, max: 10 },
  { id: 'more_10', label: 'أكثر من 10 سنوات', min: 10, max: 50 },
]

export const OPERATOR_SORT_OPTIONS = [
  { id: 'newest', label: 'الأحدث أولاً' },
  { id: 'exp_desc', label: 'الأكثر خبرة' },
  { id: 'price_asc', label: 'الأقل سعراً' },
  { id: 'price_desc', label: 'الأعلى سعراً' },
]

export const OPERATOR_FAQ_ITEMS = [
  {
    q: 'كيف يعمل دليل المشغلين؟',
    a: 'يتيح الدليل لأصحاب المعدات والشركات تصفح بطاقات المشغلين والسائقين المحترفين والتواصل المباشر معهم دون أي عمولات.',
  },
  {
    q: 'هل الانضمام للدليل مجاني؟',
    a: 'نعم، يمكن للمشغلين والسائقين نشر بطاقتهم المهنية مجاناً للوصول إلى مئات فرص العمل اليومية والشهرية.',
  },
  {
    q: 'كيف يتم التحقق من رخص المشغلين؟',
    a: 'يُتاح للمشغل إرفاق صور رخص القيادة وشهادات السلامة (مثل PDO/OPAL) وتظهر بشارة معتمدة في بطاقته.',
  },
]
