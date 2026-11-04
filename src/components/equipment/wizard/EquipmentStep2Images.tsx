import React from 'react'
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
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { WizardCard } from '../../ui/WizardCard'
import { EquipmentStep2Props } from '../../../types/equipmentForm.types'

export function EquipmentStep2Images({
  images,
  existingImages,
  errors,
  isUploading,
  onPickImages,
  onRemoveNewImage,
  onRemoveExistingImage,
}: EquipmentStep2Props) {
  const totalCount = images.length + existingImages.length

  return (
    <View style={s.stepWrap}>
      {/* Upload Action Box */}
      <TouchableOpacity
        style={s.uploadBox}
        onPress={onPickImages}
        disabled={isUploading || totalCount >= 10}
        activeOpacity={0.8}
      >
        {isUploading ? (
          <View style={s.uploadLoadingWrap}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={s.uploadBoxTxt}>جاري معالجة الصور المختارة...</Text>
          </View>
        ) : (
          <View style={s.uploadContent}>
            <View style={s.uploadIconCircle}>
              <Ionicons name="camera" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.uploadBoxTxt}>إرفاق صور واضحة للمعدة</Text>
              <Text style={s.uploadBoxSub}>
                {totalCount > 0
                  ? `تم اختيار ${totalCount} من 10 صور مسموحة`
                  : 'يمكنك اختيار حتى 10 صور (الصورة الأولى ستكون الصورة الرئيسية)'}
              </Text>
            </View>
            <View style={s.uploadAddPill}>
              <Ionicons name="add" size={16} color={Colors.primary} />
              <Text style={s.uploadAddPillTxt}>اختيار</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {errors.images ? <Text style={s.inlineErrorTxt}>{errors.images}</Text> : null}

      {/* Existing Images (Edit Mode) */}
      {existingImages.length > 0 && (
        <WizardCard
          title={`الصور الحالية المرفوعة (${existingImages.length})`}
          subtitle="يمكنك حذف أي صورة غير مناسبة بالضغط على علامة الإغلاق"
        >
          <View style={s.imagesGrid}>
            {existingImages.map((img: any, idx: number) => {
              const uri = typeof img === 'string' ? img : img.url
              const key = img.id || img.url || `existing_${idx}`
              return (
                <View key={key} style={s.imgThumbWrap}>
                  <Image source={{ uri }} style={s.imgThumb} contentFit="cover" transition={200} />
                  {idx === 0 && (
                    <View style={s.primaryBadge}>
                      <Text style={s.primaryBadgeTxt}>الرئيسية</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={s.removeImgBtn}
                    onPress={() => onRemoveExistingImage(img.id || img.url)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Ionicons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              )
            })}
          </View>
        </WizardCard>
      )}

      {/* New Images */}
      {images.length > 0 && (
        <WizardCard
          title={`الصور الجديدة المضافة (${images.length})`}
          subtitle="الصورة الأولى ستكون الغلاف الأساسي لإعلانك"
        >
          <View style={s.imagesGrid}>
            {images.map((img, idx) => {
              const uri = typeof img === 'string' ? img : img.uri
              return (
                <View key={`new_${idx}`} style={s.imgThumbWrap}>
                  <Image source={{ uri }} style={s.imgThumb} contentFit="cover" transition={200} />
                  {existingImages.length === 0 && idx === 0 && (
                    <View style={s.primaryBadge}>
                      <Text style={s.primaryBadgeTxt}>الرئيسية</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={s.removeImgBtn}
                    onPress={() => onRemoveNewImage(idx)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Ionicons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              )
            })}
          </View>
        </WizardCard>
      )}

      {/* Guidelines Box */}
      <WizardCard
        title="إرشادات الصور الناجحة"
        subtitle="نصائح لزيادة المشاهدات والتفاعل مع إعلانك"
      >
        <View style={s.guidelinesRow}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#059669" />
          <Text style={s.guidelineTxt}>التقط صوراً من زوايا متعددة تظهر هيكل المعدة بالكامل</Text>
        </View>
        <View style={s.guidelinesRow}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#059669" />
          <Text style={s.guidelineTxt}>أظهر لوحة ساعات التشغيل ولوحة البيانات الفنية بوضوح</Text>
        </View>
        <View style={s.guidelinesRow}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#059669" />
          <Text style={s.guidelineTxt}>تأكد من وضوح الإضاءة وتجنب الصور الضبابية أو ذات العلامات المائية</Text>
        </View>
      </WizardCard>
    </View>
  )
}

const s = StyleSheet.create({
  stepWrap: {
    gap: Spacing.space3,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    backgroundColor: '#F0F7FF',
    padding: Spacing.space4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadLoadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  uploadBoxTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: '#0F172A',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  uploadBoxSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  uploadAddPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  uploadAddPillTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    color: Colors.primary,
  },
  inlineErrorTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.error,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: -4,
  },
  guidelinesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
  },
  guidelineTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#475569',
    textAlign: 'left',
    writingDirection: 'rtl',
    flex: 1,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imgThumbWrap: {
    width: 78,
    height: 78,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    position: 'relative',
  },
  imgThumb: {
    width: '100%',
    height: '100%',
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 3,
    start: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  primaryBadgeTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 8.5,
    color: '#FFFFFF',
  },
  removeImgBtn: {
    position: 'absolute',
    top: 3,
    end: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
