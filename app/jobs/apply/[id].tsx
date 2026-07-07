import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import { useLocalSearchParams, router } from 'expo-router'
import { useJob } from '../../../src/hooks/useJobs'
import { jobsApi } from '../../../src/api/jobs'
import { Ionicons } from '@expo/vector-icons'
import { AppHeader } from '../../../src/components/ui/AppHeader'
import { Colors } from '../../../src/constants/colors'
import { Spacing } from '../../../src/constants/spacing'
import { Radius } from '../../../src/constants/radius'
import { useAuthStore } from '../../../src/store/authStore'

export default function ApplyJobScreen() {
  const { id } = useLocalSearchParams()
  const { data: job } = useJob(id as string)
  const { user } = useAuthStore()
  const [fullName, setFullName] = useState(user?.displayName ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [message, setMessage] = useState('')
  const [cvFile, setCvFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      })
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCvFile(result.assets[0])
      }
    } catch (err) {
      console.log('Error picking document', err)
    }
  }

  const handleApply = async () => {
    if (!fullName.trim() || !phone.trim() || !cvFile) {
      Alert.alert('تنبيه', 'يرجى إكمال الحقول المطلوبة ورفع السيرة الذاتية')
      return
    }
    const formData = new FormData() as any
    formData.append('fullName', fullName)
    formData.append('phone', phone)
    formData.append('message', message)
    formData.append('cv', {
      uri: cvFile.uri,
      name: cvFile.name,
      type: cvFile.mimeType ?? 'application/pdf'
    })
    
    setSubmitting(true)
    try {
      await jobsApi.apply(id as string, formData)
      Alert.alert('تم', 'تم إرسال طلبك', [
        { text: 'حسناً', onPress: () => router.back() }
      ])
    } catch {
      Alert.alert('خطأ', 'تعذر إرسال الطلب')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={s.root}>
      <AppHeader title="التقدم للوظيفة" showBack variant="jobs" />
      
      <ScrollView contentContainerStyle={s.content}>
        
        <View style={s.jobCard}>
          <View style={s.iconBox}>
            <Ionicons name="car-sport-outline" size={24} color={Colors.text2} />
          </View>
          <View style={s.jobInfo}>
            <Text style={s.jobTitle}>{job?.title}</Text>
            <Text style={s.jobCompany}>{job?.user?.displayName || (job as any)?.seller?.displayName}</Text>
          </View>
        </View>

        <View style={s.form}>
          <Text style={s.label}>الاسم الكامل <Text style={s.req}>*</Text></Text>
          <View style={s.inputWrapper}>
            <TextInput style={s.input} placeholder="أدخل اسمك كما في الهوية" value={fullName} onChangeText={setFullName} />
            <Ionicons name="person-outline" size={20} color={Colors.textMuted} style={s.inputIcon} />
          </View>

          <Text style={s.label}>رقم الهاتف <Text style={s.req}>*</Text></Text>
          <View style={s.phoneRow}>
            <TextInput style={[s.input, s.phoneInput]} placeholder="9X XXX XXX" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            <View style={s.countryCode}><Text style={s.codeTxt}>+968</Text></View>
          </View>

          <Text style={s.label}>السيرة الذاتية <Text style={s.req}>*</Text></Text>
          <TouchableOpacity style={[s.uploadBox, cvFile && s.uploadBoxSuccess]} onPress={pickDocument}>
            {cvFile ? (
              <>
                <Ionicons name="document-text" size={32} color={Colors.success} />
                <Text style={s.uploadTxt}>{cvFile.name}</Text>
                <Text style={s.uploadSub}>تم إرفاق الملف بنجاح</Text>
              </>
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={32} color={Colors.primary} />
                <Text style={s.uploadTxt}>اضغط لرفع ملف السيرة الذاتية</Text>
                <Text style={s.uploadSub}>صيغ مدعومة: PDF, DOCX (أقصى حجم 5MB)</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={s.label}>رسالة لصاحب العمل (اختياري)</Text>
          <TextInput 
            style={s.textArea} 
            placeholder="اكتب نبذة مختصرة عن خبراتك..." 
            multiline 
            numberOfLines={4}
            textAlignVertical="top"
            value={message}
            onChangeText={setMessage}
          />
        </View>

      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.submitBtn} onPress={handleApply} disabled={submitting}>
          <Text style={s.submitTxt}>{submitting ? 'جاري الإرسال...' : 'إرسال الطلب'}</Text>
          <Ionicons name="send" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  )
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f9fc' },
  content: { padding: Spacing.space4, paddingBottom: 100 },
  jobCard: { flexDirection: 'row', backgroundColor: Colors.white, padding: Spacing.space4, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.space6 },
  iconBox: { width: 48, height: 48, borderRadius: Radius.lg, backgroundColor: '#f7f9fc', alignItems: 'center', justifyContent: 'center', marginLeft: Spacing.space3 },
  jobInfo: { flex: 1, justifyContent: 'center' },
  jobTitle: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 16, color: Colors.text },
  jobCompany: { fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14, color: Colors.text2, marginTop: 2 },
  form: { gap: Spacing.space2 },
  label: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14, color: Colors.text2, marginTop: Spacing.space3 },
  req: { color: Colors.error },
  inputWrapper: { position: 'relative' },
  input: { backgroundColor: Colors.white, height: 48, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.space3, fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, textAlign: 'right' },
  inputIcon: { position: 'absolute', right: 12, top: 14 },
  phoneRow: { flexDirection: 'row' },
  phoneInput: { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRightWidth: 0 },
  countryCode: { backgroundColor: '#f7f9fc', borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16, justifyContent: 'center', borderTopRightRadius: Radius.lg, borderBottomRightRadius: Radius.lg },
  codeTxt: { fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, color: Colors.text2 },
  uploadBox: { height: 120, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white, paddingHorizontal: 16 },
  uploadBoxSuccess: { borderColor: Colors.success, backgroundColor: '#f0fdf4' },
  uploadTxt: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14, color: Colors.text, marginTop: 8, textAlign: 'center' },
  uploadSub: { fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  textArea: { backgroundColor: Colors.white, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.space3, fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, textAlign: 'right', minHeight: 100 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.white, padding: Spacing.space4, borderTopWidth: 1, borderTopColor: Colors.border },
  submitBtn: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: Radius.lg, gap: 8 },
  submitTxt: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 16, color: Colors.white }
})
