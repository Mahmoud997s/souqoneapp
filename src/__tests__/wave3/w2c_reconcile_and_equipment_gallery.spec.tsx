import { renderHook, act } from '@testing-library/react-native'
import { useWizardImageReconciliation } from '../../hooks/useWizardImageReconciliation'
import { reconcileEditSectionImages } from '../../utils/reconcileEditSectionImages'
import { mapEquipmentDetail } from '../../utils/listing-detail/mapEquipmentDetail'
import {
  extractImageUrlsFromServiceFormData,
  buildServiceListingPayload,
} from '../../utils/services/serviceWizardSubmitHelpers'
import { defaultServiceFormData } from '../../store/serviceWizardStore'
import type { ImageReconciliationAdapter } from '../../utils/imageReconciliation'
import type { EquipmentDetailApi, EquipmentDetailApiImage } from '../../types/equipmentDetailApi.types'

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
        return { data: { id: 'new-1' } }
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
      ['img-2', 'img-1', 'new-1'],
      expect.anything()
    )
    expect(adapter.deleteImage).not.toHaveBeenCalled()
    expect(reconRes.imagesComplete).toBe(false)
    expect(callOrder).toEqual([
      'upload:file://new.jpg',
      'attach:https://cdn.example.com/new.jpg',
      'reorder:img-2,img-1,new-1',
    ])
  })

  it('executes deleteImage only after upload, attach, and reorder all succeed (including attached new ID)', async () => {
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
        return { id: 'new-99' }
      }),
      reorderImages: jest.fn(async (_id, ids) => {
        callOrder.push(`reorder:${ids.join(',')}`)
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
    expect(callOrder).toEqual(['upload', 'attach', 'reorder:img-2,img-1,new-99', 'delete:img-3'])
  })

  describe('reconcileEditSectionImages direct unit tests & failure semantics', () => {
    it('runs attachNew -> reorderExisting([ex-2, ex-1, new-1]) -> removeExisting(ex-removed) deterministically', async () => {
      const callOrder: string[] = []
      const attachNew = jest.fn(async () => {
        callOrder.push('attachNew')
        return { data: [{ id: 'new-1', url: 'https://cdn.example.com/new-1.jpg' }] }
      })
      const reorderExisting = jest.fn(async (_id: string, orderedIds: string[]) => {
        callOrder.push(`reorder:${orderedIds.join(',')}`)
      })
      const removeExisting = jest.fn(async (_id: string, imgId: string) => {
        callOrder.push(`remove:${imgId}`)
      })

      await reconcileEditSectionImages({
        listingId: 'listing-1',
        newImageUrls: ['https://cdn.example.com/new-1.jpg'],
        existingImages: [
          { id: 'ex-2', url: 'https://cdn.example.com/ex-2.jpg' },
          { id: 'ex-1', url: 'https://cdn.example.com/ex-1.jpg' },
        ],
        removedImageIds: ['ex-removed'],
        attachNew,
        reorderExisting,
        removeExisting,
      })

      expect(reorderExisting).toHaveBeenCalledWith('listing-1', ['ex-2', 'ex-1', 'new-1'])
      expect(callOrder).toEqual(['attachNew', 'reorder:ex-2,ex-1,new-1', 'remove:ex-removed'])
    })

    it('rejects and skips removeExisting when reorderExisting throws', async () => {
      const attachNew = jest.fn(async () => [{ id: 'new-1' }])
      const reorderExisting = jest.fn(async () => {
        throw new Error('فشل ترتيب الصور')
      })
      const removeExisting = jest.fn(async () => undefined)

      await expect(
        reconcileEditSectionImages({
          listingId: 'listing-1',
          newImageUrls: ['https://cdn.example.com/new-1.jpg'],
          existingImages: [{ id: 'ex-1' }],
          removedImageIds: ['ex-removed'],
          attachNew,
          reorderExisting,
          removeExisting,
        })
      ).rejects.toThrow('فشل ترتيب الصور')

      expect(removeExisting).not.toHaveBeenCalled()
    })

    it('rejects and skips both reorderExisting and removeExisting when attachNew throws', async () => {
      const attachNew = jest.fn(async () => {
        throw new Error('فشل ربط الصورة الجديدة')
      })
      const reorderExisting = jest.fn(async () => undefined)
      const removeExisting = jest.fn(async () => undefined)

      await expect(
        reconcileEditSectionImages({
          listingId: 'listing-1',
          newImageUrls: ['https://cdn.example.com/new-1.jpg'],
          existingImages: [{ id: 'ex-1' }],
          removedImageIds: ['ex-removed'],
          attachNew,
          reorderExisting,
          removeExisting,
        })
      ).rejects.toThrow('فشل ربط الصورة الجديدة')

      expect(reorderExisting).not.toHaveBeenCalled()
      expect(removeExisting).not.toHaveBeenCalled()
    })
  })

  describe('Order preservation across all 5 sections (Cars, Buses, Equipment, Parts, Services)', () => {
    it.each([
      {
        section: 'cars',
        attachResponse: [{ data: { id: 'car-new-1' } }],
      },
      {
        section: 'buses',
        attachResponse: [{ id: 'bus-new-1' }],
      },
      {
        section: 'equipment',
        attachResponse: [{ id: 'eq-new-1' }],
      },
    ])('$section preserves [primary, second, new] order via reconcileEditSectionImages', async ({ section, attachResponse }) => {
      const expectedNewId = section === 'cars' ? 'car-new-1' : section === 'buses' ? 'bus-new-1' : 'eq-new-1'
      const reorderExisting = jest.fn(async () => undefined)
      const removeExisting = jest.fn(async () => undefined)

      await reconcileEditSectionImages({
        listingId: `${section}-1`,
        newImageUrls: ['https://cdn.example.com/new.jpg'],
        existingImages: [
          { id: 'ex-primary', url: 'https://cdn.example.com/p.jpg' },
          { id: 'ex-second', url: 'https://cdn.example.com/s.jpg' },
        ],
        removedImageIds: ['ex-old'],
        attachNew: async () => attachResponse,
        reorderExisting,
        removeExisting,
      })

      expect(reorderExisting).toHaveBeenCalledWith(`${section}-1`, ['ex-primary', 'ex-second', expectedNewId])
      expect(removeExisting).toHaveBeenCalledWith(`${section}-1`, 'ex-old')
    })

    it('services preserves [primaryUrl, secondExistingUrl, newUrl] in payload.images sent to PATCH /services/:id', () => {
      const reorderedExisting = [
        { id: 'srv-2', url: 'https://cdn.example.com/primary.jpg' },
        { id: 'srv-1', url: 'https://cdn.example.com/second.jpg' },
      ]
      const existingUrls = extractImageUrlsFromServiceFormData(reorderedExisting)
      const finalImageUrls = [...existingUrls, 'https://cdn.example.com/new.jpg']

      const payload = buildServiceListingPayload(
        {
          ...defaultServiceFormData,
          editMode: true,
          editListingId: 'srv-listing-1',
          serviceType: 'MAINTENANCE',
          title: 'صيانة متكاملة',
          description: 'وصف الخدمة للتعديل',
          existingImages: reorderedExisting,
        },
        finalImageUrls
      )

      expect(payload.images).toEqual([
        'https://cdn.example.com/primary.jpg',
        'https://cdn.example.com/second.jpg',
        'https://cdn.example.com/new.jpg',
      ])
    })
  })

  it('sorts equipment images with isPrimary first, then sortOrder/order ascending (no as any on images)', () => {
    const images: EquipmentDetailApiImage[] = [
      { id: '3', url: 'https://cdn.example.com/3.jpg', isPrimary: false, sortOrder: 2 },
      { id: '1', url: 'https://cdn.example.com/1.jpg', isPrimary: false, sortOrder: 0 },
      { id: '2', url: 'https://cdn.example.com/2.jpg', isPrimary: true, sortOrder: 5 },
    ]
    const rawEquipment: EquipmentDetailApi = {
      id: 'eq-1',
      title: 'حفار كاتربيلر',
      slug: 'cat-excavator',
      equipmentType: 'EXCAVATOR',
      listingType: 'EQUIPMENT_SALE',
      features: [],
      status: 'ACTIVE',
      userId: 'user-1',
      user: {
        id: 'user-1',
        username: 'seller',
        createdAt: '2026-11-15T00:00:00Z',
      },
      version: 1,
      createdAt: '2026-11-15T00:00:00Z',
      updatedAt: '2026-11-15T00:00:00Z',
      images,
    }

    const vm = mapEquipmentDetail(rawEquipment)

    expect(vm.images.map((i) => i.id)).toEqual(['2', '1', '3'])
    expect(vm.images[0].isPrimary).toBe(true)
  })
})
