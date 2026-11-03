/**
 * Parts query parameters contract.
 * Source of truth: apps/api/src/parts/dto/query-parts.dto.ts
 */
export interface PartsQueryContract {
  [key: string]: unknown;
  search?: string;
  partCategory?: string;
  condition?: string;
  make?: string;
  governorateId?: string;
  wilayaId?: string;
  partNumber?: string;
  isOriginal?: boolean | string;
  isScrap?: boolean | string;
  minPrice?: string;
  maxPrice?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: string | number;
  limit?: string | number;
  sellerId?: string;
  hasWarranty?: boolean;
  compatibleVehicleType?: string;
}

export const PARTS_QUERY_ALLOW_LIST = [
  'search',
  'partCategory',
  'condition',
  'make',
  'governorateId',
  'wilayaId',
  'partNumber',
  'isOriginal',
  'isScrap',
  'minPrice',
  'maxPrice',
  'sortBy',
  'sortOrder',
  'page',
  'limit',
  'sellerId',
  'hasWarranty',
  'compatibleVehicleType',
] as const;
