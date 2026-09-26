import type { CarDetailViewModel } from '../../types/carDetailViewModel.types'

/**
 * Fixture: SALE_FULL
 * Standard sale listing with comprehensive vehicle details, multiple images, and GPS coordinates.
 */
export const FIXTURE_SALE_FULL: CarDetailViewModel = {
  id: 'car-sale-001',
  version: 1,
  status: 'ACTIVE',
  title: 'تويوتا لاندكروزر VXR 2024 فل كامل بحالة الوكالة',
  description:
    'سيارة تويوتا لاندكروزر VXR موديل 2024 بحالة الوكالة تماماً، صيانة دورية في الوكالة، بدون حوادث أو صبغ نهائياً.\nالمواصفات: محرك 3.5 لتر توين تيربو، دفع رباعي، فتحة سقف، شاشات خلفية، مقاعد جلد بيج تبريد وتسخين، رادار وتحديد مسار وكاميرات 360 درجة.\nالسيارة جاهزة للاستخدام الفوري مع تأمين شامل وفحص ساري.',
  listingType: 'SALE',
  condition: 'USED',
  conditionLabel: 'مستعمل ممتازة',
  price: {
    amount: 34500,
    formattedAmount: '34,500',
    currency: 'ر.ع',
    fullPriceLabel: '34,500 ر.ع',
    isNegotiable: true,
    listingType: 'SALE',
  },
  images: [
    {
      id: 'img-1',
      url: 'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=format&fit=crop&w=1200&q=80',
      order: 1,
      isPrimary: true,
    },
    {
      id: 'img-2',
      url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
      order: 2,
      isPrimary: false,
    },
    {
      id: 'img-3',
      url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
      order: 3,
      isPrimary: false,
    },
    {
      id: 'img-4',
      url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
      order: 4,
      isPrimary: false,
    },
  ],
  location: {
    governorateName: 'مسقط',
    wilayaName: 'السيب',
    fullLocationText: 'مسقط، السيب - الخوض',
    hasCoordinates: true,
    latitude: 23.6139,
    longitude: 58.1722,
  },
  seller: {
    id: 'seller-101',
    name: 'سالم بن علي الحارثي',
    username: 'salim_cars',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    isVerified: true,
    memberSinceLabel: 'عضو منذ يناير 2022',
    accountType: 'تاجر معتمد',
  },
  whatsappEnabled: true,
  postedAtLabel: 'منذ ساعتين',
  viewCount: 428,
  make: 'Toyota',
  model: 'Land Cruiser',
  trim: 'VXR',
  year: 2024,
  mileage: 18500,
  mileageLabel: '18,500 كم',
  keySpecs: [
    { key: 'year', label: 'سنة الصنع', value: '2024' },
    { key: 'mileage', label: 'المسافة المقطوعة', value: '18,500 كم' },
    { key: 'transmission', label: 'ناقل الحركة', value: 'أوتوماتيك 10 سرعات' },
    { key: 'fuel', label: 'نوع الوقود', value: 'بنزين' },
  ],
  specsSections: [
    {
      title: 'المواصفات الميكانيكية والمحرك',
      items: [
        { key: 'engine', label: 'سعة المحرك', value: '3.5 لتر توين تيربو V6' },
        { key: 'drivetrain', label: 'نظام الدفع', value: 'دفع رباعي مستمر 4WD' },
        { key: 'fuelType', label: 'نوع الوقود', value: 'بنزين ممتاز 95' },
        { key: 'fuelEconomy', label: 'استهلاك الوقود', value: '9.3 كم / لتر' },
      ],
    },
    {
      title: 'المواصفات الخارجية والراحة',
      items: [
        { key: 'color', label: 'اللون الخارجي', value: 'أبيض لؤلؤي' },
        { key: 'interiorColor', label: 'اللون الداخلي', value: 'بيج فاتح' },
        { key: 'wheels', label: 'مقاس العجلات', value: 'جنوط 20 إنش ألومنيوم' },
        { key: 'sunroof', label: 'فتحة السقف', value: 'فتحة سقف كهربائية بانورامية' },
      ],
    },
  ],
  features: [
    'دخول ذكي بدون مفتاح',
    'تشغيل عن بعد',
    'كاميرات 360 درجة',
    'شاشات خلفية للمقاعد',
    'نظام صوتي JBL فاخر',
    'تبريد وتسخين المقاعد',
    'نظام النقطة العمياء',
    'رادار تفاعلي لتجنب الاصطدام',
  ],
}

/**
 * Fixture: RENTAL_FULL
 * Car rental listing featuring daily and monthly rental terms and delivery options.
 */
