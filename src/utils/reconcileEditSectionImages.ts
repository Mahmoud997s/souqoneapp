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
 * Executes edit-mode image reconciliation in strict atomic order:
 * 1. attach new uploaded URLs
 * 2. reorder remaining existing images (so index 0 is persisted as primary)
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
  if (newImageUrls.length > 0 && attachNew) {
    await attachNew(listingId, newImageUrls)
  }

  const existingIds = existingImages
    .map((img) => (typeof img === 'string' ? undefined : img?.id))
    .filter((id): id is string => typeof id === 'string' && id.length > 0)

  if (existingIds.length > 0 && reorderExisting) {
    await reorderExisting(listingId, existingIds)
  }

  if (removedImageIds.length > 0 && removeExisting) {
    for (const imgId of removedImageIds) {
      await removeExisting(listingId, imgId)
    }
  }
}
