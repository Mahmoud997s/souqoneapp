import { useQuery } from '@tanstack/react-query';
import { carsApi, CarBrand, CarModelItem, CarTrimItem } from '../api/cars';

export function useBrands(popular?: boolean) {
  return useQuery<CarBrand[]>({
    queryKey: ['car-brands', popular],
    queryFn: () => carsApi.getBrands(popular),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useSearchBrands(q: string) {
  return useQuery<CarBrand[]>({
    queryKey: ['car-brands-search', q],
    queryFn: () => carsApi.searchBrands(q),
    enabled: q.trim().length >= 2,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCarModels(brandId: string) {
  return useQuery<CarModelItem[]>({
    queryKey: ['car-models', brandId],
    queryFn: () => carsApi.getModels(brandId),
    enabled: !!brandId,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useCarTrims(modelId: string) {
  return useQuery<CarTrimItem[]>({
    queryKey: ['car-trims', modelId],
    queryFn: () => carsApi.getTrims(modelId),
    enabled: !!modelId,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
