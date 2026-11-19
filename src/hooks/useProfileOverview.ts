import React from 'react'
import { router, useFocusEffect } from 'expo-router'
import { loginRoute } from '../navigation/listingRoutes'
import { useAuthStore } from '../store/authStore'
import { useMyListings } from './useListings'
import { useFavoriteIds } from '../features/favorites/useFavoriteIds'
import { useMyOperators } from './useEquipment'
import { useOperatorNavigation } from './useOperatorNavigation'
import {
  PersistedProfileCounts,
  readProfileCounts,
  writeProfileCounts,
} from '../utils/profileCountsStorage'
import { toastService } from '../store/toastStore'
import { locationsApi } from '../api/locations'
import { authApi } from '../api/auth'
import { Colors } from '../constants/colors'
import { Config } from '../constants/config'
import { MenuItem } from '../types/profile.types'

export function useProfileOverview() {
  const { user, logout } = useAuthStore()
  const {
    data: myListings,
    isError: myListingsIsError,
    isRefetching: myListingsIsRefetching,
    refetch: refetchMyListings,
  } = useMyListings()
  const {
    ids: favoriteIds,
    data: favoriteIdsData,
    isError: favoritesIsError,
    refetch: refetchFavorites,
  } = useFavoriteIds()
  const { data: myOperators, isLoading: loadingMyOperators } = useMyOperators(!!user)
  const { navigateToAddOperator } = useOperatorNavigation()

  const [persistedCounts, setPersistedCounts] = React.useState<{
    userId: string
    counts: PersistedProfileCounts
  } | null>(null)

  React.useEffect(() => {
    const uid = user?.id
    if (!uid) {
      setPersistedCounts(null)
      return
    }
    let cancelled = false
    setPersistedCounts((prev) => (prev?.userId === uid ? prev : null))
    void readProfileCounts(uid).then((counts) => {
      if (!cancelled && counts) {
        setPersistedCounts({ userId: uid, counts })
      }
    })
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const hasLiveListings = myListings !== undefined
  const hasLiveFavorites = favoriteIdsData !== undefined

  React.useEffect(() => {
    const uid = user?.id
    if (!uid || (!hasLiveListings && !hasLiveFavorites)) return
    const nextCounts: PersistedProfileCounts = {
      listingsCount: hasLiveListings
        ? myListings.length
        : persistedCounts?.userId === uid
          ? persistedCounts.counts.listingsCount
          : undefined,
      favoritesCount: hasLiveFavorites
        ? favoriteIds.size
        : persistedCounts?.userId === uid
          ? persistedCounts.counts.favoritesCount
          : undefined,
    }
    void writeProfileCounts(uid, nextCounts)
  }, [user?.id, hasLiveListings, hasLiveFavorites, myListings, favoriteIds.size])

  const [locationName, setLocationName] = React.useState('')
  const [isProfileRefreshError, setIsProfileRefreshError] = React.useState(false)
  const [isRefreshingProfile, setIsRefreshingProfile] = React.useState(false)

  const refreshProfile = React.useCallback(async () => {
    setIsRefreshingProfile(true)
    setIsProfileRefreshError(false)
    try {
      const res = await authApi.me()
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
    } catch {
      setIsProfileRefreshError(true)
    } finally {
      setIsRefreshingProfile(false)
    }
  }, [])

  // Refresh user data from API when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      refreshProfile()
    }, [refreshProfile])
  )

  const isStaleError = Boolean(
    user && (isProfileRefreshError || myListingsIsError || favoritesIsError)
  )

  const isRefreshing = Boolean(
    isRefreshingProfile || myListingsIsRefetching
  )

  const handleRetryProfile = React.useCallback(async () => {
    await Promise.all([
      refreshProfile(),
      refetchMyListings().catch(() => {}),
      refetchFavorites().catch(() => {}),
    ])
  }, [refreshProfile, refetchMyListings, refetchFavorites])

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
    toastService.confirm({
      title: 'تسجيل الخروج؟',
      message: 'هل أنت متأكد من تسجيل الخروج؟',
      intent: 'primary',
      confirmLabel: 'خروج',
      cancelLabel: 'إلغاء',
      onConfirm: async () => {
        await logout()
        toastService.show({ kind: 'success', title: 'تم تسجيل الخروج' })
        router.replace(loginRoute())
      },
    })
  }

  // Group 1: النشاط التجاري والإعلانات
  const operatorItem: MenuItem | null =
    !user || loadingMyOperators
      ? null
      : myOperators && myOperators.length > 0
        ? {
            icon: 'construct-outline',
            title: 'ملفي كمشغّل',
            subTitle: 'عرض وتحديث بطاقتك المهنية',
            route: `/equipment/operators/${myOperators[0].id}`,
            iconColor: Colors.primary,
          }
        : {
            icon: 'add-circle-outline',
            title: 'سجّل كمشغّل الآن وتلقَّ عروض عمل',
            subTitle: 'انضم إلى دليل مشغلي المعدات المعتمد',
            onPress: navigateToAddOperator,
            iconColor: Colors.primary,
          }

  const scopedPersisted =
    user?.id && persistedCounts?.userId === user.id ? persistedCounts.counts : null

  const listingsBadge: number | string = hasLiveListings
    ? myListings.length
    : scopedPersisted?.listingsCount !== undefined
      ? scopedPersisted.listingsCount
      : '—'

  const favoritesBadge: number | string = hasLiveFavorites
    ? favoriteIds.size
    : scopedPersisted?.favoritesCount !== undefined
      ? scopedPersisted.favoritesCount
      : '—'

  const activitiesItems: MenuItem[] = [
    {
      icon: 'grid-outline',
      title: 'إعلاناتي',
      subTitle: 'إدارة وتعديل الإعلانات المنشورة',
      route: '/profile/my-listings',
      iconColor: Colors.primary,
      badge: listingsBadge,
    },
    {
      icon: 'bookmark-outline',
      title: 'المفضلة',
      subTitle: 'الإعلانات والخدمات المحفوظة',
      route: '/profile/favorites',
      iconColor: Colors.primary,
      badge: favoritesBadge,
    },
    ...(user?.id
      ? [
          {
            icon: 'storefront-outline',
            title: 'ملفي العام كبائع',
            subTitle: 'كما يراه المشترون',
            route: `/profile/${user.id}`,
            iconColor: Colors.primary,
          } satisfies MenuItem,
        ]
      : []),
    ...(operatorItem ? [operatorItem] : []),
  ]

  // Group 2: إعدادات الحساب والأمان
  const accountItems: MenuItem[] = [
    {
      icon: 'person-outline',
      title: 'تعديل الملف الشخصي',
      subTitle: 'الاسم، الصورة، والموقع الجغرافي',
      route: '/profile/edit-profile',
      iconColor: Colors.slateBody,
    },
    {
      icon: 'notifications-outline',
      title: 'الإشعارات والتنبيهات',
      subTitle: 'الرسائل، العروض، وحالة الطلبات',
      route: '/profile/notifications',
      iconColor: Colors.slateBody,
    },
    {
      icon: 'settings-outline',
      title: 'إعدادات الحساب وكلمة المرور',
      subTitle: 'الأمان، اللغة، وتفضيلات التطبيق',
      route: '/profile/settings',
      iconColor: Colors.slateBody,
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
    listingsCount: listingsBadge,
    favoritesCount: favoritesBadge,
    handleBack,
    handleLogout,
    activitiesItems,
    accountItems,
    isStaleError,
    isRefreshing,
    handleRetryProfile,
  }
}
