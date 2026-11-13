import { Linking } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { dialogService } from '../store/dialogStore'

export interface PermissionResponse {
  status?: string
  granted?: boolean
  canAskAgain?: boolean
  accessPrivileges?: 'all' | 'limited' | 'none' | string
  expires?: number | 'never' | string
  [key: string]: unknown
}

export interface PermissionAdapter {
  kind: string
  deniedMessageAr: string
  titleAr?: string
  blockedMessageAr?: string
  request(): Promise<PermissionResponse>
}

export type PermissionResultStatus = 'granted' | 'denied-can-ask-again' | 'denied-blocked'

export interface PermissionGrantedResult {
  status: 'granted'
  granted: true
  canAskAgain: boolean
}

export interface PermissionDeniedCanAskAgainResult {
  status: 'denied-can-ask-again'
  granted: false
  canAskAgain: true
}

export interface PermissionDeniedBlockedResult {
  status: 'denied-blocked'
  granted: false
  canAskAgain: false
}

export type PermissionResult =
  | PermissionGrantedResult
  | PermissionDeniedCanAskAgainResult
  | PermissionDeniedBlockedResult

export const mediaLibraryAdapter: PermissionAdapter = {
  kind: 'mediaLibrary',
  titleAr: 'إذن الوصول مطلوب',
  deniedMessageAr: 'يرجى السماح بالوصول لمعرض الصور لتتمكن من إرفاق صور القطعة',
  blockedMessageAr: 'يرجى السماح بالوصول لمعرض الصور من إعدادات الهاتف لتتمكن من إرفاق صور القطعة',
  request: async () => {
    return await ImagePicker.requestMediaLibraryPermissionsAsync()
  },
}

export const operatorCertPermissionAdapter: PermissionAdapter = {
  kind: 'mediaLibrary',
  titleAr: 'إذن الوصول مطلوب',
  deniedMessageAr: 'يرجى السماح بالوصول لمكتبة الصور لإرفاق شهادتك أو رخصتك المهنية',
  blockedMessageAr: 'يرجى السماح بالوصول لمعرض الصور من إعدادات الهاتف لإرفاق شهادتك أو رخصتك المهنية',
  request: async () => {
    return await ImagePicker.requestMediaLibraryPermissionsAsync()
  },
}

export const operatorAvatarPermissionAdapter: PermissionAdapter = {
  kind: 'mediaLibrary',
  titleAr: 'صلاحية مطلوبة',
  deniedMessageAr: 'يرجى منح إذن الوصول إلى المعرض لاختيار صورتك الشخصية',
  blockedMessageAr: 'يرجى منح إذن الوصول إلى المعرض من إعدادات الجهاز لاختيار صورتك الشخصية',
  request: async () => {
    return await ImagePicker.requestMediaLibraryPermissionsAsync()
  },
}

/**
 * Standardized permission requester with unified Arabic presentation and settings redirection.
 * Reuses dialogService.confirm / dialogService.alert without creating new UI components.
 */
export async function requestPermission(
  adapter: PermissionAdapter
): Promise<PermissionResult> {
  const title = adapter.titleAr ?? 'إذن الوصول مطلوب'

  try {
    const response = await adapter.request()

    const isGranted = Boolean(
      response.granted ||
      response.status === 'granted' ||
      response.accessPrivileges === 'limited'
    )

    if (isGranted) {
      return {
        status: 'granted',
        granted: true,
        canAskAgain: response.canAskAgain ?? true,
      }
    }

    const isBlocked = response.canAskAgain === false

    if (isBlocked) {
      const blockedMessage = adapter.blockedMessageAr ?? adapter.deniedMessageAr
      dialogService.confirm(
        title,
        blockedMessage,
        () => {
          Linking.openSettings().catch(() => {})
        },
        'فتح الإعدادات',
        'إلغاء'
      )

      return {
        status: 'denied-blocked',
        granted: false,
        canAskAgain: false,
      }
    }

    dialogService.alert(title, adapter.deniedMessageAr)
    return {
      status: 'denied-can-ask-again',
      granted: false,
      canAskAgain: true,
    }
  } catch (_err) {
    dialogService.alert(title, adapter.deniedMessageAr)
    return {
      status: 'denied-can-ask-again',
      granted: false,
      canAskAgain: true,
    }
  }
}
