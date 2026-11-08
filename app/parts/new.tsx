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
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { WizardStickyFooter } from '../../src/components/ui/WizardStickyFooter'
import { invalidatePartListingQueries } from '../../src/screens/parts/hooks/partQueryKeys'
import { getPublishRateLimitErrorMessage } from '../../src/utils/publishRateLimitError'
import { PublishSuccessView } from '../../src/components/publish/PublishSuccessView'
import { useWizardImageReconciliation } from '../../src/hooks/useWizardImageReconciliation'
import { partsImageReconciliationAdapter } from '../../src/utils/imageReconciliation'
import { logWarn } from '../../src/utils/safeLog'

import { Colors } from '../../src/constants/colors'
import { Radius } from '../../src/constants/radius'
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

            void invalidatePartListingQueries(queryClient, String(editId))

            if (reconRes.imagesComplete) {
              setPublishSuccess({
                partId: String(editId),
                isEdit: true,
                isPartial: false,
              })
            } else {
              setPublishSuccess({
                partId: String(editId),
                isEdit: true,
                isPartial: true,
                failedCount: reconRes.failedOperations.length,
              })
            }
          },
          onError: (err: any) => {
            if (err?.response?.status === 409) {
              dialogService.alert('خطأ', 'تم تعديل هذا الإعلان مؤخراً أو يوجد تعارض في البيانات.')
            } else if (err?.response?.status === 429) {
              const msg = getPublishRateLimitErrorMessage(err)
              dialogService.alert('خطأ', msg)
            } else {
              const msg = err?.response?.data?.message || 'تعذر تحديث بيانات القطعة، يرجى التحقق من المدخلات'
              dialogService.alert('خطأ', Array.isArray(msg) ? msg.join('\n') : msg)
            }
          },
        }
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: async (res: any) => {
          const partId = res?.data?.id ?? res?.id
          const targetId = partId ? String(partId) : ''

          if (targetId) {
            imageReconciliation.setListingSaved(true, targetId)

            // Reconcile images for the newly created part listing
            const reconRes = await imageReconciliation.reconcile({
              listingId: targetId,
              isEditMode: true,
              localImages: formData.images,
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
        onError: (err: any) => {
          if (err?.response?.status === 409) {
            dialogService.alert('خطأ', 'تم نشر إعلان مشابه جداً مؤخراً. يرجى الانتظار قليلاً.')
          } else if (err?.response?.status === 429) {
            const msg = getPublishRateLimitErrorMessage(err)
            dialogService.alert('خطأ', msg)
          } else {
            const msg = err?.response?.data?.message || 'تعذر نشر الإعلان، يرجى التحقق من المدخلات'
            dialogService.alert('خطأ', Array.isArray(msg) ? msg.join('\n') : msg)
          }
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
      <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
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
                  label: 'عرض إعلانك',
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
                  label: 'عرض إعلانك',
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
              : undefined
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

        <View style={s.topBar}>
          <Stepper currentStep={currentStep} totalSteps={TOTAL_STEPS} />
          <View style={s.stepHeaderRow}>
            <Text style={s.stepTitle}>{getStepTitle()}</Text>
            {!formData.editMode && (
              <TouchableOpacity onPress={handleClearDraft} style={s.clearBtn}>
                <Ionicons name="trash-outline" size={16} color={Colors.error} />
                <Text style={s.clearBtnText}>مسح</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          style={s.scrollView}
          contentContainerStyle={[s.scrollContent, { paddingBottom: Spacing.space8 + 80 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.cardWrapper}>
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
          </View>
        </ScrollView>

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
  topBar: {
    paddingHorizontal: Spacing.space4,
    paddingVertical: Spacing.space2,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.space2,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearBtnText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.space4,
  },
  cardWrapper: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.space4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
