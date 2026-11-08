/**
 * useWizardImageReconciliation Hook (S6 / D-243)
 *
 * Coordinates durable image operations for multi-step listing wizards:
 * - Separates core listing persistence from image processing (Decision d5).
 * - Tracks local-to-remote URL mappings across attempts so succeeded uploads are never re-run.
 * - Retries ONLY failed operations (uploads, attaches, deletions).
 * - Deduplicates removed image IDs.
 * - Supports cancellation via AbortController and guarantees safe unmount handling.
 * - Completely serializable state for AsyncStorage/Zustand persistence.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  ReconciliationLedger,
  ImageReconciliationAdapter,
  ReconcileParams,
  ReconciliationResult,
  FailedOperation,
  createEmptyLedger,
  dedupeIds,
  appendRemovedImageIds,
  normalizeLocalImage,
  makeOpKey,
  deserializeLedger,
} from '../utils/imageReconciliation'
import { logWarn } from '../utils/safeLog'

export interface UseWizardImageReconciliationOptions {
  adapter: ImageReconciliationAdapter
  initialLedger?: ReconciliationLedger | unknown
  onStateChange?: (ledger: ReconciliationLedger) => void
}

export interface UseWizardImageReconciliationReturn {
  ledger: ReconciliationLedger
  isReconciling: boolean
  listingSaved: boolean
  imagesComplete: boolean
  isPartialSuccess: boolean
  failedOperations: FailedOperation[]
  failedImages: string[]
  uploadedUrls: string[]

  // Action methods
  setListingSaved: (saved: boolean, listingId?: string) => void
  markImageRemoved: (imageId: string) => void
  recordUploadedUrl: (localUri: string, remoteUrl: string, isPrimary?: boolean) => void
  reconcile: (params: ReconcileParams) => Promise<ReconciliationResult>
  retryFailed: (overrideParams?: Partial<ReconcileParams>) => Promise<ReconciliationResult>
  cancel: () => void
  reset: () => void
}

export function useWizardImageReconciliation({
  adapter,
  initialLedger,
  onStateChange,
}: UseWizardImageReconciliationOptions): UseWizardImageReconciliationReturn {
  const [ledger, setLedger] = useState<ReconciliationLedger>(() =>
    initialLedger ? deserializeLedger(initialLedger) : createEmptyLedger()
  )
  const [isReconciling, setIsReconciling] = useState(false)

  const isMountedRef = useRef(true)
  const isReconcilingRef = useRef(false)
  const ledgerRef = useRef<ReconciliationLedger>(ledger)
  const abortControllerRef = useRef<AbortController | null>(null)
  const lastParamsRef = useRef<ReconcileParams | null>(null)
  const onStateChangeRef = useRef(onStateChange)

  // Keep references fresh
  useEffect(() => {
    ledgerRef.current = ledger
  }, [ledger])

  useEffect(() => {
    onStateChangeRef.current = onStateChange
  }, [onStateChange])

  // Lifecycle & unmount safety
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  /**
   * Helper to commit ledger updates both to local React state and external listeners.
   */
  const commitLedger = useCallback((nextLedger: ReconciliationLedger) => {
    ledgerRef.current = nextLedger
    if (isMountedRef.current) {
      setLedger({ ...nextLedger })
    }
    onStateChangeRef.current?.(nextLedger)
  }, [])

  /**
   * Updates core listing persistence status.
   */
  const setListingSaved = useCallback(
    (saved: boolean, listingId?: string) => {
      const current = ledgerRef.current
      const updated: ReconciliationLedger = {
        ...current,
        listingSaved: saved,
        listingId: listingId ?? current.listingId,
      }
      commitLedger(updated)
    },
    [commitLedger]
  )

  /**
   * Marks an existing image ID for removal with automatic deduplication.
   */
  const markImageRemoved = useCallback(
    (imageId: string) => {
      if (!imageId || typeof imageId !== 'string') return
      const trimmed = imageId.trim()
      if (!trimmed) return

      const current = ledgerRef.current
      const nextRemoved = appendRemovedImageIds(current.removedImageIds, [trimmed])
      const nextRetained = current.retainedImageIds.filter((id) => id !== trimmed)

      const updated: ReconciliationLedger = {
        ...current,
        removedImageIds: nextRemoved,
        retainedImageIds: nextRetained,
      }
      commitLedger(updated)
    },
    [commitLedger]
  )

  /**
   * Manually records an already uploaded URL mapping.
   */
  const recordUploadedUrl = useCallback(
    (localUri: string, remoteUrl: string, isPrimary?: boolean) => {
      if (!localUri || !remoteUrl) return
      const current = ledgerRef.current
      const exists = current.uploadedImages.some((rec) => rec.localUri === localUri)
      if (exists) return

      const nextUploaded = [
        ...current.uploadedImages,
        {
          localUri,
          remoteUrl,
          uploadedAt: Date.now(),
          isPrimary: Boolean(isPrimary),
        },
      ]

      const updated: ReconciliationLedger = {
        ...current,
        uploadedImages: nextUploaded,
      }
      commitLedger(updated)
    },
    [commitLedger]
  )

  /**
   * Cancels any active in-flight reconciliation operations.
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    if (isReconcilingRef.current) {
      isReconcilingRef.current = false
      if (isMountedRef.current) {
        setIsReconciling(false)
      }
    }
  }, [])

  /**
   * Resets the reconciliation ledger to an empty initial state.
   */
  const reset = useCallback(() => {
    cancel()
    lastParamsRef.current = null
    const empty = createEmptyLedger()
    commitLedger(empty)
  }, [cancel, commitLedger])

  /**
   * Core reconciliation execution engine.
   */
  const reconcile = useCallback(
    async (params: ReconcileParams): Promise<ReconciliationResult> => {
      if (!isMountedRef.current) {
        return {
          listingSaved: false,
          imagesComplete: false,
          isPartialSuccess: false,
          uploadedUrls: [],
          failedOperations: [],
          ledger: ledgerRef.current,
        }
      }

      // Avoid overlapping executions
      if (isReconcilingRef.current) {
        return {
          listingSaved: ledgerRef.current.listingSaved,
          imagesComplete: Object.keys(ledgerRef.current.failedOperations).length === 0,
          isPartialSuccess:
            ledgerRef.current.listingSaved &&
            Object.keys(ledgerRef.current.failedOperations).length > 0,
          uploadedUrls: ledgerRef.current.uploadedImages.map((rec) => rec.remoteUrl),
          failedOperations: Object.values(ledgerRef.current.failedOperations),
          ledger: ledgerRef.current,
        }
      }

      lastParamsRef.current = { ...params }
      isReconcilingRef.current = true
      if (isMountedRef.current) {
        setIsReconciling(true)
      }

      const controller = new AbortController()
      abortControllerRef.current = controller
      const { signal } = controller

      // Working copy of the ledger
      const current = ledgerRef.current
      const workingLedger: ReconciliationLedger = {
        ...current,
        retainedImageIds: [...current.retainedImageIds],
        removedImageIds: params.removedImageIds
          ? appendRemovedImageIds(current.removedImageIds, params.removedImageIds)
          : [...current.removedImageIds],
        uploadedImages: [...current.uploadedImages],
        attachedUrls: [...current.attachedUrls],
        deletedImageIds: [...current.deletedImageIds],
        failedOperations: { ...current.failedOperations },
        listingSaved:
          params.listingSaved !== undefined
            ? params.listingSaved
            : current.listingSaved,
        listingId: params.listingId ?? current.listingId,
      }

      try {
        // ── 1. Upload Local Images (Retry only failed or not-yet-uploaded) ──
        if (params.localImages && params.localImages.length > 0) {
          for (const rawImg of params.localImages) {
            if (signal.aborted) break

            const norm = normalizeLocalImage(rawImg)
            if (!norm) continue

            const uri = norm.uri
            const isHttp = uri.startsWith('http://') || uri.startsWith('https://')

            // If already remote URL or already uploaded, verify/store mapping and continue
            if (isHttp) {
              const alreadyRecorded = workingLedger.uploadedImages.some(
                (rec) => rec.remoteUrl === uri
              )
              if (!alreadyRecorded) {
                workingLedger.uploadedImages.push({
                  localUri: uri,
                  remoteUrl: uri,
                  uploadedAt: Date.now(),
                  isPrimary: Boolean(norm.isPrimary),
                })
              }
              continue
            }

            const existingRecord = workingLedger.uploadedImages.find(
              (rec) => rec.localUri === uri
            )
            if (existingRecord) {
              // Succeeded in a prior run: do NOT re-upload!
              continue
            }

            // Attempt upload
            const opKey = makeOpKey.upload(uri)
            try {
              const remoteUrl = await adapter.uploadImage(norm, signal)
              if (signal.aborted) break

              workingLedger.uploadedImages.push({
                localUri: uri,
                remoteUrl,
                uploadedAt: Date.now(),
                isPrimary: Boolean(norm.isPrimary),
              })

              // Success clears prior failure record
              delete workingLedger.failedOperations[opKey]
            } catch (err: any) {
              if (signal.aborted) break
              logWarn('useWizardImageReconciliation:upload', err)

              const priorAttempts = workingLedger.failedOperations[opKey]?.attempts || 0
              workingLedger.failedOperations[opKey] = {
                key: opKey,
                type: 'upload',
                error: err?.message || 'فشل رفع الصورة',
                attempts: priorAttempts + 1,
                lastAttemptAt: Date.now(),
                meta: { localUri: uri, isPrimary: Boolean(norm.isPrimary) },
              }
            }
          }
        }

        // ── 2. Attach Uploaded URLs (Edit Mode or Vertical-Specific URL Attach) ──
        if (
          params.isEditMode &&
          workingLedger.listingId &&
          typeof adapter.attachImageUrl === 'function' &&
          !signal.aborted
        ) {
          const listingId = workingLedger.listingId

          // Find newly uploaded URLs that haven't been attached yet
          const unattachedRecords = workingLedger.uploadedImages.filter(
            (rec) => !workingLedger.attachedUrls.includes(rec.remoteUrl)
          )

          for (const rec of unattachedRecords) {
            if (signal.aborted) break
            const opKey = makeOpKey.attach(rec.remoteUrl)

            try {
              await adapter.attachImageUrl(
                listingId,
                rec.remoteUrl,
                rec.isPrimary,
                signal
              )
              if (signal.aborted) break

              workingLedger.attachedUrls.push(rec.remoteUrl)
              delete workingLedger.failedOperations[opKey]
            } catch (err: any) {
              if (signal.aborted) break
              logWarn('useWizardImageReconciliation:attach', err)

              const priorAttempts = workingLedger.failedOperations[opKey]?.attempts || 0
              workingLedger.failedOperations[opKey] = {
                key: opKey,
                type: 'attach',
                error: err?.message || 'فشل ربط الصورة بالإعلان',
                attempts: priorAttempts + 1,
                lastAttemptAt: Date.now(),
                meta: { remoteUrl: rec.remoteUrl, listingId, isPrimary: rec.isPrimary },
              }
            }
          }
        }

        // ── 3. Delete Removed Images (Edit Mode) ──
        if (
          params.isEditMode &&
          typeof adapter.deleteImage === 'function' &&
          !signal.aborted
        ) {
          const pendingDeletes = workingLedger.removedImageIds.filter(
            (id) => !workingLedger.deletedImageIds.includes(id)
          )

          for (const imageId of pendingDeletes) {
            if (signal.aborted) break
            const opKey = makeOpKey.delete(imageId)

            try {
              await adapter.deleteImage(imageId, workingLedger.listingId, signal)
              if (signal.aborted) break

              workingLedger.deletedImageIds.push(imageId)
              delete workingLedger.failedOperations[opKey]
            } catch (err: any) {
              if (signal.aborted) break
              logWarn('useWizardImageReconciliation:delete', err)

              const priorAttempts = workingLedger.failedOperations[opKey]?.attempts || 0
              workingLedger.failedOperations[opKey] = {
                key: opKey,
                type: 'delete',
                error: err?.message || 'فشل حذف الصورة من الخادم',
                attempts: priorAttempts + 1,
                lastAttemptAt: Date.now(),
                meta: { imageId, listingId: workingLedger.listingId },
              }
            }
          }
        }
      } finally {
        isReconcilingRef.current = false
        abortControllerRef.current = null

        if (isMountedRef.current) {
          setIsReconciling(false)
          commitLedger(workingLedger)
        }
      }

      const failedList = Object.values(workingLedger.failedOperations)
      const hasFailures = failedList.length > 0
      const imagesComplete = !hasFailures
      const isPartialSuccess = Boolean(workingLedger.listingSaved && !imagesComplete)
      const uploadedUrls = workingLedger.uploadedImages.map((rec) => rec.remoteUrl)

      return {
        listingSaved: workingLedger.listingSaved,
        imagesComplete,
        isPartialSuccess,
        uploadedUrls,
        failedOperations: failedList,
        ledger: workingLedger,
      }
    },
    [adapter, commitLedger]
  )

  /**
   * Retries only the remaining failed operations using last known parameters.
   */
  const retryFailed = useCallback(
    async (overrideParams?: Partial<ReconcileParams>): Promise<ReconciliationResult> => {
      const baseParams = lastParamsRef.current || {}
      const mergedParams: ReconcileParams = {
        ...baseParams,
        ...overrideParams,
      }
      return reconcile(mergedParams)
    },
    [reconcile]
  )

  // Memoized derived properties
  const failedOperations = useMemo(
    () => Object.values(ledger.failedOperations),
    [ledger.failedOperations]
  )

  const failedImages = useMemo(() => {
    return Object.values(ledger.failedOperations)
      .filter((op) => op.type === 'upload')
      .map((op) => (op.meta?.localUri as string) || op.key.replace(/^upload:/, ''))
  }, [ledger.failedOperations])

  const uploadedUrls = useMemo(
    () => ledger.uploadedImages.map((rec) => rec.remoteUrl),
    [ledger.uploadedImages]
  )

  const hasFailures = failedOperations.length > 0
  const imagesComplete = !hasFailures
  const isPartialSuccess = Boolean(ledger.listingSaved && !imagesComplete)

  return {
    ledger,
    isReconciling,
    listingSaved: ledger.listingSaved,
    imagesComplete,
    isPartialSuccess,
    failedOperations,
    failedImages,
    uploadedUrls,

    setListingSaved,
    markImageRemoved,
    recordUploadedUrl,
    reconcile,
    retryFailed,
    cancel,
    reset,
  }
}
