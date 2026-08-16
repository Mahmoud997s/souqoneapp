import { UnifiedCardItem } from '../components/cards/UnifiedCard'
import { GOVERNORATE_OPTIONS, FilterOption } from '../constants/filters'
import { POST_GOVERNORATES, POST_CITIES_BY_GOVERNORATE, OMAN_LOCATIONS } from '../constants/locations'

export function translateEnum(value: string | undefined | null, options: FilterOption[]): string {
  if (!value) return '';
  const opt = options.find(o => o.value.toUpperCase() === value.toUpperCase());
  return opt ? opt.labelAr : value;
}

const TRANS_LABELS: Record<string, string> = {
  AUTOMATIC: 'أوتوماتيك', MANUAL: 'عادي',
}

const JOB_TYPE_LABELS: Record<string, string> = {
  'full-time': 'دوام كامل', 'part-time': 'دوام جزئي', contract: 'عقد',
  FULL_TIME: 'دوام كامل', PART_TIME: 'دوام جزئي', CONTRACT: 'عقد',
  TEMPORARY: 'مؤقت',
  HIRING: 'طلب سائق', OFFERING: 'عرض خدمة',
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  GOODS: 'بضائع عامة',
  FURNITURE: 'أثاث ومنزليات',
  CONSTRUCTION: 'مواد البناء',
  HEAVY: 'شحن ثقيل',
  BACKLOAD: 'عودة فارغة',
  EQUIPMENT: 'معدات وآليات',
}

const REQUEST_STATUS_LABELS: Record<string, string> = {
  OPEN: 'مفتوح',
  QUOTED: 'وصلت عروض',
  ACCEPTED: 'مقبول',
  IN_PROGRESS: 'جارٍ التنفيذ',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغى',
  EXPIRED: 'منتهي الصلاحية',
}

const SALARY_PERIOD_LABELS: Record<string, string> = {
  DAILY: 'يوم',
  MONTHLY: 'شهر',
  YEARLY: 'سنة',
  NEGOTIABLE: 'قابل للتفاوض',
}

const LICENSE_TYPE_LABELS: Record<string, string> = {
  LIGHT: 'رخصة خفيفة',
  HEAVY: 'رخصة ثقيلة',
  TRANSPORT: 'رخصة نقل',
  BUS: 'رخصة حافلات',
  MOTORCYCLE: 'رخصة دراجة',
}

function formatBudget(min: any, max: any): string {
  const minN = parseFloat(String(min ?? '0'))
  const maxN = parseFloat(String(max ?? '0'))
  if (minN > 0 && maxN > 0)
    return `${minN.toLocaleString('en-US')} - ${maxN.toLocaleString('en-US')} ر.ع.`
  if (minN > 0)
    return `من ${minN.toLocaleString('en-US')} ر.ع.`
  if (maxN > 0)
    return `حتى ${maxN.toLocaleString('en-US')} ر.ع.`
  return 'تواصل للسعر'
}

import { getStrictGovernorate } from './omanLocationMapper';

export function resolveLocationGov(code: string | undefined): string {
  return getStrictGovernorate(code);
}

function extractImages(images: any): string[] {
  return (images ?? []).map((img: any) =>
    typeof img === 'string' ? img : img.url ?? img.path ?? ''
  ).filter(Boolean)
}

function safePrice(val: any): number {
  const n = parseFloat(String(val ?? '0'))
  return isNaN(n) ? 0 : n
}

import { formatOmanLocation } from './omanLocationMapper';

/**
 * Translates raw API governorate/city codes into Arabic labels.
 * ⚠️ IMPORTANT: This function should ONLY be called inside mapper functions
 * (mapListingToCard, mapEquipmentToCard, etc.) — NEVER inside Card components.
 * Card components should read the pre-translated `item.governorate` field directly.
 */
export const formatLocation = (item: any): string => {
  if (item.governorateRef) {
    const govName = item.governorateRef.nameAr || item.governorateRef.name;
    const wilName = item.wilayaRef ? (item.wilayaRef.nameAr || item.wilayaRef.name) : '';
    return wilName ? `${govName}، ${wilName}` : govName;
  }
  return formatOmanLocation(item.governorate, item.region || item.city);
}

