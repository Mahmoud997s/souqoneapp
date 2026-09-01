import { useState, useCallback } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { dialogService } from '../store/dialogStore'
import { PartFormData, PartImageItem, PartExistingImage } from '../store/partWizardStore'
import { MAX_PART_IMAGES } from '../constants/parts'
import { router } from 'expo-router'

/**
 * Shared form logic hook for parts form (image picking, removal, primary reordering, location changes)
 */
export function usePartFormLogic(
  formData: PartFormData,
  setField: <K extends keyof PartFormData>(field: K, value: PartFormData[K]) => void,
  setLocation: (governorateId: number, wilayaId: number, governorateNameAr: string, wilayaNameAr: string) => void
) {
  const [isUploading, setIsUploading] = useState(false)

  const handlePickImages = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) {
        dialogService.alert(
          'إذن الوصول مطلوب',
          'يرجى السماح بالوصول لمعرض الصور لتتمكن من إرفاق صور القطعة'
        )
        return
      }

      setIsUploading(true)
      const currentImagesCount = (formData.images?.length || 0) + (formData.existingImages?.length || 0)

      if (currentImagesCount >= MAX_PART_IMAGES) {
        dialogService.alert('تنبيه', `لا يمكن تجاوز ${MAX_PART_IMAGES} صور كحد أقصى.`)
        setIsUploading(false)
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: MAX_PART_IMAGES - currentImagesCount,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const picked: PartImageItem[] = result.assets.map((asset) => ({
          uri: asset.uri,
          isPrimary: false,
        }))
        const newImages = [...(formData.images || []), ...picked]
        setField('images', newImages)
      }
    } catch (err) {
      dialogService.alert('خطأ', 'تعذر اختيار الصور، يرجى المحاولة مجدداً')
    } finally {
      setIsUploading(false)
    }
  }, [formData.images, formData.existingImages, setField])

  const handleRemoveNewImage = useCallback(
    (index: number) => {
      const updated = (formData.images || []).filter((_, i) => i !== index)
      setField('images', updated)
    },
    [formData.images, setField]
  )

  const handleRemoveExistingImage = useCallback(
    (idOrUrl: string) => {
      const updated = (formData.existingImages || []).filter((img) => {
        const match = (img.id && img.id === idOrUrl) || (img.url && img.url === idOrUrl)
        return !match
      })
      setField('existingImages', updated)

      const target = (formData.existingImages || []).find(
        (img) => img.id === idOrUrl || img.url === idOrUrl
      )
      if (target?.id) {
        setField('removedImageIds', [...(formData.removedImageIds || []), target.id])
      }
    },
    [formData.existingImages, formData.removedImageIds, setField]
  )

  const handleMakePrimaryNew = useCallback(
    (index: number) => {
      if (index === 0) return
      const updated = [...(formData.images || [])]
      const [moved] = updated.splice(index, 1)
      updated.unshift(moved)
      setField('images', updated)
    },
    [formData.images, setField]
  )

  const handleMakePrimaryExisting = useCallback(
    (index: number) => {
      if (index === 0) return
      const updated = [...(formData.existingImages || [])]
      const [moved] = updated.splice(index, 1)
      updated.unshift(moved)
      setField('existingImages', updated)
    },
    [formData.existingImages, setField]
  )

  const handleLocationChange = useCallback(
    (govId: number, wilId: number, govNameAr: string, wilNameAr: string) => {
      setLocation(govId, wilId, govNameAr, wilNameAr)
    },
    [setLocation]
  )

  const handleCancel = useCallback(() => {
    router.back()
  }, [])

  return {
    isUploading,
    handlePickImages,
    handleRemoveNewImage,
    handleRemoveExistingImage,
    handleMakePrimaryNew,
    handleMakePrimaryExisting,
    handleLocationChange,
    handleCancel,
  }
}
