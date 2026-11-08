/**
 * Image Reconciliation Intent Model & Vertical Adapters (S6 / D-243)
 *
 * Implements a durable, serializable ledger tracking:
 * 1. Retained image IDs
 * 2. Removed image IDs (append + dedupe)
 * 3. Uploaded remote URLs (reusable across retries)
 * 4. Attached URLs & deleted image IDs (idempotency tracking)
 * 5. Failed operations keyed by deterministic operation key
 *
 * Designed to separate core listing creation/update from image lifecycle (Decision d5),
 * ensuring failed image operations can be retried without re-uploading succeeded images
 * or losing the saved listing.
 */

import { buildUploadFilePayload } from './fileUploadHelper'
import { uploadsApi } from '../api/uploads'
import { logWarn } from './safeLog'

export type OperationType = 'upload' | 'attach' | 'delete'

export interface FailedOperation {
  key: string
  type: OperationType
  error: string
  attempts: number
  lastAttemptAt: number
  meta?: Record<string, unknown>
}

export interface UploadedImageRecord {
  localUri: string
  remoteUrl: string
  uploadedAt: number
  isPrimary?: boolean
}

export interface ReconciliationLedger {
  version: 1
  listingId?: string
  retainedImageIds: string[]
  removedImageIds: string[]
  uploadedImages: UploadedImageRecord[]
  attachedUrls: string[]
  deletedImageIds: string[]
  failedOperations: Record<string, FailedOperation>
  listingSaved: boolean
}

export interface ImageReconciliationAdapter {
  vertical: string
  uploadImage: (
    image: { uri: string; [key: string]: unknown },
    signal?: AbortSignal
  ) => Promise<string>
  attachImageUrl?: (
    listingId: string,
    url: string,
    isPrimary?: boolean,
    signal?: AbortSignal
  ) => Promise<unknown>
  deleteImage?: (
    imageId: string,
    listingId?: string,
    signal?: AbortSignal
  ) => Promise<unknown>
}

export type LocalImageInput =
  | string
  | { uri: string; isPrimary?: boolean }

export type ExistingImageInput =
  | string
  | { id?: string; url?: string; isPrimary?: boolean }

export interface ReconcileParams {
  listingId?: string
  localImages?: LocalImageInput[]
  existingImages?: ExistingImageInput[]
  removedImageIds?: string[]
  listingSaved?: boolean
  isEditMode?: boolean
}

export interface ReconciliationResult {
  listingSaved: boolean
  imagesComplete: boolean
  isPartialSuccess: boolean
  uploadedUrls: string[]
  failedOperations: FailedOperation[]
  ledger: ReconciliationLedger
}

/**
 * Creates a fresh, empty reconciliation ledger.
 */
export function createEmptyLedger(listingId?: string): ReconciliationLedger {
  return {
    version: 1,
    listingId,
    retainedImageIds: [],
    removedImageIds: [],
    uploadedImages: [],
    attachedUrls: [],
    deletedImageIds: [],
    failedOperations: {},
    listingSaved: false,
  }
}

/**
 * Deduplicates an array of string IDs, preserving insertion order.
 * Trims strings and filters out empty or invalid values.
 */
export function dedupeIds(ids: unknown[]): string[] {
  if (!Array.isArray(ids)) return []
  const seen = new Set<string>()
  const result: string[] = []

  for (const item of ids) {
    if (typeof item === 'string') {
      const trimmed = item.trim()
      if (trimmed.length > 0 && !seen.has(trimmed)) {
        seen.add(trimmed)
        result.push(trimmed)
      }
    }
  }

  return result
}

/**
 * Merges new removed IDs into an existing list of removed IDs with deduplication.
 */
export function appendRemovedImageIds(
  currentRemoved: string[],
  newRemoved: string[]
): string[] {
  return dedupeIds([...(currentRemoved || []), ...(newRemoved || [])])
}

/**
 * Normalizes a local image input into a consistent object with a valid URI.
 */
export function normalizeLocalImage(
  input: LocalImageInput
): { uri: string; isPrimary?: boolean; [key: string]: unknown } | null {
  if (!input) return null
  if (typeof input === 'string') {
    const trimmed = input.trim()
    return trimmed.length > 0 ? { uri: trimmed } : null
  }
  if (typeof input === 'object' && typeof input.uri === 'string') {
    const trimmed = input.uri.trim()
    return trimmed.length > 0 ? { ...input, uri: trimmed } : null
  }
  return null
}

/**
 * Normalizes an existing image input into a consistent object.
 */
export function normalizeExistingImage(
  input: ExistingImageInput
): { id?: string; url?: string; isPrimary?: boolean; [key: string]: unknown } | null {
  if (!input) return null
  if (typeof input === 'string') {
    const trimmed = input.trim()
    return trimmed.length > 0 ? { url: trimmed } : null
  }
  if (typeof input === 'object') {
    return { ...input }
  }
  return null
}

/**
 * Generates deterministic keys for operations.
 */
