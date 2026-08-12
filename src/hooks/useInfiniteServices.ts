import { useInfiniteQuery } from '@tanstack/react-query';
import { servicesApi } from '../api/services';
import { mapServiceToCard } from '../utils/mappers';

export function useInfiniteServices(params?: Record<string, unknown>, options?: any) {
  const limit = (params?.limit as number) || 30;

  return useInfiniteQuery({
    queryKey: ['services-infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const pageNum = pageParam as number;
      const res = await servicesApi.getAll({ ...params, page: pageNum, limit });
      const data = res?.data as any;
      const items = data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
      const rawList = Array.isArray(items) ? items : [];
      const services = rawList.map(mapServiceToCard).filter(Boolean);

      const hasNextPage = data?.meta?.hasNextPage ?? (rawList.length === limit);
      return {
        items: services,
        rawItems: rawList,
        nextPage: hasNextPage ? pageNum + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    ...options,
  });
}
