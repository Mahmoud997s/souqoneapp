import { QueryClient } from '@tanstack/react-query'
import {
  partQueryKeys,
  invalidatePartListingQueries,
} from '../partQueryKeys'

describe('partQueryKeys', () => {
  it('generates consistent detail keys for auth and guest', () => {
    expect(partQueryKeys.detail('p-1', true)).toEqual(['parts-detail', 'p-1', 'auth'])
    expect(partQueryKeys.detail('p-1', false)).toEqual(['parts-detail', 'p-1', 'guest'])
    expect(partQueryKeys.detail('p-1')).toEqual(['parts-detail', 'p-1'])
  })

  it('generates detailPrefix key', () => {
    expect(partQueryKeys.detailPrefix('p-1')).toEqual(['parts-detail', 'p-1'])
  })

  it('invalidates related queries through invalidatePartListingQueries', async () => {
    const queryClient = new QueryClient()
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')
    const refetchSpy = jest.spyOn(queryClient, 'refetchQueries')

    await invalidatePartListingQueries(queryClient, 'p-1')

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['parts-detail', 'p-1'] })
    expect(refetchSpy).toHaveBeenCalledWith({ queryKey: ['parts-detail', 'p-1'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['parts'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['my-parts'] })
  })

  it('removes queries when removeDetail is true', async () => {
    const queryClient = new QueryClient()
    const removeSpy = jest.spyOn(queryClient, 'removeQueries')

    await invalidatePartListingQueries(queryClient, 'p-1', { removeDetail: true })

    expect(removeSpy).toHaveBeenCalledWith({ queryKey: ['parts-detail', 'p-1'] })
  })
})
