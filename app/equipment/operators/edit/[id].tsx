import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Dimensions, Switch, ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../../src/constants/colors'
import { Spacing } from '../../../../src/constants/spacing'
import { Radius } from '../../../../src/constants/radius'
import { AppInput } from '../../../../src/components/ui/AppInput'
import { LocationPicker } from '../../../../src/components/ui/LocationPicker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { validateOperatorForm } from '../../../../src/utils/equipment-validation'
import { useUpdateOperator, useOperatorItem } from '../../../../src/hooks/useEquipment'
import { OPERATOR_TYPES, EQUIPMENT_TYPES } from '../../../../src/utils/equipment-mappers'

const { width } = Dimensions.get('window')

const ROLE_CARDS = [
  { id: 'OPERATOR', icon: 'construct-outline', desc: 'تشغيل وقيادة المعدات الثقيلة بمختلف أنواعها' },
  { id: 'TECHNICIAN', icon: 'build-outline', desc: 'أعمال فنية وتركيبات متخصصة في المواقع' },
  { id: 'MAINTENANCE', icon: 'settings-outline', desc: 'إصلاح وصيانة الأعطال الميكانيكية للمعدات' },
  { id: 'DRIVER', icon: 'bus-outline', desc: 'سائق نقل ثقيل أو خفيف للمركبات والمعدات' },
]

