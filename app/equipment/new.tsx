import React, { useEffect } from 'react'
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

import { Colors } from '../../src/constants/colors'
import { Radius } from '../../src/constants/radius'
import { Spacing } from '../../src/constants/spacing'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { AppButton } from '../../src/components/ui/AppButton'
import { Stepper } from '../../src/components/ui/Stepper'
import { dialogService } from '../../src/store/dialogStore'
import { useAuthStore } from '../../src/store/authStore'
import { uploadsApi } from '../../src/api/uploads'
import { useCreateEquipment, useUpdateEquipment } from '../../src/hooks/useEquipment'
import { useEquipmentWizardStore } from '../../src/store/equipmentWizardStore'
import { useEquipmentFormLogic } from '../../src/hooks/useEquipmentFormLogic'

import { EquipmentStep1Type } from '../../src/components/equipment/wizard/EquipmentStep1Type'
import { EquipmentStep2Images } from '../../src/components/equipment/wizard/EquipmentStep2Images'
import { EquipmentStep3Details } from '../../src/components/equipment/wizard/EquipmentStep3Details'
import { EquipmentStep4Location } from '../../src/components/equipment/wizard/EquipmentStep4Location'
import { EquipmentStep5Review } from '../../src/components/equipment/wizard/EquipmentStep5Review'

const TOTAL_STEPS = 5

export default function NewEquipmentListingScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuthStore()
  const createMutation = useCreateEquipment()
  const updateMutation = useUpdateEquipment()

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

  // Auto-fill phone from auth user if empty
  useEffect(() => {
    if (user?.phone && !formData.contactPhone) {
      setFormField('contactPhone', user.phone)
      if (!formData.whatsapp) {
        setFormField('whatsapp', user.phone)
      }
    }
  }, [user?.phone])

  const formLogic = useEquipmentFormLogic({
    images: formData.images,
    existingImages: formData.existingImages,
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
      resetDraft()
    })
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

  const [isUploadingImages, setIsUploadingImages] = React.useState(false)

  const handleSubmit = async () => {
    const isValid = validateStep(4)
    if (!isValid) return

    setIsUploadingImages(true)

    // 1. Process existing images + upload any local image files
    let finalImageUrls: string[] = []
    try {
      // Add existing images from previous upload
      if (formData.existingImages && formData.existingImages.length > 0) {
        for (const img of formData.existingImages) {
          const url = typeof img === 'string' ? img : img.url || img.uri
          if (url) finalImageUrls.push(url)
        }
      }

      // Upload newly added local images
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
                    name: (typeof img === 'object' && img.fileName) || `equip_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.jpg`,
                    type: (typeof img === 'object' && img.mimeType) || 'image/jpeg',
                  } as any)
                  const res = await uploadsApi.single(data)
                  const url = (res.data as any)?.url ?? (res.data as any)?.path ?? (res as any)?.url
                  if (url) finalImageUrls.push(url)
                } catch (uploadErr) {
                  console.warn('Image upload error:', uploadErr)
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error uploading images before submit:', e)
    } finally {
      setIsUploadingImages(false)
    }

    // 2. Prepare payload matching backend CreateEquipmentListingDto exactly
    const payload: any = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      equipmentType: formData.equipmentType,
      listingType: formData.listingType,

      make: formData.make.trim() || undefined,
      model: formData.model.trim() || undefined,
      year: formData.year ? Number(formData.year) : undefined,
      condition: formData.condition || 'USED',
      capacity: formData.capacity.trim() || undefined,
      power: formData.power.trim() || undefined,
      weight: formData.weight.trim() || undefined,
      hoursUsed: formData.hoursUsed ? Number(formData.hoursUsed) : undefined,
      features: formData.features.length > 0 ? formData.features : undefined,

      isPriceNegotiable: formData.isPriceNegotiable,
      withOperator: formData.withOperator,
      deliveryAvailable: formData.deliveryAvailable,

      governorateId: formData.governorateId ? Number(formData.governorateId) : undefined,
      wilayaId: formData.wilayaId ? Number(formData.wilayaId) : undefined,
      latitude: formData.latitude || undefined,
      longitude: formData.longitude || undefined,

      contactPhone: formData.contactPhone.trim() || undefined,
      whatsapp: formData.whatsapp.trim() || undefined,
      images: finalImageUrls.length > 0 ? finalImageUrls : undefined,
    }

    if (formData.listingType === 'EQUIPMENT_SALE') {
      payload.price = formData.price ? Number(formData.price) : undefined
    } else if (formData.listingType === 'EQUIPMENT_RENT') {
      payload.dailyPrice = formData.dailyPrice ? Number(formData.dailyPrice) : undefined
      payload.monthlyPrice = formData.monthlyPrice ? Number(formData.monthlyPrice) : undefined
    } else if (formData.listingType === 'EQUIPMENT_WANTED') {
      payload.budgetMin = formData.budgetMin ? Number(formData.budgetMin) : undefined
      payload.budgetMax = formData.budgetMax ? Number(formData.budgetMax) : undefined
      payload.rentalDuration = formData.rentalDuration || undefined
      payload.quantity = formData.quantity ? Number(formData.quantity) : 1
      payload.siteDetails = formData.siteDetails || undefined
    }

    if (formData.editMode && formData.editListingId) {
      updateMutation.mutate(
        { id: formData.editListingId, data: payload },
        {
          onSuccess: () => {
            dialogService.alert('تم بنجاح', 'تم تحديث بيانات إعلان المعدة بنجاح')
            resetDraft()
            router.back()
          },
          onError: (err: any) => {
            const msg = err?.response?.data?.message || 'تعذر تحديث الإعلان، يرجى التحقق من المدخلات'
            dialogService.alert('خطأ', Array.isArray(msg) ? msg.join('\n') : msg)
          },
        }
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          dialogService.alert('تم بنجاح', 'تم نشر إعلان المعدة بنجاح في سوق ون!')
          resetDraft()
          router.replace('/equipment')
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || 'تعذر نشر الإعلان، يرجى التحقق من المدخلات'
          dialogService.alert('خطأ', Array.isArray(msg) ? msg.join('\n') : msg)
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
          title={formData.editMode ? 'تعديل إعلان معدة' : 'إضافة معدة جديدة'}
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
