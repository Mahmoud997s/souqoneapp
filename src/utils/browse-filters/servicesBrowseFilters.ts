import { ServicesQuery } from '../../types/contracts/servicesQuery';
import { ServicesFilterState } from '../../types/filters.types';

export type { ServicesFilterState };

/**
 * Safely extracts a single string from a route parameter that may be string, string[], or undefined.
 * Rule: Returns a trimmed string if a string is provided; if an array is received from Expo Router,
 * takes the first non-empty string element; otherwise returns undefined.
 */
export function toSingleString(val: unknown): string | undefined {
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') {
    const trimmed = val[0].trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

export function parseLocationId(val: unknown): number | undefined {
  const str = toSingleString(val);
  if (!str) return undefined;
  const num = parseInt(str, 10);
  return Number.isInteger(num) && num > 0 ? num : undefined;
}

export interface ServicesRouteParams {
  q?: string | string[];
  serviceType?: string | string[];
  providerType?: string | string[];
  governorate?: string | string[];
  governorateId?: string | string[];
  wilayaId?: string | string[];
  isHomeService?: string | string[];
  [key: string]: unknown;
}

export function parseServicesFiltersFromParams(params: ServicesRouteParams): ServicesFilterState {
  const initial: ServicesFilterState = {};
  
  const serviceType = toSingleString(params.serviceType);
  if (serviceType) initial.serviceType = serviceType;

  const providerType = toSingleString(params.providerType);
  if (providerType) {
    initial.providerType = providerType === 'CENTER' ? 'WORKSHOP' : providerType;
  }

  const governorate = toSingleString(params.governorate);
  if (governorate) initial.governorate = governorate;

  const govId = parseLocationId(params.governorateId);
  if (govId !== undefined) initial.governorateId = govId;

  const wilayaId = parseLocationId(params.wilayaId);
  if (wilayaId !== undefined) initial.wilayaId = wilayaId;

  const isHome = toSingleString(params.isHomeService);
  if (isHome === 'true') initial.isHomeService = true;

  return initial;
}

export function mergeServicesRouteParams(
  currentFilters: ServicesFilterState,
  params: ServicesRouteParams
): ServicesFilterState {
  const parsed = parseServicesFiltersFromParams(params);
  return {
    ...currentFilters,
    ...parsed,
  };
}

/**
 * F-02 Services: sort chip is removed/hidden.
 * No sortBy or sortOrder emitted or managed.
 */
export function clearServicesQuickFilter(
  filters: ServicesFilterState,
  filterId: string
): ServicesFilterState {
  const next = { ...filters };
  if (filterId === 'serviceType') delete next.serviceType;
  if (filterId === 'providerType') delete next.providerType;
  if (filterId === 'specialization' || filterId === 'specializations') delete next.specializations;
  if (filterId === 'isOpenNow') delete next.isOpenNow;
  if (filterId === 'isHomeService') delete next.isHomeService;
  if (filterId === 'city' || filterId === 'gov') {
    delete next.governorateId;
    delete next.wilayaId;
    delete next.governorate;
    delete next.city;
  }
  return next;
}

export function countServicesActiveFilters(filters: ServicesFilterState): number {
  let count = 0;
  Object.entries(filters).forEach(([_, val]) => {
    if (val !== undefined && val !== '' && val !== false) count++;
  });
  return count;
}

export function buildServicesQueryParams(
  filters: ServicesFilterState,
  debouncedSearch = '',
  limit = 30
): ServicesQuery {
  const params: Record<string, unknown> = {
    limit,
  };

  if (debouncedSearch.trim()) {
    params.search = debouncedSearch.trim();
  }

  if (filters.serviceType) params.serviceType = filters.serviceType;
  if (filters.providerType) params.providerType = filters.providerType;
  if (filters.governorateId) params.governorateId = filters.governorateId;
  if (filters.wilayaId) params.wilayaId = filters.wilayaId;
  if (filters.isHomeService) params.isHomeService = true;
  if (filters.isOpenNow) params.isOpenNow = true;
  if (filters.specializations && filters.specializations.length > 0) {
    params.specializations = filters.specializations;
  }
  if (filters.latitude && filters.longitude) {
    params.latitude = filters.latitude;
    params.longitude = filters.longitude;
    if (filters.radiusKm) params.radiusKm = filters.radiusKm;
  }

  return params as ServicesQuery;
}
