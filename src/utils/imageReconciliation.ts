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
import { partsApi } from '../api/parts'
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
  fetchAttachedUrls?: (
    listingId: string,
    signal?: AbortSignal
  ) => Promise<string[]>
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
 * Maximum array items and string lengths to prevent storage overflow.
 */
export const LEDGER_LIMITS = {
  maxItems: 20,
  maxUriLength: 300,
  maxErrorLength: 100,
  maxListingIdLength: 100,
}

/**
 * Sanitizes an error message before recording in the ledger to avoid
 * persisting device paths, internal IP addresses, or signed URL queries.
 */
export function sanitizeErrorMessage(err: unknown, fallback = 'Operation failed'): string {
  if (!err) return fallback
  const rawMsg =
    typeof err === 'string'
      ? err
      : typeof (err as any)?.message === 'string'
      ? (err as any).message
      : fallback

  const stripped = rawMsg
    .replace(/https?:\/\/[^\s?]+/g, '[URL]')
    .replace(/\?[^\s]*/g, '')
    .replace(/file:\/\/[^\s]+/g, '[PATH]')
    .replace(/[A-Za-z]:\\[^\s]+/g, '[PATH]')
    .replace(/\/Users\/[^\s]+/g, '[PATH]')
    .trim()

  return (stripped || fallback).slice(0, LEDGER_LIMITS.maxErrorLength)
}

/**
 * Canonical URL normalization for safe comparison and deduplication:
 * - Strips query parameters (?...) and hash fragments (#...)
 * - Strips trailing slashes
 * - Normalizes protocol (https/http) and lowercases hostname
 * - Preserves path case and contents
 */
export function normalizeImageUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return ''
  const trimmed = rawUrl.trim()
  if (!trimmed) return ''

  try {
    if (/^https?:\/\//i.test(trimmed)) {
      const parsed = new URL(trimmed)
      const protocol = parsed.protocol.toLowerCase()
      const host = parsed.host.toLowerCase()
      const pathname = parsed.pathname.replace(/\/+$/, '')
      return `${protocol}//${host}${pathname}`
    }
  } catch {
    // URL parsing fallback for non-standard or malformed URLs
  }

  let clean = trimmed.split('?')[0].split('#')[0]
  clean = clean.replace(/\/+$/, '')
  clean = clean.replace(/^(https?:\/\/[^\/]+)/i, (m) => m.toLowerCase())
  return clean
}

/**
 * Generates deterministic keys for operations.
 */
export const makeOpKey = {
  upload: (uri: string) => `upload:${uri.trim().slice(0, LEDGER_LIMITS.maxUriLength)}`,
  attach: (url: string) => `attach:${(normalizeImageUrl(url) || url.trim()).slice(0, LEDGER_LIMITS.maxUriLength)}`,
  delete: (id: string) => `delete:${id.trim().slice(0, LEDGER_LIMITS.maxListingIdLength)}`,
}

const VALID_OPERATION_TYPES: Set<string> = new Set(['upload', 'attach', 'delete'])

/**
 * Safely serializes a reconciliation ledger into a JSON string.
 * Strips non-serializable properties, bounds arrays, sanitizes strings, and enforces byte cap.
 */
