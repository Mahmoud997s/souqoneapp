import { EquipmentType, EquipmentListingType } from '../types/equipment.types'

export interface EquipmentTypeOption {
  key: EquipmentType
  label: string
  icon: string
}

export interface ListingTypeOption {
  key: EquipmentListingType
  label: string
  desc: string
  icon: string
}

export const LISTING_TYPES: ListingTypeOption[] = [
  {
    key: 'EQUIPMENT_SALE',
    label: 'معدة للبيع',
    desc: 'اعرض معدتك للبيع واستقبل عروض الشراء المباشرة',
    icon: 'tag-outline',
  },
  {
    key: 'EQUIPMENT_RENT',
    label: 'معدة للإيجار',
    desc: 'اعرض معدتك للتأجير باليومية أو بالشهر',
    icon: 'calendar-clock',
  },
  {
    key: 'EQUIPMENT_WANTED',
    label: 'مطلوب معدة',
    desc: 'اطلب معدة للشراء أو الاستئجار لمشروعك',
    icon: 'bullhorn-outline',
  },
]

export const EQUIPMENT_CATEGORIES: EquipmentTypeOption[] = [
  { key: 'EXCAVATOR', label: 'حفار', icon: 'excavator' },
  { key: 'LOADER', label: 'لودر / شيول', icon: 'tractor' },
  { key: 'BULLDOZER', label: 'بلدوزر / جرافة', icon: 'bulldozer' },
  { key: 'CRANE', label: 'رافعة / كرين', icon: 'crane' },
  { key: 'FORKLIFT', label: 'رافعة شوكية', icon: 'forklift' },
  { key: 'CONCRETE_MIXER', label: 'خلاطة خرسانة', icon: 'dump-truck' },
  { key: 'GENERATOR', label: 'مولد كهرباء', icon: 'engine' },
  { key: 'COMPRESSOR', label: 'كمبروسر / ضاغط', icon: 'air-filter' },
  { key: 'SCAFFOLDING', label: 'سقالات ومعدات موقع', icon: 'scaffolding' },
  { key: 'WELDING_MACHINE', label: 'ماكينة لحام', icon: 'tools' },
  { key: 'TRUCK', label: 'شاحنة نقل', icon: 'truck' },
  { key: 'DUMP_TRUCK', label: 'شاحنة تفريغ (قلاب)', icon: 'dump-truck' },
  { key: 'WATER_TANKER', label: 'صهريج مياه', icon: 'water-pump' },
  { key: 'LIGHT_EQUIPMENT', label: 'معدات خفيفة', icon: 'wrench' },
  { key: 'OTHER_EQUIPMENT', label: 'معدات أخرى', icon: 'cog' },
]

export const EQUIPMENT_CONDITIONS = [
  { id: 'NEW', label: 'جديدة تماماً (أصفار)' },
  { id: 'LIKE_NEW', label: 'بحالة ممتازة (شبه جديدة)' },
  { id: 'USED', label: 'مستعملة بحالة جيدة' },
  { id: 'GOOD', label: 'مستعملة وتحتاج صيانة بسيطة' },
  { id: 'FAIR', label: 'مستعملة بحالة متوسطة' },
  { id: 'POOR', label: 'للصيانة أو قطع غيار' },
]

export const RENTAL_DURATIONS = [
  { id: 'DAILY', label: 'يومي' },
  { id: 'WEEKLY', label: 'أسبوعي' },
  { id: 'MONTHLY', label: 'شهري' },
  { id: 'PROJECT_BASED', label: 'حسب مدة المشروع' },
]

export const POPULAR_EQUIPMENT_FEATURES = [
  'كابينة مكيفة',
  'صيانة دورية معتمدة',
  'فحص دوري ساري',
  'رخصة سارية',
  'تشغيل هيدروليكي',
  'كشافات ليلية',
  'إطارات جديدة',
  'كاميرا خلفية',
  'نظام إطفاء ذاتي',
  'توصيل متوفر',
]
