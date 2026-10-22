import { QueryClient } from '@tanstack/react-query'
import {
  operatorQueryKeys,
  invalidateOperatorListingQueries,
} from './operatorQueryKeys'

describe('operatorQueryKeys', () => {
  it('generates consistent query keys using factory functions', () => {
    expect(operatorQueryKeys.detail('op-1')).toEqual(['operator-detail', 'op-1'])
    expect(operatorQueryKeys.detail('op-1', true)).toEqual(['operator-detail', 'op-1', 'auth'])
    expect(operatorQueryKeys.detail('op-1', false)).toEqual(['operator-detail', 'op-1', 'guest'])
    expect(operatorQueryKeys.detailPrefix('op-1')).toEqual(['operator-detail', 'op-1'])
    expect(operatorQueryKeys.reviews('op-1')).toEqual(['reviews', 'op-1'])
    expect(operatorQueryKeys.operators({ type: 'DRIVER' })).toEqual(['operators', { type: 'DRIVER' }])
    expect(operatorQueryKeys.operatorsInfinite()).toEqual(['operators-infinite', undefined])
    expect(operatorQueryKeys.operatorItem('op-1')).toEqual(['operator-item', 'op-1'])
    expect(operatorQueryKeys.myOperators()).toEqual(['my-operators'])
    expect(operatorQueryKeys.myListings()).toEqual(['my-listings'])
    expect(operatorQueryKeys.listings()).toEqual(['listings', undefined])
  })

  it('invalidates all operator-related query caches upon mutation', async () => {
    const qc = new QueryClient()
    const invalidateSpy = jest.spyOn(qc, 'invalidateQueries').mockResolvedValue()

    await invalidateOperatorListingQueries(qc, 'op-123')

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['operator-detail', 'op-123'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['operator-item', 'op-123'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['reviews', 'op-123'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['operators'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['operators-infinite'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['my-operators'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['my-listings'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['listings'] })
  })

  it('removes detail query when removeDetail option is passed', async () => {
    const qc = new QueryClient()
    const removeSpy = jest.spyOn(qc, 'removeQueries')
    const invalidateSpy = jest.spyOn(qc, 'invalidateQueries').mockResolvedValue()

    await invalidateOperatorListingQueries(qc, 'op-123', { removeDetail: true })

    expect(removeSpy).toHaveBeenCalledWith({ queryKey: ['operator-detail', 'op-123'] })
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: ['operator-item', 'op-123'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['reviews', 'op-123'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['my-operators'] })
  })
})
