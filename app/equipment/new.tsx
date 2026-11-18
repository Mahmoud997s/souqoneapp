import React, { useEffect, useState, useRef } from 'react'
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
import { useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { WizardStickyFooter } from '../../src/components/ui/WizardStickyFooter'

import { Colors } from '../../src/constants/colors'
import { Radius } from '../../src/constants/radius'
import { Spacing } from '../../src/constants/spacing'
import { GlassNavBar } from '../../src/components/ui/GlassNavBar'
import { AppButton } from '../../src/components/ui/AppButton'
import { Stepper } from '../../src/components/ui/Stepper'
import { PublishSuccessView } from '../../src/components/publish/PublishSuccessView'
import { dialogService } from '../../src/store/dialogStore'
import { useAuthStore } from '../../src/store/authStore'
import { uploadsApi } from '../../src/api/uploads'
import { equipmentApi } from '../../src/api/equipment'
import { useCreateEquipment, useUpdateEquipment } from '../../src/hooks/useEquipment'
import { useEquipmentWizardStore } from '../../src/store/equipmentWizardStore'
import { useEquipmentFormLogic } from '../../src/hooks/useEquipmentFormLogic'
import { buildUploadFilePayload } from '../../src/utils/fileUploadHelper'
import { logWarn } from '../../src/utils/safeLog'
import { reconcileEditSectionImages } from '../../src/utils/reconcileEditSectionImages'
import { showPublishErrorDialog, handlePublishMutationError } from '../../src/utils/publishErrorDialog'
import { mapEquipmentBackendErrors } from '../../src/utils/wizardBackendErrors'
import { getWizardContentPaddingTop } from '../../src/utils/wizardHelpers'
import { useWizardScrollToTop } from '../../src/hooks/useWizardScrollToTop'
import { invalidateEquipmentListingQueries } from '../../src/utils/listing-detail/equipmentQueryKeys'
import {
  uploadAndReconcileEquipmentImages,
  buildEquipmentListingPayload,
} from '../../src/utils/equipment/equipmentWizardSubmitHelpers'

import { EquipmentStep1Type } from '../../src/components/equipment/wizard/EquipmentStep1Type'
import { EquipmentStep2Images } from '../../src/components/equipment/wizard/EquipmentStep2Images'
import { EquipmentStep3Details } from '../../src/components/equipment/wizard/EquipmentStep3Details'
import { EquipmentStep4Location } from '../../src/components/equipment/wizard/EquipmentStep4Location'
import { EquipmentStep5Review } from '../../src/components/equipment/wizard/EquipmentStep5Review'
import { useProfilePhoneGuard } from '../../src/hooks/useProfilePhoneGuard'
import { ProfilePhoneGuardView } from '../../src/components/profile/ProfilePhoneGuardView'

const TOTAL_STEPS = 5

export default function NewEquipmentListingScreen() {
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const { hasPhone } = useProfilePhoneGuard()
  const { user } = useAuthStore()
  const createMutation = useCreateEquipment()
  const updateMutation = useUpdateEquipment()
  const [publishSuccess, setPublishSuccess] = useState<{
    equipmentId: string
    isEdit: boolean
    subtitle?: string
  } | null>(null)

  const {
    currentStep,
    formData,
    errors,
    nextStep,
    prevStep,
    goToStep,
    setFormField,
    setFormData,
    clearFieldError,
    validateStep,
    resetDraft,
  } = useEquipmentWizardStore()

  const scrollViewRef = useWizardScrollToTop(currentStep)
  const [isUploadingImages, setIsUploadingImages] = useState(false)



  const formLogic = useEquipmentFormLogic({
    images: formData.images,
    existingImages: formData.existingImages,
    removedImageIds: formData.removedImageIds,
    features: formData.features,
    onUpdateImages: (imgs) => setFormField('images', imgs),
    onUpdateExistingImages: (imgs) => setFormField('existingImages', imgs),
    onUpdateRemovedImageIds: (ids) => setFormField('removedImageIds', ids),
    onUpdateFeatures: (feats) => setFormField('features', feats),
    onClearFieldError: clearFieldError,
  })

  const handleNext = () => {
    const isValid = validateStep(currentStep)
    if (!isValid) return

    if (currentStep < TOTAL_STEPS) {
      nextStep()
    } else {
      handleConfirmSubmit()
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      prevStep()
    } else {
      if (formData.editMode) {
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
        resetDraft()
      },
      'نعم، مسح',
      'تراجع',
      true
    )
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'النوع والفئة والوصف'
      case 2:
        return 'الصور والمرفقات'
      case 3:
        return 'المواصفات الفنية والميزات'
      case 4:
        return 'السعر والموقع والتواصل'
      case 5:
        return 'مراجعة وتأكيد النشر'
      default:
        return 'إضافة معدة'
    }
  }

  const handleConfirmSubmit = () => {
    if (formData.editMode) {
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

  const submitLockRef = useRef<boolean>(false)

  const executeSubmit = async () => {
    if (submitLockRef.current) return

    for (let s = 1; s <= 4; s++) {
      const isValid = validateStep(s)
      if (!isValid) {
        goToStep(s)
        return
      }
    }

    submitLockRef.current = true
    setIsUploadingImages(true)

    // 1. Process existing images + upload any local image files via extracted helper
    let finalImageUrls: string[] = []
    let newImageUrls: string[] = []
    try {
      const reconcileResult = await uploadAndReconcileEquipmentImages(
        formData.images,
        formData.existingImages
      )
      finalImageUrls = reconcileResult.finalImageUrls
      newImageUrls = reconcileResult.newImageUrls
    } catch (e: unknown) {
      logWarn('EquipmentNew:UploadBeforeSubmit', e)
      submitLockRef.current = false
      showPublishErrorDialog({
        error: e,
        fallbackMessage: 'فشل رفع إحدى الصور، يرجى المحاولة مجدداً',
        onRetry: executeSubmit,
      })
      setIsUploadingImages(false)
      return
    } finally {
      setIsUploadingImages(false)
    }

    // 2. Prepare payload matching backend CreateEquipmentListingDto exactly
    const payload = buildEquipmentListingPayload(formData, finalImageUrls)

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
                attachNew: (id, urls) => equipmentApi.addImages(id, urls),
                reorderExisting: (id, imageIds) => uploadsApi.reorderEquipmentImages(id, imageIds),
                removeExisting: (_id, imgId) => equipmentApi.removeImage(imgId),
              })
            } catch (err) {
              imagesSuccess = false
              logWarn('EquipmentNew:UpdateImages', err)
            }

            const targetId = formData.editListingId ? String(formData.editListingId) : ''
            void invalidateEquipmentListingQueries(queryClient, targetId || undefined)
            resetDraft()
            setPublishSuccess({
              equipmentId: targetId,
              isEdit: true,
              subtitle: imagesSuccess
                ? 'تم تحديث بيانات المعدة وصورها بنجاح في سوق ون.'
                : 'تم حفظ التعديلات النصية بنجاح، ولكن واجهنا مشكلة في تحديث بعض الصور.',
            })
          },
          onError: (err: unknown) => {
            submitLockRef.current = false
            handlePublishMutationError({
              error: err,
              isEdit: true,
              fallbackMessage: 'تعذر تحديث الإعلان، يرجى التحقق من المدخلات',
              onRetry: executeSubmit,
              onRefetchVersion: async () => {
                const res = await equipmentApi.getById(formData.editListingId!)
                const listing = ((res as { data?: { version?: number } })?.data ?? res) as { version?: number }
                if (typeof listing?.version === 'number') {
                  setFormData({ version: listing.version } as Partial<typeof formData>)
                }
              },
              mapBackendErrors: mapEquipmentBackendErrors,
              onFieldErrors: (fieldErrors, firstInvalidStep) => {
                useEquipmentWizardStore.setState((state) => ({
                  errors: { ...state.errors, ...fieldErrors },
                }))
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
        onSuccess: (res: unknown) => {
          submitLockRef.current = false
          const resObj = res as { data?: { id?: string | number }; id?: string | number }
          const equipId = resObj?.data?.id ?? resObj?.id
          const targetId = equipId ? String(equipId) : ''
          void invalidateEquipmentListingQueries(queryClient, targetId || undefined)
          resetDraft()
          setPublishSuccess({
            equipmentId: targetId,
            isEdit: false,
          })
        },
        onError: (err: unknown) => {
          submitLockRef.current = false
          handlePublishMutationError({
            error: err,
            isEdit: false,
            fallbackMessage: 'تعذر نشر الإعلان، يرجى التحقق من المدخلات',
            onRetry: executeSubmit,
            mapBackendErrors: mapEquipmentBackendErrors,
            onFieldErrors: (fieldErrors, firstInvalidStep) => {
              useEquipmentWizardStore.setState((state) => ({
                errors: { ...state.errors, ...fieldErrors },
              }))
              if (firstInvalidStep !== null) {
                goToStep(firstInvalidStep)
              }
            },
          })
        },
      })
    }
  }

  const isSubmitting = isUploadingImages || createMutation.isPending || updateMutation.isPending

  if (publishSuccess) {
    return (
      <View style={s.successRoot}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <PublishSuccessView
          title={publishSuccess.isEdit ? 'تم حفظ تعديلات المعدة بنجاح!' : 'تم نشر معدتك بنجاح!'}
          subtitle={
            publishSuccess.isEdit
              ? (publishSuccess.subtitle ?? 'تم تحديث بيانات المعدة بنجاح في سوق ون.')
              : 'إعلان معدتك متاح الآن في سوق ون بسلطنة عُمان. يمكنك متابعة المشاهدات والرسائل من لوحة تحكمك.'
          }
          primaryAction={{
            label: 'عرض المعدة',
            onPress: () => {
              const targetId = publishSuccess.equipmentId
              resetDraft()
              if (targetId) {
                router.replace(`/equipment/${targetId}`)
              } else {
                router.replace('/equipment')
              }
            },
            testID: 'publish-success-primary-btn',
          }}
          secondaryAction={{
            label: publishSuccess.isEdit ? 'الرجوع للمعدات' : 'إضافة معدة أخرى',
            onPress: () => {
              resetDraft()
              if (publishSuccess.isEdit) {
                router.replace('/equipment')
              } else {
                setPublishSuccess(null)
              }
            },
            testID: 'publish-success-secondary-btn',
          }}
          tertiaryAction={{
            label: 'العودة للرئيسية',
            onPress: () => {
              resetDraft()
              router.replace('/')
            },
            testID: 'publish-success-tertiary-btn',
          }}
          onHardwareBack={() => {
            resetDraft()
            router.replace('/equipment')
            return true
          }}
        />
      </View>
    )
  }

  if (!hasPhone && !formData.editMode) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <ProfilePhoneGuardView
          title="إضافة معدة"
          headerVariant="glass"
          onBack={() => router.back()}
        />
      </>
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
          title={formData.editMode ? 'تعديل إعلان معدة' : 'إضافة معدة'}
          paddingTop={insets.top}
          onBackPress={handlePrev}
          actions={[
            {
              icon: 'chatbubble-outline',
              onPress: () => router.push('/(tabs)/chat'),
              accessibilityLabel: 'الرسائل',
            },
            {
              icon: 'notifications-outline',
              onPress: () => router.push('/profile/notifications'),
              accessibilityLabel: 'الإشعارات',
            },
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
            <EquipmentStep1Type
              formData={formData}
              errors={errors}
              onUpdateField={setFormField}
            />
          )}

          {currentStep === 2 && (
            <EquipmentStep2Images
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
            <EquipmentStep3Details
              formData={formData}
              errors={errors}
              customFeatureInput={formLogic.customFeatureInput}
              onChangeCustomFeatureInput={formLogic.setCustomFeatureInput}
              onToggleFeature={formLogic.handleToggleFeature}
              onAddCustomFeature={formLogic.handleAddCustomFeature}
              onRemoveFeature={formLogic.handleRemoveFeature}
              onUpdateField={setFormField}
            />
          )}

          {currentStep === 4 && (
            <EquipmentStep4Location
              formData={formData}
              errors={errors}
              onUpdateField={setFormField}
              onLocationChange={(govId, wilId, govName, wilName) => {
                setFormData({
                  governorateId: govId,
                  wilayaId: wilId,
                  governorate: govName,
                  city: wilName,
                })
                clearFieldError('governorate')
                clearFieldError('city')
              }}
            />
          )}

          {currentStep === 5 && (
            <EquipmentStep5Review
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
                  testID={currentStep === TOTAL_STEPS ? 'wizard-submit-btn' : undefined}
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
