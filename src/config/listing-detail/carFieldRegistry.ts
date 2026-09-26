import { CarDetailApi } from '../../types/carDetailApi.types'
import { CAR_FIELD_LABELS } from '../../constants/listing-detail/carFieldLabels'
import {
  findCarColor,
  translateCarInterior,
  FUEL_TYPES,
  TRANSMISSION_TYPES,
  BODY_TYPES,
  DRIVE_TYPES,
  CONDITION_TYPES,
  CANCELLATION_POLICIES,
  CAR_FEATURE_KEYS,
} from '../../constants/cars'
import { formatNumberWestern, parseDecimal } from '../../utils/listing-detail/formatters'

export interface FieldDef {
  id: string
  group: 'basic' | 'specs' | 'features' | 'rental' | 'location'
  label: string
  format: (raw: CarDetailApi) => string | null // null = hidden (no em-dash)
  swatch?: (raw: CarDetailApi) => string | undefined
  visibleWhen?: (raw: CarDetailApi) => boolean
}

export type FieldRegistry = readonly FieldDef[]

/**
 * Fields from CarFormData that are intentionally excluded from the specification
 * grid because they are rendered in specialized cards or represent wizard internal state.
 */
export const EXCLUDED_FROM_DETAIL: Record<string, string> = {
  // Title & Content
  title: 'Rendered prominently in the dedicated detail header and title card.',
  description: 'Rendered in the dedicated description card.',

  // Pricing & Commercial Badges
  listingType:
    'Rendered as a top-level badge in the header/price block (للبيع / للإيجار / مطلوب).',
  price: 'Rendered as the primary price highlight in the price block.',
  currency: 'Folded into the price display (e.g. "ر.ع").',
  isPriceNegotiable: 'Rendered as a "قابل للتفاوض" badge inside the price block.',
  dailyPrice:
    'Rendered as the primary daily rental rate in the price block for rental listings.',
  monthlyPrice:
    'Rendered as the monthly rental rate in the price block for rental listings.',

  // Media
  images: 'Rendered in the top media gallery / carousel.',
  existingImages:
    'Wizard internal tracking for existing image URLs during edit mode.',
  removedImageIds:
    'Wizard internal tracking for deleted image IDs during edit mode.',

  // Location
  governorateId: 'Master data ID resolved to governorate name.',
  wilayaId: 'Master data ID resolved to wilaya name.',
  governorateName: 'Rendered in the dedicated location info block.',
  wilayaName: 'Rendered in the dedicated location info block.',
  latitude: 'Rendered on the interactive map preview card.',
  longitude: 'Rendered on the interactive map preview card.',

  // Master Data IDs
  brandId: 'Master data ID resolved to make/brand name.',
  carModelId: 'Master data ID resolved to model name.',
  carTrimId: 'Master data ID resolved to trim name.',
  originalBrandId:
    'Wizard internal tracking for original brand during edit mode.',
  originalCarModelId:
    'Wizard internal tracking for original model during edit mode.',

  // Versioning & Wizard State
  version: 'Backend optimistic concurrency control counter; not user-facing.',
  editMode:
    'Wizard runtime flag indicating edit mode; not an entity property.',
  editListingId:
    'Wizard runtime state storing the ID of the listing being edited; not an entity property.',
}

/**
 * Canonical registry of specification and information fields displayed in the car detail page.
 * Guarantees 100% field parity with car ad creation form (CarFormData).
 */
