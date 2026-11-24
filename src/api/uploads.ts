import { apiClient } from './client'
import { UploadResponse } from '../types/api.types'

export const uploadsApi = {
  single:   (formData: FormData, signal?: AbortSignal, onUploadProgress?: (progress: number) => void) =>
              apiClient.post<UploadResponse>('/uploads', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                transformRequest: (data) => data,
                signal,
                onUploadProgress: onUploadProgress
                  ? (evt) => {
                      if (evt.total && evt.total > 0) {
                        onUploadProgress(Math.min(100, Math.round((evt.loaded / evt.total) * 100)))
                      }
                    }
                  : undefined,
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
  reorderPartImages: (partId: string, imageIds: string[]) =>
              apiClient.patch(`/uploads/parts/${partId}/images/reorder`, { imageIds }),
  reorderServiceImages: (serviceId: string, imageIds: string[]) =>
              apiClient.patch(`/uploads/services/${serviceId}/images/reorder`, { imageIds }),
  reorderBusImages: (busId: string, imageIds: string[]) =>
              apiClient.patch(`/uploads/buses/${busId}/images/reorder`, { imageIds }),
  reorderEquipmentImages: (equipmentId: string, imageIds: string[]) =>
              apiClient.patch(`/uploads/equipment/${equipmentId}/images/reorder`, { imageIds }),
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

