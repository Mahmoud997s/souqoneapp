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
import { OperatorWizardFormData } from '../../store/operatorWizardStore'
import { WizardCard } from '../ui/WizardCard'
import { WizardOptionChip } from '../wizard/WizardOptionChip'

export interface OperatorEquipCertsStepProps {
  formData: OperatorWizardFormData
  errors: Record<string, string>
  onToggleEquipment: (eqId: string) => void
  onPickCertificateImages: () => void
  onRemoveCertificate: (index: number) => void
  onAddTextCertificate: (text: string) => void
  onAddSpecialization?: (text: string) => void
  onRemoveSpecialization?: (index: number) => void
  isUploading: boolean
}

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
      <WizardCard title="المعدات المصرح بتشغيلها *" subtitle="اختر كل المعدات المصرح لك بقيادتها ولديك خبرة بها">

        {errors.equipmentTypes ? (
          <Text style={s.inlineErrorTxt}>{errors.equipmentTypes}</Text>
        ) : null}

        <View style={s.equipChipsWrap}>
          {AVAILABLE_EQUIPMENT.map((eq) => {
            const isSel = formData.equipmentTypes.includes(eq.id)
            return (
              <WizardOptionChip
                key={eq.id}
                label={eq.label}
                icon={isSel ? 'checkmark-circle' : 'add-circle-outline'}
                selected={isSel}
                onPress={() => onToggleEquipment(eq.id)}
              />
            )
          })}
        </View>
      </WizardCard>

      {/* Certifications and licenses card */}
      <WizardCard title="الرخص والشهادات المهنية *" subtitle="أرفق صور رخص القيادة وشهادات السلامة أو اكتبها نصياً">

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
                    <Ionicons name="close" size={13} color={Colors.white} />
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
              glass
              placeholder="مثال: رخصة قيادة ثقيلة (عمان)"
              value={tempCert}
              onChangeText={setTempCert}
              maxLength={50}
              onSubmitEditing={handleAddCert}
              returnKeyType="done"
            />
          </View>
          <TouchableOpacity style={s.addBtn} onPress={handleAddCert} activeOpacity={0.8}>
            <Ionicons name="add" size={20} color={Colors.white} />
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
                  <Ionicons name="ribbon" size={13} color={Colors.warningText} style={{ marginEnd: 4 }} />
                  <Text style={s.certTagTxt}>{c}</Text>
                  <TouchableOpacity
                    onPress={() => onRemoveCertificate(i)}
                    style={s.removeTagBtn}
                    hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                  >
                    <Ionicons name="close-circle" size={15} color={Colors.warningText} />
                  </TouchableOpacity>
                </View>
              )
            })}
          </View>
        )}
      </WizardCard>

      {/* Specializations card */}
      <WizardCard title="التخصصات والمهارات الإضافية" subtitle="مهارات ميكانيكية، صيانة موقعية، تشغيل ليلي">

        <View style={s.addInputRow}>
          <View style={{ flex: 1 }}>
            <AppInput
              glass
              placeholder="مثال: حفر الخنادق العميقة"
              value={tempSpec}
              onChangeText={setTempSpec}
              maxLength={50}
              onSubmitEditing={handleAddSpec}
              returnKeyType="done"
            />
          </View>
          <TouchableOpacity style={s.addBtn} onPress={handleAddSpec} activeOpacity={0.8}>
            <Ionicons name="add" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {formData.specializations && formData.specializations.length > 0 && (
          <View style={s.tagsList}>
            {formData.specializations.map((sp, i) => (
              <View key={i} style={s.specTag}>
                <Ionicons name="checkmark-done" size={13} color={Colors.infoText} style={{ marginEnd: 4 }} />
                <Text style={s.specTagTxt}>{sp}</Text>
                <TouchableOpacity
                  onPress={() => onRemoveSpecialization?.(i)}
                  style={s.removeTagBtn}
                  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                >
                  <Ionicons name="close-circle" size={15} color={Colors.infoText} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </WizardCard>
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
    borderColor: Colors.slateBorder,
    gap: Spacing.space3,
    ...Platform.select({
      ios: { shadowColor: Colors.slateHeading, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1.5 },
    }),
  },
  cardTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 13.5,
    lineHeight: 19,
    color: Colors.slateHeading,
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
  uploadBox: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
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
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBoxTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 17,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  uploadBoxSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10.5,
    lineHeight: 14,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  uploadAddPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
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
    borderColor: Colors.slateBorder,
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
    backgroundColor: Colors.scrimSlate75,
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
    backgroundColor: Colors.amberSoftBg,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    borderRadius: Radius.pill,
    paddingStart: 8,
    paddingEnd: 6,
    paddingVertical: 5,
  },
  certTagTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.warningText,
    marginEnd: 4,
  },
  specTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.pill,
    paddingStart: 8,
    paddingEnd: 6,
    paddingVertical: 5,
  },
  specTagTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.text,
    marginEnd: 4,
  },
  removeTagBtn: {
    padding: 1,
  },
})
