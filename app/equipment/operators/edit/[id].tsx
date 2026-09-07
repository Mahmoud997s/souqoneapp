import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native'
import { useRouter, useLocalSearchParams, Stack } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

import { Colors } from '../../../../src/constants/colors'
import { Radius } from '../../../../src/constants/radius'
import { Spacing } from '../../../../src/constants/spacing'
import { AppHeader } from '../../../../src/components/ui/AppHeader'
import { AppButton } from '../../../../src/components/ui/AppButton'
import { Stepper } from '../../../../src/components/ui/Stepper'
import { dialogService } from '../../../../src/store/dialogStore'
import { useOperatorItem, useUpdateOperator } from '../../../../src/hooks/useEquipment'
import { useOperatorFormLogic } from '../../../../src/hooks/useOperatorFormLogic'
import { buildOperatorPayload } from '../../../../src/utils/operator-payload'
import { useOperatorWizardStore, mapOperatorItemToFormData } from '../../../../src/store/operatorWizardStore'

import { OperatorRoleStep } from '../../../../src/components/operators/OperatorRoleStep'
import { OperatorEquipCertsStep } from '../../../../src/components/operators/OperatorEquipCertsStep'
import { OperatorRatesLocationStep } from '../../../../src/components/operators/OperatorRatesLocationStep'

const TOTAL_STEPS = 3

export default function EditOperatorScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const updateMutation = useUpdateOperator()
  const { data: operatorData, isLoading, isError } = useOperatorItem(id as string)

  const {
    currentStep,
    formData,
    errors,
    nextStep,
    prevStep,
    setFormField,
    setFormData,
    clearFieldError,
    validateStep,
    initEditMode,
    resetDraft,
  } = useOperatorWizardStore()

  // Initialize edit mode when operatorData resolves
  const initializedRef = useRef(false)
  useEffect(() => {
    if (operatorData && id && !initializedRef.current) {
      initializedRef.current = true
      const mapped = mapOperatorItemToFormData(operatorData)
      initEditMode(id as string, mapped)
    }
  }, [operatorData, id, initEditMode])

  // Clean up store state when exiting screen
  useEffect(() => {
    return () => {
      resetDraft()
    }
  }, [resetDraft])

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

  const handleSubmit = () => {
    const editId = formData.editListingId || (id as string)
    if (!editId) return
    const isValid = validateStep(3)
    if (!isValid) return

    const payload = buildOperatorPayload(formData)

    updateMutation.mutate(
      { id: editId, data: payload },
      {
        onSuccess: () => {
          resetDraft()
          dialogService.alert('نجاح', 'تم تحديث بيانات بطاقتك المهنية بنجاح!')
          router.replace(`/equipment/operators/${editId}` as any)
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || err?.message || 'حدث خطأ أثناء تحديث البطاقة المهنية'
          dialogService.alert('خطأ', Array.isArray(msg) ? msg[0] : msg)
        },
      }
    )
  }

  if (isLoading) {
    return (
      <View style={[s.root, s.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={s.loadingTxt}>جاري تحميل بيانات البطاقة المهنية...</Text>
      </View>
    )
  }

  if (isError || !operatorData) {
    return (
      <View style={[s.root, s.center]}>
        <Ionicons name="alert-circle-outline" size={54} color={Colors.error} />
        <Text style={s.errorTxt}>تعذّر جلب بيانات المشغل، يرجى المحاولة لاحقاً</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => router.back()}>
          <Text style={s.retryTxt}>العودة للخلف</Text>
        </TouchableOpacity>
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
        <AppHeader title="تعديل البطاقة المهنية" showBack onLeftPress={handlePrev} />

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Stepper currentStep={currentStep} totalSteps={TOTAL_STEPS} title={getStepTitle()} />

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
        <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
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
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.space4,
  },
  content: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space2,
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: Spacing.space4,
    paddingTop: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 8 },
    }),
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
