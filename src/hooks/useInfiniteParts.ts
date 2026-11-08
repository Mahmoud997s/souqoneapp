import { useInfiniteQuery } from '@tanstack/react-query';
import { partsApi } from '../api/parts';
import { mapPartToCard } from '../utils/mappers';
import { parseListEnvelope } from '../utils/parseListEnvelope';

export function useInfiniteParts(params?: Record<string, unknown>, options?: any) {
  const limit = (params?.limit as number) || 30;

  return useInfiniteQuery({
    queryKey: ['parts-infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const pageNum = pageParam as number;
      const res = await partsApi.getAll({ ...params, page: pageNum, limit });
      const { items: rawList, hasNextPage } = parseListEnvelope(res.data);
      return {
        items: rawList.map(mapPartToCard).filter(Boolean),
        rawItems: rawList,
        nextPage: hasNextPage ? pageNum + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    ...options,
  });
}
