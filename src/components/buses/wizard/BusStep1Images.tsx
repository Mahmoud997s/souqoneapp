import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { dialogService } from '../../../store/dialogStore';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../../constants/colors';
import { Radius } from '../../../constants/radius';
import { Spacing } from '../../../constants/spacing';
import { useBusWizardStore } from '../../../store/busWizardStore';
import { uploadsApi } from '../../../api/uploads';

const MAX_IMAGES = 10;

export function BusStep1Images() {
  const { data, setData } = useBusWizardStore();
  const [uploading, setUploading] = useState(false);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      dialogService.alert('الإذن مطلوب', 'يرجى السماح بالوصول إلى مكتبة الصور', 'warning');
      return;
    }

    const currentTotal = data.existingImages.length + data.images.length;
    if (currentTotal >= MAX_IMAGES) {
      dialogService.alert('الحد الأقصى', `لا يمكنك إضافة أكثر من ${MAX_IMAGES} صور`, 'warning');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: MAX_IMAGES - currentTotal,
    });

    if (result.canceled || !result.assets?.length) return;

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const asset of result.assets) {
        const formData = new FormData();
        formData.append('file', {
          uri: asset.uri,
          type: asset.mimeType ?? 'image/jpeg',
          name: asset.fileName ?? 'photo.jpg',
        } as any);
        const res = await uploadsApi.single(formData);
        const url = (res.data as any)?.url ?? (res.data as any)?.path;
        if (url) uploaded.push(url);
      }
      setData({ images: [...data.images, ...uploaded] });
    } catch {
      dialogService.alert('خطأ', 'فشل رفع الصور، يرجى المحاولة مجدداً', 'error');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    if (index < data.existingImages.length) {
      const removedImg = data.existingImages[index];
      setData({ 
        existingImages: data.existingImages.filter((_, i) => i !== index),
        removedImageIds: [...data.removedImageIds, removedImg.id]
      });
    } else {
      const newIndex = index - data.existingImages.length;
      setData({ images: data.images.filter((_, i) => i !== newIndex) });
    }
  };

  const allDisplayImages = [
    ...data.existingImages.map(img => img.url),
    ...data.images
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.pageDesc}>أضف صوراً واضحة للحافلة من الداخل والخارج لزيادة فرص التواصل معك.</Text>

      {allDisplayImages.length === 0 ? (
        <TouchableOpacity
          style={[styles.heroUploadBtn, uploading && styles.uploadBtnDisabled]}
          onPress={pickImages}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color={Colors.primary} size="large" />
          ) : (
            <>
              <View style={styles.heroIconWrap}>
                <Ionicons name="images" size={48} color={Colors.primary} />
              </View>
              <Text style={styles.heroUploadTitle}>انقر هنا لإضافة الصور</Text>
              <Text style={styles.heroUploadSub}>يمكنك إضافة حتى {MAX_IMAGES} صور كحد أقصى</Text>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.imagesContainer}>
          <View style={styles.thumbnailGrid}>
            {allDisplayImages.map((uri, index) => (
              <View key={index} style={styles.thumbWrap}>
                <Image source={{ uri }} style={styles.thumbImage} contentFit="cover" />
                <TouchableOpacity style={styles.glassRemoveBtnSmall} onPress={() => removeImage(index)}>
                  <Ionicons name="trash" size={14} color="#FFF" />
                </TouchableOpacity>
              </View>
            ))}
            {allDisplayImages.length < MAX_IMAGES && (
              <TouchableOpacity
                style={[styles.addThumbBtn, uploading && styles.uploadBtnDisabled]}
                onPress={pickImages}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <>
                    <Ionicons name="add" size={32} color={Colors.primary} />
                    <Text style={styles.addThumbTxt}>أضف المزيد</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
      <View style={{ height: 40 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 16 },
  pageDesc: { fontFamily: 'Almarai_400Regular', fontSize: 14, color: Colors.text2, textAlign: 'center', marginBottom: Spacing.space5, lineHeight: 28 },
  
  heroUploadBtn: { backgroundColor: '#F8FAFC', borderWidth: 2, borderColor: '#CBD5E1', borderStyle: 'dashed', borderRadius: 24, padding: Spacing.space6, alignItems: 'center', justifyContent: 'center', minHeight: 220 },
  heroIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.space3 },
  heroUploadTitle: { fontFamily: 'Almarai_700Bold', fontSize: 18, color: Colors.text, marginBottom: Spacing.space1 },
  heroUploadSub: { fontFamily: 'Almarai_400Regular', fontSize: 13, color: Colors.textMuted },
  uploadBtnDisabled: { opacity: 0.6 },
  imagesContainer: { gap: Spacing.space4 },
  thumbnailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  thumbWrap: { width: '31%', aspectRatio: 1, borderRadius: Radius.xl, overflow: 'hidden', backgroundColor: '#E2E8F0', position: 'relative' },
  thumbImage: { width: '100%', height: '100%' },
  glassRemoveBtnSmall: { position: 'absolute', top: 6, end: 6, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  addThumbBtn: { width: '31%', aspectRatio: 1, backgroundColor: '#F8FAFC', borderRadius: Radius.xl, borderWidth: 1, borderColor: '#CBD5E1', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  addThumbTxt: { fontFamily: 'Almarai_700Bold', fontSize: 11, color: Colors.primary, marginTop: 4 },
});
