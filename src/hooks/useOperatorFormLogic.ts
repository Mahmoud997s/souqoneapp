import { useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { uploadsApi } from '../api/uploads'
import { dialogService } from '../store/dialogStore'

interface UseOperatorFormLogicProps {
  certifications: string[]
  equipmentTypes: string[]
  specializations?: string[]
  onUpdateCertifications: (certs: string[]) => void
  onUpdateEquipmentTypes: (types: string[]) => void
  onUpdateSpecializations?: (specs: string[]) => void
  onClearFieldError?: (field: string) => void
}

export function useOperatorFormLogic({
  certifications,
  equipmentTypes,
  specializations = [],
  onUpdateCertifications,
  onUpdateEquipmentTypes,
  onUpdateSpecializations,
  onClearFieldError,
}: UseOperatorFormLogicProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [tempCert, setTempCert] = useState('')
  const [tempSpec, setTempSpec] = useState('')

  const toggleEquipmentType = (typeId: string) => {
    const current = equipmentTypes || []
    if (current.includes(typeId)) {
      onUpdateEquipmentTypes(current.filter((t) => t !== typeId))
    } else {
      onUpdateEquipmentTypes([...current, typeId])
      onClearFieldError?.('equipmentTypes')
    }
  }

  const pickCertificateImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        dialogService.alert('الإذن مطلوب', 'يرجى السماح بالوصول إلى مكتبة الصور لإرفاق شهادتك أو رخصتك')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      })

      if (result.canceled || !result.assets?.length) return

      setIsUploading(true)
      const uploadedUrls: string[] = []
      for (const asset of result.assets) {
        const data = new FormData()
        data.append('file', {
          uri: asset.uri,
          name: asset.fileName || `cert_${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
        } as any)

        const res = await uploadsApi.single(data)
        const url = (res.data as any)?.url ?? (res.data as any)?.path
        if (url) uploadedUrls.push(url)
      }

      if (uploadedUrls.length > 0) {
        onUpdateCertifications([...certifications, ...uploadedUrls])
        onClearFieldError?.('certifications')
        dialogService.alert('نجاح', 'تم إرفاق صورة الشهادة/الرخصة بنجاح')
      }
    } catch (err: any) {
      dialogService.alert('خطأ', 'فشل رفع الصورة، يرجى المحاولة مجدداً')
    } finally {
      setIsUploading(false)
    }
  }

  const addTextCert = (text?: string) => {
    const certText = (text || tempCert).trim()
    if (certText) {
      onUpdateCertifications([...certifications, certText])
      setTempCert('')
      onClearFieldError?.('certifications')
    } else {
      pickCertificateImages()
    }
  }

  const removeCert = (idx: number) => {
    onUpdateCertifications(certifications.filter((_, i) => i !== idx))
  }

  const addSpec = (text?: string) => {
    const specText = (text || tempSpec).trim()
    if (specText && onUpdateSpecializations) {
      onUpdateSpecializations([...specializations, specText])
      setTempSpec('')
    }
  }

  const removeSpec = (idx: number) => {
    if (onUpdateSpecializations) {
      onUpdateSpecializations(specializations.filter((_, i) => i !== idx))
    }
  }

  return {
    isUploading,
    tempCert,
    setTempCert,
    tempSpec,
    setTempSpec,
    toggleEquipmentType,
    pickCertificateImages,
    addTextCert,
    removeCert,
    addSpec,
    removeSpec,
  }
}
