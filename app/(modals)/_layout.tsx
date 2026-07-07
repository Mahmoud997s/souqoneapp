import { Stack } from 'expo-router'

export default function ModalsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="post-category"
        options={{
          presentation: 'modal',
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
