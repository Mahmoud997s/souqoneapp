import { ContactEntityType } from '../hooks/listing-detail/useListingContact'
import { UnifiedCardItem } from '../types/unified-card.types'

const VALID_EXACT_ENTITY_TYPES: Set<string> = new Set([
  'LISTING',
  'BUS_LISTING',
  'EQUIPMENT_LISTING',
  'OPERATOR_LISTING',
  'SPARE_PART',
  'CAR_SERVICE',
  'DRIVER_JOB',
  'JOB',
  'DRIVER_PROFILE',
  'EMPLOYER_PROFILE',
  'CARRIER_PROFILE',
  'TRANSPORT_REQUEST',
])

/**
 * Resolves the accurate backend ContactEntityType from a category string and item shape.
 *
 * Valid backend entityTypes:
 * - LISTING (cars)
 * - BUS_LISTING (buses)
 * - EQUIPMENT_LISTING (equipment)
 * - OPERATOR_LISTING (operators)
 * - SPARE_PART (spare parts)
 * - CAR_SERVICE (services)
 * - DRIVER_JOB / JOB (job postings)
 * - DRIVER_PROFILE (driver profiles)
 * - EMPLOYER_PROFILE (employer profiles)
 * - CARRIER_PROFILE (carrier profiles)
 * - TRANSPORT_REQUEST (transport requests)
 */
export function resolveContactEntityType(
  category?: string,
  item?: Partial<UnifiedCardItem> | any
): ContactEntityType {
  const rawCat = (category || item?.category || '').trim().toLowerCase()
  const rawListingType = (item?.listingType || item?.type || item?.raw?.listingType || '').trim().toUpperCase()

  // 1. Specific shape checks based on fields / categories
  // Operators
  if (rawCat === 'operators' || rawCat === 'operator' || rawListingType === 'OPERATOR' || rawListingType === 'OPERATOR_LISTING') {
    return 'OPERATOR_LISTING'
  }

  // Drivers
  if (
    rawCat === 'drivers' ||
    rawCat === 'driver' ||
    rawListingType === 'DRIVER_PROFILE' ||
    rawListingType === 'DRIVER' ||
    Boolean(item?.licenseTypes || item?.raw?.licenseTypes)
  ) {
    return 'DRIVER_PROFILE'
  }

  // Employers
  if (
    rawCat === 'employers' ||
    rawCat === 'employer' ||
    rawListingType === 'EMPLOYER_PROFILE' ||
    rawListingType === 'EMPLOYER'
  ) {
    return 'EMPLOYER_PROFILE'
  }

  // Jobs
  if (rawCat === 'jobs' || rawCat === 'job' || rawListingType === 'JOB' || rawListingType === 'DRIVER_JOB') {
    return 'DRIVER_JOB'
  }

  // Transport
  if (rawCat === 'transport' || rawCat === 'carriers' || rawCat === 'carrier') {
    if (
      rawCat === 'carriers' ||
      rawCat === 'carrier' ||
      rawListingType === 'CARRIER_PROFILE' ||
      rawListingType === 'CARRIER' ||
      Boolean(item?.companyName || item?.raw?.companyName || item?.vehicleTypes || item?.raw?.vehicleTypes)
    ) {
      return 'CARRIER_PROFILE'
    }
    return 'TRANSPORT_REQUEST'
  }

  // Cars / Listings
  if (rawCat === 'cars' || rawCat === 'car' || rawCat === 'listing' || rawCat === 'listings') {
    return 'LISTING'
  }

  // Buses
  if (rawCat === 'buses' || rawCat === 'bus') {
    return 'BUS_LISTING'
  }

  // Equipment
  if (rawCat === 'equipment') {
    return 'EQUIPMENT_LISTING'
  }

  // Spare Parts
  if (
    rawCat === 'parts' ||
    rawCat === 'part' ||
    rawCat === 'spare_parts' ||
    rawCat === 'spare-parts' ||
    rawCat === 'spareparts'
  ) {
    return 'SPARE_PART'
  }

  // Services
  if (
    rawCat === 'services' ||
    rawCat === 'service' ||
    rawCat === 'car_services' ||
    rawCat === 'car-services' ||
    rawCat === 'car_service'
  ) {
    return 'CAR_SERVICE'
  }

  // 2. Direct exact match if already a valid uppercase entityType
  const upperCat = (category || '').trim().toUpperCase()
  if (VALID_EXACT_ENTITY_TYPES.has(upperCat)) {
    return upperCat as ContactEntityType
  }
  if (VALID_EXACT_ENTITY_TYPES.has(rawListingType)) {
    return rawListingType as ContactEntityType
  }

  // Fallback to LISTING
  return 'LISTING'
}
