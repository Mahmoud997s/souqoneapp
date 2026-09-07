import React, { useState } from 'react'
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
import { busesApi } from '../../src/api/buses'
import { useBusWizardStore, BusWizardData } from '../../src/store/busWizardStore'
import { useBusFormLogic } from '../../src/hooks/useBusFormLogic'
import { validateStep } from '../../src/hooks/useBusValidation'
import { buildBusPayload } from '../../src/utils/busPayload'

import { BusStep1TypeCategory } from '../../src/components/buses/wizard/BusStep1TypeCategory'
import { BusStep2Images } from '../../src/components/buses/wizard/BusStep2Images'
import { BusStep3Details } from '../../src/components/buses/wizard/BusStep3Details'
import { BusStep4Pricing } from '../../src/components/buses/wizard/BusStep4Pricing'
import { BusStep5Location } from '../../src/components/buses/wizard/BusStep5Location'
import { BusStep6Review } from '../../src/components/buses/wizard/BusStep6Review'

const TOTAL_STEPS = 6

export default function NewBusListingScreen() {
  const insets = useSafeAreaInsets()

  const {
    currentStep,
    data,
    errors,
    editMode,
    editListingId,
    setStep,
    nextStep: storeNextStep,
    prevStep,
    setData,
    setLocation,
    setErrors,
    clearError,
    reset,
  } = useBusWizardStore()

  const [isUploadingImages, setIsUploadingImages] = useState(false)

  const handleUpdateField = (field: keyof BusWizardData, value: any) => {
    setData({ [field]: value })
    clearError(field as string)
  }

  const formLogic = useBusFormLogic(data, handleUpdateField)

  const createMutation = useMutation({
    mutationFn: (payload: any) => busesApi.create(payload),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => busesApi.update(id, payload),
  })

  const validateCurrentStep = () => {
    const result = validateStep(currentStep, data)
    if (!result.isValid) {
      setErrors(result.errors)
      return false
    }
    return true
  }

  const handleNext = () => {
    if (!validateCurrentStep()) return

    if (currentStep < TOTAL_STEPS) {
      storeNextStep()
    } else {
      handleConfirmSubmit()
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      prevStep()
    } else {
      if (editMode) {
        dialogService.confirm(
          'الخروج من التعديل',
          'هل تريد الخروج؟ لن يتم حفظ أي تعديلات غير منشورة.',
          () => router.back(),
          'خروج',
          'إلغاء',
          true
        )
      } else {
        dialogService.confirm(
          'الخروج',
          'هل تريد الخروج؟ يتم حفظ مسودتك تلقائياً ويمكنك العودة إليها لاحقاً.',
          () => router.back(),
          'خروج',
          'إلغاء'
        )
      }
    }
  }

  const handleClearDraft = () => {
    dialogService.confirm(
      'مسح المسودة',
      'هل أنت متأكد من رغبتك في مسح كافة البيانات والبدء من جديد؟',
      () => {
        reset()
        setErrors({})
      },
      'نعم، مسح',
      'تراجع',
      true
    )
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'نوع وفئة الحافلة'
      case 2:
        return 'الصور والمرفقات'
      case 3:
        return 'المواصفات والتفاصيل'
      case 4:
        return 'التسعير والعقد'
      case 5:
        return 'الموقع وبيانات التواصل'
      case 6:
        return 'مراجعة وتأكيد النشر'
      default:
        return 'إضافة إعلان حافلة'
    }
  }

  const handleConfirmSubmit = () => {
    if (editMode) {
      executeSubmit()
    } else {
      dialogService.confirm(
        'تأكيد النشر',
        'هل أنت متأكد من صحة كافة البيانات وترغب في نشر الإعلان الآن؟',
        () => executeSubmit(),
        'نعم، نشر الإعلان',
        'مراجعة البيانات'
      )
    }
  }

  const executeSubmit = async () => {
    // 1. Validation loop for Steps 1-5
    for (let s = 1; s <= 5; s++) {
      const result = validateStep(s, data)
      if (!result.isValid) {
        setErrors(result.errors)
        setStep(s)
        return
      }
    }

    setIsUploadingImages(true)

    // 2. Upload local images
    const finalImageUrls: string[] = []
    const newImageUrls: string[] = []

    try {
      if (data.existingImages && data.existingImages.length > 0) {
        for (const img of data.existingImages) {
          const url = typeof img === 'string' ? img : img.url || img.uri
          if (url) finalImageUrls.push(url)
        }
      }

      if (data.images && data.images.length > 0) {
        for (const img of data.images) {
          const uri = typeof img === 'string' ? img : img.uri || img.url
          if (!uri) continue

          if (uri.startsWith('http://') || uri.startsWith('https://')) {
            finalImageUrls.push(uri)
          } else {
            const uploadData = new FormData()
            uploadData.append('file', {
              uri,
              name: `bus_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.jpg`,
              type: 'image/jpeg',
            } as any)
            const res = await uploadsApi.single(uploadData)
            const url = (res.data as any)?.url ?? (res.data as any)?.path ?? (res as any)?.url
            if (url) {
              finalImageUrls.push(url)
              newImageUrls.push(url)
            }
          }
        }
      }
    } catch (uploadErr: any) {
      console.warn('Error uploading bus images:', uploadErr)
      dialogService.alert(
        'خطأ في رفع الصور',
        uploadErr.message || 'فشل رفع إحدى الصور، يرجى التحقق من الاتصال والمحاولة مجدداً',
        'error'
      )
      setIsUploadingImages(false)
      return
    } finally {
      setIsUploadingImages(false)
    }

    // 3. Prepare payload matching backend CreateBusListingDto
    const payload = buildBusPayload(data)

    // 4. Submit Mutation (Update or Create)
    if (editMode && editListingId) {
      updateMutation.mutate(
        { id: editListingId, payload },
        {
          onSuccess: async () => {
            let imagesSuccess = true
            try {
              if (newImageUrls.length > 0) {
                await busesApi.addImages(editListingId, newImageUrls)
              }
              if (data.removedImageIds && data.removedImageIds.length > 0) {
                for (const imgId of data.removedImageIds) {
                  await busesApi.removeImage(imgId)
                }
              }
            } catch (err) {
              imagesSuccess = false
              console.warn('Error updating bus images in edit mode:', err)
            }

            if (imagesSuccess) {
              dialogService.alert('تم بنجاح', 'تم تحديث بيانات الحافلة بنجاح', 'success')
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
              const msg = err?.response?.data?.message || err?.message || 'تعذر تحديث بيانات الحافلة، يرجى التحقق من المدخلات'
              dialogService.alert('خطأ', Array.isArray(msg) ? msg.join('\n') : String(msg))
            }
          },
        }
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: async (res: any) => {
          const busId = res?.data?.id ?? res?.id
          if (busId && newImageUrls.length > 0) {
            try {
              await busesApi.addImages(busId, newImageUrls)
            } catch (imgErr) {
              console.warn('Failed to add images to bus listing:', imgErr)
            }
          }

          dialogService.alert('تم بنجاح', 'تم نشر إعلان الحافلة بنجاح في سوق ون!')
          reset()
          if (busId) {
            router.replace(`/buses/${busId}`)
          } else {
            router.replace('/(tabs)/profile')
          }
        },
        onError: (err: any) => {
          if (err?.response?.status === 409) {
            dialogService.alert('خطأ', 'تم نشر إعلان مشابه جداً مؤخراً. يرجى الانتظار قليلاً.')
          } else if (err?.response?.status === 429) {
            dialogService.alert('خطأ', 'تجاوزت الحد المسموح من الطلبات، يرجى الانتظار دقيقة واحدة ثم المحاولة مجدداً.')
          } else {
            const msg = err?.response?.data?.message || err?.message || 'تعذر نشر الإعلان، يرجى التحقق من المدخلات'
            dialogService.alert('خطأ', Array.isArray(msg) ? msg.join('\n') : String(msg))
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
          colors={['#EAF2FF', '#FFF6EE']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[s.orb, s.orbPrimary]} pointerEvents="none" />
        <View style={[s.orb, s.orbAccent]} pointerEvents="none" />

        <GlassNavBar
          title={editMode ? 'تعديل إعلان الحافلة' : 'إضافة حافلة'}
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
            {!editMode && (
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
            <BusStep1TypeCategory
              data={data}
              errors={errors}
              onUpdateField={handleUpdateField}
            />
          )}

          {currentStep === 2 && (
            <BusStep2Images
              images={data.images}
              existingImages={data.existingImages || []}
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
            <BusStep3Details
              data={data}
              errors={errors}
              onUpdateField={handleUpdateField}
            />
          )}

          {currentStep === 4 && (
            <BusStep4Pricing
              data={data}
              errors={errors}
              onUpdateField={handleUpdateField}
            />
          )}

          {currentStep === 5 && (
            <BusStep5Location
              data={data}
              errors={errors}
              onUpdateField={handleUpdateField}
              onLocationChange={setLocation}
            />
          )}

          {currentStep === 6 && (
            <BusStep6Review
              data={data}
              onEditStep={(step) => setStep(step)}
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
                      ? editMode
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
