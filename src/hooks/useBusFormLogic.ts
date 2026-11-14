import { useState, useCallback } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { dialogService } from '../store/dialogStore'
import { BusWizardData, useBusWizardStore } from '../store/busWizardStore'
import { MAX_BUS_IMAGES } from '../constants/buses'
import { requestPermission, type PermissionAdapter } from '../utils/requestPermission'
import { getMutationErrorMessage } from '../utils/listing-detail/getDetailErrorKind'

const busMediaAdapter: PermissionAdapter = {
  kind: 'mediaLibrary',
  titleAr: 'إذن الوصول مطلوب',
  deniedMessageAr: 'يرجى السماح بالوصول لمعرض الصور لتتمكن من إرفاق صور الحافلة',
  blockedMessageAr: 'يرجى السماح بالوصول لمعرض الصور من إعدادات الهاتف لتتمكن من إرفاق صور الحافلة',
  request: async () => {
    return await ImagePicker.requestMediaLibraryPermissionsAsync()
  },
}

export function useBusFormLogic(
  data: BusWizardData,
  onUpdateField: (field: keyof BusWizardData, value: any) => void
) {
  const [isUploading, setIsUploading] = useState(false)

  const handlePickImages = useCallback(async () => {
    try {
      const permission = await requestPermission(busMediaAdapter)
      if (!permission.granted) {
        return
      }

      setIsUploading(true)
      const currentCount = (data.images?.length || 0) + (data.existingImages?.length || 0)

      if (currentCount >= MAX_BUS_IMAGES) {
        dialogService.alert('تنبيه', `لا يمكن تجاوز ${MAX_BUS_IMAGES} صور كحد أقصى.`)
        setIsUploading(false)
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: MAX_BUS_IMAGES - currentCount,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const picked = result.assets.map((asset) => asset.uri)
        const newImages = [...(data.images || []), ...picked]
        onUpdateField('images', newImages)
      }
    } catch (err: unknown) {
      dialogService.alert('خطأ', getMutationErrorMessage(err, 'تعذر اختيار الصور، حاول مرة أخرى'))
    } finally {
      setIsUploading(false)
    }
  }, [data.images, data.existingImages, onUpdateField])

  const handleRemoveNewImage = useCallback(
    (index: number) => {
      const updated = (data.images || []).filter((_, i) => i !== index)
      onUpdateField('images', updated)
    },
    [data.images, onUpdateField]
  )

  const handleRemoveExistingImage = useCallback(
    (idOrUrl: string) => {
      const updated = (data.existingImages || []).filter((img: any) => {
        const match = (img.id && img.id === idOrUrl) || (img.url && img.url === idOrUrl)
        return !match
      })
      onUpdateField('existingImages', updated)

      const target = (data.existingImages || []).find(
        (img: any) => img.id === idOrUrl || img.url === idOrUrl
      )
      if (target?.id) {
        // Read latest state from store to prevent stale closure race conditions
        const latestRemoved = useBusWizardStore.getState().data.removedImageIds || []
        onUpdateField('removedImageIds', [...latestRemoved, target.id])
      }
    },
    [data.existingImages, onUpdateField]
  )

  const handleMakePrimaryNew = useCallback(
    (index: number) => {
      if (index === 0) return
      const updated = [...(data.images || [])]
      const [moved] = updated.splice(index, 1)
      updated.unshift(moved)
      onUpdateField('images', updated)
    },
    [data.images, onUpdateField]
  )

  const handleMakePrimaryExisting = useCallback(
    (index: number) => {
      if (index === 0) return
      const updated = [...(data.existingImages || [])]
      const [moved] = updated.splice(index, 1)
      updated.unshift(moved)
      onUpdateField('existingImages', updated)
    },
    [data.existingImages, onUpdateField]
  )

  return {
    isUploading,
    handlePickImages,
    handleRemoveNewImage,
    handleRemoveExistingImage,
    handleMakePrimaryNew,
    handleMakePrimaryExisting,
  }
}