export function formatSpec(value: any, prefix: string): string {
  if (!value) return '';
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (parsed && typeof parsed === 'object') {
      const v = parsed.value ?? '';
      const u = parsed.unit ?? '';
      return `${prefix}: ${v} ${u}`.trim();
    }
  } catch (e) {
    // not json
  }
  return `${prefix}: ${value}`;
}

// ── Listings (cars + general) ────────────────────────────────────────────────
export function mapListingToCard(item: any): UnifiedCardItem {
  const rawPrice  = safePrice(item.price)
  const dailyPrice = safePrice(item.dailyPrice)
  const isRental  = item.listingType === 'RENTAL'

  let price: number | undefined
  let priceText: string | undefined
  let priceLabel: string | undefined

  if (isRental && rawPrice === 0 && dailyPrice > 0) {
    price = dailyPrice; priceLabel = 'يوم'
  } else if (rawPrice > 0) {
    price = rawPrice
  } else {
    priceText = 'تواصل للسعر'
  }

  const details: { icon: string; value: string }[] = []
  if (item.year) details.push({ icon: 'calendar-outline', value: String(item.year) })
  if (item.make && item.model) details.push({ icon: 'car-outline', value: `${item.make} ${item.model}` })
  else if (item.make) details.push({ icon: 'car-outline', value: item.make })
  if (item.mileage && item.mileage > 0)
    details.push({ icon: 'speedometer-outline', value: `${Number(item.mileage).toLocaleString('en-US')} كم` })
  if (item.transmission)
    details.push({ icon: 'settings-outline', value: TRANS_LABELS[item.transmission?.toUpperCase()] ?? item.transmission })

  return {
    id: item.id,
    title: item.title ?? '',
    price, priceText, priceLabel,
    currency: item.currency ?? 'ر.ع.',
    governorate: formatLocation(item),
    images: extractImages(item.images),
    condition: item.condition?.toUpperCase(),
    listingType: (item.listingType || item.type)?.toUpperCase(),
    isPremium: item.isPremium ?? false,
    isVerified: item.seller?.isVerified ?? false,
    category: item.category ?? 'cars',
    details: details.length > 0 ? details : undefined,
    raw: item,
  }
}

// ── Jobs ─────────────────────────────────────────────────────────────────────
export function mapJobToCard(item: any): UnifiedCardItem {
  const salary = safePrice(item.salary)
  const period = SALARY_PERIOD_LABELS[item.salaryPeriod] ?? ''
  const govLabel = resolveLocationGov(item.governorate)
  const location = govLabel + (item.city ? ` — ${item.city}` : '')

  const details: { icon: string; value: string }[] = []
  details.push({
    icon: 'briefcase-outline',
    value: JOB_TYPE_LABELS[item.jobType] ?? item.jobType ?? '',
  })
  if (item.employmentType)
    details.push({ icon: 'time-outline', value: JOB_TYPE_LABELS[item.employmentType] ?? item.employmentType })
  if (item.experienceYears != null && item.experienceYears > 0)
    details.push({ icon: 'star-outline', value: `${item.experienceYears} سنة خبرة` })
  if (item.licenseTypes?.length > 0)
    details.push({ icon: 'card-outline', value: item.licenseTypes.map((lt: string) => LICENSE_TYPE_LABELS[lt] ?? lt).join('، ') })

  let priceLabel: string | undefined
  if (salary > 0 && period) priceLabel = period
  else if (salary > 0) priceLabel = 'شهر'

  return {
    id: item.id,
    title: item.title ?? '',
    price: salary > 0 ? salary : undefined,
    priceLabel,
    priceText: salary <= 0 ? 'قابل للتفاوض' : undefined,
    currency: item.currency ?? 'ر.ع.',
    governorate: location,
    images: extractImages(item.images),
    category: 'jobs',
    listingType: item.jobType === 'HIRING' ? 'HIRING' : 'OFFERING',
    details: details.length > 0 ? details : undefined,
    description: item.description,
    raw: item,
  }
}

// ── Services ─────────────────────────────────────────────────────────────────
export function mapServiceToCard(item: any): UnifiedCardItem {
  const price = safePrice(item.pricePerHour ?? item.price ?? item.priceFrom)
  const details: { icon: string; value: string }[] = []
  if (item.serviceType)
    details.push({ icon: 'build-outline', value: item.serviceType })

  return {
    id: item.id,
    title: item.serviceName ?? item.title ?? '',
    price: price > 0 ? price : undefined,
    priceLabel: price > 0 ? 'ساعة' : undefined,
    priceText: price <= 0 ? 'تواصل للسعر' : undefined,
    currency: 'ر.ع.',
    governorate: formatLocation(item),
    images: extractImages(item.images),
    category: 'services',
    details: details.length > 0 ? details : undefined,
    raw: item,
  }
}

