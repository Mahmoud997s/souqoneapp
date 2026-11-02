import { Stack } from 'expo-router'
import { Colors } from '../../src/constants/colors'

export default function ModalsLayout() {
  return (
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
  )
}
