import { renderHook, act } from '@testing-library/react-native'
import {
  useWizardImageReconciliation,
  UseWizardImageReconciliationOptions,
} from '../../hooks/useWizardImageReconciliation'
import {
  ImageReconciliationAdapter,
  createEmptyLedger,
} from '../../utils/imageReconciliation'

describe('useWizardImageReconciliation (S6 / D-243)', () => {
  const createMockAdapter = (
    overrides?: Partial<ImageReconciliationAdapter>
  ): ImageReconciliationAdapter & {
    uploadCalls: Array<{ uri: string }>
    attachCalls: Array<{ listingId: string; url: string; isPrimary?: boolean }>
    deleteCalls: Array<{ imageId: string; listingId?: string }>
  } => {
    const uploadCalls: Array<{ uri: string }> = []
    const attachCalls: Array<{ listingId: string; url: string; isPrimary?: boolean }> = []
    const deleteCalls: Array<{ imageId: string; listingId?: string }> = []

    return {
      vertical: 'test-parts',
      uploadCalls,
      attachCalls,
      deleteCalls,
      uploadImage: jest.fn(async (img) => {
        uploadCalls.push({ uri: img.uri })
        return `https://cdn.souqone.app/${encodeURIComponent(img.uri.replace(/\W/g, '_'))}.jpg`
      }),
      attachImageUrl: jest.fn(async (listingId, url, isPrimary) => {
        attachCalls.push({ listingId, url, isPrimary })
        return { success: true }
      }),
      deleteImage: jest.fn(async (imageId, listingId) => {
        deleteCalls.push({ imageId, listingId })
        return { success: true }
      }),
      ...overrides,
    }
  }

  it('1. Full success: uploads all local images and marks images complete', async () => {
    const adapter = createMockAdapter()
    const { result } = await renderHook(() =>
      useWizardImageReconciliation({ adapter })
    )

    expect(result.current.imagesComplete).toBe(true)
    expect(result.current.listingSaved).toBe(false)
    expect(result.current.isPartialSuccess).toBe(false)

    let reconcileRes: any
    await act(async () => {
      reconcileRes = await result.current.reconcile({
        localImages: [
          { uri: 'file:///photo1.jpg', isPrimary: true },
          { uri: 'file:///photo2.jpg', isPrimary: false },
        ],
        listingSaved: true,
        listingId: 'part_101',
      })
    })

    expect(adapter.uploadCalls.length).toBe(2)
    expect(reconcileRes.imagesComplete).toBe(true)
    expect(reconcileRes.listingSaved).toBe(true)
    expect(reconcileRes.isPartialSuccess).toBe(false)
    expect(reconcileRes.failedOperations).toEqual([])
    expect(reconcileRes.uploadedUrls.length).toBe(2)

    expect(result.current.imagesComplete).toBe(true)
    expect(result.current.listingSaved).toBe(true)
    expect(result.current.isPartialSuccess).toBe(false)
    expect(result.current.failedOperations).toEqual([])
  })

  it('2. Partial failure: listing is saved but failed upload is flagged as partial success', async () => {
    const adapter = createMockAdapter({
      uploadImage: jest.fn(async (img) => {
        if (img.uri.includes('fail')) {
          throw new Error('Upload rejected: Network timeout')
        }
        return `https://cdn.souqone.app/ok.jpg`
      }),
    })

    const { result } = await renderHook(() =>
      useWizardImageReconciliation({ adapter })
    )

    let reconcileRes: any
    await act(async () => {
      reconcileRes = await result.current.reconcile({
        localImages: [
          { uri: 'file:///success.jpg' },
          { uri: 'file:///fail.jpg' },
        ],
        listingSaved: true,
        listingId: 'part_102',
      })
    })

    // Listing saved, but images incomplete -> partial success (Decision d5)
    expect(reconcileRes.listingSaved).toBe(true)
    expect(reconcileRes.imagesComplete).toBe(false)
    expect(reconcileRes.isPartialSuccess).toBe(true)
    expect(reconcileRes.failedOperations.length).toBe(1)
    expect(reconcileRes.failedOperations[0].type).toBe('upload')
    expect(reconcileRes.failedOperations[0].key).toBe('upload:file:///fail.jpg')
    expect(reconcileRes.uploadedUrls.length).toBe(1)

    expect(result.current.imagesComplete).toBe(false)
    expect(result.current.isPartialSuccess).toBe(true)
    expect(result.current.failedImages).toEqual(['file:///fail.jpg'])
  })

  it('3. Retry for failed only: never re-uploads previously succeeded images', async () => {
    let shouldFail = true
    const uploadCalls: string[] = []

    const adapter = createMockAdapter({
      uploadImage: jest.fn(async (img) => {
        uploadCalls.push(img.uri)
        if (img.uri === 'file:///second.jpg' && shouldFail) {
          throw new Error('Server 500 error on second image')
        }
        return `https://cdn.souqone.app/${img.uri.replace(/\W/g, '_')}.jpg`
      }),
    })

    const { result } = await renderHook(() =>
      useWizardImageReconciliation({ adapter })
    )

    // First attempt: first succeeds, second fails, third succeeds
    await act(async () => {
      await result.current.reconcile({
        localImages: [
          { uri: 'file:///first.jpg' },
          { uri: 'file:///second.jpg' },
          { uri: 'file:///third.jpg' },
        ],
        listingSaved: true,
      })
    })

    expect(result.current.imagesComplete).toBe(false)
    expect(result.current.isPartialSuccess).toBe(true)
    expect(uploadCalls).toEqual([
      'file:///first.jpg',
      'file:///second.jpg',
      'file:///third.jpg',
    ])
    expect(result.current.uploadedUrls.length).toBe(2)

    // Now fix network condition and retry
    shouldFail = false
    uploadCalls.length = 0 // Clear call tracker

    let retryRes: any
    await act(async () => {
      retryRes = await result.current.retryFailed()
    })

    // INVARIANT: Only the failed image ('file:///second.jpg') is uploaded on retry!
    expect(uploadCalls).toEqual(['file:///second.jpg'])
    expect(retryRes.imagesComplete).toBe(true)
    expect(retryRes.isPartialSuccess).toBe(false)
    expect(retryRes.failedOperations).toEqual([])
    expect(retryRes.uploadedUrls.length).toBe(3)

    expect(result.current.imagesComplete).toBe(true)
    expect(result.current.isPartialSuccess).toBe(false)
  })

  it('4. Deduplication: marks removed image IDs and deduplicates them', async () => {
    const adapter = createMockAdapter()
    const { result } = await renderHook(() =>
      useWizardImageReconciliation({ adapter })
    )

    await act(async () => {
      result.current.markImageRemoved('img_duplicate')
      result.current.markImageRemoved('img_other')
      result.current.markImageRemoved('img_duplicate')
      result.current.markImageRemoved('   img_other   ')
    })

    expect(result.current.ledger.removedImageIds).toEqual(['img_duplicate', 'img_other'])

    await act(async () => {
      await result.current.reconcile({
        removedImageIds: ['img_third', 'img_duplicate', 'img_third'],
      })
    })

    expect(result.current.ledger.removedImageIds).toEqual([
      'img_duplicate',
      'img_other',
      'img_third',
    ])
  })

  it('5. Idempotent re-run: re-running with completed state makes 0 redundant calls', async () => {
    const adapter = createMockAdapter()
    const { result } = await renderHook(() =>
      useWizardImageReconciliation({ adapter })
    )

    await act(async () => {
      await result.current.reconcile({
        localImages: [{ uri: 'file:///photo.jpg' }],
        listingSaved: true,
      })
    })

    expect(adapter.uploadImage).toHaveBeenCalledTimes(1)

    // Re-run with identical parameters
    let secondRes: any
    await act(async () => {
      secondRes = await result.current.reconcile({
        localImages: [{ uri: 'file:///photo.jpg' }],
        listingSaved: true,
      })
    })

    // 0 additional upload calls
    expect(adapter.uploadImage).toHaveBeenCalledTimes(1)
    expect(secondRes.imagesComplete).toBe(true)
  })

  it('6. Edit mode: attaches uploaded images and deletes removed images', async () => {
    const adapter = createMockAdapter()
    const { result } = await renderHook(() =>
      useWizardImageReconciliation({ adapter })
    )

    await act(async () => {
      await result.current.reconcile({
        listingId: 'part_500',
        isEditMode: true,
        localImages: [{ uri: 'file:///new_part.jpg', isPrimary: true }],
        removedImageIds: ['old_img_1', 'old_img_2'],
        listingSaved: true,
      })
    })

    expect(adapter.uploadCalls.length).toBe(1)
    expect(adapter.attachCalls.length).toBe(1)
    expect(adapter.attachCalls[0].listingId).toBe('part_500')
    expect(adapter.attachCalls[0].isPrimary).toBe(true)

    expect(adapter.deleteCalls.length).toBe(2)
    expect(adapter.deleteCalls.map((c) => c.imageId)).toEqual(['old_img_1', 'old_img_2'])
    expect(result.current.imagesComplete).toBe(true)
  })

  it('7. Edit mode failure: failed attach is recorded and retried without re-upload', async () => {
    let failAttach = true
    const adapter = createMockAdapter({
      attachImageUrl: jest.fn(async () => {
        if (failAttach) throw new Error('Attach 429 rate limit')
        return { success: true }
      }),
    })

    const { result } = await renderHook(() =>
      useWizardImageReconciliation({ adapter })
    )

    await act(async () => {
      await result.current.reconcile({
        listingId: 'part_501',
        isEditMode: true,
        localImages: [{ uri: 'file:///part.jpg' }],
        listingSaved: true,
      })
    })

    expect(adapter.uploadCalls.length).toBe(1)
    expect(result.current.imagesComplete).toBe(false)
    expect(result.current.failedOperations.some((op) => op.type === 'attach')).toBe(true)

    // Now succeed attach on retry
    failAttach = false
    await act(async () => {
      await result.current.retryFailed()
    })

    // Upload call count is STILL 1 (re-upload was skipped)
    expect(adapter.uploadCalls.length).toBe(1)
    expect(result.current.imagesComplete).toBe(true)
  })

  it('8. Cancellation: cancel() aborts in-flight operations safely', async () => {
    let abortObserved = false
    const adapter = createMockAdapter({
      uploadImage: jest.fn(async (_img, signal) => {
        return new Promise<string>((resolve, reject) => {
          if (signal?.aborted) {
            abortObserved = true
            reject(new Error('Aborted'))
            return
          }
          signal?.addEventListener('abort', () => {
            abortObserved = true
            reject(new Error('Aborted'))
          })
        })
      }),
    })

    const { result } = await renderHook(() =>
      useWizardImageReconciliation({ adapter })
    )

    await act(async () => {
      const reconcilePromise = result.current.reconcile({
        localImages: [{ uri: 'file:///in_flight.jpg' }],
      })
      result.current.cancel()
      await reconcilePromise
    })

    expect(abortObserved).toBe(true)
    expect(result.current.isReconciling).toBe(false)
  })

  it('9. Initial ledger hydration: hydrates persisted state cleanly', async () => {
    const existingLedger = createEmptyLedger('part_hydrated')
    existingLedger.listingSaved = true
    existingLedger.uploadedImages.push({
      localUri: 'file:///prev.jpg',
      remoteUrl: 'https://cdn/prev.jpg',
      uploadedAt: 1000,
    })

    const adapter = createMockAdapter()
    const { result } = await renderHook(() =>
      useWizardImageReconciliation({
        adapter,
        initialLedger: existingLedger,
      })
    )

    expect(result.current.listingSaved).toBe(true)
    expect(result.current.uploadedUrls).toEqual(['https://cdn/prev.jpg'])
    expect(result.current.ledger.listingId).toBe('part_hydrated')
  })

  it('10. Delete idempotency: treats 404 error as successful deletion (A-053 P1)', async () => {
    const error404: any = new Error('Image not found')
    error404.response = { status: 404 }

    const adapter = createMockAdapter({
      deleteImage: jest.fn().mockRejectedValueOnce(error404),
    })

    const { result } = await renderHook(() =>
      useWizardImageReconciliation({ adapter })
    )

    let res: any
    await act(async () => {
      res = await result.current.reconcile({
        listingId: 'part_404',
        isEditMode: true,
        removedImageIds: ['img_already_gone'],
        listingSaved: true,
      })
    })

    expect(adapter.deleteImage).toHaveBeenCalledWith('img_already_gone', 'part_404', expect.any(Object))
    // 404 must be treated as successful deletion (idempotent retry)
    expect(res.ledger.deletedImageIds).toContain('img_already_gone')
    expect(res.imagesComplete).toBe(true)
    expect(res.failedOperations.length).toBe(0)
  })

  it('11. Existing images: populates retainedImageIds excluding removedImageIds (A-053 P1)', async () => {
    const adapter = createMockAdapter()
    const { result } = await renderHook(() =>
      useWizardImageReconciliation({ adapter })
    )

    let res: any
    await act(async () => {
      res = await result.current.reconcile({
        listingId: 'part_existing',
        isEditMode: true,
        existingImages: [
          { id: 'img_keep_1', url: 'https://cdn/keep1.jpg' },
          { id: 'img_keep_2', url: 'https://cdn/keep2.jpg' },
          { id: 'img_to_remove', url: 'https://cdn/remove.jpg' },
        ],
        removedImageIds: ['img_to_remove'],
        listingSaved: true,
      })
    })

    expect(res.ledger.retainedImageIds).toEqual(['img_keep_1', 'img_keep_2'])
    expect(res.ledger.removedImageIds).toContain('img_to_remove')
  })

  it('12. Concurrent reconcile: joins active in-flight promise and awaits truthful result (A-053 P2)', async () => {
    let finishUpload: (url: string) => void = () => {}
    const uploadPromise = new Promise<string>((resolve) => {
      finishUpload = resolve
    })

    const adapter = createMockAdapter({
      uploadImage: jest.fn().mockReturnValue(uploadPromise),
    })

    const { result } = await renderHook(() =>
      useWizardImageReconciliation({ adapter })
    )

    let res1Promise: any
    let res2Promise: any

    await act(async () => {
      res1Promise = result.current.reconcile({
        localImages: [{ uri: 'file:///concurrent.jpg' }],
      })
      // Second call while first is in-flight: must return the active promise
      res2Promise = result.current.reconcile({
        localImages: [{ uri: 'file:///concurrent.jpg' }],
      })

      // Finish upload
      finishUpload('https://cdn/concurrent_done.jpg')
    })

    const [res1, res2] = await Promise.all([res1Promise, res2Promise])
    expect(res1.imagesComplete).toBe(true)
    expect(res2.imagesComplete).toBe(true)
    expect(res2.uploadedUrls).toEqual(['https://cdn/concurrent_done.jpg'])
    expect(adapter.uploadImage).toHaveBeenCalledTimes(1)
  })

  it('13. Precheck fail-closed (A-057 P1-a): when fetchAttachedUrls fails, attach loop is skipped to avoid duplicates', async () => {
    const adapter = createMockAdapter({
      fetchAttachedUrls: jest.fn().mockRejectedValue(new Error('500 Internal Server Error')),
      uploadImage: jest.fn().mockResolvedValue('https://cdn.souqone.app/part_new.jpg'),
      attachImageUrl: jest.fn(),
    })

    const { result } = await renderHook(() =>
      useWizardImageReconciliation({ adapter })
    )

    let res: any
    await act(async () => {
      res = await result.current.reconcile({
        listingId: 'edit-part-100',
        isEditMode: true,
        localImages: [{ uri: 'file:///part_new.jpg' }],
        listingSaved: true,
      })
    })

    expect(adapter.uploadImage).toHaveBeenCalledTimes(1)
    // TEETH: attachImageUrl must NOT be called when precheck fails!
    expect(adapter.attachImageUrl).toHaveBeenCalledTimes(0)
    expect(res.imagesComplete).toBe(false)
    expect(res.isPartialSuccess).toBe(true)
    const precheckOp = res.failedOperations.find((op: any) => op.type === 'attach')
    expect(precheckOp?.error).toContain('تعذر التحقق من صور الإعلان على الخادم')
  })

  it('14. Precheck URL normalization (A-057 P2-a): matches signed server URLs with local uploaded records', async () => {
    const adapter = createMockAdapter({
      fetchAttachedUrls: jest
        .fn()
        .mockResolvedValue(['HTTPS://CDN.SOUQONE.APP/Uploads/Part1.jpg?token=secret123&v=99']),
      uploadImage: jest.fn().mockResolvedValue('https://cdn.souqone.app/Uploads/Part1.jpg'),
      attachImageUrl: jest.fn(),
    })

    const { result } = await renderHook(() =>
      useWizardImageReconciliation({ adapter })
    )

    let res: any
    await act(async () => {
      res = await result.current.reconcile({
        listingId: 'edit-part-200',
        isEditMode: true,
        localImages: [{ uri: 'file:///Part1.jpg' }],
        listingSaved: true,
      })
    })

    expect(adapter.uploadImage).toHaveBeenCalledTimes(1)
    // TEETH: Normalized URLs match -> attach is NOT called because server already has it!
    expect(adapter.attachImageUrl).toHaveBeenCalledTimes(0)
    expect(res.imagesComplete).toBe(true)
  })

  it('15. Cancel clears activePromise and permits subsequent run with run-token isolation (A-057 P2-c)', async () => {
    let cancelUploadResolve: (url: string) => void = () => {}
    let callCount = 0

    const adapter = createMockAdapter({
      uploadImage: jest.fn(async (_img, signal) => {
        callCount++
        if (callCount === 1) {
          return new Promise<string>((resolve, reject) => {
            signal?.addEventListener('abort', () => reject(new Error('AbortError')))
          })
        }
        return 'https://cdn.souqone.app/run2_done.jpg'
      }),
    })

    const { result } = await renderHook(() =>
      useWizardImageReconciliation({ adapter })
    )

    let res1Promise: any
    await act(async () => {
      res1Promise = result.current.reconcile({
        localImages: [{ uri: 'file:///retry_target.jpg' }],
      })
      // Cancel run 1
      result.current.cancel()
    })

    const res1 = await res1Promise
    expect(res1.imagesComplete).toBe(false)
    expect(result.current.isReconciling).toBe(false)

    // Now start run 2 for the target: should run immediately, succeed, and clear prior aborted failure
    let res2: any
    await act(async () => {
      res2 = await result.current.reconcile({
        localImages: [{ uri: 'file:///retry_target.jpg' }],
      })
    })

    expect(res2.imagesComplete).toBe(true)
    expect(res2.uploadedUrls).toContain('https://cdn.souqone.app/run2_done.jpg')
  })

  it('16. Cancelled reconciliation returns imagesComplete: false (A-057 P2-d)', async () => {
    const adapter = createMockAdapter({
      uploadImage: jest.fn(async (_img, signal) => {
        return new Promise<string>((_, reject) => {
          signal?.addEventListener('abort', () => reject(new Error('AbortError')))
        })
      }),
    })

    const { result } = await renderHook(() =>
      useWizardImageReconciliation({ adapter })
    )

    let reconcileRes: any
    await act(async () => {
      const p = result.current.reconcile({
        localImages: [{ uri: 'file:///test_cancel.jpg' }],
      })
      result.current.cancel()
      reconcileRes = await p
    })

    // TEETH: imagesComplete must be false on cancel!
    expect(reconcileRes.imagesComplete).toBe(false)
  })

  it('17. Precheck recovery (A-060 P2): precheck failure on run 1 is cleared when run 2 succeeds with empty server list', async () => {
    let precheckCallCount = 0
    const adapter = createMockAdapter({
      fetchAttachedUrls: jest.fn(async () => {
        precheckCallCount++
        if (precheckCallCount === 1) {
          throw new Error('Network timeout during precheck')
        }
        return [] // server has no images currently
      }),
      uploadImage: jest.fn().mockResolvedValue('https://cdn.souqone.app/uploads/p1.jpg'),
      attachImageUrl: jest.fn().mockResolvedValue(undefined),
    })

    const { result } = await renderHook(() =>
      useWizardImageReconciliation({ adapter })
    )

    let res1: any
    await act(async () => {
      res1 = await result.current.reconcile({
        listingId: 'part-precheck-recovery',
        isEditMode: true,
        localImages: [{ uri: 'file:///p1.jpg' }],
        listingSaved: true,
      })
    })

    // Run 1: precheck failed, attach was blocked, failure is recorded
    expect(res1.imagesComplete).toBe(false)
    expect(res1.failedOperations.some((op: any) => op.key === 'attach:server_precheck')).toBe(true)
    expect(adapter.attachImageUrl).toHaveBeenCalledTimes(0)

    // Run 2: retry succeeds with empty server list -> attach:server_precheck is cleared and attachImageUrl succeeds
    let res2: any
    await act(async () => {
      res2 = await result.current.retryFailed()
    })

    expect(res2.imagesComplete).toBe(true)
    expect(res2.failedOperations.length).toBe(0)
    expect(adapter.attachImageUrl).toHaveBeenCalledTimes(1)
  })

  it('18. Cancel and reset during in-flight upload invalidates active run token (A-060 P2)', async () => {
    let slowResolve: (val: string) => void = () => {}
    const adapter = createMockAdapter({
      uploadImage: jest.fn(async () => {
        return new Promise<string>((resolve) => {
          slowResolve = resolve
        })
      }),
    })

    const { result } = await renderHook(() =>
      useWizardImageReconciliation({ adapter })
    )

    let run1Promise: any
    await act(async () => {
      run1Promise = result.current.reconcile({
        listingId: 'part-reset-test',
        localImages: [{ uri: 'file:///slow.jpg' }],
      })
      // Reset immediately while in flight
      result.current.reset()
    })

    // Ledger should now be completely empty
    expect(result.current.ledger.uploadedImages).toEqual([])
    expect(result.current.ledger.listingId).toBeUndefined()

    // Now resolve the old lingering promise
    await act(async () => {
      slowResolve('https://cdn.souqone.app/uploads/stale.jpg')
      await run1Promise
    })

    // TEETH: Settling old promise must NOT commit stale workingLedger back to state!
    expect(result.current.ledger.uploadedImages).toEqual([])
    expect(result.current.ledger.listingId).toBeUndefined()
  })

  it('19. ABA race protection (A-062 P2-1): cancelling run 1 and immediately starting run 2 prevents run 1 settlement from clearing run 2 state or committing stale ledger', async () => {
    let callIndex = 0
    let resolveRun1Upload: (val: string) => void = () => {}
    let resolveRun2Upload: (val: string) => void = () => {}

    const adapter = createMockAdapter({
      uploadImage: jest.fn(async () => {
        callIndex++
        if (callIndex === 1) {
          return new Promise<string>((resolve) => {
            resolveRun1Upload = resolve
          })
        }
        return new Promise<string>((resolve) => {
          resolveRun2Upload = resolve
        })
      }),
    })

    const { result } = await renderHook(() =>
      useWizardImageReconciliation({ adapter })
    )

    let run1Promise: Promise<any>
    let run2Promise: Promise<any>

    await act(async () => {
      run1Promise = result.current.reconcile({
        listingId: 'part-aba-test',
        localImages: [{ uri: 'file:///run1-stale.jpg' }],
      })
      // Cancel run 1 (monotonic increment avoids resetting token back to 0)
      result.current.cancel()
      // Immediately start run 2 while run 1 promise is still pending
      run2Promise = result.current.reconcile({
        listingId: 'part-aba-test',
        localImages: [{ uri: 'file:///run2-fresh.jpg' }],
      })
    })

    expect(result.current.isReconciling).toBe(true)

    // Settle run 1 BEFORE run 2
    await act(async () => {
      resolveRun1Upload('https://cdn.souqone.app/uploads/run1-stale.jpg')
      const res1 = await run1Promise!
      expect(res1.imagesComplete).toBe(false)
    })

    // TEETH: run 1's finally must NOT clear run 2's active isReconciling state or commit stale run 1 image!
    expect(result.current.isReconciling).toBe(true)
    expect(result.current.ledger.uploadedImages).toEqual([])

    // Now settle run 2
    let res2: any
    await act(async () => {
      resolveRun2Upload('https://cdn.souqone.app/uploads/run2-fresh.jpg')
      res2 = await run2Promise!
    })

    expect(result.current.isReconciling).toBe(false)
    expect(res2.imagesComplete).toBe(true)
    expect(result.current.ledger.uploadedImages).toHaveLength(1)
    expect(result.current.ledger.uploadedImages[0].remoteUrl).toBe('https://cdn.souqone.app/uploads/run2-fresh.jpg')
  })
})
