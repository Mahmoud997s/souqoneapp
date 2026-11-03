/**
 * Contract allow-list for Services Browse Query Parameters.
 * Corresponds to QueryServicesDto in backend API (apps/api/src/services/dto/query-services.dto.ts).
 * Note: sortBy and sortOrder do NOT exist on the backend DTO.
 */
export interface ServicesQuery {
  limit?: number | string;
  page?: number | string;
  search?: string;
  serviceType?: string;
  providerType?: string;
  governorateId?: number | string;
  wilayaId?: number | string;
  isHomeService?: boolean;
  specializations?: string[];
  isOpenNow?: boolean;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  userId?: string;
}

export const SERVICES_QUERY_ALLOWED_KEYS: readonly (keyof ServicesQuery)[] = [
  'limit',
  'page',
  'search',
  'serviceType',
  'providerType',
  'governorateId',
  'wilayaId',
  'isHomeService',
  'specializations',
  'isOpenNow',
  'latitude',
  'longitude',
  'radiusKm',
  'userId',
] as const;
