import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
} from 'react-native'
import { useRouter, useLocalSearchParams, Stack } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

import { WizardStickyFooter } from '../../../../src/components/ui/WizardStickyFooter'
import { Colors } from '../../../../src/constants/colors'
import { Radius } from '../../../../src/constants/radius'
import { Spacing } from '../../../../src/constants/spacing'
import { GlassNavBar } from '../../../../src/components/ui/GlassNavBar'
import { AppButton } from '../../../../src/components/ui/AppButton'
import { Stepper } from '../../../../src/components/ui/Stepper'
import { dialogService } from '../../../../src/store/dialogStore'
import { useOperatorItem, useUpdateOperator } from '../../../../src/hooks/useEquipment'
import { useOperatorFormLogic } from '../../../../src/hooks/useOperatorFormLogic'
import { validateOperatorStep, mapOperatorBackendErrors, OperatorFormErrors } from '../../../../src/hooks/useOperatorValidation'
import { buildOperatorPayload } from '../../../../src/utils/operator-payload'
import { OperatorWizardFormData as OperatorFormData } from '../../../../src/store/operatorWizardStore'
import { DetailStates, DetailStateKind } from '../../../../src/components/listing-detail/DetailStates'
import { getDetailErrorKind } from '../../../../src/utils/listing-detail/getDetailErrorKind'
import { PublishSuccessView } from '../../../../src/components/publish/PublishSuccessView'
import { getPublishRateLimitErrorMessage } from '../../../../src/utils/publishRateLimitError'
import { getMutationErrorMessage } from '../../../../src/utils/listing-detail/getDetailErrorKind'

import { OperatorRoleStep } from '../../../../src/components/operators/OperatorRoleStep'
import { OperatorEquipCertsStep } from '../../../../src/components/operators/OperatorEquipCertsStep'
import { OperatorRatesLocationStep } from '../../../../src/components/operators/OperatorRatesLocationStep'

const TOTAL_STEPS = 3