export const FIXTURE_RENTAL_FULL: CarDetailViewModel = {
  ...FIXTURE_SALE_FULL,
  id: 'car-rental-002',
  title: 'تويوتا لاندكروزر VXR 2024 للإيجار اليومي والشهري',
  listingType: 'RENTAL',
  price: {
    amount: 65,
    formattedAmount: '65',
    currency: 'ر.ع',
    fullPriceLabel: '65 ر.ع / يوم',
    isNegotiable: false,
    listingType: 'RENTAL',
    caption: 'للإيجار اليومي',
    dailyRate: {
      amount: 65,
      formatted: '65',
      label: 'الإيجار اليومي',
    },
    monthlyRate: {
      amount: 1450,
      formatted: '1,450',
      label: 'الإيجار الشهري',
    },
  },
  rentalTerms: {
    minRentalDays: 2,
    depositAmount: 100,
    depositLabel: '100 ر.ع تأمين مسترد',
    kmLimitPerDay: 300,
    kmLimitLabel: '300 كم / يوم',
    cancellationPolicy: 'إلغاء مجاني قبل 24 ساعة من موعد الاستلام',
    withDriver: false,
    deliveryAvailable: true,
    insuranceIncluded: true,
  },
}

/**
 * Fixture: WANTED_FULL
 * Car wanted / requested purchase scenario.
 */
export const FIXTURE_WANTED_FULL: CarDetailViewModel = {
  ...FIXTURE_SALE_FULL,
  id: 'car-wanted-003',
  title: 'مطلوب تويوتا لاندكروزر VXR من موديل 2022 إلى 2024 كاش',
  description:
    'مطلوب للشراء العاجل: تويوتا لاندكروزر VXR نظيفة جداً وخالية من الصبغ والحوادث، الدفع نقدي كاش فور الفحص والمعاينة.',
  listingType: 'WANTED',
  price: {
    amount: 32000,
    formattedAmount: '32,000',
    currency: 'ر.ع',
    fullPriceLabel: 'الميزانية حتى 32,000 ر.ع',
    isNegotiable: true,
    listingType: 'WANTED',
  },
  conditionLabel: 'مطلوب بحالة ممتازة',
}

/**
 * Fixture: ZERO_IMAGES
 * Listing with no photos uploaded.
 */
export const FIXTURE_ZERO_IMAGES: CarDetailViewModel = {
  ...FIXTURE_SALE_FULL,
  id: 'car-no-images-004',
  title: 'تويوتا لاندكروزر VXR 2024 (بدون صور)',
  images: [],
}

/**
 * Fixture: NO_COORDINATES
 * Listing located without GPS map coordinates.
 */
export const FIXTURE_NO_COORDINATES: CarDetailViewModel = {
  ...FIXTURE_SALE_FULL,
  id: 'car-no-coords-005',
  title: 'تويوتا لاندكروزر VXR 2024 (بدون إحداثيات موقع)',
  location: {
    governorateName: 'مسقط',
    wilayaName: 'السيب',
    fullLocationText: 'مسقط، السيب',
    hasCoordinates: false,
  },
}

/**
 * Fixture: NO_WHATSAPP
 * Seller disabled WhatsApp contact (should trigger noWhatsapp mode).
 */
export const FIXTURE_NO_WHATSAPP: CarDetailViewModel = {
  ...FIXTURE_SALE_FULL,
  id: 'car-no-whatsapp-006',
  title: 'تويوتا لاندكروزر VXR 2024 (الواتساب مغلق)',
  whatsappEnabled: false,
}

/**
 * Fixture: CHAT_ONLY
 * Contactable via in-app chat only.
 */
export const FIXTURE_CHAT_ONLY: CarDetailViewModel = {
  ...FIXTURE_SALE_FULL,
  id: 'car-chat-only-007',
  title: 'تويوتا لاندكروزر VXR 2024 (محادثة داخلية فقط)',
  whatsappEnabled: false,
}

/**
 * Fixture: SOLD_STATUS
 * Listing marked as SOLD (triggers status badge + hidden contact actions).
 */
export const FIXTURE_SOLD_STATUS: CarDetailViewModel = {
  ...FIXTURE_SALE_FULL,
  id: 'car-sold-008',
  status: 'SOLD',
  title: 'تويوتا لاندكروزر VXR 2024 (تم البيع)',
}

/**
 * Fixture: ARCHIVED_STATUS
 * Listing in ARCHIVED state.
 */
export const FIXTURE_ARCHIVED_STATUS: CarDetailViewModel = {
  ...FIXTURE_SALE_FULL,
  id: 'car-archived-009',
  status: 'ARCHIVED',
  title: 'تويوتا لاندكروزر VXR 2024 (مؤرشف)',
}

export interface ScenarioItem {
  id: string
  label: string
  data: CarDetailViewModel
}

export const SCENARIOS: ScenarioItem[] = [
  { id: 'sale_full', label: 'بيع كامل', data: FIXTURE_SALE_FULL },
  { id: 'rental_full', label: 'إيجار كامل', data: FIXTURE_RENTAL_FULL },
  { id: 'wanted_full', label: 'مطلوب للشراء', data: FIXTURE_WANTED_FULL },
  { id: 'zero_images', label: 'بدون صور', data: FIXTURE_ZERO_IMAGES },
  { id: 'no_coords', label: 'بدون خريطة', data: FIXTURE_NO_COORDINATES },
  { id: 'no_whatsapp', label: 'بدون واتساب', data: FIXTURE_NO_WHATSAPP },
  { id: 'chat_only', label: 'شات فقط', data: FIXTURE_CHAT_ONLY },
  { id: 'sold', label: 'تم البيع', data: FIXTURE_SOLD_STATUS },
  { id: 'archived', label: 'مؤرشف', data: FIXTURE_ARCHIVED_STATUS },
]
