/**
 * Centralized Route Resolver for Listings and Entities across SouqOne
 */
export function getListingDetailRoute(item: any): string {
  if (!item) return '/(tabs)'
  const id = item.id || item._id

  // Check explicit entityType
  const entityType = String(
    item._entityType ||
    item.entityType ||
    item.type ||
    item.category ||
    item.raw?._entityType ||
    item.raw?.entityType ||
    item.raw?.category ||
    ''
  ).toLowerCase()

  if (entityType === 'cars' || entityType === 'car') {
    return `/cars/${id}`
  }
  if (entityType === 'buses' || entityType === 'bus') {
    return `/buses/${id}`
  }
  if (entityType === 'operators' || entityType === 'operator') {
    return `/equipment/operators/${id}`
  }
  if (entityType === 'equipment') {
    return `/equipment/${id}`
  }
  if (entityType === 'parts' || entityType === 'part') {
    return `/parts/${id}`
  }
  if (entityType === 'services' || entityType === 'service') {
    return `/services/${id}`
  }
  if (entityType === 'jobs' || entityType === 'job') {
    return `/jobs/${id}`
  }

  // Fallback to listings
  return `/listings/${id}`
}
