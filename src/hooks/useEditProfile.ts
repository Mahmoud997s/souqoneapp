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
  shouldBlockForFailedAvatarUpload,
  mapProfileBackendErrors,
} from '../utils/profileValidation'
import { normalizeOmaniPhoneDigits } from '../utils/authValidation'
import { invalidateProfileQueries } from '../utils/profileQueryInvalidation'
import { requestPermission, type PermissionAdapter } from '../utils/requestPermission'
import { getMutationErrorMessage } from '../utils/listing-detail/getDetailErrorKind'
import { getPublishRateLimitErrorMessage } from '../utils/publishRateLimitError'

function normalizeArabic(text: string): string {
  return text
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLowerCase()
    .trim()
}

const profileMediaAdapter: PermissionAdapter = {
  kind: 'mediaLibrary',
  titleAr: 'إذن الوصول مطلوب',
  deniedMessageAr: 'يرجى السماح بالوصول لمعرض الصور لتتمكن من اختيار صورة للملف الشخصي',
  blockedMessageAr: 'يرجى السماح بالوصول لمعرض الصور من إعدادات الهاتف لتتمكن من اختيار صورة للملف الشخصي',
  request: async () => {
    return await ImagePicker.requestMediaLibraryPermissionsAsync()
  },
}

const profileCameraAdapter: PermissionAdapter = {
  kind: 'camera',
  titleAr: 'صلاحية مطلوبة',
  deniedMessageAr: 'يرجى منح إذن الوصول إلى الكاميرا من إعدادات الجهاز لالتقاط صورة للملف الشخصي',
  blockedMessageAr: 'يرجى تفعيل صلاحية الكاميرا من إعدادات الهاتف لتتمكن من التقاط صورة للملف الشخصي',
  request: async () => {
    return await ImagePicker.requestCameraPermissionsAsync()
  },
}

export function useEditProfile() {
  const { user } = useAuthStore()
  let navigation: any = null
  try {
    navigation = typeof useNavigation === 'function' ? useNavigation() : null
  } catch {
    navigation = null
  }

  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(normalizeOmaniPhoneDigits(user?.phone))
  const [bio, setBio] = useState(user?.bio || '')

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
      setPhone(normalizeOmaniPhoneDigits(user.phone))
      setBio(user.bio || '')
      setGovernorateId(user.governorateId || null)
      setWilayaId(user.wilayaId || null)
      setGovernorateName(user.governorateRef?.nameAr || user.governorate || '')
      setWilayaName(user.wilayaRef?.nameAr || user.city || '')
      setAvatarAction('unchanged')
      setLocalAvatarUri(null)
      setErrors({})
    }
  }, [user])

  // Clear field errors on change
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

  // Active avatar display URL
  const displayAvatar = useMemo(() => {
    if (avatarAction === 'deleted') {
      return null
    }
    if (avatarAction === 'uploaded' && localAvatarUri) {
      return localAvatarUri
    }
    const rawStored = user?.avatarUrl || user?.avatar
    if (!rawStored) return null
    if (rawStored.startsWith('http://') || rawStored.startsWith('https://')) {
      return rawStored
    }
    return `${Config.apiUrl}${rawStored.startsWith('/') ? '' : '/'}${rawStored}`
  }, [avatarAction, localAvatarUri, user?.avatarUrl, user?.avatar])

  // Image Picker Logic (Gallery & Camera via S4 requestPermission)
  const pickFromGallery = async () => {
    try {
      const perm = await requestPermission(profileMediaAdapter)
      if (!perm.granted) {
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
      const msg = getMutationErrorMessage(err, 'حدث خطأ أثناء فتح المعرض')
      dialogService.alert('خطأ', msg)
    } finally {
      setShowAvatarSheet(false)
    }
  }

  const pickFromCamera = async () => {
    try {
      const perm = await requestPermission(profileCameraAdapter)
      if (!perm.granted) {
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
      const msg = getMutationErrorMessage(err, 'حدث خطأ أثناء فتح الكاميرا')
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
      } catch (err: unknown) {
        dialogService.alert('خطأ', getMutationErrorMessage(err, 'تعذر تحميل قائمة المحافظات'))
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
    } catch (err: unknown) {
      dialogService.alert('خطأ', getMutationErrorMessage(err, 'تعذر تحميل قائمة الولايات'))
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
          try {
            const filePayload = buildUploadFilePayload(localAvatarUri, 'avatar')
            if (filePayload) {
              const formData = new FormData()
              formData.append('file', filePayload as unknown as Blob)
              const uploadRes = await uploadsApi.single(formData)
              const resData = uploadRes.data as { url?: string; path?: string } | undefined
              uploadedAvatarUrl = resData?.url ?? resData?.path ?? null
            }
          } catch {
            uploadedAvatarUrl = null
          }
        }
      }

      // If avatar upload was attempted but failed or produced no URL, abort save immediately
      if (shouldBlockForFailedAvatarUpload(avatarAction, uploadedAvatarUrl)) {
        dialogService.alert('خطأ', 'تعذر رفع الصورة، حاول مرة أخرى')
        return
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
      const status = (err as any)?.response?.status

      // 429 Rate Limit
      if (status === 429) {
        dialogService.alert('محاولات كثيرة', getPublishRateLimitErrorMessage(err))
        return
      }

      // 400 Validation / S7 Field Errors
      if (status === 400) {
        const { fieldErrors, nonFieldErrors } = mapProfileBackendErrors(err)
        if (Object.keys(fieldErrors).length > 0) {
          setErrors((prev) => ({ ...prev, ...fieldErrors }))
        }
        if (nonFieldErrors.length > 0) {
          dialogService.alert('خطأ في البيانات', nonFieldErrors.join('\n'))
        } else if (Object.keys(fieldErrors).length === 0) {
          dialogService.alert('خطأ في البيانات', getMutationErrorMessage(err, 'البيانات المدخلة غير صحيحة'))
        }
        return
      }

      // Network / 5xx / Fallback via getMutationErrorMessage
      const msg = getMutationErrorMessage(err, 'حدث خطأ أثناء التحديث')
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

  // Android hardware back button fallback
  useEffect(() => {
    const onBackPress = () => {
      if (!hasUnsavedChanges || isSaveSuccessfulRef.current) {
        return false
      }

      if (isShowingConfirmRef.current) return true
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
              router.back()
            },
          },
        ],
      })
      return true
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)
    return () => subscription.remove()
  }, [hasUnsavedChanges])

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

    setDisplayName: handleDisplayNameChange,
    setPhone: handlePhoneChange,
    setBio: handleBioChange,
    setFocusedField,
    setSearchQuery,
    setShowAvatarSheet,
    setModalType,

    handlePickImage,
    pickFromGallery,
    pickFromCamera,
    handleDeleteAvatar,

    openGovernoratePicker,
    openWilayaPicker,
    handleSelectGovernorate,
    handleSelectWilaya,

    handleSave,
    handleBackPress: () => router.back(),
    hasUnsavedChanges,
  }
}
