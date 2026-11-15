import { useEffect } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'
import { DetailStates } from '../../src/components/listing-detail/DetailStates'
import { postEntryRoute } from '../../src/navigation/listingRoutes'

export default function LegacyPostTabRedirect() {
  useEffect(() => {
    router.replace(postEntryRoute())
  }, [])

  return (
    <View style={{ flex: 1 }} testID="legacy-post-tab-redirect">
      <DetailStates kind="loading" />
    </View>
  )
}
