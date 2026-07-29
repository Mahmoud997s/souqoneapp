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

export function resolveLocationGov(code: string | undefined): string {
  if (!code) return ''
  const gov = OMAN_LOCATIONS.find(g => 
    g.id === code || 
    g.legacyId === code || 
    (g.altLegacyIds && g.altLegacyIds.includes(code))
  )
  return gov ? gov.labelAr : code
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

export function formatLocation(item: any): string {
  let gov = String(item.governorate || '').trim()
  const govLower = gov.toLowerCase()
  const govOption = GOVERNORATE_OPTIONS.find(o => o.value.toLowerCase() === govLower)
  if (govOption) {
    gov = govOption.labelAr
  } else {
    const postGov = POST_GOVERNORATES.find(g => g.value.toLowerCase() === govLower)
    if (postGov) gov = postGov.label
  }

  let city = String(item.region || item.city || '').trim()
  const cityLower = city.toLowerCase()
  if (cityLower) {
    for (const govKey in POST_CITIES_BY_GOVERNORATE) {
      const cityOption = POST_CITIES_BY_GOVERNORATE[govKey].find(c => c.value.toLowerCase() === cityLower)
      if (cityOption) {
        city = cityOption.label
        break
      }
    }
  }

  if (gov && city && gov !== city) return `${gov}، ${city}`
  return gov || city || ''
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
  }
}

// ── Parts ────────────────────────────────────────────────────────────────────
export function mapPartToCard(item: any): UnifiedCardItem {
  const price = safePrice(item.price)
  const details: { icon: string; value: string }[] = []
  if (item.brand)
    details.push({ icon: 'car-outline', value: item.brand })
  if (item.compatibility)
    details.push({ icon: 'settings-outline', value: item.compatibility })

  return {
    id: item.id,
    title: item.partName ?? item.title ?? '',
    price: price > 0 ? price : undefined,
    priceText: price <= 0 ? 'تواصل للسعر' : undefined,
    currency: item.currency ?? 'ر.ع.',
    governorate: formatLocation(item),
    images: extractImages(item.images),
    condition: item.condition?.toUpperCase(),
    category: 'parts',
    listingType: (item.listingType || item.type)?.toUpperCase(),
    details: details.length > 0 ? details : undefined,
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
    title: item.title ?? '',
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
