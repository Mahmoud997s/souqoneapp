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
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { WizardStickyFooter } from '../../src/components/ui/WizardStickyFooter'
import { invalidateServiceListingQueries } from '../../src/screens/services/hooks/serviceQueryKeys'
import { PublishSuccessView } from '../../src/components/publish/PublishSuccessView'
import { getPublishRateLimitErrorMessage } from '../../src/utils/publishRateLimitError'
import { getMutationErrorMessage } from '../../src/utils/listing-detail/getDetailErrorKind'

import { Colors } from '../../src/constants/colors'
import { Radius } from '../../src/constants/radius'
import { Spacing } from '../../src/constants/spacing'
import { GlassNavBar } from '../../src/components/ui/GlassNavBar'
import { AppButton } from '../../src/components/ui/AppButton'
import { Stepper } from '../../src/components/ui/Stepper'
import { dialogService } from '../../src/store/dialogStore'
import { uploadsApi } from '../../src/api/uploads'
import { servicesApi } from '../../src/api/services'
import { useServiceWizardStore, ServiceFormData } from '../../src/store/serviceWizardStore'
import { useServiceFormLogic } from '../../src/hooks/useServiceFormLogic'
import {
  getServiceStepFields,
  mapServiceBackendErrors,
  validateStep,
} from '../../src/hooks/useServiceValidation'
import { buildUploadFilePayload } from '../../src/utils/fileUploadHelper'
import { logWarn } from '../../src/utils/safeLog'

import { ServiceStep1Type } from '../../src/components/services/wizard/ServiceStep1Type'
import { ServiceStep2Images } from '../../src/components/services/wizard/ServiceStep2Images'
import { ServiceStep3Details } from '../../src/components/services/wizard/ServiceStep3Details'
import { ServiceStep4Schedule } from '../../src/components/services/wizard/ServiceStep4Schedule'
import { ServiceStep5Pricing } from '../../src/components/services/wizard/ServiceStep5Pricing'
import { ServiceStep6Review } from '../../src/components/services/wizard/ServiceStep6Review'
import { useProfilePhoneGuard } from '../../src/hooks/useProfilePhoneGuard'
import { ProfilePhoneGuardView } from '../../src/components/profile/ProfilePhoneGuardView'

const TOTAL_STEPS = 6

