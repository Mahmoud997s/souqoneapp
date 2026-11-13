import { EquipmentFormData } from '../../types/equipmentForm.types'
import { EquipmentListing } from '../../types/equipment.types'
import { uploadsApi } from '../../api/uploads'
import { buildUploadFilePayload } from '../fileUploadHelper'
import { logWarn } from '../safeLog'

export interface UploadAndReconcileImagesResult {
  finalImageUrls: string[]
  newImageUrls: string[]
}

/**
 * Uploads local images and reconciles with existing images for equipment wizard.
 */
export async function uploadAndReconcileEquipmentImages(
  images: any[] | undefined,
  existingImages: any[] | undefined
): Promise<UploadAndReconcileImagesResult> {
  const finalImageUrls: string[] = []
  const newImageUrls: string[] = []

  // Add existing images from previous upload
  if (existingImages && existingImages.length > 0) {
    for (const img of existingImages) {
      const url = typeof img === 'string' ? img : img.url || img.uri
      if (url) finalImageUrls.push(url)
    }
  }

  // Upload newly added local images
  if (images && images.length > 0) {
    for (const img of images) {
      if (typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))) {
        finalImageUrls.push(img)
      } else {
        const uri = typeof img === 'string' ? img : img.uri
        if (uri) {
          if (uri.startsWith('http://') || uri.startsWith('https://')) {
            finalImageUrls.push(uri)
          } else {
            try {
              const filePayload = buildUploadFilePayload(img, 'equip')
              if (!filePayload) continue

              const data = new FormData()
              data.append('file', filePayload as any)
              const res = await uploadsApi.single(data)
              const resData = res.data as { url?: string; path?: string } | undefined
              const url = resData?.url ?? resData?.path ?? (res as { url?: string }).url
              if (url) {
                finalImageUrls.push(url)
                newImageUrls.push(url)
              }
            } catch (uploadErr: unknown) {
              logWarn('EquipmentNew:UploadImage', uploadErr)
              const errObj = uploadErr as { response?: { data?: { message?: string } }; message?: string }
              const serverMsg = errObj?.response?.data?.message || errObj?.message
              throw new Error(serverMsg || 'فشل رفع إحدى الصور، يرجى المحاولة مجدداً')
            }
          }
        }
      }
    }
  }

  return { finalImageUrls, newImageUrls }
}

/**
 * Builds the exact backend DTO payload from EquipmentFormData compatible with Partial<EquipmentListing>.
 */
export function buildEquipmentListingPayload(
  formData: EquipmentFormData,
  finalImageUrls: string[]
): Partial<EquipmentListing> {
  const payload: Partial<EquipmentListing> = {
    title: formData.title.trim(),
    description: formData.description.trim(),
    equipmentType: formData.equipmentType as EquipmentListing['equipmentType'],
    listingType: formData.listingType as EquipmentListing['listingType'],
    make: formData.make.trim() || undefined,
    model: formData.model.trim() || undefined,
    year: formData.year ? Number(formData.year) : undefined,
    condition: formData.condition || 'USED',
    capacity: formData.capacity.trim() || undefined,
    power: formData.power.trim() || undefined,
    weight: formData.weight.trim() || undefined,
    hoursUsed: formData.hoursUsed ? Number(formData.hoursUsed) : undefined,
    features: formData.features.length > 0 ? (formData.features as any) : undefined,

    isPriceNegotiable: formData.isPriceNegotiable,
    withOperator: formData.withOperator,
    deliveryAvailable: formData.deliveryAvailable,

    governorateId: formData.governorateId ? Number(formData.governorateId) : undefined,
    wilayaId: formData.wilayaId ? Number(formData.wilayaId) : undefined,
    latitude: formData.latitude || undefined,
    longitude: formData.longitude || undefined,

    whatsappEnabled: formData.whatsappEnabled === true,
    ...(formData.editMode ? {} : { images: finalImageUrls.length > 0 ? (finalImageUrls as any) : undefined }),
  }

  if (formData.listingType === 'EQUIPMENT_SALE') {
    payload.price = formData.price ? Number(formData.price) : undefined
  } else if (formData.listingType === 'EQUIPMENT_RENT') {
    payload.dailyPrice = formData.dailyPrice ? Number(formData.dailyPrice) : undefined
    payload.monthlyPrice = formData.monthlyPrice ? Number(formData.monthlyPrice) : undefined
  } else if (formData.listingType === 'EQUIPMENT_WANTED') {
    payload.budgetMin = formData.budgetMin ? Number(formData.budgetMin) : undefined
    payload.budgetMax = formData.budgetMax ? Number(formData.budgetMax) : undefined
    payload.rentalDuration = formData.rentalDuration || undefined
    payload.quantity = formData.quantity ? Number(formData.quantity) : 1
    payload.siteDetails = formData.siteDetails || undefined
  }

  return payload
}