export const carFieldRegistry: FieldRegistry = [
  // ── 1. Basic Specifications ──
  {
    id: 'make',
    group: 'basic',
    label: CAR_FIELD_LABELS.make,
    format: (raw) => raw.make?.trim() || null,
  },
  {
    id: 'model',
    group: 'basic',
    label: CAR_FIELD_LABELS.model,
    format: (raw) => raw.model?.trim() || null,
  },
  {
    id: 'trim',
    group: 'basic',
    label: CAR_FIELD_LABELS.trim,
    format: (raw) => raw.trim?.trim() || null,
  },
  {
    id: 'year',
    group: 'basic',
    label: CAR_FIELD_LABELS.year,
    format: (raw) => (raw.year ? String(raw.year) : null),
  },
  {
    id: 'condition',
    group: 'basic',
    label: CAR_FIELD_LABELS.condition,
    format: (raw) => {
      if (!raw.condition) return null
      return (
        CONDITION_TYPES.find((c) => c.value === raw.condition)?.label ||
        (raw.condition === 'NEW'
          ? 'جديد'
          : raw.condition === 'USED'
          ? 'مستعمل'
          : raw.condition)
      )
    },
  },

  // ── 2. Technical & Physical Specifications ──
  {
    id: 'mileage',
    group: 'specs',
    label: CAR_FIELD_LABELS.mileage,
    format: (raw) =>
      raw.mileage != null && !isNaN(raw.mileage)
        ? `${raw.mileage.toLocaleString('en-US')} كم`
        : null,
  },
  {
    id: 'transmission',
    group: 'specs',
    label: CAR_FIELD_LABELS.transmission,
    format: (raw) => {
      if (!raw.transmission) return null
      return (
        TRANSMISSION_TYPES.find((t) => t.value === raw.transmission)?.label ||
        (raw.transmission === 'AUTOMATIC'
          ? 'أوتوماتيك'
          : raw.transmission === 'MANUAL'
          ? 'عادي'
          : raw.transmission)
      )
    },
  },
  {
    id: 'fuelType',
    group: 'specs',
    label: CAR_FIELD_LABELS.fuelType,
    format: (raw) => {
      if (!raw.fuelType) return null
      return (
        FUEL_TYPES.find((f) => f.value === raw.fuelType)?.label ||
        (raw.fuelType === 'PETROL'
          ? 'بترول'
          : raw.fuelType === 'DIESEL'
          ? 'ديزل'
          : raw.fuelType === 'HYBRID'
          ? 'هجين'
          : raw.fuelType === 'ELECTRIC'
          ? 'كهربائي'
          : raw.fuelType)
      )
    },
  },
  {
    id: 'bodyType',
    group: 'specs',
    label: CAR_FIELD_LABELS.bodyType,
    format: (raw) => {
      if (!raw.bodyType) return null
      return (
        BODY_TYPES.find((b) => b.value === raw.bodyType)?.label || raw.bodyType
      )
    },
  },
  {
    id: 'driveType',
    group: 'specs',
    label: CAR_FIELD_LABELS.driveType,
    format: (raw) => {
      if (!raw.driveType) return null
      return (
        DRIVE_TYPES.find((d) => d.value === raw.driveType)?.label ||
        raw.driveType
      )
    },
  },
  {
    id: 'exteriorColor',
    group: 'specs',
    label: CAR_FIELD_LABELS.exteriorColor,
    format: (raw) => {
      if (!raw.exteriorColor) return null
      return findCarColor(raw.exteriorColor)?.label || raw.exteriorColor
    },
    swatch: (raw) => {
      if (!raw.exteriorColor) return undefined
      return findCarColor(raw.exteriorColor)?.hex
    },
  },
  {
    id: 'interior',
    group: 'specs',
    label: CAR_FIELD_LABELS.interior,
    format: (raw) => {
      if (!raw.interior) return null
      return translateCarInterior(raw.interior) || raw.interior.trim() || null
    },
  },
  {
    id: 'engineSize',
    group: 'specs',
    label: CAR_FIELD_LABELS.engineSize,
    format: (raw) => {
      if (!raw.engineSize?.trim()) return null
      const val = raw.engineSize.trim()
      const upper = val.toUpperCase()
      if (upper.includes('CC') || upper.includes('L')) return val
      return `${val} CC`
    },
  },
  {
    id: 'horsepower',
    group: 'specs',
    label: CAR_FIELD_LABELS.horsepower,
    format: (raw) =>
      raw.horsepower != null && !isNaN(raw.horsepower)
        ? `${raw.horsepower.toLocaleString('en-US')} حصان`
        : null,
  },
  {
    id: 'doors',
    group: 'specs',
    label: CAR_FIELD_LABELS.doors,
    format: (raw) =>
      raw.doors != null && !isNaN(raw.doors) ? String(raw.doors) : null,
  },
  {
    id: 'seats',
    group: 'specs',
    label: CAR_FIELD_LABELS.seats,
    format: (raw) =>
      raw.seats != null && !isNaN(raw.seats) ? String(raw.seats) : null,
  },

  // ── 3. Features ──
  {
    id: 'features',
    group: 'features',
    label: CAR_FIELD_LABELS.features,
    format: (raw) => {
      if (!Array.isArray(raw.features) || raw.features.length === 0) return null
      return raw.features
        .map((feat) => CAR_FEATURE_KEYS.find((f) => f.id === feat)?.label || feat)
        .join('، ')
    },
  },

  // ── 4. Rental Conditions (visible only when listingType === 'RENTAL') ──
  {
    id: 'depositAmount',
    group: 'rental',
    label: CAR_FIELD_LABELS.depositAmount,
    visibleWhen: (raw) => raw.listingType === 'RENTAL',
    format: (raw) => {
      const amount = parseDecimal(raw.depositAmount)
      return amount !== undefined ? `${formatNumberWestern(amount)} ر.ع` : null
    },
  },
  {
    id: 'minRentalDays',
    group: 'rental',
    label: CAR_FIELD_LABELS.minRentalDays,
    visibleWhen: (raw) => raw.listingType === 'RENTAL',
    format: (raw) => {
      if (raw.minRentalDays == null || isNaN(raw.minRentalDays)) return null
      const days = raw.minRentalDays
      const unit =
        days === 1
          ? 'يوم'
          : days === 2
          ? 'يومين'
          : days <= 10
          ? 'أيام'
          : 'يوم'
      return `${days} ${unit}`
    },
  },
  {
    id: 'kmLimitPerDay',
    group: 'rental',
    label: CAR_FIELD_LABELS.kmLimitPerDay,
    visibleWhen: (raw) => raw.listingType === 'RENTAL',
    format: (raw) =>
      raw.kmLimitPerDay != null && !isNaN(raw.kmLimitPerDay)
        ? `${raw.kmLimitPerDay.toLocaleString('en-US')} كم / يوم`
        : null,
  },
  {
    id: 'cancellationPolicy',
    group: 'rental',
    label: CAR_FIELD_LABELS.cancellationPolicy,
    visibleWhen: (raw) => raw.listingType === 'RENTAL',
    format: (raw) => {
      if (!raw.cancellationPolicy) return null
      return (
        CANCELLATION_POLICIES.find((p) => p.value === raw.cancellationPolicy)
          ?.label || raw.cancellationPolicy
      )
    },
  },
  {
    id: 'withDriver',
    group: 'rental',
    label: CAR_FIELD_LABELS.withDriver,
    visibleWhen: (raw) => raw.listingType === 'RENTAL',
    format: (raw) =>
      raw.withDriver != null
        ? raw.withDriver
          ? 'مع سائق'
          : 'بدون سائق'
        : null,
  },
  {
    id: 'deliveryAvailable',
    group: 'rental',
    label: CAR_FIELD_LABELS.deliveryAvailable,
    visibleWhen: (raw) => raw.listingType === 'RENTAL',
    format: (raw) =>
      raw.deliveryAvailable != null
        ? raw.deliveryAvailable
          ? 'متوفر'
          : 'غير متوفر'
        : null,
  },
  {
    id: 'insuranceIncluded',
    group: 'rental',
    label: CAR_FIELD_LABELS.insuranceIncluded,
    visibleWhen: (raw) => raw.listingType === 'RENTAL',
    format: (raw) =>
      raw.insuranceIncluded != null
        ? raw.insuranceIncluded
          ? 'شامل التأمين'
          : 'غير شامل'
        : null,
  },
]