// ── Parts ────────────────────────────────────────────────────────────────────
export function mapPartToCard(item: any): UnifiedCardItem {
  if (!item || typeof item !== 'object') {
    return {
      id: '',
      title: 'قطعة غيار',
      category: 'parts',
      images: [],
    } as UnifiedCardItem;
  }
  const price = safePrice(item.price)
  const details: { icon: string; value: string }[] = []

  const CATEGORY_MAP: Record<string, string> = {
    ENGINE: 'محرك وملحقاته',
    BODY: 'الهيكل والبودي',
    ELECTRICAL: 'كهرباء وإلكترونيات',
    SUSPENSION: 'مساعدات وتعليق',
    BRAKES: 'فرامل ومكابح',
    INTERIOR: 'مقصورة وداخلية',
    TIRES: 'إطارات وجنوط',
    BATTERIES: 'بطاريات',
    OILS: 'زيوت وفلاتر',
    ACCESSORIES: 'إكسسوارات وزينة',
    OTHER: 'أخرى',
  }

  const CONDITION_MAP: Record<string, string> = {
    NEW: 'جديد',
    LIKE_NEW: 'شبه جديد',
    USED: 'مستعمل',
    REFURBISHED: 'مجدد',
    GOOD: 'جيد',
    FAIR: 'مقبول',
  }

  const rawCat = item.partCategory || item.category
  if (rawCat && CATEGORY_MAP[rawCat]) {
    details.push({ icon: 'grid-outline', value: CATEGORY_MAP[rawCat] })
  }

  if (item.partNumber) {
    details.push({ icon: 'barcode-outline', value: item.partNumber })
  }

  if (Array.isArray(item.compatibleMakes) && item.compatibleMakes.length > 0) {
    const makesStr = item.compatibleMakes.filter((m: string) => m !== 'all').join('، ')
    if (makesStr) {
      details.push({ icon: 'car-outline', value: makesStr })
    } else if (item.compatibleMakes.includes('all')) {
      details.push({ icon: 'car-outline', value: 'متوافق مع الجميع' })
    }
  } else if (item.brand) {
    details.push({ icon: 'car-outline', value: item.brand })
  }

  if (item.compatibleModels) {
    const modelsStr = Array.isArray(item.compatibleModels)
      ? item.compatibleModels.join('، ')
      : String(item.compatibleModels)
    if (modelsStr) {
      details.push({ icon: 'car-sport-outline', value: modelsStr })
    }
  }

  if (item.yearFrom && item.yearTo) {
    details.push({ icon: 'calendar-outline', value: `${item.yearFrom} - ${item.yearTo}` })
  } else if (item.yearFrom) {
    details.push({ icon: 'calendar-outline', value: `من ${item.yearFrom}` })
  } else if (item.yearTo) {
    details.push({ icon: 'calendar-outline', value: `حتى ${item.yearTo}` })
  }

  const rawCond = String(item.condition || '').toUpperCase()
  const conditionLabel = CONDITION_MAP[rawCond] || item.condition

  return {
    id: item.id,
    title: item.partName ?? item.title ?? (item.brand ? `قطعة ${item.brand}` : 'قطعة غيار'),
    price: price > 0 ? price : undefined,
    priceText: price <= 0 ? 'تواصل للسعر' : undefined,
    currency: item.currency ?? 'ر.ع.',
    governorate: formatLocation(item),
    images: extractImages(item.images),
    isPremium: item.isPremium ?? false,
    isVerified: item.seller?.isVerified ?? item.user?.isVerified ?? false,
    condition: conditionLabel,
    category: 'parts',
    listingType: (item.listingType || item.type)?.toUpperCase(),
    details: details.length > 0 ? details : undefined,
    raw: item,
  }
}

