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

import { Colors } from '../../src/constants/colors'
import { Radius } from '../../src/constants/radius'
import { Spacing } from '../../src/constants/spacing'
import { GlassNavBar } from '../../src/components/ui/GlassNavBar'
import { AppButton } from '../../src/components/ui/AppButton'
import { Stepper } from '../../src/components/ui/Stepper'
import { dialogService } from '../../src/store/dialogStore'
import { uploadsApi } from '../../src/api/uploads'
import { listingsApi } from '../../src/api/listings'
import { Listing } from '../../src/types/listing.types'
import { useCarWizardStore } from '../../src/store/carWizardStore'
import { useCarFormLogic } from '../../src/hooks/useCarFormLogic'
import { buildUploadFilePayload } from '../../src/utils/fileUploadHelper'
import { logWarn } from '../../src/utils/safeLog'
import { invalidateCarListingQueries } from '../../src/utils/listing-detail/queryKeys'
import { getPublishRateLimitErrorMessage } from '../../src/utils/publishRateLimitError'
import { getMutationErrorMessage } from '../../src/utils/listing-detail/getDetailErrorKind'
import { PublishSuccessView } from '../../src/components/publish/PublishSuccessView'

import { CarStep1Type } from '../../src/components/cars/wizard/CarStep1Type'
import { CarStep2Images } from '../../src/components/cars/wizard/CarStep2Images'
import { CarStep3Details } from '../../src/components/cars/wizard/CarStep3Details'
import { CarStep4Location } from '../../src/components/cars/wizard/CarStep4Location'
import { CarStep5Review } from '../../src/components/cars/wizard/CarStep5Review'
import { validateCarStep, mapCarBackendErrors } from '../../src/hooks/useCarValidation'
import {
  CarBackendPayload,
  buildCarListingPayload,
  validateAllCarStepsBeforeSubmit,
  extractImageUrlsFromCarFormData,
} from '../../src/utils/cars/carWizardSubmitHelpers'
import { CarFormField } from '../../src/types/carForm.types'

import { useProfilePhoneGuard } from '../../src/hooks/useProfilePhoneGuard'
import { ProfilePhoneGuardView } from '../../src/components/profile/ProfilePhoneGuardView'

const TOTAL_STEPS = 5

