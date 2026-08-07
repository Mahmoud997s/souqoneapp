import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { router } from 'expo-router'
import { usePostStore } from '../../src/store/postStore'
import { uploadsApi } from '../../src/api/uploads'
import { LinearGradient } from 'expo-linear-gradient'
import { AppButton } from '../../src/components/ui/AppButton'
import { Stepper } from '../../src/components/ui/Stepper'
import { dialogService } from '../../src/store/dialogStore'

const MAX_IMAGES = 10

const SKIP_IMAGES_CATEGORIES = ['transport']

export default function PostStep2Screen() {
  const insets = useSafeAreaInsets()
  const { images, existingImages = [], removedImageIds = [], category, set } = usePostStore()
  const [uploading, setUploading] = useState(false)

  // Skip images step for transport
  React.useEffect(() => {
    if (SKIP_IMAGES_CATEGORIES.includes(category)) {
      router.replace('/post/step3')
    }
  }, [category])

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      dialogService.alert('الإذن مطلوب', 'يرجى السماح بالوصول إلى مكتبة الصور')
      return
    }

    const currentTotal = existingImages.length + images.length
    if (currentTotal >= MAX_IMAGES) {
      dialogService.alert('الحد الأقصى', `لا يمكنك إضافة أكثر من ${MAX_IMAGES} صور`)
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: MAX_IMAGES - currentTotal,
    })

    if (result.canceled || !result.assets?.length) return

    setUploading(true)
    try {
      const uploaded: string[] = []
      for (const asset of result.assets) {
        const formData = new FormData()
        formData.append('file', {
          uri: asset.uri,
          type: asset.mimeType ?? 'image/jpeg',
          name: asset.fileName ?? 'photo.jpg',
        } as any)
        const res = await uploadsApi.single(formData)
        const url = (res.data as any)?.url ?? (res.data as any)?.path
        if (url) uploaded.push(url)
      }
      set({ images: [...images, ...uploaded] })
    } catch {
      dialogService.alert('خطأ', 'فشل رفع الصور، يرجى المحاولة مجدداً')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    if (index < existingImages.length) {
      // Removing an existing image
      const removedImg = existingImages[index]
      set({ 
        existingImages: existingImages.filter((_, i) => i !== index),
        removedImageIds: [...removedImageIds, removedImg.id]
      })
    } else {
      // Removing a new image
      const newIndex = index - existingImages.length
      set({ images: images.filter((_, i) => i !== newIndex) })
    }
  }

  const makeMain = (index: number) => {
    if (index === 0) return
    if (index < existingImages.length) {
       // Moving existing image to front
       const newExisting = [...existingImages]
       const temp = newExisting[0]
       newExisting[0] = newExisting[index]
       newExisting[index] = temp
       set({ existingImages: newExisting })
    } else {
       // Moving new image to front is complex when mixed. Let's just swap it to the front of images array
       // and if there are existing images, maybe we can't easily make it main unless we move it to existingImages.
       // For simplicity, just swap within new images if no existing images, or alert.
       if (existingImages.length === 0) {
         const newImages = [...images]
         const temp = newImages[0]
         newImages[0] = newImages[index]
         newImages[index] = temp
         set({ images: newImages })
       } else {
         dialogService.alert('تنبيه', 'لا يمكن تعيين صورة جديدة كصورة رئيسية أثناء التعديل حالياً إلا بعد الحفظ')
       }
    }
  }

  const allDisplayImages = [
    ...existingImages.map(img => img.url),
    ...images
  ]

  return (
    <View style={s.root}>
      <AppHeader title="إضافة إعلان" showBack />

      <ScrollView 
        contentContainerStyle={s.content} 
        showsVerticalScrollIndicator={false}
      >
        <View style={s.centerWrap}>
          <View style={s.progressWrap}>
            <Stepper currentStep={2} totalSteps={5} title="أضف صور الإعلان" />
          </View>

          <View style={s.headerBox}>
            <Text style={s.title}>أضف صور الإعلان</Text>
            <View style={s.infoBox}>
              <View style={s.iconCircle}>
                <Ionicons name="camera" size={20} color={Colors.primary} />
              </View>
              <Text style={s.infoTxt}>
                أضف صوراً واضحة تزيد فرص البيع (حتى {MAX_IMAGES} صور).
              </Text>
            </View>
          </View>

          {allDisplayImages.length === 0 ? (
            <TouchableOpacity
              style={[s.heroUploadBtn, uploading && s.uploadBtnDisabled]}
              onPress={pickImages}
              disabled={uploading}
              activeOpacity={0.8}
            >
              {uploading ? (
                <ActivityIndicator color={Colors.primary} size="large" />
              ) : (
                <>
                  <View style={s.heroIconWrap}>
                    <Ionicons name="images" size={42} color={Colors.primary} />
                  </View>
                  <Text style={s.heroUploadTitle}>انقر هنا لإضافة الصور</Text>
                  <Text style={s.heroUploadSub}>يمكنك إضافة حتى {MAX_IMAGES} صور كحد أقصى</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={s.imagesContainer}>
              {/* Main Image */}
              <View style={s.mainImageWrap}>
                <Image source={{ uri: allDisplayImages[0] }} style={s.mainImage} contentFit="cover" />
                <View style={s.mainBadgeOverlay}>
                  <Ionicons name="star" size={14} color="#FFF" />
                  <Text style={s.mainBadgeTxt}>الصورة الرئيسية</Text>
                </View>
                <TouchableOpacity style={s.glassRemoveBtn} onPress={() => removeImage(0)} activeOpacity={0.7}>
                  <Ionicons name="trash" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>

              {/* Thumbnails Grid */}
              <View style={s.thumbnailGrid}>
                {allDisplayImages.slice(1).map((uri, index) => {
                  const realIndex = index + 1
                  return (
                    <View key={realIndex} style={s.thumbWrap}>
                      <Image source={{ uri }} style={s.thumbImage} contentFit="cover" />
                      
                      <TouchableOpacity style={s.glassMainBtnSmall} onPress={() => makeMain(realIndex)} activeOpacity={0.7}>
                        <Ionicons name="star" size={12} color="#FFF" />
                      </TouchableOpacity>

                      <TouchableOpacity style={s.glassRemoveBtnSmall} onPress={() => removeImage(realIndex)} activeOpacity={0.7}>
                        <Ionicons name="trash" size={14} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  )
                })}

                {allDisplayImages.length < MAX_IMAGES && (
                  <TouchableOpacity
                    style={[s.addThumbBtn, uploading && s.uploadBtnDisabled]}
                    onPress={pickImages}
                    disabled={uploading}
                    activeOpacity={0.8}
                  >
                    {uploading ? (
                      <ActivityIndicator color={Colors.primary} />
                    ) : (
                      <>
                        <Ionicons name="add" size={30} color={Colors.primary} />
                        <Text style={s.addThumbTxt}>أضف المزيد</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[s.bottomBarWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={s.bottomBarContent}>
          <AppButton 
            variant="outline" 
            size="sm"
            title="السابق" 
            onPress={() => router.back()} 
            style={{ flex: 1 }} 
          />
          <AppButton 
            title="التالي" 
            size="sm"
            onPress={() => {
              if (allDisplayImages.length === 0 && !SKIP_IMAGES_CATEGORIES.includes(category)) {
                dialogService.alert('تنبيه', 'يرجى إضافة صورة واحدة على الأقل للإعلان')
                return
              }
              router.push('/post/step3')
            }} 
            style={{ flex: 1 }} 
          />
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { 
    paddingHorizontal: Spacing.space3, 
    paddingTop: Spacing.space3, 
    paddingBottom: 90,
  },
  centerWrap: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  progressWrap: { marginBottom: Spacing.space3 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.space2 },
  progressStepTxt: { fontFamily: 'Almarai_700Bold', fontSize: 12, color: Colors.primary },
  progressTitle: { fontFamily: 'Almarai_700Bold', fontSize: 12, color: Colors.textMuted },
  progressBarBg: { height: 10, backgroundColor: Colors.surface, borderRadius: 100, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 100 },
  headerBox: { marginBottom: Spacing.space5 },
  title: { fontFamily: 'Almarai_800ExtraBold', fontSize: 20, color: Colors.text, writingDirection: 'rtl', textAlign: 'left', marginBottom: Spacing.space3 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: Spacing.space4,
    borderRadius: Radius.xl,
    gap: Spacing.space3,
  },
  iconCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center'
  },
  infoTxt: { flex: 1, fontFamily: 'Almarai_400Regular', fontSize: 13, color: '#1E3A8A', writingDirection: 'rtl', textAlign: 'left', lineHeight: 20 },
  
  heroUploadBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2, borderColor: '#CBD5E1', borderStyle: 'dashed',
    borderRadius: 24,
    padding: Spacing.space6,
    alignItems: 'center', justifyContent: 'center',
    minHeight: 220,
  },
  heroIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.space3,
  },
  heroUploadTitle: { fontFamily: 'Almarai_700Bold', fontSize: 18, color: Colors.text, writingDirection: 'rtl', textAlign: 'center', marginBottom: Spacing.space1 },
  heroUploadSub: { fontFamily: 'Almarai_400Regular', fontSize: 13, color: Colors.textMuted, writingDirection: 'rtl', textAlign: 'center' },
  uploadBtnDisabled: { opacity: 0.6 },
  
  imagesContainer: { gap: Spacing.space4 },
  
  mainImageWrap: {
    width: '100%', aspectRatio: 16/10,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    position: 'relative',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 24 },
      android: { elevation: 8 },
    }),
  },
  mainImage: { width: '100%', height: '100%' },
  mainBadgeOverlay: {
    position: 'absolute', bottom: 12, start: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 100,
  },
  mainBadgeTxt: { fontFamily: 'Almarai_700Bold', fontSize: 12, color: '#FFF', writingDirection: 'rtl' },
  glassRemoveBtn: {
    position: 'absolute', top: 12, end: 12,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  
  thumbnailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  thumbWrap: {
    width: '31%', aspectRatio: 1,
    borderRadius: Radius.xl, overflow: 'hidden',
    backgroundColor: '#E2E8F0', position: 'relative',
  },
  thumbImage: { width: '100%', height: '100%' },
  glassRemoveBtnSmall: {
    position: 'absolute', top: 6, end: 6,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  glassMainBtnSmall: {
    position: 'absolute', bottom: 6, start: 6,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  
  addThumbBtn: {
    width: '31%', aspectRatio: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.xl,
    borderWidth: 1, borderColor: '#CBD5E1', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  addThumbTxt: { fontFamily: 'Almarai_700Bold', fontSize: 11, color: Colors.primary, writingDirection: 'rtl', marginTop: 4 },
  bottomBarWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.04, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  bottomBarContent: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: Spacing.space3,
    paddingHorizontal: Spacing.space4,
  },
})
