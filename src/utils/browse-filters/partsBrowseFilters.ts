import { PartsQueryContract } from '../../types/contracts/partsQuery';
import { PartsFilterState } from '../../types/filters.types';

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

function parseLocationId(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return undefined;
  const n = Number(trimmed);
  return n > 0 ? n : undefined;
}

/**
 * Parses initial filter state from route params.
 */
export function parsePartsInitialFilters(
  params: Record<string, string | undefined>
): PartsFilterState {
  const initial: PartsFilterState = {};

  if (params.category) initial.category = params.category;
  if (params.condition) initial.condition = params.condition;
  if (params.isOriginal === 'false') initial.isOriginal = false;
  else if (params.isOriginal === 'true') initial.isOriginal = true;
  if (params.isScrap === 'true') initial.isScrap = true;
  if (params.make) initial.make = params.make;
  if (params.city) initial.city = params.city;
  const g = parseLocationId(params.governorateId);
  if (g !== undefined) initial.governorateId = g;
  const w = parseLocationId(params.wilayaId);
  if (w !== undefined) initial.wilayaId = w;
  if (params.priceMin) initial.priceMin = params.priceMin;
  if (params.priceMax) initial.priceMax = params.priceMax;
  if (params.partNumber) initial.partNumber = params.partNumber;

  return initial;
}

/**
 * Merges updated route params into existing filter state without wiping other active selections (G-07).
 */
export function mergePartsRouteParams(
  prev: PartsFilterState,
  params: Record<string, string | undefined>
): PartsFilterState {
  const next = { ...prev };
  if (params.category !== undefined) next.category = params.category || undefined;
  if (params.condition !== undefined) next.condition = params.condition || undefined;
  if (params.make !== undefined) next.make = params.make || undefined;
  if (params.city !== undefined) next.city = params.city || undefined;
  if (params.governorateId !== undefined) {
    next.governorateId = parseLocationId(params.governorateId);
  }
  if (params.wilayaId !== undefined) {
    next.wilayaId = parseLocationId(params.wilayaId);
  }
  if (params.isOriginal !== undefined) {
    next.isOriginal = params.isOriginal === 'true' ? true : params.isOriginal === 'false' ? false : undefined;
  }
  if (params.isScrap !== undefined) {
    next.isScrap = params.isScrap === 'true';
  }
  return next;
}
