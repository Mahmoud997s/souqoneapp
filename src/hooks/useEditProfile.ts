import { useState, useEffect, useMemo, useRef } from 'react'
import { BackHandler } from 'react-native'
import { router, useNavigation } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import * as Haptics from 'expo-haptics'
import { useAuthStore } from '../store/authStore'
import { usersApi } from '../api/users'
import { uploadsApi } from '../api/uploads'
import { locationsApi } from '../api/locations'
import { queryClient } from '../api/queryClient'
import { GovernorateRef, WilayaRef } from '../types/location.types'
import { Config } from '../constants/config'
import { dialogService } from '../store/dialogStore'
import { buildUploadFilePayload } from '../utils/fileUploadHelper'
import {
  validateProfileForm,
  buildProfilePatch,
  hasProfileUnsavedChanges,
} from '../utils/profileValidation'
import { invalidateProfileQueries } from '../utils/profileQueryInvalidation'

function normalizeArabic(text: string): string {
  return text
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLowerCase()
    .trim()
}

function extractApiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const res = (err as { response?: { data?: { message?: unknown } } }).response
    const msg = res?.data?.message ?? (err as { message?: unknown }).message ?? fallback
    if (Array.isArray(msg) && msg.length > 0) {
      return String(msg[0])
    }
    if (typeof msg === 'string' && msg.trim()) {
      return msg.trim()
    }
  }
  return fallback
}

