export interface FilterState {
  listingType?: string;
  sortBy?: string;
  sortOrder?: string;
  priceMin?: string;
  priceMax?: string;
  yearMin?: string;
  yearMax?: string;
  mileageMin?: string;
  mileageMax?: string;
  makeId?: string;
  make?: string;
  modelId?: string;
  model?: string;
  trim?: string;
  governorate?: string;
  city?: string;
  transmission?: string;
  condition?: string;
  bodyType?: string;
  fuelType?: string;
  isPremium?: boolean;
}

export interface PartsFilterState {
  category?: string;
  condition?: string;
  isOriginal?: boolean;
  makeId?: string;
  make?: string;
  priceMin?: string;
  priceMax?: string;
  priceId?: string;
  governorate?: string;
  city?: string;
  partNumber?: string;
  sortBy?: string;
  sortOrder?: string;
  isScrap?: boolean;
}

