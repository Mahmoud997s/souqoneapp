import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { busesApi } from '../../../src/api/buses'
import { DetailStates, type DetailStateKind } from '../../../src/components/listing-detail/DetailStates'
import { Colors } from '../../../src/constants/colors'
import { useBusWizardStore } from '../../../src/store/busWizardStore'
import { busListingToFormData } from '../../../src/utils/listing-detail/busListingToFormData'
import { getDetailErrorKind } from '../../../src/utils/listing-detail/getDetailErrorKind'

const RETRYABLE_STATE_KINDS = new Set<DetailStateKind>(['offline', 'timeout', 'serverError'])

export default function EditBusScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>()
  const busId = useMemo(() => {
    const rawId = Array.isArray(id) ? id[0] : id
    return typeof rawId === 'string' ? rawId.trim() : ''
  }, [id])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown | null>(null)
  const [missingId, setMissingId] = useState(false)

  const isMountedRef = useRef(true)
  const requestIdRef = useRef(0)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      requestIdRef.current += 1
    }
  }, [])

  const handleBack = useCallback(() => {
    if (typeof router.canGoBack === 'function' && router.canGoBack()) {
      router.back()
      return
    }
    router.replace('/buses' as any)
  }, [])

  const load = useCallback(async () => {
    if (!busId) {
      if (isMountedRef.current) {
        setMissingId(true)
        setError(null)
        setLoading(false)
      }
      return
    }

    const reqId = ++requestIdRef.current
    if (isMountedRef.current) {
      setMissingId(false)
      setLoading(true)
      setError(null)
    }

    try {
      const response = await busesApi.getById(busId)
      const listing = (response as any)?.data ?? response

      if (!isMountedRef.current || requestIdRef.current !== reqId) return

      if (!listing || !listing.id) {
        setMissingId(true)
        setError(null)
        setLoading(false)
        return
      }

      const formData = busListingToFormData(listing)
      useBusWizardStore
        .getState()
        .setEditMode(String(listing.id), formData, (listing as any).version)
      router.replace('/buses/new' as any)
    } catch (err) {
      if (!isMountedRef.current || requestIdRef.current !== reqId) return
      setError(err ?? new Error('FETCH_ERROR'))
      setLoading(false)
    }
  }, [busId])

  useEffect(() => {
    void load()
  }, [load])

  const renderState = () => {
    if (loading) {
      return <DetailStates kind="loading" onBack={handleBack} />
    }

    if (missingId) {
      return <DetailStates kind="notFound" onBack={handleBack} />
    }

    const errorKind = getDetailErrorKind(error)

    if (errorKind === 'notFound') {
      return <DetailStates kind="notFound" onBack={handleBack} />
    }

    if (errorKind === 'forbidden') {
      return (
        <DetailStates
          kind="error"
          title="غير مصرح بالتعديل"
          subtitle="لا تملك صلاحية تعديل هذا الإعلان."
          onBack={handleBack}
        />
      )
    }

    if (errorKind === 'unauthorized') {
      return (
        <DetailStates
          kind="error"
          title="يلزم تسجيل الدخول"
          subtitle="يرجى تسجيل الدخول للمتابعة في تعديل الإعلان."
          onRetry={load}
          onBack={handleBack}
        />
      )
    }

    const stateKind: DetailStateKind = RETRYABLE_STATE_KINDS.has(errorKind as DetailStateKind)
      ? (errorKind as DetailStateKind)
      : 'error'

    return <DetailStates kind={stateKind} onRetry={load} onBack={handleBack} />
  }

  return (
    <View style={s.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {renderState()}
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
})
