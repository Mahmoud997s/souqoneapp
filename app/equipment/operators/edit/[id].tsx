import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
} from 'react-native'
import { useRouter, useLocalSearchParams, Stack } from 'expo-router'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { uploadsApi } from '../../../../src/api/uploads'
import { Colors } from '../../../../src/constants/colors'
import { Spacing } from '../../../../src/constants/spacing'
import { Radius } from '../../../../src/constants/radius'
import { CardSystem } from '../../../../src/constants/cardSystem'
import { AppHeader } from '../../../../src/components/ui/AppHeader'
import { AppButton } from '../../../../src/components/ui/AppButton'
import { AppInput } from '../../../../src/components/ui/AppInput'
import { Stepper } from '../../../../src/components/ui/Stepper'
import { GovernorateWilayaSelect } from '../../../../src/components/ui/GovernorateWilayaSelect'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { validateOperatorForm } from '../../../../src/utils/equipment-validation'
import { useUpdateOperator, useOperatorItem } from '../../../../src/hooks/useEquipment'
import { dialogService } from '../../../../src/store/dialogStore'

const TOTAL_STEPS = 3

const ROLE_OPTIONS = [
  { id: 'OPERATOR', title: 'مشغل معدات', icon: 'hard-hat', desc: 'تشغيل وقيادة المعدات الثقيلة المتنوعة' },
  { id: 'DRIVER', title: 'سائق نقل ثقيل', icon: 'truck-fast', desc: 'قيادة الشاحنات، التريلات، والسطحات' },
  { id: 'TECHNICIAN', title: 'فني مواقع', icon: 'wrench', desc: 'أعمال فنية، تمديدات، وتركيبات متخصصة' },
  { id: 'MAINTENANCE', title: 'صيانة وإصلاح', icon: 'cog-sync', desc: 'صيانة هيدروليك، ميكانيكا، ومحركات ديزل' },
]

const AVAILABLE_EQUIPMENT = [
  { id: 'EXCAVATOR', label: 'حفار' },
  { id: 'CRANE', label: 'رافعة / كرين' },
  { id: 'LOADER', label: 'شيول / لودر' },
  { id: 'BULLDOZER', label: 'بلدوزر' },
  { id: 'FORKLIFT', label: 'رافعة شوكية' },
  { id: 'DUMP_TRUCK', label: 'قلاب' },
  { id: 'TRUCK', label: 'شاحنة' },
  { id: 'CONCRETE_MIXER', label: 'خلاطة خرسانة' },
  { id: 'GENERATOR', label: 'مولد كهربائي' },
  { id: 'COMPRESSOR', label: 'كمبروسر' },
  { id: 'LIGHT_EQUIPMENT', label: 'معدات خفيفة' },
  { id: 'OTHER_EQUIPMENT', label: 'معدات أخرى' },
]

