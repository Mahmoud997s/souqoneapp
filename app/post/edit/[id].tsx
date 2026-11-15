import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { DetailStates } from '../../../src/components/listing-detail/DetailStates'
import {
  resolveLegacyEditRoute,
  type LegacyRedirectErrorKind,
} from '../../../src/navigation/legacyRedirectResolver'

export default function LegacyPostEditRedirect() {
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>()
  const [errorKind, setErrorKind] = useState<LegacyRedirectErrorKind | null>(null)

  const resolve = useCallback(async () => {
    if (!id) {
      setErrorKind('notFound')
      return
    }

    setErrorKind(null)
    const result = await resolveLegacyEditRoute(id, type)
    if (result.ok) {
      router.replace(result.href)
      return
    }
    setErrorKind(result.errorKind)
  }, [id, type])

  useEffect(() => {
    void resolve()
  }, [resolve])

  const handleBack = useCallback(() => {
    router.back()
  }, [])

  if (errorKind) {
    return (
      <View style={{ flex: 1 }} testID="legacy-edit-redirect-error">
        <DetailStates kind={errorKind} onRetry={() => void resolve()} onBack={handleBack} />
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }} testID="legacy-edit-redirect-loading">
      <DetailStates kind="loading" onBack={handleBack} />
    </View>
  )
}
