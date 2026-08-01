import React, { useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { usePostStore } from '../../src/store/postStore'
import { Colors } from '../../src/constants/colors'

/**
 * Redirect to the unified post flow with category='equipment'.
 * This ensures equipment uses the same professional flow as cars
 * (step2: images → step3: details → step4: location → step5: publish).
 */
export default function AddEquipmentScreen() {
  const router = useRouter()
  const { set, reset } = usePostStore()

  useEffect(() => {
    router.replace('/equipment/new' as any)
  }, [])

  return (
    <View style={styles.root}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
