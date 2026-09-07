/**
 * Unified Operators Directory Constants (Single Source of Truth)
 */

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
    desc: 'حفارات، لوادر، بلدوزرات، كرينات، مداحل',
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
  id: string
  label: string
}

export const AVAILABLE_EQUIPMENT: EquipmentCatalogItem[] = [
  { id: 'EXCAVATOR', label: 'حفار (Excavator)' },
  { id: 'CRANE', label: 'كرين / رافعة (Crane)' },
  { id: 'LOADER', label: 'لودر (Wheel Loader)' },
  { id: 'BULLDOZER', label: 'بلدوزر (Bulldozer)' },
  { id: 'FORKLIFT', label: 'رافعة شوكية (Forklift)' },
  { id: 'CONCRETE_MIXER', label: 'خلاطة خرسانة (Concrete Mixer)' },
  { id: 'GENERATOR', label: 'مولد كهرباء (Generator)' },
  { id: 'COMPRESSOR', label: 'ضاغط هواء (Compressor)' },
  { id: 'SCAFFOLDING', label: 'سقالات (Scaffolding)' },
  { id: 'WELDING_MACHINE', label: 'ماكينة لحام (Welding Machine)' },
  { id: 'TRUCK', label: 'شاحنة ثقيلة (Heavy Truck)' },
  { id: 'DUMP_TRUCK', label: 'قلاب (Dump Truck)' },
  { id: 'WATER_TANKER', label: 'صهريج مياه (Water Tanker)' },
  { id: 'LIGHT_EQUIPMENT', label: 'معدات خفيفة (Light Equipment)' },
  { id: 'OTHER_EQUIPMENT', label: 'أخرى (Other)' },
]

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
