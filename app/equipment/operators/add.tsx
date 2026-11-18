import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native'
import { router, Stack } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

import { WizardStickyFooter } from '../../../src/components/ui/WizardStickyFooter'
import { Colors } from '../../../src/constants/colors'
import { Radius } from '../../../src/constants/radius'
import { Spacing } from '../../../src/constants/spacing'
import { GlassNavBar } from '../../../src/components/ui/GlassNavBar'
import { AppButton } from '../../../src/components/ui/AppButton'
import { Stepper } from '../../../src/components/ui/Stepper'
import { dialogService } from '../../../src/store/dialogStore'
import { useAuthStore } from '../../../src/store/authStore'
import { useCreateOperator, useMyOperators } from '../../../src/hooks/useEquipment'
import { useOperatorWizardStore } from '../../../src/store/operatorWizardStore'
import { useOperatorFormLogic } from '../../../src/hooks/useOperatorFormLogic'
import { buildOperatorPayload } from '../../../src/utils/operator-payload'

import { OperatorRoleStep } from '../../../src/components/operators/OperatorRoleStep'
import { OperatorEquipCertsStep } from '../../../src/components/operators/OperatorEquipCertsStep'
import { OperatorRatesLocationStep } from '../../../src/components/operators/OperatorRatesLocationStep'
import { useProfilePhoneGuard } from '../../../src/hooks/useProfilePhoneGuard'
import { ProfilePhoneGuardView } from '../../../src/components/profile/ProfilePhoneGuardView'
import { PublishSuccessView } from '../../../src/components/publish/PublishSuccessView'
import { getPublishRateLimitErrorMessage } from '../../../src/utils/publishRateLimitError'
import { getMutationErrorMessage } from '../../../src/utils/listing-detail/getDetailErrorKind'
import { mapOperatorBackendErrors } from '../../../src/hooks/useOperatorValidation'
import { showPublishErrorDialog } from '../../../src/utils/publishErrorDialog'

const TOTAL_STEPS = 3

