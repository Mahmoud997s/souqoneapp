import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useLocalSearchParams, router } from 'expo-router'
import { equipmentApi } from '../../../src/api/equipment'
import { useEquipmentWizardStore } from '../../../src/store/equipmentWizardStore'
import { DetailStates, type DetailStateKind } from '../../../src/components/listing-detail/DetailStates'
import { getDetailErrorKind } from '../../../src/utils/listing-detail/getDetailErrorKind'

function mapErrorToDetailStateKind(error: unknown): Exclude<DetailStateKind, 'loading'> {
  const kind = getDetailErrorKind(error)
  if (kind === 'offline' || kind === 'timeout' || kind === 'serverError' || kind === 'notFound') {
    return kind
  }
  return 'error'
}

export default function EditEquipmentLoaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const initEditMode = useEquipmentWizardStore((s) => s.initEditMode)
  const [errorState, setErrorState] = useState<{ raw: unknown } | null>(null)
  const activeRequestKeyRef = useRef<string | null>(null)
  const requestIdRef = useRef(0)
  const isMountedRef = useRef(true)

  const load = useCallback(async () => {
    if (!id || activeRequestKeyRef.current === id) return
    activeRequestKeyRef.current = id
    const thisRequestId = ++requestIdRef.current
    setErrorState(null)
    try {
      const res = await equipmentApi.getById(id)
      if (!isMountedRef.current || requestIdRef.current !== thisRequestId) return
      const listing = (res as any)?.data ?? res

      initEditMode(listing)
      router.replace('/equipment/new')
    } catch (err: unknown) {
      if (!isMountedRef.current || requestIdRef.current !== thisRequestId) return
      setErrorState({ raw: err })
    } finally {
      if (activeRequestKeyRef.current === id) {
        activeRequestKeyRef.current = null
      }
    }
  }, [id, initEditMode])

  useEffect(() => {
    isMountedRef.current = true
    if (id) {
      load()
    }
    return () => {
      requestIdRef.current += 1
      activeRequestKeyRef.current = null
    }
  }, [id, load])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const handleBack = useCallback(() => {
    router.back()
  }, [])

  if (!id) {
    return (
      <DetailStates
        kind="notFound"
        title="الإعلان غير موجود"
        subtitle="تعذر العثور على معرّف إعلان المعدة المطلوب تعديله."
        onBack={handleBack}
      />
    )
  }

  if (errorState) {
    const detailKind = mapErrorToDetailStateKind(errorState.raw)
    return (
      <DetailStates
        kind={detailKind}
        title={detailKind === 'error' ? 'تعذر تحميل بيانات المعدة' : undefined}
        subtitle={
          detailKind === 'error'
            ? 'حدث خطأ غير متوقع أثناء جلب بيانات إعلان المعدة. يرجى المحاولة مرة أخرى.'
            : undefined
        }
        onRetry={load}
        onBack={handleBack}
      />
    )
  }

  return (
    <DetailStates
      kind="loading"
      onBack={handleBack}
    />
  )
}
