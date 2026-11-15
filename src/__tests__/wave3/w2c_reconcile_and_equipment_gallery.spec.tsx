import { renderHook, act } from '@testing-library/react-native'
import { useWizardImageReconciliation } from '../../hooks/useWizardImageReconciliation'
import { mapEquipmentDetail } from '../../utils/listing-detail/mapEquipmentDetail'
import type { ImageReconciliationAdapter } from '../../utils/imageReconciliation'

describe('D-330 Commit 2: Atomic image reconciliation (upload -> update -> reorder -> delete) & Equipment gallery order', () => {
  it('calls reorderImages before deleteImage and skips deleteImage if reorder fails', async () => {
    const callOrder: string[] = []
    const adapter: ImageReconciliationAdapter & {
      reorderImages: jest.Mock
    } = {
      vertical: 'parts',
      uploadImage: jest.fn(async (img) => {
        callOrder.push(`upload:${img.uri}`)
        return 'https://cdn.example.com/new.jpg'
      }),
      attachImageUrl: jest.fn(async (_id, url) => {
        callOrder.push(`attach:${url}`)
      }),
      reorderImages: jest.fn(async (_id, ids) => {
        callOrder.push(`reorder:${ids.join(',')}`)
        throw new Error('reorder network error')
      }),
      deleteImage: jest.fn(async (imgId) => {
        callOrder.push(`delete:${imgId}`)
      }),
    }

    const { result } = await renderHook(() => useWizardImageReconciliation({ adapter }))

    let reconRes: any
    await act(async () => {
      reconRes = await result.current.reconcile({
        listingId: 'part-1',
        isEditMode: true,
        localImages: [{ uri: 'file://new.jpg' }],
        existingImages: [
          { id: 'img-2', url: 'https://cdn.example.com/2.jpg' },
          { id: 'img-1', url: 'https://cdn.example.com/1.jpg' },
        ],
        removedImageIds: ['img-3'],
        listingSaved: true,
      })
    })

    expect(adapter.reorderImages).toHaveBeenCalledWith(
      'part-1',
      ['img-2', 'img-1'],
      expect.anything()
    )
    expect(adapter.deleteImage).not.toHaveBeenCalled()
    expect(reconRes.imagesComplete).toBe(false)
    expect(callOrder).toEqual([
      'upload:file://new.jpg',
      'attach:https://cdn.example.com/new.jpg',
      'reorder:img-2,img-1',
    ])
  })

  it('executes deleteImage only after upload, attach, and reorder all succeed', async () => {
    const callOrder: string[] = []
    const adapter: ImageReconciliationAdapter & {
      reorderImages: jest.Mock
    } = {
      vertical: 'parts',
      uploadImage: jest.fn(async () => {
        callOrder.push('upload')
        return 'https://cdn.example.com/new.jpg'
      }),
      attachImageUrl: jest.fn(async () => {
        callOrder.push('attach')
      }),
      reorderImages: jest.fn(async () => {
        callOrder.push('reorder')
      }),
      deleteImage: jest.fn(async (imgId) => {
        callOrder.push(`delete:${imgId}`)
      }),
    }

    const { result } = await renderHook(() => useWizardImageReconciliation({ adapter }))

    let reconRes: any
    await act(async () => {
      reconRes = await result.current.reconcile({
        listingId: 'part-1',
        isEditMode: true,
        localImages: [{ uri: 'file://new.jpg' }],
        existingImages: [
          { id: 'img-2', url: 'https://cdn.example.com/2.jpg' },
          { id: 'img-1', url: 'https://cdn.example.com/1.jpg' },
        ],
        removedImageIds: ['img-3'],
        listingSaved: true,
      })
    })

    expect(reconRes.imagesComplete).toBe(true)
    expect(callOrder).toEqual(['upload', 'attach', 'reorder', 'delete:img-3'])
  })

  it('sorts equipment images with isPrimary first, then sortOrder/order ascending', () => {
    const vm = mapEquipmentDetail({
      id: 'eq-1',
      title: 'حفار كاتربيلر',
      listingType: 'EQUIPMENT_SALE',
      status: 'ACTIVE',
      createdAt: '2026-11-15T00:00:00Z',
      images: [
        { id: '3', url: 'https://cdn.example.com/3.jpg', isPrimary: false, sortOrder: 2 } as any,
        { id: '1', url: 'https://cdn.example.com/1.jpg', isPrimary: false, sortOrder: 0 } as any,
        { id: '2', url: 'https://cdn.example.com/2.jpg', isPrimary: true, sortOrder: 5 } as any,
      ],
    } as any)

    expect(vm.images.map((i) => i.id)).toEqual(['2', '1', '3'])
    expect(vm.images[0].isPrimary).toBe(true)
  })
})
