import { useEffect, useRef, useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { toastService } from '../store/toastStore'
import { requestPermission, type PermissionAdapter } from '../utils/requestPermission'
import { showErrorDialog } from '../utils/showErrorDialog'

export const equipmentMediaAdapter: PermissionAdapter = {
  kind: 'equipmentMediaLibrary',
  titleAr: 'إذن الوصول مطلوب',
  deniedMessageAr: 'يرجى السماح بالوصول لمعرض الصور لتتمكن من إرفاق صور المعدة',
  blockedMessageAr: 'يرجى السماح بالوصول لمعرض الصور من إعدادات الهاتف لتتمكن من إرفاق صور المعدة',
  request: async () => {
    return await ImagePicker.requestMediaLibraryPermissionsAsync()
  },
}

interface UseEquipmentFormLogicProps {
  images: any[]
  existingImages?: any[]
  removedImageIds?: string[]
  features: string[]
  onUpdateImages: (images: any[]) => void
  onUpdateExistingImages?: (images: any[]) => void
  onUpdateRemovedImageIds?: (ids: string[]) => void
  onUpdateFeatures: (features: string[]) => void
  onClearFieldError?: (field: string) => void
}

export function useEquipmentFormLogic({
  images,
  existingImages = [],
  removedImageIds,
  features,
  onUpdateImages,
  onUpdateExistingImages,
  onUpdateRemovedImageIds,
  onUpdateFeatures,
  onClearFieldError,
}: UseEquipmentFormLogicProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [customFeatureInput, setCustomFeatureInput] = useState('')
  const removedIdsRef = useRef<string[]>(
    Array.isArray(removedImageIds) ? removedImageIds : []
  )

  useEffect(() => {
    if (removedImageIds !== undefined) {
      removedIdsRef.current = Array.isArray(removedImageIds) ? removedImageIds : []
    }
  }, [removedImageIds])

  // ── Image Management ──
  const handlePickImages = async () => {
    try {
      const permission = await requestPermission(equipmentMediaAdapter)
      if (!permission.granted) {
        return
      }

      setIsUploading(true)
      const currentCount = images.length + existingImages.length
      if (currentCount >= 10) {
        toastService.show({ kind: 'warning', title: 'الحد الأقصى 10 صور' })
        setIsUploading(false)
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10 - currentCount,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages = [...images, ...result.assets]
        onUpdateImages(newImages)
        onClearFieldError?.('images')
      }
    } catch (err) {
      showErrorDialog(err, 'تعذر اختيار الصور، يرجى المحاولة مجدداً')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveNewImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index)
    onUpdateImages(updated)
  }

  const handleRemoveExistingImage = (idOrUrl: string) => {
    if (!onUpdateExistingImages) return
    const updated = existingImages.filter((img: any) => {
      const match = (img.id && img.id === idOrUrl) || (img.url && img.url === idOrUrl)
      return !match
    })
    onUpdateExistingImages(updated)

    // Track removed ID for backend deletion without losing previously removed IDs
    if (onUpdateRemovedImageIds) {
      const target = existingImages.find((img: any) => img.id === idOrUrl || img.url === idOrUrl)
      if (target?.id) {
        const current = Array.isArray(removedIdsRef.current) ? removedIdsRef.current : []
        if (!current.includes(target.id)) {
          const next = [...current, target.id]
          removedIdsRef.current = next
          onUpdateRemovedImageIds(next)
        }
      }
    }
  }

  const handleMakePrimaryNew = (index: number) => {
    if (index <= 0 || index >= images.length) return
    const selected = images[index]
    const updated = [selected, ...images.filter((_, i) => i !== index)]
    onUpdateImages(updated)
  }

  const handleMakePrimaryExisting = (index: number) => {
    if (!onUpdateExistingImages || index <= 0 || index >= existingImages.length) return
    const selected = existingImages[index]
    const updated = [selected, ...existingImages.filter((_, i) => i !== index)]
    onUpdateExistingImages(updated)
  }

  // ── Features & Tags ──
  const handleToggleFeature = (feature: string) => {
    if (features.includes(feature)) {
      onUpdateFeatures(features.filter((f) => f !== feature))
    } else {
      onUpdateFeatures([...features, feature])
    }
  }

  const handleAddCustomFeature = () => {
    const trimmed = customFeatureInput.trim()
    if (!trimmed) return
    if (!features.includes(trimmed)) {
      onUpdateFeatures([...features, trimmed])
    }
    setCustomFeatureInput('')
  }

  const handleRemoveFeature = (feature: string) => {
    onUpdateFeatures(features.filter((f) => f !== feature))
  }

  return {
    isUploading,
    customFeatureInput,
    setCustomFeatureInput,
    handlePickImages,
    handleRemoveNewImage,
    handleRemoveExistingImage,
    handleMakePrimaryNew,
    handleMakePrimaryExisting,
    handleToggleFeature,
    handleAddCustomFeature,
    handleRemoveFeature,
  }
}
