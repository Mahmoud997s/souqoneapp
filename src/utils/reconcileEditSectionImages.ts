export interface ReconcileEditSectionImagesParams {
  listingId: string
  newImageUrls: string[]
  existingImages?: Array<{ id?: string; url?: string } | string>
  removedImageIds?: string[]
  attachNew?: (listingId: string, urls: string[]) => Promise<unknown>
  reorderExisting?: (listingId: string, imageIds: string[]) => Promise<unknown>
  removeExisting?: (listingId: string, imageId: string) => Promise<unknown>
}

/**
 * Extracts image IDs from an attachNew API response (array, single object, or Axios { data } wrapper).
 */
export function extractAttachedImageIds(result: unknown): string[] {
  if (!result) return []

  const unwrapped =
    typeof result === 'object' && result !== null && 'data' in result
      ? (result as { data?: unknown }).data
      : result

  const items = Array.isArray(unwrapped) ? unwrapped : [unwrapped]
  const ids: string[] = []

  for (const item of items) {
    if (typeof item === 'object' && item !== null) {
      const candidate =
        'data' in item && typeof (item as { data?: unknown }).data === 'object' && (item as { data?: unknown }).data !== null
          ? (item as { data: { id?: unknown } }).data.id
          : (item as { id?: unknown }).id
      if (typeof candidate === 'string' && candidate.length > 0 && !ids.includes(candidate)) {
        ids.push(candidate)
      }
    }
  }

  return ids
}

/**
 * Executes edit-mode image reconciliation in strict atomic order:
 * 1. attach new uploaded URLs
 * 2. reorder remaining existing images + newly attached images (so index 0 is persisted as primary, new last)
 * 3. delete removed image IDs ONLY after steps 1 and 2 succeed
 */
export async function reconcileEditSectionImages({
  listingId,
  newImageUrls,
  existingImages = [],
  removedImageIds = [],
  attachNew,
  reorderExisting,
  removeExisting,
}: ReconcileEditSectionImagesParams): Promise<void> {
  let attachedIds: string[] = []
  if (newImageUrls.length > 0 && attachNew) {
    const attachResult = await attachNew(listingId, newImageUrls)
    attachedIds = extractAttachedImageIds(attachResult)
  }

  const existingIds = existingImages
    .map((img) => (typeof img === 'string' ? undefined : img?.id))
    .filter((id): id is string => typeof id === 'string' && id.length > 0)

  if (existingIds.length > 0 && reorderExisting) {
    const orderedIds = [
      ...existingIds,
      ...attachedIds.filter((id) => !existingIds.includes(id)),
    ]
    await reorderExisting(listingId, orderedIds)
  }

  if (removedImageIds.length > 0 && removeExisting) {
    for (const imgId of removedImageIds) {
      await removeExisting(listingId, imgId)
    }
  }
}
