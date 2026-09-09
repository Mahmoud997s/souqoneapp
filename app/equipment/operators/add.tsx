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

import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
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

const TOTAL_STEPS = 3

export default function AddOperatorScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuthStore()
  const createMutation = useCreateOperator()
  const { data: myOperators, isLoading: loadingMyOp } = useMyOperators(!!user)

  // Safety net: redirect to edit if they already have an operator listing
  useEffect(() => {
    if (!loadingMyOp && myOperators && myOperators.length > 0) {
      router.replace(`/equipment/operators/edit/${myOperators[0].id}` as any)
    }
  }, [loadingMyOp, myOperators])

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

  // Prevent UI flash while checking/redirecting
  if (loadingMyOp || (myOperators && myOperators.length > 0)) {
    return <View style={{ flex: 1, backgroundColor: '#F8F9FA' }} />
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.root, { paddingBottom: insets.bottom }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <LinearGradient
          colors={['#EAF2FF', '#F3EEFF', '#FFF6EE']}
          locations={[0, 0.55, 1]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[s.orb, s.orbPrimary]} pointerEvents="none" />
        <View style={[s.orb, s.orbAccent]} pointerEvents="none" />

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
        <BlurView
          intensity={60}
          tint="light"
          experimentalBlurMethod="dimezisBlurView"
          style={[s.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}
        >
          <View style={s.footerWhiteWash} pointerEvents="none" />
          <View style={s.footerTint} pointerEvents="none" />

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
        </BlurView>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3EEFF',
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orbPrimary: {
    width: 260,
    height: 260,
    top: -80,
    left: -70,
    backgroundColor: Colors.primary,
    opacity: 0.08,
  },
  orbAccent: {
    width: 220,
    height: 220,
    bottom: 80,
    right: -60,
    backgroundColor: Colors.accent,
    opacity: 0.1,
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
    backgroundColor: '#F0FDF9',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: Spacing.space3,
    ...Platform.select({
      ios: {
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
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
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftBadgeTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: '#065F46',
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: Spacing.space4,
    paddingTop: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 8 },
    }),
  },
  footerWhiteWash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
    opacity: 0.08,
  },
  footerTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.primary,
    opacity: 0.04,
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
