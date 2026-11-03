import { ServicesQuery } from '../../types/contracts/servicesQuery';

export interface ServicesFilterState {
  serviceType?: string;
  providerType?: string;
  governorate?: string;
  governorateId?: number | string;
  wilayaId?: number | string;
  isHomeService?: boolean;
  isOpenNow?: boolean;
  specializations?: string[];
  city?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  [key: string]: unknown;
}

export interface ServicesRouteParams {
  q?: string;
  serviceType?: string;
  providerType?: string;
  governorate?: string;
  governorateId?: string;
  wilayaId?: string;
  isHomeService?: string;
}

export function parseServicesFiltersFromParams(params: ServicesRouteParams): ServicesFilterState {
  const initial: ServicesFilterState = {};
  if (params.serviceType) initial.serviceType = params.serviceType;
  if (params.providerType) {
    initial.providerType = params.providerType === 'CENTER' ? 'WORKSHOP' : params.providerType;
  }
  if (params.governorate) initial.governorate = params.governorate;
  if (params.governorateId) {
    const parsed = parseInt(String(params.governorateId), 10);
    if (!isNaN(parsed) && parsed > 0) initial.governorateId = parsed;
  }
  if (params.wilayaId) {
    const parsed = parseInt(String(params.wilayaId), 10);
    if (!isNaN(parsed) && parsed > 0) initial.wilayaId = parsed;
  }
  if (params.isHomeService === 'true') initial.isHomeService = true;
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
