import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'
import { AppInput } from '../ui/AppInput'
import { OPERATOR_ROLES } from '../../constants/operators'
import { OperatorWizardFormData } from '../../store/operatorWizardStore'
import * as ImagePicker from 'expo-image-picker'
import { uploadsApi } from '../../api/uploads'
import { dialogService } from '../../store/dialogStore'
import { EditProfileAvatar } from '../profile/EditProfileAvatar'
import { Config } from '../../constants/config'
import { WizardCard } from '../ui/WizardCard'

export interface OperatorRoleStepProps {
  formData: OperatorWizardFormData
  errors: Record<string, string>
  onUpdateField: <K extends keyof OperatorWizardFormData>(field: K, value: OperatorWizardFormData[K]) => void
}

export function OperatorRoleStep({ formData, errors, onUpdateField }: OperatorRoleStepProps) {
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        dialogService.alert('صلاحية مطلوبة', 'يرجى منح إذن الوصول إلى المعرض من إعدادات الجهاز')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      })

      if (!result.canceled && result.assets?.[0]?.uri) {
        setIsUploadingImage(true)
        const asset = result.assets[0]
        const uri = asset.uri
        const rawFilename = asset.fileName || uri.split('/').pop() || 'avatar.jpg'
        const match = /\.(\w+)$/.exec(rawFilename)
        const type = asset.mimeType || (match ? `image/${match[1]}` : 'image/jpeg')
        const filename = rawFilename.includes('.') ? rawFilename : `${rawFilename}.${match ? match[1] : 'jpg'}`

        const uploadData = new FormData()
        uploadData.append('file', {
          uri,
          name: filename,
          type,
        } as any)

        const uploadRes = await uploadsApi.single(uploadData)
        if (uploadRes.data?.url) {
          onUpdateField('profileImageUrl', uploadRes.data.url)
        }
      }
    } catch (err: any) {
      console.error('❌ [OperatorRoleStep] Error uploading avatar:', err?.message, err?.response?.data || err)
      dialogService.alert('خطأ', 'حدث خطأ أثناء رفع الصورة')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const displayAvatar = formData.profileImageUrl
    ? formData.profileImageUrl.startsWith('http') || formData.profileImageUrl.startsWith('file')
      ? formData.profileImageUrl
      : `${Config.apiUrl}${formData.profileImageUrl.startsWith('/') ? '' : '/'}${formData.profileImageUrl}`
    : null

  return (
    <View style={s.stepWrap}>
      {/* Value proposition intro banner */}
      <View style={s.introCard}>
        <View style={s.introIconWrap}>
          <Ionicons name="sparkles" size={16} color="#2563EB" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.introTitle}>انضم لدليل المشغلين المعتمدين</Text>
          <Text style={s.introSub}>أبرز خبراتك ورخصك لأصحاب المعدات والشركات وتلقَّ طلبات العمل مباشرة</Text>
        </View>
      </View>

      <WizardCard title="الصورة الشخصية للمشغل (اختياري)" subtitle="أضف صورتك الشخصية لتعزيز الموثوقية">
        <View style={{ opacity: isUploadingImage ? 0.5 : 1 }}>
          <EditProfileAvatar displayAvatar={displayAvatar} onPress={handlePickAvatar} />
          {displayAvatar && (
            <TouchableOpacity onPress={() => onUpdateField('profileImageUrl', null)}>
              <Text style={{ textAlign: 'center', color: Colors.error, marginTop: 4, fontFamily: 'Almarai_700Bold', fontSize: 12 }}>إزالة الصورة</Text>
            </TouchableOpacity>
          )}
        </View>
      </WizardCard>

      <WizardCard title="اختر نوع الدور أو الخدمة *" subtitle="حدد تخصصك الرئيسي ليظهر في مقدمة بطاقتك التعريفية">
        {errors.operatorType ? (
          <Text style={s.inlineErrorTxt}>{errors.operatorType}</Text>
        ) : null}

      <View style={s.rolesGrid}>
        {OPERATOR_ROLES.map((r) => {
          const isSel = formData.operatorType === r.id
          return (
            <TouchableOpacity
              key={r.id}
              style={[s.roleCard, isSel && s.roleCardActive]}
              onPress={() => onUpdateField('operatorType', r.id)}
              activeOpacity={0.85}
            >
              <View style={[s.roleIconWrap, isSel && s.roleIconWrapActive]}>
                <Ionicons
                  name={r.icon as any}
                  size={20}
                  color={isSel ? '#ffffff' : Colors.primary}
                />
              </View>
              <View style={s.roleTextWrap}>
                <Text style={[s.roleTitle, isSel && s.roleTitleActive]} numberOfLines={1}>
                  {r.title}
                </Text>
                <Text style={s.roleDesc} numberOfLines={1}>
                  {r.desc}
                </Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
      </WizardCard>

      {/* Grouped Info Card */}
      <WizardCard title="التفاصيل المهنية *" subtitle="عنوان الإعلان ونبذة عن خبراتك">
        <AppInput
          label="عنوان الإعلان / المسمى المهني *"
          placeholder="مثال: مشغل معدات ثقيلة وبلدوزر خبرة 10 سنوات"
          value={formData.title}
          onChangeText={(val) => onUpdateField('title', val)}
          maxLength={100}
          error={errors.title}
        />

        <AppInput
          label="سنوات الخبرة الإجمالية *"
          placeholder="مثال: 8"
          keyboardType="numeric"
          value={formData.experienceYears}
          onChangeText={(val) => onUpdateField('experienceYears', val)}
          error={errors.experienceYears}
        />

        <AppInput
          label="نبذة عن الخبرات والمهام السابقة *"
          placeholder="اكتب نبذة توضح المشاريع السابقة، ساعات التوفر..."
          value={formData.description}
          onChangeText={(val) => onUpdateField('description', val)}
          multiline
          numberOfLines={3}
          maxLength={2000}
          error={errors.description}
        />
      </WizardCard>
    </View>
  )
}

const s = StyleSheet.create({
  stepWrap: {
    gap: Spacing.space3,
  },
  introCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: Radius.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.space2,
  },
  introIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 12.5,
    lineHeight: 18,
    color: '#1E40AF',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  introSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: '#3B82F6',
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: 1,
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
  inlineErrorTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.error,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: -4,
    marginBottom: 6,
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
  cardSection: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.space4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: Spacing.space3,
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1.5 },
    }),
  },
})
