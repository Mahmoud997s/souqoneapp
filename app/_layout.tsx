import React, { useEffect, useState } from 'react'
import { I18nManager, Platform } from 'react-native'
import { reloadAppAsync } from 'expo'
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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '../src/store/authStore'
import { registerForPushNotifications } from '../src/services/notifications'
import { usersApi } from '../src/api/users'
import { NavVisibilityProvider } from '../src/context/NavVisibilityContext'
import { GlobalSocketHandler } from '../src/components/GlobalSocketHandler'
import { GlobalDialog } from '../src/components/ui/GlobalDialog'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'

configureReanimatedLogger({ level: ReanimatedLogLevel.warn, strict: false })

SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
})

import { Text, TextInput } from 'react-native'

interface TextWithDefaultProps {
  defaultProps?: any;
}

const CustomText = Text as unknown as TextWithDefaultProps;
if (CustomText.defaultProps == null) CustomText.defaultProps = {};
CustomText.defaultProps.allowFontScaling = false;
CustomText.defaultProps.style = {  };

const CustomTextInput = TextInput as unknown as TextWithDefaultProps;
if (CustomTextInput.defaultProps == null) CustomTextInput.defaultProps = {};
CustomTextInput.defaultProps.allowFontScaling = false;
CustomTextInput.defaultProps.style = {  };

// Deep patch for styled Text components (handles forwardRef render)
const oldTextRender = (Text as any).render;
if (oldTextRender) {
  (Text as any).render = function (...args: any[]) {
    const origin = oldTextRender.call(this, ...args);
    if (!origin) return origin;
    return React.cloneElement(origin, {
      style: [{  }, origin.props.style],
    });
  };
}
const oldTextInputRender = (TextInput as any).render;
if (oldTextInputRender) {
  (TextInput as any).render = function (...args: any[]) {
    const origin = oldTextInputRender.call(this, ...args);
    if (!origin) return origin;
    return React.cloneElement(origin, {
      style: [{  }, origin.props.style],
    });
  };
}

export default function RootLayout() {
  const [rtlReady, setRtlReady] = useState(I18nManager.isRTL)

  useEffect(() => {
    if (!I18nManager.isRTL) {
      I18nManager.forceRTL(true)
      I18nManager.allowRTL(true)
      if (Platform.OS === 'ios') {
        reloadAppAsync()
      } else {
        setRtlReady(true)
      }
    } else {
      setRtlReady(true)
    }
  }, [])

  const [fontsLoaded] = useFonts({
    Almarai_400Regular,
    Almarai_700Bold,
    Almarai_800ExtraBold,
  })

  const { isLoggedIn, isLoading, initialize } = useAuthStore()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => { initialize() }, [])

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
      if (data?.roomId) router.push(`/chat/${data.roomId}` as any)
      else if (data?.listingId) router.push(`/listings/${data.listingId}` as any)
    })
    return () => { sub1.remove(); sub2.remove() }
  }, [isLoggedIn])

  useEffect(() => {
    if (isLoading || !fontsLoaded) return
    SplashScreen.hideAsync()

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
