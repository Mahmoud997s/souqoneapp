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
}
