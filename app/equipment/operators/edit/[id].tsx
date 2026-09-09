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

import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { Colors } from '../../../../src/constants/colors'
import { Radius } from '../../../../src/constants/radius'
import { Spacing } from '../../../../src/constants/spacing'
import { GlassNavBar } from '../../../../src/components/ui/GlassNavBar'
import { AppButton } from '../../../../src/components/ui/AppButton'
import { Stepper } from '../../../../src/components/ui/Stepper'
import { dialogService } from '../../../../src/store/dialogStore'
import { useOperatorItem, useUpdateOperator } from '../../../../src/hooks/useEquipment'
import { useOperatorFormLogic } from '../../../../src/hooks/useOperatorFormLogic'
import { validateOperatorStep } from '../../../../src/hooks/useOperatorValidation'
import { buildOperatorPayload } from '../../../../src/utils/operator-payload'
import { OperatorFormData, OperatorFormErrors } from '../../../../src/types/operatorForm.types'

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

  const [currentStep, setCurrentStep] = useState(1)
  const [errors, setErrors] = useState<OperatorFormErrors>({})

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
    isPriceNegotiable: true,
    governorateId: null,
    wilayaId: null,
    governorateName: '',
    wilayaName: '',
    contactPhone: '',
    whatsapp: '',
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
        isPriceNegotiable: operatorData.isPriceNegotiable ?? (operatorData as any).isNegotiable ?? true,
        governorateId: operatorData.governorateId ?? null,
        wilayaId: operatorData.wilayaId ?? null,
        governorateName: (operatorData as any).governorate?.nameAr || (operatorData as any).governorateName || '',
        wilayaName: (operatorData as any).wilaya?.nameAr || (operatorData as any).wilayaName || '',
        contactPhone: operatorData.contactPhone || '',
        whatsapp: operatorData.whatsapp || operatorData.contactPhone || '',
      })
    }
  }, [operatorData])

  const updateField = (key: keyof OperatorFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      const updated = { ...prev }
      delete updated[key]
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
          dialogService.alert('نجاح', 'تم تحديث بيانات بطاقتك المهنية بنجاح!')
          router.replace(`/equipment/operators/${id}` as any)
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
