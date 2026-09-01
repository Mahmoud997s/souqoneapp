import React, { useState, useEffect } from 'react'
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
import { useMutation } from '@tanstack/react-query'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'

import { Colors } from '../../src/constants/colors'
import { Radius } from '../../src/constants/radius'
import { Spacing } from '../../src/constants/spacing'
import { GlassNavBar } from '../../src/components/ui/GlassNavBar'
import { AppButton } from '../../src/components/ui/AppButton'
import { Stepper } from '../../src/components/ui/Stepper'
import { dialogService } from '../../src/store/dialogStore'
import { uploadsApi } from '../../src/api/uploads'
import { partsApi } from '../../src/api/parts'
import { carsApi, CarBrand } from '../../src/api/cars'
import { usePartWizardStore, PartFormData } from '../../src/store/partWizardStore'
import { usePartFormLogic } from '../../src/hooks/usePartFormLogic'
import { validateStep } from '../../src/hooks/usePartValidation'

import { PartStep1Category } from '../../src/components/parts/wizard/PartStep1Category'
import { PartStep2Images } from '../../src/components/parts/wizard/PartStep2Images'
import { PartStep3Details } from '../../src/components/parts/wizard/PartStep3Details'
import { PartStep4Compatibility } from '../../src/components/parts/wizard/PartStep4Compatibility'
import { PartStep5Pricing } from '../../src/components/parts/wizard/PartStep5Pricing'
import { PartStep6Review } from '../../src/components/parts/wizard/PartStep6Review'

const TOTAL_STEPS = 6

