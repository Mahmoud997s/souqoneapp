import { OperatorsQueryContract } from '../../types/contracts/operatorsQuery';
import { OperatorFilterState } from '../../types/filters.types';

/**
 * Builds API query parameters strictly conforming to QueryOperatorListingsDto.
 * Source of truth: apps/api/src/equipment/dto/query-operator-listings.dto.ts
 *
 * NOTE on Client-Side Refinements:
 * The backend QueryOperatorListingsDto currently supports:
 * - operatorType, governorateId, wilayaId, search, sortBy, sortOrder
 * - minDailyRate, maxDailyRate, minHourlyRate, maxHourlyRate
 * - minExperienceYears, maxExperienceYears
 *
 * It does NOT have server-side parameters for:
 * - equipmentType (specialized machinery operated)
 * - certification (operator licenses/certificates)
 * - isPriceNegotiable
 *
 * Therefore, these three attributes are intentionally omitted from API query parameters
 * and filtered client-side via refineOperatorsClientSide() on the returned dataset.
 */
export function buildOperatorQueryParams(
  searchQuery: string,
  filters: OperatorFilterState
): OperatorsQueryContract {
  const p: OperatorsQueryContract = {};

  const q = searchQuery?.trim();
  if (q) p.search = q;

  if (filters.operatorType && filters.operatorType !== 'all') {
    p.operatorType = filters.operatorType;
  }

  if (filters.governorateId !== undefined && filters.governorateId !== null) {
    p.governorateId = Number(filters.governorateId);
  }

  if (filters.wilayaId !== undefined && filters.wilayaId !== null) {
    p.wilayaId = Number(filters.wilayaId);
  }

  if (filters.dailyRateMin !== undefined) p.minDailyRate = filters.dailyRateMin;
  if (filters.dailyRateMax !== undefined) p.maxDailyRate = filters.dailyRateMax;

  if (filters.minExperience !== undefined) p.minExperienceYears = filters.minExperience;
  if (filters.maxExperience !== undefined) p.maxExperienceYears = filters.maxExperience;

  if (filters.sortBy) {
    if (filters.sortBy === 'dailyRate_asc') {
      p.sortBy = 'dailyRate';
      p.sortOrder = 'asc';
    } else if (filters.sortBy === 'dailyRate_desc') {
      p.sortBy = 'dailyRate';
      p.sortOrder = 'desc';
    } else if (filters.sortBy === 'experienceYears' || filters.sortBy === 'experienceYears_desc') {
      p.sortBy = 'experienceYears';
      p.sortOrder = 'desc';
    } else if (filters.sortBy === 'newest' || filters.sortBy === 'createdAt_desc') {
      p.sortBy = 'createdAt';
      p.sortOrder = 'desc';
    } else {
      p.sortBy = filters.sortBy;
    }
  }

  return p;
}

/**
 * In-memory client-side refinement for attributes not yet accepted by the server DTO.
 */
export function refineOperatorsClientSide<T extends { raw?: unknown } | Record<string, unknown>>(
  items: T[],
  filters: OperatorFilterState
): T[] {
  if (!items || items.length === 0) return [];
  if (!filters.equipmentType && !filters.isPriceNegotiable && !filters.certification) {
    return items;
  }

  return items.filter((cardItem) => {
    const raw =
      typeof cardItem === 'object' && cardItem !== null && 'raw' in cardItem
        ? (cardItem as { raw: Record<string, unknown> }).raw
        : (cardItem as Record<string, unknown>);
    const op = raw || {};

    // 1. Equipment Type Filter
    if (filters.equipmentType) {
      const types = Array.isArray(op.equipmentTypes) ? (op.equipmentTypes as string[]) : [];
      if (!types.includes(filters.equipmentType)) return false;
    }

    // 2. Negotiable Price Filter
    if (filters.isPriceNegotiable && !op.isPriceNegotiable && !op.isNegotiable) {
      return false;
    }

    // 3. Certification Filter
    if (filters.certification) {
      const certs = Array.isArray(op.certifications) ? (op.certifications as string[]) : [];
      const hasCert = certs.some(
        (c) => typeof c === 'string' && c.toLowerCase().includes(filters.certification!.toLowerCase())
      );
      if (!hasCert) return false;
    }

    return true;
  });
}

/**
 * Clears an operator filter property and its associated state.
 */
export function clearOperatorFilter(
  filters: OperatorFilterState,
  id: string
): OperatorFilterState {
  const next: OperatorFilterState = { ...filters };

  if (id === 'operatorType') {
    delete next.operatorType;
  } else if (id === 'governorate' || id === 'city') {
    delete next.governorateId;
    delete next.wilayaId;
    delete (next as Record<string, unknown>).governorate;
    delete (next as Record<string, unknown>).city;
  } else if (id === 'rate' || id === 'dailyRate') {
    delete next.dailyRateMin;
    delete next.dailyRateMax;
  } else if (id === 'experience') {
    delete next.minExperience;
    delete next.maxExperience;
  } else if (id === 'equipmentType') {
    delete next.equipmentType;
  } else if (id === 'certification') {
    delete next.certification;
  } else if (id === 'negotiable') {
    delete next.isPriceNegotiable;
  } else if (id === 'sort') {
    delete next.sortBy;
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
  if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') {
    const trimmed = val[0].trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

/**
 * Safely parses a positive integer ID from a route parameter.
 * Rule: Accepts single positive whole numbers; for repeated parameters (arrays),
 * evaluates the first element; invalid formats return undefined.
 */
function toPositiveInteger(val: unknown): number | undefined {
  const str = toSingleString(val);
  if (!str || !/^\d+$/.test(str)) return undefined;
  const num = Number(str);
  return num > 0 ? num : undefined;
}

/**
 * Merges updated route params into existing operator filters (G-07).
 */
export function mergeOperatorRouteParams(
  prev: OperatorFilterState,
  params: Record<string, unknown>
): OperatorFilterState {
  const next = { ...prev };
  const opType = toSingleString(params.operatorType);
  if (opType && opType !== 'all') {
    next.operatorType = opType;
  }
  if (params.governorateId !== undefined) {
    next.governorateId = toPositiveInteger(params.governorateId);
  }
  if (params.wilayaId !== undefined) {
    next.wilayaId = toPositiveInteger(params.wilayaId);
  }
  return next;
}