export function serializeLedger(ledger: ReconciliationLedger): string {
  try {
    const cleanLedger: ReconciliationLedger = {
      version: 1,
      listingId: ledger.listingId
        ? String(ledger.listingId).slice(0, LEDGER_LIMITS.maxListingIdLength)
        : undefined,
      retainedImageIds: dedupeIds(ledger.retainedImageIds).slice(0, LEDGER_LIMITS.maxItems),
      removedImageIds: dedupeIds(ledger.removedImageIds).slice(0, LEDGER_LIMITS.maxItems),
      uploadedImages: Array.isArray(ledger.uploadedImages)
        ? ledger.uploadedImages.slice(0, LEDGER_LIMITS.maxItems).map((rec) => ({
            localUri: String(rec.localUri).slice(0, LEDGER_LIMITS.maxUriLength),
            remoteUrl: normalizeImageUrl(String(rec.remoteUrl)).slice(0, LEDGER_LIMITS.maxUriLength) || String(rec.remoteUrl).slice(0, LEDGER_LIMITS.maxUriLength),
            uploadedAt: Number(rec.uploadedAt) || Date.now(),
            isPrimary: Boolean(rec.isPrimary),
          }))
        : [],
      attachedUrls: dedupeIds(
        (Array.isArray(ledger.attachedUrls) ? ledger.attachedUrls : [])
          .map((u) => normalizeImageUrl(u) || String(u).trim())
          .filter(Boolean)
      ).slice(0, LEDGER_LIMITS.maxItems),
      deletedImageIds: dedupeIds(ledger.deletedImageIds).slice(0, LEDGER_LIMITS.maxItems),
      failedOperations:
        ledger.failedOperations && typeof ledger.failedOperations === 'object'
          ? Object.fromEntries(
              Object.entries(ledger.failedOperations)
                .slice(0, LEDGER_LIMITS.maxItems)
                .filter(([_, op]) => op && typeof op === 'object' && VALID_OPERATION_TYPES.has(op.type))
                .map(([k, op]) => [
                  k,
                  {
                    key: String(op.key).slice(0, LEDGER_LIMITS.maxUriLength),
                    type: op.type,
                    error: sanitizeErrorMessage(op.error),
                    attempts: Math.min(Math.max(Number(op.attempts) || 1, 1), 10),
                    lastAttemptAt: Number(op.lastAttemptAt) || Date.now(),
                    meta:
                      op.meta && typeof op.meta === 'object'
                        ? (() => {
                            const safeMeta: Record<string, unknown> = {}
                            if (typeof op.meta.localUri === 'string') {
                              safeMeta.localUri = op.meta.localUri.slice(0, LEDGER_LIMITS.maxUriLength)
                            }
                            if (typeof op.meta.remoteUrl === 'string') {
                              safeMeta.remoteUrl = (normalizeImageUrl(op.meta.remoteUrl) || op.meta.remoteUrl).slice(
                                0,
                                LEDGER_LIMITS.maxUriLength
                              )
                            }
                            if (typeof op.meta.imageId === 'string') {
                              safeMeta.imageId = String(op.meta.imageId).slice(0, LEDGER_LIMITS.maxListingIdLength)
                            }
                            if (typeof op.meta.listingId === 'string') {
                              safeMeta.listingId = String(op.meta.listingId).slice(0, LEDGER_LIMITS.maxListingIdLength)
                            }
                            if (typeof op.meta.isPrimary === 'boolean') {
                              safeMeta.isPrimary = op.meta.isPrimary
                            }
                            return safeMeta
                          })()
                        : undefined,
                  },
                ])
            )
          : {},
      listingSaved: Boolean(ledger.listingSaved),
    }

    const serialized = JSON.stringify(cleanLedger)
    if (serialized.length > 50000) {
      logWarn('imageReconciliation:serializeLedger:byteLimitExceeded', { length: serialized.length })
      return JSON.stringify(createEmptyLedger())
    }
    return serialized
  } catch (err) {
    logWarn('imageReconciliation:serializeLedger', err)
    return JSON.stringify(createEmptyLedger())
  }
}

/**
 * Safely parses and deserializes a reconciliation ledger with robust fallback defaults.
 * Strictly validates version: 1 and bounds arrays.
 */
