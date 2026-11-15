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
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'
import { WizardCard } from '../ui/WizardCard'

export interface WizardImagesStepProps {
  images: any[]
  existingImages?: any[]
  errors: Record<string, string | undefined>
  isUploading?: boolean
  onPickImages: () => void
  onRemoveNewImage: (index: number) => void
  onRemoveExistingImage?: (idOrUrl: string) => void
  onMakePrimaryNew?: (index: number) => void
  onMakePrimaryExisting?: (index: number) => void
  maxImages?: number
  uploadTitle: string
  requiredBadge?: string
  existingSubtitle?: string
  uploadBoxTestID?: string
  errorTestID?: string
  removeTestIdStyle?: 'img' | 'image'
}

export function WizardImagesStep({
  images = [],
  existingImages = [],
  errors,
  isUploading = false,
  onPickImages,
  onRemoveNewImage,
  onRemoveExistingImage,
  onMakePrimaryNew,
  onMakePrimaryExisting,
  maxImages = 10,
  uploadTitle,
  requiredBadge,
  existingSubtitle,
  uploadBoxTestID = 'upload-action-box',
  errorTestID = 'error-images',
  removeTestIdStyle = 'img',
}: WizardImagesStepProps) {
  const totalCount = images.length + existingImages.length
  const removeExistingPrefix =
    removeTestIdStyle === 'image' ? 'remove-existing-image-' : 'remove-existing-img-'
  const removeNewPrefix =
    removeTestIdStyle === 'image' ? 'remove-new-image-' : 'remove-new-img-'

  return (
    <View style={s.stepWrap}>
      {/* Upload Action Box */}
      <TouchableOpacity
        testID={uploadBoxTestID}
        style={[s.uploadBox, errors.images ? s.uploadBoxError : null]}
        onPress={onPickImages}
        disabled={isUploading || totalCount >= maxImages}
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
                <Text style={s.uploadBoxTxt}>{uploadTitle}</Text>
                {requiredBadge ? (
                  <View style={s.requiredBadge}>
                    <Text style={s.requiredBadgeTxt}>{requiredBadge}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={s.uploadBoxSub}>
                {totalCount > 0
                  ? `تم اختيار ${totalCount} من ${maxImages} صور مسموحة`
                  : `يمكنك اختيار حتى ${maxImages} صورة (الصورة الأولى ستكون الرئيسية)`}
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
        <Text testID={errorTestID} style={s.inlineErrorTxt}>
          {errors.images}
        </Text>
      ) : null}

      {/* Existing Images (Edit Mode) */}
      {existingImages.length > 0 && (
        <WizardCard
          title={`الصور الحالية المرفوعة (${existingImages.length})`}
          subtitle={existingSubtitle}
        >
          <View style={s.imagesGrid}>
            {existingImages.map((img: any, idx: number) => {
              const uri = typeof img === 'string' ? img : img?.url || img?.uri || ''
              const idOrUrl = typeof img === 'string' ? img : img?.id || img?.url || ''
              const key = idOrUrl || `existing_${idx}`
              return (
                <View key={key} testID={`existing-img-${idx}`} style={s.imgThumbWrap}>
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
                  {onRemoveExistingImage && (
                    <TouchableOpacity
                      testID={`${removeExistingPrefix}${idx}`}
                      style={s.removeImgBtn}
                      onPress={() => onRemoveExistingImage(idOrUrl)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                  )}
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
            {images.map((img: any, idx: number) => {
              const uri = typeof img === 'string' ? img : img?.uri
              return (
                <View key={`new_${idx}`} testID={`new-img-${idx}`} style={s.imgThumbWrap}>
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
                    testID={`${removeNewPrefix}${idx}`}
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
    borderRadius: Radius.sm,
  },
  requiredBadgeTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10,
    lineHeight: 14,
    color: Colors.error,
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
    lineHeight: 16,
    color: Colors.primary,
    fontWeight: '700',
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
    lineHeight: 14,
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
    lineHeight: 12,
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
