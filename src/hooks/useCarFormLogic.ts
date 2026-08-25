import { useState, useCallback } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { dialogService } from '../store/dialogStore'
import { CarFormData, CarFormField } from '../types/carForm.types'
import { router } from 'expo-router'

/**
 * Shared form logic hook for car forms (custom features, image handling helpers)
 */
export function useCarFormLogic(
  formData: CarFormData,
  updateField: (field: CarFormField, value: any) => void
) {
  const [isUploading, setIsUploading] = useState(false)
  const [customFeatureInput, setCustomFeatureInput] = useState('')

  // ── Image Management ──
  const handlePickImages = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) {
        dialogService.alert(
          'إذن الوصول مطلوب',
          'يرجى السماح بالوصول لمعرض الصور لتتمكن من إرفاق صور السيارة'
        )
        return
      }

      setIsUploading(true)
      const currentImagesCount = (formData.images?.length || 0) + (formData.existingImages?.length || 0)
      
      if (currentImagesCount >= 20) {
        dialogService.alert('تنبيه', 'لا يمكن تجاوز 20 صورة كحد أقصى.')
        setIsUploading(false)
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 20 - currentImagesCount,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages = [...(formData.images || []), ...result.assets]
        updateField('images', newImages)
      }
    } catch (err) {
      dialogService.alert('خطأ', 'تعذر اختيار الصور، يرجى المحاولة مجدداً')
    } finally {
      setIsUploading(false)
    }
  }, [formData.images, formData.existingImages, updateField])

  const handleRemoveNewImage = useCallback(
    (index: number) => {
      const updated = (formData.images || []).filter((_, i) => i !== index)
      updateField('images', updated)
    },
    [formData.images, updateField]
  )

  const handleRemoveExistingImage = useCallback(
    (idOrUrl: string) => {
      const updated = (formData.existingImages || []).filter((img: any) => {
        const match = (img.id && img.id === idOrUrl) || (img.url && img.url === idOrUrl)
        return !match
      })
      updateField('existingImages', updated)

      // Track removed ID for backend deletion
      const target = (formData.existingImages || []).find(
        (img: any) => img.id === idOrUrl || img.url === idOrUrl
      )
      if (target?.id) {
        updateField('removedImageIds', [...(formData.removedImageIds || []), target.id])
      }
    },
    [formData.existingImages, formData.removedImageIds, updateField]
  )

  // ── Features & Tags ──
  const handleToggleFeature = useCallback(
    (feature: string) => {
      const currentFeatures = formData.features || []
      if (currentFeatures.includes(feature)) {
        updateField(
          'features',
          currentFeatures.filter((f: string) => f !== feature)
        )
      } else {
        updateField('features', [...currentFeatures, feature])
      }
    },
    [formData.features, updateField]
  )

  const handleAddCustomFeature = useCallback(() => {
    if (customFeatureInput.trim()) {
      const currentFeatures = formData.features || []
      if (!currentFeatures.includes(customFeatureInput.trim())) {
        updateField('features', [...currentFeatures, customFeatureInput.trim()])
      }
      setCustomFeatureInput('')
    }
  }, [customFeatureInput, formData.features, updateField])

  const handleRemoveFeature = useCallback(
    (feature: string) => {
      const currentFeatures = formData.features || []
      updateField(
        'features',
        currentFeatures.filter((f: string) => f !== feature)
      )
    },
    [formData.features, updateField]
  )

  const handleLocationChange = useCallback(
    (govId: number, wilId: number, govNameAr: string, wilNameAr: string) => {
      updateField('governorateId', govId)
      updateField('wilayaId', wilId)
      updateField('governorateName', govNameAr)
      updateField('wilayaName', wilNameAr)
    },
    [updateField]
  )

  const handleCancel = useCallback(() => {
    router.back()
  }, [])

  return {
    isUploading,
    customFeatureInput,
    setCustomFeatureInput,
    handlePickImages,
    handleRemoveNewImage,
    handleRemoveExistingImage,
    handleToggleFeature,
    handleAddCustomFeature,
    handleRemoveFeature,
    handleLocationChange,
    handleCancel,
  }
}
