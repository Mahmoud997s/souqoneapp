import { PartsQueryContract } from '../../types/contracts/partsQuery';
import { PartsFilterState } from '../../types/filters.types';
import { toSingleString } from './routeParams';

export { PartsFilterState };

/**
 * Builds API query parameters strictly conforming to QueryPartsDto.
 * Source of truth: apps/api/src/parts/dto/query-parts.dto.ts
 */
export function buildPartsQueryParams(
  filters: PartsFilterState,
  debouncedSearch?: string
): PartsQueryContract {
  const params: PartsQueryContract = {
    limit: 30,
  };

  const search = debouncedSearch?.trim();
  if (search) {
    params.search = search;
  }

  if (filters.category) {
    params.partCategory = filters.category;
  }

  if (filters.make) {
    params.make = filters.make;
  }

  if (filters.condition) {
    params.condition = filters.condition;
  }

  if (filters.isOriginal !== undefined) {
    params.isOriginal = filters.isOriginal;
  }

  if (filters.isScrap) {
    params.isScrap = true;
  }

  // F-01: governorateId and wilayaId must be numeric strings (e.g. "1", "102").
  // Legacy string codes like 'OM_MUS' are rejected by @IsNumberString().
  if (filters.governorateId !== undefined && filters.governorateId !== null && String(filters.governorateId) !== '') {
    const govStr = String(filters.governorateId);
    if (/^\d+$/.test(govStr)) {
      params.governorateId = govStr;
    }
  }

  if (filters.wilayaId !== undefined && filters.wilayaId !== null && String(filters.wilayaId) !== '') {
    const wilStr = String(filters.wilayaId);
    if (/^\d+$/.test(wilStr)) {
      params.wilayaId = wilStr;
    }
  }

  if (filters.hasWarranty !== undefined) {
    params.hasWarranty = filters.hasWarranty;
  }

  if (filters.compatibleVehicleType) {
    params.compatibleVehicleType = filters.compatibleVehicleType;
  }

  if (filters.partNumber) {
    params.partNumber = filters.partNumber;
  }

  if (filters.priceMin) {
    const pMin = parseFloat(filters.priceMin);
    if (!isNaN(pMin)) params.minPrice = String(pMin);
  }

  if (filters.priceMax) {
    const pMax = parseFloat(filters.priceMax);
    if (!isNaN(pMax)) params.maxPrice = String(pMax);
  }

  if (filters.sortBy) {
    params.sortBy = filters.sortBy;
    params.sortOrder = filters.sortOrder || 'DESC';
  }

  return params;
}

/**
 * Clears a specific quick or visual filter and its dependent fields.
 */
export function clearPartsFilter(filters: PartsFilterState, id: string): PartsFilterState {
  const next: PartsFilterState = { ...filters };

  if (id === 'category') {
    delete next.category;
  } else if (id === 'make') {
    delete next.make;
    delete next.makeId;
  } else if (id === 'condition') {
    delete next.condition;
  } else if (id === 'price') {
    delete next.priceMin;
    delete next.priceMax;
    delete next.priceId;
  } else if (id === 'city' || id === 'governorate') {
    // F-01: Clears all location keys simultaneously
    delete next.city;
    delete next.governorate;
    delete next.governorateId;
    delete next.wilayaId;
  } else if (id === 'sort') {
    delete next.sortBy;
    delete next.sortOrder;
  }

  return next;
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
export function parsePartsInitialFilters(
  params: Record<string, unknown>
): PartsFilterState {
  const initial: PartsFilterState = {};

  const category = toSingleString(params.category);
  if (category) initial.category = category;

  const condition = toSingleString(params.condition);
  if (condition) initial.condition = condition;

  const isOrig = toSingleString(params.isOriginal);
  if (isOrig === 'false') initial.isOriginal = false;
  else if (isOrig === 'true') initial.isOriginal = true;

  const isScrap = toSingleString(params.isScrap);
  if (isScrap === 'true') initial.isScrap = true;

  const make = toSingleString(params.make);
  if (make) initial.make = make;

  const city = toSingleString(params.city);
  if (city) initial.city = city;

  const g = toPositiveInteger(params.governorateId);
  if (g !== undefined) initial.governorateId = g;

  const w = toPositiveInteger(params.wilayaId);
  if (w !== undefined) initial.wilayaId = w;

  const pMin = toSingleString(params.priceMin);
  if (pMin) initial.priceMin = pMin;

  const pMax = toSingleString(params.priceMax);
  if (pMax) initial.priceMax = pMax;

  const pNum = toSingleString(params.partNumber);
  if (pNum) initial.partNumber = pNum;

  return initial;
}

/**
 * Merges updated route params into existing filter state without wiping other active selections (G-07).
 */
export function mergePartsRouteParams(
  prev: PartsFilterState,
  params: Record<string, unknown>
): PartsFilterState {
  const next = { ...prev };

  if (params.category !== undefined) {
    next.category = toSingleString(params.category);
  }
  if (params.condition !== undefined) {
    next.condition = toSingleString(params.condition);
  }
  if (params.make !== undefined) {
    next.make = toSingleString(params.make);
  }
  if (params.city !== undefined) {
    next.city = toSingleString(params.city);
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
  if (params.priceMin !== undefined) {
    next.priceMin = toSingleString(params.priceMin);
  }
  if (params.priceMax !== undefined) {
    next.priceMax = toSingleString(params.priceMax);
  }
  if (params.partNumber !== undefined) {
    next.partNumber = toSingleString(params.partNumber);
  }
  if (params.isOriginal !== undefined) {
    const isOrig = toSingleString(params.isOriginal);
    next.isOriginal = isOrig === 'true' ? true : isOrig === 'false' ? false : undefined;
  }
  if (params.isScrap !== undefined) {
    next.isScrap = toSingleString(params.isScrap) === 'true';
  }
  return next;
}
