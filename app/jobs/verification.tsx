import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Image, ActivityIndicator
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { AppButton } from '../../src/components/ui/AppButton'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { useVerificationStatus, useSubmitVerification } from '../../src/hooks/useVerification'
import { useMyDriverProfile } from '../../src/hooks/useDriverProfile'
import { router } from 'expo-router'
import { STRINGS } from '../../src/constants/jobs'

export default function VerificationScreen() {
  const insets = useSafeAreaInsets()
  const { data: driverProfile, isLoading: profileLoading } = useMyDriverProfile()
  const { data: verification, isLoading: verLoading } = useVerificationStatus()
  const submitMutation = useSubmitVerification()

  const [licenseImage, setLicenseImage] = useState<string | null>(null)
  const [idImage, setIdImage] = useState<string | null>(null)

  const isLoading = profileLoading || verLoading

  const pickImage = async (setter: (uri: string) => void) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('صلاحية مطلوبة', 'يرجى منح إذن الوصول إلى الصور')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    })
    if (!result.canceled && result.assets[0]) {
      setter(result.assets[0].uri)
    }
  }

  const handleSubmit = async () => {
    if (!licenseImage || !idImage) {
      Alert.alert('مطلوب', STRINGS.VERIFICATION_UPLOAD_ERROR)
      return
    }
    try {
      const formData = new FormData()
      formData.append('licenseImage', {
        uri: licenseImage,
        name: 'license.jpg',
        type: 'image/jpeg',
      } as any)
      formData.append('idImage', {
        uri: idImage,
        name: 'id.jpg',
        type: 'image/jpeg',
      } as any)
      await submitMutation.mutateAsync(formData)
      Alert.alert('نجاح', STRINGS.VERIFICATION_SUBMIT_SUCCESS, [
        { text: 'حسناً', onPress: () => router.back() }
      ])
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message ?? 'حدث خطأ، حاول مرة أخرى')
    }
  }

  if (isLoading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  if (!driverProfile) {
    return (
      <View style={[s.root, { paddingBottom: insets.bottom }]}>
        <AppHeader title="التوثيق" showBack variant="jobs" />
        <View style={s.centered}>
          <Ionicons name="person-circle-outline" size={64} color={Colors.textMuted} />
          <Text style={s.emptyTitle}>{STRINGS.NO_DRIVER_PROFILE_TITLE}</Text>
          <Text style={s.emptyDesc}>{STRINGS.NO_DRIVER_PROFILE_DESC}</Text>
          <AppButton
            title={STRINGS.CREATE_PROFILE}
            onPress={() => router.push('/jobs/onboarding')}
            style={s.mainBtn}
          />
        </View>
      </View>
    )
  }

  return (
    <View style={[s.root, { paddingBottom: insets.bottom }]}>
      <AppHeader title="توثيق الهوية" showBack variant="jobs" />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Current Status Card */}
        {verification && (
          <View style={[
            s.statusCard,
            verification.status === 'APPROVED' && s.statusApproved,
            verification.status === 'REJECTED' && s.statusRejected,
            verification.status === 'PENDING' && s.statusPending,
          ]}>
            <Ionicons
              name={
                verification.status === 'APPROVED' ? 'checkmark-circle' :
                verification.status === 'REJECTED' ? 'close-circle' :
                'time-outline'
              }
              size={28}
              color={
                verification.status === 'APPROVED' ? '#16a34a' :
                verification.status === 'REJECTED' ? Colors.error :
                '#d97706'
              }
            />
            <View style={s.statusContent}>
              <Text style={s.statusTitle}>
                {verification.status === 'APPROVED' ? 'تم التوثيق بنجاح ✅' :
                 verification.status === 'REJECTED' ? 'تم رفض الطلب' :
                 'طلب قيد المراجعة'}
              </Text>
              {verification.status === 'REJECTED' && verification.rejectionReason && (
                <Text style={s.rejectionReason}>
                  سبب الرفض: {verification.rejectionReason}
                </Text>
              )}
              {verification.status === 'PENDING' && (
                <Text style={s.statusDesc}>
                  جاري مراجعة وثائقك من قبل الفريق. قد يستغرق ذلك 24-48 ساعة.
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Info */}
        {(!verification || verification.status === 'REJECTED') && (
          <>
            <View style={s.infoCard}>
              <Ionicons name="shield-checkmark-outline" size={24} color={Colors.primary} />
              <View style={s.infoContent}>
                <Text style={s.infoTitle}>لماذا التوثيق مهم؟</Text>
                <Text style={s.infoDesc}>
                  السائقون الموثقون يحصلون على شارة ✓ بجوار أسمائهم، مما يزيد ثقة أصحاب العمل ويرفع فرص قبول عروضهم.
                </Text>
              </View>
            </View>

            {/* Upload License */}
            <Text style={s.sectionTitle}>صورة رخصة القيادة *</Text>
            <TouchableOpacity
              style={[s.uploadBox, licenseImage && s.uploadBoxFilled]}
              onPress={() => pickImage(setLicenseImage)}
              activeOpacity={0.8}
            >
              {licenseImage ? (
                <Image source={{ uri: licenseImage }} style={s.uploadPreview} resizeMode="cover" />
              ) : (
                <>
                  <Ionicons name="id-card-outline" size={36} color={Colors.textMuted} />
                  <Text style={s.uploadText}>اضغط لرفع صورة الرخصة</Text>
                  <Text style={s.uploadSubText}>JPG أو PNG، حجم أقصى 5 ميغا</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Upload ID */}
            <Text style={s.sectionTitle}>صورة الهوية الوطنية *</Text>
            <TouchableOpacity
              style={[s.uploadBox, idImage && s.uploadBoxFilled]}
              onPress={() => pickImage(setIdImage)}
              activeOpacity={0.8}
            >
              {idImage ? (
                <Image source={{ uri: idImage }} style={s.uploadPreview} resizeMode="cover" />
              ) : (
                <>
                  <Ionicons name="card-outline" size={36} color={Colors.textMuted} />
                  <Text style={s.uploadText}>اضغط لرفع صورة الهوية</Text>
                  <Text style={s.uploadSubText}>JPG أو PNG، حجم أقصى 5 ميغا</Text>
                </>
              )}
            </TouchableOpacity>

            <AppButton
              title={submitMutation.isPending ? 'جاري الإرسال...' : 'إرسال طلب التوثيق'}
              onPress={handleSubmit}
              style={s.mainBtn}
              disabled={submitMutation.isPending}
            />
          </>
        )}

      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  centered: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.space6,
  },
  content: { padding: Spacing.space4, paddingBottom: 100 },

  statusCard: {
    flexDirection: 'row', gap: Spacing.space3,
    padding: Spacing.space4, borderRadius: Radius.lg,
    borderWidth: 1, marginBottom: Spacing.space5,
    alignItems: 'flex-start',
  },
  statusApproved: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  statusRejected: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  statusPending: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  statusContent: { flex: 1, alignItems: 'flex-end' },
  statusTitle: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 15,
    color: Colors.text, writingDirection: 'rtl', marginBottom: Spacing.space1,
  },
  statusDesc: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13,
    color: Colors.text2, writingDirection: 'rtl', lineHeight: 18,
  },
  rejectionReason: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13,
    color: Colors.error, writingDirection: 'rtl', lineHeight: 18,
  },

  infoCard: {
    flexDirection: 'row', gap: Spacing.space3, padding: Spacing.space4,
    backgroundColor: '#EFF6FF', borderRadius: Radius.lg,
    borderWidth: 1, borderColor: '#DBEAFE',
    marginBottom: Spacing.space5, alignItems: 'flex-start',
  },
  infoContent: { flex: 1, alignItems: 'flex-end' },
  infoTitle: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14,
    color: Colors.primary, writingDirection: 'rtl', marginBottom: Spacing.space1,
  },
  infoDesc: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13,
    color: Colors.primaryLight, writingDirection: 'rtl', lineHeight: 18,
  },

  sectionTitle: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14,
    color: Colors.text, writingDirection: 'rtl',
    marginBottom: 10,
  },
  uploadBox: {
    height: 150, borderRadius: Radius.lg,
    borderWidth: 2, borderColor: Colors.border,
    borderStyle: 'dashed', backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.space5, overflow: 'hidden',
  },
  uploadBoxFilled: { borderStyle: 'solid', borderColor: Colors.primary },
  uploadPreview: { width: '100%', height: '100%' },
  uploadText: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14,
    color: Colors.text2, marginTop: Spacing.space2, textAlign: 'center',
  },
  uploadSubText: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 12,
    color: Colors.textMuted, marginTop: Spacing.space1, textAlign: 'center',
  },

  emptyTitle: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 18,
    color: Colors.text, marginTop: Spacing.space4, textAlign: 'center',
  },
  emptyDesc: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14,
    color: Colors.text2, marginTop: Spacing.space2, textAlign: 'center',
    lineHeight: 22,
  },
  mainBtn: { marginTop: Spacing.space3 },
})
