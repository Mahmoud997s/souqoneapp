/**
 * Equipment query parameters contract.
 * Source of truth: apps/api/src/equipment/dto/query-equipment-listings.dto.ts
 * Note: DTO supports hoursUsedMax; hoursMin is intentionally not in the contract.
 */
export interface EquipmentQueryContract {
  [key: string]: unknown;
  equipmentType?: string;
  listingType?: string;
  governorateId?: number;
  wilayaId?: number;
  search?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
  userId?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  hoursUsedMax?: number;
}

export const EQUIPMENT_QUERY_ALLOW_LIST = [
  'equipmentType',
  'listingType',
  'governorateId',
  'wilayaId',
  'search',
  'sortBy',
  'page',
  'limit',
  'userId',
  'condition',
  'minPrice',
  'maxPrice',
  'make',
  'model',
  'yearMin',
  'yearMax',
  'hoursUsedMax',
] as const;