export default function EditOperatorScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const updateMutation = useUpdateOperator()
  const { data: operatorData, isLoading, isError } = useOperatorItem(id as string)

  const [currentStep, setCurrentStep] = useState(1)

  const [formData, setFormData] = useState({
    operatorType: 'OPERATOR',
    title: '',
    description: '',
    experienceYears: '',
    equipmentTypes: [] as string[],
    specializations: [] as string[],
    certifications: [] as string[],
    dailyRate: '',
    hourlyRate: '',
    currency: 'OMR',
    isPriceNegotiable: true,
    governorateId: null as number | null,
    wilayaId: null as number | null,
    governorateName: '',
    wilayaName: '',
    contactPhone: '',
    whatsapp: '',
  })

  const [tempCert, setTempCert] = useState('')
  const [tempSpec, setTempSpec] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (operatorData) {
      setFormData({
        operatorType: operatorData.operatorType || 'OPERATOR',
        title: operatorData.title || '',
        description: operatorData.description || '',
        experienceYears: operatorData.experienceYears != null ? String(operatorData.experienceYears) : '',
        equipmentTypes: operatorData.equipmentTypes || [],
        specializations: operatorData.specializations || [],
        certifications: operatorData.certifications || [],
        dailyRate: operatorData.dailyRate ? String(operatorData.dailyRate) : '',
        hourlyRate: operatorData.hourlyRate ? String(operatorData.hourlyRate) : '',
        currency: operatorData.currency || 'OMR',
        isPriceNegotiable: operatorData.isPriceNegotiable ?? (operatorData as any).isNegotiable ?? true,
        governorateId: operatorData.governorateId ?? null,
        wilayaId: operatorData.wilayaId ?? null,
        governorateName: (operatorData as any).governorate?.nameAr || (operatorData as any).governorateName || '',
        wilayaName: (operatorData as any).wilaya?.nameAr || (operatorData as any).wilayaName || '',
        contactPhone: operatorData.contactPhone || '',
        whatsapp: operatorData.whatsapp || operatorData.contactPhone || '',
      })
    }
  }, [operatorData])

  const updateField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      const updated = { ...prev }
      delete updated[key]
      return updated
    })
  }

  const toggleEquipmentType = (typeId: string) => {
    setFormData((prev) => {
      const current = prev.equipmentTypes || []
      const updated = current.includes(typeId)
        ? current.filter((t) => t !== typeId)
        : [...current, typeId]
      return { ...prev, equipmentTypes: updated }
    })
    setErrors((prev) => {
      const updated = { ...prev }
      delete updated.equipmentTypes
      return updated
    })
  }

  const pickCertificateImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        dialogService.alert('الإذن مطلوب', 'يرجى السماح بالوصول إلى مكتبة الصور لإرفاق شهادتك أو رخصتك')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      })

      if (result.canceled || !result.assets?.length) return

      setIsUploading(true)
      const uploadedUrls: string[] = []
      for (const asset of result.assets) {
        const data = new FormData()
        data.append('file', {
          uri: asset.uri,
          type: asset.mimeType ?? 'image/jpeg',
          name: asset.fileName ?? 'cert.jpg',
        } as any)
        const res = await uploadsApi.single(data)
        const url = (res.data as any)?.url ?? (res.data as any)?.path
        if (url) uploadedUrls.push(url)
      }

      if (uploadedUrls.length > 0) {
        setFormData((prev) => ({
          ...prev,
          certifications: [...prev.certifications, ...uploadedUrls],
        }))
        dialogService.alert('نجاح', 'تم إرفاق صورة الشهادة/الرخصة بنجاح')
      }
    } catch (err: any) {
      dialogService.alert('خطأ', 'فشل رفع الصورة، يرجى المحاولة مجدداً')
    } finally {
      setIsUploading(false)
    }
  }

  const addCert = () => {
    if (tempCert.trim()) {
      setFormData((prev) => ({ ...prev, certifications: [...prev.certifications, tempCert.trim()] }))
      setTempCert('')
    } else {
      pickCertificateImages()
    }
  }

  const removeCert = (idx: number) => {
    setFormData((prev) => ({ ...prev, certifications: prev.certifications.filter((_, i) => i !== idx) }))
  }

  const addSpec = () => {
    if (tempSpec.trim()) {
      setFormData((prev) => ({ ...prev, specializations: [...prev.specializations, tempSpec.trim()] }))
      setTempSpec('')
    }
  }

  const removeSpec = (idx: number) => {
    setFormData((prev) => ({ ...prev, specializations: prev.specializations.filter((_, i) => i !== idx) }))
  }

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.operatorType) {
        newErrors.operatorType = 'يرجى اختيار نوع الدور أو التخصص المهني'
      }
      if (!formData.title || formData.title.trim().length < 4) {
        newErrors.title = 'عنوان الإعلان مطلوب (4 أحرف على الأقل)'
      }
      if (!formData.experienceYears || isNaN(Number(formData.experienceYears)) || Number(formData.experienceYears) < 0) {
        newErrors.experienceYears = 'سنوات الخبرة الإجمالية مطلوبة'
      }
      if (!formData.description || formData.description.trim().length < 10) {
        newErrors.description = 'يرجى كتابة نبذة تفصيلية عن خبراتك ومهامك (10 أحرف على الأقل)'
      }
    } else if (step === 2) {
      if (!formData.equipmentTypes || formData.equipmentTypes.length === 0) {
        newErrors.equipmentTypes = 'يرجى تحديد معدة واحدة على الأقل تجيد تشغيلها'
      }
      if (!formData.certifications || formData.certifications.length === 0) {
        newErrors.certifications = 'يرجى إرفاق صورة الرخصة / شهادة الكفاءة أو كتابتها نصياً'
      }
    } else if (step === 3) {
      if (!formData.dailyRate || isNaN(Number(formData.dailyRate)) || Number(formData.dailyRate) <= 0) {
        newErrors.dailyRate = 'الأجر اليومي الاسترشادي مطلوب'
      }
      if (!formData.hourlyRate || isNaN(Number(formData.hourlyRate)) || Number(formData.hourlyRate) <= 0) {
        newErrors.hourlyRate = 'الأجر بالساعة مطلوب'
      }
      if (!formData.governorateId) {
        newErrors.governorate = 'يرجى اختيار المحافظة'
      }
      if (!formData.wilayaId) {
        newErrors.city = 'يرجى اختيار الولاية'
      }
      if (!formData.contactPhone || formData.contactPhone.trim().length < 8) {
        newErrors.contactPhone = 'رقم هاتف الاتصال مطلوب ومكون من 8 أرقام على الأقل'
      }
      if (!formData.whatsapp || formData.whatsapp.trim().length < 8) {
        newErrors.whatsapp = 'رقم الواتساب للتواصل السريع مطلوب'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) return
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    } else {
      router.back()
    }
  }

  const handleSubmit = () => {
    if (!id) return
    if (!validateStep(3)) return

    const payload: any = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      operatorType: formData.operatorType,
      experienceYears: formData.experienceYears ? Number(formData.experienceYears) : undefined,
      equipmentTypes: formData.equipmentTypes,
      specializations: formData.specializations,
      certifications: formData.certifications,
      dailyRate: formData.dailyRate ? Number(formData.dailyRate) : undefined,
      hourlyRate: formData.hourlyRate ? Number(formData.hourlyRate) : undefined,
      currency: formData.currency,
      isPriceNegotiable: formData.isPriceNegotiable,
      governorateId: Number(formData.governorateId),
      wilayaId: Number(formData.wilayaId),
      contactPhone: formData.contactPhone.trim(),
      whatsapp: formData.whatsapp.trim() || formData.contactPhone.trim(),
    }

    updateMutation.mutate(
      { id, data: payload },
      {
        onSuccess: () => {
          dialogService.alert('نجاح', 'تم تحديث بيانات بطاقتك المهنية بنجاح!')
          router.replace(`/equipment/operators/${id}` as any)
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || err?.message || 'حدث خطأ أثناء تحديث البطاقة المهنية'
          dialogService.alert('خطأ', Array.isArray(msg) ? msg[0] : msg)
        },
      }
    )
  }

  if (isLoading) {
    return (
      <View style={[s.root, s.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={s.loadingTxt}>جاري تحميل بيانات البطاقة المهنية...</Text>
      </View>
    )
  }

  if (isError || !operatorData) {
    return (
      <View style={[s.root, s.center]}>
        <Ionicons name="alert-circle-outline" size={54} color={Colors.error} />
        <Text style={s.errorTxt}>تعذّر تحميل بيانات المشغل</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => router.back()}>
          <Text style={s.retryTxt}>العودة للخلف</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'البيانات المهنية والتخصص'
      case 2:
        return 'المعدات والرخص المعتمدة'
      case 3:
        return 'التسعير وموقع العمل والتواصل'
      default:
        return 'تعديل البطاقة المهنية'
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.root, { paddingBottom: insets.bottom }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <AppHeader title="تعديل البطاقة المهنية" showBack onLeftPress={handlePrev} />

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Stepper currentStep={currentStep} totalSteps={TOTAL_STEPS} title={getStepTitle()} />

          {/* ═══════════════ STEP 1: ROLE & BASIC INFO ═══════════════ */}
          {currentStep === 1 && (
            <View style={s.stepWrap}>
              <Text style={s.sectionLabel}>اختر نوع الدور أو الخدمة *</Text>
              <Text style={s.sectionSub}>حدد تخصصك الرئيسي ليظهر في مقدمة بطاقتك التعريفية</Text>

              {errors.operatorType ? (
                <Text style={s.inlineErrorTxt}>{errors.operatorType}</Text>
              ) : null}

              <View style={s.rolesGrid}>
                {ROLE_OPTIONS.map((r) => {
                  const isSel = formData.operatorType === r.id
                  return (
                    <TouchableOpacity
                      key={r.id}
                      style={[s.roleCard, isSel && s.roleCardActive]}
                      onPress={() => updateField('operatorType', r.id)}
                      activeOpacity={0.85}
                    >
                      <View style={[s.roleIconWrap, isSel && s.roleIconWrapActive]}>
                        <MaterialCommunityIcons
                          name={r.icon as any}
                          size={20}
                          color={isSel ? '#ffffff' : Colors.primary}
                        />
                      </View>
                      <View style={s.roleTextWrap}>
                        <Text style={[s.roleTitle, isSel && s.roleTitleActive]} numberOfLines={1}>{r.title}</Text>
                        <Text style={s.roleDesc} numberOfLines={1}>{r.desc}</Text>
                      </View>
                    </TouchableOpacity>
                  )
                })}
              </View>

              {/* Grouped Info Card */}
              <View style={s.cardSection}>
                <AppInput
                  label="عنوان الإعلان / المسمى المهني *"
                  placeholder="مثال: مشغل بلدوزر وجرافة خبرة 10 سنوات"
                  value={formData.title}
                  onChangeText={(val) => updateField('title', val)}
                  error={errors.title}
                />

                <AppInput
                  label="سنوات الخبرة الإجمالية *"
                  placeholder="مثال: 8"
                  keyboardType="numeric"
                  value={formData.experienceYears}
                  onChangeText={(val) => updateField('experienceYears', val)}
                  error={errors.experienceYears}
                />

                <AppInput
                  label="نبذة عن الخبرات والمهام السابقة *"
                  placeholder="اكتب نبذة توضح المشاريع السابقة، ساعات التوفر..."
                  value={formData.description}
                  onChangeText={(val) => updateField('description', val)}
                  multiline
                  numberOfLines={3}
                  error={errors.description}
                />
              </View>
            </View>
          )}

          {/* ═══════════════ STEP 2: EQUIPMENT & CERTS ═══════════════ */}
          {currentStep === 2 && (
            <View style={s.stepWrap}>
              <View style={s.cardSection}>
                <Text style={s.cardTitle}>المعدات المصرح بتشغيلها *</Text>
                <Text style={s.cardSub}>اختر كل المعدات المصرح لك بقيادتها ولديك خبرة بها</Text>

                {errors.equipmentTypes ? (
                  <Text style={s.inlineErrorTxt}>{errors.equipmentTypes}</Text>
                ) : null}

                <View style={s.equipChipsWrap}>
                  {AVAILABLE_EQUIPMENT.map((eq) => {
                    const isSel = formData.equipmentTypes.includes(eq.id)
                    return (
                      <TouchableOpacity
                        key={eq.id}
                        style={[s.equipChip, isSel && s.equipChipActive]}
                        onPress={() => toggleEquipmentType(eq.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={isSel ? 'checkmark-circle' : 'add-circle-outline'}
                          size={14}
                          color={isSel ? '#ffffff' : '#64748B'}
                          style={{ marginEnd: 4 }}
                        />
                        <Text style={[s.equipChipTxt, isSel && s.equipChipTxtActive]}>{eq.label}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>

              {/* Certifications and licenses card */}
              <View style={s.cardSection}>
                <Text style={s.cardTitle}>الرخص والشهادات المهنية *</Text>
                <Text style={s.cardSub}>أرفق صور رخص القيادة وشهادات السلامة أو اكتبها نصياً</Text>
                
                {errors.certifications ? (
                  <Text style={s.inlineErrorTxt}>{errors.certifications}</Text>
                ) : null}

                {/* Visual Upload Box */}
                <TouchableOpacity 
                  style={s.uploadBox} 
                  onPress={pickCertificateImages}
                  disabled={isUploading}
                  activeOpacity={0.8}
                >
                  {isUploading ? (
                    <View style={s.uploadLoadingWrap}>
                      <ActivityIndicator size="small" color={Colors.primary} />
                      <Text style={s.uploadBoxTxt}>جاري رفع الصورة...</Text>
                    </View>
                  ) : (
                    <View style={s.uploadContent}>
                      <View style={s.uploadIconCircle}>
                        <Ionicons name="cloud-upload-outline" size={20} color={Colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.uploadBoxTxt}>إرفاق صورة الرخصة أو الشهادة</Text>
                        <Text style={s.uploadBoxSub}>اضغط لفتح ألبوم الصور أو الكاميرا</Text>
                      </View>
                      <View style={s.uploadAddPill}>
                        <Ionicons name="add" size={14} color={Colors.primary} />
                        <Text style={s.uploadAddPillTxt}>إرفاق</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Uploaded Certificate Images Grid */}
                {formData.certifications.filter(c => c.startsWith('http') || c.startsWith('/')).length > 0 && (
                  <View style={s.certImagesGrid}>
                    {formData.certifications.map((c, i) => {
                      const isImg = c.startsWith('http') || c.startsWith('/')
                      if (!isImg) return null
                      return (
                        <View key={`img-${i}`} style={s.certImgThumbWrap}>
                          <Image source={{ uri: c }} style={s.certImgThumb} contentFit="cover" />
                          <TouchableOpacity 
                            style={s.removeImgBtn} 
                            onPress={() => removeCert(i)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="close" size={13} color="#ffffff" />
                          </TouchableOpacity>
                        </View>
                      )
                    })}
                  </View>
                )}

                {/* Text input for certificate names */}
                <View style={s.addInputRow}>
                  <View style={{ flex: 1 }}>
                    <AppInput
                      placeholder="أو اكتب اسم الرخصة (مثال: رخصة ثقيلة سارية)"
                      value={tempCert}
                      onChangeText={setTempCert}
                      onSubmitEditing={addCert}
                      returnKeyType="done"
                    />
                  </View>
                  <TouchableOpacity style={s.addBtn} onPress={addCert} activeOpacity={0.8}>
                    <Ionicons name="add" size={20} color="#ffffff" />
                  </TouchableOpacity>
                </View>

                {formData.certifications.filter(c => !c.startsWith('http') && !c.startsWith('/')).length > 0 && (
                  <View style={s.tagsList}>
                    {formData.certifications.map((c, i) => {
                      const isImg = c.startsWith('http') || c.startsWith('/')
                      if (isImg) return null
                      return (
                        <View key={i} style={s.certTag}>
                          <Ionicons name="ribbon" size={13} color="#92400E" style={{ marginEnd: 4 }} />
                          <Text style={s.certTagTxt}>{c}</Text>
                          <TouchableOpacity onPress={() => removeCert(i)} style={s.removeTagBtn} hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}>
                            <Ionicons name="close-circle" size={15} color="#92400E" />
                          </TouchableOpacity>
                        </View>
                      )
                    })}
                  </View>
                )}
              </View>

              {/* Specializations card */}
              <View style={s.cardSection}>
                <Text style={s.cardTitle}>التخصصات والمهارات الإضافية</Text>
                <Text style={s.cardSub}>مهارات ميكانيكية، صيانة موقعية، تشغيل ليلي</Text>
                
                <View style={s.addInputRow}>
                  <View style={{ flex: 1 }}>
                    <AppInput
                      placeholder="مثال: صيانة هيدروليك موقعية، تشغيل ليلي"
                      value={tempSpec}
                      onChangeText={setTempSpec}
                    />
                  </View>
                  <TouchableOpacity style={s.addBtn} onPress={addSpec} activeOpacity={0.8}>
                    <Ionicons name="add" size={20} color="#ffffff" />
                  </TouchableOpacity>
                </View>

                {formData.specializations.length > 0 && (
                  <View style={s.tagsList}>
                    {formData.specializations.map((sp, i) => (
                      <View key={i} style={s.specTag}>
                        <Ionicons name="checkmark-done" size={13} color="#1E40AF" style={{ marginEnd: 4 }} />
                        <Text style={s.specTagTxt}>{sp}</Text>
                        <TouchableOpacity onPress={() => removeSpec(i)} style={s.removeTagBtn} hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}>
                          <Ionicons name="close-circle" size={15} color="#1E40AF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ═══════════════ STEP 3: PRICING & LOCATION ═══════════════ */}
          {currentStep === 3 && (
            <View style={s.stepWrap}>
              <View style={s.cardSection}>
                <Text style={s.cardTitle}>الأجر المتوقع ونظام التعاقد *</Text>
                <Text style={s.cardSub}>حدد الأجر الاسترشادي اليومي أو بالساعة</Text>

                <View style={s.ratesRow}>
                  <View style={{ flex: 1 }}>
                    <AppInput
                      label="الأجر اليومي (ر.ع) *"
                      placeholder="مثال: 30"
                      keyboardType="numeric"
                      value={formData.dailyRate}
                      onChangeText={(val) => updateField('dailyRate', val)}
                      error={errors.dailyRate}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppInput
                      label="الأجر بالساعة (ر.ع) *"
                      placeholder="مثال: 5"
                      keyboardType="numeric"
                      value={formData.hourlyRate}
                      onChangeText={(val) => updateField('hourlyRate', val)}
                      error={errors.hourlyRate}
                    />
                  </View>
                </View>

                <View style={s.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.switchTitle}>السعر قابل للتفاوض</Text>
                    <Text style={s.switchSub}>إظهار علامة "قابل للتفاوض" في بطاقتك</Text>
                  </View>
                  <Switch
                    value={formData.isPriceNegotiable}
                    onValueChange={(val) => updateField('isPriceNegotiable', val)}
                    trackColor={{ false: '#E2E8F0', true: Colors.primary }}
                  />
                </View>
              </View>

              {/* Location Picker */}
              <View style={s.cardSection}>
                <Text style={s.cardTitle}>الموقع ونطاق العمل *</Text>
                <GovernorateWilayaSelect
                  governorateId={formData.governorateId}
                  wilayaId={formData.wilayaId}
                  onLocationChange={(govId, wilId, govNameAr, wilNameAr) => {
                    setFormData((prev) => ({
                      ...prev,
                      governorateId: govId,
                      wilayaId: wilId || null,
                      governorateName: govNameAr,
                      wilayaName: wilNameAr,
                    }))
                    setErrors((prev) => {
                      const updated = { ...prev }
                      delete updated.governorate
                      if (wilId) delete updated.city
                      return updated
                    })
                  }}
                  govError={errors.governorate}
                  cityError={errors.city}
                />
              </View>

              {/* Contact numbers */}
              <View style={s.cardSection}>
                <Text style={s.cardTitle}>بيانات الاتصال والتواصل *</Text>
                <AppInput
                  label="رقم الهاتف للاتصال المباشر *"
                  placeholder="مثال: 9680000007"
                  keyboardType="phone-pad"
                  value={formData.contactPhone}
                  onChangeText={(val) => updateField('contactPhone', val)}
                  error={errors.contactPhone}
                />

                <AppInput
                  label="رقم الواتساب للتواصل السريع *"
                  placeholder="مثال: 96890000007"
                  keyboardType="phone-pad"
                  value={formData.whatsapp}
                  onChangeText={(val) => updateField('whatsapp', val)}
                  error={errors.whatsapp}
                />
              </View>
            </View>
          )}
        </ScrollView>

        {/* ── STICKY FOOTER NAVIGATION (PIXEL-PERFECT) ── */}
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
                  title={currentStep === TOTAL_STEPS ? 'حفظ وتحديث البطاقة' : 'متابعة الخطوة التالية'}
                  size="sm"
                  onPress={handleNext}
                  loading={updateMutation.isPending}
                  disabled={updateMutation.isPending}
                />
              </View>
            </View>
          ) : (
            <AppButton
              title="متابعة الخطوة التالية"
              size="sm"
              onPress={handleNext}
              loading={updateMutation.isPending}
              disabled={updateMutation.isPending}
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
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.space4,
  },
  loadingTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textMuted,
    marginTop: 12,
  },
  content: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space2,
    paddingBottom: 120,
  },
  inlineErrorTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: '#DC2626',
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: 8,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: CardSystem.radius.inner,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  stepWrap: {
    marginTop: Spacing.space2,
  },
  sectionLabel: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 13.5,
    lineHeight: 19,
    color: '#0F172A',
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: 3,
  },
  sectionSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: Spacing.space3,
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: Spacing.space3,
  },
  roleCard: {
    width: '48.5%',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingHorizontal: 11,
    paddingVertical: 11,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  roleCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  roleIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconWrapActive: {
    backgroundColor: Colors.primary,
  },
  roleTextWrap: {
    flex: 1,
  },
  roleTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 12.5,
    lineHeight: 18,
    color: '#0F172A',
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: 1,
  },
  roleTitleActive: {
    color: Colors.primary,
  },
  roleDesc: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10.5,
    lineHeight: 15,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  equipChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: Spacing.space2,
  },
  equipChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: CardSystem.radius.inner,
  },
  equipChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  equipChipTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#475569',
  },
  equipChipTxtActive: {
    color: '#ffffff',
  },
  uploadBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: Spacing.space2,
  },
  uploadContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  uploadLoadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  uploadIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBoxTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: '#1E293B',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  uploadBoxSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10,
    lineHeight: 14,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: 1,
  },
  uploadAddPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: CardSystem.radius.inner,
  },
  uploadAddPillTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    color: Colors.primary,
  },
  certImagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.space2,
  },
  certImgThumbWrap: {
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    position: 'relative',
  },
  certImgThumb: {
    width: '100%',
    height: '100%',
  },
  removeImgBtn: {
    position: 'absolute',
    top: 3,
    end: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 2,
  },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
    marginBottom: Spacing.space3,
  },
  certTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: CardSystem.radius.inner,
  },
  certTagTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: '#92400E',
  },
  specTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: CardSystem.radius.inner,
  },
  specTagTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: '#1E40AF',
  },
  removeTagBtn: {
    paddingStart: 4,
  },
  ratesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cardSection: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 13,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    marginBottom: Spacing.space3,
    gap: 10,
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  cardTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 13,
    lineHeight: 18,
    color: '#0F172A',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  cardSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10.5,
    lineHeight: 14.5,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: -4,
    marginBottom: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  switchTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 12,
    lineHeight: 16,
    color: '#0F172A',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  switchSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10.5,
    lineHeight: 14,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    start: 0,
    end: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.space4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  footerBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  prevBtn: {
    width: 90,
  },
  errorTxt: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 14.5,
    lineHeight: 20,
    color: Colors.text,
    marginTop: 10,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: Radius.md,
  },
  retryTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 17,
    color: '#ffffff',
  },
})
