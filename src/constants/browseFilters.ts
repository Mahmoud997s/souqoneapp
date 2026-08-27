export const DROPDOWN_FILTERS = [
  { id: 'make', label: 'الماركة', icon: 'car-sport-outline' },
  { id: 'price', label: 'السعر', icon: 'wallet-outline' },
  { id: 'year', label: 'سنة الصنع', icon: 'calendar-outline' },
  { id: 'city', label: 'المدينة', icon: 'location-outline' },
  { id: 'type', label: 'الشكل', icon: 'car-outline' },
  { id: 'sort', label: 'الترتيب', icon: 'swap-vertical-outline' },
];

export const SORT_OPTIONS = [
  { id: 'createdAt_desc', label: 'الأحدث أولاً', sortBy: 'createdAt', sortOrder: 'desc' },
  { id: 'price_asc', label: 'الأقل سعراً', sortBy: 'price', sortOrder: 'asc' },
  { id: 'price_desc', label: 'الأعلى سعراً', sortBy: 'price', sortOrder: 'desc' },
  { id: 'year_desc', label: 'سنة الصنع الأحدث', sortBy: 'year', sortOrder: 'desc' },
];

export const PRICE_RANGES = [
  { id: 'p1', label: 'أقل من 1,000 ر.ع', min: 0, max: 1000 },
  { id: 'p2', label: '1,000 - 3,000 ر.ع', min: 1000, max: 3000 },
  { id: 'p3', label: '3,000 - 6,000 ر.ع', min: 3000, max: 6000 },
  { id: 'p4', label: '6,000 - 10,000 ر.ع', min: 6000, max: 10000 },
  { id: 'p5', label: '10,000 - 15,000 ر.ع', min: 10000, max: 15000 },
  { id: 'p6', label: 'أكثر من 15,000 ر.ع', min: 15000, max: null },
];

export const YEARS = Array.from({ length: 35 }, (_, i) => new Date().getFullYear() - i);

export const LISTING_TYPES = [
  { id: 'SALE', label: 'للبيع' },
  { id: 'RENTAL', label: 'للإيجار' },
  { id: 'WANTED', label: 'مطلوب' },
];

export const CAR_TYPES = [
  { id: 'sedan', name: 'سيدان' },
  { id: 'suv', name: 'دفع رباعي' },
  { id: 'hatchback', name: 'هاتشباك' },
  { id: 'truck', name: 'بيك أب' },
  { id: 'coupe', name: 'كوبيه' },
];
