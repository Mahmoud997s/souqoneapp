import type { Href } from 'expo-router'
import { resolveContactEntityType } from '../utils/contactEntityType'
import { carListingToFormData } from '../utils/listing-detail/carListingToFormData'
import { useCarWizardStore } from '../store/carWizardStore'
import {
  usePartWizardStore,
  resolvePartListingType,
  type PartCategoryValue,
  type PartConditionValue,
  type WarrantyDurationValue,
  type QuantityRangeValue,
  type CompatibleVehicleType,
} from '../store/partWizardStore'
import { useServiceWizardStore } from '../store/serviceWizardStore'

export type CarDetailApiInput = Parameters<typeof carListingToFormData>[0]

export type ListingRouteEntityType =
  | 'LISTING'
  | 'BUS_LISTING'
  | 'EQUIPMENT_LISTING'
  | 'OPERATOR_LISTING'
  | 'SPARE_PART'
  | 'CAR_SERVICE'

const LISTING_ENTITY_SET = new Set<string>([
  'LISTING',
  'BUS_LISTING',
  'EQUIPMENT_LISTING',
  'OPERATOR_LISTING',
  'SPARE_PART',
  'CAR_SERVICE',
])

export function normalizeListingEntityType(
  rawType?: string | null,
  item?: object | null
): ListingRouteEntityType {
  const upper = (rawType ?? '').trim().toUpperCase()
  if (LISTING_ENTITY_SET.has(upper)) {
    return upper as ListingRouteEntityType
  }
  const resolved = resolveContactEntityType(rawType ?? undefined, item)
  if (LISTING_ENTITY_SET.has(resolved)) {
    return resolved as ListingRouteEntityType
  }
  return 'LISTING'
}

export function detailRoute(entityType: string | null | undefined, id: string): Href {
  const normalized = normalizeListingEntityType(entityType)
  switch (normalized) {
    case 'BUS_LISTING':
      return `/buses/${id}` as Href
    case 'EQUIPMENT_LISTING':
      return `/equipment/${id}` as Href
    case 'OPERATOR_LISTING':
      return `/equipment/operators/${id}` as Href
    case 'SPARE_PART':
      return `/parts/${id}` as Href
    case 'CAR_SERVICE':
      return `/services/${id}` as Href
    case 'LISTING':
    default:
      return `/cars/${id}` as Href
  }
}

export function editRoute(entityType: string | null | undefined, id: string): Href {
  const normalized = normalizeListingEntityType(entityType)
  switch (normalized) {
    case 'LISTING':
      return '/cars/new'
    case 'BUS_LISTING':
      return `/buses/edit/${id}` as Href
    case 'EQUIPMENT_LISTING':
      return `/equipment/edit/${id}` as Href
    case 'OPERATOR_LISTING':
      return `/equipment/operators/edit/${id}` as Href
    case 'SPARE_PART':
      return '/parts/new'
    case 'CAR_SERVICE':
      return '/services/new'
    default:
      return '/cars/new'
  }
}

export function postEntryRoute(): Href {
  return '/(modals)/post-category'
}

export function loginRoute(redirect?: string): Href {
  const trimmed = redirect?.trim()
  if (trimmed && trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return `/(auth)/login?redirect=${encodeURIComponent(trimmed)}` as Href
  }
  return '/(auth)/login'
}

export function buildListingShareUrl(entityType: string | null | undefined, id: string): string {
  const normalized = normalizeListingEntityType(entityType)
  switch (normalized) {
    case 'BUS_LISTING':
      return `https://souqone.app/buses/${id}`
    case 'EQUIPMENT_LISTING':
      return `https://souqone.app/equipment/${id}`
    case 'OPERATOR_LISTING':
      return `https://souqone.app/equipment/operators/${id}`
    case 'SPARE_PART':
      return `https://souqone.app/parts/${id}`
    case 'CAR_SERVICE':
      return `https://souqone.app/services/${id}`
    case 'LISTING':
    default:
      return `https://souqone.app/listings/${id}`
  }
}

export interface EditableListingPayload {
  id: string
  title?: string
  description?: string | null
  listingType?: string | null
  partCategory?: PartCategoryValue | null
  condition?: string | null
  partNumber?: string | null
  compatibleMakes?: string[]
  compatibleModels?: string[]
  yearFrom?: number | null
  yearTo?: number | null
  isOriginal?: boolean
  hasWarranty?: boolean
  warrantyDuration?: WarrantyDurationValue | null
  quantity?: QuantityRangeValue | null
  compatibleVehicleTypes?: CompatibleVehicleType[]
  price?: number | string | null
  currency?: string | null
  isPriceNegotiable?: boolean
  whatsappEnabled?: boolean
  governorateId?: number | string | null
  wilayaId?: number | string | null
  governorateRef?: { nameAr?: string | null } | null
  wilayaRef?: { nameAr?: string | null } | null
  governorate?: string | null
  city?: string | null
  latitude?: number | null
  longitude?: number | null
  images?: Array<string | { id?: string; url?: string; uri?: string }>
  serviceType?: string | null
  providerType?: string | null
  providerName?: string | null
  specializations?: string[]
  isHomeService?: boolean
  workingHoursOpen?: string | null
  workingHoursClose?: string | null
  workingDays?: string[]
  priceFrom?: number | string | null
  priceTo?: number | string | null
  website?: string | null
  address?: string | null
}

