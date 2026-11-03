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
export function refineOperatorsClientSide<T extends { raw?: any } | Record<string, any>>(
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
 * Merges updated route params into existing operator filters (G-07).
 */
export function mergeOperatorRouteParams(
  prev: OperatorFilterState,
  params: Record<string, string | undefined>
): OperatorFilterState {
  const next = { ...prev };
  if (params.operatorType && params.operatorType !== 'all') {
    next.operatorType = params.operatorType;
  }
  if (params.governorateId) {
    const g = Number(params.governorateId);
    if (!isNaN(g)) next.governorateId = g;
  }
  if (params.wilayaId) {
    const w = Number(params.wilayaId);
    if (!isNaN(w)) next.wilayaId = w;
  }
  return next;
}
