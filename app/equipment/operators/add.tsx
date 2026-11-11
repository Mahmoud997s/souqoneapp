import React, { useEffect } from 'react'
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

const TOTAL_STEPS = 3

export default function AddOperatorScreen() {
  const insets = useSafeAreaInsets()
  const { hasPhone } = useProfilePhoneGuard()
  const { user } = useAuthStore()
  const createMutation = useCreateOperator()
  const { data: myOperators, isLoading: loadingMyOp } = useMyOperators(!!user)

  // Safety net: redirect to edit if they already have an operator listing
  useEffect(() => {
    if (!loadingMyOp && myOperators && myOperators.length > 0) {
      router.replace(`/equipment/operators/edit/${myOperators[0].id}` as any)
    }
  }, [loadingMyOp, myOperators])

  const [publishSuccess, setPublishSuccess] = React.useState(false)

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
    const isValid = validateStep(3)
    if (!isValid) return

    const payload = buildOperatorPayload(formData)

    createMutation.mutate(payload, {
      onSuccess: () => {
        resetDraft()
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
            setStep(mapped.firstInvalidStep)
            return
          }
        }
        dialogService.alert('خطأ', getMutationErrorMessage(err, 'حدث خطأ أثناء حفظ البطاقة المهنية'))
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

  // Prevent UI flash while checking/redirecting
  if (loadingMyOp || (myOperators && myOperators.length > 0)) {
    return <View style={{ flex: 1, backgroundColor: '#F8F9FA' }} />
  }

  if (publishSuccess) {
    return (
      <View style={[s.root, { paddingBottom: insets.bottom, paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <PublishSuccessView
          title="تم نشر بطاقتك المهنية بنجاح!"
          subtitle="بطاقتك المهنية متاحة الآن في دليل المشغلين المعتمد بسلطنة عُمان. يمكنك استقبال طلبات العمل والتواصل مباشرة."
          primaryAction={{
            label: 'عرض دليل المشغلين',
            onPress: () => router.replace('/equipment/operators/browse'),
            testID: 'publish-success-primary-btn',
          }}
          secondaryAction={{
            label: 'الرئيسية',
            onPress: () => router.replace('/'),
            testID: 'publish-success-secondary-btn',
          }}
          onHardwareBack={() => {
            router.replace('/equipment/operators/browse')
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
                <Ionicons name="cloud-done-outline" size={13} color="#059669" />
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
              formData={formData as any}
              errors={errors}
              onUpdateField={(k, v) => setFormField(k as any, v)}
            />
          )}

          {/* ═══════════════ STEP 2: EQUIPMENT & CERTS ═══════════════ */}
          {currentStep === 2 && (
            <OperatorEquipCertsStep
              formData={formData as any}
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
              formData={formData as any}
              errors={errors}
              onUpdateField={(k, v) => setFormField(k as any, v)}
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
                variant="outline"
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.space4 - 4,
    paddingBottom: 120,
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
    backgroundColor: Colors.inputBg,
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
    backgroundColor: '#FEE2E2',
  },
  clearDraftTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: '#DC2626',
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