export function deserializeLedger(raw: unknown): ReconciliationLedger {
  const fallback = createEmptyLedger()
  if (!raw) return fallback

  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!obj || typeof obj !== 'object') return fallback

    // Reject unknown or unsupported ledger versions (A-053 P2)
    if (obj.version !== 1) {
      logWarn('imageReconciliation:deserializeLedger:unknownVersion', { version: obj.version })
      return fallback
    }

    return {
      version: 1,
      listingId:
        typeof obj.listingId === 'string'
          ? obj.listingId.slice(0, LEDGER_LIMITS.maxListingIdLength)
          : undefined,
      retainedImageIds: dedupeIds(obj.retainedImageIds).slice(0, LEDGER_LIMITS.maxItems),
      removedImageIds: dedupeIds(obj.removedImageIds).slice(0, LEDGER_LIMITS.maxItems),
      uploadedImages: Array.isArray(obj.uploadedImages)
        ? obj.uploadedImages
            .slice(0, LEDGER_LIMITS.maxItems)
            .filter((rec: any) => rec && typeof rec.localUri === 'string' && typeof rec.remoteUrl === 'string')
            .map((rec: any) => ({
              localUri: String(rec.localUri).slice(0, LEDGER_LIMITS.maxUriLength),
              remoteUrl: (normalizeImageUrl(String(rec.remoteUrl)) || String(rec.remoteUrl)).slice(
                0,
                LEDGER_LIMITS.maxUriLength
              ),
              uploadedAt: Number(rec.uploadedAt) || Date.now(),
              isPrimary: Boolean(rec.isPrimary),
            }))
        : [],
      attachedUrls: dedupeIds(
        (Array.isArray(obj.attachedUrls) ? obj.attachedUrls : [])
          .map((u: any) => normalizeImageUrl(String(u)) || String(u).trim())
          .filter(Boolean)
      ).slice(0, LEDGER_LIMITS.maxItems),
      deletedImageIds: dedupeIds(obj.deletedImageIds).slice(0, LEDGER_LIMITS.maxItems),
      failedOperations:
        obj.failedOperations && typeof obj.failedOperations === 'object'
          ? Object.fromEntries(
              Object.entries(obj.failedOperations)
                .slice(0, LEDGER_LIMITS.maxItems)
                .filter(
                  ([_, op]: [string, any]) =>
                    op && typeof op === 'object' && op.key && VALID_OPERATION_TYPES.has(op.type)
                )
                .map(([k, op]: [string, any]) => [
                  k,
                  {
                    key: String(op.key).slice(0, LEDGER_LIMITS.maxUriLength),
                    type: op.type,
                    error: sanitizeErrorMessage(op.error),
                    attempts: Math.min(Math.max(Number(op.attempts) || 1, 1), 10),
                    lastAttemptAt: Number(op.lastAttemptAt) || Date.now(),
                    meta:
                      op.meta && typeof op.meta === 'object'
                        ? (() => {
                            const safeMeta: Record<string, unknown> = {}
                            if (typeof op.meta.localUri === 'string') {
                              safeMeta.localUri = op.meta.localUri.slice(0, LEDGER_LIMITS.maxUriLength)
                            }
                            if (typeof op.meta.remoteUrl === 'string') {
                              safeMeta.remoteUrl = (
                                normalizeImageUrl(op.meta.remoteUrl) || op.meta.remoteUrl
                              ).slice(0, LEDGER_LIMITS.maxUriLength)
                            }
                            if (typeof op.meta.imageId === 'string') {
                              safeMeta.imageId = String(op.meta.imageId).slice(
                                0,
                                LEDGER_LIMITS.maxListingIdLength
                              )
                            }
                            if (typeof op.meta.listingId === 'string') {
                              safeMeta.listingId = String(op.meta.listingId).slice(
                                0,
                                LEDGER_LIMITS.maxListingIdLength
                              )
                            }
                            if (typeof op.meta.isPrimary === 'boolean') {
                              safeMeta.isPrimary = op.meta.isPrimary
                            }
                            return safeMeta
                          })()
                        : undefined,
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

  uploadImage: async (imageInput, signal) => {
    const filePayload = buildUploadFilePayload(imageInput, 'part')
    if (!filePayload) {
      throw new Error('بيانات الصورة غير صالحة للرفع')
    }

    const data = new FormData()
    data.append('file', filePayload as any)

    const res = await uploadsApi.single(data, signal)
    const url =
      (res?.data as any)?.url ??
      (res?.data as any)?.path ??
      (res as any)?.url

    if (!url || typeof url !== 'string') {
      throw new Error('فشل استلام رابط الصورة من الخادم')
    }

    return url
  },

  attachImageUrl: async (partId, url, isPrimary, signal) => {
    return uploadsApi.addPartImageByUrl(partId, url, isPrimary, signal)
  },

  deleteImage: async (imageId, _listingId, signal) => {
    return uploadsApi.removePartImage(imageId, signal)
  },

  fetchAttachedUrls: async (partId, signal) => {
    try {
      const res = await partsApi.getById(partId, signal ? { signal } : undefined)
      const part = (res?.data as any) ?? res
      const images: any[] = Array.isArray(part?.images) ? part.images : []
      return images
        .map((img) => (typeof img === 'string' ? img : img?.url))
        .filter((u): u is string => typeof u === 'string' && u.length > 0)
    } catch (err: any) {
      const status = err?.response?.status ?? err?.status
      if (status === 404) {
        return []
      }
      throw err
    }
  },
}
