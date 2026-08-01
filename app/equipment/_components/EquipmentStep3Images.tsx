import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../src/constants/colors'
import { Radius } from '../../../src/constants/radius'
import { Spacing } from '../../../src/constants/spacing'
import { useEquipmentStore } from '../../../src/store/equipmentPostStore'
import { dialogService } from '../../../src/store/dialogStore'

export function EquipmentStep3Images() {
  const { listingType, images, existingImages, errors, set } = useEquipmentStore()

  if (listingType === 'EQUIPMENT_WANTED') {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', paddingTop: 60 }]}>
        <Ionicons name="images-outline" size={64} color={Colors.border} />
        <Text style={[styles.sectionTitle, { marginTop: 16, textAlign: 'center' }]}>
          لا يلزم إرفاق صور لطلبات (مطلوب)
        </Text>
        <Text style={{ fontFamily: 'Almarai_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 8 }}>
          يمكنك تخطي هذه الخطوة والمتابعة مباشرة
        </Text>
      </View>
    )
  }

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      dialogService.alert('تنبيه', 'نحتاج إلى صلاحية الوصول للصور لإضافة صور الإعلان.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.8,
    })

    if (!result.canceled && result.assets) {
      const newImages = [...images, ...result.assets]
      if (newImages.length > 10) {
        dialogService.alert('تنبيه', 'الحد الأقصى هو 10 صور فقط')
        set({ images: newImages.slice(0, 10) })
      } else {
        set({ images: newImages })
      }
    }
  }

  const removeImage = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    set({ images: newImages })
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>صور المعدة *</Text>
      <Text style={styles.subtitle}>الحد الأقصى 10 صور (يجب إرفاق صورة واحدة على الأقل)</Text>

      <TouchableOpacity style={styles.uploadBtn} onPress={pickImage} activeOpacity={0.8}>
        <Ionicons name="cloud-upload-outline" size={32} color={Colors.primary} />
        <Text style={styles.uploadText}>اضغط هنا لاختيار الصور من المعرض</Text>
      </TouchableOpacity>
      {errors.images ? <Text style={styles.errorText}>{errors.images}</Text> : null}

      <View style={styles.imageGrid}>
        {existingImages && existingImages.map((img: any, index: number) => (
          <View key={`ex-${index}`} style={styles.imageWrap}>
            <Image source={{ uri: img.url || img.uri }} style={styles.image} />
            <TouchableOpacity style={styles.removeBtn} onPress={() => {
               // To remove existing images, we typically track them in `removedImageIds`
               // but for now we just show them or handle deletion properly.
               // Assuming logic for removing existing images exists elsewhere or here.
            }}>
              <Ionicons name="close" size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>
        ))}
        {images.map((img: any, index: number) => (
          <View key={`new-${index}`} style={styles.imageWrap}>
            <Image source={{ uri: img.uri }} style={styles.image} />
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
              <Ionicons name="close" size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  errorText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: '#ef4444',
    marginTop: 8,
    marginHorizontal: 4,
    textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    color: Colors.text,
    writingDirection: 'rtl',
  },
  subtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    marginBottom: 16,
    marginTop: 4,
  },
  uploadBtn: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    padding: Spacing.space6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    marginBottom: Spacing.space4,
  },
  uploadText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: Colors.primary,
    marginTop: 12,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageWrap: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.border,
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