export default function NewCarListingScreen() {
  const insets = useSafeAreaInsets()
  const { hasPhone } = useProfilePhoneGuard()
  const queryClient = useQueryClient()

  const [publishSuccess, setPublishSuccess] = useState<{
    listingId: string
    isEdit: boolean
    subtitle?: string
  } | null>(null)

  const createMutation = useMutation({
    mutationFn: (data: CarBackendPayload) => listingsApi.create(data as unknown as Partial<Listing>),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CarBackendPayload }) =>
      listingsApi.update(id, data as unknown as Partial<Listing>),
  })

  const {
    currentStep,
    formData,
    isDraft,
    setStep,
    nextStep: storeNextStep,
    prevStep,
    updateField,
    resetForm,
  } = useCarWizardStore()

  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  const formLogic = useCarFormLogic(formData, updateField)

  const clearFieldError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  // Wrapper around updateField that clears errors
  const setFormFieldAndClearError = <K extends CarFormField>(field: K, value: any) => {
    updateField(field, value)
    clearFieldError(field)
  }

  const validateCurrentStep = () => {
    const result = validateCarStep(currentStep, formData)
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
      resetForm()
      setErrors({})
    })
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'النوع والوصف'
      case 2:
        return 'الصور'
      case 3:
        return 'المواصفات الفنية'
      case 4:
        return 'السعر والموقع'
      case 5:
        return 'مراجعة وتأكيد النشر'
      default:
        return 'إضافة سيارة'
    }
  }

  const [isUploadingImages, setIsUploadingImages] = useState(false)

  const handleSubmit = async () => {
    // Final Validation Check before submitting (checks step 1 to 4 + images)
    const validationCheck = validateAllCarStepsBeforeSubmit(formData)
    if (!validationCheck.isValid) {
      setErrors(validationCheck.errors)
      if (validationCheck.invalidStep !== null) {
        setStep(validationCheck.invalidStep)
      }
      return
    }

    setIsUploadingImages(true)

    // 1. Process images
    let finalImageUrls: string[] = []
    let newImageUrls: string[] = []
    try {
      finalImageUrls = extractImageUrlsFromCarFormData(formData.existingImages)

      if (formData.images && formData.images.length > 0) {
        for (const img of formData.images) {
          if (typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))) {
            finalImageUrls.push(img)
          } else {
            const uri = typeof img === 'string' ? img : img.uri
            if (uri) {
              if (uri.startsWith('http://') || uri.startsWith('https://')) {
                finalImageUrls.push(uri)
              } else {
                try {
                  const filePayload = buildUploadFilePayload(img, 'car')
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
                  logWarn('CarsNew:UploadImage', uploadErr)
                  const serverMsg = uploadErr?.response?.data?.message || uploadErr?.message
                  throw new Error(serverMsg || 'فشل رفع إحدى الصور، يرجى المحاولة مجدداً')
                }
              }
            }
          }
        }
      }
    } catch (e: any) {
      logWarn('CarsNew:UploadBeforeSubmit', e)
      dialogService.alert('خطأ في رفع الصور', e.message || 'تحقق من اتصالك وأعد المحاولة', 'error')
      return
    } finally {
      setIsUploadingImages(false)
    }

    // 2. Prepare payload matching backend CreateListingDto via extracted helper
    const payload = buildCarListingPayload(formData, finalImageUrls)

    if (formData.editMode && formData.editListingId) {
      updateMutation.mutate(
        { id: formData.editListingId, data: payload },
        {
          onSuccess: async () => {
            let imagesSuccess = true
            try {
              if (newImageUrls.length > 0) {
                for (const url of newImageUrls) {
                  await uploadsApi.attachListingImageUrl(formData.editListingId!, url)
                }
              }
              if (formData.removedImageIds && formData.removedImageIds.length > 0) {
                for (const imgId of formData.removedImageIds) {
                  await uploadsApi.removeListingImage(formData.editListingId!, imgId)
                }
              }
              if (formData.existingImages && formData.existingImages.length > 0) {
                const existingIds = formData.existingImages.map((img: any) => img.id).filter(Boolean)
                if (existingIds.length > 0) {
                  await uploadsApi.reorderImages(formData.editListingId!, existingIds)
                }
              }
            } catch (err) {
              imagesSuccess = false
              logWarn('CarsNew:UpdateImages', err)
            }

            await invalidateCarListingQueries(queryClient, formData.editListingId)

            setPublishSuccess({
              listingId: formData.editListingId!,
              isEdit: true,
              subtitle: imagesSuccess
                ? 'تم تحديث بيانات السيارة بنجاح في سوق ون.'
                : 'تم حفظ التعديلات النصية بنجاح، ولكن واجهنا مشكلة في تحديث بعض الصور. يمكنك مراجعتها من شاشة الإعلان.',
            })
          },
          onError: (err: any) => {
            if (err?.response?.status === 409) {
              dialogService.confirm(
                'تحديث مطلوب',
                'هذا الإعلان تم تعديله من جهاز آخر. سيتم جلب أحدث نسخة من السيرفر لتتمكن من حفظ تعديلاتك الحالية دون فقدانها.',
                async () => {
                  try {
                    const res = await listingsApi.getById(formData.editListingId!)
                    const listing: any = res.data ?? res
                    updateField('version', listing.version)
                    dialogService.alert('تم', 'تم تحديث النسخة، يمكنك الآن مراجعة بياناتك ومحاولة الحفظ مجدداً.', 'success')
                  } catch (e) {
                    dialogService.alert('خطأ', 'تعذر جلب البيانات.')
                  }
                },
                'تحديث الآن',
                'إلغاء'
              )
            } else if (err?.response?.status === 429) {
              dialogService.alert('خطأ', getPublishRateLimitErrorMessage(err))
            } else if (err?.response?.status === 400) {
              const mapped = mapCarBackendErrors(err?.response?.data)
              if (Object.keys(mapped.fieldErrors).length > 0) {
                setErrors((prev) => ({ ...prev, ...mapped.fieldErrors }))
                if (mapped.firstInvalidStep !== null) {
                  setStep(mapped.firstInvalidStep)
                }
                const firstMsg = Object.values(mapped.fieldErrors)[0]
                dialogService.alert('تنبيه في المدخلات', firstMsg || 'يرجى مراجعة الحقول المشار إليها بالأحمر')
              } else {
                dialogService.alert('خطأ', getMutationErrorMessage(err, 'تعذر تحديث الإعلان، يرجى التحقق من المدخلات'))
              }
            } else {
              dialogService.alert('خطأ', getMutationErrorMessage(err, 'تعذر تحديث الإعلان، يرجى التحقق من المدخلات'))
            }
          },
        }
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: async (res: any) => {
          const createdId = res?.data?.id || res?.id || ''
          await invalidateCarListingQueries(queryClient, createdId || undefined)
          setPublishSuccess({
            listingId: createdId,
            isEdit: false,
          })
        },
        onError: (err: any) => {
          if (err?.response?.status === 409) {
            dialogService.alert('خطأ', 'تم نشر إعلان مشابه جداً مؤخراً. يرجى الانتظار قليلاً.')
          } else if (err?.response?.status === 429) {
            dialogService.alert('خطأ', getPublishRateLimitErrorMessage(err))
          } else if (err?.response?.status === 400) {
            const mapped = mapCarBackendErrors(err?.response?.data)
            if (Object.keys(mapped.fieldErrors).length > 0) {
              setErrors((prev) => ({ ...prev, ...mapped.fieldErrors }))
              if (mapped.firstInvalidStep !== null) {
                setStep(mapped.firstInvalidStep)
              }
              const firstMsg = Object.values(mapped.fieldErrors)[0]
              dialogService.alert('تنبيه في المدخلات', firstMsg || 'يرجى مراجعة الحقول المشار إليها بالأحمر')
            } else {
              dialogService.alert('خطأ', getMutationErrorMessage(err, 'تعذر نشر الإعلان، يرجى التحقق من المدخلات'))
            }
          } else {
            dialogService.alert('خطأ', getMutationErrorMessage(err, 'تعذر نشر الإعلان، يرجى التحقق من المدخلات'))
          }
        },
      })
    }
  }

  const isSubmitting = isUploadingImages || createMutation.isPending || updateMutation.isPending

  if (!hasPhone && !formData.editMode) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <ProfilePhoneGuardView
          title="إضافة إعلان سيارة"
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
              ? (publishSuccess.subtitle ?? 'تم تحديث بيانات السيارة بنجاح في سوق ون.')
              : 'إعلان سيارتك متاح الآن للمشترين في سوق ون بسلطنة عُمان. يمكنك متابعة المشاهدات والرسائل من لوحة تحكمك.'
          }
          primaryAction={{
            label: 'عرض الإعلان',
            onPress: () => {
              const targetId = publishSuccess.listingId
              resetForm()
              if (targetId) {
                router.replace(`/cars/${targetId}`)
              } else {
                router.replace('/cars')
              }
            },
            testID: 'publish-success-primary-btn',
          }}
          secondaryAction={{
            label: publishSuccess.isEdit ? 'الرجوع' : 'إضافة سيارة أخرى',
            onPress: () => {
              resetForm()
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
              resetForm()
              router.replace('/')
            },
            testID: 'publish-success-tertiary-btn',
          }}
          onHardwareBack={() => {
            resetForm()
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
          title={formData.editMode ? 'تعديل إعلان السيارة' : 'إضافة إعلان سيارة'}
          paddingTop={insets.top}
          onBackPress={handlePrev}
          actions={[
            { icon: 'chatbubble-outline', onPress: () => router.push('/(tabs)/chat' as any), accessibilityLabel: 'الرسائل' },
            { icon: 'notifications-outline', onPress: () => router.push('/profile/notifications' as any), accessibilityLabel: 'الإشعارات' },
          ]}
        />

        <ScrollView
          style={s.scrollView}
          contentContainerStyle={[s.content, { paddingTop: insets.top + 52 + Spacing.space3 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Stepper Header */}
          <Stepper currentStep={currentStep} totalSteps={TOTAL_STEPS} title={getStepTitle()} variant="light" />

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
            <CarStep1Type
              formData={formData}
              errors={errors}
              onUpdateField={setFormFieldAndClearError}
            />
          )}

          {currentStep === 2 && (
            <CarStep2Images
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
            <CarStep3Details
              formData={formData}
              errors={errors}
              customFeatureInput={formLogic.customFeatureInput}
              onChangeCustomFeatureInput={formLogic.setCustomFeatureInput}
              onToggleFeature={formLogic.handleToggleFeature}
              onAddCustomFeature={formLogic.handleAddCustomFeature}
              onRemoveFeature={formLogic.handleRemoveFeature}
              onUpdateField={setFormFieldAndClearError}
            />
          )}

          {currentStep === 4 && (
            <CarStep4Location
              formData={formData}
              errors={errors}
              onUpdateField={setFormFieldAndClearError}
              onLocationChange={formLogic.handleLocationChange}
            />
          )}

          {currentStep === 5 && (
            <CarStep5Review
              formData={formData}
              onEditStep={setStep}
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
                  testID="car-wizard-submit-btn"
                  title={currentStep === TOTAL_STEPS ? (formData.editMode ? 'حفظ التعديلات' : 'نشر الإعلان الآن') : 'متابعة الخطوة التالية'}
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
