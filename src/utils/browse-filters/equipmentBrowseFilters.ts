import { EquipmentQueryContract } from '../../types/contracts/equipmentQuery';
import { toSingleString } from './routeParams';

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
export function parseEquipmentInitialFilters(
  params: Record<string, unknown>
): EquipmentFilterState {
  const initial: EquipmentFilterState = {};
  const rawType = toSingleString(params.type);
  const t = rawType?.toLowerCase();

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

  const eqType = toSingleString(params.equipmentType);
  if (eqType) {
    initial.equipmentType = eqType;
    initial.categoryId = eqType;
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
export function mergeEquipmentRouteParams(
  prev: EquipmentFilterState,
  params: Record<string, unknown>
): EquipmentFilterState {
  const next = { ...prev };
  const rawType = toSingleString(params.type);
  const t = rawType?.toLowerCase();

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
    const eqType = toSingleString(params.equipmentType);
    next.equipmentType = eqType;
    next.categoryId = eqType;
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

export type EquipmentDropdownKind =
  | 'category'
  | 'condition'
  | 'price'
  | 'year'
  | 'hours'
  | 'governorate';

export const EQUIPMENT_PRICE_RANGES = [
  { id: 'all', label: 'الكل', min: '', max: '' },
  { id: 'p1', label: 'أقل من 50 ر.ع', min: '0', max: '50' },
  { id: 'p2', label: '50 - 100 ر.ع', min: '50', max: '100' },
  { id: 'p3', label: '100 - 500 ر.ع', min: '100', max: '500' },
  { id: 'p4', label: '500 - 1,000 ر.ع', min: '500', max: '1000' },
  { id: 'p5', label: '1,000 - 5,000 ر.ع', min: '1000', max: '5000' },
  { id: 'p6', label: '5,000 - 10,000 ر.ع', min: '5000', max: '10000' },
  { id: 'p7', label: 'أكثر من 10,000 ر.ع', min: '10000', max: '9999999' },
];

export const EQUIPMENT_YEAR_RANGES = [
  { id: 'all', label: 'الكل', min: '', max: '' },
  { id: 'y1', label: '2022 - 2024', min: '2022', max: '2024' },
  { id: 'y2', label: '2019 - 2021', min: '2019', max: '2021' },
  { id: 'y3', label: '2015 - 2018', min: '2015', max: '2018' },
  { id: 'y4', label: 'أقدم من 2015', min: '1900', max: '2014' },
];

export const EQUIPMENT_HOURS_RANGES = [
  { id: 'all', label: 'الكل', min: '', max: '' },
  { id: 'h1', label: 'أقل من 1,000 ساعة', min: '0', max: '1000' },
  { id: 'h2', label: '1,000 - 3,000 ساعة', min: '1000', max: '3000' },
  { id: 'h3', label: '3,000 - 5,000 ساعة', min: '3000', max: '5000' },
  { id: 'h4', label: 'أكثر من 5,000 ساعة', min: '5000', max: '999999' },
];

/**
 * Pure state reducer applying an equipment quick filter selection.
 */
export function applyEquipmentFilter(
  filters: EquipmentFilterState,
  dropdown: EquipmentDropdownKind,
  optionId: string
): EquipmentFilterState {
  const next: EquipmentFilterState = { ...filters };

  if (dropdown === 'category') {
    next.equipmentType = optionId;
    next.categoryId = optionId;
  } else if (dropdown === 'condition') {
    next.condition = optionId;
    next.conditionId = optionId;
  } else if (dropdown === 'price') {
    if (optionId === 'all') {
      delete next.priceMin;
      delete next.priceMax;
      delete next.priceId;
    } else {
      const range = EQUIPMENT_PRICE_RANGES.find((r) => r.id === optionId);
      if (range) {
        next.priceId = optionId;
        next.priceMin = range.min;
        next.priceMax = range.max;
      }
    }
  } else if (dropdown === 'year') {
    if (optionId === 'all') {
      delete next.yearMin;
      delete next.yearMax;
      delete next.yearId;
    } else {
      const range = EQUIPMENT_YEAR_RANGES.find((r) => r.id === optionId);
      if (range) {
        next.yearId = optionId;
        next.yearMin = range.min;
        next.yearMax = range.max;
      }
    }
  } else if (dropdown === 'hours') {
    if (optionId === 'all') {
      delete next.hoursMin;
      delete next.hoursMax;
      delete next.hoursId;
    } else {
      const range = EQUIPMENT_HOURS_RANGES.find((r) => r.id === optionId);
      if (range) {
        next.hoursId = optionId;
        next.hoursMin = range.min;
        next.hoursMax = range.max;
      }
    }
  } else if (dropdown === 'governorate') {
    const govId = Number(optionId);
    if (!isNaN(govId) && govId > 0) {
      next.governorateId = govId;
      delete next.wilayaId;
      delete next.city;
      delete next.governorate;
    }
  }

  return next;
}

