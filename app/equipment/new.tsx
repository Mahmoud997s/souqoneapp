import React, { useEffect, useState } from 'react'
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
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'

import { Colors } from '../../src/constants/colors'
import { Radius } from '../../src/constants/radius'
import { Spacing } from '../../src/constants/spacing'
import { GlassNavBar } from '../../src/components/ui/GlassNavBar'
import { AppButton } from '../../src/components/ui/AppButton'
import { Stepper } from '../../src/components/ui/Stepper'
import { dialogService } from '../../src/store/dialogStore'
import { useAuthStore } from '../../src/store/authStore'
import { uploadsApi } from '../../src/api/uploads'
import { equipmentApi } from '../../src/api/equipment'
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

  const [isUploadingImages, setIsUploadingImages] = useState(false)

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

  const executeSubmit = async () => {
    for (let s = 1; s <= 4; s++) {
      const isValid = validateStep(s)
      if (!isValid) {
        goToStep(s)
        return
      }
    }

    setIsUploadingImages(true)

    // 1. Process existing images + upload any local image files
    let finalImageUrls: string[] = []
    let newImageUrls: string[] = []
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
                  if (url) {
                    finalImageUrls.push(url)
                    newImageUrls.push(url)
                  }
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
      ...(formData.editMode ? {} : { images: finalImageUrls.length > 0 ? finalImageUrls : undefined }),
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
          onSuccess: async () => {
            let imagesSuccess = true
            try {
              if (newImageUrls.length > 0) {
                await equipmentApi.addImages(formData.editListingId!, newImageUrls)
              }
              if (formData.removedImageIds && formData.removedImageIds.length > 0) {
                for (const imgId of formData.removedImageIds) {
                  await equipmentApi.removeImage(imgId)
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
        onSuccess: (res: any) => {
          const equipId = res?.data?.id ?? res?.id
          dialogService.alert('تم بنجاح', 'تم نشر إعلان المعدة بنجاح في سوق ون!')
          resetDraft()
          if (equipId) {
            router.replace(`/equipment/${equipId}`)
          } else {
            router.replace('/equipment')
          }
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
          title={formData.editMode ? 'تعديل إعلان معدة' : 'إضافة معدة'}
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
