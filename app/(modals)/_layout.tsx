import React from 'react'
import { View } from 'react-native'
import { Stack } from 'expo-router'
import { Colors } from '../../src/constants/colors'
import { ModalToastHost } from '../../src/components/ui/GlobalToast'

export default function ModalsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen
          name="post-category"
          options={{
            contentStyle: { backgroundColor: 'transparent' },
            headerShown: false,
            gestureEnabled: true,
          }}
        />
        <Stack.Screen
          name="filters"
          options={{
            presentation: 'modal',
            contentStyle: { backgroundColor: Colors.surface },
            headerShown: false,
            gestureEnabled: true,
          }}
        />
        <Stack.Screen
          name="image-viewer"
          options={{
            presentation: 'fullScreenModal',
            headerShown: false,
            gestureEnabled: true,
          }}
        />
      </Stack>
      <ModalToastHost />
    </View>
  )
}
