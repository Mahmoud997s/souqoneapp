import type {
  GoogleSignin as GoogleSigninType,
  statusCodes as statusCodesType,
} from '@react-native-google-signin/google-signin'

export const GOOGLE_WEB_CLIENT_ID =
  '758459912346-5h3e7cbnrg0tvbirumv0mve5f5kpclft.apps.googleusercontent.com'

export const GOOGLE_IOS_CLIENT_ID =
  '758459912346-6iq3h20of8q3dbbfj3lvt91168u3vpgk.apps.googleusercontent.com'

let GoogleSigninModule: typeof GoogleSigninType | null = null
let statusCodesMap: typeof statusCodesType = {} as any
let isSuccessResponseFn: ((response: any) => boolean) | null = null
let isErrorWithCodeFn: ((error: any) => boolean) | null = null
let isNativeModuleAvailable = false

try {
  // Dynamically require to prevent crash in Expo Go where native binary is missing
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const RNGoogleSignin = require('@react-native-google-signin/google-signin')
  if (RNGoogleSignin?.GoogleSignin) {
    GoogleSigninModule = RNGoogleSignin.GoogleSignin
    statusCodesMap = RNGoogleSignin.statusCodes || {}
    isSuccessResponseFn = RNGoogleSignin.isSuccessResponse
    isErrorWithCodeFn = RNGoogleSignin.isErrorWithCode
    isNativeModuleAvailable = true
  }
} catch {
  // In Expo Go or when native binary doesn't contain RNGoogleSignin
  isNativeModuleAvailable = false
}

export const isGoogleSignInAvailable = (): boolean => isNativeModuleAvailable

/**
 * تهيئة إعدادات Google Sign-In المركزية
 */
export function configureGoogleSignIn(): void {
  if (!isNativeModuleAvailable || !GoogleSigninModule) {
    return
  }
  try {
    GoogleSigninModule.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      offlineAccess: false,
    })
  } catch (e) {
    console.warn('[GoogleSignIn] Configuration error:', e)
  }
}

export const GoogleSignin = GoogleSigninModule
export const statusCodes = statusCodesMap
export const isSuccessResponse = (res: any): boolean => {
  if (isSuccessResponseFn) return isSuccessResponseFn(res)
  return res?.type === 'success'
}
export const isErrorWithCode = (err: any): boolean => {
  if (isErrorWithCodeFn) return isErrorWithCodeFn(err)
  return Boolean(err && typeof err === 'object' && 'code' in err)
}
