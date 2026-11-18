import React, { useState, useEffect, useRef } from 'react'
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
import { WizardKeyboardScrollView } from '../../src/components/wizard/WizardKeyboardScrollView'
import { invalidatePartListingQueries } from '../../src/screens/parts/hooks/partQueryKeys'
import { PublishSuccessView } from '../../src/components/publish/PublishSuccessView'
import { useWizardImageReconciliation } from '../../src/hooks/useWizardImageReconciliation'
import { partsImageReconciliationAdapter } from '../../src/utils/imageReconciliation'
import { logWarn } from '../../src/utils/safeLog'

import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { GlassNavBar } from '../../src/components/ui/GlassNavBar'
import { AppButton } from '../../src/components/ui/AppButton'
import { Stepper } from '../../src/components/ui/Stepper'
import { dialogService } from '../../src/store/dialogStore'
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
import { useProfilePhoneGuard } from '../../src/hooks/useProfilePhoneGuard'
import { ProfilePhoneGuardView } from '../../src/components/profile/ProfilePhoneGuardView'
import { handlePublishMutationError } from '../../src/utils/publishErrorDialog'
import { mapPartBackendErrors } from '../../src/utils/wizardBackendErrors'
import { getWizardContentPaddingTop } from '../../src/utils/wizardHelpers'
import { useWizardScrollToTop } from '../../src/hooks/useWizardScrollToTop'

const TOTAL_STEPS = 6

