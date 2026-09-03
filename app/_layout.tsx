import React, { useEffect, useState } from 'react'
import { I18nManager, Platform, Text, TextInput } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import {
  useFonts,
  Almarai_400Regular,
  Almarai_700Bold,
  Almarai_800ExtraBold,
} from '@expo-google-fonts/almarai'
import * as SplashScreen from 'expo-splash-screen'
import * as Notifications from 'expo-notifications'
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '../src/api/queryClient'
import { useAuthStore } from '../src/store/authStore'
import { registerForPushNotifications } from '../src/services/notifications'
import { navigateFromNotification } from '../src/utils/notificationRouter'
import { usersApi } from '../src/api/users'
import { NavVisibilityProvider } from '../src/context/NavVisibilityContext'
import { GlobalSocketHandler } from '../src/components/GlobalSocketHandler'
import { GlobalDialog } from '../src/components/ui/GlobalDialog'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { ChatSyncService } from '../src/services/ChatSyncService'

export { queryClient }

configureReanimatedLogger({ level: ReanimatedLogLevel.warn, strict: false })

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [rtlReady, setRtlReady] = useState(I18nManager.isRTL)

  useEffect(() => {
    if (!I18nManager.isRTL) {
      I18nManager.allowRTL(true)
      I18nManager.forceRTL(true)
    }
    setRtlReady(true)
  }, [])

  const [fontsLoaded] = useFonts({
    Almarai_400Regular,
    Almarai_700Bold,
    Almarai_800ExtraBold,
  })

  const { isLoggedIn, isLoading, initialize } = useAuthStore()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => { 
    initialize()
    ChatSyncService.init(queryClient)
  }, [])

  useEffect(() => {
    if (!isLoggedIn) return
    registerForPushNotifications().then((token) => {
      if (token) {
        console.log('[Push] Token:', token)
        usersApi.updatePushToken(token).catch(e => console.warn('[Push] Failed to send token (Endpoint might not exist yet)'))
      }
    })

    const sub1 = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[Push] Received:', notification.request.content.title)
    })
    const sub2 = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as any
      navigateFromNotification(data)
    })
    return () => { sub1.remove(); sub2.remove() }
  }, [isLoggedIn])

  useEffect(() => {
    if (isLoading || !fontsLoaded) return
    SplashScreen.hideAsync().catch(() => {})

    const inAuth = segments[0] === '(auth)'

    if (isLoggedIn && inAuth) {
      if (segments[1] === 'verify-email' || segments[1] === 'register') {
        return // Allow verify-email to display, and allow register to finish its transition
      }
      router.replace('/(tabs)')
      return
    }

    if (!isLoggedIn && !inAuth) {
      router.replace('/(auth)/login')
    }
  }, [isLoggedIn, isLoading, fontsLoaded, segments])

  if (!rtlReady || !fontsLoaded || isLoading) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <NavVisibilityProvider>
          <BottomSheetModalProvider>
            <GlobalSocketHandler />
            <Stack screenOptions={{ headerShown: false }} />
            <GlobalDialog />
          </BottomSheetModalProvider>
        </NavVisibilityProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
