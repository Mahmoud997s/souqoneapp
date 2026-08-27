export interface FilterOption {
  value: string;
  labelAr: string;
  labelEn?: string;
}

export { GOVERNORATE_OPTIONS, WILAYAT_BY_GOVERNORATE } from './locations';

export const BODY_TYPES: FilterOption[] = [
  { value: 'SEDAN',     labelAr: 'سيدان' },
  { value: 'SUV',       labelAr: 'SUV' },
  { value: 'TRUCK',     labelAr: 'بيك أب' },
  { value: 'HATCHBACK', labelAr: 'هاتشباك' },
  { value: 'COUPE',     labelAr: 'كوبيه' },
  { value: 'VAN',       labelAr: 'فان' },
];

export const TRANSMISSION_TYPES: FilterOption[] = [
  { value: 'AUTOMATIC', labelAr: 'أوتوماتيك' },
  { value: 'MANUAL',    labelAr: 'يدوي' },
];

export const CONDITIONS: FilterOption[] = [
  { value: 'NEW',      labelAr: 'جديد' },
  { value: 'USED',     labelAr: 'مستعمل' },
  { value: 'LIKE_NEW', labelAr: 'شبه جديد' },
];

export const FUEL_TYPES: FilterOption[] = [
  { value: 'PETROL',   labelAr: 'بنزين' },
  { value: 'DIESEL',   labelAr: 'ديزل' },
  { value: 'HYBRID',   labelAr: 'هايبرد' },
  { value: 'ELECTRIC', labelAr: 'كهربائي' },
];

export const LISTING_TYPES: FilterOption[] = [
  { value: 'SALE',   labelAr: 'للبيع' },
  { value: 'RENTAL', labelAr: 'للإيجار' },
  { value: 'WANTED', labelAr: 'مطلوب' },
];

export const SORT_OPTIONS: FilterOption[] = [
  { value: 'createdAt_desc', labelAr: 'الأحدث' },
  { value: 'price_asc',      labelAr: 'السعر: الأقل' },
  { value: 'price_desc',     labelAr: 'السعر: الأعلى' },
  { value: 'year_desc',      labelAr: 'الأحدث سنة' },
  { value: 'mileage_asc',    labelAr: 'أقل كيلومترات' },
  { value: 'viewCount_desc', labelAr: 'الأكثر مشاهدة' },
];
