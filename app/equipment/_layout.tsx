import { Stack } from 'expo-router'

export default function EquipmentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="browse" />
      <Stack.Screen name="add" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="operators/browse" />
      <Stack.Screen name="operators/add" />
      <Stack.Screen name="operators/[id]" />
    </Stack>
  )
}
