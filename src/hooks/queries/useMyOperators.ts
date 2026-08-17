import { useQuery } from '@tanstack/react-query'
import { equipmentApi } from '../../api/equipment'

export function useMyOperators() {
  return useQuery({
    queryKey: ['my-operators'],
    queryFn: async () => {
      const res = await equipmentApi.getMyOperators()
      return res.data
    },
  })
}
