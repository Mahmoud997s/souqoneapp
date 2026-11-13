import { useEffect, useRef, useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { dialogService } from '../store/dialogStore'

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
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) {
        dialogService.alert('إذن الوصول مطلوب', 'يرجى السماح بالوصول لمعرض الصور لتتمكن من إرفاق صور المعدة')
        return
      }

      setIsUploading(true)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10 - (images.length + existingImages.length),
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages = [...images, ...result.assets]
        onUpdateImages(newImages)
        onClearFieldError?.('images')
      }
    } catch (err) {
      dialogService.alert('خطأ', 'تعذر اختيار الصور، يرجى المحاولة مجدداً')
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
    handleToggleFeature,
    handleAddCustomFeature,
    handleRemoveFeature,
  }
}
