import React, { useState, useRef } from 'react'
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
import { showPublishErrorDialog, handlePublishMutationError } from '../../src/utils/publishErrorDialog'
import { getWizardContentPaddingTop } from '../../src/utils/wizardHelpers'
import { useWizardScrollToTop } from '../../src/hooks/useWizardScrollToTop'
import { reconcileEditSectionImages } from '../../src/utils/reconcileEditSectionImages'
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

  const scrollViewRef = useWizardScrollToTop(currentStep)

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
  const submitLockRef = useRef<boolean>(false)

  const handleSubmit = async () => {
    if (submitLockRef.current) return

    // Final Validation Check before submitting (checks step 1 to 4 + images)
    const validationCheck = validateAllCarStepsBeforeSubmit(formData)
    if (!validationCheck.isValid) {
      setErrors(validationCheck.errors)
      if (validationCheck.invalidStep !== null) {
        setStep(validationCheck.invalidStep)
      }
      return
    }

    submitLockRef.current = true
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
                  throw uploadErr
                }
              }
            }
          }
        }
      }
    } catch (e: any) {
      logWarn('CarsNew:UploadBeforeSubmit', e)
      submitLockRef.current = false
      showPublishErrorDialog({
        error: e,
        fallbackMessage: 'فشل رفع إحدى الصور، يرجى المحاولة مجدداً',
        onRetry: handleSubmit,
      })
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
            submitLockRef.current = false
            let imagesSuccess = true
            try {
              await reconcileEditSectionImages({
                listingId: formData.editListingId!,
                newImageUrls,
                existingImages: formData.existingImages,
                removedImageIds: formData.removedImageIds,
                attachNew: async (id, urls) => {
                  const responses: unknown[] = []
                  for (const url of urls) {
                    responses.push(await uploadsApi.attachListingImageUrl(id, url))
                  }
                  return responses
                },
                reorderExisting: (id, imageIds) => uploadsApi.reorderImages(id, imageIds),
                removeExisting: (id, imgId) => uploadsApi.removeListingImage(id, imgId),
              })
            } catch (err) {
              imagesSuccess = false
              logWarn('CarsNew:UpdateImages', err)
            }

            const targetId = formData.editListingId!
            await invalidateCarListingQueries(queryClient, targetId)
            resetForm()

            setPublishSuccess({
              listingId: targetId,
              isEdit: true,
              subtitle: imagesSuccess
                ? 'تم تحديث بيانات السيارة بنجاح في سوق ون.'
                : 'تم حفظ التعديلات النصية بنجاح، ولكن واجهنا مشكلة في تحديث بعض الصور. يمكنك مراجعتها من شاشة الإعلان.',
            })
          },
          onError: (err: unknown) => {
            submitLockRef.current = false
            handlePublishMutationError({
              error: err,
              isEdit: true,
              fallbackMessage: 'تعذر تحديث الإعلان، يرجى التحقق من المدخلات',
              onRetry: handleSubmit,
              onRefetchVersion: async () => {
                const res = await listingsApi.getById(formData.editListingId!)
                const listing = ((res as { data?: { version?: number } })?.data ?? res) as { version?: number }
                if (typeof listing?.version === 'number') {
                  updateField('version', listing.version)
                }
              },
              mapBackendErrors: mapCarBackendErrors,
              onFieldErrors: (fieldErrors, firstInvalidStep) => {
                setErrors((prev) => ({ ...prev, ...fieldErrors }))
                if (firstInvalidStep !== null) {
                  setStep(firstInvalidStep)
                }
              },
            })
          },
        }
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: async (res: any) => {
          submitLockRef.current = false
          const createdId = res?.data?.id || res?.id || ''
          await invalidateCarListingQueries(queryClient, createdId || undefined)
          resetForm()
          setPublishSuccess({
            listingId: createdId,
            isEdit: false,
          })
        },
        onError: (err: unknown) => {
          submitLockRef.current = false
          handlePublishMutationError({
            error: err,
            isEdit: false,
            fallbackMessage: 'تعذر نشر الإعلان، يرجى التحقق من المدخلات',
            onRetry: handleSubmit,
            mapBackendErrors: mapCarBackendErrors,
            onFieldErrors: (fieldErrors, firstInvalidStep) => {
              setErrors((prev) => ({ ...prev, ...fieldErrors }))
              if (firstInvalidStep !== null) {
                setStep(firstInvalidStep)
              }
            },
          })
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
      <View style={s.successRoot}>
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
          ref={scrollViewRef}
          style={s.scrollView}
          contentContainerStyle={[s.content, { paddingTop: getWizardContentPaddingTop(insets.top) }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Stepper Header */}
          <Stepper currentStep={currentStep} totalSteps={TOTAL_STEPS} title={getStepTitle()} variant="light" />

          {/* Draft Auto-Save Bar */}
          <View style={s.draftBar}>
            <View style={s.draftBadge}>
              <View style={s.draftIconWrap}>
                <Ionicons name="cloud-done-outline" size={13} color={Colors.emerald} />
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
                variant="glass"
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
    backgroundColor: Colors.errorSoft06,
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
