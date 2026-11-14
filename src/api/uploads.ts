import { apiClient } from './client'
import { UploadResponse } from '../types/api.types'

export const uploadsApi = {
  single:   (formData: FormData, signal?: AbortSignal) =>
              apiClient.post<UploadResponse>('/uploads', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                transformRequest: (data) => data,
                signal,
              }),
  multiple: (formData: FormData) =>
              apiClient.post<UploadResponse[]>('/uploads/multiple', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                transformRequest: (data) => data,
              }),
  removeListingImage: (listingId: string, imageId: string) =>
              apiClient.delete(`/uploads/listings/${listingId}/images/${imageId}`),
  attachListingImageUrl: (listingId: string, url: string) =>
              apiClient.post(`/uploads/listings/${listingId}/images/url`, { url }),
  reorderImages: (listingId: string, imageIds: string[]) =>
              apiClient.patch(`/uploads/listings/${listingId}/images/reorder`, { imageIds }),
  addPartImageByUrl: (partId: string, url: string, isPrimary?: boolean, signal?: AbortSignal) =>
              apiClient.post(
                `/uploads/parts/${partId}/images/url`,
                {
                  url,
                  isPrimary: Boolean(isPrimary),
                },
                signal ? { signal } : undefined
              ),
  removePartImage: (imageId: string, signal?: AbortSignal) =>
              apiClient.delete(`/uploads/parts/images/${imageId}`, signal ? { signal } : undefined),
  removeServiceImage: (imageId: string) =>
              apiClient.delete(`/uploads/services/images/${imageId}`),
}

