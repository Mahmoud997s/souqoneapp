import { useQuery } from '@tanstack/react-query'
import { equipmentApi } from '../../api/equipment'

export function useMyEquipment() {
  return useQuery({
    queryKey: ['my-equipment'],
    queryFn: async () => {
      const res = await equipmentApi.getMy()
      return res.data
    },
  })
}
