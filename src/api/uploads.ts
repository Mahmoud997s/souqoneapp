import { apiClient } from './client'
import { UploadResponse } from '../types/api.types'

export const uploadsApi = {
  single:   (formData: FormData) =>
              apiClient.post<UploadResponse>('/uploads', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
              }),
  multiple: (formData: FormData) =>
              apiClient.post<UploadResponse[]>('/uploads/multiple', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
              }),
  removeListingImage: (listingId: string, imageId: string) =>
              apiClient.delete(`/uploads/listings/${listingId}/images/${imageId}`),
  attachListingImageUrl: (listingId: string, url: string) =>
              apiClient.post(`/uploads/listings/${listingId}/images/url`, { url }),
  removePartImage: (imageId: string) =>
              apiClient.delete(`/uploads/parts/images/${imageId}`),
  removeServiceImage: (imageId: string) =>
              apiClient.delete(`/uploads/services/images/${imageId}`),
}

