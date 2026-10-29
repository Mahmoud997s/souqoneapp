import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
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
import { useAuthGuard } from '../../../src/hooks/useAuthGuard'
import { dialogService } from '../../../src/store/dialogStore'

export default function ApplyJobScreen() {
  const { id } = useLocalSearchParams()
  const { user } = useAuthGuard()
  const { data: job } = useJob(id as string)
  
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
      dialogService.alert('تنبيه', 'يرجى إكمال الحقول المطلوبة ورفع السيرة الذاتية')
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
      dialogService.alert('تم', 'تم إرسال طلبك بنجاح', 'success')
      router.back()
    } catch {
      dialogService.alert('خطأ', 'تعذر إرسال الطلب')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.root}>
        <AppHeader title="التقدم للوظيفة" showBack variant="jobs" />
      
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        
        {/* Job Info Card */}
        <View style={s.jobCard}>
          <View style={s.iconBox}>
            <Ionicons name="car-sport-outline" size={24} color={Colors.text2} />
          </View>
          <View style={s.jobInfo}>
            <Text style={s.jobTitle} numberOfLines={1}>{job?.title}</Text>
            <Text style={s.jobCompany} numberOfLines={1}>
              {job?.user?.displayName || (job as any)?.seller?.displayName}
            </Text>
          </View>
        </View>

        <View style={s.form}>
          {/* Full Name */}
          <Text style={s.label}>الاسم الكامل <Text style={s.req}>*</Text></Text>
          <View style={s.inputRow}>
            <View style={s.iconWrapper}>
              <Ionicons name="person-outline" size={20} color={Colors.textMuted} />
            </View>
            <TextInput 
              style={s.input} 
              placeholder="أدخل اسمك كما في الهوية" 
              placeholderTextColor={Colors.textMuted}
              value={fullName} 
              onChangeText={setFullName} 
            />
          </View>

          {/* Phone */}
          <Text style={s.label}>رقم الهاتف <Text style={s.req}>*</Text></Text>
          <View style={s.inputRow}>
            <TextInput 
              style={s.phoneInput} 
              placeholder="9X XXX XXX" 
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad" 
              value={phone} 
              onChangeText={setPhone} 
            />
            <View style={s.countryCode}>
              <Text style={s.codeTxt}>+968</Text>
            </View>
          </View>

          {/* CV */}
          <Text style={s.label}>السيرة الذاتية <Text style={s.req}>*</Text></Text>
          <TouchableOpacity style={[s.uploadBox, cvFile && s.uploadBoxSuccess]} onPress={pickDocument} activeOpacity={0.7}>
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

          {/* Message */}
          <Text style={s.label}>رسالة لصاحب العمل (اختياري)</Text>
          <TextInput 
            style={s.textArea} 
            placeholder="اكتب نبذة مختصرة عن خبراتك..." 
            placeholderTextColor={Colors.textMuted}
            multiline 
            numberOfLines={4}
            value={message}
            onChangeText={setMessage}
          />
        </View>

      </ScrollView>

      {/* Footer */}
      <View style={s.footer}>
        <TouchableOpacity style={s.submitBtn} onPress={handleApply} disabled={submitting} activeOpacity={0.8}>
          <Text style={s.submitTxt}>{submitting ? 'جاري الإرسال...' : 'إرسال الطلب'}</Text>
          <Ionicons name="send" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f9fc' },
  content: { padding: Spacing.space4, paddingBottom: 100 },
  
  jobCard: { 
    flexDirection: 'row', 
    backgroundColor: Colors.white, 
    padding: Spacing.space4, 
    borderRadius: Radius.xl, 
    borderWidth: 1, 
    borderColor: Colors.border, 
    marginBottom: Spacing.space6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  iconBox: { 
    width: 48, 
    height: 48, 
    borderRadius: Radius.lg, 
    backgroundColor: '#f7f9fc', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginLeft: Spacing.space3 
  },
  jobInfo: { flex: 1, justifyContent: 'center' },
  jobTitle: { fontFamily: 'Almarai_700Bold',  fontSize: 16, color: Colors.text, textAlign: 'left' },
  jobCompany: { fontFamily: 'Almarai_400Regular',  fontSize: 14, color: Colors.text2, marginTop: 2, textAlign: 'left' },
  
  form: { gap: Spacing.space2 },
  label: { fontFamily: 'Almarai_700Bold',  fontSize: 14, color: Colors.text2, marginTop: Spacing.space3, textAlign: 'left' },
  req: { color: Colors.error },
  
  inputRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: Colors.white, 
    height: 48, 
    borderRadius: Radius.lg, 
    borderWidth: 1, 
    borderColor: Colors.border, 
    overflow: 'hidden' 
  },
  iconWrapper: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fdfdfd',
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  input: { 
    flex: 1, 
    height: '100%', 
    paddingHorizontal: Spacing.space3, 
    fontFamily: 'Almarai_400Regular', 
     
    color: Colors.text, 
    textAlign: 'left',
    writingDirection: 'rtl'
  },
  
  phoneInput: {
    flex: 1, 
    height: '100%', 
    paddingHorizontal: Spacing.space3, 
    fontFamily: 'Almarai_400Regular', 
     
    color: Colors.text, 
    textAlign: 'right',
    writingDirection: 'ltr'
  },
  countryCode: { 
    height: '100%',
    backgroundColor: '#f7f9fc', 
    borderLeftWidth: 1, 
    borderLeftColor: Colors.border, 
    paddingHorizontal: 16, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  codeTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 14, color: Colors.textMuted },
  
  uploadBox: { 
    height: 120, 
    borderWidth: 2, 
    borderColor: Colors.border, 
    borderStyle: 'dashed', 
    borderRadius: Radius.xl, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: Colors.white, 
    paddingHorizontal: 16 
  },
  uploadBoxSuccess: { borderColor: Colors.success, backgroundColor: '#f0fdf4', borderStyle: 'solid' },
  uploadTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 14, color: Colors.text, marginTop: 8, textAlign: 'center' },
  uploadSub: { fontFamily: 'Almarai_400Regular',  fontSize: 12, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
  
  textArea: { 
    backgroundColor: Colors.white, 
    borderRadius: Radius.lg, 
    borderWidth: 1, 
    borderColor: Colors.border, 
    padding: Spacing.space3, 
    fontFamily: 'Almarai_400Regular', 
     
    textAlign: 'left',
    writingDirection: 'rtl',
    textAlignVertical: 'top',
    minHeight: 120 
  },
  
  footer: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: Colors.white, 
    padding: Spacing.space4, 
    borderTopWidth: 1, 
    borderTopColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtn: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: Radius.lg, gap: 8 },
  submitTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 16, color: Colors.white }
})
