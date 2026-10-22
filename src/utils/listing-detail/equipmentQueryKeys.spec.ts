import { QueryClient } from '@tanstack/react-query'
import {
  equipmentQueryKeys,
  invalidateEquipmentListingQueries,
} from './equipmentQueryKeys'

describe('equipmentQueryKeys & invalidateEquipmentListingQueries', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
  })

  describe('query keys factory', () => {
    it('produces correct keys', () => {
      expect(equipmentQueryKeys.detail('eq-1')).toEqual(['equipment-detail', 'eq-1'])
      expect(equipmentQueryKeys.detail('eq-1', true)).toEqual(['equipment-detail', 'eq-1', 'auth'])
      expect(equipmentQueryKeys.detail('eq-1', false)).toEqual(['equipment-detail', 'eq-1', 'guest'])
      expect(equipmentQueryKeys.similar('eq-1', 4)).toEqual(['equipment-similar', 'eq-1', 4])
      expect(equipmentQueryKeys.equipment()).toEqual(['equipment', undefined])
      expect(equipmentQueryKeys.equipmentInfinite()).toEqual(['equipment-infinite', undefined])
      expect(equipmentQueryKeys.equipmentItem('eq-1')).toEqual(['equipment-item', 'eq-1'])
      expect(equipmentQueryKeys.myEquipment()).toEqual(['my-equipment'])
      expect(equipmentQueryKeys.myListings()).toEqual(['my-listings'])
      expect(equipmentQueryKeys.listings()).toEqual(['listings', undefined])
    })
  })

  describe('invalidateEquipmentListingQueries', () => {
    it('invalidates all equipment list, infinite, my-equipment, and detail keys', async () => {
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue()

      await invalidateEquipmentListingQueries(queryClient, 'eq-123')

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['equipment-detail', 'eq-123'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['equipment-item', 'eq-123'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['equipment', 'eq-123'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['equipment'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['equipment-infinite'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['my-equipment'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['my-listings'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['listings'] })
    })

    it('removes detail queries when removeDetail: true', async () => {
      const removeSpy = jest.spyOn(queryClient, 'removeQueries')
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue()

      await invalidateEquipmentListingQueries(queryClient, 'eq-123', { removeDetail: true })

      expect(removeSpy).toHaveBeenCalledWith({ queryKey: ['equipment-detail', 'eq-123'] })
      expect(removeSpy).toHaveBeenCalledWith({ queryKey: ['equipment-item', 'eq-123'] })
      expect(removeSpy).toHaveBeenCalledWith({ queryKey: ['equipment', 'eq-123'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['equipment'] })
    })
  })
})
