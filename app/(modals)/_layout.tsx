import { Stack } from 'expo-router'

export default function ModalsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="post-category"
        options={{
          presentation: 'transparentModal',
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor: 'transparent' },
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="filters"
        options={{
          presentation: 'modal',
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
