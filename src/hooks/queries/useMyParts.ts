import { useQuery } from '@tanstack/react-query'
import { partsApi } from '../../api/parts'

export function useMyParts() {
  return useQuery({
    queryKey: ['my-parts'],
    queryFn: async () => {
      const res = await partsApi.getMy()
      return res.data
    },
  })
}
