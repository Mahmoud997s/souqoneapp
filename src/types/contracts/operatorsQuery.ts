/**
 * Operator listings query parameters contract.
 * Source of truth: apps/api/src/equipment/dto/query-operator-listings.dto.ts
 * Note: equipmentType, certification, isPriceNegotiable are client-side only refinements.
 */
export interface OperatorsQueryContract {
  [key: string]: unknown;
  operatorType?: string;
  governorateId?: number;
  wilayaId?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  userId?: string;
  minDailyRate?: number;
  maxDailyRate?: number;
  minHourlyRate?: number;
  maxHourlyRate?: number;
  minExperienceYears?: number;
  maxExperienceYears?: number;
}

export const OPERATORS_QUERY_ALLOW_LIST = [
  'operatorType',
  'governorateId',
  'wilayaId',
  'search',
  'sortBy',
  'sortOrder',
  'page',
  'limit',
  'userId',
  'minDailyRate',
  'maxDailyRate',
  'minHourlyRate',
  'maxHourlyRate',
  'minExperienceYears',
  'maxExperienceYears',
] as const;

export const OPERATORS_CLIENT_ONLY_KEYS = [
  'equipmentType',
  'certification',
  'isPriceNegotiable',
] as const;
