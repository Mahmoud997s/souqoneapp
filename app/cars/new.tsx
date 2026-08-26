import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { router, Stack } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useMutation } from '@tanstack/react-query'

import { Colors } from '../../src/constants/colors'
import { Radius } from '../../src/constants/radius'
import { Spacing } from '../../src/constants/spacing'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { AppButton } from '../../src/components/ui/AppButton'
import { Stepper } from '../../src/components/ui/Stepper'
import { dialogService } from '../../src/store/dialogStore'
import { uploadsApi } from '../../src/api/uploads'
import { listingsApi } from '../../src/api/listings'
import { useCarWizardStore } from '../../src/store/carWizardStore'
import { useCarFormLogic } from '../../src/hooks/useCarFormLogic'

import { CarStep1Type } from '../../src/components/cars/wizard/CarStep1Type'
import { CarStep2Images } from '../../src/components/cars/wizard/CarStep2Images'
import { CarStep3Details } from '../../src/components/cars/wizard/CarStep3Details'
import { CarStep4Location } from '../../src/components/cars/wizard/CarStep4Location'
import { CarStep5Review } from '../../src/components/cars/wizard/CarStep5Review'
import { validateCarStep } from '../../src/hooks/useCarValidation'

const TOTAL_STEPS = 5

export default function NewCarListingScreen() {
  const insets = useSafeAreaInsets()

  const createMutation = useMutation({
    mutationFn: (data: any) => listingsApi.create(data),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => listingsApi.update(id, data),
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
  const setFormFieldAndClearError = (field: any, value: any) => {
    updateField(field, value)
    clearFieldError(field as string)
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
    // Final Validation Check before submitting (checks step 1 to 4)
    let isValid = true
    for (let s = 1; s <= 4; s++) {
      const result = validateCarStep(s, formData)
      if (!result.isValid) {
        isValid = false
        setErrors(result.errors)
        setStep(s)
        return
      }
    }
    
    if (!isValid) return

    // Final Image Validation
    const hasNewImages = Array.isArray(formData.images) && formData.images.length > 0
    const hasExistingImages = Array.isArray(formData.existingImages) && formData.existingImages.length > 0
    if (formData.listingType !== 'WANTED' && !hasNewImages && !hasExistingImages) {
      setErrors({ images: 'يجب إضافة صورة واحدة على الأقل للسيارة' })
      setStep(2)
      return
    }

    setIsUploadingImages(true)

    // 1. Process images
    let finalImageUrls: string[] = []
    let newImageUrls: string[] = []
    try {
      if (formData.existingImages && formData.existingImages.length > 0) {
        for (const img of formData.existingImages) {
          const url = typeof img === 'string' ? img : img.url || img.uri
          if (url) finalImageUrls.push(url)
        }
      }

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
                  const data = new FormData()
                  data.append('file', {
                    uri,
                    name: (typeof img === 'object' && img.fileName) || `car_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.jpg`,
                    type: (typeof img === 'object' && img.mimeType) || 'image/jpeg',
                  } as any)
                  const res = await uploadsApi.single(data)
                  const url = (res.data as any)?.url ?? (res.data as any)?.path ?? (res as any)?.url
                  if (url) {
                    finalImageUrls.push(url)
                    newImageUrls.push(url)
                  }
                } catch (uploadErr) {
                  console.warn('Image upload error:', uploadErr)
                  throw new Error('فشل رفع إحدى الصور، يرجى المحاولة مجدداً')
                }
              }
            }
          }
        }
      }
    } catch (e: any) {
      console.warn('Error uploading images before submit:', e)
      dialogService.alert('خطأ في رفع الصور', e.message || 'تحقق من اتصالك وأعد المحاولة', 'error')
      return
    } finally {
      setIsUploadingImages(false)
    }

    // 2. Prepare payload matching backend CreateListingDto
    const payload: any = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      listingType: formData.listingType,
      condition: formData.condition || undefined,

      year: formData.year ? Number(formData.year) : undefined,
      mileage: formData.condition === 'NEW' ? 0 : (formData.mileage ? Number(formData.mileage) : undefined),
      fuelType: formData.fuelType || undefined,
      transmission: formData.transmission || undefined,
      bodyType: formData.bodyType || undefined,
      exteriorColor: formData.exteriorColor || undefined,
      interior: formData.interior || undefined,
      engineSize: formData.engineSize || undefined,
      horsepower: formData.horsepower ? Number(formData.horsepower) : undefined,
      doors: formData.doors ? Number(formData.doors) : undefined,
      seats: formData.seats ? Number(formData.seats) : undefined,
      driveType: formData.driveType || undefined,
      features: formData.features.length > 0 ? formData.features : undefined,

      isPriceNegotiable: formData.isPriceNegotiable,
      
      governorateId: formData.governorateId ? Number(formData.governorateId) : undefined,
      wilayaId: formData.wilayaId ? Number(formData.wilayaId) : undefined,
      latitude: formData.latitude || undefined,
      longitude: formData.longitude || undefined,

      ...(formData.editMode 
        ? (formData.brandId !== formData.originalBrandId || formData.carModelId !== formData.originalCarModelId 
           ? { brandId: formData.brandId, carModelId: formData.carModelId, carTrimId: formData.carTrimId || undefined } 
           : {}) 
        : { brandId: formData.brandId, carModelId: formData.carModelId, carTrimId: formData.carTrimId || undefined }
      ),

      ...(formData.editMode ? { version: formData.version || 1 } : { images: finalImageUrls.length > 0 ? finalImageUrls : undefined }),
    }

    if (formData.listingType === 'SALE') {
      payload.price = formData.price ? Number(formData.price) : undefined
    } else if (formData.listingType === 'RENTAL') {
      payload.price = 0 // Required by backend even for rentals
      payload.dailyPrice = formData.dailyPrice ? Number(formData.dailyPrice) : undefined
      payload.monthlyPrice = formData.monthlyPrice ? Number(formData.monthlyPrice) : undefined
      payload.withDriver = formData.withDriver
      payload.depositAmount = formData.depositAmount ? Number(formData.depositAmount) : undefined
      payload.minRentalDays = formData.minRentalDays ? Number(formData.minRentalDays) : undefined
      payload.kmLimitPerDay = formData.kmLimitPerDay ? Number(formData.kmLimitPerDay) : undefined
      payload.cancellationPolicy = formData.cancellationPolicy || undefined
      payload.deliveryAvailable = formData.deliveryAvailable
      payload.insuranceIncluded = formData.insuranceIncluded
    } else if (formData.listingType === 'WANTED') {
      payload.price = formData.price ? Number(formData.price) : 0
    }

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
              console.warn('Error updating images in edit mode:', err)
            }

            if (imagesSuccess) {
              dialogService.alert('تم بنجاح', 'تم تحديث بيانات الإعلان والصور بنجاح', 'success')
            } else {
              dialogService.alert(
                'تنبيه',
                'تم حفظ التعديلات النصية بنجاح، ولكن واجهنا مشكلة في تحديث بعض الصور. يرجى المحاولة مرة أخرى.',
                'warning'
              )
            }
            resetForm()
            router.back()
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
              dialogService.alert('خطأ', 'تجاوزت الحد المسموح من الطلبات، يرجى الانتظار دقيقة واحدة ثم المحاولة مجدداً.')
            } else {
              const msg = err?.response?.data?.message || 'تعذر تحديث الإعلان، يرجى التحقق من المدخلات'
              dialogService.alert('خطأ', Array.isArray(msg) ? msg.join('\n') : msg)
            }
          },
        }
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          dialogService.alert('تم بنجاح', 'تم نشر إعلان السيارة بنجاح في سوق ون!')
          resetForm()
          router.replace('/')
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

        <AppHeader
          title={formData.editMode ? 'تعديل إعلان السيارة' : 'إضافة إعلان سيارة'}
          showBack
          onLeftPress={handlePrev}
        />

        <ScrollView
          style={s.scrollView}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Stepper Header */}
          <Stepper currentStep={currentStep} totalSteps={TOTAL_STEPS} title={getStepTitle()} />

          {/* Draft Auto-Save Bar */}
          <View style={s.draftBar}>
            <View style={s.draftBadge}>
              <Ionicons name="cloud-done-outline" size={14} color="#059669" />
              <Text style={s.draftBadgeTxt}>يتم حفظ مسودتك تلقائياً</Text>
            </View>
            {!formData.editMode && (
              <TouchableOpacity onPress={handleClearDraft} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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
        <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
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
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space2,
    paddingBottom: 120,
  },
  draftBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: Spacing.space3,
  },
  draftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  draftBadgeTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: '#047857',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  clearDraftTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.error,
    textDecorationLine: 'underline',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: Spacing.space4,
    paddingTop: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 8 },
    }),
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
