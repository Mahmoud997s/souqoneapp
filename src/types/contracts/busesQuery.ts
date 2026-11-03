/**
 * Buses query parameters contract.
 * Source of truth: apps/api/src/buses/dto/query-bus-listings.dto.ts
 */
export interface BusesQueryContract {
  [key: string]: unknown;
  search?: string;
  busListingType?: string;
  busType?: string;
  make?: string;
  governorateId?: string;
  wilayaId?: string;
  minPrice?: string;
  maxPrice?: string;
  priceMin?: string;
  priceMax?: string;
  minCapacity?: string;
  maxCapacity?: string;
  capacityMin?: string;
  capacityMax?: string;
  sort?: string;
  page?: string | number;
  limit?: string | number;
  userId?: string;
  isPremium?: string;
  condition?: string;
  transmission?: string;
  fuelType?: string;
  yearMin?: string;
  yearMax?: string;
}

export const BUSES_QUERY_ALLOW_LIST = [
  'search',
  'busListingType',
  'busType',
  'make',
  'governorateId',
  'wilayaId',
  'minPrice',
  'maxPrice',
  'priceMin',
  'priceMax',
  'minCapacity',
  'maxCapacity',
  'capacityMin',
  'capacityMax',
  'sort',
  'page',
  'limit',
  'userId',
  'isPremium',
  'condition',
  'transmission',
  'fuelType',
  'yearMin',
  'yearMax',
] as const;
