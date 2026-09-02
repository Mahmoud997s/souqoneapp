import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { WizardCard } from '../../ui/WizardCard'
import { ServiceStep2Props } from '../../../types/serviceForm.types'
import { MAX_SERVICE_IMAGES } from '../../../constants/services'

export function ServiceStep2Images({
  images,
  existingImages,
  errors,
  isUploading = false,
  onPickImages,
  onRemoveNewImage,
  onRemoveExistingImage,
  onMakePrimaryNew,
  onMakePrimaryExisting,
}: ServiceStep2Props) {
  const totalCount = images.length + existingImages.length

  return (
    <View style={s.stepWrap}>
      {/* Upload Action Box */}
      <TouchableOpacity
        testID="upload-box"
        style={[s.uploadBox, errors.images ? s.uploadBoxError : null]}
        onPress={onPickImages}
        disabled={isUploading || totalCount >= MAX_SERVICE_IMAGES}
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
              <View style={s.titleRow}>
                <Text style={s.uploadBoxTxt}>إرفاق صور واضحة للخدمة أو الورشة</Text>
                <View style={s.requiredBadge}>
                  <Text style={s.requiredBadgeTxt}>مطلوب</Text>
                </View>
              </View>
              <Text style={s.uploadBoxSub}>
                {totalCount > 0
                  ? `تم اختيار ${totalCount} من ${MAX_SERVICE_IMAGES} صور مسموحة`
                  : `صورة واحدة على الأقل مطلوبة – يمكنك اختيار حتى ${MAX_SERVICE_IMAGES} صور (الصورة الأولى ستكون الرئيسية)`}
              </Text>
            </View>
            <View style={s.uploadAddPill}>
              <Ionicons name="add" size={16} color={Colors.primary} />
              <Text style={s.uploadAddPillTxt}>اختيار</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {errors.images ? (
        <Text style={s.inlineErrorTxt} testID="error-images">
          {errors.images}
        </Text>
      ) : null}

      {/* Existing Images (Edit Mode) */}
      {existingImages.length > 0 && (
        <WizardCard title={`الصور الحالية المرفوعة (${existingImages.length})`}>
          <View style={s.imagesGrid}>
            {existingImages.map((img, idx) => {
              const uri = img.url
              const key = img.id || img.url || `existing_${idx}`
              return (
                <View key={key} style={s.imgThumbWrap} testID={`existing-image-wrap-${idx}`}>
                  <Image source={{ uri }} style={s.imgThumb} contentFit="cover" transition={200} />
                  {idx === 0 ? (
                    <View style={s.primaryBadge}>
                      <Text style={s.primaryBadgeTxt}>الرئيسية</Text>
                    </View>
                  ) : (
                    onMakePrimaryExisting && (
                      <TouchableOpacity
                        testID={`make-primary-existing-${idx}`}
                        style={s.makePrimaryBtn}
                        onPress={() => onMakePrimaryExisting(idx)}
                        activeOpacity={0.8}
                      >
                        <Text style={s.makePrimaryTxt}>تعيين كرئيسية</Text>
                      </TouchableOpacity>
                    )
                  )}
                  <TouchableOpacity
                    testID={`remove-existing-image-${idx}`}
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
        <WizardCard title={`الصور الجديدة المضافة (${images.length})`}>
          <View style={s.imagesGrid}>
            {images.map((img, idx) => {
              const uri = img.uri
              return (
                <View key={`new_${idx}`} style={s.imgThumbWrap} testID={`new-image-wrap-${idx}`}>
                  <Image source={{ uri }} style={s.imgThumb} contentFit="cover" transition={200} />
                  {existingImages.length === 0 && idx === 0 ? (
                    <View style={s.primaryBadge}>
                      <Text style={s.primaryBadgeTxt}>الرئيسية</Text>
                    </View>
                  ) : (
                    onMakePrimaryNew && (
                      <TouchableOpacity
                        testID={`make-primary-new-${idx}`}
                        style={s.makePrimaryBtn}
                        onPress={() => onMakePrimaryNew(idx)}
                        activeOpacity={0.8}
                      >
                        <Text style={s.makePrimaryTxt}>تعيين كرئيسية</Text>
                      </TouchableOpacity>
                    )
                  )}
                  <TouchableOpacity
                    testID={`remove-new-image-${idx}`}
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
  uploadBoxError: {
    borderColor: Colors.error,
    backgroundColor: '#FEF2F2',
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  uploadBoxTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: '#0F172A',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  requiredBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  requiredBadgeTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 9.5,
    lineHeight: 13,
    color: '#DC2626',
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
  makePrimaryBtn: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  makePrimaryTxt: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Almarai_700Bold',
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
