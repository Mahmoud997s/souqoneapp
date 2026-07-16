import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { LicenseType } from '../../types/jobs.types'
import { LICENSE_TYPE_LABELS, LANGUAGE_OPTIONS } from '../../constants/jobs'
import { LocationPicker } from '../ui/LocationPicker'
import { AppButton } from '../ui/AppButton'
import { useCreateDriverProfile } from '../../hooks/useDriverProfile'
import { useJobProfileStore } from '../../store/jobProfileStore'

const LICENSE_KEYS = Object.keys(LICENSE_TYPE_LABELS) as LicenseType[]

export function DriverOnboardingForm() {
  const { setActiveRole } = useJobProfileStore()
  const createDriver = useCreateDriverProfile()

  const [licenseTypes, setLicenseTypes] = useState<LicenseType[]>([])
  const [experienceYears, setExperienceYears] = useState('')
  const [hasOwnVehicle, setHasOwnVehicle] = useState(false)
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([])
  const [languages, setLanguages] = useState<string[]>([])
  const [governorate, setGovernorate] = useState('')
  const [bio, setBio] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')

  const toggleItem = <T,>(arr: T[], setArr: (v: T[]) => void, item: T) => {
    setArr(arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item])
  }

  const handleSubmit = async () => {
    if (!governorate) {
      Alert.alert('الموقع مطلوب', 'يرجى اختيار المحافظة')
      return
    }
    if (licenseTypes.length === 0) {
      Alert.alert('رخصة القيادة مطلوبة', 'يرجى اختيار نوع رخصة القيادة على الأقل')
      return
    }
    try {
      await createDriver.mutateAsync({
        licenseTypes,
        experienceYears: experienceYears ? parseInt(experienceYears) : undefined,
        hasOwnVehicle,
        vehicleTypes,
        languages,
        governorate,
        bio: bio || undefined,
        contactPhone: contactPhone || undefined,
        whatsapp: whatsapp || undefined,
      })
      setActiveRole('driver')
      router.replace('/jobs/dashboard')
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message ?? 'حدث خطأ، حاول مرة أخرى')
    }
  }

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.pageTitle}>بروفايل السائق</Text>
        <Text style={s.pageDesc}>أكمل بياناتك لتظهر للمعلنين وأصحاب العمل</Text>

        <View style={s.cardGroup}>
          <View style={s.cardHeader}>
            <Ionicons name="card-outline" size={22} color={Colors.primary} />
            <Text style={s.cardTitle}>الرخص والخبرات</Text>
          </View>

          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>أنواع رخص القيادة *</Text>
            <View style={s.chipsWrap}>
              {LICENSE_KEYS.map(lt => (
                <TouchableOpacity
                  key={lt}
                  style={[s.chip, licenseTypes.includes(lt) && s.chipActive]}
                  onPress={() => toggleItem(licenseTypes, setLicenseTypes, lt)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.chipText, licenseTypes.includes(lt) && s.chipTextActive]}>
                    🪪 {LICENSE_TYPE_LABELS[lt]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>سنوات الخبرة</Text>
            <TextInput
              style={s.input}
              value={experienceYears}
              onChangeText={setExperienceYears}
              placeholder="مثال: 3"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={s.checkRow}
              onPress={() => setHasOwnVehicle(!hasOwnVehicle)}
              activeOpacity={0.8}
            >
              <View style={[s.checkbox, hasOwnVehicle && s.checkboxActive]}>
                {hasOwnVehicle && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={s.checkLabel}>أمتلك مركبة خاصة</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.cardGroup}>
          <View style={s.cardHeader}>
            <Ionicons name="person-outline" size={22} color={Colors.primary} />
            <Text style={s.cardTitle}>المعلومات الشخصية</Text>
          </View>

          <View style={s.inputGroup}>
            <LocationPicker
              governorate={governorate}
              onGovernorateChange={setGovernorate}
              showCity={false}
            />
          </View>

          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>اللغات</Text>
            <View style={s.chipsWrap}>
              {LANGUAGE_OPTIONS.map(lang => (
                <TouchableOpacity
                  key={lang}
                  style={[s.chip, languages.includes(lang) && s.chipActive]}
                  onPress={() => toggleItem(languages, setLanguages, lang)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.chipText, languages.includes(lang) && s.chipTextActive]}>
                    {lang}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>نبذة تعريفية (اختياري)</Text>
            <TextInput
              style={[s.input, s.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="أخبر أصحاب العمل عن خبرتك..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={s.cardGroup}>
          <View style={s.cardHeader}>
            <Ionicons name="call-outline" size={22} color={Colors.primary} />
            <Text style={s.cardTitle}>معلومات التواصل</Text>
          </View>

          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>رقم الهاتف (اختياري)</Text>
            <TextInput
              style={s.input}
              value={contactPhone}
              onChangeText={setContactPhone}
              placeholder="+968 XXXX XXXX"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
            />
          </View>
          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>واتساب (اختياري)</Text>
            <TextInput
              style={s.input}
              value={whatsapp}
              onChangeText={setWhatsapp}
              placeholder="+968 XXXX XXXX"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
            />
          </View>
        </View>
      </ScrollView>

      <View style={s.stickyFooter}>
        <AppButton
          title={createDriver.isPending ? 'جاري الإنشاء...' : 'إنشاء بروفايل السائق'}
          onPress={handleSubmit}
          disabled={createDriver.isPending}
        />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.space4, paddingBottom: 40 },
  pageTitle: {
    fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 26,
    color: Colors.text, writingDirection: 'rtl',
    marginBottom: 6,
  },
  pageDesc: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 15,
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
    fontFamily: 'Almarai_800ExtraBold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, 
    fontSize: 16, color: Colors.text, writingDirection: 'rtl',
  },
  inputGroup: {
    marginBottom: Spacing.space4,
  },
  inputLabel: {
    fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, 
    fontSize: 13, color: Colors.text, writingDirection: 'rtl',
    marginBottom: 10,
  },
  input: {
    height: 56, backgroundColor: '#F4F6F8',
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.space4,
    fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4,  fontSize: 15, color: Colors.text,
    textAlign: 'right', writingDirection: 'rtl',
  },
  textArea: { height: 110, paddingTop: 16, paddingBottom: 16 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingVertical: 10, paddingHorizontal: Spacing.space4,
    borderRadius: Radius.pill,
    backgroundColor: '#F4F6F8',
  },
  chipActive: { backgroundColor: Colors.primary },
  chipText: {
    fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4,  fontSize: 13,
    color: Colors.textMuted, writingDirection: 'rtl',
  },
  chipTextActive: { color: Colors.white },
  checkRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, marginTop: Spacing.space4,
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 8,
    borderWidth: 1.5, borderColor: '#CBD5E1',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkLabel: {
    fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4,  fontSize: 14,
    color: Colors.text, writingDirection: 'rtl',
  },
  stickyFooter: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space4,
    paddingBottom: Spacing.space3,
    borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 10,
  },
})