export const makeOpKey = {
  upload: (uri: string) => `upload:${uri.trim()}`,
  attach: (url: string) => `attach:${url.trim()}`,
  delete: (id: string) => `delete:${id.trim()}`,
}

/**
 * Safely serializes a reconciliation ledger into a JSON string.
 * Strips any potential non-serializable properties.
 */
export function serializeLedger(ledger: ReconciliationLedger): string {
  try {
    const cleanLedger: ReconciliationLedger = {
      version: 1,
      listingId: ledger.listingId,
      retainedImageIds: dedupeIds(ledger.retainedImageIds),
      removedImageIds: dedupeIds(ledger.removedImageIds),
      uploadedImages: Array.isArray(ledger.uploadedImages)
        ? ledger.uploadedImages.map((rec) => ({
            localUri: String(rec.localUri),
            remoteUrl: String(rec.remoteUrl),
            uploadedAt: Number(rec.uploadedAt) || Date.now(),
            isPrimary: Boolean(rec.isPrimary),
          }))
        : [],
      attachedUrls: dedupeIds(ledger.attachedUrls),
      deletedImageIds: dedupeIds(ledger.deletedImageIds),
      failedOperations: ledger.failedOperations && typeof ledger.failedOperations === 'object'
        ? Object.fromEntries(
            Object.entries(ledger.failedOperations).map(([k, op]) => [
              k,
              {
                key: String(op.key),
                type: op.type,
                error: String(op.error || 'Error'),
                attempts: Number(op.attempts) || 1,
                lastAttemptAt: Number(op.lastAttemptAt) || Date.now(),
                meta: op.meta && typeof op.meta === 'object' ? { ...op.meta } : undefined,
              },
            ])
          )
        : {},
      listingSaved: Boolean(ledger.listingSaved),
    }
    return JSON.stringify(cleanLedger)
  } catch (err) {
    logWarn('imageReconciliation:serializeLedger', err)
    return JSON.stringify(createEmptyLedger())
  }
}

/**
 * Safely parses and deserializes a reconciliation ledger with robust fallback defaults.
 */
export function deserializeLedger(raw: unknown): ReconciliationLedger {
  const fallback = createEmptyLedger()
  if (!raw) return fallback

  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!obj || typeof obj !== 'object') return fallback

    return {
      version: 1,
      listingId: typeof obj.listingId === 'string' ? obj.listingId : undefined,
      retainedImageIds: dedupeIds(obj.retainedImageIds),
      removedImageIds: dedupeIds(obj.removedImageIds),
      uploadedImages: Array.isArray(obj.uploadedImages)
        ? obj.uploadedImages
            .filter((rec: any) => rec && typeof rec.localUri === 'string' && typeof rec.remoteUrl === 'string')
            .map((rec: any) => ({
              localUri: String(rec.localUri),
              remoteUrl: String(rec.remoteUrl),
              uploadedAt: Number(rec.uploadedAt) || Date.now(),
              isPrimary: Boolean(rec.isPrimary),
            }))
        : [],
      attachedUrls: dedupeIds(obj.attachedUrls),
      deletedImageIds: dedupeIds(obj.deletedImageIds),
      failedOperations:
        obj.failedOperations && typeof obj.failedOperations === 'object'
          ? Object.fromEntries(
              Object.entries(obj.failedOperations)
                .filter(([_, op]: [string, any]) => op && typeof op === 'object' && op.key && op.type)
                .map(([k, op]: [string, any]) => [
                  k,
                  {
                    key: String(op.key),
                    type: op.type,
                    error: String(op.error || 'Error'),
                    attempts: Number(op.attempts) || 1,
                    lastAttemptAt: Number(op.lastAttemptAt) || Date.now(),
                    meta: op.meta && typeof op.meta === 'object' ? op.meta : undefined,
                  },
                ])
            )
          : {},
      listingSaved: Boolean(obj.listingSaved),
    }
  } catch (err) {
    logWarn('imageReconciliation:deserializeLedger', err)
    return fallback
  }
}

/**
 * Reference implementation adapter for Parts (without screen wiring).
 * Uses uploadsApi and buildUploadFilePayload matching backend endpoints.
 */
export const partsImageReconciliationAdapter: ImageReconciliationAdapter = {
  vertical: 'parts',

  uploadImage: async (imageInput, _signal) => {
    const filePayload = buildUploadFilePayload(imageInput, 'part')
    if (!filePayload) {
      throw new Error('بيانات الصورة غير صالحة للرفع')
    }

    const data = new FormData()
    data.append('file', filePayload as any)

    const res = await uploadsApi.single(data)
    const url =
      (res?.data as any)?.url ??
      (res?.data as any)?.path ??
      (res as any)?.url

    if (!url || typeof url !== 'string') {
      throw new Error('فشل استلام رابط الصورة من الخادم')
    }

    return url
  },

  attachImageUrl: async (partId, url, isPrimary, _signal) => {
    return uploadsApi.addPartImageByUrl(partId, url, isPrimary)
  },

  deleteImage: async (imageId, _listingId, _signal) => {
    return uploadsApi.removePartImage(imageId)
  },
}
