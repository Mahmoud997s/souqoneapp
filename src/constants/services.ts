export interface ServiceTypeOption {
  id: string
  label: string
  icon?: string
}

export const SERVICE_TYPES: ServiceTypeOption[] = [
  { id: 'MAINTENANCE', label: 'صيانة وميكانيكا', icon: 'build-outline' },
  { id: 'CLEANING', label: 'غسيل وتلميع ونانو', icon: 'sparkles-outline' },
  { id: 'MODIFICATION', label: 'تعديل وتزويد', icon: 'flame-outline' },
  { id: 'INSPECTION', label: 'فحص وبرمجة كمبيوتر', icon: 'scan-outline' },
  { id: 'BODYWORK', label: 'سمكرة ودهان وتعديل صدمات', icon: 'color-palette-outline' },
  { id: 'ACCESSORIES_INSTALL', label: 'تركيب شاشات وإكسسوارات', icon: 'hardware-chip-outline' },
  { id: 'KEYS_LOCKS', label: 'قص وبرمجة مفاتيح', icon: 'key-outline' },
  { id: 'TOWING', label: 'سطحات ونقل سيارات', icon: 'car-sport-outline' },
  { id: 'OTHER_SERVICE', label: 'خدمات أخرى', icon: 'ellipsis-horizontal-outline' },
]

export const PROVIDER_TYPES = [
  { id: 'WORKSHOP', label: 'ورشة / كراج' },
  { id: 'INDIVIDUAL', label: 'فني مستقل' },
  { id: 'MOBILE', label: 'خدمة متنقلة' },
  { id: 'COMPANY', label: 'مركز خدمة معتمد / شركة' },
]

export const WORKING_DAYS_OPTIONS = [
  'طوال أيام الأسبوع (يومياً)',
  'من السبت إلى الخميس',
  'من الأحد إلى الخميس',
  'أيام العطلات ونهاية الأسبوع فقط',
]

export const COMMON_SPECIALIZATIONS: Record<string, string[]> = {
  MAINTENANCE: ['تغيير زيت وفلاتر', 'ميكانيكا عامة', 'إصلاح تكييف', 'ميزان أذرعة وترصيص', 'كهرباء سيارات', 'صيانة دورية'],
  CLEANING: ['غسيل بخار', 'تلميع داخلي وخارجي', 'نانو سيراميك', 'تظليل وعازل حراري', 'حماية PPF', 'تنظيف محرك'],
  MODIFICATION: ['برمجة وتيربو', 'أنظمة عوادم (إكزوزت)', 'ترقية محركات', 'تعديل إضاءة', 'تعديل وتنزيل بدي'],
  INSPECTION: ['فحص كمبيوتر شامل', 'فحص شاسيه وبودي', 'فحص ما قبل الشراء', 'برمجة حساسات', 'إعادة ضبط النظام'],
  BODYWORK: ['سمكرة وتعديل صدمات', 'رش فرن ودهان وكالة', 'سحب شاسيه', 'تعديل بدون بوية (PDR)', 'تغيير قطع بودي'],
  ACCESSORIES_INSTALL: ['شاشات أندرويد وCarPlay', 'داش كام وكاميرات 360', 'أنظمة صوت ومكبرات', 'إضاءات محيطية Ambient', 'تنجيد مقاعد جلد'],
  KEYS_LOCKS: ['برمجة مفاتيح ذكية', 'قص مفاتيح ليزر', 'فتح سيارات مغلقة', 'تبديل بطاريات المفاتيح', 'إصلاح سويتش التشغيل'],
  TOWING: ['سطحة هيدروليك', 'سطحة ونش عادي', 'نقل بين المدن والمحافظات', 'خدمة مساعدة على الطريق', 'اشتراك بطارية وسحب'],
  OTHER_SERVICE: ['خدمات عامة', 'استشارات فنية', 'توصيل وتجهيز سيارات'],
}
