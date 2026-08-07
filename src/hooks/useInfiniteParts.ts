import { useInfiniteQuery } from '@tanstack/react-query';
import { partsApi } from '../api/parts';
import { mapPartToCard } from '../utils/mappers';

export function useInfiniteParts(params?: Record<string, unknown>, options?: any) {
  const limit = (params?.limit as number) || 30;

  return useInfiniteQuery({
    queryKey: ['parts-infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const pageNum = pageParam as number;
      const res = await partsApi.getAll({ ...params, page: pageNum, limit });
      const data = res?.data as any;
      const items = data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
      const rawList = Array.isArray(items) ? items : [];
      const parts = rawList.map(mapPartToCard).filter(Boolean);

      const hasNextPage = data?.meta?.hasNextPage ?? (rawList.length === limit);
      return {
        items: parts,
        rawItems: rawList,
        nextPage: hasNextPage ? pageNum + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    ...options,
  });
}
