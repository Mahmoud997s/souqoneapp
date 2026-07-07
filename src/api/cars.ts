import { apiClient } from './client';

export interface CarBrand {
  id: string;
  name: string;
  nameAr: string | null;
  slug: string;
  isPopular: boolean;
  modelCount: number;
}

export interface CarModelItem {
  id: string;
  name: string;
  nameAr: string | null;
  slug: string;
  yearCount: number;
}

export interface CarTrimItem {
  id: string;
  name: string;
  nameAr: string | null;
  slug: string;
  yearFrom: number;
  yearTo: number;
  engineCapacity: string | null;
  cylinders: number | null;
  horsepower: number | null;
  torque: string | null;
  driveType: string | null;
  transmission: string | null;
  fuelType: string | null;
  seats: number | null;
  isFullOption: boolean;
}

export const carsApi = {
  getBrands: (popular?: boolean) => {
    const params = popular !== undefined ? { popular } : {};
    return apiClient.get<CarBrand[]>('/cars/brands', { params }).then(res => res.data);
  },
  
  searchBrands: (q: string, limit = 15) => {
    return apiClient.get<CarBrand[]>('/cars/brands/search', { params: { q, limit } }).then(res => res.data);
  },
  
  getModels: (brandId: string) => {
    return apiClient.get<CarModelItem[]>(`/cars/brands/${brandId}/models`).then(res => res.data);
  },

  getTrims: (modelId: string) => {
    return apiClient.get<CarTrimItem[]>(`/cars/models/${modelId}/trims`).then(res => res.data);
  }
};
