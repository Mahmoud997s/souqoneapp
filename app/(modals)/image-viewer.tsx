import { View, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../src/constants/colors'
import { useState } from 'react'

export default function ImageViewerModal() {
  const { width, height } = useWindowDimensions()
  const { url, urls, index } = useLocalSearchParams()
  const [currentIndex, setCurrentIndex] = useState(index ? parseInt(index as string, 10) : 0)
  
  const images = urls ? (urls as string).split(',') : (url ? [url as string] : [])

  if (!images.length) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="إغلاق">
          <Ionicons name="close" size={32} color={Colors.white} />
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="إغلاق">
        <Ionicons name="close" size={32} color={Colors.white} />
      </TouchableOpacity>
      
      <Image 
        source={{ uri: images[currentIndex] }} 
        style={{ width, height: height * 0.7 }} 
        contentFit="contain" 
      />
      
      {images.length > 1 && (
        <View style={styles.navRow}>
          <TouchableOpacity 
            disabled={currentIndex === 0} 
            onPress={() => setCurrentIndex(c => c - 1)}
            accessibilityRole="button"
            accessibilityLabel="الصورة السابقة"
          >
            <Ionicons name="chevron-back" size={40} color={currentIndex === 0 ? Colors.textMuted : Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity 
            disabled={currentIndex === images.length - 1} 
            onPress={() => setCurrentIndex(c => c + 1)}
            accessibilityRole="button"
            accessibilityLabel="الصورة التالية"
          >
            <Ionicons name="chevron-forward" size={40} color={currentIndex === images.length - 1 ? Colors.textMuted : Colors.white} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  closeBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8 },
  navRow: { position: 'absolute', bottom: 50, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 40 },
})
