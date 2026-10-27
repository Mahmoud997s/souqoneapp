import {
  serviceQueryKeys,
  invalidateServiceListingQueries,
} from '../serviceQueryKeys'
import type { QueryClient } from '@tanstack/react-query'

describe('serviceQueryKeys', () => {
  it('generates consistent keys for service queries', () => {
    expect(serviceQueryKeys.all).toEqual(['services'])
    expect(serviceQueryKeys.lists()).toEqual(['services', 'list'])
    expect(serviceQueryKeys.infinite()).toEqual(['services', 'infinite'])
    expect(serviceQueryKeys.my()).toEqual(['services', 'my'])
    expect(serviceQueryKeys.details()).toEqual(['services', 'detail'])
    expect(serviceQueryKeys.detail('srv-123', true)).toEqual([
      'services-detail',
      'srv-123',
      'auth',
    ])
    expect(serviceQueryKeys.detail('srv-123', false)).toEqual([
      'services-detail',
      'srv-123',
      'guest',
    ])
  })

  describe('invalidateServiceListingQueries', () => {
    let mockQueryClient: {
      invalidateQueries: jest.Mock
      removeQueries: jest.Mock
    }

    beforeEach(() => {
      mockQueryClient = {
        invalidateQueries: jest.fn().mockResolvedValue(undefined),
        removeQueries: jest.fn().mockResolvedValue(undefined),
      }
    })

    it('invalidates list queries when called without id', async () => {
      await invalidateServiceListingQueries(
        mockQueryClient as unknown as QueryClient
      )

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['services'],
      })
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['services-infinite'],
      })
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['my-services'],
      })
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['my-listings'],
      })
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['listings'],
      })
      expect(mockQueryClient.removeQueries).not.toHaveBeenCalled()
    })

    it('invalidates detail queries when called with id and removeDetail is false', async () => {
      await invalidateServiceListingQueries(
        mockQueryClient as unknown as QueryClient,
        'srv-99'
      )

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['service', 'srv-99'],
      })
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['services-detail', 'srv-99'],
      })
      expect(mockQueryClient.removeQueries).not.toHaveBeenCalled()
    })

    it('removes detail queries when called with id and removeDetail is true', async () => {
      await invalidateServiceListingQueries(
        mockQueryClient as unknown as QueryClient,
        'srv-99',
        { removeDetail: true }
      )

      expect(mockQueryClient.removeQueries).toHaveBeenCalledWith({
        queryKey: ['service', 'srv-99'],
      })
      expect(mockQueryClient.removeQueries).toHaveBeenCalledWith({
        queryKey: ['services-detail', 'srv-99'],
      })
    })
  })
})