function mapPartCondition(condition?: string | null): PartConditionValue | null {
  if (condition === 'LIKE_NEW') return 'NEW'
  if (condition === 'NEW' || condition === 'USED' || condition === 'REFURBISHED') {
    return condition
  }
  return null
}

export function startEdit(
  entityType: string | null | undefined,
  item: EditableListingPayload | CarDetailApiInput
): Href {
  const normalized = normalizeListingEntityType(entityType, item)

  if (normalized === 'LISTING') {
    const carRaw = item as CarDetailApiInput
    const formData = carListingToFormData(carRaw)
    useCarWizardStore.getState().setEditMode(carRaw.id, formData)
    return editRoute('LISTING', carRaw.id)
  }

  const raw = item as EditableListingPayload

  if (normalized === 'SPARE_PART') {
    usePartWizardStore.getState().setEditMode(raw.id, {
      listingType: resolvePartListingType(raw.listingType ?? undefined),
      title: raw.title ?? '',
      description: raw.description ?? '',
      partCategory: raw.partCategory ?? null,
      condition: mapPartCondition(raw.condition),
      partNumber: raw.partNumber ?? '',
      compatibleMakes: raw.compatibleMakes ?? [],
      compatibleModels: raw.compatibleModels ?? [],
      yearFrom: raw.yearFrom ?? null,
      yearTo: raw.yearTo ?? null,
      isOriginal: raw.isOriginal ?? false,
      hasWarranty: raw.hasWarranty ?? false,
      warrantyDuration: raw.warrantyDuration ?? null,
      quantity: raw.quantity ?? null,
      compatibleVehicleTypes: raw.compatibleVehicleTypes ?? [],
      price: raw.price != null ? Number(raw.price) || null : null,
      currency: 'OMR',
      isPriceNegotiable: raw.isPriceNegotiable ?? false,
      whatsappEnabled: Boolean(raw.whatsappEnabled),
      governorateId: raw.governorateId ? Number(raw.governorateId) : null,
      wilayaId: raw.wilayaId ? Number(raw.wilayaId) : null,
      governorateNameAr: raw.governorateRef?.nameAr ?? raw.governorate ?? '',
      wilayaNameAr: raw.wilayaRef?.nameAr ?? raw.city ?? '',
      latitude: raw.latitude ?? null,
      longitude: raw.longitude ?? null,
      existingImages: (raw.images ?? []).map((img) => ({
        id: typeof img === 'string' ? img : img.id ?? '',
        url: typeof img === 'string' ? img : img.url ?? '',
      })),
    })
    return editRoute('SPARE_PART', raw.id)
  }

  if (normalized === 'CAR_SERVICE') {
    useServiceWizardStore.getState().setEditMode(raw.id, {
      title: raw.title ?? '',
      description: raw.description ?? '',
      serviceType: raw.serviceType ?? null,
      providerType: raw.providerType ?? null,
      providerName: raw.providerName ?? '',
      specializations: raw.specializations ?? [],
      isHomeService: Boolean(raw.isHomeService),
      workingHoursOpen: raw.workingHoursOpen ?? null,
      workingHoursClose: raw.workingHoursClose ?? null,
      workingDays: raw.workingDays ?? [],
      priceFrom: raw.priceFrom != null ? Number(raw.priceFrom) : null,
      priceTo: raw.priceTo != null ? Number(raw.priceTo) : null,
      currency: raw.currency ?? 'OMR',
      whatsappEnabled: Boolean(raw.whatsappEnabled),
      website: raw.website ?? '',
      governorateId: raw.governorateId ? Number(raw.governorateId) : null,
      wilayaId: raw.wilayaId ? Number(raw.wilayaId) : null,
      governorateNameAr: raw.governorateRef?.nameAr ?? '',
      wilayaNameAr: raw.wilayaRef?.nameAr ?? '',
      address: raw.address ?? '',
      latitude: raw.latitude ?? null,
      longitude: raw.longitude ?? null,
      existingImages: (raw.images ?? []).map((img) => ({
        id: typeof img === 'string' ? img : img.id || img.url || '',
        url: typeof img === 'string' ? img : img.url || img.uri || '',
      })),
    })
    return editRoute('CAR_SERVICE', raw.id)
  }

  return editRoute(normalized, raw.id)
}
