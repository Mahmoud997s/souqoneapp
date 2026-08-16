import { useState, useEffect, useMemo } from 'react'
import { BackHandler } from 'react-native'
import { router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import * as Haptics from 'expo-haptics'
import { useAuthStore } from '../store/authStore'
import { usersApi } from '../api/users'
import { uploadsApi } from '../api/uploads'
import { locationsApi } from '../api/locations'
import { GovernorateRef, WilayaRef } from '../types/location.types'
import { Config } from '../constants/config'
import { dialogService } from '../store/dialogStore'

function normalizeArabic(text: string): string {
  return text
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLowerCase()
    .trim()
}

export function useEditProfile() {
  const { user } = useAuthStore()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')

  // Focus states
  const [focusedField, setFocusedField] = useState<string | null>(null)

  // Location IDs & Display Names
  const [governorateId, setGovernorateId] = useState<number | null>(null)
  const [governorateName, setGovernorateName] = useState('')
  const [wilayaId, setWilayaId] = useState<number | null>(null)
  const [wilayaName, setWilayaName] = useState('')

  // null = not yet loaded, '' = explicitly cleared, string = URL/URI
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAvatarSheet, setShowAvatarSheet] = useState(false)

  // Location Selector Modal State
  const [modalType, setModalType] = useState<'governorate' | 'wilaya' | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingLocations, setLoadingLocations] = useState(false)
  const [governoratesList, setGovernoratesList] = useState<GovernorateRef[]>([])
  const [wilayasList, setWilayasList] = useState<WilayaRef[]>([])

  // Initialize fields
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '')
      setEmail(user.email || '')
      setPhone(user.phone || '')
      setBio(user.bio || '')
      setGovernorateId(user.governorateId || null)
      setWilayaId(user.wilayaId || null)
      setGovernorateName(user.governorateRef?.nameAr || user.governorate || '')
      setWilayaName(user.wilayaRef?.nameAr || user.city || '')
      setAvatarUrl(user.avatarUrl || user.avatar || null)
    }
  }, [user])

  // Resolve governorate name if user had ID but no name
  useEffect(() => {
    if (governorateId && !governorateName) {
      locationsApi.getGovernorates().then((list) => {
        const found = list.find((g) => g.id === governorateId)
        if (found) setGovernorateName(found.nameAr)
      }).catch(() => {})
    }
  }, [governorateId, governorateName])

  // Resolve wilaya name if user had ID but no name
  useEffect(() => {
    if (governorateId && wilayaId && !wilayaName) {
      locationsApi.getWilayas(governorateId).then((list) => {
        const found = list.find((w) => w.id === wilayaId)
        if (found) setWilayaName(found.nameAr)
      }).catch(() => {})
    }
  }, [governorateId, wilayaId, wilayaName])

  // avatarUrl === null → not loaded yet (use user fallback)
  // avatarUrl === '' → user explicitly cleared it
  // avatarUrl === string → new URI or existing URL
  const resolvedAvatar =
    avatarUrl === null
      ? (user?.avatarUrl || user?.avatar || null)
      : avatarUrl || null

  const displayAvatar = resolvedAvatar
    ? resolvedAvatar.startsWith('http') || resolvedAvatar.startsWith('file')
      ? resolvedAvatar
      : `${Config.apiUrl}${resolvedAvatar.startsWith('/') ? '' : '/'}${resolvedAvatar}`
    : null

  const pickFromGallery = async () => {
    console.log('🟢 [pickFromGallery] Clicked')
    try {
      console.log('🟢 [pickFromGallery] Requesting permissions...')
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      console.log('🟢 [pickFromGallery] Permission status:', status)
      if (status !== 'granted') {
        dialogService.alert('صلاحية مطلوبة', 'يرجى منح إذن الوصول إلى المعرض من إعدادات الجهاز')
        return
      }

      console.log('🟢 [pickFromGallery] Launching ImageLibrary...')
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      })
      console.log('🟢 [pickFromGallery] Result:', result)

      if (!result.canceled && result.assets?.[0]?.uri) {
        setAvatarUrl(result.assets[0].uri)
      }
    } catch (err: any) {
      console.error('❌ [pickFromGallery] Error:', err)
      dialogService.alert('خطأ', 'حدث خطأ أثناء فتح المعرض: ' + (err?.message || ''))
    } finally {
      setShowAvatarSheet(false)
    }
  }

  const pickFromCamera = async () => {
    console.log('🟢 [pickFromCamera] Clicked')
    try {
      console.log('🟢 [pickFromCamera] Requesting camera permissions...')
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      console.log('🟢 [pickFromCamera] Camera permission status:', status)
      if (status !== 'granted') {
        dialogService.alert('صلاحية مطلوبة', 'يرجى منح إذن الوصول إلى الكاميرا من إعدادات الجهاز')
        return
      }

      console.log('🟢 [pickFromCamera] Launching Camera...')
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      })
      console.log('🟢 [pickFromCamera] Result:', result)

      if (!result.canceled && result.assets?.[0]?.uri) {
        setAvatarUrl(result.assets[0].uri)
      }
    } catch (err: any) {
      console.error('❌ [pickFromCamera] Error:', err)
      dialogService.alert('خطأ', 'حدث خطأ أثناء فتح الكاميرا: ' + (err?.message || ''))
    } finally {
      setShowAvatarSheet(false)
    }
  }

  const handlePickImage = () => setShowAvatarSheet(true)

  // Open Governorates Modal
  const openGovernoratePicker = async () => {
    setSearchQuery('')
    setModalType('governorate')
    if (governoratesList.length === 0) {
      setLoadingLocations(true)
      try {
        const data = await locationsApi.getGovernorates()
        setGovernoratesList(data)
      } catch {
        dialogService.alert('خطأ', 'تعذر تحميل قائمة المحافظات')
      } finally {
        setLoadingLocations(false)
      }
    }
  }

  // Open Wilayas Modal
  const openWilayaPicker = async () => {
    if (!governorateId) {
      dialogService.alert('تنبيه', 'يرجى اختيار المحافظة أولاً')
      return
    }
    setSearchQuery('')
    setModalType('wilaya')
    setLoadingLocations(true)
    try {
      const data = await locationsApi.getWilayas(governorateId)
      setWilayasList(data)
    } catch {
      dialogService.alert('خطأ', 'تعذر تحميل قائمة الولايات')
    } finally {
      setLoadingLocations(false)
    }
  }

  const handleSelectGovernorate = (gov: GovernorateRef) => {
    Haptics.selectionAsync().catch(() => {})
    setGovernorateId(gov.id)
    setGovernorateName(gov.nameAr)
    setWilayaId(null)
    setWilayaName('')
    setModalType(null)

    // Auto open wilaya picker for smooth UX
    setTimeout(() => {
      setModalType('wilaya')
      setLoadingLocations(true)
      locationsApi.getWilayas(gov.id)
        .then((data) => setWilayasList(data))
        .catch(() => {})
        .finally(() => setLoadingLocations(false))
    }, 250)
  }

  const handleSelectWilaya = (w: WilayaRef) => {
    Haptics.selectionAsync().catch(() => {})
    setWilayaId(w.id)
    setWilayaName(w.nameAr)
    setModalType(null)
  }

  // Filtered List
  const filteredList = useMemo(() => {
    const rawList = modalType === 'governorate' ? governoratesList : wilayasList
    if (!searchQuery.trim()) return rawList

    const q = normalizeArabic(searchQuery)
    return rawList.filter((item) => {
      const ar = normalizeArabic(item.nameAr || '')
      const en = (item.nameEn || '').toLowerCase()
      return ar.includes(q) || en.includes(searchQuery.toLowerCase().trim())
    })
  }, [modalType, searchQuery, governoratesList, wilayasList])

  const handleSave = async () => {
    if (!displayName.trim()) {
      dialogService.alert('تنبيه', 'يرجى إدخال الاسم المستعار')
      return
    }

    try {
      setLoading(true)
      let avatarPayload: string | null | undefined = undefined

      if (avatarUrl === '') {
        // User explicitly deleted avatar -> send null to delete from DB
        avatarPayload = null
      } else if (avatarUrl && !avatarUrl.startsWith('http')) {
        // Local file URI -> upload first
        const filename = avatarUrl.split('/').pop() || 'avatar.jpg'
        const match = /\.(\w+)$/.exec(filename)
        const type = match ? `image/${match[1]}` : `image/jpeg`

        const formData = new FormData()
        formData.append('file', {
          uri: avatarUrl,
          name: filename,
          type,
        } as any)

        const uploadRes = await uploadsApi.single(formData)
        if (uploadRes.data?.url) {
          avatarPayload = uploadRes.data.url
        }
      } else if (avatarUrl) {
        avatarPayload = avatarUrl
      } else {
        // avatarUrl === null -> no local override -> do not modify
        avatarPayload = undefined
      }

      console.log('📤 [handleSave] avatarPayload:', avatarPayload)

      const res = await usersApi.updateProfile({
        displayName: displayName.trim(),
        phone: phone.trim() || undefined,
        bio: bio.trim() || undefined,
        governorateId: governorateId ?? undefined,
        wilayaId: wilayaId ?? undefined,
        avatarUrl: avatarPayload,
      })

      console.log('📥 [handleSave] API updateProfile response:', res.data)

      if (res.data) {
        useAuthStore.setState((state) => {
          if (!state.user) return { user: res.data }
          const updatedUser = {
            ...state.user,
            ...res.data,
            avatarUrl: avatarPayload === null ? undefined : (res.data.avatarUrl ?? state.user.avatarUrl),
            avatar: avatarPayload === null ? undefined : (res.data.avatar ?? state.user.avatar),
            governorateRef: governorateId && governorateName ? { id: governorateId, nameAr: governorateName } : state.user.governorateRef,
            wilayaRef: wilayaId && wilayaName ? { id: wilayaId, nameAr: wilayaName } : state.user.wilayaRef,
          }
          if (avatarPayload === null) {
            delete (updatedUser as any).avatar
            delete (updatedUser as any).avatarUrl
          }
          return { user: updatedUser }
        })

        console.log('💾 [handleSave] useAuthStore user after save:', useAuthStore.getState().user)
        dialogService.alert('نجاح', 'تم تحديث الملف الشخصي بنجاح!', 'success')
        router.back()
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'حدث خطأ أثناء التحديث'
      dialogService.alert('خطأ', typeof msg === 'string' ? msg : Array.isArray(msg) ? msg[0] : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  // Check for unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!user) return false
    const origDisplayName = user.displayName || ''
    const origPhone = user.phone || ''
    const origBio = user.bio || ''
    const origGovernorateId = user.governorateId || null
    const origWilayaId = user.wilayaId || null
    const origAvatar = user.avatarUrl || user.avatar || null

    return (
      displayName.trim() !== origDisplayName.trim() ||
      phone.trim() !== origPhone.trim() ||
      bio.trim() !== origBio.trim() ||
      governorateId !== origGovernorateId ||
      wilayaId !== origWilayaId ||
      (avatarUrl !== null && avatarUrl !== origAvatar)
    )
  }, [user, displayName, phone, bio, governorateId, wilayaId, avatarUrl])

  const handleBackPress = () => {
    if (hasUnsavedChanges) {
      dialogService.confirm(
        'تغييرات غير محفوظة',
        'لديك تعديلات لم يتم حفظها بعد، هل تريد تجاهل التغييرات والخروج؟',
        () => router.back(),
        'تجاهل والخروج',
        'متابعة التعديل',
        true
      )
    } else {
      router.back()
    }
  }

  // Intercept Android hardware back button
  useEffect(() => {
    const backAction = () => {
      if (hasUnsavedChanges) {
        handleBackPress()
        return true
      }
      return false
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', backAction)
    return () => subscription.remove()
  }, [hasUnsavedChanges])

  return {
    displayName,
    email,
    phone,
    bio,
    focusedField,

    avatarUrl,
    displayAvatar,
    showAvatarSheet,
    loading,

    governorateId,
    governorateName,
    wilayaId,
    wilayaName,

    modalType,
    searchQuery,
    loadingLocations,
    filteredList,

    hasUnsavedChanges,

    setDisplayName,
    setEmail,
    setPhone,
    setBio,
    setFocusedField,
    setAvatarUrl,
    setShowAvatarSheet,
    setSearchQuery,
    setModalType,

    pickFromGallery,
    pickFromCamera,
    handlePickImage,

    openGovernoratePicker,
    openWilayaPicker,
    handleSelectGovernorate,
    handleSelectWilaya,

    handleSave,
    handleBackPress,
  }
}