export default function AddOperatorScreen() {
  const insets = useSafeAreaInsets()
  const { hasPhone } = useProfilePhoneGuard()
  const { user } = useAuthStore()
  const createMutation = useCreateOperator()
  const { data: myOperators, isLoading: loadingMyOp } = useMyOperators(!!user)

  const hasCheckedInitialOperatorRef = useRef(false)
  const [publishSuccess, setPublishSuccess] = React.useState(false)
  const [createdOperatorId, setCreatedOperatorId] = React.useState<string | null>(null)
  const submitLockRef = useRef<boolean>(false)

  // Safety net: redirect to edit ONLY on initial load if they already have an operator listing
  useEffect(() => {
    if (loadingMyOp || hasCheckedInitialOperatorRef.current) return
    hasCheckedInitialOperatorRef.current = true
    if (!publishSuccess && !submitLockRef.current && myOperators && myOperators.length > 0) {
      router.replace(`/equipment/operators/edit/${myOperators[0].id}`)
    }
  }, [loadingMyOp, myOperators, publishSuccess])

  const {
    currentStep,
    formData,
    errors,
    setStep,
    nextStep,
    prevStep,
    setFormField,
    setFormData,
    clearFieldError,
    setErrors,
    validateStep,
    resetDraft,
  } = useOperatorWizardStore()



  const formLogic = useOperatorFormLogic({
    certifications: formData.certifications,
    equipmentTypes: formData.equipmentTypes,
    specializations: formData.specializations,
    onUpdateCertifications: (certs) => setFormField('certifications', certs),
    onUpdateEquipmentTypes: (types) => setFormField('equipmentTypes', types),
    onUpdateSpecializations: (specs) => setFormField('specializations', specs),
    onClearFieldError: clearFieldError,
  })

  const handleNext = () => {
    const isValid = validateStep(currentStep)
    if (!isValid) return

    if (currentStep < TOTAL_STEPS) {
      nextStep()
    } else {
      handleSubmit()
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      prevStep()
    } else {
      router.back()
    }
  }

  const handleClearDraft = () => {
    dialogService.confirm('مسح المسودة', 'هل أنت متأكد من رغبتك في مسح كافة البيانات والبدء من جديد؟', () => {
      resetDraft()
    })
  }

  const handleSubmit = () => {
    if (submitLockRef.current) return

    const isValid = validateStep(3)
    if (!isValid) return

    submitLockRef.current = true
    const payload = buildOperatorPayload(formData)

    createMutation.mutate(payload, {
      onSuccess: (response) => {
        submitLockRef.current = false
        const createdId =
          (response as { data?: { id?: string }; id?: string } | undefined)?.data?.id ??
          (response as { id?: string } | undefined)?.id ??
          null
        setCreatedOperatorId(createdId)
        resetDraft()
        setPublishSuccess(true)
      },
      onError: (err: unknown) => {
        submitLockRef.current = false
        const apiErr = err as { response?: { status?: number; data?: unknown } } | null | undefined
        const status = apiErr?.response?.status
        if (status === 429) {
          dialogService.alert('خطأ', getPublishRateLimitErrorMessage(err))
          return
        }
        if (status === 400) {
          const mapped = mapOperatorBackendErrors(apiErr?.response?.data)
          if (mapped.hasFieldErrors) {
            setErrors(mapped.fieldErrors)
            setStep(mapped.firstInvalidStep)
            return
          }
        }
        showPublishErrorDialog({
          error: err,
          fallbackMessage: 'حدث خطأ أثناء حفظ البطاقة المهنية',
          onRetry: handleSubmit,
        })
      },
    })
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
        return 'إضافة بطاقة مهنية'
    }
  }

  // Prevent UI flash while checking/redirecting on initial load
  if (!publishSuccess && !submitLockRef.current && (loadingMyOp || (myOperators && myOperators.length > 0))) {
    return <View style={{ flex: 1, backgroundColor: Colors.homeBg }} />
  }

  if (publishSuccess) {
    const primaryTarget = createdOperatorId
      ? `/equipment/operators/${createdOperatorId}`
      : '/equipment/operators/browse'

    return (
      <View style={s.successRoot}>
        <Stack.Screen options={{ headerShown: false }} />
        <PublishSuccessView
          title="تم نشر بطاقتك المهنية بنجاح!"
          subtitle="بطاقتك المهنية متاحة الآن في دليل المشغلين المعتمد بسلطنة عُمان. يمكنك استقبال طلبات العمل والتواصل مباشرة."
          primaryAction={{
            label: 'عرض بطاقتي',
            onPress: () => router.replace(primaryTarget as any),
            testID: 'publish-success-primary-btn',
          }}
          secondaryAction={{
            label: 'الرئيسية',
            onPress: () => router.replace('/'),
            testID: 'publish-success-secondary-btn',
          }}
          onHardwareBack={() => {
            router.replace(primaryTarget as any)
            return true
          }}
        />
      </View>
    )
  }

  if (!hasPhone) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <ProfilePhoneGuardView
          title="إضافة بطاقة مهنية"
          headerVariant="glass"
          onBack={() => router.back()}
        />
      </>
    )
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.root, { paddingBottom: insets.bottom }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

        <GlassNavBar title="إضافة بطاقة مهنية" paddingTop={insets.top} onBackPress={handlePrev} />

        <ScrollView
          style={s.scrollView}
          contentContainerStyle={[s.content, { paddingTop: insets.top + 52 + Spacing.space3 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Stepper currentStep={currentStep} totalSteps={TOTAL_STEPS} title={getStepTitle()} variant="light" />

          {/* Draft Auto-Save Bar */}
          <View style={s.draftBar}>
            <View style={s.draftBadge}>
              <View style={s.draftIconWrap}>
                <Ionicons name="cloud-done-outline" size={13} color={Colors.emerald} />
              </View>
              <Text style={s.draftBadgeTxt}>يتم حفظ مسودتك تلقائياً</Text>
            </View>
            <TouchableOpacity
              style={s.clearDraftBtn}
              onPress={handleClearDraft}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={s.clearDraftTxt}>مسح والبدء من جديد</Text>
            </TouchableOpacity>
          </View>

          {/* ═══════════════ STEP 1: ROLE & BASIC INFO ═══════════════ */}
          {currentStep === 1 && (
            <OperatorRoleStep
              formData={formData}
              errors={errors}
              onUpdateField={setFormField}
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
              onUpdateField={setFormField}
              onLocationChange={(govId, wilId, govNameAr, wilNameAr) => {
                setFormData({
                  governorateId: govId,
                  wilayaId: wilId || null,
                  governorateName: govNameAr,
                  wilayaName: wilNameAr,
                })
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
                variant="glass"
                size="sm"
                onPress={handlePrev}
                style={s.prevBtn}
              />
              <View style={{ flex: 1 }}>
                <AppButton
                  title={currentStep === TOTAL_STEPS ? 'نشر بطاقتي في الدليل' : 'متابعة الخطوة التالية'}
                  size="sm"
                  onPress={handleNext}
                  loading={createMutation.isPending}
                  disabled={createMutation.isPending}
                />
              </View>
            </View>
          ) : (
            <AppButton
              title="متابعة الخطوة التالية"
              size="sm"
              onPress={handleNext}
              loading={createMutation.isPending}
              disabled={createMutation.isPending}
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
  successRoot: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.space4 - 4,
    paddingBottom: 136,
  },
  draftBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: Spacing.space3,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primaryDark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  draftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  draftIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftBadgeTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  clearDraftBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.dangerSoftBg,
  },
  clearDraftTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.error,
    textAlign: 'left',
    writingDirection: 'rtl',
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
