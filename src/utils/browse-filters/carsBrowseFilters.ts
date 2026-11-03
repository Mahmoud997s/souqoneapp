import { CarsQuery } from '../../types/contracts/carsQuery';

export interface CarsFilterState {
  make?: string;
  makeId?: string;
  model?: string;
  modelId?: string;
  trim?: string;
  condition?: string;
  listingType?: string;
  isPremium?: boolean;
  yearMin?: number | string;
  yearMax?: number | string;
  priceMin?: number | string;
  priceMax?: number | string;
  priceId?: string;
  bodyType?: string;
  governorateId?: number | string;
  wilayaId?: number | string;
  governorate?: string;
  city?: string;
  sortBy?: string;
  sortOrder?: string;
  [key: string]: unknown;
}

export interface CarsRouteParams {
  type?: string;
  condition?: string;
  featured?: string;
  isPremium?: string;
  make?: string;
  brandId?: string;
  search?: string;
}

export function decodeSearchParam(search?: string): string {
  if (!search) return '';
  try {
    return decodeURIComponent(search).trim();
  } catch {
    return search.trim();
  }
}

export function parseCarsFiltersFromParams(params: CarsRouteParams): CarsFilterState {
  const initialFilters: CarsFilterState = {};
  const t = params.type?.toLowerCase();

  if (t === 'used') {
    initialFilters.condition = 'USED';
  } else if (t === 'new') {
    initialFilters.condition = 'NEW';
  } else if (t === 'wanted') {
    initialFilters.listingType = 'WANTED';
  } else if (t === 'rental' || t === 'rent') {
    initialFilters.listingType = 'RENTAL';
  } else if (t === 'sale') {
    initialFilters.listingType = 'SALE';
  }

  if (params.condition) {
    initialFilters.condition = params.condition.toUpperCase();
  }

  if (params.featured === 'true' || params.isPremium === 'true') {
    initialFilters.isPremium = true;
  }

  if (params.make) {
    initialFilters.make = params.make;
  }

  if (params.brandId) {
    initialFilters.makeId = params.brandId;
  }

  return initialFilters;
}

export function mergeCarsRouteParams(
  currentFilters: CarsFilterState,
  params: CarsRouteParams
): CarsFilterState {
  const parsed = parseCarsFiltersFromParams(params);
  return {
    ...currentFilters,
    ...parsed,
  };
}

/**
 * F-03 Cars: ONE clearMake removes make, makeId, model, modelId, trim.
 * Used by BOTH the quick chip clear and the visual make clear.
 */
export function clearCarsMake(filters: CarsFilterState): CarsFilterState {
  const next = { ...filters };
  delete next.make;
  delete next.makeId;
  delete next.model;
  delete next.modelId;
  delete next.trim;
  return next;
}

export function clearCarsQuickFilter(filters: CarsFilterState, id: string): CarsFilterState {
  if (id === 'make') {
    return clearCarsMake(filters);
  }

  const next = { ...filters };
  if (id === 'city') {
    delete next.city;
    delete next.wilayaId;
    delete next.governorateId;
    delete next.governorate;
  } else if (id === 'year') {
    delete next.yearMin;
    delete next.yearMax;
  } else if (id === 'price') {
    delete next.priceMin;
    delete next.priceMax;
    delete next.priceId;
  } else if (id === 'type') {
    delete next.bodyType;
  } else if (id === 'sort') {
    delete next.sortBy;
    delete next.sortOrder;
  }
  return next;
}

export function applyCarsQuickFilter(
  currentFilters: CarsFilterState,
  type: 'make' | 'model' | 'city' | 'price' | 'type',
  valueId: string,
  valueName?: string,
  min?: number,
  max?: number,
  extraId?: number
): CarsFilterState {
  if (type === 'make') {
    if (!valueId || valueId === currentFilters.makeId) {
      return clearCarsMake(currentFilters);
    }
    const next = { ...currentFilters };
    next.makeId = valueId;
    next.make = valueName;
    if (valueId !== currentFilters.makeId) {
      delete next.modelId;
      delete next.model;
      delete next.trim;
    }
    return next;
  }

  if (type === 'model') {
    if (!valueId || valueId === currentFilters.modelId) {
      const next = { ...currentFilters };
      delete next.modelId;
      delete next.model;
      return next;
    }
    return { ...currentFilters, modelId: valueId, model: valueName };
  }

  if (type === 'city') {
    if (!valueId || valueId === String(currentFilters.wilayaId)) {
      const next = { ...currentFilters };
      delete next.wilayaId;
      delete next.governorateId;
      delete next.city;
      delete next.governorate;
      return next;
    }
    return {
      ...currentFilters,
      wilayaId: Number(valueId),
      governorateId: extraId,
      city: valueName,
    };
  }

  if (type === 'price') {
    if (!valueId || valueId === currentFilters.priceId) {
      const next = { ...currentFilters };
      delete next.priceMin;
      delete next.priceMax;
      delete next.priceId;
      return next;
    }
    return {
      ...currentFilters,
      priceMin: min !== undefined ? min.toString() : undefined,
      priceMax: max !== undefined ? max.toString() : undefined,
      priceId: valueId,
    };
  }

  if (type === 'type') {
    const upper = valueId.toUpperCase();
    if (!valueId || upper === currentFilters.bodyType) {
      const next = { ...currentFilters };
      delete next.bodyType;
      return next;
    }
    return { ...currentFilters, bodyType: upper };
  }

  return currentFilters;
}

export function buildCarsQueryParams(
  filters: CarsFilterState,
  debouncedSearchQuery = '',
  selectedBrandName?: string,
  limit = 30
): CarsQuery {
  const params: Record<string, unknown> = {
    limit,
  };

  if (debouncedSearchQuery.trim()) {
    params.search = debouncedSearchQuery.trim();
  }

  // Selected brand name / carousel takes priority
  const effectiveMake = selectedBrandName || (typeof filters.make === 'string' ? filters.make : undefined);
  if (effectiveMake) {
    params.make = effectiveMake;
  }

  // Internal/UI-only keys not sent to API
  const skipKeys = new Set(['makeId', 'modelId', 'priceId', 'governorate', 'city', 'make']);

  Object.entries(filters).forEach(([key, val]) => {
    if (skipKeys.has(key)) return;
    if (val !== undefined && val !== '') {
      if (key === 'priceMin' || key === 'priceMax' || key === 'yearMin' || key === 'yearMax') {
        const parsed = parseFloat(String(val));
        if (!isNaN(parsed)) {
          params[key] = parsed;
        }
      } else if (key === 'governorateId' || key === 'wilayaId') {
        const parsed = parseInt(String(val), 10);
        if (!isNaN(parsed) && parsed > 0) {
          params[key] = parsed;
        }
      } else {
        params[key] = val;
      }
    }
  });

  return params as CarsQuery;
}

export function countCarsActiveFilters(
  filters: CarsFilterState,
  selectedBrandId?: string
): number {
  let count = 0;
  if (selectedBrandId || filters.makeId || filters.make) count++;
  const skipKeys = new Set(['makeId', 'make', 'modelId', 'priceId']);
  Object.entries(filters).forEach(([key, val]) => {
    if (skipKeys.has(key)) return;
    if (val !== undefined && val !== '') count++;
  });
  return count;
}
