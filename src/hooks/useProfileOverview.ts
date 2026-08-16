import React from 'react'
import { router, useFocusEffect } from 'expo-router'
import { useAuthStore } from '../store/authStore'
import { useMyListings, useFavorites } from './useListings'
import { dialogService } from '../store/dialogStore'
import { locationsApi } from '../api/locations'
import { authApi } from '../api/auth'
import { Colors } from '../constants/colors'
import { Config } from '../constants/config'
import { MenuItem } from '../types/profile.types'

export function useProfileOverview() {
  const { user, logout } = useAuthStore()
  const { data: myListings } = useMyListings()
  const { data: favorites } = useFavorites()

  const [locationName, setLocationName] = React.useState('')

  // Refresh user data from API when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      authApi.me().then((res) => {
        const data = res.data as any
        const freshUser = data?.user ?? data
        if (freshUser?.id) {
          useAuthStore.setState((state) => {
            const merged = { ...state.user, ...freshUser }
            // If API explicitly returns null or empty for avatar, clear both avatar and avatarUrl
            if (freshUser.avatarUrl === null || freshUser.avatarUrl === '') {
              merged.avatarUrl = undefined
              merged.avatar = undefined
            }
            if (freshUser.avatar === null || freshUser.avatar === '') {
              merged.avatar = undefined
            }
            return { user: merged }
          })
        }
      }).catch(() => {})
    }, [])
  )

  // Resolve location name cleanly
  React.useEffect(() => {
    if (user?.wilayaRef?.nameAr) {
      setLocationName(user.wilayaRef.nameAr)
    } else if (user?.governorateRef?.nameAr) {
      setLocationName(user.governorateRef.nameAr)
    } else if (user?.city) {
      setLocationName(user.city)
    } else if (user?.governorate) {
      setLocationName(user.governorate)
    } else if (user?.governorateId && user?.wilayaId) {
      locationsApi.getWilayas(user.governorateId).then((list) => {
        const found = list.find((w) => w.id === user.wilayaId)
        if (found) setLocationName(found.nameAr)
      }).catch(() => {})
    } else if (user?.governorateId) {
      locationsApi.getGovernorates().then((list) => {
        const found = list.find((g) => g.id === user.governorateId)
        if (found) setLocationName(found.nameAr)
      }).catch(() => {})
    } else {
      setLocationName('')
    }
  }, [user])

  const displayName = user?.displayName || (user as any)?.name || user?.username || 'مستخدم'
  const handle = user?.username ? `@${user.username}` : ''

  // Prioritize avatarUrl; if explicitly empty or null, do NOT fall back to legacy avatar
  const rawAvatar =
    user?.avatarUrl !== undefined && user?.avatarUrl !== null
      ? user.avatarUrl
      : user?.avatar || null

  const avatarUrl = rawAvatar
    ? rawAvatar.startsWith('http')
      ? rawAvatar
      : `${Config.apiUrl}${rawAvatar.startsWith('/') ? '' : '/'}${rawAvatar}`
    : null

  const firstLetter = displayName.charAt(0)

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace('/(tabs)' as any)
    }
  }

  const handleLogout = () => {
    dialogService.confirm(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      async () => { await logout(); router.replace('/(auth)/login') },
      'تسجيل الخروج', 'إلغاء', true
    )
  }

  // Group 1: النشاط التجاري والإعلانات
  const activitiesItems: MenuItem[] = [
    {
      icon: 'grid-outline',
      title: 'إعلاناتي',
      subTitle: 'إدارة وتعديل الإعلانات المنشورة',
      route: '/profile/my-listings',
      iconColor: Colors.primary,
      badge: myListings?.length,
    },
    {
      icon: 'bookmark-outline',
      title: 'المفضلة',
      subTitle: 'الإعلانات والخدمات المحفوظة',
      route: '/profile/favorites',
      iconColor: '#0284C7',
      badge: favorites?.length,
    },
  ]

  // Group 2: خدمات النقل واللوجستيات
  const transportItems: MenuItem[] = [
    {
      icon: 'cube-outline',
      title: 'طلبات النقل',
      subTitle: 'متابعة شحناتك والطلبات الجارية',
      route: '/transport/my-requests',
      iconColor: '#059669',
    },
    {
      icon: 'pricetags-outline',
      title: 'عروضي المقدمة',
      subTitle: 'عروض الأسعار المرسلة للعملاء',
      route: '/transport/my-quotes',
      iconColor: '#2563EB',
    },
    {
      icon: 'calendar-outline',
      title: 'حجوزاتي',
      subTitle: 'تأكيدات الحجز والمواعيد',
      route: '/transport/bookings',
      iconColor: '#7C3AED',
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'سجّل كناقل معتمد',
      subTitle: 'انضم لشبكة الناقلين وابدأ العمل',
      route: '/transport/carrier-register',
      iconColor: '#D97706',
    },
  ]

  // Group 3: إعدادات الحساب والأمان
  const accountItems: MenuItem[] = [
    {
      icon: 'person-outline',
      title: 'تعديل الملف الشخصي',
      subTitle: 'الاسم، الصورة، والموقع الجغرافي',
      route: '/profile/edit-profile',
      iconColor: '#334155',
    },
    {
      icon: 'notifications-outline',
      title: 'الإشعارات والتنبيهات',
      subTitle: 'الرسائل، العروض، وحالة الطلبات',
      route: '/profile/notifications',
      iconColor: '#334155',
    },
    {
      icon: 'settings-outline',
      title: 'إعدادات الحساب وكلمة المرور',
      subTitle: 'الأمان، اللغة، وتفضيلات التطبيق',
      route: '/profile/settings',
      iconColor: '#334155',
    },
  ]

  return {
    user,
    locationName,
    displayName,
    handle,
    avatarUrl,
    firstLetter,
    myListings,
    favorites,
    handleBack,
    handleLogout,
    activitiesItems,
    transportItems,
    accountItems,
  }
}
