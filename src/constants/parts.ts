export interface PartCategoryOption {
  id: string
  label: string
  icon?: string
}

export const PART_CATEGORIES: PartCategoryOption[] = [
  { id: 'ENGINE', label: 'محرك وملحقاته', icon: 'engine' },
  { id: 'BODY', label: 'الهيكل والبودي', icon: 'car-side' },
  { id: 'ELECTRICAL', label: 'كهرباء وإلكترونيات', icon: 'car-electric' },
  { id: 'SUSPENSION', label: 'مساعدات ونظام تعليق', icon: 'car-esp' },
  { id: 'BRAKES', label: 'فرامل ومكابح', icon: 'car-brake-alert' },
  { id: 'INTERIOR', label: 'مقصورة وداخلية', icon: 'car-seat' },
  { id: 'TIRES', label: 'إطارات وجنوط', icon: 'tire' },
  { id: 'BATTERIES', label: 'بطاريات', icon: 'car-battery' },
  { id: 'OILS', label: 'زيوت وفلاتر', icon: 'oil' },
  { id: 'ACCESSORIES', label: 'إكسسوارات وزينة', icon: 'car-cog' },
  { id: 'OTHER', label: 'أخرى', icon: 'dots-horizontal' },
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
];

export const PARTS_PRICE_RANGES = [
  { id: 'p1', label: 'أقل من 20 ر.ع', min: 0, max: 20 },
  { id: 'p2', label: '20 - 50 ر.ع', min: 20, max: 50 },
  { id: 'p3', label: '50 - 100 ر.ع', min: 50, max: 100 },
  { id: 'p4', label: '100 - 250 ر.ع', min: 100, max: 250 },
  { id: 'p5', label: '250 - 500 ر.ع', min: 250, max: 500 },
  { id: 'p6', label: 'أكثر من 500 ر.ع', min: 500, max: null },
];

export const PARTS_SORT_OPTIONS = [
  { id: 'createdAt_desc', label: 'الأحدث أولاً', sortBy: 'createdAt', sortOrder: 'DESC' },
  { id: 'price_asc', label: 'الأقل سعراً', sortBy: 'price', sortOrder: 'ASC' },
  { id: 'price_desc', label: 'الأعلى سعراً', sortBy: 'price', sortOrder: 'DESC' },
];

export const PARTS_LISTING_TABS = [
  { id: 'ALL', label: 'الكل' },
  { id: 'ORIGINAL', label: 'أصلي وكالة' },
  { id: 'AFTERMARKET', label: 'تجاري معتمد' },
  { id: 'SCRAP', label: 'تشليح وسكراب' },
];

