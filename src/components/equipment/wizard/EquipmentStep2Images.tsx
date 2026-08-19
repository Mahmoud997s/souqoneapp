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
import { CardSystem } from '../../../constants/cardSystem'
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
        <View style={s.cardSection}>
          <Text style={s.cardTitle}>الصور الحالية المرفوعة ({existingImages.length})</Text>
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
        </View>
      )}

      {/* New Images */}
      {images.length > 0 && (
        <View style={s.cardSection}>
          <Text style={s.cardTitle}>الصور الجديدة المضافة ({images.length})</Text>
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
        </View>
      )}
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
    backgroundColor: '#DBEAFE',
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
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
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
    fontSize: 13,
    lineHeight: 18,
    color: '#0F172A',
    textAlign: 'left',
    writingDirection: 'rtl',
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