export default function NewPartListingScreen() {
  const insets = useSafeAreaInsets()

  const [brands, setBrands] = useState<CarBrand[]>([])

  useEffect(() => {
    let mounted = true
    carsApi
      .getBrands()
      .then((brandsData) => {
        if (mounted && Array.isArray(brandsData)) {
          setBrands(brandsData)
        }
      })
      .catch((err) => {
        console.warn('Failed to load brands for compatibility step:', err)
      })
    return () => {
      mounted = false
    }
  }, [])

  const createMutation = useMutation({
    mutationFn: (data: any) => partsApi.create(data),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => partsApi.update(id, data),
  })

  const {
    currentStep,
    formData,
    setField,
    setFields,
    setLocation,
    nextStep: storeNextStep,
    prevStep,
    goToStep,
    reset,
  } = usePartWizardStore()

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isUploadingImages, setIsUploadingImages] = useState(false)

  const formLogic = usePartFormLogic(formData, setField, setLocation)

  const clearFieldError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const setFormFieldAndClearError = (field: keyof PartFormData, value: any) => {
    setField(field, value)
    clearFieldError(field as string)
  }

  const validateCurrentStep = () => {
    const result = validateStep(currentStep, formData)
    setErrors(result.errors)
    return result.isValid
  }

  const handleNext = () => {
    if (!validateCurrentStep()) return

    if (currentStep < TOTAL_STEPS) {
      storeNextStep()
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
      reset()
      setErrors({})
    })
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'البيانات والتصنيف'
      case 2:
        return 'الصور والمرفقات'
      case 3:
        return 'المواصفات والضمان'
      case 4:
        return 'توافق المركبات'
      case 5:
        return 'السعر والموقع'
      case 6:
        return 'مراجعة وتأكيد النشر'
      default:
        return 'إضافة قطعة غيار'
    }
  }

  const handleSubmit = async () => {
    // 1. Validation loop for Steps 1-5
    for (let s = 1; s <= 5; s++) {
      const result = validateStep(s, formData)
      if (!result.isValid) {
        setErrors(result.errors)
        goToStep(s)
        return
      }
    }

    setIsUploadingImages(true)

    // 2. Upload new local images if present (Images are optional)
    const finalImageUrls: string[] = []
    const newImageUrls: string[] = []

    try {
      if (formData.existingImages && formData.existingImages.length > 0) {
        for (const img of formData.existingImages) {
          const url = typeof img === 'string' ? img : img.url
          if (url) finalImageUrls.push(url)
        }
      }

      if (formData.images && formData.images.length > 0) {
        for (const img of formData.images) {
          const uri = typeof img === 'string' ? img : img.uri
          if (!uri) continue

          if (uri.startsWith('http://') || uri.startsWith('https://')) {
            finalImageUrls.push(uri)
          } else {
            try {
              const data = new FormData()
              data.append('file', {
                uri,
                name: `part_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.jpg`,
                type: 'image/jpeg',
              } as any)
              const res = await uploadsApi.single(data)
              const url = (res.data as any)?.url ?? (res.data as any)?.path ?? (res as any)?.url
              if (url) {
                finalImageUrls.push(url)
                newImageUrls.push(url)
              }
            } catch (uploadErr) {
              console.warn('Image upload error for part:', uploadErr)
              throw new Error('فشل رفع إحدى الصور، يرجى التحقق من الاتصال والمحاولة مجدداً')
            }
          }
        }
      }
    } catch (e: any) {
      console.warn('Error uploading part images before submit:', e)
      dialogService.alert('خطأ في رفع الصور', e.message || 'تحقق من اتصالك وأعد المحاولة', 'error')
      setIsUploadingImages(false)
      return
    } finally {
      setIsUploadingImages(false)
    }

    // 3. Prepare payload matching backend CreatePartDto
    const payload: any = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      partCategory: formData.partCategory!,
      condition: formData.condition!,
      partNumber: formData.partNumber ? formData.partNumber.trim() : undefined,
      compatibleMakes: formData.compatibleMakes && formData.compatibleMakes.length > 0 ? formData.compatibleMakes : undefined,
      compatibleModels: formData.compatibleModels && formData.compatibleModels.length > 0 ? formData.compatibleModels : undefined,
      yearFrom: formData.yearFrom != null ? Number(formData.yearFrom) : undefined,
      yearTo: formData.yearTo != null ? Number(formData.yearTo) : undefined,
      isOriginal: formData.isOriginal != null ? formData.isOriginal : undefined,
      price: formData.price != null ? Number(formData.price) : 0,
      currency: formData.currency || 'OMR',
      isPriceNegotiable: Boolean(formData.isPriceNegotiable),
      governorateId: formData.governorateId != null ? Number(formData.governorateId) : undefined,
      wilayaId: formData.wilayaId != null ? Number(formData.wilayaId) : undefined,
      latitude: formData.latitude != null ? formData.latitude : undefined,
      longitude: formData.longitude != null ? formData.longitude : undefined,
      contactPhone: formData.contactPhone ? formData.contactPhone.trim() : undefined,
      whatsapp: formData.whatsapp ? formData.whatsapp.trim() : undefined,
      hasWarranty: formData.hasWarranty,
      warrantyDuration: formData.hasWarranty && formData.warrantyDuration ? formData.warrantyDuration : undefined,
      quantity: formData.quantity || undefined,
      compatibleVehicleTypes:
        formData.compatibleVehicleTypes && formData.compatibleVehicleTypes.length > 0
          ? formData.compatibleVehicleTypes
          : undefined,

      ...(formData.editMode
        ? {}
        : { images: finalImageUrls.length > 0 ? finalImageUrls : undefined }),
    }

    // 4. Submit Mutation (Update or Create)
    if (formData.editMode && formData.editListingId) {
      updateMutation.mutate(
        { id: formData.editListingId, data: payload },
        {
          onSuccess: async () => {
            let imagesSuccess = true
            try {
              if (newImageUrls.length > 0) {
                for (const url of newImageUrls) {
                  await uploadsApi.addPartImage(formData.editListingId!, url)
                }
              }
              if (formData.removedImageIds && formData.removedImageIds.length > 0) {
                for (const imgId of formData.removedImageIds) {
                  await uploadsApi.removePartImage(imgId)
                }
              }
            } catch (err) {
              imagesSuccess = false
              console.warn('Error updating part images in edit mode:', err)
            }

            if (imagesSuccess) {
              dialogService.alert('تم بنجاح', 'تم تحديث بيانات القطعة بنجاح', 'success')
            } else {
              dialogService.alert(
                'تنبيه',
                'تم حفظ التعديلات بنجاح، لكن واجهنا مشكلة في تحديث بعض الصور.',
                'warning'
              )
            }
            reset()
            router.back()
          },
          onError: (err: any) => {
            if (err?.response?.status === 409) {
              dialogService.alert('خطأ', 'تم تعديل هذا الإعلان مؤخراً أو يوجد تعارض في البيانات.')
            } else if (err?.response?.status === 429) {
              dialogService.alert('خطأ', 'تجاوزت الحد المسموح من الطلبات، يرجى الانتظار دقيقة واحدة ثم المحاولة مجدداً.')
            } else {
              const msg = err?.response?.data?.message || 'تعذر تحديث بيانات القطعة، يرجى التحقق من المدخلات'
              dialogService.alert('خطأ', Array.isArray(msg) ? msg.join('\n') : msg)
            }
          },
        }
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: (res: any) => {
          dialogService.alert('تم بنجاح', 'تم نشر إعلان القطعة بنجاح في سوق ون!')
          const partId = res?.data?.id ?? res?.id
          reset()
          if (partId) {
            router.replace(`/parts/${partId}`)
          } else {
            router.replace('/')
          }
        },
        onError: (err: any) => {
          if (err?.response?.status === 409) {
            dialogService.alert('خطأ', 'تم نشر إعلان مشابه جداً مؤخراً. يرجى الانتظار قليلاً.')
          } else if (err?.response?.status === 429) {
            dialogService.alert('خطأ', 'تجاوزت الحد المسموح من الطلبات، يرجى الانتظار دقيقة واحدة ثم المحاولة مجدداً.')
          } else {
            const msg = err?.response?.data?.message || 'تعذر نشر الإعلان، يرجى التحقق من المدخلات'
            dialogService.alert('خطأ', Array.isArray(msg) ? msg.join('\n') : msg)
          }
        },
      })
    }
  }

  const isSubmitting = isUploadingImages || createMutation.isPending || updateMutation.isPending

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.root, { paddingBottom: insets.bottom }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

        {/* Ambient glass backdrop */}
        <LinearGradient
          colors={['#EAF2FF', '#F3EEFF', '#FFF6EE']}
          locations={[0, 0.55, 1]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[s.orb, s.orbPrimary]} pointerEvents="none" />
        <View style={[s.orb, s.orbAccent]} pointerEvents="none" />

        <GlassNavBar
          title={formData.editMode ? 'تعديل إعلان القطعة' : 'إضافة قطعة غيار'}
          paddingTop={insets.top}
          onBackPress={handlePrev}
          actions={[
            {
              icon: 'chatbubble-outline',
              onPress: () => router.push('/(tabs)/chat' as any),
              accessibilityLabel: 'الرسائل',
            },
            {
              icon: 'notifications-outline',
              onPress: () => router.push('/profile/notifications' as any),
              accessibilityLabel: 'الإشعارات',
            },
          ]}
        />

        <ScrollView
          style={s.scrollView}
          contentContainerStyle={[s.content, { paddingTop: insets.top + 52 + Spacing.space3 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Stepper Header */}
          <Stepper
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            title={getStepTitle()}
            variant="light"
          />

          {/* Draft Auto-Save Bar */}
          <View style={s.draftBar}>
            <View style={s.draftBadge}>
              <View style={s.draftIconWrap}>
                <Ionicons name="cloud-done-outline" size={13} color="#059669" />
              </View>
              <Text style={s.draftBadgeTxt}>يتم حفظ مسودتك تلقائياً</Text>
            </View>
            {!formData.editMode && (
              <TouchableOpacity
                style={s.clearDraftBtn}
                onPress={handleClearDraft}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={s.clearDraftTxt}>مسح والبدء من جديد</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ═══════════════ STEP COMPONENTS ═══════════════ */}
          {currentStep === 1 && (
            <PartStep1Category
              formData={formData}
              errors={errors}
              onUpdateField={setFormFieldAndClearError}
            />
          )}

          {currentStep === 2 && (
            <PartStep2Images
              images={formData.images}
              existingImages={formData.existingImages || []}
              errors={errors}
              isUploading={formLogic.isUploading}
              onPickImages={formLogic.handlePickImages}
              onRemoveNewImage={formLogic.handleRemoveNewImage}
              onRemoveExistingImage={formLogic.handleRemoveExistingImage}
              onMakePrimaryNew={formLogic.handleMakePrimaryNew}
              onMakePrimaryExisting={formLogic.handleMakePrimaryExisting}
            />
          )}

          {currentStep === 3 && (
            <PartStep3Details
              formData={formData}
              errors={errors}
              onUpdateField={setFormFieldAndClearError}
            />
          )}

          {currentStep === 4 && (
            <PartStep4Compatibility
              formData={formData}
              errors={errors}
              onUpdateField={setFormFieldAndClearError}
            />
          )}

          {currentStep === 5 && (
            <PartStep5Pricing
              formData={formData}
              errors={errors}
              onUpdateField={setFormFieldAndClearError}
              onLocationChange={formLogic.handleLocationChange}
            />
          )}

          {currentStep === 6 && (
            <PartStep6Review
              formData={formData}
              onEditStep={goToStep}
              brands={brands}
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
                  title={
                    currentStep === TOTAL_STEPS
                      ? formData.editMode
                        ? 'حفظ التعديلات'
                        : 'نشر الإعلان الآن'
                      : 'متابعة الخطوة التالية'
                  }
                  size="sm"
                  onPress={handleNext}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                />
              </View>
            </View>
          ) : (
            <AppButton
              title="متابعة الخطوة التالية"
              size="sm"
              onPress={handleNext}
              loading={isSubmitting}
              disabled={isSubmitting}
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
    backgroundColor: 'rgba(220,38,38,0.06)',
  },
  clearDraftTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.error,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: Spacing.space4,
    paddingTop: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 8 },
    }),
  },
  footerWhiteWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    opacity: 0.08,
  },
  footerTint: {
    ...StyleSheet.absoluteFillObject,
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
