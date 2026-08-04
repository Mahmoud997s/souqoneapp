export interface PartCategoryOption {
  id: string
  label: string
  icon?: string
}

export const PART_CATEGORIES: PartCategoryOption[] = [
  { id: 'ENGINE', label: 'محرك وملحقاته', icon: 'speedometer-outline' },
  { id: 'BODY', label: 'الهيكل والبودي', icon: 'car-outline' },
  { id: 'ELECTRICAL', label: 'كهرباء وإلكترونيات', icon: 'flash-outline' },
  { id: 'SUSPENSION', label: 'مساعدات ونظام تعليق', icon: 'git-compare-outline' },
  { id: 'BRAKES', label: 'فرامل ومكابح', icon: 'disc-outline' },
  { id: 'INTERIOR', label: 'مقصورة وداخلية', icon: 'hardware-chip-outline' },
  { id: 'TIRES', label: 'إطارات وجنوط', icon: 'radio-button-on-outline' },
  { id: 'BATTERIES', label: 'بطاريات', icon: 'battery-charging-outline' },
  { id: 'OILS', label: 'زيوت وفلاتر', icon: 'water-outline' },
  { id: 'ACCESSORIES', label: 'إكسسوارات وزينة', icon: 'sparkles-outline' },
  { id: 'OTHER', label: 'أخرى', icon: 'ellipsis-horizontal-outline' },
]

export const PART_CONDITIONS = [
  { id: 'NEW', label: 'جديد' },
  { id: 'USED', label: 'مستعمل' },
  { id: 'REFURBISHED', label: 'مجدد / فحص' },
]

export const PART_ORIGINALITY_OPTIONS = [
  { value: true, label: 'أصلي وكالة' },
  { value: false, label: 'تجاري / بديل' },
]

export const POPULAR_PART_MAKES = [
  { id: 'all', label: 'متوافق مع الجميع' },
  { id: 'toyota', label: 'تويوتا' },
  { id: 'nissan', label: 'نيسان' },
  { id: 'lexus', label: 'لكزس' },
  { id: 'hyundai', label: 'هيونداي' },
  { id: 'kia', label: 'كيا' },
  { id: 'honda', label: 'هوندا' },
  { id: 'ford', label: 'فورد' },
  { id: 'chevrolet', label: 'شفروليه' },
  { id: 'gmc', label: 'جي إم سي' },
  { id: 'mercedes', label: 'مرسيدس' },
  { id: 'bmw', label: 'بي إم دبليو' },
  { id: 'audi', label: 'أودي' },
  { id: 'land_rover', label: 'لاند روفر' },
  { id: 'mitsubishi', label: 'ميتسوبيشي' },
  { id: 'mazda', label: 'مازدا' },
  { id: 'jeep', label: 'جيب' },
  { id: 'dodge', label: 'دودج' },
  { id: 'suzuki', label: 'سوزوكي' },
  { id: 'changan', label: 'شانجان' },
  { id: 'geely', label: 'جيلي' },
  { id: 'mg', label: 'إم جي' },
  { id: 'isuzu', label: 'إيسوزو' },
]
