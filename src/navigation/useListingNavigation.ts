import { useCallback, useState } from 'react'
import { router as expoRouter, useRouter } from 'expo-router'
import { useAuthStore } from '../store/authStore'
import { dialogService } from '../store/dialogStore'
import { listingsApi } from '../api/listings'
import { partsApi } from '../api/parts'
import { servicesApi } from '../api/services'
import {
  detailRoute,
  editRoute,
  loginRoute,
  normalizeListingEntityType,
  postEntryRoute,
  startEdit,
  type CarDetailApiInput,
  type EditableListingPayload,
} from './listingRoutes'

function unwrapApiData<T>(res: T | { data: T }): T {
  if (res && typeof res === 'object' && 'data' in res && (res as { data?: T }).data !== undefined) {
    return (res as { data: T }).data
  }
  return res as T
}

export function useListingNavigation() {
  let router = expoRouter
  try {
    if (typeof useRouter === 'function') {
      const r = useRouter()
      if (r && typeof r.push === 'function') {
        router = r
      }
    }
  } catch {
    // Fallback to global expo-router singleton in unit tests that only mock `router`
  }
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const [isEditingLoading, setIsEditingLoading] = useState(false)

  const goToLogin = useCallback(
    (redirect?: string, method: 'push' | 'replace' = 'push') => {
      const target = loginRoute(redirect)
      if (method === 'replace') {
        router.replace(target)
      } else {
        router.push(target)
      }
    },
    [router]
  )

  const openListing = useCallback(
    (entityType: string | null | undefined, id: string) => {
      router.push(detailRoute(entityType, id))
    },
    [router]
  )

  const openPostListing = useCallback(
    (options?: { requireAuth?: boolean }) => {
      if (options?.requireAuth && !isLoggedIn) {
        goToLogin('/(modals)/post-category')
        return
      }
      router.push(postEntryRoute())
    },
    [goToLogin, isLoggedIn, router]
  )

  const editListing = useCallback(
    async (
      entityType: string | null | undefined,
      id: string,
      item?: EditableListingPayload | CarDetailApiInput
    ): Promise<boolean> => {
      const normalized = normalizeListingEntityType(entityType)

      if (item) {
        const route = startEdit(normalized, item)
        router.push(route)
        return true
      }

      if (
        normalized === 'BUS_LISTING' ||
        normalized === 'EQUIPMENT_LISTING' ||
        normalized === 'OPERATOR_LISTING'
      ) {
        router.push(editRoute(normalized, id))
        return true
      }

      setIsEditingLoading(true)
      try {
        let fetched: EditableListingPayload | CarDetailApiInput
        if (normalized === 'SPARE_PART') {
          const res = await partsApi.getById(id)
          fetched = unwrapApiData(res) as EditableListingPayload
        } else if (normalized === 'CAR_SERVICE') {
          const res = await servicesApi.getById(id)
          fetched = unwrapApiData(res) as EditableListingPayload
        } else {
          const res = await listingsApi.getById(id)
          const rawCar = unwrapApiData(res)
          fetched = {
            ...rawCar,
            status: (rawCar as { status?: string }).status ?? 'ACTIVE',
            viewCount: (rawCar as { viewCount?: number }).viewCount ?? 0,
          } as unknown as CarDetailApiInput
        }
        const route = startEdit(normalized, fetched)
        router.push(route)
        return true
      } catch {
        dialogService.alert('خطأ', 'تعذر تحميل بيانات الإعلان، يرجى المحاولة مرة أخرى')
        return false
      } finally {
        setIsEditingLoading(false)
      }
    },
    [router]
  )

  return {
    isEditingLoading,
    openListing,
    editListing,
    openPostListing,
    goToLogin,
  }
}
