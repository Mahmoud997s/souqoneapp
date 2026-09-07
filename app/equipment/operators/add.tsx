import React, { useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { router, Stack } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

import { Colors } from '../../../src/constants/colors'
import { Radius } from '../../../src/constants/radius'
import { Spacing } from '../../../src/constants/spacing'
import { AppHeader } from '../../../src/components/ui/AppHeader'
import { AppButton } from '../../../src/components/ui/AppButton'
import { Stepper } from '../../../src/components/ui/Stepper'
import { dialogService } from '../../../src/store/dialogStore'
import { useAuthStore } from '../../../src/store/authStore'
import { useCreateOperator } from '../../../src/hooks/useEquipment'
import { useOperatorWizardStore } from '../../../src/store/operatorWizardStore'
import { useOperatorFormLogic } from '../../../src/hooks/useOperatorFormLogic'
import { buildOperatorPayload } from '../../../src/utils/operator-payload'

import { OperatorRoleStep } from '../../../src/components/operators/OperatorRoleStep'
import { OperatorEquipCertsStep } from '../../../src/components/operators/OperatorEquipCertsStep'
import { OperatorRatesLocationStep } from '../../../src/components/operators/OperatorRatesLocationStep'

const TOTAL_STEPS = 3

export default function AddOperatorScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuthStore()
  const createMutation = useCreateOperator()

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
    resetDraft,
  } = useOperatorWizardStore()

  // Auto-fill phone from auth user if empty
  useEffect(() => {
    if (user?.phone && !formData.contactPhone) {
      setFormField('contactPhone', user.phone)
      if (!formData.whatsapp) {
        setFormField('whatsapp', user.phone)
      }
    }
  }, [user?.phone])

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
        dialogService.alert('تم بنجاح', 'تم نشر بطاقتك المهنية في دليل المشغلين بنجاح!')
        router.replace('/equipment/operators/browse')
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || 'حدث خطأ أثناء حفظ البطاقة المهنية'
        dialogService.alert('خطأ', Array.isArray(msg) ? msg[0] : msg)
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.root, { paddingBottom: insets.bottom }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <AppHeader title="إضافة بطاقة مهنية" showBack onLeftPress={handlePrev} />

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Stepper currentStep={currentStep} totalSteps={TOTAL_STEPS} title={getStepTitle()} />

          {/* Draft Auto-Save Bar */}
          <View style={s.draftBar}>
            <View style={s.draftBadge}>
              <Ionicons name="cloud-done-outline" size={14} color="#059669" />
              <Text style={s.draftBadgeTxt}>يتم حفظ مسودتك تلقائياً</Text>
            </View>
            <TouchableOpacity onPress={handleClearDraft} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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
  content: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space2,
    paddingBottom: 120,
  },
  draftBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: Spacing.space3,
  },
  draftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  draftBadgeTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: '#047857',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  clearDraftTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.error,
    textDecorationLine: 'underline',
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