export default function EditOperatorScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const updateMutation = useUpdateOperator()
  const { data: operatorData, isLoading } = useOperatorItem(id)
  
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3
  
  const [formData, setFormData] = useState<any>({
    operatorType: 'OPERATOR',
    currency: 'OMR',
    isNegotiable: true,
    equipmentTypes: [],
    title: '',
    description: '',
    experienceYears: '',
    dailyRate: '',
    hourlyRate: '',
    governorate: '',
    city: '',
    contactPhone: ''
  })

  React.useEffect(() => {
    if (operatorData) {
      setFormData({
        operatorType: operatorData.operatorType || 'OPERATOR',
        currency: operatorData.currency || 'OMR',
        isNegotiable: operatorData.isPriceNegotiable ?? true,
        equipmentTypes: operatorData.equipmentTypes || [],
        title: operatorData.title || '',
        description: operatorData.description || '',
        experienceYears: operatorData.experienceYears ? String(operatorData.experienceYears) : '',
        dailyRate: operatorData.dailyRate ? String(operatorData.dailyRate) : '',
        hourlyRate: operatorData.hourlyRate ? String(operatorData.hourlyRate) : '',
        governorate: operatorData.governorate || '',
        city: operatorData.city || '',
        contactPhone: operatorData.contactPhone || ''
      })
    }
  }, [operatorData])

  const updateField = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }))
  }

  const toggleEquipmentType = (type: string) => {
    setFormData((prev: any) => {
      const current = prev.equipmentTypes || []
      if (current.includes(type)) {
        return { ...prev, equipmentTypes: current.filter((t: string) => t !== type) }
      }
      return { ...prev, equipmentTypes: [...current, type] }
    })
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleComplete = () => {
    const { isNegotiable, ...restFormData } = formData

    const payload = {
      ...restFormData,
      isPriceNegotiable: isNegotiable,
      experienceYears: formData.experienceYears === '' ? undefined : Number(formData.experienceYears),
      dailyRate: formData.dailyRate === '' ? undefined : Number(formData.dailyRate),
      hourlyRate: formData.hourlyRate === '' ? undefined : Number(formData.hourlyRate),
    }

    const errors = validateOperatorForm(payload)
    if (Object.keys(errors).length > 0) {
      alert(Object.values(errors)[0])
      return
    }

    // Backend doesn't allow updating operatorType, so we remove it from the final request payload
    const { operatorType, ...apiPayload } = payload
    
    updateMutation.mutate({ id, data: apiPayload }, {
      onSuccess: () => {
        alert('تم حفظ التعديلات بنجاح!')
        router.back()
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || 'حدث خطأ أثناء التعديل'
        alert(msg)
      }
    })
  }

  const renderProgress = () => {
    return (
      <View style={s.progressContainer}>
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const stepNum = idx + 1
          const isActive = currentStep >= stepNum
          return (
            <View key={idx} style={[s.progressDot, isActive && s.progressDotActive]} />
          )
        })}
      </View>
    )
  }

  const renderStep1 = () => (
    <View style={s.stepContent}>
      <Text style={s.stepTitle}>اختر التخصص الأقرب لك</Text>
      <Text style={s.stepSub}>يساعدنا هذا في إيصال طلبات العمل المناسبة لك بدقة.</Text>
      
      <View style={s.cardsGrid}>
        {ROLE_CARDS.map(role => {
          const isSelected = formData.operatorType === role.id
          return (
            <TouchableOpacity 
              key={role.id} 
              style={[s.roleCard, isSelected && s.roleCardSelected]}
              onPress={() => updateField('operatorType', role.id)}
              activeOpacity={0.8}
            >
              <View style={s.roleCardInner}>
                <View style={[s.roleIconWrap, isSelected && s.roleIconWrapSelected]}>
                  <Ionicons name={role.icon as any} size={26} color={isSelected ? '#d97706' : Colors.textMuted} />
                </View>
                <View style={s.roleTextWrap}>
                  <Text style={[s.roleTitle, isSelected && s.roleTitleSelected]}>
                    {OPERATOR_TYPES[role.id as keyof typeof OPERATOR_TYPES]?.label}
                  </Text>
                  <Text style={s.roleDesc}>{role.desc}</Text>
                </View>
              </View>
              
              {isSelected && (
                <View style={s.checkMark}>
                  <Ionicons name="checkmark-circle" size={24} color="#d97706" style={{ backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' }} />
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )

  const renderStep2 = () => (
    <View style={s.stepContent}>
      <Text style={s.stepTitle}>الخبرة والتسعير</Text>
      <Text style={s.stepSub}>أخبرنا عن مهارتك وحدد توقعاتك المادية لتسهيل التواصل.</Text>
      
      <View style={s.formGroup}>
        <AppInput label="العنوان المهني" placeholder="مثال: مشغل حفار محترف خبرة 10 سنوات" value={formData.title} onChangeText={(val) => updateField('title', val)} />
        <AppInput label="نبذة عن الخبرة والمهام" placeholder="تحدث عن أبرز مشاريعك والمعدات التي تجيدها..." value={formData.description} onChangeText={(val) => updateField('description', val)} multiline numberOfLines={4} />
        <AppInput label="سنوات الخبرة" placeholder="مثال: 5" value={String(formData.experienceYears || '')} onChangeText={(val) => updateField('experienceYears', Number(val))} keyboardType="numeric" />
        
        <View style={{ marginTop: 8 }}>
          <Text style={s.inputLabel}>المعدات التي تجيدها (اختر واحد أو أكثر)</Text>
          <View style={s.chipsWrap}>
            {Object.entries(EQUIPMENT_TYPES).map(([key, val]) => {
              const isSelected = formData.equipmentTypes.includes(key)
              return (
                <TouchableOpacity
                  key={key}
                  style={[s.chip, isSelected && s.chipSelected]}
                  onPress={() => toggleEquipmentType(key)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.chipTxt, isSelected && s.chipTxtSelected]}>{val.label}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      </View>
      
      <View style={s.divider} />
      
      <Text style={s.sectionHeaderTxt}>تسعير الخدمات (اختياري)</Text>
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <AppInput label="الأجر اليومي (ر.ع)" placeholder="0.00" value={String(formData.dailyRate || '')} onChangeText={(val) => updateField('dailyRate', Number(val))} keyboardType="numeric" />
        </View>
        <View style={{ width: Spacing.space3 }} />
        <View style={{ flex: 1 }}>
          <AppInput label="الأجر بالساعة (ر.ع)" placeholder="0.00" value={String(formData.hourlyRate || '')} onChangeText={(val) => updateField('hourlyRate', Number(val))} keyboardType="numeric" />
        </View>
      </View>
      
      <View style={s.switchRow}>
        <View>
          <Text style={s.switchTitle}>قابل للتفاوض</Text>
          <Text style={s.switchDesc}>السماح للعملاء بالتفاوض على الأسعار</Text>
        </View>
        <Switch 
          value={formData.isNegotiable} 
          onValueChange={(val) => updateField('isNegotiable', val)} 
          trackColor={{ false: '#e2e8f0', true: '#fde68a' }}
          thumbColor={formData.isNegotiable ? '#d97706' : '#f8fafc'}
        />
      </View>
    </View>
  )

  const renderStep3 = () => (
    <View style={s.stepContent}>
      <Text style={s.stepTitle}>الموقع والتواصل</Text>
      <Text style={s.stepSub}>كيف يمكن للعملاء الوصول إليك؟</Text>
      
      <View style={s.formGroup}>
        <LocationPicker 
          governorate={formData.governorate}
          onGovernorateChange={(val) => updateField('governorate', val)}
          city={formData.city}
          onCityChange={(val) => updateField('city', val)}
        />
        <AppInput label="رقم التواصل (هاتف أو واتساب)" placeholder="9XXXXXXX" value={formData.contactPhone} onChangeText={(val) => updateField('contactPhone', val)} keyboardType="phone-pad" />
      </View>
      
      <View style={s.finishBox}>
        <Ionicons name="shield-checkmark" size={48} color="#10b981" style={{ marginBottom: 16 }} />
        <Text style={s.finishTitle}>حفظ التعديلات</Text>
        <Text style={s.finishDesc}>بالضغط على تأكيد سيتم حفظ التعديلات على ملفك كمشغل وتحديثه للعملاء.</Text>
      </View>
    </View>
  )

  if (isLoading) {
    return (
      <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  return (
    <View style={s.root}>
      <LinearGradient
        colors={['#0B2447', '#1a3a6b', '#0d3060']}
        style={[s.header, { paddingTop: insets.top + Spacing.space4 }]}
      >
        <View style={s.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-forward" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>تعديل ملف المشغل</Text>
          <View style={{ width: 24 }} />
        </View>
        {renderProgress()}
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, Spacing.space4) }]}>
        {currentStep > 1 && (
          <TouchableOpacity style={s.prevBtn} onPress={handlePrev}>
            <Text style={s.prevBtnTxt}>رجوع</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[s.nextBtn, currentStep === 1 && { flex: 1 }]} 
          onPress={handleNext}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
             <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Text style={s.nextBtnTxt}>{currentStep === totalSteps ? 'تأكيد وإرسال' : 'التالي'}</Text>
              <Ionicons name={currentStep === totalSteps ? "checkmark-done" : "arrow-back"} size={20} color={Colors.white} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingBottom: Spacing.space5, paddingHorizontal: Spacing.space5 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: 'Almarai_800ExtraBold', fontSize: 18, color: Colors.white, lineHeight: 28, includeFontPadding: false },
  progressContainer: { flexDirection: 'row', gap: 8 },
  progressDot: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2 },
  progressDotActive: { backgroundColor: '#d97706' },
  
  scrollContent: { padding: Spacing.space5, paddingBottom: 120 },
  stepContent: { flex: 1 },
  stepTitle: { fontFamily: 'Almarai_800ExtraBold', fontSize: 22, color: Colors.text, marginBottom: 8, textAlign: 'left', lineHeight: 32, includeFontPadding: false },
  stepSub: { fontFamily: 'Almarai_400Regular', fontSize: 14, color: Colors.textMuted, marginBottom: 24, textAlign: 'left', lineHeight: 24, includeFontPadding: false },
  
  cardsGrid: { gap: Spacing.space3 },
  roleCard: { 
    backgroundColor: Colors.white, borderRadius: 16, padding: 16, 
    borderWidth: 2, borderColor: 'transparent',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    position: 'relative'
  },
  roleCardSelected: { borderColor: '#d97706', backgroundColor: '#fffbeb' },
  roleCardInner: { flexDirection: 'row', alignItems: 'center' },
  roleIconWrap: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginHorizontal: 12 },
  roleIconWrapSelected: { backgroundColor: '#fef08a' },
  roleTextWrap: { flex: 1 },
  roleTitle: { fontFamily: 'Almarai_800ExtraBold', fontSize: 16, color: Colors.text, marginBottom: 4, textAlign: 'left', lineHeight: 24, includeFontPadding: false },
  roleTitleSelected: { color: '#92400e' },
  roleDesc: { fontFamily: 'Almarai_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'left', lineHeight: 22, includeFontPadding: false },
  checkMark: { position: 'absolute', top: -10, left: -10, zIndex: 10 },

  formGroup: { gap: Spacing.space4 },
  inputLabel: { fontFamily: 'Almarai_700Bold', fontSize: 14, color: Colors.text, marginBottom: 8, textAlign: 'left', includeFontPadding: false },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  chipSelected: { backgroundColor: '#d97706', borderColor: '#b45309' },
  chipTxt: { fontFamily: 'Almarai_700Bold', fontSize: 13, color: '#475569', includeFontPadding: false },
  chipTxtSelected: { color: Colors.white },
  
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 24 },
  sectionHeaderTxt: { fontFamily: 'Almarai_700Bold', fontSize: 16, color: Colors.text, marginBottom: 16, textAlign: 'left', lineHeight: 24, includeFontPadding: false },
  row: { flexDirection: 'row' },
  
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, padding: 16, backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  switchTitle: { fontFamily: 'Almarai_700Bold', fontSize: 15, color: Colors.text, marginBottom: 4, textAlign: 'left', lineHeight: 24, includeFontPadding: false },
  switchDesc: { fontFamily: 'Almarai_400Regular', fontSize: 12, color: Colors.textMuted, textAlign: 'left', lineHeight: 20, includeFontPadding: false },
  
  finishBox: { alignItems: 'center', backgroundColor: '#ecfdf5', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#dcfce7', marginTop: 32 },
  finishTitle: { fontFamily: 'Almarai_800ExtraBold', fontSize: 20, color: '#065f46', marginBottom: 8, lineHeight: 30, includeFontPadding: false },
  finishDesc: { fontFamily: 'Almarai_400Regular', fontSize: 14, color: '#059669', textAlign: 'center', lineHeight: 24, includeFontPadding: false },

  bottomBar: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    backgroundColor: Colors.white, paddingHorizontal: Spacing.space5, paddingTop: Spacing.space4,
    flexDirection: 'row', gap: Spacing.space3,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 10,
  },
  prevBtn: { 
    flex: 0.4, height: 50, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', 
    backgroundColor: '#f1f5f9' 
  },
  prevBtnTxt: { fontFamily: 'Almarai_700Bold', fontSize: 15, color: Colors.text, lineHeight: 24, includeFontPadding: false },
  nextBtn: { 
    flex: 1, height: 50, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', 
    backgroundColor: '#d97706', flexDirection: 'row', gap: 8 
  },
  nextBtnTxt: { fontFamily: 'Almarai_700Bold', fontSize: 15, color: Colors.white, lineHeight: 24, includeFontPadding: false },
})