export default function EditOperatorScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const updateMutation = useUpdateOperator()
  const { data: operatorData, isLoading, isError, error, refetch } = useOperatorItem(id as string)

  const [currentStep, setCurrentStep] = useState(1)
  const [errors, setErrors] = useState<OperatorFormErrors>({})
  const [publishSuccess, setPublishSuccess] = useState(false)

  const [formData, setFormData] = useState<OperatorFormData>({
    operatorType: 'OPERATOR',
    title: '',
    description: '',
    experienceYears: '',
    equipmentTypes: [],
    specializations: [],
    certifications: [],
    dailyRate: '',
    hourlyRate: '',
    currency: 'OMR',
    isPriceNegotiable: true,
    governorateId: null,
    wilayaId: null,
    governorateName: '',
    wilayaName: '',
    whatsappEnabled: false,
    profileImageUrl: '',
  })

  useEffect(() => {
    if (operatorData) {
      setFormData({
        operatorType: operatorData.operatorType || 'OPERATOR',
        title: operatorData.title || '',
        description: operatorData.description || '',
        experienceYears: operatorData.experienceYears != null ? String(operatorData.experienceYears) : '',
        equipmentTypes: operatorData.equipmentTypes || [],
        specializations: operatorData.specializations || [],
        certifications: operatorData.certifications || [],
        dailyRate: operatorData.dailyRate ? String(operatorData.dailyRate) : '',
        hourlyRate: operatorData.hourlyRate ? String(operatorData.hourlyRate) : '',
        currency: operatorData.currency || 'OMR',
        isPriceNegotiable: operatorData.isPriceNegotiable ?? (operatorData as any).isNegotiable ?? true,
        governorateId: operatorData.governorateId ?? null,
        wilayaId: operatorData.wilayaId ?? null,
        governorateName: (operatorData as any).governorate?.nameAr || (operatorData as any).governorateName || '',
        wilayaName: (operatorData as any).wilaya?.nameAr || (operatorData as any).wilayaName || '',
        whatsappEnabled: operatorData.whatsappEnabled === true,
        profileImageUrl: operatorData.profileImageUrl || '',
      })
    }
  }, [operatorData])

  const updateField = (key: keyof OperatorFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      const updated = { ...prev }
      delete updated[key]
      if (
        (key === 'dailyRate' || key === 'hourlyRate') &&
        (updated.dailyRate?.includes('على الأقل') || updated.hourlyRate?.includes('على الأقل'))
      ) {
        delete updated.dailyRate
        delete updated.hourlyRate
      }
      return updated
    })
  }

  const clearFieldError = (key: string) => {
    setErrors((prev) => {
      const updated = { ...prev }
      delete (updated as any)[key]
      return updated
    })
  }

  const formLogic = useOperatorFormLogic({
    certifications: formData.certifications,
    equipmentTypes: formData.equipmentTypes,
    specializations: formData.specializations,
    onUpdateCertifications: (certs) => updateField('certifications', certs),
    onUpdateEquipmentTypes: (types) => updateField('equipmentTypes', types),
    onUpdateSpecializations: (specs) => updateField('specializations', specs),
    onClearFieldError: clearFieldError,
  })

  const handleNext = () => {
    const { isValid, errors: stepErrors } = validateOperatorStep(currentStep, formData)
    if (!isValid) {
      setErrors(stepErrors)
      return
    }

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS))
    } else {
      handleSubmit()
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => Math.max(prev - 1, 1))
    } else {
      router.back()
    }
  }

  const handleSubmit = () => {
    if (!id) return
    const { isValid, errors: finalErrors } = validateOperatorStep(3, formData)
    if (!isValid) {
      setErrors(finalErrors)
      return
    }

    const payload = buildOperatorPayload(formData)

    updateMutation.mutate(
      { id, data: payload },
      {
        onSuccess: () => {
          setPublishSuccess(true)
        },
        onError: (err: any) => {
          const status = err?.response?.status
          if (status === 429) {
            dialogService.alert('خطأ', getPublishRateLimitErrorMessage(err))
            return
          }
          if (status === 400) {
            const mapped = mapOperatorBackendErrors(err?.response?.data)
            if (mapped.hasFieldErrors) {
              setErrors(mapped.fieldErrors)
              setCurrentStep(mapped.firstInvalidStep)
              return
            }
          }
          dialogService.alert('خطأ', getMutationErrorMessage(err, 'حدث خطأ أثناء تحديث البطاقة المهنية'))
        },
      }
    )
  }

  if (publishSuccess) {
    return (
      <View style={[s.root, { paddingBottom: insets.bottom, paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <PublishSuccessView
          title="تم تحديث بطاقتك المهنية بنجاح!"
          subtitle="تم حفظ كافة التعديلات على بطاقتك المهنية وتحديثها في دليل المشغلين."
          primaryAction={{
            label: 'عرض البطاقة المهنية',
            onPress: () => router.replace(`/equipment/operators/${id}` as any),
            testID: 'publish-success-primary-btn',
          }}
          secondaryAction={{
            label: 'العودة للخلف',
            onPress: () => router.back(),
            testID: 'publish-success-secondary-btn',
          }}
          onHardwareBack={() => {
            router.replace(`/equipment/operators/${id}` as any)
            return true
          }}
        />
      </View>
    )
  }

  if (isLoading) {
    return (
      <View style={[s.root, { paddingBottom: insets.bottom, paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <DetailStates kind="loading" onBack={() => router.back()} />
      </View>
    )
  }

  if (isError || !operatorData) {
    const rawKind = getDetailErrorKind(error)
    const kind: DetailStateKind =
      rawKind === 'offline' || rawKind === 'timeout' || rawKind === 'serverError' || rawKind === 'notFound'
        ? rawKind
        : 'error'
    return (
      <View style={[s.root, { paddingBottom: insets.bottom, paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <DetailStates
          kind={kind}
          onBack={() => router.back()}
          onRetry={() => refetch()}
        />
      </View>
    )
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'البيانات المهنية والتخصص'
      case 2:
        return 'المعدات والرخص المعتمدة'
      case 3:
        return 'التسعير وموقع العمل والتواصل'
      default:
        return 'تعديل البطاقة المهنية'
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.root, { paddingBottom: insets.bottom }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

        <GlassNavBar title="تعديل البطاقة المهنية" paddingTop={insets.top} onBackPress={handlePrev} />

        <ScrollView
          style={s.scrollView}
          contentContainerStyle={[s.content, { paddingTop: insets.top + 52 + Spacing.space3 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Stepper currentStep={currentStep} totalSteps={TOTAL_STEPS} title={getStepTitle()} variant="light" />

          {/* ═══════════════ STEP 1: ROLE & BASIC INFO ═══════════════ */}
          {currentStep === 1 && (
            <OperatorRoleStep
              formData={formData}
              errors={errors}
              onUpdateField={updateField}
            />
          )}

          {/* ═══════════════ STEP 2: EQUIPMENT & CERTS ═══════════════ */}
          {currentStep === 2 && (
            <OperatorEquipCertsStep
              formData={formData}
              errors={errors}
              onToggleEquipment={formLogic.toggleEquipmentType}
              onPickCertificateImages={formLogic.pickCertificateImages}
              onRemoveCertificate={formLogic.removeCert}
              onAddTextCertificate={formLogic.addTextCert}
              onAddSpecialization={formLogic.addSpec}
              onRemoveSpecialization={formLogic.removeSpec}
              isUploading={formLogic.isUploading}
            />
          )}

          {/* ═══════════════ STEP 3: PRICING & LOCATION ═══════════════ */}
          {currentStep === 3 && (
            <OperatorRatesLocationStep
              formData={formData}
              errors={errors}
              onUpdateField={updateField}
              onLocationChange={(govId, wilId, govNameAr, wilNameAr) => {
                setFormData((prev) => ({
                  ...prev,
                  governorateId: govId,
                  wilayaId: wilId || null,
                  governorateName: govNameAr,
                  wilayaName: wilNameAr,
                }))
                clearFieldError('governorate')
                if (wilId) clearFieldError('city')
              }}
              onClearFieldError={clearFieldError}
            />
          )}
        </ScrollView>

        {/* ── STICKY FOOTER NAVIGATION ── */}
        <WizardStickyFooter paddingBottom={Math.max(insets.bottom, 12)}>
          {currentStep > 1 ? (
            <View style={s.footerBtnGroup}>
              <AppButton
                title="السابق"
                variant="outline"
                size="sm"
                onPress={handlePrev}
                style={s.prevBtn}
              />
              <View style={{ flex: 1 }}>
                <AppButton
                  title={currentStep === TOTAL_STEPS ? 'حفظ وتحديث البطاقة' : 'متابعة الخطوة التالية'}
                  size="sm"
                  onPress={handleNext}
                  loading={updateMutation.isPending}
                  disabled={updateMutation.isPending}
                />
              </View>
            </View>
          ) : (
            <AppButton
              title="متابعة الخطوة التالية"
              size="sm"
              onPress={handleNext}
              loading={updateMutation.isPending}
              disabled={updateMutation.isPending}
            />
          )}
        </WizardStickyFooter>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.homeBg,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.space4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.space4 - 4,
    paddingBottom: 120,
  },
  loadingTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textMuted,
    marginTop: 12,
  },
  errorTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.error,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  retryTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: '#ffffff',
  },
  footerBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  prevBtn: {
    minWidth: 80,
  },
})