export default function NewServiceListingScreen() {
  const insets = useSafeAreaInsets()
  const { hasPhone } = useProfilePhoneGuard()
  const queryClient = useQueryClient()
  const [publishSuccess, setPublishSuccess] = useState<{
    serviceId: string
    isEdit: boolean
    subtitle?: string
  } | null>(null)

  const createMutation = useMutation({
    mutationFn: (data: any) => servicesApi.create(data),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => servicesApi.update(id, data),
  })

  const {
    currentStep,
    formData,
    setField,
    setLocation,
    nextStep: storeNextStep,
    prevStep,
    goToStep,
    reset,
  } = useServiceWizardStore()

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isUploadingImages, setIsUploadingImages] = useState(false)

  const formLogic = useServiceFormLogic(formData, setField, setLocation)

  const clearFieldError = (field: string) => {
    const keysToClear =
      field === 'workingHoursOpen' || field === 'workingHoursClose'
        ? [field, 'workingHours']
        : [field]

    setErrors((prev) => {
      if (!keysToClear.some((k) => Boolean(prev[k]))) return prev
      const next = { ...prev }
      for (const k of keysToClear) {
        delete next[k]
      }
      return next
    })
  }

  const setFormFieldAndClearError = (field: keyof ServiceFormData, value: any) => {
    setField(field, value)
    clearFieldError(field as string)
  }

  const handlePickImagesAndClearError = async () => {
    clearFieldError('images')
    await formLogic.handlePickImages()
  }

  const handleLocationAndClearErrors = (
    govId: number,
    wilId: number,
    govNameAr: string,
    wilNameAr: string
  ) => {
    formLogic.handleLocationChange(govId, wilId, govNameAr, wilNameAr)
    setErrors((prev) => {
      if (!prev.governorateId && !prev.wilayaId) return prev
      const next = { ...prev }
      delete next.governorateId
      delete next.wilayaId
      return next
    })
  }

  const validateCurrentStep = () => {
    const result = validateStep(currentStep, formData)
    const stepFields = getServiceStepFields(currentStep)
    setErrors((prev) => {
      const next = { ...prev }
      for (const field of stepFields) {
        delete next[field]
      }
      return { ...next, ...result.errors }
    })
    return result.isValid
  }

  const handleNext = () => {
    if (!validateCurrentStep()) return

    if (currentStep < TOTAL_STEPS) {
      storeNextStep()
    } else {
      promptPublishConfirmation()
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      prevStep()
    } else {
      handleExit()
    }
  }

  const handleExit = () => {
    if (formData.editMode) {
      dialogService.confirm(
        'إلغاء التعديل',
        'هل تريد الخروج؟ لن يتم حفظ التعديلات غير المنشورة.',
        () => router.back(),
        'خروج',
        'متابعة التعديل',
        true
      )
    } else {
      dialogService.confirm(
        'الخروج من النموذج',
        'هل تريد الخروج؟ تم حفظ مسودتك تلقائياً ويمكنك استكمالها في أي وقت.',
        () => router.back(),
        'خروج',
        'متابعة الإعلان'
      )
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
      'مسح الكل',
      'تراجع',
      true
    )
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'نوع الخدمة ومقدمها'
      case 2:
        return 'صور الخدمة والمرفقات'
      case 3:
        return 'تفاصيل ومجالات الخدمة'
      case 4:
        return 'أوقات وجدول العمل'
      case 5:
        return 'السعر والموقع والتواصل'
      case 6:
        return 'مراجعة وتأكيد النشر'
      default:
        return 'إضافة خدمة سيارات'
    }
  }

  const promptPublishConfirmation = () => {
    const isEdit = Boolean(formData.editMode)
    dialogService.confirm(
      isEdit ? 'تأكيد حفظ التعديلات' : 'تأكيد نشر الإعلان',
      isEdit
        ? 'هل أنت متأكد من رغبتك في حفظ التعديلات وتحديث بيانات الخدمة؟'
        : 'هل راجعت كافة تفاصيل الخدمة وترغب في نشر الإعلان الآن؟',
      () => handleSubmit(),
      isEdit ? 'حفظ التعديلات' : 'نشر الآن',
      'مراجعة البيانات'
    )
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

    setErrors({})
    setIsUploadingImages(true)

    // 2. Upload local images
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
              const filePayload = buildUploadFilePayload(img, 'service')
              if (!filePayload) continue

              const data = new FormData()
              data.append('file', filePayload as any)
              const res = await uploadsApi.single(data)
              const url = (res.data as any)?.url ?? (res.data as any)?.path ?? (res as any)?.url
              if (url) {
                finalImageUrls.push(url)
                newImageUrls.push(url)
              }
            } catch (uploadErr: any) {
              logWarn('ServicesNew:UploadImage', uploadErr)
              const serverMsg = uploadErr?.response?.data?.message || uploadErr?.message
              throw new Error(serverMsg || 'فشل رفع إحدى الصور، يرجى التحقق من الاتصال والمحاولة مجدداً')
            }
          }
        }
      }
    } catch (e: any) {
      logWarn('ServicesNew:UploadBeforeSubmit', e)
      dialogService.alert('خطأ في رفع الصور', e.message || 'تحقق من اتصالك وأعد المحاولة', 'error')
      setIsUploadingImages(false)
      return
    } finally {
      setIsUploadingImages(false)
    }

    // 3. Prepare payload matching backend CreateServiceDto
    // Decision d6 / D-233: Days and hours are optional and independent.
    // If days are empty, send workingDays: []. Hours are preserved when selected, or null on edit to clear.
    const workingDaysToSubmit =
      Array.isArray(formData.workingDays) && formData.workingDays.length > 0
        ? formData.workingDays
        : []
    const isEdit = Boolean(formData.editMode && formData.editListingId)

    const workingHoursOpen = formData.workingHoursOpen
      ? formData.workingHoursOpen
      : isEdit
        ? null
        : undefined

    const workingHoursClose = formData.workingHoursClose
      ? formData.workingHoursClose
      : isEdit
        ? null
        : undefined

    const payload: any = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      serviceType: formData.serviceType!,
      providerType: formData.providerType!,
      providerName: formData.providerName.trim(),
      specializations:
        formData.specializations && formData.specializations.length > 0
          ? formData.specializations
          : undefined,
      priceFrom: Number(formData.priceFrom),
      ...(formData.priceTo != null ? { priceTo: Number(formData.priceTo) } : {}),
      currency: formData.currency || 'OMR',
      isHomeService: Boolean(formData.isHomeService),
      workingHoursOpen,
      workingHoursClose,
      workingDays: workingDaysToSubmit,
      governorateId: Number(formData.governorateId),
      wilayaId: Number(formData.wilayaId),
      address: formData.address ? formData.address.trim() : undefined,
      latitude: formData.latitude != null ? Number(formData.latitude) : undefined,
      longitude: formData.longitude != null ? Number(formData.longitude) : undefined,
      whatsappEnabled: formData.whatsappEnabled === true,
      website: formData.website ? formData.website.trim() : undefined,
      images: finalImageUrls,
    }

    const handleServiceMutationError = (err: any, fallbackMessage: string) => {
      if (err?.response?.status === 429) {
        dialogService.alert('خطأ', getPublishRateLimitErrorMessage(err))
        return
      }

      const mapped = mapServiceBackendErrors(err)
      if (Object.keys(mapped.fieldErrors).length > 0 && mapped.firstInvalidStep !== null) {
        setErrors(mapped.fieldErrors)
        goToStep(mapped.firstInvalidStep)
        return
      }

      dialogService.alert('خطأ', getMutationErrorMessage(err, fallbackMessage))
    }

    // 4. Submit Mutation (Update or Create)
    if (formData.editMode && formData.editListingId) {
      updateMutation.mutate(
        { id: formData.editListingId, data: payload },
        {
          onSuccess: async () => {
            let imagesSuccess = true
            try {
              if (formData.removedImageIds && formData.removedImageIds.length > 0) {
                for (const imgId of formData.removedImageIds) {
                  await uploadsApi.removeServiceImage(imgId)
                }
              }
            } catch (err) {
              imagesSuccess = false
              logWarn('ServicesNew:RemoveImages', err)
            }

            const targetId = formData.editListingId ? String(formData.editListingId) : ''
            if (targetId) {
              void invalidateServiceListingQueries(queryClient, targetId)
            } else {
              void invalidateServiceListingQueries(queryClient)
            }
            setPublishSuccess({
              serviceId: targetId,
              isEdit: true,
              subtitle: imagesSuccess
                ? 'تم تحديث بيانات الخدمة بنجاح في سوق ون.'
                : 'تم حفظ التعديلات بنجاح، لكن واجهنا مشكلة في تحديث بعض الصور.',
            })
          },
          onError: (err: any) =>
            handleServiceMutationError(err, 'تعذر تحديث بيانات الخدمة، يرجى التحقق من المدخلات'),
        }
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: (res: any) => {
          const rawId = res?.data?.id ?? res?.id
          const serviceId = rawId ? String(rawId) : ''
          if (serviceId) {
            void invalidateServiceListingQueries(queryClient, serviceId)
          } else {
            void invalidateServiceListingQueries(queryClient)
          }
          setPublishSuccess({
            serviceId,
            isEdit: false,
          })
        },
        onError: (err: any) =>
          handleServiceMutationError(err, 'تعذر نشر الإعلان، يرجى التحقق من المدخلات'),
      })
    }
  }

  const isSubmitting = isUploadingImages || createMutation.isPending || updateMutation.isPending

  if (!hasPhone && !formData.editMode) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <ProfilePhoneGuardView
          title="إضافة خدمة سيارات"
          headerVariant="glass"
          onBack={() => router.back()}
        />
      </>
    )
  }

  if (publishSuccess) {
    return (
      <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <PublishSuccessView
          title={publishSuccess.isEdit ? 'تم حفظ التعديلات بنجاح!' : 'تم نشر إعلانك بنجاح!'}
          subtitle={
            publishSuccess.isEdit
              ? (publishSuccess.subtitle ?? 'تم تحديث بيانات الخدمة بنجاح في سوق ون.')
              : 'إعلان الخدمة الخاص بك متاح الآن للعملاء في سوق ون بسلطنة عُمان.'
          }
          primaryAction={{
            label: 'عرض الخدمة',
            onPress: () => {
              const targetId = publishSuccess.serviceId
              reset()
              if (targetId) {
                router.replace(`/services/${targetId}`)
              } else {
                router.replace('/services')
              }
            },
            testID: 'publish-success-primary-btn',
          }}
          secondaryAction={{
            label: publishSuccess.isEdit ? 'الرجوع' : 'إضافة خدمة أخرى',
            onPress: () => {
              reset()
              if (publishSuccess.isEdit) {
                router.back()
              } else {
                setPublishSuccess(null)
              }
            },
            testID: 'publish-success-secondary-btn',
          }}
          tertiaryAction={{
            label: 'العودة للرئيسية',
            onPress: () => {
              reset()
              router.replace('/')
            },
            testID: 'publish-success-tertiary-btn',
          }}
          onHardwareBack={() => {
            reset()
            if (publishSuccess.isEdit) {
              router.back()
            } else {
              router.replace('/')
            }
            return true
          }}
        />
      </View>
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

        <GlassNavBar
          title={formData.editMode ? 'تعديل إعلان الخدمة' : 'إضافة خدمة سيارات'}
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
                testID="clear-draft-btn"
              >
                <Text style={s.clearDraftTxt}>مسح والبدء من جديد</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ═══════════════ STEP COMPONENTS ═══════════════ */}
          {currentStep === 1 && (
            <ServiceStep1Type
              formData={formData}
              errors={errors}
              onUpdateField={setFormFieldAndClearError}
            />
          )}

          {currentStep === 2 && (
            <ServiceStep2Images
              images={formData.images}
              existingImages={formData.existingImages || []}
              errors={errors}
              isUploading={formLogic.isUploading}
              onPickImages={handlePickImagesAndClearError}
              onRemoveNewImage={formLogic.handleRemoveNewImage}
              onRemoveExistingImage={formLogic.handleRemoveExistingImage}
              onMakePrimaryNew={formLogic.handleMakePrimaryNew}
              onMakePrimaryExisting={formLogic.handleMakePrimaryExisting}
            />
          )}

          {currentStep === 3 && (
            <ServiceStep3Details
              formData={formData}
              errors={errors}
              onUpdateField={setFormFieldAndClearError}
            />
          )}

          {currentStep === 4 && (
            <ServiceStep4Schedule
              formData={formData}
              errors={errors}
              onUpdateField={setFormFieldAndClearError}
            />
          )}

          {currentStep === 5 && (
            <ServiceStep5Pricing
              formData={formData}
              errors={errors}
              onUpdateField={setFormFieldAndClearError}
              onLocationChange={handleLocationAndClearErrors}
            />
          )}

          {currentStep === 6 && (
            <ServiceStep6Review
              formData={formData}
              onEditStep={goToStep}
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
    backgroundColor: 'rgba(220,38,38,0.06)',
  },
  clearDraftTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.error,
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