// ── Buses ────────────────────────────────────────────────────────────────────
export function mapBusToCard(item: any): UnifiedCardItem {
  const isRent = item.busListingType === 'BUS_RENT'
  const isContract = item.busListingType === 'BUS_SALE_WITH_CONTRACT'
  
  let price = safePrice(item.price)
  let priceText: string | undefined
  let priceLabel: string | undefined

  if (isRent) {
    if (safePrice(item.dailyPrice) > 0) {
      price = safePrice(item.dailyPrice)
      priceLabel = 'يوم'
    } else if (safePrice(item.monthlyPrice) > 0) {
      price = safePrice(item.monthlyPrice)
      priceLabel = 'شهر'
    }
  }

  const details: { icon: string; value: string }[] = []
  
  if (isRent) {
    details.push({ icon: 'time-outline', value: 'تأجير' })
  } else if (!isContract) {
    details.push({ icon: 'pricetag-outline', value: 'للبيع' })
  }
  
  if (item.busType) {
    const types: Record<string, string> = {
      'MINI_BUS': 'ميني باص', 'MEDIUM_BUS': 'حافلة متوسطة', 'LARGE_BUS': 'حافلة كبيرة',
      'COASTER': 'كوستر', 'SCHOOL_BUS': 'حافلة مدرسية',
    }
    details.push({ icon: 'list-outline', value: types[item.busType] || item.busType })
  }
  
  if (item.capacity)
    details.push({ icon: 'people-outline', value: `${item.capacity} راكب` })
  
  if (item.year)
    details.push({ icon: 'calendar-outline', value: String(item.year) })
    
  if (item.mileage)
    details.push({ icon: 'speedometer-outline', value: `${(Number(item.mileage)/1000).toFixed(0)}k كم` })
  else if (item.make)
    details.push({ icon: 'bus-outline', value: item.make })
    
  if (isContract) {
    details.push({ icon: 'document-text-outline', value: 'عقد تشغيل' })
  }

  return {
    id: item.id,
    title: item.title ?? item.model ?? item.make ?? 'حافلة',
    price: price > 0 ? price : undefined,
    priceText: price <= 0 ? 'تواصل للسعر' : priceText,
    priceLabel,
    currency: item.currency ?? 'ر.ع.',
    governorate: formatLocation(item),
    images: extractImages(item.images),
    listingType: (item.busListingType || item.listingType || item.type)?.toUpperCase(),
    category: 'buses',
    details: details.length > 0 ? details : undefined,
    raw: item,
  }
}

// ── Equipment ────────────────────────────────────────────────────────────────
export function mapEquipmentToCard(item: any): UnifiedCardItem {
  const rawPrice = safePrice(item.price)
  const dailyPrice = safePrice(item.dailyPrice)
  const isRental = item.listingType === 'EQUIPMENT_RENT' || item.listingType === 'RENTAL'
  const isWanted = item.listingType === 'EQUIPMENT_WANTED' || item.listingType === 'WANTED'

  let price: number | undefined
  let priceText: string | undefined
  let priceLabel: string | undefined

  if (isWanted) {
    priceText = formatBudget(item.budgetMin, item.budgetMax)
    if (priceText !== 'تواصل للسعر') {
      price = safePrice(item.budgetMax ?? item.budgetMin)
    }
  } else if (isRental && rawPrice === 0 && dailyPrice > 0) {
    price = dailyPrice
    priceLabel = 'يوم'
  } else if (rawPrice > 0) {
    price = rawPrice
  } else {
    priceText = 'تواصل للسعر'
  }

  const details: { icon: string; value: string }[] = []
  
  if (item.equipmentType) {
    const { getEquipmentTypeLabel } = require('./equipment-mappers')
    details.push({ icon: 'hardware-chip-outline', value: getEquipmentTypeLabel(item.equipmentType) })
  }
  
  if (item.make && item.model)
    details.push({ icon: 'car-sport-outline', value: `${item.make} ${item.model}` })
  else if (item.make)
    details.push({ icon: 'car-sport-outline', value: item.make })

  if (item.year)
    details.push({ icon: 'calendar-outline', value: String(item.year) })
    
  if (item.hoursUsed && item.hoursUsed > 0)
    details.push({ icon: 'time-outline', value: `${item.hoursUsed.toLocaleString('en-US')} ساعة` })

  if (item.capacity)
    details.push({ icon: 'cube-outline', value: formatSpec(item.capacity, 'السعة') })
    
  if (item.power)
    details.push({ icon: 'flash-outline', value: formatSpec(item.power, 'القوة') })
    
  if (item.weight)
    details.push({ icon: 'barbell-outline', value: formatSpec(item.weight, 'الوزن') })

  return {
    id: item.id,
    title: (() => {
      if (item.title) return item.title
      const { getEquipmentTypeLabel } = require('./equipment-mappers')
      const typeLabel = getEquipmentTypeLabel(item.equipmentType || item.details?.equipmentType)
      const parts = [typeLabel, item.make || item.details?.make, item.model || item.details?.model, item.year || item.details?.year].filter(Boolean)
      return parts.length > 0 ? parts.join(' ') : 'إعلان معدة'
    })(),
    price,
    priceText,
    priceLabel,
    currency: item.currency ?? 'ر.ع.',
    governorate: formatLocation(item),
    images: extractImages(item.images),
    isPremium: item.isPremium ?? false,
    isVerified: item.seller?.isVerified ?? item.user?.isVerified ?? false,
    condition: item.condition ? require('./equipment-mappers').getEquipmentConditionLabel(item.condition) : undefined,
    category: 'equipment',
    listingType: (item.listingType || item.type)?.toUpperCase(),
    details: details.length > 0 ? details : undefined,
    raw: item,
  }
}

