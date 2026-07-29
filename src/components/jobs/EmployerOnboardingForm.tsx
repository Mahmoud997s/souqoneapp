import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TextInput
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { LocationPicker } from '../ui/LocationPicker'
import { AppButton } from '../ui/AppButton'
import { useCreateEmployerProfile } from '../../hooks/useEmployerProfile'
import { useJobProfileStore } from '../../store/jobProfileStore'
import { dialogService } from '../../store/dialogStore'

export function EmployerOnboardingForm() {
  const { setActiveRole } = useJobProfileStore()
  const createEmployer = useCreateEmployerProfile()

  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [empGov, setEmpGov] = useState('')
  const [empBio, setEmpBio] = useState('')
  const [empPhone, setEmpPhone] = useState('')

  const handleSubmit = async () => {
    if (!empGov) {
      dialogService.alert('الموقع مطلوب', 'يرجى اختيار المحافظة')
      return
    }
    try {
      await createEmployer.mutateAsync({
        companyName: companyName || undefined,
        industry: industry || undefined,
        governorate: empGov,
        bio: empBio || undefined,
        contactPhone: empPhone || undefined,
      })
      setActiveRole('employer')
      router.replace('/jobs/dashboard')
    } catch (e: any) {
      dialogService.alert('خطأ', e?.response?.data?.message ?? 'حدث خطأ، حاول مرة أخرى')
    }
  }

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.pageTitle}>بروفايل صاحب العمل</Text>
        <Text style={s.pageDesc}>أكمل بياناتك لتستطيع نشر إعلانات التوظيف</Text>

        <View style={s.cardGroup}>
          <View style={s.cardHeader}>
            <Ionicons name="business-outline" size={22} color={Colors.primary} />
            <Text style={s.cardTitle}>بيانات المنشأة</Text>
          </View>

          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>اسم الشركة / المنشأة (اختياري)</Text>
            <TextInput
              style={s.input}
              value={companyName}
              onChangeText={setCompanyName}
              placeholder="مثال: شركة النقل الأمثل"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>القطاع / النشاط التجاري (اختياري)</Text>
            <TextInput
              style={s.input}
              value={industry}
              onChangeText={setIndustry}
              placeholder="مثال: نقل وخدمات لوجستية"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>نبذة عن المنشأة (اختياري)</Text>
            <TextInput
              style={[s.input, s.textArea]}
              value={empBio}
              onChangeText={setEmpBio}
              placeholder="أخبر السائقين عن شركتك ونشاطها..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={s.cardGroup}>
          <View style={s.cardHeader}>
            <Ionicons name="location-outline" size={22} color={Colors.primary} />
            <Text style={s.cardTitle}>الموقع والتواصل</Text>
          </View>

          <View style={s.inputGroup}>
            <LocationPicker
              governorate={empGov}
              onGovernorateChange={setEmpGov}
              showCity={false}
            />
          </View>

          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>رقم التواصل (اختياري)</Text>
            <TextInput
              style={s.input}
              value={empPhone}
              onChangeText={setEmpPhone}
              placeholder="+968 XXXX XXXX"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
            />
          </View>
        </View>
      </ScrollView>

      <View style={s.stickyFooter}>
        <AppButton
          title={createEmployer.isPending ? 'جاري الإنشاء...' : 'إنشاء بروفايل صاحب العمل'}
          onPress={handleSubmit}
          disabled={createEmployer.isPending}
        />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.space4, paddingBottom: 40 },
  pageTitle: {
    fontFamily: 'Almarai_800ExtraBold',  fontSize: 26,
    color: Colors.text, writingDirection: 'rtl',
    marginBottom: 6,
  },
  pageDesc: {
    fontFamily: 'Almarai_400Regular',  fontSize: 15,
    color: Colors.textMuted, writingDirection: 'rtl',
    lineHeight: 22, marginBottom: Spacing.space6,
  },
  cardGroup: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.space5,
    marginBottom: Spacing.space4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.space5,
  },
  cardTitle: {
    fontFamily: 'Almarai_800ExtraBold',  
    fontSize: 16, color: Colors.text, writingDirection: 'rtl',
  },
  inputGroup: {
    marginBottom: Spacing.space4,
  },
  inputLabel: {
    fontFamily: 'Almarai_700Bold',  
    fontSize: 13, color: Colors.text, writingDirection: 'rtl',
    marginBottom: 10,
  },
  input: {
    height: 56, backgroundColor: '#F4F6F8',
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.space4,
    fontFamily: 'Almarai_400Regular',   fontSize: 15, color: Colors.text,
    textAlign: 'right', writingDirection: 'rtl',
  },
  textArea: { height: 110, paddingTop: 16, paddingBottom: 16 },
  stickyFooter: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space4,
    paddingBottom: Spacing.space3,
    borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 10,
  },
})
