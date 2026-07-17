import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Image, ActivityIndicator, Modal
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
import { uploadsApi } from '../../src/api/uploads'
import { router } from 'expo-router'
import { STRINGS } from '../../src/constants/jobs'

export default function VerificationScreen() {
  const insets = useSafeAreaInsets()
  const { data: driverProfile, isLoading: profileLoading } = useMyDriverProfile()
  const { data: verification, isLoading: verLoading } = useVerificationStatus()
  const submitMutation = useSubmitVerification()

  const [licenseImageFront, setLicenseImageFront] = useState<string | null>(null)
  const [licenseImageBack, setLicenseImageBack] = useState<string | null>(null)
  const [idImageFront, setIdImageFront] = useState<string | null>(null)
  const [idImageBack, setIdImageBack] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [errors, setErrors] = useState<{ lf?: string; lb?: string; idf?: string; idb?: string }>({})

  const [sheetVisible, setSheetVisible] = useState(false)
  const [currentSetter, setCurrentSetter] = useState<((uri: string | null) => void) | null>(null)

  const isLoading = profileLoading || verLoading

  const pickImage = (setter: (uri: string | null) => void) => {
    setCurrentSetter(() => setter)
    setSheetVisible(true)
  }

  const handleCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('صلاحية مطلوبة', 'يرجى منح إذن الوصول للكاميرا')
        setSheetVisible(false)
        return
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      })
      if (!result.canceled && result.assets[0] && currentSetter) {
        currentSetter(result.assets[0].uri)
      }
    } catch (error) {
      console.log('Camera error:', error)
    } finally {
      setSheetVisible(false)
    }
  }

  const handleGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('صلاحية مطلوبة', 'يرجى منح إذن الوصول للاستوديو')
        setSheetVisible(false)
        return
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      })
      if (!result.canceled && result.assets[0] && currentSetter) {
        currentSetter(result.assets[0].uri)
      }
    } catch (error) {
      console.log('Gallery error:', error)
    } finally {
      setSheetVisible(false)
    }
  }

  const handleSubmit = async () => {
    const newErrors: any = {}
    if (!licenseImageFront) newErrors.lf = 'مطلوب رفع صورة الوجه الأمامي للرخصة'
    if (!licenseImageBack) newErrors.lb = 'مطلوب رفع صورة الوجه الخلفي للرخصة'
    if (!idImageFront) newErrors.idf = 'مطلوب رفع صورة الوجه الأمامي للهوية'
    if (!idImageBack) newErrors.idb = 'مطلوب رفع صورة الوجه الخلفي للهوية'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({}) // clear errors

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('files', { uri: licenseImageFront, name: 'lf.jpg', type: 'image/jpeg' } as any)
      formData.append('files', { uri: licenseImageBack, name: 'lb.jpg', type: 'image/jpeg' } as any)
      formData.append('files', { uri: idImageFront, name: 'if.jpg', type: 'image/jpeg' } as any)
      formData.append('files', { uri: idImageBack, name: 'ib.jpg', type: 'image/jpeg' } as any)

      const uploadRes = await uploadsApi.multiple(formData)
      const uploadedUrls = uploadRes.data

      if (!uploadedUrls || uploadedUrls.length < 4) {
        throw new Error('فشل رفع بعض الصور')
      }

      await submitMutation.mutateAsync({
        licenseImageUrl: uploadedUrls[0].url,
        licenseBackImageUrl: uploadedUrls[1].url,
        idImageUrl: uploadedUrls[2].url,
        idBackImageUrl: uploadedUrls[3].url,
      })
      Alert.alert('نجاح', STRINGS.VERIFICATION_SUBMIT_SUCCESS, [
        { text: 'حسناً', onPress: () => router.back() }
      ])
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message ?? e.message ?? 'حدث خطأ، حاول مرة أخرى')
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

