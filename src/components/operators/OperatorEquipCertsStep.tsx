import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'
import { CardSystem } from '../../constants/cardSystem'
import { AppInput } from '../ui/AppInput'
import { AVAILABLE_EQUIPMENT } from '../../constants/operators'
import { OperatorEquipCertsStepProps } from '../../types/operatorForm.types'

export function OperatorEquipCertsStep({
  formData,
  errors,
  onToggleEquipment,
  onPickCertificateImages,
  onRemoveCertificate,
  onAddTextCertificate,
  onAddSpecialization,
  onRemoveSpecialization,
  isUploading,
}: OperatorEquipCertsStepProps) {
  const [tempCert, setTempCert] = useState('')
  const [tempSpec, setTempSpec] = useState('')

  const handleAddCert = () => {
    if (tempCert.trim()) {
      onAddTextCertificate(tempCert.trim())
      setTempCert('')
    } else {
      onPickCertificateImages()
    }
  }

  const handleAddSpec = () => {
    if (tempSpec.trim() && onAddSpecialization) {
      onAddSpecialization(tempSpec.trim())
      setTempSpec('')
    }
  }

  return (
    <View style={s.stepWrap}>
      {/* Equipment Selection Section */}
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
                onPress={() => onToggleEquipment(eq.id)}
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
          onPress={onPickCertificateImages}
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
        {formData.certifications.filter((c) => c.startsWith('http') || c.startsWith('/')).length > 0 && (
          <View style={s.certImagesGrid}>
            {formData.certifications.map((c, i) => {
              const isImg = c.startsWith('http') || c.startsWith('/')
              if (!isImg) return null
              return (
                <View key={`img-${i}`} style={s.certImgThumbWrap}>
                  <Image source={{ uri: c }} style={s.certImgThumb} contentFit="cover" />
                  <TouchableOpacity
                    style={s.removeImgBtn}
                    onPress={() => onRemoveCertificate(i)}
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
              placeholder="مثال: رخصة قيادة ثقيلة (عمان)"
              value={tempCert}
              onChangeText={setTempCert}
              maxLength={50}
              onSubmitEditing={handleAddCert}
              returnKeyType="done"
            />
          </View>
          <TouchableOpacity style={s.addBtn} onPress={handleAddCert} activeOpacity={0.8}>
            <Ionicons name="add" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Text certificate tags */}
        {formData.certifications.filter((c) => !c.startsWith('http') && !c.startsWith('/')).length > 0 && (
          <View style={s.tagsList}>
            {formData.certifications.map((c, i) => {
              const isImg = c.startsWith('http') || c.startsWith('/')
              if (isImg) return null
              return (
                <View key={i} style={s.certTag}>
                  <Ionicons name="ribbon" size={13} color="#92400E" style={{ marginEnd: 4 }} />
                  <Text style={s.certTagTxt}>{c}</Text>
                  <TouchableOpacity
                    onPress={() => onRemoveCertificate(i)}
                    style={s.removeTagBtn}
                    hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                  >
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
              placeholder="مثال: حفر الخنادق العميقة"
              value={tempSpec}
              onChangeText={setTempSpec}
              maxLength={50}
              onSubmitEditing={handleAddSpec}
              returnKeyType="done"
            />
          </View>
          <TouchableOpacity style={s.addBtn} onPress={handleAddSpec} activeOpacity={0.8}>
            <Ionicons name="add" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {formData.specializations && formData.specializations.length > 0 && (
          <View style={s.tagsList}>
            {formData.specializations.map((sp, i) => (
              <View key={i} style={s.specTag}>
                <Ionicons name="checkmark-done" size={13} color="#1E40AF" style={{ marginEnd: 4 }} />
                <Text style={s.specTagTxt}>{sp}</Text>
                <TouchableOpacity
                  onPress={() => onRemoveSpecialization?.(i)}
                  style={s.removeTagBtn}
                  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                >
                  <Ionicons name="close-circle" size={15} color="#1E40AF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  stepWrap: {
    gap: Spacing.space3,
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
  cardTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 13.5,
    lineHeight: 19,
    color: '#0F172A',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  cardSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: -4,
    marginBottom: Spacing.space1,
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
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBoxTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 17,
    color: '#1E40AF',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  uploadBoxSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10.5,
    lineHeight: 14,
    color: '#64748B',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  uploadAddPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  uploadAddPillTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.primary,
  },
  certImagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.space2,
  },
  certImgThumbWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  certImgThumb: {
    width: '100%',
    height: '100%',
  },
  removeImgBtn: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Spacing.space2,
  },
  certTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: Radius.pill,
    paddingStart: 8,
    paddingEnd: 6,
    paddingVertical: 5,
  },
  certTagTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: '#92400E',
    marginEnd: 4,
  },
  specTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: Radius.pill,
    paddingStart: 8,
    paddingEnd: 6,
    paddingVertical: 5,
  },
  specTagTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: '#1E40AF',
    marginEnd: 4,
  },
  removeTagBtn: {
    padding: 1,
  },
})
