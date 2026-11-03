import { EquipmentQueryContract } from '../../types/contracts/equipmentQuery';

export interface EquipmentFilterState {
  equipmentType?: string;
  categoryId?: string;
  listingType?: string;
  governorateId?: number;
  wilayaId?: number;
  governorate?: string;
  city?: string;
  condition?: string;
  conditionId?: string;
  priceMin?: string;
  priceMax?: string;
  priceId?: string;
  yearMin?: string;
  yearMax?: string;
  yearId?: string;
  hoursMin?: string;
  hoursMax?: string;
  hoursId?: string;
  make?: string;
  model?: string;
  sortBy?: string;
}

/**
 * Builds API query parameters strictly conforming to QueryEquipmentListingsDto.
 * Source of truth: apps/api/src/equipment/dto/query-equipment-listings.dto.ts
 * Note: DTO accepts hoursUsedMax; hoursMin is intentionally not sent to server.
 */
export function buildEquipmentQueryParams(
  filters: EquipmentFilterState,
  debouncedSearch?: string
): EquipmentQueryContract {
  const params: EquipmentQueryContract = {
    limit: 30,
  };

  const search = debouncedSearch?.trim();
  if (search) {
    params.search = search;
  }

  if (filters.equipmentType) params.equipmentType = filters.equipmentType;
  if (filters.listingType) params.listingType = filters.listingType;

  if (filters.governorateId !== undefined && filters.governorateId !== null) {
    const govNum = Number(filters.governorateId);
    if (!isNaN(govNum) && govNum > 0) params.governorateId = govNum;
  }

  if (filters.wilayaId !== undefined && filters.wilayaId !== null) {
    const wilNum = Number(filters.wilayaId);
    if (!isNaN(wilNum) && wilNum > 0) params.wilayaId = wilNum;
  }

  if (filters.condition) params.condition = filters.condition;
  if (filters.make) params.make = filters.make;
  if (filters.model) params.model = filters.model;
  if (filters.sortBy) params.sortBy = filters.sortBy;

  if (filters.priceMin) {
    const p = parseFloat(filters.priceMin);
    if (!isNaN(p)) params.minPrice = p;
  }
  if (filters.priceMax) {
    const p = parseFloat(filters.priceMax);
    if (!isNaN(p)) params.maxPrice = p;
  }

  if (filters.yearMin) {
    const y = parseInt(filters.yearMin, 10);
    if (!isNaN(y)) params.yearMin = y;
  }
  if (filters.yearMax) {
    const y = parseInt(filters.yearMax, 10);
    if (!isNaN(y)) params.yearMax = y;
  }

  // Backend QueryEquipmentListingsDto only accepts hoursUsedMax (inclusive max)
  if (filters.hoursMax) {
    const h = parseInt(filters.hoursMax, 10);
    if (!isNaN(h)) params.hoursUsedMax = h;
  }

  return params;
}

/**
 * Clears a specific quick or visual filter and its dependent fields.
 */
export function clearEquipmentFilter(
  filters: EquipmentFilterState,
  id: string
): EquipmentFilterState {
  const next: EquipmentFilterState = { ...filters };

  if (id === 'governorate' || id === 'city') {
    delete next.governorateId;
    delete next.wilayaId;
    delete next.governorate;
    delete next.city;
  } else if (id === 'category') {
    delete next.equipmentType;
    delete next.categoryId;
  } else if (id === 'condition') {
    delete next.condition;
    delete next.conditionId;
  } else if (id === 'price') {
    delete next.priceMin;
    delete next.priceMax;
    delete next.priceId;
  } else if (id === 'year') {
    delete next.yearMin;
    delete next.yearMax;
    delete next.yearId;
  } else if (id === 'hours') {
    delete next.hoursMin;
    delete next.hoursMax;
    delete next.hoursId;
  } else if (id === 'make') {
    delete next.make;
    delete next.model;
  } else if (id === 'sort') {
    delete next.sortBy;
  }

  return next;
}

/**
 * Parses initial filter state from route params.
 */
export function parseEquipmentInitialFilters(
  params: Record<string, string | undefined>
): EquipmentFilterState {
  const initial: EquipmentFilterState = {};
  const t = params.type?.toLowerCase();

  if (t === 'used') {
    initial.condition = 'USED';
    initial.conditionId = 'USED';
    initial.listingType = 'EQUIPMENT_SALE';
  } else if (t === 'new') {
    initial.condition = 'NEW';
    initial.conditionId = 'NEW';
    initial.listingType = 'EQUIPMENT_SALE';
  } else if (t === 'rental' || t === 'rent') {
    initial.listingType = 'EQUIPMENT_RENT';
  } else if (t === 'sale') {
    initial.listingType = 'EQUIPMENT_SALE';
  }

  if (params.equipmentType) {
    initial.equipmentType = params.equipmentType;
    initial.categoryId = params.equipmentType;
  }

  return initial;
}

/**
 * Merges updated route params into existing filter state without wiping active selections (G-07).
 */
export function mergeEquipmentRouteParams(
  prev: EquipmentFilterState,
  params: Record<string, string | undefined>
): EquipmentFilterState {
  const next = { ...prev };
  const t = params.type?.toLowerCase();

  if (t === 'used') {
    next.condition = 'USED';
    next.conditionId = 'USED';
    next.listingType = 'EQUIPMENT_SALE';
  } else if (t === 'new') {
    next.condition = 'NEW';
    next.conditionId = 'NEW';
    next.listingType = 'EQUIPMENT_SALE';
  } else if (t === 'rental' || t === 'rent') {
    next.listingType = 'EQUIPMENT_RENT';
  } else if (t === 'sale') {
    next.listingType = 'EQUIPMENT_SALE';
  }

  if (params.equipmentType !== undefined) {
    next.equipmentType = params.equipmentType || undefined;
    next.categoryId = params.equipmentType || undefined;
  }

  return next;
}