export function useEditProfile() {
  const { user } = useAuthStore()
  let navigation: any = null
  try {
    navigation = typeof useNavigation === 'function' ? useNavigation() : null
  } catch {
    navigation = null
  }

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')

  // Focus & Inline Errors
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ displayName?: string; phone?: string; bio?: string }>({})

  // Location IDs & Display Names
  const [governorateId, setGovernorateId] = useState<number | null>(null)
  const [governorateName, setGovernorateName] = useState('')
  const [wilayaId, setWilayaId] = useState<number | null>(null)
  const [wilayaName, setWilayaName] = useState('')

  // Avatar Management:
  // avatarAction: 'unchanged' | 'deleted' | 'uploaded'
  const [avatarAction, setAvatarAction] = useState<'unchanged' | 'deleted' | 'uploaded'>('unchanged')
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAvatarSheet, setShowAvatarSheet] = useState(false)

  // Navigation & Dialog Guards
  const isSaveSuccessfulRef = useRef(false)
  const isShowingConfirmRef = useRef(false)

  // Location Selector Modal State
  const [modalType, setModalType] = useState<'governorate' | 'wilaya' | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingLocations, setLoadingLocations] = useState(false)
  const [governoratesList, setGovernoratesList] = useState<GovernorateRef[]>([])
  const [wilayasList, setWilayasList] = useState<WilayaRef[]>([])

  // Initialize fields from authenticated user
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
      setAvatarAction('unchanged')
      setLocalAvatarUri(null)
    }
  }, [user])

  // Resolve governorate name if user had ID but no name
  useEffect(() => {
    if (governorateId && !governorateName) {
      locationsApi
        .getGovernorates()
        .then((list) => {
          const found = list.find((g) => g.id === governorateId)
          if (found) setGovernorateName(found.nameAr)
        })
        .catch(() => {})
    }
  }, [governorateId, governorateName])

  // Resolve wilaya name if user had ID but no name
  useEffect(() => {
    if (governorateId && wilayaId && !wilayaName) {
      locationsApi
        .getWilayas(governorateId)
        .then((list) => {
          const found = list.find((w) => w.id === wilayaId)
          if (found) setWilayaName(found.nameAr)
        })
        .catch(() => {})
    }
  }, [governorateId, wilayaId, wilayaName])

  // Derived Avatar for display
  const displayAvatar = useMemo(() => {
    if (avatarAction === 'deleted') return null
    if (avatarAction === 'uploaded' && localAvatarUri) return localAvatarUri

    const orig = user?.avatarUrl || user?.avatar || null
    if (!orig) return null
    if (orig.startsWith('http') || orig.startsWith('file')) return orig
    return `${Config.apiUrl}${orig.startsWith('/') ? '' : '/'}${orig}`
  }, [avatarAction, localAvatarUri, user?.avatarUrl, user?.avatar])

  // Clear specific field error on change
  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value)
    if (errors.displayName) {
      setErrors((prev) => ({ ...prev, displayName: undefined }))
    }
  }

  const handlePhoneChange = (value: string) => {
    setPhone(value)
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: undefined }))
    }
  }

  const handleBioChange = (value: string) => {
    setBio(value)
    if (errors.bio) {
      setErrors((prev) => ({ ...prev, bio: undefined }))
    }
  }

  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        dialogService.alert('صلاحية مطلوبة', 'يرجى منح إذن الوصول إلى المعرض من إعدادات الجهاز')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      })

      if (!result.canceled && result.assets?.[0]?.uri) {
        setAvatarAction('uploaded')
        setLocalAvatarUri(result.assets[0].uri)
      }
    } catch (err: unknown) {
      const msg = extractApiErrorMessage(err, 'حدث خطأ أثناء فتح المعرض')
      dialogService.alert('خطأ', msg)
    } finally {
      setShowAvatarSheet(false)
    }
  }

  const pickFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        dialogService.alert('صلاحية مطلوبة', 'يرجى منح إذن الوصول إلى الكاميرا من إعدادات الجهاز')
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      })

      if (!result.canceled && result.assets?.[0]?.uri) {
        setAvatarAction('uploaded')
        setLocalAvatarUri(result.assets[0].uri)
      }
    } catch (err: unknown) {
      const msg = extractApiErrorMessage(err, 'حدث خطأ أثناء فتح الكاميرا')
      dialogService.alert('خطأ', msg)
    } finally {
      setShowAvatarSheet(false)
    }
  }

  const handleDeleteAvatar = () => {
    setAvatarAction('deleted')
    setLocalAvatarUri(null)
    setShowAvatarSheet(false)
  }

  const handlePickImage = () => setShowAvatarSheet(true)

  // Location Pickers
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

    setTimeout(() => {
      setModalType('wilaya')
      setLoadingLocations(true)
      locationsApi
        .getWilayas(gov.id)
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

  // Check for unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return hasProfileUnsavedChanges(user, {
      displayName,
      phone,
      bio,
      governorateId,
      wilayaId,
      avatarAction,
    })
  }, [user, displayName, phone, bio, governorateId, wilayaId, avatarAction])

  // Handle Save
  const handleSave = async () => {
    // 1. Local Validation
    const validation = validateProfileForm({ displayName, phone, bio }, user)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }
    setErrors({})

    try {
      setLoading(true)

      // 2. Upload avatar if a new local image was selected
      let uploadedAvatarUrl: string | null = null
      if (avatarAction === 'uploaded' && localAvatarUri) {
        if (localAvatarUri.startsWith('http://') || localAvatarUri.startsWith('https://')) {
          uploadedAvatarUrl = localAvatarUri
        } else {
          const filePayload = buildUploadFilePayload(localAvatarUri, 'avatar')
          if (filePayload) {
            const formData = new FormData()
            formData.append('file', filePayload as unknown as Blob)
            const uploadRes = await uploadsApi.single(formData)
            const resData = uploadRes.data as { url?: string; path?: string } | undefined
            uploadedAvatarUrl = resData?.url ?? resData?.path ?? null
          }
        }
      }

      // 3. Build minimal PATCH payload
      const patch = buildProfilePatch(user, {
        displayName,
        phone,
        bio,
        governorateId,
        wilayaId,
        avatarAction,
        uploadedAvatarUrl,
      })

      // If no fields changed, inform user and exit
      if (Object.keys(patch).length === 0) {
        dialogService.alert('تنبيه', 'لم يتم تغيير أي بيانات', 'info')
        return
      }

      // 4. Send PATCH /users/me
      const res = await usersApi.updateProfile(patch)

      if (res.data) {
        // 5. Update authStore once with server response
        useAuthStore.setState((state) => ({
          user: state.user
            ? { ...state.user, ...res.data, avatar: res.data.avatarUrl ?? undefined }
            : res.data,
        }))

        // 6. Invalidate active queries
        const currentUserId = res.data.id || useAuthStore.getState().user?.id
        await invalidateProfileQueries(queryClient, currentUserId)

        // 7. Mark saved and return
        isSaveSuccessfulRef.current = true
        dialogService.alert('نجاح', 'تم تحديث الملف الشخصي بنجاح!', 'success')
        router.back()
      }
    } catch (err: unknown) {
      const msg = extractApiErrorMessage(err, 'حدث خطأ أثناء التحديث')
      dialogService.alert('خطأ', msg)
    } finally {
      setLoading(false)
    }
  }

  // Intercept navigation beforeRemove (covers iOS swipe back, Android hardware back, and header back button)
  useEffect(() => {
    if (!navigation || typeof navigation.addListener !== 'function') {
      return
    }

    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (!hasUnsavedChanges || isSaveSuccessfulRef.current) {
        return
      }

      // Prevent navigation action
      e.preventDefault()

      if (isShowingConfirmRef.current) return
      isShowingConfirmRef.current = true

      dialogService.show({
        type: 'confirm',
        title: 'تغييرات غير محفوظة',
        message: 'لديك تعديلات لم يتم حفظها بعد، هل تريد تجاهل التغييرات والخروج؟',
        actions: [
          {
            text: 'متابعة التعديل',
            style: 'cancel',
            onPress: () => {
              isShowingConfirmRef.current = false
            },
          },
          {
            text: 'تجاهل والخروج',
            style: 'destructive',
            onPress: () => {
              isShowingConfirmRef.current = false
              navigation.dispatch(e.data.action)
            },
          },
        ],
      })
    })

    return unsubscribe
  }, [navigation, hasUnsavedChanges])

  // Android hardware back handler fallback
  useEffect(() => {
    const backAction = () => {
      if (hasUnsavedChanges) {
        router.back()
        return true
      }
      return false
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', backAction)
    return () => subscription.remove()
  }, [hasUnsavedChanges])

  const handleBackPress = () => {
    router.back()
  }

  return {
    displayName,
    email,
    phone,
    bio,
    focusedField,
    errors,

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

    setDisplayName: handleDisplayNameChange,
    setEmail,
    setPhone: handlePhoneChange,
    setBio: handleBioChange,
    setFocusedField,
    setShowAvatarSheet,
    setSearchQuery,
    setModalType,

    pickFromGallery,
    pickFromCamera,
    handleDeleteAvatar,
    handlePickImage,

    openGovernoratePicker,
    openWilayaPicker,
    handleSelectGovernorate,
    handleSelectWilaya,

    handleSave,
    handleBackPress,
  }
}