const UploadBox = ({ title, image, setImage, error, setError }: { title: string, image: string | null, setImage: (uri: string | null) => void, error?: string, setError?: () => void }) => (
  <View style={{ marginBottom: Spacing.space5 }}>
    <Text style={s.sectionTitle}>{title}</Text>
    <TouchableOpacity
      style={[s.uploadBox, image ? s.uploadBoxFilled : {}, error ? s.uploadBoxError : {}, { marginBottom: 0 }]}
      onPress={() => pickImage((uri) => {
        setImage(uri)
        if (setError) setError() // clear error on pick
      })}
      activeOpacity={0.8}
    >
      {image ? (
        <View style={s.uploadSuccessContainer}>
          <Image source={{ uri: image }} style={s.uploadPreview} resizeMode="cover" />
          <View style={s.uploadSuccessOverlay}>
            <TouchableOpacity onPress={() => setImage(null)} style={s.deleteBtn}>
              <Ionicons name="trash" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={s.uploadPlaceholder}>
          <View style={[s.uploadIconCircle, error && { backgroundColor: Colors.error + '10' }]}>
            <Ionicons name="camera" size={28} color={error ? Colors.error : Colors.primary} />
          </View>
          <Text style={[s.uploadText, error && { color: Colors.error }]}>اضغط لالتقاط أو اختيار صورة</Text>
        </View>
      )}
    </TouchableOpacity>
    {error && <Text style={s.errorText}>{error}</Text>}
  </View>
)

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
    <View style={s.root}>
      <AppHeader title="توثيق الهوية" showBack variant="jobs" />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Current Status Card */}
        {verification && (
          <View style={[
            s.statusCard,
            verification.status?.toUpperCase() === 'APPROVED' && s.statusApproved,
            verification.status?.toUpperCase() === 'REJECTED' && s.statusRejected,
            verification.status?.toUpperCase() === 'PENDING' && s.statusPending,
          ]}>
            <Ionicons
              name={
                verification.status?.toUpperCase() === 'APPROVED' ? 'checkmark-circle' :
                verification.status?.toUpperCase() === 'REJECTED' ? 'close-circle' :
                'time-outline'
              }
              size={28}
              color={
                verification.status?.toUpperCase() === 'APPROVED' ? '#16a34a' :
                verification.status?.toUpperCase() === 'REJECTED' ? Colors.error :
                '#d97706'
              }
            />
            <View style={s.statusContent}>
              <Text style={s.statusTitle}>
                {verification.status?.toUpperCase() === 'APPROVED' ? 'تم التوثيق بنجاح ✅' :
                 verification.status?.toUpperCase() === 'REJECTED' ? 'تم رفض الطلب' :
                 'طلب قيد المراجعة'}
              </Text>
              {verification.status?.toUpperCase() === 'REJECTED' && verification.rejectionReason && (
                <Text style={s.rejectionReason}>
                  سبب الرفض: {verification.rejectionReason}
                </Text>
              )}
              {verification.status?.toUpperCase() === 'PENDING' && (
                <Text style={s.statusDesc}>
                  جاري مراجعة وثائقك من قبل الفريق. قد يستغرق ذلك 24-48 ساعة.
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Info */}
        {(!verification || verification.status?.toUpperCase() === 'REJECTED') && (
          <>
            <View style={s.infoCard}>
              <View style={s.infoIconBox}>
                <Ionicons name="information-circle" size={24} color={Colors.primary} />
              </View>
              <View style={s.infoContent}>
                <Text style={s.infoTitle}>تعليمات التصوير</Text>
                <Text style={s.infoDesc}>
                  • يرجى التأكد من وضوح الصورة وخلوها من الانعكاسات.{"\\n"}
                  • تأكد من ظهور زوايا البطاقة الأربعة.{"\\n"}
                  • يجب تصوير البطاقة الأصلية (لا تقبل الصور المنسوخة).
                </Text>
              </View>
            </View>

            <UploadBox title="الرخصة (الوجه الأمامي) *" image={licenseImageFront} setImage={setLicenseImageFront} error={errors.lf} setError={() => setErrors(prev => ({...prev, lf: undefined}))} />
            <UploadBox title="الرخصة (الوجه الخلفي) *" image={licenseImageBack} setImage={setLicenseImageBack} error={errors.lb} setError={() => setErrors(prev => ({...prev, lb: undefined}))} />
            <UploadBox title="الهوية (الوجه الأمامي) *" image={idImageFront} setImage={setIdImageFront} error={errors.idf} setError={() => setErrors(prev => ({...prev, idf: undefined}))} />
            <UploadBox title="الهوية (الوجه الخلفي) *" image={idImageBack} setImage={setIdImageBack} error={errors.idb} setError={() => setErrors(prev => ({...prev, idb: undefined}))} />

          </>
        )}

      </ScrollView>

      {/* Bottom Bar for Submit */}
      {(!verification || verification.status?.toUpperCase() === 'REJECTED') && (
        <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, Spacing.space4) }]}>
          <AppButton
            title={isUploading || submitMutation.isPending ? 'جاري الإرسال...' : 'إرسال طلب التوثيق'}
            onPress={handleSubmit}
            style={s.mainBtn}
            disabled={isUploading || submitMutation.isPending}
          />
        </View>
      )}

      {/* Bottom Sheet Modal */}
      <Modal visible={sheetVisible} transparent animationType="fade" onRequestClose={() => setSheetVisible(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setSheetVisible(false)}>
          <View style={[s.bottomSheet, { paddingBottom: Math.max(insets.bottom, Spacing.space4) }]}>
            <Text style={s.sheetTitle}>اختر مصدر الصورة</Text>
            
            <TouchableOpacity style={s.sheetBtn} onPress={handleCamera}>
              <Ionicons name="camera" size={24} color={Colors.primary} />
              <Text style={s.sheetBtnText}>التقاط صورة بالكاميرا</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={s.sheetBtn} onPress={handleGallery}>
              <Ionicons name="images" size={24} color={Colors.primary} />
              <Text style={s.sheetBtnText}>اختيار من الاستوديو</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.sheetCancelBtn} onPress={() => setSheetVisible(false)}>
              <Text style={s.sheetCancelText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  centered: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.space6,
  },
  content: { padding: Spacing.space4, paddingBottom: Spacing.space4 },

  bottomBar: {
    backgroundColor: Colors.white,
    padding: Spacing.space4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: -4 }, elevation: 10,
  },

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
    fontFamily: 'Almarai_700Bold',  fontSize: 15,
    color: Colors.text, writingDirection: 'rtl', marginBottom: Spacing.space1,
  },
  statusDesc: {
    fontFamily: 'Almarai_400Regular',  fontSize: 13,
    color: Colors.text2, writingDirection: 'rtl', lineHeight: 18,
  },
  rejectionReason: {
    fontFamily: 'Almarai_400Regular',  fontSize: 13,
    color: Colors.error, writingDirection: 'rtl', lineHeight: 18,
  },

  infoCard: {
    flexDirection: 'row', gap: Spacing.space3, padding: Spacing.space4,
    backgroundColor: '#F0F9FF', borderRadius: Radius.xl,
    borderWidth: 1, borderColor: '#E0F2FE',
    marginBottom: Spacing.space5, alignItems: 'center',
    shadowColor: Colors.primary, shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  infoIconBox: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#E0F2FE',
    alignItems: 'center', justifyContent: 'center',
  },
  infoContent: { flex: 1, alignItems: 'flex-start' },
  infoTitle: {
    fontFamily: 'Almarai_700Bold',  fontSize: 15,
    color: Colors.primary, writingDirection: 'rtl', marginBottom: 2, textAlign: 'left',
  },
  infoDesc: {
    fontFamily: 'Almarai_400Regular',  fontSize: 13,
    color: Colors.primary + 'CC', writingDirection: 'rtl', lineHeight: 20, textAlign: 'left',
  },

  sectionTitle: {
    fontFamily: 'Almarai_700Bold',  fontSize: 14,
    color: Colors.text, writingDirection: 'rtl', textAlign: 'left',
    marginBottom: 10, marginTop: Spacing.space2,
  },
  uploadBox: {
    height: 160, borderRadius: Radius.xl,
    borderWidth: 2, borderColor: Colors.border,
    borderStyle: 'dashed', backgroundColor: Colors.white,
    marginBottom: Spacing.space6, overflow: 'hidden',
  },
  uploadBoxFilled: { borderStyle: 'solid', borderColor: Colors.primary },
  uploadBoxError: { borderColor: Colors.error, backgroundColor: '#FEF2F2' },
  errorText: {
    fontFamily: 'Almarai_400Regular',  fontSize: 13,
    color: Colors.error, marginTop: 4, textAlign: 'left', writingDirection: 'rtl',
  },
  uploadPlaceholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.space4,
  },
  uploadIconCircle: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primary + '10',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.space3,
  },
  uploadText: {
    fontFamily: 'Almarai_700Bold',  fontSize: 15,
    color: Colors.text, textAlign: 'center',
  },
  uploadSubText: {
    fontFamily: 'Almarai_400Regular',  fontSize: 13,
    color: Colors.textMuted, marginTop: 4, textAlign: 'center',
  },
  uploadSuccessContainer: {
    width: '100%', height: '100%', position: 'relative',
  },
  uploadPreview: { width: '100%', height: '100%', borderRadius: Radius.xl },
  deleteBtn: {
    position: "absolute", top: 10, right: 10,
    backgroundColor: "rgba(220, 38, 38, 0.8)",
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  uploadSuccessOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: Radius.xl,
    alignItems: 'center', justifyContent: 'center',
  },
  uploadSuccessText: {
    fontFamily: 'Almarai_700Bold',  fontSize: 14,
    color: Colors.white, marginTop: Spacing.space2,
  },

  emptyTitle: {
    fontFamily: 'Almarai_700Bold',  fontSize: 18,
    color: Colors.text, marginTop: Spacing.space4, textAlign: 'center',
  },
  emptyDesc: {
    fontFamily: 'Almarai_400Regular',  fontSize: 14,
    color: Colors.text2, marginTop: Spacing.space2, textAlign: 'center',
    lineHeight: 22,
  },
  mainBtn: {
    height: 56,
    borderRadius: Radius.xl,
    elevation: 3,
    shadowColor: Colors.primary, shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }
  },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.space4, paddingTop: Spacing.space5,
  },
  sheetTitle: {
    fontFamily: 'Almarai_700Bold', fontSize: 16, color: Colors.text, textAlign: 'center',
    marginBottom: Spacing.space4, writingDirection: 'rtl',
  },
  sheetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
    backgroundColor: '#F8F9FA', padding: Spacing.space4, borderRadius: Radius.lg,
    marginBottom: Spacing.space3, gap: Spacing.space3,
  },
  sheetBtnText: {
    fontFamily: 'Almarai_700Bold', fontSize: 15, color: Colors.text, writingDirection: 'rtl',
  },
  sheetCancelBtn: {
    padding: Spacing.space4, alignItems: 'center', marginTop: Spacing.space2,
  },
  sheetCancelText: {
    fontFamily: 'Almarai_700Bold', fontSize: 15, color: Colors.error,
  },
})
