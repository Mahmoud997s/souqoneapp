import { apiClient } from './client'
import { GovernorateRef, WilayaRef } from '../types/location.types'

let cachedGovernorates: GovernorateRef[] | null = null
const cachedWilayas: Record<number, WilayaRef[]> = {}

export const locationsApi = {
  getGovernorates: async (): Promise<GovernorateRef[]> => {
    if (cachedGovernorates) {
      return cachedGovernorates
    }
    const { data } = await apiClient.get('/locations/governorates')
    if (Array.isArray(data)) {
      cachedGovernorates = data
      return data
    } else if (data?.data) {
      cachedGovernorates = data.data
      return data.data
    }
    return []
  },

  getWilayas: async (governorateId: number): Promise<WilayaRef[]> => {
    if (cachedWilayas[governorateId]) {
      return cachedWilayas[governorateId]
    }
    const { data } = await apiClient.get('/locations/wilayas', {
      params: { governorateId }
    })
    if (Array.isArray(data)) {
      cachedWilayas[governorateId] = data
      return data
    } else if (data?.data) {
      cachedWilayas[governorateId] = data.data
      return data.data
    }
    return []
  }
}
