/**
 * Request keys used by public-profile listing hooks. Keep these aligned with the backend DTOs:
 * apps/api/src/listings/dto/query-listings.dto.ts, buses/dto/query-bus-listings.dto.ts,
 * apps/api/src/equipment/dto/query-equipment-listings.dto.ts, apps/api/src/parts/dto/query-parts.dto.ts,
 * and apps/api/src/services/dto/query-services.dto.ts.
 */
export const PUBLIC_PROFILE_QUERY_ALLOWED_PARAMS = {
  car: ['sellerId', 'status', 'page', 'limit', 'sortBy', 'sortOrder'],
  bus: ['userId', 'page', 'limit', 'sort'],
  equipment: ['userId', 'page', 'limit', 'sortBy'],
  part: ['sellerId', 'page', 'limit', 'sortBy', 'sortOrder'],
  service: ['userId', 'page', 'limit'],
} as const

export type PublicProfileQueryVertical = keyof typeof PUBLIC_PROFILE_QUERY_ALLOWED_PARAMS