export default function NewPartListingScreen() {
  const insets = useSafeAreaInsets()
  const { hasPhone } = useProfilePhoneGuard()
  const queryClient = useQueryClient()

  const [brands, setBrands] = useState<CarBrand[]>([])
  const [publishSuccess, setPublishSuccess] = useState<{
    partId: string
    isEdit: boolean
    isPartial?: boolean
    failedCount?: number
  } | null>(null)

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
        logWarn('NewPartListingScreen:brands', err)
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
    setImageLedger,
    setLocation,
    nextStep: storeNextStep,
    prevStep,
    goToStep,
    reset,
  } = usePartWizardStore()

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Durable Image Reconciliation Hook (S6 / D-243 / D-247)
  const imageReconciliation = useWizardImageReconciliation({
    adapter: partsImageReconciliationAdapter,
    initialLedger: formData.imageLedger,
    onStateChange: (nextLedger) => {
      setImageLedger(nextLedger)
    },
  })

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

  const scrollViewRef = useWizardScrollToTop(currentStep)

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

  const handleRetryFailedImages = async () => {
    if (!publishSuccess) return
    const retryRes = await imageReconciliation.retryFailed({
      listingId: publishSuccess.partId,
      isEditMode: true,
      listingSaved: true,
    })
    void invalidatePartListingQueries(queryClient, publishSuccess.partId)

    if (retryRes.imagesComplete) {
      setPublishSuccess({
        ...publishSuccess,
        isPartial: false,
        failedCount: 0,
      })
    } else {
      setPublishSuccess({
        ...publishSuccess,
        isPartial: true,
        failedCount: retryRes.failedOperations.length,
      })
    }
  }

  const submitLockRef = useRef<boolean>(false)

  const handleSubmit = async () => {
    if (submitLockRef.current) return

    // 1. Validation loop for Steps 1-5
    for (let s = 1; s <= 5; s++) {
      const result = validateStep(s, formData)
      if (!result.isValid) {
        setErrors(result.errors)
        goToStep(s)
        return
      }
    }

    submitLockRef.current = true

    // 2. Prepare payload matching backend CreatePartDto
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
      whatsappEnabled: formData.whatsappEnabled === true,
      hasWarranty: formData.hasWarranty,
      warrantyDuration: formData.hasWarranty && formData.warrantyDuration ? formData.warrantyDuration : undefined,
      quantity: formData.quantity || undefined,
      compatibleVehicleTypes:
        formData.compatibleVehicleTypes && formData.compatibleVehicleTypes.length > 0
          ? formData.compatibleVehicleTypes
          : undefined,
    }

    // 3. Submit Mutation First (Decision d5: Listing saved first, then images reconciled)
    if (formData.editMode && formData.editListingId) {
      const editId = formData.editListingId
      updateMutation.mutate(
        { id: editId, data: payload },
        {
          onSuccess: async () => {
            submitLockRef.current = false
            imageReconciliation.setListingSaved(true, editId)

            // Reconcile images: uploads new images, attaches via /images/url, and removes deleted IDs
            const reconRes = await imageReconciliation.reconcile({
              listingId: editId,
              isEditMode: true,
              localImages: formData.images,
              existingImages: formData.existingImages,
              removedImageIds: formData.removedImageIds,
              listingSaved: true,
            })

            const targetId = String(editId)
            void invalidatePartListingQueries(queryClient, targetId)

            if (reconRes.imagesComplete) {
              setPublishSuccess({
                partId: targetId,
                isEdit: true,
                isPartial: false,
              })
            } else {
              setPublishSuccess({
                partId: targetId,
                isEdit: true,
                isPartial: true,
                failedCount: reconRes.failedOperations.length,
              })
            }
          },
          onError: (err: unknown) => {
            submitLockRef.current = false
            handlePublishMutationError({
              error: err,
              isEdit: true,
              fallbackMessage: 'تعذر تحديث بيانات القطعة، يرجى التحقق من المدخلات',
              onRetry: handleSubmit,
              onRefetchVersion: async () => {
                const res = await partsApi.getById(editId)
                const listing = ((res as { data?: { version?: number } })?.data ?? res) as { version?: number }
                if (typeof listing?.version === 'number') {
                  setField('version', listing.version)
                }
              },
              mapBackendErrors: mapPartBackendErrors,
              onFieldErrors: (fieldErrors, firstInvalidStep) => {
                setErrors((prev) => ({ ...prev, ...fieldErrors }))
                if (firstInvalidStep !== null) {
                  goToStep(firstInvalidStep)
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
          const partId = res?.data?.id ?? res?.id
          const targetId = partId ? String(partId) : ''

          if (targetId) {
            imageReconciliation.setListingSaved(true, targetId)

            // Reconcile images for the newly created part listing
            const reconRes = await imageReconciliation.reconcile({
              listingId: targetId,
              isEditMode: true,
              localImages: formData.images,
              existingImages: formData.existingImages,
              listingSaved: true,
            })

            void invalidatePartListingQueries(queryClient, targetId)

            if (reconRes.imagesComplete) {
              setPublishSuccess({
                partId: targetId,
                isEdit: false,
                isPartial: false,
              })
            } else {
              setPublishSuccess({
                partId: targetId,
                isEdit: false,
                isPartial: true,
                failedCount: reconRes.failedOperations.length,
              })
            }
          } else {
            void invalidatePartListingQueries(queryClient)
            setPublishSuccess({
              partId: '',
              isEdit: false,
              isPartial: false,
            })
          }
        },
        onError: (err: unknown) => {
          submitLockRef.current = false
          handlePublishMutationError({
            error: err,
            isEdit: false,
            fallbackMessage: 'تعذر نشر الإعلان، يرجى التحقق من المدخلات',
            onRetry: handleSubmit,
            mapBackendErrors: mapPartBackendErrors,
            onFieldErrors: (fieldErrors, firstInvalidStep) => {
              setErrors((prev) => ({ ...prev, ...fieldErrors }))
              if (firstInvalidStep !== null) {
                goToStep(firstInvalidStep)
              }
            },
          })
        },
      })
    }
  }

  const isSubmitting =
    imageReconciliation.isReconciling ||
    createMutation.isPending ||
    updateMutation.isPending

  if (!hasPhone && !formData.editMode) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <ProfilePhoneGuardView
          title="إضافة قطعة غيار"
          headerVariant="glass"
          onBack={() => router.back()}
        />
      </>
    )
  }

  if (publishSuccess) {
    const isPartial = Boolean(publishSuccess.isPartial)
    const title = isPartial
      ? (publishSuccess.isEdit ? 'تم حفظ التعديل جزئياً' : 'تم نشر الإعلان')
      : (publishSuccess.isEdit ? 'تم حفظ التعديلات بنجاح!' : 'تم نشر إعلانك بنجاح!')

    const subtitle = isPartial
      ? (publishSuccess.isEdit
          ? `تم حفظ التعديلات بنجاح، لكن تعذر تحديث ${publishSuccess.failedCount || ''} من الصور.`
          : `تم نشر الإعلان بنجاح، لكن تعذر رفع ${publishSuccess.failedCount || ''} من الصور.`)
      : (publishSuccess.isEdit
          ? 'تم تحديث بيانات قطعة الغيار بنجاح في سوق ون.'
          : 'إعلانك متاح الآن للمشترين في سوق ون بسلطنة عُمان. يمكنك متابعة المشاهدات والرسائل من لوحة تحكمك.')

    return (
      <View style={s.successRoot}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <PublishSuccessView
          title={title}
          subtitle={subtitle}
          primaryAction={
            isPartial
              ? {
                  label: imageReconciliation.isReconciling
                    ? 'جاري إعادة المحاولة...'
                    : 'إعادة رفع الصور الفاشلة',
                  onPress: handleRetryFailedImages,
                  testID: 'publish-retry-failed-images-btn',
                }
              : {
                  label: 'عرض الإعلان',
                  onPress: () => {
                    const targetId = publishSuccess.partId
                    reset()
                    if (targetId) {
                      router.replace(`/parts/${targetId}`)
                    } else {
                      router.replace('/parts')
                    }
                  },
                  testID: 'publish-success-primary-btn',
                }
          }
          secondaryAction={
            isPartial
              ? {
                  label: 'عرض الإعلان',
                  onPress: () => {
                    const targetId = publishSuccess.partId
                    reset()
                    if (targetId) {
                      router.replace(`/parts/${targetId}`)
                    } else {
                      router.replace('/parts')
                    }
                  },
                  testID: 'publish-success-primary-btn',
                }
              : {
                  label: publishSuccess.isEdit ? 'الرجوع' : 'إضافة إعلان آخر',
                  onPress: () => {
                    reset()
                    if (publishSuccess.isEdit) {
                      router.back()
                    } else {
                      setPublishSuccess(null)
                    }
                  },
                  testID: 'publish-success-secondary-btn',
                }
          }
          tertiaryAction={
            isPartial
              ? {
                  label: publishSuccess.isEdit ? 'الرجوع' : 'إضافة إعلان آخر',
                  onPress: () => {
                    reset()
                    if (publishSuccess.isEdit) {
                      router.back()
                    } else {
                      setPublishSuccess(null)
                    }
                  },
                  testID: 'publish-success-secondary-btn',
                }
              : {
                  label: 'العودة للرئيسية',
                  onPress: () => {
                    reset()
                    setPublishSuccess(null)
                    router.replace('/')
                  },
                  testID: 'publish-success-tertiary-btn',
                }
          }
          onHardwareBack={() => {
            reset()
            if (publishSuccess.isEdit) {
              router.back()
            } else {
              router.replace('/parts')
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

        <WizardKeyboardScrollView
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
        </WizardKeyboardScrollView>

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
                  title={
                    currentStep === TOTAL_STEPS
                      ? formData.editMode
                        ? 'حفظ التعديلات'
                        : 'نشر الإعلان الآن'
                      : 'متابعة الخطوة التالية'
                  }
                  testID={currentStep === TOTAL_STEPS ? 'wizard-submit-btn' : 'wizard-next-btn'}
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
