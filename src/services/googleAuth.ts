import {
  GoogleSignin,
  statusCodes,
  isSuccessResponse,
  isErrorWithCode,
} from '@react-native-google-signin/google-signin'

export const GOOGLE_WEB_CLIENT_ID =
  '1012134031692-edrdr8o0i4jecido8hiqbc6rolb6l330.apps.googleusercontent.com'

export const GOOGLE_IOS_CLIENT_ID =
  '1012134031692-o6e428ak1oqrbvgi4ud86rsqfja9ej1k.apps.googleusercontent.com'

/**
 * تهيئة إعدادات Google Sign-In المركزية
 */
export function configureGoogleSignIn(): void {
  try {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      offlineAccess: false,
    })
  } catch (e) {
    console.warn('[GoogleSignIn] Configuration error:', e)
  }
}

export { GoogleSignin, statusCodes, isSuccessResponse, isErrorWithCode }
