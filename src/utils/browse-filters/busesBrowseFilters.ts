import { BusesQueryContract } from '../../types/contracts/busesQuery';
import { BusFilters } from '../../components/filters/BusFilterBottomSheet';

export type BusBrowseFilters = BusFilters & {
  governorateId?: number | string;
  wilayaId?: number | string;
  city?: string;
  isPremium?: boolean | string;
};

/**
 * Builds API query parameters strictly conforming to QueryBusListingsDto.
 * Source of truth: apps/api/src/buses/dto/query-bus-listings.dto.ts
 */
export function buildBusesQueryParams(
  filters: BusBrowseFilters,
  debouncedSearch?: string
): BusesQueryContract {
  const params: BusesQueryContract = {};

  const search = debouncedSearch?.trim();
  if (search) {
    params.search = search;
  }

  if (filters.busListingType) params.busListingType = filters.busListingType;
  if (filters.busType) params.busType = filters.busType;
  if (filters.make) params.make = filters.make;

  if (filters.governorateId !== undefined && filters.governorateId !== null && String(filters.governorateId) !== '') {
    params.governorateId = String(filters.governorateId);
  }
  if (filters.wilayaId !== undefined && filters.wilayaId !== null && String(filters.wilayaId) !== '') {
    params.wilayaId = String(filters.wilayaId);
  }

  const minPrice = filters.minPrice || filters.priceMin;
  if (minPrice !== undefined && minPrice !== null && String(minPrice) !== '') {
    params.minPrice = String(minPrice);
  }
  const maxPrice = filters.maxPrice || filters.priceMax;
  if (maxPrice !== undefined && maxPrice !== null && String(maxPrice) !== '') {
    params.maxPrice = String(maxPrice);
  }

  const minCap = filters.minCapacity !== undefined ? filters.minCapacity : filters.capacityMin;
  if (minCap !== undefined && minCap !== null && String(minCap) !== '') {
    params.minCapacity = String(minCap);
  }
  const maxCap = filters.maxCapacity !== undefined ? filters.maxCapacity : filters.capacityMax;
  if (maxCap !== undefined && maxCap !== null && String(maxCap) !== '') {
    params.maxCapacity = String(maxCap);
  }

  if (filters.condition) params.condition = filters.condition;
  if (filters.transmission) params.transmission = filters.transmission;
  if (filters.fuelType) params.fuelType = filters.fuelType;
  if (filters.yearMin !== undefined && filters.yearMin !== null && String(filters.yearMin) !== '') {
    params.yearMin = String(filters.yearMin);
  }
  if (filters.yearMax !== undefined && filters.yearMax !== null && String(filters.yearMax) !== '') {
    params.yearMax = String(filters.yearMax);
  }

  if (filters.sort && filters.sort !== 'newest') {
    params.sort = filters.sort;
  }

  if (filters.isPremium) {
    params.isPremium = 'true';
  }

  return params;
}

/**
 * Clears a specific quick or visual filter and its dependent fields.
 */
export function clearBusesFilter(filters: BusBrowseFilters, id: string): BusBrowseFilters {
  const next: BusBrowseFilters = { ...filters };

  if (id === 'governorate' || id === 'city') {
    delete next.governorateId;
    delete next.wilayaId;
    delete next.city;
  } else if (id === 'make') {
    delete next.make;
  } else if (id === 'capacity') {
    delete next.capacityMin;
    delete next.minCapacity;
    delete next.capacityMax;
    delete next.maxCapacity;
    delete next.capacityId;
  } else if (id === 'busType') {
    delete next.busType;
  } else if (id === 'price') {
    delete next.minPrice;
    delete next.priceMin;
    delete next.maxPrice;
    delete next.priceMax;
    delete next.priceId;
  } else if (id === 'sort') {
    next.sort = 'newest';
  }

  return next;
}

/**
 * Safely extracts a single string from a route parameter that may be string, string[], or undefined.
 * Rule: Returns a trimmed string if a string is provided; if an array is received from Expo Router,
 * takes the first non-empty string element; otherwise returns undefined.
 */
function toSingleString(val: unknown): string | undefined {
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (Array.isArray(val)) {
    for (const item of val) {
      if (typeof item !== 'string') continue;
      const trimmed = item.trim();
      if (trimmed.length > 0) return trimmed;
    }
  }
  return undefined;
}

/**
 * Safely parses a positive integer ID from a route parameter.
 * Rule: Accepts single positive whole numbers; for repeated parameters (arrays),
 * evaluates the first element; invalid formats return undefined.
 */
function toPositiveInteger(val: unknown): number | undefined {
  const first = Array.isArray(val) ? val[0] : val;
  const str = toSingleString(first);
  if (!str || !/^\d+$/.test(str)) return undefined;
  const num = Number(str);
  return num > 0 ? num : undefined;
}

/**
 * Parses initial filter state from route params.
 */
export function parseBusesInitialFilters(
  params: Record<string, unknown>
): BusBrowseFilters {
  const initial: BusBrowseFilters = {};

  const busListingType = toSingleString(params.busListingType);
  const type = toSingleString(params.type);
  if (busListingType) {
    initial.busListingType = busListingType;
  } else if (type) {
    const t = type.toUpperCase();
    if (t === 'RENT' || t === 'RENTAL') initial.busListingType = 'BUS_RENT';
    else if (t === 'SALE') initial.busListingType = 'BUS_SALE';
    else if (t === 'CONTRACT') initial.busListingType = 'BUS_SALE_WITH_CONTRACT';
    else initial.busListingType = t;
  }

  const condition = toSingleString(params.condition);
  if (condition) {
    initial.condition = condition;
  }

  const featured = toSingleString(params.featured);
  const isPremium = toSingleString(params.isPremium);
  if (featured === 'true' || isPremium === 'true') {
    initial.isPremium = true;
  }

  const govId = toPositiveInteger(params.governorateId);
  if (govId !== undefined) initial.governorateId = govId;

  const wilId = toPositiveInteger(params.wilayaId);
  if (wilId !== undefined) initial.wilayaId = wilId;

  return initial;
}

/**
 * Merges updated route params into existing filter state without wiping active selections (G-07).
 */
export function mergeBusesRouteParams(
  prev: BusBrowseFilters,
  params: Record<string, unknown>
): BusBrowseFilters {
  const next = { ...prev };

  const busListingType = toSingleString(params.busListingType);
  const type = toSingleString(params.type);
  if (busListingType) {
    next.busListingType = busListingType;
  } else if (type) {
    const t = type.toUpperCase();
    if (t === 'RENT' || t === 'RENTAL') next.busListingType = 'BUS_RENT';
    else if (t === 'SALE') next.busListingType = 'BUS_SALE';
    else if (t === 'CONTRACT') next.busListingType = 'BUS_SALE_WITH_CONTRACT';
  }

  if (params.condition !== undefined) {
    next.condition = toSingleString(params.condition);
  }
  if (params.featured !== undefined || params.isPremium !== undefined) {
    const featured = toSingleString(params.featured);
    const isPremium = toSingleString(params.isPremium);
    next.isPremium = featured === 'true' || isPremium === 'true';
  }
  if (params.governorateId !== undefined) {
    const governorateId = toPositiveInteger(params.governorateId);
    if (
      governorateId !== undefined &&
      governorateId !== prev.governorateId &&
      params.wilayaId === undefined
    ) {
      next.wilayaId = undefined;
    }
    next.governorateId = governorateId;
  }
  if (params.wilayaId !== undefined) {
    next.wilayaId = toPositiveInteger(params.wilayaId);
  }

  return next;
}