// ── Operators ────────────────────────────────────────────────────────────────
export function mapOperatorToCard(item: any): UnifiedCardItem {
  const dailyRate = safePrice(item.dailyRate)
  const hourlyRate = safePrice(item.hourlyRate)

  let price: number | undefined
  let priceText: string | undefined
  let priceLabel: string | undefined

  if (dailyRate > 0) {
    price = dailyRate
    priceLabel = 'يوم'
  } else if (hourlyRate > 0) {
    price = hourlyRate
    priceLabel = 'ساعة'
  } else {
    priceText = 'تواصل للسعر'
  }

  const details: { icon: string; value: string }[] = []
  
  if (item.operatorType) {
    const { getOperatorTypeLabel } = require('./equipment-mappers')
    details.push({ icon: 'person-outline', value: getOperatorTypeLabel(item.operatorType) })
  }
  
  if (item.experienceYears && item.experienceYears > 0)
    details.push({ icon: 'star-outline', value: `${item.experienceYears} سنة خبرة` })

  return {
    id: item.id,
    title: item.title ?? '',
    price,
    priceText,
    priceLabel,
    currency: item.currency ?? 'ر.ع.',
    governorate: formatLocation(item),
    images: extractImages(item.images),
    isPremium: item.isPremium ?? false,
    isVerified: item.seller?.isVerified ?? item.user?.isVerified ?? false,
    category: 'operators',
    listingType: 'OPERATOR',
    details: details.length > 0 ? details : undefined,
    raw: item,
  }
}

// ── Transport requests ───────────────────────────────────────────────────────
export function mapTransportToCard(item: any): UnifiedCardItem {
  const fromLabel = formatLocation({ governorate: item.fromGovernorate, city: item.fromCity })
  const toLabel = formatLocation({ governorate: item.toGovernorate, city: item.toCity })
  const title = SERVICE_TYPE_LABELS[item.serviceType] ?? item.serviceType ?? 'طلب نقل'
  const quotesCount = item._count?.quotes ?? item.quotesCount ?? 0

  const details: { icon: string; value: string }[] = []
  details.push({ icon: 'navigate-outline', value: `${fromLabel} → ${toLabel}` })
  if (item.weightTons)
    details.push({ icon: 'barbell-outline', value: `${item.weightTons} طن` })
  if (quotesCount > 0)
    details.push({ icon: 'chatbubbles-outline', value: `${quotesCount} عرض` })

  const budgetText = formatBudget(item.budgetMin, item.budgetMax)
  const hasBudget = budgetText !== 'تواصل للسعر'

  return {
    id: item.id,
    title,
    priceText: budgetText,
    price: hasBudget ? safePrice(item.budgetMax ?? item.budgetMin) : undefined,
    currency: item.currency ?? 'ر.ع.',
    governorate: fromLabel,
    images: [],
    category: 'transport',
    listingType: REQUEST_STATUS_LABELS[item.status] ?? item.status,
    details: details.length > 0 ? details : undefined,
    description: item.cargoDescription,
    raw: item,
  }
}
