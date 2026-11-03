/**
 * Contract allow-list for Cars Browse Query Parameters.
 * Corresponds to QueryListingsDto and backend query parameters.
 */
export interface CarsQuery {
  limit?: number;
  page?: number;
  search?: string;
  make?: string;
  model?: string;
  trim?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMin?: number;
  mileageMax?: number;
  fuelType?: string;
  transmission?: string;
  condition?: string;
  bodyType?: string;
  governorateId?: number;
  wilayaId?: number;
  status?: string;
  listingType?: string;
  sortBy?: string;
  sortOrder?: string;
  sellerId?: string;
  isPremium?: boolean;
}

export const CARS_QUERY_ALLOWED_KEYS: readonly (keyof CarsQuery)[] = [
  'limit',
  'page',
  'search',
  'make',
  'model',
  'trim',
  'yearMin',
  'yearMax',
  'priceMin',
  'priceMax',
  'mileageMin',
  'mileageMax',
  'fuelType',
  'transmission',
  'condition',
  'bodyType',
  'governorateId',
  'wilayaId',
  'status',
  'listingType',
  'sortBy',
  'sortOrder',
  'sellerId',
  'isPremium',
] as const;
