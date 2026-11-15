import { useCallback, useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { DetailStates } from '../../src/components/listing-detail/DetailStates'
import { detailRoute } from '../../src/navigation/listingRoutes'
import {
  resolveLegacyListingById,
  type LegacyRedirectErrorKind,
} from '../../src/navigation/legacyRedirectResolver'

export default function LegacyListingDetailRedirect() {
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>()
  const [errorKind, setErrorKind] = useState<LegacyRedirectErrorKind | null>(null)
  const isMountedRef = useRef(true)
  const requestSeqRef = useRef(0)
  const inFlightKeyRef = useRef<string | null>(null)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const resolve = useCallback(async () => {
    if (!id) {
      setErrorKind('notFound')
      return
    }

    if (type) {
      setErrorKind(null)
      router.replace(detailRoute(type, id))
      return
    }

    const requestKey = `${id}::${type ?? ''}`
    if (inFlightKeyRef.current === requestKey) {
      return
    }

    const seq = ++requestSeqRef.current
    inFlightKeyRef.current = requestKey
    setErrorKind(null)

    try {
      const result = await resolveLegacyListingById(id)
      if (!isMountedRef.current || requestSeqRef.current !== seq) {
        return
      }
      if (result.ok) {
        router.replace(detailRoute(result.entityType, id))
        return
      }
      setErrorKind(result.errorKind)
    } finally {
      if (requestSeqRef.current === seq) {
        inFlightKeyRef.current = null
      }
    }
  }, [id, type])

  useEffect(() => {
    void resolve()
  }, [resolve])

  const handleBack = useCallback(() => {
    router.back()
  }, [])

  if (errorKind) {
    return (
      <View style={{ flex: 1 }} testID="legacy-listing-redirect-error">
        <DetailStates kind={errorKind} onRetry={() => void resolve()} onBack={handleBack} />
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }} testID="legacy-listing-redirect-loading">
      <DetailStates kind="loading" onBack={handleBack} />
    </View>
  )
}
